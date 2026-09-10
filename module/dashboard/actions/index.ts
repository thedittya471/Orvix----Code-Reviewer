"use server"

import prisma from "@/lib/db"
import { getCurrentSession } from "@/lib/session"
import {
    classifyGithubError,
    fetchContributionCalendar,
    fetchPullRequestDates,
    fetchViewerTotals,
    getGithubToken
} from "@/module/github/lib/github"

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

export type DashboardError = "github_auth" | "unknown"

export type DashboardStats = {
    error?: DashboardError
    totalCommits: number
    totalPRs: number
    totalReviews: number
    totalRepos: number
}

export type MonthlyActivity = {
    month: string
    commits: number
    prs: number
    reviews: number
}

export type MonthlyActivityResult = {
    error?: DashboardError
    months: MonthlyActivity[]
}

export type ContributionCalendarResult = {
    error?: DashboardError
    totalContributions: number
    days: { date: string; count: number }[]
}

const classify = classifyGithubError

async function requireGithub() {
    const session = await getCurrentSession()

    if (!session?.user) {
        throw new Error("Unauthorized")
    }

    return { userId: session.user.id, token: await getGithubToken() }
}

function sixMonthWindowStart(now: Date) {
    return new Date(now.getFullYear(), now.getMonth() - 5, 1)
}

function monthKey(date: Date) {
    return `${date.getFullYear()}-${date.getMonth()}`
}

export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        const { userId, token } = await requireGithub()

        const [totals, totalRepos, totalReviews] = await Promise.all([
            fetchViewerTotals(token, userId),
            prisma.repository.count({ where: { userId } }),
            prisma.review.count({
                where: {
                    repository: { userId },
                    status: "completed"
                }
            })
        ])

        return {
            totalCommits: totals.totalContributions,
            totalPRs: totals.totalPullRequestContributions,
            totalReviews,
            totalRepos
        }
    } catch (error) {
        console.error("Error fetching dashboard stats:", error)
        return {
            error: classify(error),
            totalCommits: 0,
            totalPRs: 0,
            totalReviews: 0,
            totalRepos: 0
        }
    }
}

export async function getContributionCalendar(): Promise<ContributionCalendarResult> {
    try {
        const { userId, token } = await requireGithub()
        const calendar = await fetchContributionCalendar(token, userId)

        return { totalContributions: calendar.totalContributions, days: calendar.days }
    } catch (error) {
        console.error("Error fetching contribution calendar:", error)
        return { error: classify(error), totalContributions: 0, days: [] }
    }
}

export async function getMonthlyActivity(): Promise<MonthlyActivityResult> {
    try {
        const { userId, token } = await requireGithub()

        const now = new Date()
        const windowStart = sixMonthWindowStart(now)

        const [calendar, pullRequestDates, reviews] = await Promise.all([
            fetchContributionCalendar(token, userId),
            fetchPullRequestDates(token, userId),
            prisma.review.findMany({
                where: {
                    repository: { userId },
                    status: "completed",
                    createdAt: { gte: windowStart }
                },
                select: { createdAt: true }
            })
        ])

        const monthlyData = new Map<string, MonthlyActivity>()

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1)

            monthlyData.set(monthKey(date), {
                month: MONTH_NAMES[date.getMonth()],
                commits: 0,
                prs: 0,
                reviews: 0
            })
        }

        calendar.days.forEach((day) => {
            const bucket = monthlyData.get(monthKey(new Date(day.date)))

            if (bucket) {
                bucket.commits += day.count
            }
        })

        pullRequestDates.forEach((createdAt) => {
            const bucket = monthlyData.get(monthKey(new Date(createdAt)))

            if (bucket) {
                bucket.prs += 1
            }
        })

        reviews.forEach((review) => {
            const bucket = monthlyData.get(monthKey(review.createdAt))

            if (bucket) {
                bucket.reviews += 1
            }
        })

        return { months: [...monthlyData.values()] }
    } catch (error) {
        console.error("Error fetching monthly activity:", error)
        return { error: classify(error), months: [] }
    }
}

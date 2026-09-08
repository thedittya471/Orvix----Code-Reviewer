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

/** Every action needs the same two things before it can talk to GitHub. */
async function requireGithub() {
    const session = await getCurrentSession()

    if (!session?.user) {
        throw new Error("Unauthorized")
    }

    return { userId: session.user.id, token: await getGithubToken() }
}

// TODO: replace with real AI reviews once they are persisted.
const generateSampleReviews = () => {
    const sampleReviews: { createdAt: Date }[] = []
    const now = new Date()

    // Generate random reviews over the past 6 months
    for (let i = 0; i < 45; i++) {
        const randomDaysAgo = Math.floor(Math.random() * 180) // Random day in last 6 months
        const reviewDate = new Date(now)
        reviewDate.setDate(reviewDate.getDate() - randomDaysAgo)

        sampleReviews.push({ createdAt: reviewDate })
    }

    return sampleReviews
}

/** The light query — this is what lets the stat tiles paint first. */
export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        const { userId, token } = await requireGithub()

        const [totals, totalRepos] = await Promise.all([
            fetchViewerTotals(token, userId),
            prisma.repository.count({ where: { userId } })
        ])

        return {
            totalCommits: totals.totalContributions,
            totalPRs: totals.totalPullRequestContributions,
            // TODO: count ai reviews from database
            totalReviews: 87,
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

        // Shares fetchContributionCalendar with the heatmap action; whichever
        // resolves second reads it from the cache rather than GitHub.
        const [calendar, pullRequestDates] = await Promise.all([
            fetchContributionCalendar(token, userId),
            fetchPullRequestDates(token, userId)
        ])

        const monthlyData: {
            [key: string]: { commits: number; prs: number; reviews: number }
        } = {}

        // Initialize last 6 months data, current month included
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
            monthlyData[MONTH_NAMES[date.getMonth()]] = { commits: 0, prs: 0, reviews: 0 }
        }

        calendar.days.forEach((day) => {
            const monthKey = MONTH_NAMES[new Date(day.date).getMonth()]

            if (monthlyData[monthKey]) {
                monthlyData[monthKey].commits += day.count
            }
        })

        pullRequestDates.forEach((createdAt) => {
            const monthKey = MONTH_NAMES[new Date(createdAt).getMonth()]

            if (monthlyData[monthKey]) {
                monthlyData[monthKey].prs += 1
            }
        })

        generateSampleReviews().forEach((review) => {
            const monthKey = MONTH_NAMES[review.createdAt.getMonth()]

            if (monthlyData[monthKey]) {
                monthlyData[monthKey].reviews += 1
            }
        })

        return {
            months: Object.entries(monthlyData).map(([month, data]) => ({
                month,
                ...data
            }))
        }
    } catch (error) {
        console.error("Error fetching monthly activity:", error)
        return { error: classify(error), months: [] }
    }
}

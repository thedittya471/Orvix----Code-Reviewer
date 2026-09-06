"use server"

import { fetchViewerActivity, getGithubToken } from "@/module/github/lib/github"
import { getCurrentSession } from "@/lib/session"

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

export type MonthlyActivity = {
    month: string
    commits: number
    prs: number
    reviews: number
}

export type DashboardData = {
    stats: {
        totalCommits: number
        totalPRs: number
        totalReviews: number
        totalRepos: number
    }
    monthlyActivity: MonthlyActivity[]
    calendar: {
        totalContributions: number
        days: { date: string; count: number }[]
    }
}

const EMPTY_DASHBOARD: DashboardData = {
    stats: { totalCommits: 0, totalPRs: 0, totalReviews: 0, totalRepos: 0 },
    monthlyActivity: [],
    calendar: { totalContributions: 0, days: [] }
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

        sampleReviews.push({
            createdAt: reviewDate
        })
    }

    return sampleReviews
}

export async function getDashboardData(): Promise<DashboardData> {
    try {
        const session = await getCurrentSession()

        if (!session?.user) {
            throw new Error("Unauthorized")
        }

        const token = await getGithubToken()
        const activity = await fetchViewerActivity(token, session.user.id)

        const monthlyData: {
            [key: string]: { commits: number; prs: number; reviews: number }
        } = {}

        // Initialize last 6 months data, current month included
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
            monthlyData[MONTH_NAMES[date.getMonth()]] = { commits: 0, prs: 0, reviews: 0 }
        }

        activity.days.forEach((day) => {
            const monthKey = MONTH_NAMES[new Date(day.date).getMonth()]

            if (monthlyData[monthKey]) {
                monthlyData[monthKey].commits += day.count
            }
        })

        activity.pullRequestDates.forEach((createdAt) => {
            const monthKey = MONTH_NAMES[new Date(createdAt).getMonth()]

            if (monthlyData[monthKey]) {
                monthlyData[monthKey].prs += 1
            }
        })

        const reviews = generateSampleReviews()

        reviews.forEach((review) => {
            const monthKey = MONTH_NAMES[review.createdAt.getMonth()]

            if (monthlyData[monthKey]) {
                monthlyData[monthKey].reviews += 1
            }
        })

        return {
            stats: {
                totalCommits: activity.totalContributions,
                totalPRs: activity.totalPullRequestContributions,
                // TODO: count ai reviews from database
                totalReviews: 87,
                // TODO: fetch total connected repos from db
                totalRepos: 40
            },
            monthlyActivity: Object.entries(monthlyData).map(([month, data]) => ({
                month,
                ...data
            })),
            calendar: {
                totalContributions: activity.totalContributions,
                days: activity.days
            }
        }
    } catch (error) {
        console.error("Error fetching dashboard data:", error)
        return EMPTY_DASHBOARD
    }
}

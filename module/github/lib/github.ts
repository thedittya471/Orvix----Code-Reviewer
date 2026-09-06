import { cache } from "react"
import { unstable_cache } from "next/cache"
import { Octokit } from "octokit"
import prisma from "@/lib/db"

import { getCurrentSession } from "@/lib/session"

// Getting the github access token
export const getGithubToken = cache(async () => {
    const session = await getCurrentSession()

    if (!session) {
        throw new Error("Unauthorized")
    }

    const account = await prisma.account.findFirst({
        where: {
            userId: session.user.id,
            providerId: "github"
        }
    })

    if (!account?.accessToken) {
        throw new Error("No Github token found")
    }

    return account.accessToken;
})

export type ViewerActivity = {
    login: string
    totalCommitContributions: number
    totalPullRequestContributions: number
    totalContributions: number
    days: { date: string; count: number }[]
    pullRequestDates: string[]
}

interface ViewerActivityResponse {
    viewer: {
        login: string
        contributionsCollection: {
            totalCommitContributions: number
            totalPullRequestContributions: number
            contributionCalendar: {
                totalContributions: number
                weeks: {
                    contributionDays: {
                        contributionCount: number
                        date: string
                    }[]
                }[]
            }
            pullRequestContributions: {
                nodes: {
                    pullRequest: {
                        createdAt: string
                    }
                }[]
            }
        }
    }
}

/** Contribution data changes a handful of times a day; a few minutes is plenty. */
const VIEWER_ACTIVITY_TTL = 5 * 60

export function viewerActivityTag(userId: string) {
    return `viewer-activity:${userId}`
}

/**
 * Cached per user across requests. The GitHub round trip is the bulk of the
 * dashboard's latency, and the underlying data barely moves.
 *
 * Keyed on userId rather than the token: the token identifies the same user, and
 * a rotation only means one early miss. Nothing here reads cookies or headers —
 * both are resolved by the caller and passed in, which is what unstable_cache
 * requires.
 */
export const fetchViewerActivity = (token: string, userId: string) =>
    unstable_cache(
        () => fetchViewerActivityUncached(token),
        ["viewer-activity", userId],
        { revalidate: VIEWER_ACTIVITY_TTL, tags: [viewerActivityTag(userId)] }
    )()

/**
 * One query for everything the dashboard needs.
 *
 * `viewer` resolves the authenticated user server-side, which removes the
 * separate users.getAuthenticated() round trip, and contributionsCollection
 * carries the PR counts that previously required the search API — GitHub's
 * slowest endpoint, and the one rate-limited to 30 requests/minute.
 */
const fetchViewerActivityUncached = cache(async (token: string): Promise<ViewerActivity> => {
    const octokit = new Octokit({ auth: token })

    const query = `
    query{
        viewer{
            login
            contributionsCollection{
                totalCommitContributions
                totalPullRequestContributions
                contributionCalendar{
                    totalContributions
                    weeks{
                        contributionDays{
                            contributionCount
                            date
                        }
                    }
                }
                pullRequestContributions(first:100){
                    nodes{
                        pullRequest{
                            createdAt
                        }
                    }
                }
            }
        }
    }
    `

    try {
        const response = await octokit.graphql<ViewerActivityResponse>(query)
        const contributions = response.viewer.contributionsCollection

        return {
            login: response.viewer.login,
            totalCommitContributions: contributions.totalCommitContributions,
            totalPullRequestContributions: contributions.totalPullRequestContributions,
            totalContributions: contributions.contributionCalendar.totalContributions,
            days: contributions.contributionCalendar.weeks.flatMap((week) =>
                week.contributionDays.map((day) => ({
                    date: day.date,
                    count: day.contributionCount
                }))
            ),
            pullRequestDates: contributions.pullRequestContributions.nodes.map(
                (node) => node.pullRequest.createdAt
            )
        }
    } catch (error) {
        console.log("Error fetching contribution:", error)
        throw new Error("Error fetching contribution data")
    }
})

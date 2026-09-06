import { cache } from "react"
import { unstable_cache } from "next/cache"
import { Octokit } from "octokit"
import prisma from "@/lib/db"

import { getCurrentSession } from "@/lib/session"

/** Thrown when GitHub rejects the stored credential, as opposed to any other failure. */
export class GithubAuthError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "GithubAuthError"
    }
}

// Getting the github access token
export const getGithubToken = cache(async () => {
    const session = await getCurrentSession()

    if (!session) {
        throw new Error("Unauthorized")
    }

    // orderBy matters: findFirst has no defined order, so with more than one
    // github row for a user (re-authorising mints a new one) this could return a
    // superseded token on one request and a live one on the next.
    const account = await prisma.account.findFirst({
        where: {
            userId: session.user.id,
            providerId: "github"
        },
        orderBy: {
            updatedAt: "desc"
        }
    })

    if (!account?.accessToken) {
        throw new GithubAuthError("No Github token found")
    }

    return account.accessToken;
})

/** Contribution data changes a handful of times a day; a few minutes is plenty. */
const VIEWER_ACTIVITY_TTL = 5 * 60

export function viewerActivityTag(userId: string) {
    return `viewer-activity:${userId}`
}

/**
 * Each fetcher is cached per user across requests and keyed on userId rather
 * than the token: the token identifies the same user, and a rotation only means
 * one early miss. Nothing here reads cookies or headers — both are resolved by
 * the caller and passed in, which is what unstable_cache requires.
 */
function cached<TArgs extends unknown[], TResult>(
    name: string,
    userId: string,
    fn: (...args: TArgs) => Promise<TResult>
) {
    return unstable_cache(fn, [name, userId], {
        revalidate: VIEWER_ACTIVITY_TTL,
        tags: [viewerActivityTag(userId)]
    })
}

function withAuthErrors<T>(operation: () => Promise<T>) {
    return operation().catch((error) => {
        if ((error as { status?: number })?.status === 401) {
            // The stored token is no longer valid — revoked, or superseded by a
            // later authorisation. Only re-authenticating fixes it.
            throw new GithubAuthError("Github rejected the stored access token")
        }

        console.log("Error fetching from Github:", error)
        throw new Error("Error fetching Github data")
    })
}

export type ViewerTotals = {
    login: string
    totalCommitContributions: number
    totalPullRequestContributions: number
    totalContributions: number
}

/**
 * Deliberately excludes the calendar and PR lists. This is the query behind the
 * stat tiles, and keeping it small is what lets them paint well before the
 * heavier calendar lands.
 */
export const fetchViewerTotals = (token: string, userId: string) =>
    cached("viewer-totals", userId, async (): Promise<ViewerTotals> => {
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
                    }
                }
            }
        }
        `

        const response = await withAuthErrors(() =>
            octokit.graphql<{
                viewer: {
                    login: string
                    contributionsCollection: {
                        totalCommitContributions: number
                        totalPullRequestContributions: number
                        contributionCalendar: { totalContributions: number }
                    }
                }
            }>(query)
        )

        const contributions = response.viewer.contributionsCollection

        return {
            login: response.viewer.login,
            totalCommitContributions: contributions.totalCommitContributions,
            totalPullRequestContributions: contributions.totalPullRequestContributions,
            totalContributions: contributions.contributionCalendar.totalContributions
        }
    })()

export type ContributionCalendar = {
    totalContributions: number
    days: { date: string; count: number }[]
}

/**
 * The heavy one — a year of days. Shared by the heatmap and the monthly charts,
 * so whichever resolves second gets a cache hit instead of a second round trip.
 */
export const fetchContributionCalendar = (token: string, userId: string) =>
    cached("contribution-calendar", userId, async (): Promise<ContributionCalendar> => {
        const octokit = new Octokit({ auth: token })

        const query = `
        query{
            viewer{
                contributionsCollection{
                    contributionCalendar{
                        totalContributions
                        weeks{
                            contributionDays{
                                contributionCount
                                date
                            }
                        }
                    }
                }
            }
        }
        `

        const response = await withAuthErrors(() =>
            octokit.graphql<{
                viewer: {
                    contributionsCollection: {
                        contributionCalendar: {
                            totalContributions: number
                            weeks: {
                                contributionDays: {
                                    contributionCount: number
                                    date: string
                                }[]
                            }[]
                        }
                    }
                }
            }>(query)
        )

        const calendar = response.viewer.contributionsCollection.contributionCalendar

        return {
            totalContributions: calendar.totalContributions,
            days: calendar.weeks.flatMap((week) =>
                week.contributionDays.map((day) => ({
                    date: day.date,
                    count: day.contributionCount
                }))
            )
        }
    })()

/** Creation dates of the last 100 PRs, for the monthly breakdown. */
export const fetchPullRequestDates = (token: string, userId: string) =>
    cached("pull-request-dates", userId, async (): Promise<string[]> => {
        const octokit = new Octokit({ auth: token })

        const query = `
        query{
            viewer{
                contributionsCollection{
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

        const response = await withAuthErrors(() =>
            octokit.graphql<{
                viewer: {
                    contributionsCollection: {
                        pullRequestContributions: {
                            nodes: { pullRequest: { createdAt: string } }[]
                        }
                    }
                }
            }>(query)
        )

        return response.viewer.contributionsCollection.pullRequestContributions.nodes.map(
            (node) => node.pullRequest.createdAt
        )
    })()

export const getRepositories = async (page:number = 1, perPage:number=10) => {
    const token = await getGithubToken()
    const octokit = new Octokit({auth:token})

    const {data} = await octokit.rest.repos.listForAuthenticatedUser({
        sort:"updated",
        direction:"desc",
        visibility:"all",
        per_page:perPage,
        page:page
    })

    return data;
}
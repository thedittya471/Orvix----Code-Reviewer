import { cache } from "react"
import { unstable_cache } from "next/cache"
import { Octokit } from "octokit"
import prisma from "@/lib/db"

import { getCurrentSession } from "@/lib/session"
import { oc } from "date-fns/locale"

export class GithubAuthError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "GithubAuthError"
    }
}

export const getGithubToken = cache(async () => {
    const session = await getCurrentSession()

    if (!session) {
        throw new Error("Unauthorized")
    }

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

const VIEWER_ACTIVITY_TTL = 5 * 60

export function viewerActivityTag(userId: string) {
    return `viewer-activity:${userId}`
}

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
            throw new GithubAuthError("Github rejected the stored access token")
        }

        console.log("Error fetching from Github:", error)
        throw new Error("Error fetching Github data")
    })
}

export type GithubErrorKind = "github_auth" | "unknown"

export function classifyGithubError(error: unknown): GithubErrorKind {
    return error instanceof GithubAuthError ? "github_auth" : "unknown"
}

export type ViewerTotals = {
    login: string
    totalCommitContributions: number
    totalPullRequestContributions: number
    totalContributions: number
}

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

export const getRepositories = async (page: number = 1, perPage: number = 10) => {
    const token = await getGithubToken()
    const octokit = new Octokit({ auth: token })

    const { data } = await withAuthErrors(() =>
        octokit.rest.repos.listForAuthenticatedUser({
            sort: "updated",
            direction: "desc",
            visibility: "all",
            per_page: perPage,
            page: page
        })
    )

    return data;
}

export function githubWebhookUrl() {
    const base = process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/+$/, "")

    if (!base) {
        throw new Error("NEXT_PUBLIC_APP_BASE_URL is not set")
    }

    return `${base}/api/webhooks/github`
}


export const createWebhook = async (owner: string, repo: string) => {
    const token = await getGithubToken()
    const octokit = new Octokit({ auth: token })
    const url = githubWebhookUrl()

    return withAuthErrors(async () => {
        const { data: hooks } = await octokit.rest.repos.listWebhooks({ owner, repo })
        const existing = hooks.find((hook) => hook.config.url === url)

        if (existing) {
            return existing
        }

        const { data } = await octokit.rest.repos.createWebhook({
            owner,
            repo,
            events: ["pull_request"],
            active: true,
            config: {
                url,
                content_type: "json",
                secret: process.env.GITHUB_WEBHOOK_SECRET,
                insecure_ssl: "0"
            }
        })

        return data
    })
}

export const deleteWebhook = async (owner: string, repo: string, hookId: number) => {
    const token = await getGithubToken()
    const octokit = new Octokit({ auth: token })

    try {
        await octokit.rest.repos.deleteWebhook({ owner, repo, hook_id: hookId })
    } catch (error) {
        if ((error as { status?: number })?.status !== 404) {
            throw error
        }
    }
}

export const getRepoFileContents = async (token: string, owner: string, repo: string, path: string = ""): Promise<{ path: string, content: string }[]> => {
    const octokit = new Octokit({ auth: token })

    const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path
    })

    if (!Array.isArray(data)) {
        if (data.type === "file" && data.content) {
            return [{
                path: data.path,
                content: Buffer.from(data.content, "base64").toString("utf-8")
            }]
        }

        return []
    }

    let files: { path: string, content: string }[] = []

    for (const item of data) {
        if (item.type == "file") {
            const { data: fileData } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: item.path
            })

            if (!Array.isArray(fileData) && fileData.type === "file" && fileData.content) {
                // Filter out non-code files if needed (images, etc.)
                // For now, let's include everything that looks like text
                if (!item.path.match(/\.(png|jgp|jpeg|gif|svg|ico|pdf|zip|tar|gz)$/i)) {
                    files.push({
                        path: item.path,
                        content: Buffer.from(fileData.content, "base64").toString("utf-8")
                    })
                }
            }
        } else if (item.type == "dir") {
            const subFiles = await getRepoFileContents(token, owner, repo, item.path)

            files = files.concat(subFiles)
        }
    }

    return files
}

export async function getPullRequestDiff(
    token: string,
    owner: string,
    repo: string,
    prNumber: number
) {
    const octokit = new Octokit({ auth: token })

    const { data: pr } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber
    })

    const { data: diff } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
        mediaType: {
            format: "diff"
        }
    })

    return {
        diff: diff as unknown as string,
        title: pr.title,
        description: pr.body || ""
    }
}

export async function postReviewcomment(
    token: string,
    owner: string,
    repo: string,
    prNumber: number,
    review: string
) {
    const octokit = new Octokit({ auth: token })

    await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `## AI Code Review\n\n${review}\n\n---\n*Powered by Orvix`
    })
}
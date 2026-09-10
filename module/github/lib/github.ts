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

export function githubClient(token: string) {
    return new Octokit({
        auth: token,
        throttle: {
            onRateLimit: (retryAfter: number, options: { method: string; url: string }, _o: unknown, retryCount: number) => {
                console.warn(`[github] rate limit on ${options.method} ${options.url}, retry ${retryCount} in ${retryAfter}s`)
                return retryCount < 2
            },
            onSecondaryRateLimit: (retryAfter: number, options: { method: string; url: string }, _o: unknown, retryCount: number) => {
                console.warn(`[github] secondary rate limit on ${options.method} ${options.url}, retry ${retryCount} in ${retryAfter}s`)
                return retryCount < 1
            }
        }
    })
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
        const octokit = githubClient(token)

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
        const octokit = githubClient(token)

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
        const octokit = githubClient(token)

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
    const octokit = githubClient(token)

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


const WEBHOOK_EVENTS = ["pull_request", "push"] as const

export const createWebhook = async (owner: string, repo: string) => {
    const token = await getGithubToken()
    const octokit = githubClient(token)
    const url = githubWebhookUrl()

    return withAuthErrors(async () => {
        const { data: hooks } = await octokit.rest.repos.listWebhooks({ owner, repo })
        const existing = hooks.find((hook) => hook.config.url === url)

        if (existing) {
            const missing = WEBHOOK_EVENTS.filter((name) => !existing.events.includes(name))

            if (missing.length === 0) {
                return existing
            }

            const { data } = await octokit.rest.repos.updateWebhook({
                owner,
                repo,
                hook_id: existing.id,
                events: [...WEBHOOK_EVENTS]
            })

            return data
        }

        const { data } = await octokit.rest.repos.createWebhook({
            owner,
            repo,
            events: [...WEBHOOK_EVENTS],
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
    const octokit = githubClient(token)

    try {
        await octokit.rest.repos.deleteWebhook({ owner, repo, hook_id: hookId })
    } catch (error) {
        if ((error as { status?: number })?.status !== 404) {
            throw error
        }
    }
}

export const MAX_INDEXABLE_FILES = 1500
export const MAX_INDEXABLE_FILE_BYTES = 200_000

const SKIPPED_EXTENSIONS =
    /\.(png|jpe?g|gif|bmp|webp|svg|ico|pdf|zip|tar|gz|tgz|rar|7z|mp[34]|mov|avi|woff2?|ttf|eot|otf|so|dll|dylib|exe|bin|wasm|class|jar|pyc|min\.js|min\.css|map|snap)$/i

const SKIPPED_PATHS =
    /(^|\/)(node_modules|\.git|\.next|dist|build|out|coverage|vendor|target|\.venv|__pycache__|\.turbo|\.cache)(\/|$)/i

const SKIPPED_FILENAMES =
    /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|Cargo\.lock|poetry\.lock|composer\.lock|Gemfile\.lock|go\.sum)$/i

export type RepoFile = { path: string; sha: string; size: number }

export function isIndexablePath(path: string, size: number) {
    if (SKIPPED_PATHS.test(path)) return false
    if (SKIPPED_FILENAMES.test(path)) return false
    if (SKIPPED_EXTENSIONS.test(path)) return false

    return size > 0 && size <= MAX_INDEXABLE_FILE_BYTES
}

export const listRepoFiles = async (
    token: string,
    owner: string,
    repo: string
): Promise<{ files: RepoFile[]; truncated: boolean }> => {
    const octokit = githubClient(token)

    const { data: repository } = await octokit.rest.repos.get({ owner, repo })

    const { data: tree } = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: repository.default_branch,
        recursive: "true"
    })

    const files: RepoFile[] = []

    for (const entry of tree.tree) {
        if (entry.type !== "blob" || !entry.path || !entry.sha) continue
        if (!isIndexablePath(entry.path, entry.size ?? 0)) continue

        files.push({ path: entry.path, sha: entry.sha, size: entry.size ?? 0 })
    }

    // Smallest first: on a repo over the cap, prefer breadth of source files
    // over a handful of very large ones.
    files.sort((a, b) => a.size - b.size)

    return {
        files: files.slice(0, MAX_INDEXABLE_FILES),
        truncated: Boolean(tree.truncated) || files.length > MAX_INDEXABLE_FILES
    }
}

/** Fetches blob contents for the given paths, skipping any that fail. */
export const getRepoBlobs = async (
    token: string,
    owner: string,
    repo: string,
    files: RepoFile[],
    concurrency = 8
): Promise<{ path: string; content: string }[]> => {
    const octokit = githubClient(token)
    const results: { path: string; content: string }[] = []
    let cursor = 0

    const worker = async () => {
        while (cursor < files.length) {
            const file = files[cursor++]

            try {
                const { data } = await octokit.rest.git.getBlob({
                    owner,
                    repo,
                    file_sha: file.sha
                })

                const content = Buffer.from(data.content, data.encoding as BufferEncoding).toString("utf-8")

                // A NUL byte means this is binary despite the extension check.
                if (!content.includes("\u0000")) {
                    results.push({ path: file.path, content })
                }
            } catch (error) {
                console.error(`[github] failed to fetch ${file.path}:`, error)
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker))

    return results
}

export const getRepoFileContents = async (
    token: string,
    owner: string,
    repo: string,
    path: string
): Promise<{ path: string; content: string }[]> => {
    const octokit = githubClient(token)

    const { data } = await octokit.rest.repos.getContent({ owner, repo, path })

    if (Array.isArray(data) || data.type !== "file" || !data.content) {
        return []
    }

    if (!isIndexablePath(data.path, data.size)) {
        return []
    }

    return [{
        path: data.path,
        content: Buffer.from(data.content, "base64").toString("utf-8")
    }]
}

export async function getPullRequestDiff(
    token: string,
    owner: string,
    repo: string,
    prNumber: number
) {
    const octokit = githubClient(token)

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
    review: string,
    commentId?: number | null
) {
    const octokit = githubClient(token)
    const body = `## AI Code Review\n\n${review}\n\n---\n*Powered by Orvix*`

    if (commentId) {
        try {
            const { data } = await octokit.rest.issues.updateComment({
                owner,
                repo,
                comment_id: commentId,
                body
            })

            return data.id
        } catch (error) {
            if ((error as { status?: number })?.status !== 404) {
                throw error
            }
        }
    }

    const { data } = await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body
    })

    return data.id
}
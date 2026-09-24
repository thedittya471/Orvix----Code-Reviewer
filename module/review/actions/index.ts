"use server"

import prisma from "@/lib/db"
import { getCurrentSession } from "@/lib/session"
import { getGithubToken, githubClient } from "@/module/github/lib/github"
import { reviewPullRequest } from "@/module/ai/actions"

export type ReviewListItem = {
    id: string
    prNumber: number
    prTitle: string
    prUrl: string
    review: string
    status: string
    error: string | null
    createdAt: Date
    repository: {
        id: string
        name: string
        owner: string
        fullName: string
    }
}

export async function getReviews(): Promise<ReviewListItem[]> {
    const session = await getCurrentSession()

    if (!session) {
        throw new Error("Unauthorized")
    }

    return await prisma.review.findMany({
        where: {
            repository: {
                userId: session.user.id
            }
        },
        select: {
            id: true,
            prNumber: true,
            prTitle: true,
            prUrl: true,
            review: true,
            status: true,
            error: true,
            createdAt: true,
            repository: {
                select: {
                    id: true,
                    name: true,
                    owner: true,
                    fullName: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        },
        take: 50
    })
}

export async function requestReview(prUrl: string) {
    const session = await getCurrentSession()
    if (!session?.user) throw new Error("Unauthorized")

    let url: URL
    try {
        url = new URL(prUrl)
    } catch {
        return { success: false, message: "Enter a valid GitHub pull request URL" }
    }
    const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/([1-9]\d*)\/?$/)
    if (url.origin !== "https://github.com" || !match || !Number.isSafeInteger(Number(match[3]))) {
        return { success: false, message: "Enter a valid GitHub pull request URL" }
    }
    const prNumber = Number(match[3])
    const repository = await prisma.repository.findFirst({
        where: {
            owner: { equals: match[1], mode: "insensitive" },
            name: { equals: match[2], mode: "insensitive" },
            userId: session.user.id
        },
        select: { id: true, owner: true, name: true }
    })
    if (!repository) return { success: false, message: "Connect this repository to your account before requesting a review" }

    const token = await getGithubToken()
    const pr = await githubClient(token).rest.pulls.get({
        owner: repository.owner, repo: repository.name, pull_number: prNumber
    }).then(({ data }) => data).catch((error) => {
        console.error("Failed to load pull request for manual review:", error)
        return null
    })
    if (!pr) return { success: false, message: "Could not load the pull request. Check the URL and your GitHub access." }
    if (pr.state !== "open" || pr.draft) return { success: false, message: "Only open, non-draft pull requests can be reviewed" }

    const where = { repositoryId: repository.id, prNumber }
    const created = await prisma.review.createMany({
        data: { ...where, prTitle: pr.title, prUrl: `https://github.com/${repository.owner}/${repository.name}/pull/${prNumber}`, review: "", status: "pending" },
        skipDuplicates: true
    })
    if (created.count === 0) {
        const claimed = await prisma.review.updateMany({
            where: { ...where, status: { not: "pending" } },
            data: { status: "pending", error: null, prTitle: pr.title }
        })
        if (claimed.count === 0) return { success: false, message: "This review is already queued or running" }
    }

    try {
        const result = await reviewPullRequest(repository.owner, repository.name, prNumber, pr.title)
        if (!result.success) throw new Error(result.message)
        return result
    } catch (error) {
        console.error("Failed to queue manual review:", error)
        const message = "Could not queue the review. Please try again."
        await prisma.review.updateMany({
            where: { ...where, status: "pending" },
            data: { status: "failed", error: message }
        })
        return { success: false, message }
    }
}

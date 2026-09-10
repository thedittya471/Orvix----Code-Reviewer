"use server"

import { inngest } from "@/inngest/client"
import prisma from "@/lib/db"
import { getCurrentSession } from "@/lib/session"
import {
    classifyGithubError,
    createWebhook,
    getRepositories,
    type GithubErrorKind
} from "@/module/github/lib/github"
import { removeRepositoryConnection } from "@/module/repository/lib/disconnect-repository"

export type GithubRepository = Awaited<ReturnType<typeof getRepositories>>[number]

export type RepositoryListItem = GithubRepository & { isConnected: boolean }

export type RepositoryPage = {
    error?: GithubErrorKind
    items: RepositoryListItem[]
}

export const fetchRepositories = async (page: number = 1, perPage: number = 10): Promise<RepositoryPage> => {
    try {
        const session = await getCurrentSession()

        if (!session) {
            throw new Error("Unauthorized")
        }

        const githubRepos = await getRepositories(page, perPage)

        const dbRepos = await prisma.repository.findMany({
            where: {
                userId: session.user.id
            }
        })

        const connectedRepoIds = new Set(dbRepos.map(repo => repo.githubId))

        return {
            items: githubRepos.map((repo) => ({
                ...repo,
                isConnected: connectedRepoIds.has(BigInt(repo.id))
            }))
        }
    } catch (error) {
        console.error("Error fetching repositories:", error)
        return { error: classifyGithubError(error), items: [] }
    }
}

export const connectRepository = async (owner: string, repo: string, githubId: number) => {
    const session = await getCurrentSession()

    if (!session) {
        throw new Error("Unauthorized")
    }

    const webhook = await createWebhook(owner, repo)

    const fields = {
        name: repo,
        owner,
        fullName: `${owner}/${repo}`,
        url: `https://github.com/${owner}/${repo}`,
        webhookId: BigInt(webhook.id),
        userId: session.user.id
    }

    const repository = await prisma.repository.upsert({
        where: { githubId: BigInt(githubId) },
        create: { githubId: BigInt(githubId), ...fields },
        update: fields,
        select: { id: true }
    })

    try {
        await inngest.send({
            name: "repository.connected",
            data: {
                repositoryId: repository.id,
                owner,
                repo,
                userId: session.user.id
            }
        })
    } catch (error) {
        console.error("Failed to trigger repository indexing:", error)
    }

    return { githubId, isConnected: true }
}

export const disconnectRepository = async (githubId: number) => {
    const session = await getCurrentSession()

    if (!session) {
        throw new Error("Unauthorized")
    }

    const repository = await prisma.repository.findFirst({
        where: {
            githubId: BigInt(githubId),
            userId: session.user.id
        }
    })

    if (!repository) {
        return { githubId, isConnected: false }
    }

    await removeRepositoryConnection(repository)

    return { githubId, isConnected: false }
}

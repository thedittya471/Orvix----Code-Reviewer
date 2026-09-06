"use server"

import prisma from "@/lib/db"
import { getCurrentSession } from "@/lib/session"
import { getRepositories } from "@/module/github/lib/github"

export type GithubRepository = Awaited<ReturnType<typeof getRepositories>>[number]

export type RepositoryListItem = GithubRepository & { isConnected: boolean }

export const fetchRepositories = async(page:number=1, perPage:number = 10): Promise<RepositoryListItem[]> => {
    const session = await getCurrentSession()

    if(!session) {
        throw new Error("Unauthorized")
    }

    const githubRepos = await getRepositories(page, perPage)
    
    const dbRepos = await prisma.repository.findMany({
        where:{
            userId: session.user.id
        }
    })

    const connectedRepoIds = new Set(dbRepos.map(repo => repo.githubId))

    return githubRepos.map((repo) => ({
        ...repo,
        isConnected:connectedRepoIds.has(BigInt(repo.id))
    }))
}

type ConnectRepositoryInput = {
    githubId: number
    name: string
    owner: string
    fullName: string
    url: string
}

/**
 * githubId is a BigInt column but arrives as a number and must leave as one —
 * a BigInt cannot cross the server-action boundary to the client.
 */
export const connectRepository = async (repo: ConnectRepositoryInput) => {
    const session = await getCurrentSession()

    if (!session) {
        throw new Error("Unauthorized")
    }

    await prisma.repository.upsert({
        where: { githubId: BigInt(repo.githubId) },
        create: {
            githubId: BigInt(repo.githubId),
            name: repo.name,
            owner: repo.owner,
            fullName: repo.fullName,
            url: repo.url,
            userId: session.user.id
        },
        update: {
            name: repo.name,
            owner: repo.owner,
            fullName: repo.fullName,
            url: repo.url,
            userId: session.user.id
        }
    })

    return { githubId: repo.githubId, isConnected: true }
}

export const disconnectRepository = async (githubId: number) => {
    const session = await getCurrentSession()

    if (!session) {
        throw new Error("Unauthorized")
    }

    await prisma.repository.deleteMany({
        where: {
            githubId: BigInt(githubId),
            userId: session.user.id
        }
    })

    return { githubId, isConnected: false }
}

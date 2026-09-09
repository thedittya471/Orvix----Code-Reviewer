"use server"

import prisma from "@/lib/db"
import { getCurrentSession } from "@/lib/session"
import { removeRepositoryConnection } from "@/module/repository/lib/disconnect-repository"
import { revalidatePath } from "next/cache"

export async function getUserProfile() {
    try {
        const session = await getCurrentSession()

        if (!session?.user) {
            throw new Error("Unauthorized")
        }

        const user = await prisma.user.findUnique({
            where: {
                id: session.user.id
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true
            }

        })
        return user
    } catch (error) {
        console.error("Error fetching user profile:", error)
        return null
    }
}

export async function updateUserProfile(data: { name?: string; email?: string }) {
    try {
        const session = await getCurrentSession()

        if (!session?.user) {
            throw new Error("Unauthorized")
        }

        const updateUser = await prisma.user.update({
            where: {
                id: session.user.id
            },
            data: {
                name: data.name,
                email: data.email
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        })

        revalidatePath("/dashboard/settings")

        return {
            success: true,
            user: updateUser
        }
    } catch (error) {
        console.error("Error updating user profile:", error)
        return {
            success: false,
            error: "Failed to update profile"
        }
    }
}

export async function getConnectedRepositories() {
    try {
        const session = await getCurrentSession()

        if (!session?.user) {
            throw new Error("Unauthorized")
        }

        const connectedRepositories = await prisma.repository.findMany({
            where: {
                userId: session.user.id
            },
            select: {
                id: true,
                name: true,
                fullName: true,
                url: true,
                createdAt: true
            },
            orderBy: {
                createdAt: "desc"
            }
        })
        return connectedRepositories
    } catch (error) {
        console.error("Error fetching connected repositories:", error)
        return []
    }
}

export async function disconnectRepository(repositoryId: string) {
    try {
        const session = await getCurrentSession()

        if (!session?.user) {
            throw new Error("Unauthorized")
        }

        const repository = await prisma.repository.findFirst({
            where: {
                id: repositoryId,
                userId: session.user.id
            }
        })

        if (!repository) {
            throw new Error("Repository not found")
        }

        await removeRepositoryConnection(repository)

        revalidatePath("/dashboard/settings")
        revalidatePath("/dashboard/repository")

        return {
            success: true
        }
    } catch (error) {
        console.error("Error disconnecting repository:", error)
        return {
            success: false,
            error: "Failed to disconnect repository"
        }
    }
}

export async function disconnectAllRepositories() {
    try {
        const session = await getCurrentSession()

        if (!session?.user) {
            throw new Error("Unauthorized")
        }

        const repositories = await prisma.repository.findMany({
            where: {
                userId: session.user.id
            }
        })

        let disconnected = 0

        for (const repository of repositories) {
            try {
                await removeRepositoryConnection(repository)
                disconnected += 1
            } catch (error) {
                console.error(`Error disconnecting ${repository.fullName}:`, error)
            }
        }

        revalidatePath("/dashboard/settings")
        revalidatePath("/dashboard/repository")

        return {
            success: disconnected === repositories.length,
            disconnected,
            failed: repositories.length - disconnected
        }
    } catch (error) {
        console.error("Error disconnecting repositories:", error)
        return {
            success: false,
            error: "Failed to disconnect repositories"
        }
    }
}

"use server"

import prisma from "@/lib/db"
import { getCurrentSession } from "@/lib/session"

export type ReviewListItem = {
    id: string
    prNumber: number
    prTitle: string
    prUrl: string
    review: string
    status: string
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

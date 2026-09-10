"use server"

import { inngest } from "@/inngest/client"
import prisma from "@/lib/db"

export async function reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number,
    prTitle: string
) {
    const repository = await prisma.repository.findFirst({
        where: {
            owner,
            name: repo
        },
        select: {
            id: true,
            userId: true,
            user: {
                select: {
                    accounts: {
                        where: {
                            providerId: "github"
                        },
                        select: {
                            accessToken: true
                        }
                    }
                }
            }
        }
    })

    if (!repository) {
        return { success: false, message: "Repository not found" }
    }

    const prUrl = `https://github.com/${owner}/${repo}/pull/${prNumber}`

    try {
        if (!repository.user.accounts[0]?.accessToken) {
            throw new Error("No GitHub access token found for repository owner")
        }

        await prisma.review.upsert({
            where: {
                repositoryId_prNumber: {
                    repositoryId: repository.id,
                    prNumber
                }
            },
            create: {
                repositoryId: repository.id,
                prNumber,
                prTitle,
                prUrl,
                review: "",
                status: "pending"
            },
            update: {
                prTitle,
                status: "pending",
                error: null
            }
        })

        await inngest.send({
            name: "pr.review.requested",
            data: {
                owner,
                repo,
                prNumber,
                userId: repository.userId
            }
        })

        return { success: true, message: "Review queued" }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"

        try {
            await prisma.review.upsert({
                where: {
                    repositoryId_prNumber: {
                        repositoryId: repository.id,
                        prNumber
                    }
                },
                create: {
                    repositoryId: repository.id,
                    prNumber,
                    prTitle,
                    prUrl,
                    review: "",
                    status: "failed",
                    error: message
                },
                update: {
                    status: "failed",
                    error: message
                }
            })
        } catch (dbError) {
            console.error("Failed to save error to database:", dbError)
        }

        return { success: false, message }
    }
}

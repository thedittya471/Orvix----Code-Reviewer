"use server"

import { inngest } from "@/inngest/client"
import prisma from "@/lib/db"

export async function reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
) {
    try {
        const repository = await prisma.repository.findFirst({
            where: {
                owner,
                name: repo
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        accounts: {
                            where: {
                                providerId: "github"
                            },
                            select: {
                                providerId: true,
                                accountId: true,
                                accessToken: true
                            }
                        }
                    }
                }
            }
        })
        if (!repository) {
            throw new Error("Repository not found")
        }

        const githubAccount = repository.user.accounts[0]

        if (!githubAccount) {
            throw new Error("No GitHub access token found for repository owner")
        }

        const token = githubAccount.accessToken

        if (!token) {
            throw new Error("No GitHub access token found for repository owner")
        }

        await inngest.send({
            name: "pr.review.requested",
            data: {
                owner,
                repo,
                prNumber,
                userId: repository.user.id
            }
        })

        return {
            success: true,
            message: "Review Queued"
        }
    } catch (error) {
        try {
            const repository = await prisma.repository.findFirst({
                where:{
                    owner,
                    name:repo
                }
            })
            if(repository){
                await prisma.review.create({
                    data:{
                        repositoryId: repository.id,
                        prNumber,
                        prTitle: "Failed to fetch PR",
                        prUrl:`https://github.com/${owner}/${repo}/pull/${prNumber}`,
                        review: `Error: ${error instanceof Error ? error.message : "Unknown Error"}`,
                        status: "failed"
                    }
                })
            }
        } catch (dbError) {
            console.error("Failed to save error to database:", dbError)
        }

        return {
            success: false,
            message: error instanceof Error ? error.message : "Unknown Error"
        }
    }
}
import prisma from "@/lib/db"
import { deleteFileVectors, indexCodebase } from "@/module/ai/lib/rag"
import { getRepoFileContents } from "@/module/github/lib/github"

import { inngest } from "../client"

const SKIPPED_FILES = /\.(png|jpe?g|gif|svg|ico|pdf|zip|tar|gz|lock)$/i

export const reindexRepo = inngest.createFunction(
    { id: "repo-reindex", triggers: { event: "repository.push" } },
    async ({ event, step }) => {
        const { repositoryId, owner, repo, userId, changed, removed } = event.data as {
            repositoryId: string
            owner: string
            repo: string
            userId: string
            changed: string[]
            removed: string[]
        }

        await step.run("delete-removed-vectors", async () => {
            await deleteFileVectors(repositoryId, removed)
        })

        const indexable = changed.filter((path) => !SKIPPED_FILES.test(path))

        if (indexable.length === 0) {
            return { success: true, indexed: 0, removed: removed.length }
        }

        const files = await step.run("fetch-changed-files", async () => {
            const account = await prisma.account.findFirst({
                where: {
                    userId,
                    providerId: "github"
                }
            })

            if (!account?.accessToken) {
                throw new Error("No Github access token found")
            }

            const fetched = await Promise.all(
                indexable.map(async (path) => {
                    try {
                        return await getRepoFileContents(account.accessToken!, owner, repo, path)
                    } catch {
                        return []
                    }
                })
            )

            return fetched.flat()
        })

        const result = await step.run("index-changed-files", async () => {
            if (files.length === 0) {
                return { indexed: 0, failed: [] as string[] }
            }

            return await indexCodebase(repositoryId, files)
        })

        return { success: true, indexed: result?.indexed ?? 0, removed: removed.length }
    }
)

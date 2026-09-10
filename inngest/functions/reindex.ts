import { deleteFileVectors, indexCodebase } from "@/module/ai/lib/rag"
import { getRepoFileContents, isIndexablePath, MAX_INDEXABLE_FILE_BYTES } from "@/module/github/lib/github"

import { inngest } from "../client"
import { githubTokenFor } from "./index"

const FILES_PER_BATCH = 50
const FETCH_CONCURRENCY = 8

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

        const indexable = changed.filter((path) => isIndexablePath(path, 1))

        let indexed = 0

        for (let start = 0; start < indexable.length; start += FILES_PER_BATCH) {
            const batch = indexable.slice(start, start + FILES_PER_BATCH)

            const result = await step.run(`reindex-batch-${start / FILES_PER_BATCH}`, async () => {
                const token = await githubTokenFor(userId)
                const contents: { path: string; content: string }[] = []
                let cursor = 0

                const worker = async () => {
                    while (cursor < batch.length) {
                        const path = batch[cursor++]

                        try {
                            const [file] = await getRepoFileContents(token, owner, repo, path)

                            if (file && file.content.length <= MAX_INDEXABLE_FILE_BYTES) {
                                contents.push(file)
                            }
                        } catch (error) {
                            console.error(`[reindex] failed to fetch ${path}:`, error)
                        }
                    }
                }

                await Promise.all(
                    Array.from({ length: Math.min(FETCH_CONCURRENCY, batch.length) }, worker)
                )

                if (contents.length === 0) {
                    return { indexed: 0 }
                }

                // A file that shrank into fewer chunks would otherwise keep its
                // stale tail, so its old chunks go before the new ones land.
                await deleteFileVectors(repositoryId, contents.map((file) => file.path))

                return { indexed: (await indexCodebase(repositoryId, contents)).indexed }
            })

            indexed += result.indexed
        }

        return { success: true, indexed, removed: removed.length }
    }
)

import prisma from "@/lib/db";
import { inngest } from "../client";
import { getRepoBlobs, listRepoFiles, type RepoFile } from "@/module/github/lib/github";
import { indexCodebase } from "@/module/ai/lib/rag";

const FILES_PER_BATCH = 100

export async function githubTokenFor(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "github"
    }
  })

  if (!account?.accessToken) {
    throw new Error("No Github access token found")
  }

  return account.accessToken
}

export const indexRepo = inngest.createFunction(
  { id: "repo-index", triggers: { event: "repository.connected" } },
  async ({ event, step }) => {
    const { repositoryId, owner, repo, userId } = event.data

    const { files, truncated } = await step.run("list-files", async () => {
      const token = await githubTokenFor(userId)

      return await listRepoFiles(token, owner, repo)
    })

    let indexed = 0

    for (let start = 0; start < files.length; start += FILES_PER_BATCH) {
      const batch = files.slice(start, start + FILES_PER_BATCH) as RepoFile[]

      const result = await step.run(`index-batch-${start / FILES_PER_BATCH}`, async () => {
        const token = await githubTokenFor(userId)
        const contents = await getRepoBlobs(token, owner, repo, batch)

        if (contents.length === 0) {
          return { indexed: 0 }
        }

        return { indexed: (await indexCodebase(repositoryId, contents)).indexed }
      })

      indexed += result.indexed
    }

    return {
      success: true,
      indexedFiles: indexed,
      totalFiles: files.length,
      truncated
    }
  }
)
export { generateReview } from "./review"
export { reindexRepo } from "./reindex"

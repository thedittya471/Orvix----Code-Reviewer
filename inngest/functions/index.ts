import prisma from "@/lib/db";
import { inngest } from "../client";
import { getRepoFileContents } from "@/module/github/lib/github";
import { indexCodebase } from "@/module/ai/lib/rag";

export const indexRepo = inngest.createFunction(
  { id: "repo-index", triggers: { event: "repository.connected" } },
  async ({ event, step }) => {
    const { repositoryId, owner, repo, userId } = event.data

    //files
    const files = await step.run("fetch-files", async () => {

      const account = await prisma.account.findFirst({
        where: {
          userId: userId,
          providerId: "github"
        }
      })

      if (!account?.accessToken) {
        throw new Error("No Github access token found")
      }

      return await getRepoFileContents(account.accessToken, owner, repo)
    })

    await step.run("index-codebase", async () => {
      await indexCodebase(repositoryId, files)
    })

    return {
      success: true,
      indexedFiles: files.length
    }
  }
)
export { generateReview } from "./review"
export { reindexRepo } from "./reindex"

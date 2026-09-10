import prisma from "@/lib/db"
import { deleteRepoVectors } from "@/module/ai/lib/rag"
import { deleteWebhook } from "@/module/github/lib/github"

type ConnectedRepository = {
    id: string
    owner: string
    name: string
    webhookId: bigint | null
}

export async function removeRepositoryConnection(repository: ConnectedRepository) {
    if (repository.webhookId) {
        await deleteWebhook(repository.owner, repository.name, Number(repository.webhookId))
    }

    // Best effort: orphaned vectors are only wasted storage, but a failure here
    // must not leave the row behind with its webhook already gone — that reads
    // as connected in the UI while receiving no events.
    try {
        await deleteRepoVectors(repository.id)
    } catch (error) {
        console.error(`Failed to delete vectors for ${repository.owner}/${repository.name}:`, error)
    }

    await prisma.repository.delete({
        where: { id: repository.id }
    })
}

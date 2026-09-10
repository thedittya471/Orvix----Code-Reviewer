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

    await deleteRepoVectors(`${repository.owner}/${repository.name}`)

    await prisma.repository.delete({
        where: { id: repository.id }
    })
}

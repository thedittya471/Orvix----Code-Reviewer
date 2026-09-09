import prisma from "@/lib/db"
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

    await prisma.repository.delete({
        where: { id: repository.id }
    })
}

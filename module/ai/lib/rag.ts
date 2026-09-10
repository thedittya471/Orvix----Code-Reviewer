import { pineconeIndex } from "@/lib/pinecone"
import { embed } from "ai"
import { google } from "@ai-sdk/google"

export async function generateEmbedding(text: string) {
    const { embedding } = await embed({
        model: google.textEmbeddingModel("gemini-embedding-001"),
        value: text,
        providerOptions: {
            google: {
                // gemini-embedding-001 defaults to 3072; the Pinecone index is 768.
                outputDimensionality: 768
            }
        }
    })

    return embedding
}

export async function indexCodebase(repositoryId: string, files: { path: string; content: string }[]) {
    const vectors = []

    for (const file of files) {
        const content = `File: ${file.path}\n\n${file.content}`

        const truncatedContent = content.slice(0, 8000)

        try {
            const embedding = await generateEmbedding(truncatedContent)

            vectors.push({
                id: vectorIdFor(repositoryId, file.path),
                values: embedding,
                metadata: {
                    repositoryId,
                    path: file.path,
                    content: truncatedContent
                }
            })
        } catch (error) {
            console.error(`Failed to embed ${file.path}:`, error)
        }
    }

    if (vectors.length > 0) {
        const batchSize = 100

        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize)

            await pineconeIndex.upsert({
                records: batch
            })
        }

    }
    console.log("indexgin complete")
}

export async function retrieveContext(query: string, repositoryId: string, topK: number = 5) {
    const embedding = await generateEmbedding(query)

    const response = await pineconeIndex.query({
        topK: topK,
        vector: embedding,
        filter: {
            repositoryId: {
                $eq: repositoryId
            }
        },
        includeMetadata: true
    })

    return response.matches.map(match => match.metadata?.content as string).filter(Boolean)
}

export function vectorIdFor(repositoryId: string, path: string) {
    return `${repositoryId}-${path.replace(/\//g, '_')}`
}

export async function deleteRepoVectors(repositoryId: string) {
    await pineconeIndex.deleteMany({
        filter: {
            repositoryId: {
                $eq: repositoryId
            }
        }
    })
}

export async function deleteFileVectors(repositoryId: string, paths: string[]) {
    if (paths.length === 0) {
        return
    }

    await pineconeIndex.deleteMany({
        ids: paths.map((path) => vectorIdFor(repositoryId, path))
    })
}

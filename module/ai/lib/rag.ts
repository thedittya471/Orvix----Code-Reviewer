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

const CHUNK_CHARS = 6000
const CHUNK_OVERLAP = 400
const EMBED_CONCURRENCY = 8
const UPSERT_BATCH = 100

type Chunk = { path: string; index: number; total: number; text: string }


export function chunkFile(path: string, content: string): Chunk[] {
    const body = content.length <= CHUNK_CHARS
        ? [content]
        : (() => {
            const pieces: string[] = []
            let cursor = 0

            while (cursor < content.length) {
                let end = Math.min(cursor + CHUNK_CHARS, content.length)

                if (end < content.length) {
                    const breakAt = content.lastIndexOf("\n\n", end)

                    if (breakAt > cursor + CHUNK_CHARS / 2) {
                        end = breakAt
                    }
                }

                pieces.push(content.slice(cursor, end))
                cursor = end >= content.length ? end : Math.max(end - CHUNK_OVERLAP, cursor + 1)
            }

            return pieces
        })()

    return body.map((text, index) => ({ path, index, total: body.length, text }))
}

async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    worker: (item: T) => Promise<R | null>
): Promise<R[]> {
    const results: R[] = []
    let cursor = 0

    const run = async () => {
        while (cursor < items.length) {
            const result = await worker(items[cursor++])

            if (result !== null) {
                results.push(result)
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))

    return results
}

export async function indexCodebase(repositoryId: string, files: { path: string; content: string }[]) {
    const chunks = files.flatMap((file) =>
        chunkFile(file.path, `File: ${file.path}\n\n${file.content}`)
    )

    const failed: string[] = []

    const vectors = await mapWithConcurrency(chunks, EMBED_CONCURRENCY, async (chunk) => {
        try {
            const embedding = await generateEmbedding(chunk.text)

            return {
                id: vectorIdFor(repositoryId, chunk.path, chunk.index),
                values: embedding,
                metadata: {
                    repositoryId,
                    path: chunk.path,
                    chunk: chunk.index,
                    chunks: chunk.total,
                    content: chunk.text
                }
            }
        } catch (error) {
            console.error(`Failed to embed ${chunk.path} [${chunk.index}]:`, error)
            failed.push(chunk.path)
            return null
        }
    })

    if (vectors.length === 0) {
        throw new Error(
            `Indexing ${repositoryId} produced no vectors (${failed.length}/${chunks.length} chunks failed to embed)`
        )
    }

    for (let i = 0; i < vectors.length; i += UPSERT_BATCH) {
        await pineconeIndex.upsert({
            records: vectors.slice(i, i + UPSERT_BATCH)
        })
    }

    console.log(
        `Indexed ${vectors.length}/${chunks.length} chunks across ${files.length} files for ${repositoryId}`
    )

    return { indexed: vectors.length, files: files.length, failed }
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

export function vectorIdFor(repositoryId: string, path: string, chunk = 0) {
    return `${repositoryId}-${path.replace(/\//g, '_')}-${chunk}`
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

/**
 * Deleted by metadata rather than id: a file is stored as N chunks and the
 * caller does not know N, so an id list would leave the tail behind.
 */
export async function deleteFileVectors(repositoryId: string, paths: string[]) {
    if (paths.length === 0) {
        return
    }

    await pineconeIndex.deleteMany({
        filter: {
            repositoryId: { $eq: repositoryId },
            path: { $in: paths }
        }
    })
}

"use client"

import { useMutation, useQueryClient, type InfiniteData, type QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { connectRepository, disconnectRepository, type RepositoryPage } from "../actions"

type ConnectionResult = { githubId: number; isConnected: boolean }


const patchConnection = (queryClient: QueryClient, result: ConnectionResult) => {
    queryClient.setQueryData<InfiniteData<RepositoryPage>>(
        ["repositories"],
        (current) =>
            current && {
                ...current,
                pages: current.pages.map((page) => ({
                    ...page,
                    items: page.items.map((repo) =>
                        repo.id === result.githubId
                            ? { ...repo, isConnected: result.isConnected }
                            : repo
                    )
                }))
            }
    )
}

export const useConnectRepository = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ owner, repo, githubId }: { owner: string; repo: string; githubId: number }) =>
            connectRepository(owner, repo, githubId),
        onSuccess: (result) => {
            patchConnection(queryClient, result)
            toast.success("Repository connected")
        },
        onError: (error) => {
            toast.error("Failed to connect repository")
            console.error(error)
        }
    })
}

export const useDisconnectRepository = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ githubId }: { githubId: number }) => disconnectRepository(githubId),
        onSuccess: (result) => {
            patchConnection(queryClient, result)
            toast.success("Repository disconnected")
        },
        onError: (error) => {
            toast.error("Failed to disconnect repository")
            console.error(error)
        }
    })
}

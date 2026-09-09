"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getConnectedRepositories, disconnectRepository, disconnectAllRepositories } from "@/module/settings/actions"
import {toast} from "sonner"
import { ExternalLink, Trash2, AlertTriangle } from "lucide-react"
import {AlertDialog, AlertDialogTrigger, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter} from "@/components/ui/alert-dialog"
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"

export function RepositoryList() {
    const queryClient = useQueryClient()

    const [disconnectAllOpen, setDisconnectAllOpen] = useState(false)

    const {data:repositories, isLoading, error} = useQuery({
        queryKey:["connected-repositories"],
        queryFn: async () => await getConnectedRepositories(),
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus:false,
    })

    const invalidateRepositories = () => {
        queryClient.invalidateQueries({queryKey:["connected-repositories"]})
        queryClient.invalidateQueries({queryKey:["repositories"]})
    }

    const disconnectMutation = useMutation({
        mutationFn:async (repositoryId: string) => {
            return await disconnectRepository(repositoryId)
        },
        onSuccess:(result) => {
            if(result?.success) {
                invalidateRepositories()
                toast.success("Repository disconnected successfully")
            } else {
                toast.error(result?.error || "Failed to disconnect repository")
            }
        },
        onError:() => {
            toast.error("Failed to disconnect repository")
        }
    })

    const disconnectAllMutation = useMutation({
        mutationFn:async () => {
            return await disconnectAllRepositories()
        },
        onSuccess:(result) => {
            setDisconnectAllOpen(false)
            invalidateRepositories()

            if(result?.success) {
                toast.success("All repositories disconnected")
                return
            }

            const failed = result?.failed ?? 0
            const total = (result?.disconnected ?? 0) + failed

            toast.error(
                failed > 0
                    ? `${failed} of ${total} repositories could not be disconnected`
                    : result?.error || "Failed to disconnect repositories"
            )
        },
        onError:() => {
            toast.error("Failed to disconnect repositories")
        }
    })

    const connectedCount = repositories?.length ?? 0
    const busy = disconnectMutation.isPending || disconnectAllMutation.isPending

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Connected repositories
                    {connectedCount > 0 ? (
                        <Badge variant="secondary">{connectedCount}</Badge>
                    ) : null}
                </CardTitle>
                <CardDescription>
                    Orvix reviews pull requests on these repositories. Disconnecting one
                    removes its GitHub webhook.
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
                {isLoading ? (
                    <>
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </>
                ) : error ? (
                    <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
                        <AlertTriangle className="size-4 shrink-0 text-destructive" />
                        <p className="text-sm">
                            We could not load your connected repositories. Please try again.
                        </p>
                    </div>
                ) : connectedCount === 0 ? (
                    <div className="flex h-24 items-center justify-center rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">
                            No repositories connected yet.
                        </p>
                    </div>
                ) : (
                    <>
                        {repositories?.map((repository) => {
                            const removing =
                                disconnectAllMutation.isPending ||
                                (disconnectMutation.isPending &&
                                    disconnectMutation.variables === repository.id)

                            return (
                                <div
                                    key={repository.id}
                                    className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium" title={repository.fullName}>
                                            {repository.fullName}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Connected{" "}
                                            {formatDistanceToNow(new Date(repository.createdAt), {
                                                addSuffix: true
                                            })}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            nativeButton={false}
                                            aria-label={`Open ${repository.fullName} on GitHub`}
                                            render={
                                                <a
                                                    href={repository.url}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                />
                                            }
                                        >
                                            <ExternalLink className="size-3.5" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            disabled={busy}
                                            aria-label={`Disconnect ${repository.fullName}`}
                                            onClick={() => disconnectMutation.mutate(repository.id)}
                                        >
                                            <Trash2
                                                className={
                                                    removing ? "size-3.5 animate-pulse" : "size-3.5"
                                                }
                                            />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}

                        <AlertDialog open={disconnectAllOpen} onOpenChange={setDisconnectAllOpen}>
                            <AlertDialogTrigger
                                render={
                                    <Button variant="outline" size="sm" disabled={busy} className="self-end">
                                        <Trash2 className="size-3.5" />
                                        Disconnect all
                                    </Button>
                                }
                            />
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertTriangle className="size-5 text-destructive" />
                                    <AlertDialogTitle>Disconnect all repositories?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This removes the Orvix webhook from all {connectedCount}{" "}
                                        repositories. Pull requests will no longer be reviewed until
                                        you connect them again.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={disconnectAllMutation.isPending}>
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        variant="destructive"
                                        disabled={disconnectAllMutation.isPending}
                                        onClick={() => disconnectAllMutation.mutate()}
                                    >
                                        {disconnectAllMutation.isPending
                                            ? "Disconnecting…"
                                            : "Disconnect all"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

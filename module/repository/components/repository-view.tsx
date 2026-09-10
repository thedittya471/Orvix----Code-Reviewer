"use client"
import React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExternalLink, Star, Search, Check, Plus, TriangleAlert, GitFork } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { useRepositories } from '@/module/repository/hooks/use-repositories'
import { RepositorySkeletonList } from '@/module/repository/components/repository-skeleton'
import { ReconnectGithub } from '@/module/auth/components/reconnect-github'
import { type RepositoryListItem } from '@/module/repository/actions'
import {
    useConnectRepository,
    useDisconnectRepository
} from '@/module/repository/hooks/use-connect-repository'

const LANGUAGE_COLORS: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Java: "#b07219",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    "C++": "#f34b7d",
    C: "#555555",
    "C#": "#178600",
    Shell: "#89e051",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Svelte: "#ff3e00",
    Vue: "#41b883",
    Dart: "#00B4AB",
    Kotlin: "#A97BFF",
    Swift: "#F05138",
    MDX: "#fcb32c"
}

export const RepositoryView = () => {

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useRepositories()

    const [searchQuery, setSearchQuery] = useState("")

    const connect = useConnectRepository()
    const disconnect = useDisconnectRepository()

    const onIntersect = React.useRef<() => void>(() => {})

    React.useEffect(() => {
        onIntersect.current = () => {
            if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage()
            }
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    const sentinelRef = React.useCallback((node: HTMLDivElement | null) => {
        if (!node) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    onIntersect.current()
                }
            },
            { rootMargin: "300px" }
        )

        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    const toggleConnection = (repo: RepositoryListItem) => {
        if (repo.isConnected) {
            disconnect.mutate({ githubId: repo.id })
            return
        }

        connect.mutate({
            owner: repo.owner.login,
            repo: repo.name,
            githubId: repo.id
        })
    }

    const pendingGithubId = connect.isPending
        ? connect.variables?.githubId
        : disconnect.isPending
            ? disconnect.variables?.githubId
            : undefined

    const allRepositories = data?.pages.flatMap(page => page.items) || []
    const authExpired = data?.pages.some(page => page.error === "github_auth") ?? false
    const loadFailed = isError || (data?.pages.some(page => page.error) ?? false)

    const filteredRepositories = allRepositories.filter((repo: RepositoryListItem) =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const connectedCount = allRepositories.filter((repo) => repo.isConnected).length

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Repositories</h1>
                <p className="text-sm text-muted-foreground">
                    Connect a repository to let Orvix review its pull requests.
                    {connectedCount > 0 ? ` ${connectedCount} connected.` : null}
                </p>
            </div>

            <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Filter loaded repositories"
                    className="pl-8"
                />
            </div>

            {loadFailed ? (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
                    <TriangleAlert className="size-4 shrink-0 text-destructive" />
                    <p className="flex-1 text-sm">
                        {authExpired
                            ? "GitHub rejected your saved access token, so your repositories cannot be listed. Signing in again issues a fresh one."
                            : "We could not load your repositories. Please try again."}
                    </p>
                    {authExpired ? <ReconnectGithub callbackURL="/dashboard/repository" /> : null}
                </div>
            ) : null}

            {isLoading ? (
                <div className="flex flex-col gap-3">
                    <RepositorySkeletonList count={5} />
                </div>
            ) : null}

            {!isLoading && !loadFailed && filteredRepositories.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">
                        {searchQuery
                            ? `No loaded repository matches “${searchQuery}”.`
                            : "No repositories found on your GitHub account."}
                    </p>
                </div>
            ) : null}

            <div className="flex flex-col gap-3">
                {filteredRepositories.map((repo) => {
                    const busy = pendingGithubId === repo.id

                    return (
                        <Card
                            key={repo.id}
                            className="overflow-hidden p-0 transition-colors hover:border-ring/40"
                        >
                            <div className="flex items-start justify-between gap-4 px-5 py-4">
                                <div
                                    aria-hidden="true"
                                    className={cn(
                                        "-my-4 -ml-5 w-0.5 self-stretch",
                                        repo.isConnected ? "bg-[var(--chart-1)]" : "bg-transparent"
                                    )}
                                />

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                        <h3 className="truncate text-base font-semibold" title={repo.full_name}>
                                            {repo.name}
                                        </h3>
                                        {repo.private ? (
                                            <Badge variant="outline" className="font-normal">Private</Badge>
                                        ) : null}
                                        {repo.fork ? (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <GitFork className="size-3" />
                                                Fork
                                            </span>
                                        ) : null}
                                    </div>

                                    {repo.description ? (
                                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                                            {repo.description}
                                        </p>
                                    ) : null}

                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        {repo.language ? (
                                            <span className="flex items-center gap-1.5">
                                                <span
                                                    className="size-2.5 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            LANGUAGE_COLORS[repo.language] ?? "var(--muted-foreground)"
                                                    }}
                                                />
                                                {repo.language}
                                            </span>
                                        ) : null}

                                        <span className="flex items-center gap-1.5">
                                            <Star className="size-3.5 fill-[var(--chart-3)] text-[var(--chart-3)]" />
                                            {repo.stargazers_count ?? 0}
                                        </span>

                                        {repo.updated_at ? (
                                            <span>
                                                Updated{" "}
                                                {formatDistanceToNow(new Date(repo.updated_at), {
                                                    addSuffix: true
                                                })}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        nativeButton={false}
                                        aria-label={`Open ${repo.full_name} on GitHub`}
                                        render={
                                            <a
                                                href={repo.html_url}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                            />
                                        }
                                    >
                                        <ExternalLink className="size-3.5" />
                                    </Button>

                                    <Button
                                        variant={repo.isConnected ? "secondary" : "default"}
                                        disabled={busy}
                                        onClick={() => toggleConnection(repo)}
                                    >
                                        {repo.isConnected ? (
                                            <>
                                                <Check className="size-3.5" />
                                                {busy ? "Disconnecting…" : "Connected"}
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="size-3.5" />
                                                {busy ? "Connecting…" : "Connect"}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )
                })}

                {isFetchingNextPage ? <RepositorySkeletonList count={5} /> : null}
            </div>

            {hasNextPage && !searchQuery ? <div ref={sentinelRef} className="h-px" /> : null}
        </div>
    )
}

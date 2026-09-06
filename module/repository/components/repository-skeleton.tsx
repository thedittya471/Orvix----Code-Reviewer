import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Mirrors RepositoryRow's layout so the list does not shift when data lands. */
export function RepositorySkeleton() {
    return (
        <Card className="p-0">
            <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                        <Skeleton className="h-5 w-44" />
                        <Skeleton className="h-3.5 w-16" />
                    </div>
                    <Skeleton className="mt-2 h-4 w-2/3" />
                    <div className="mt-3 flex items-center gap-4">
                        <Skeleton className="h-4 w-10" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Skeleton className="size-7 rounded-md" />
                    <Skeleton className="h-8 w-24 rounded-md" />
                </div>
            </div>
        </Card>
    )
}

export function RepositorySkeletonList({ count = 5 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }, (_, index) => (
                <RepositorySkeleton key={index} />
            ))}
        </>
    )
}

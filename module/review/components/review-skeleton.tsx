import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ReviewSkeleton() {
    return (
        <Card className="p-0">
            <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                        <Skeleton className="h-5 w-56" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="h-8 w-28 rounded-md" />
                </div>
            </div>
        </Card>
    )
}

export function ReviewSkeletonList({ count = 4 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }, (_, index) => (
                <ReviewSkeleton key={index} />
            ))}
        </>
    )
}

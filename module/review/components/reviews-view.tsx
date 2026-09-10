"use client"

import Link from "next/link"
import { AlertTriangle, GitPullRequest } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useReviews } from "@/module/review/hooks/use-reviews"
import { ReviewCard } from "@/module/review/components/review-card"
import { ReviewSkeletonList } from "@/module/review/components/review-skeleton"

export const ReviewsView = () => {
    const { data: reviews, isLoading, isError, refetch, isRefetching } = useReviews()

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-xl font-semibold">Reviews</h1>
                <p className="text-sm text-muted-foreground">
                    AI code reviews Orvix has posted on your connected repositories.
                </p>
            </div>

            {isLoading ? (
                <ReviewSkeletonList />
            ) : isError ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-14 text-center">
                    <AlertTriangle className="size-8 text-muted-foreground" />
                    <div>
                        <p className="font-medium">Could not load reviews</p>
                        <p className="text-sm text-muted-foreground">
                            Something went wrong fetching your reviews.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
                        {isRefetching ? "Retrying…" : "Try again"}
                    </Button>
                </div>
            ) : reviews && reviews.length > 0 ? (
                <div className="flex flex-col gap-3">
                    {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-14 text-center">
                    <GitPullRequest className="size-8 text-muted-foreground" />
                    <div>
                        <p className="font-medium">No reviews yet</p>
                        <p className="text-sm text-muted-foreground">
                            Open a pull request on a connected repository and Orvix will review it here.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href="/dashboard/repository" />}
                    >
                        Manage repositories
                    </Button>
                </div>
            )}
        </div>
    )
}

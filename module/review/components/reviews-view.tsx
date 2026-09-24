"use client"

import Link from "next/link"
import { useState } from "react"
import { AlertTriangle, GitPullRequest } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRequestReview } from "@/module/review/hooks/use-request-review"
import { useReviews } from "@/module/review/hooks/use-reviews"
import { ReviewCard } from "@/module/review/components/review-card"
import { ReviewSkeletonList } from "@/module/review/components/review-skeleton"

export const ReviewsView = () => {
    const { data: reviews, isLoading, isError, refetch, isRefetching } = useReviews()
    const [prUrl, setPrUrl] = useState("")
    const request = useRequestReview()

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-xl font-semibold">Reviews</h1>
                <p className="text-sm text-muted-foreground">
                    AI code reviews Orvix has posted on your connected repositories.
                </p>
            </div>

            <form
                className="rounded-lg border p-4"
                onSubmit={(event) => {
                    event.preventDefault()
                    if (!request.isPending) request.mutate(prUrl.trim())
                }}
            >
                <label htmlFor="review-pr-url" className="text-sm font-medium">Review a pull request</label>
                <p id="review-pr-help" className="mt-1 text-sm text-muted-foreground">
                    Paste an open, non-draft PR URL from a connected repository.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                        id="review-pr-url"
                        type="url"
                        required
                        value={prUrl}
                        onChange={(event) => {
                            setPrUrl(event.target.value)
                            request.reset()
                        }}
                        placeholder="https://github.com/owner/repo/pull/123"
                        aria-describedby="review-pr-help"
                        disabled={request.isPending}
                    />
                    <Button type="submit" disabled={request.isPending || !prUrl.trim()}>
                        {request.isPending ? "Queueing…" : "Review PR"}
                    </Button>
                </div>
                {request.isError ? <p role="alert" className="mt-2 text-sm text-destructive">{request.error.message}</p> : null}
                {request.isSuccess ? <p role="status" className="mt-2 text-sm text-muted-foreground">Review queued. Progress will appear below.</p> : null}
            </form>

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

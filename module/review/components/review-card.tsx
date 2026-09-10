"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
    CheckCircle2,
    ChevronDown,
    Clock,
    ExternalLink,
    GitPullRequest,
    XCircle
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from "@/components/ui/collapsible"
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message"
import { cn } from "@/lib/utils"

import type { ReviewListItem } from "../actions"

const STATUS_META = {
    completed: { label: "Completed", icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400" },
    failed: { label: "Failed", icon: XCircle, className: "text-destructive" },
    pending: { label: "Pending", icon: Clock, className: "text-amber-600 dark:text-amber-400" }
} as const

function statusMeta(status: string) {
    return STATUS_META[status as keyof typeof STATUS_META] ?? STATUS_META.pending
}

export function ReviewCard({ review }: { review: ReviewListItem }) {
    const [open, setOpen] = useState(false)

    const meta = statusMeta(review.status)
    const StatusIcon = meta.icon

    return (
        <Card className="overflow-hidden p-0">
            <Collapsible open={open} onOpenChange={setOpen}>
                <div className="flex items-start justify-between gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <GitPullRequest className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate font-medium">{review.prTitle}</span>
                            <Badge variant="outline" className="gap-1 font-normal">
                                <StatusIcon className={cn("size-3", meta.className)} />
                                {meta.label}
                            </Badge>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="truncate">{review.repository.fullName}</span>
                            <span>#{review.prNumber}</span>
                            <span>
                                {formatDistanceToNow(review.createdAt, { addSuffix: true })}
                            </span>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Open pull request on GitHub"
                            nativeButton={false}
                            render={
                                <a href={review.prUrl} target="_blank" rel="noopener noreferrer" />
                            }
                        >
                            <ExternalLink className="size-4" />
                        </Button>

                        <CollapsibleTrigger
                            render={<Button variant="outline" size="sm" className="gap-1.5" />}
                        >
                            {open ? "Hide review" : "View review"}
                            <ChevronDown
                                className={cn("size-4 transition-transform", open && "rotate-180")}
                            />
                        </CollapsibleTrigger>
                    </div>
                </div>

                <CollapsibleContent>
                    <div className="border-t bg-muted/30 px-5 py-4">
                        <Message from="assistant" className="max-w-full">
                            <MessageContent>
                                <MessageResponse>{review.review}</MessageResponse>
                            </MessageContent>
                        </Message>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    )
}

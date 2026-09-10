import Link from "next/link"
import { GitPullRequest, Plug, Search, Sparkles } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const STEPS = [
    {
        icon: Plug,
        title: "Connect a repository",
        body: "Connecting a repository installs a GitHub webhook for pull request and push events, then indexes the whole codebase into a vector store."
    },
    {
        icon: Search,
        title: "Stay in sync",
        body: "Every push to the default branch re-indexes only the files that changed, so review context never drifts from the code."
    },
    {
        icon: GitPullRequest,
        title: "Open a pull request",
        body: "Opening, reopening, or pushing to a non-draft pull request queues a review. Drafts are skipped until they are marked ready."
    },
    {
        icon: Sparkles,
        title: "Read the review",
        body: "Orvix retrieves related code, generates a review with a walkthrough and sequence diagram, and posts it as a single comment it keeps updated."
    }
]

export const DocsView = () => {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Documentation</h1>
                <p className="text-sm text-muted-foreground">
                    How Orvix reviews your pull requests.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {STEPS.map((step) => (
                    <Card key={step.title}>
                        <CardHeader>
                            <step.icon className="size-5 text-muted-foreground" />
                            <CardTitle className="text-base">{step.title}</CardTitle>
                            <CardDescription>{step.body}</CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Review statuses</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <p><span className="font-medium text-foreground">Pending</span> — queued or in progress. A review usually takes under a minute.</p>
                    <p><span className="font-medium text-foreground">Completed</span> — posted to the pull request. Re-runs update the same comment.</p>
                    <p><span className="font-medium text-foreground">Failed</span> — the reason is shown on the review card. Re-push to retry.</p>
                </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
                Manage connections on the{" "}
                <Link href="/dashboard/repository" className="underline underline-offset-4">
                    repositories page
                </Link>
                .
            </p>
        </div>
    )
}

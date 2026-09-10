import { NextRequest, NextResponse } from "next/server";

import { inngest } from "@/inngest/client"
import prisma from "@/lib/db"
import { reviewPullRequest } from "@/module/ai/actions"
import {
    changedFilesFromPush,
    decidePullRequestEvent,
    decidePushEvent,
    verifyGithubSignature,
    type PullRequestEvent,
    type PushEvent
} from "@/module/github/lib/webhook"

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text()
        const signature = req.headers.get("x-hub-signature-256")

        if (!verifyGithubSignature(rawBody, signature)) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
        }

        const event = req.headers.get("x-github-event")

        if (event === "ping") {
            return NextResponse.json({ ok: true })
        }

        if (event !== "pull_request" && event !== "push") {
            return NextResponse.json({ ok: true, ignored: event })
        }

        const payload = JSON.parse(rawBody) as PullRequestEvent | PushEvent

        const repository = await prisma.repository.findUnique({
            where: { githubId: BigInt(payload.repository.id) },
            select: { id: true, userId: true, owner: true, name: true }
        })

        if (!repository) {
            return NextResponse.json({ ok: true, ignored: "repository_not_connected" })
        }

        if (event === "push") {
            const push = payload as PushEvent
            const decision = decidePushEvent(push)

            if (decision.handle !== "reindex") {
                return NextResponse.json({ ok: true, ignored: decision.reason })
            }

            const { changed, removed } = changedFilesFromPush(push)

            await inngest.send({
                name: "repository.push",
                data: {
                    owner: repository.owner,
                    repo: repository.name,
                    userId: repository.userId,
                    changed,
                    removed
                }
            })

            return NextResponse.json({ ok: true, queued: "reindex" })
        }

        const pr = payload as PullRequestEvent
        const decision = decidePullRequestEvent(pr)

        if (decision.handle !== "review") {
            return NextResponse.json({ ok: true, ignored: decision.reason })
        }

        void reviewPullRequest(
            repository.owner,
            repository.name,
            pr.pull_request.number,
            pr.pull_request.title
        )
            .then((result) =>
                console.log(`[webhook] review for ${pr.repository.full_name} #${pr.pull_request.number}:`, result)
            )
            .catch((error) =>
                console.error(`[webhook] failed to queue review for ${pr.repository.full_name} #${pr.pull_request.number}:`, error)
            )

        return NextResponse.json({ ok: true, queued: "review" })
    } catch (error) {
        console.error("Error handling Github webhook:", error)
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
    }
}

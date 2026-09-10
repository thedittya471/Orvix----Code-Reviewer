import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/db"
import { verifyGithubSignature, type PullRequestEvent } from "@/module/github/lib/webhook"
import { reviewPullRequest } from "@/module/ai/lib/actions"

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
        if (event !== "pull_request") {
            return NextResponse.json({ ok: true, ignored: event })
        }

        const payload = JSON.parse(rawBody) as PullRequestEvent

        if (!["opened", "reopened", "synchronize"].includes(payload.action)) {
            return NextResponse.json({ ok: true, ignored: payload.action })
        }

        if (payload.pull_request.draft) {
            return NextResponse.json({ ok: true, ignored: "draft" })
        }

        const repository = await prisma.repository.findUnique({
            where: { githubId: BigInt(payload.repository.id) }
        })

        if (!repository) {
            return NextResponse.json({ ok: true, ignored: "repository_not_connected" })
        }

        console.log(
            `[webhook] ${payload.action} PR #${payload.pull_request.number} on ${payload.repository.full_name}`
        )

        const [owner, repoName] = payload.repository.full_name.split("/")
        
        void reviewPullRequest(owner, repoName, payload.pull_request.number)
            .then((result) =>
                console.log(`[webhook] queued review for ${payload.repository.full_name} #${payload.pull_request.number}:`, result)
            )
            .catch((error) =>
                console.error(`[webhook] failed to queue review for ${payload.repository.full_name} #${payload.pull_request.number}:`, error)
            )

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error("Error handling Github webhook:", error)
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
    }
}

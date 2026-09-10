import crypto from "node:crypto"

export type PullRequestEvent = {
    action: string
    number: number
    repository: {
        id: number
        name: string
        full_name: string
        owner: { login: string }
    }
    pull_request: {
        number: number
        title: string
        html_url: string
        draft: boolean
        head: { sha: string; ref: string }
        base: { ref: string }
    }
}

export function verifyGithubSignature(rawBody: string, signature: string | null) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET

    if (!secret || !signature) {
        return false
    }

    const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`

    if (expected.length !== signature.length) {
        return false
    }

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export type PushEvent = {
    ref: string
    repository: {
        id: number
        name: string
        full_name: string
        default_branch: string
        owner: { login: string }
    }
    commits: {
        added: string[]
        modified: string[]
        removed: string[]
    }[]
}

const REVIEWABLE_ACTIONS = ["opened", "reopened", "synchronize"]

export type IgnoreDecision = { handle: "ignore"; reason: string }
export type ReviewDecision = { handle: "review" } | IgnoreDecision
export type ReindexDecision = { handle: "reindex" } | IgnoreDecision

export function decidePullRequestEvent(payload: PullRequestEvent): ReviewDecision {
    if (!REVIEWABLE_ACTIONS.includes(payload.action)) {
        return { handle: "ignore", reason: payload.action }
    }

    if (payload.pull_request.draft) {
        return { handle: "ignore", reason: "draft" }
    }

    return { handle: "review" }
}

export function decidePushEvent(payload: PushEvent): ReindexDecision {
    if (payload.ref !== `refs/heads/${payload.repository.default_branch}`) {
        return { handle: "ignore", reason: "non_default_branch" }
    }

    const { changed, removed } = changedFilesFromPush(payload)

    if (changed.length === 0 && removed.length === 0) {
        return { handle: "ignore", reason: "no_file_changes" }
    }

    return { handle: "reindex" }
}

export function changedFilesFromPush(payload: PushEvent) {
    const changed = new Set<string>()
    const removed = new Set<string>()

    for (const commit of payload.commits ?? []) {
        for (const path of [...(commit.added ?? []), ...(commit.modified ?? [])]) {
            changed.add(path)
            removed.delete(path)
        }

        for (const path of commit.removed ?? []) {
            removed.add(path)
            changed.delete(path)
        }
    }

    return { changed: [...changed], removed: [...removed] }
}

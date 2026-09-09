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

"use client"

import * as React from "react"

import { signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

/**
 * Re-runs the GitHub OAuth flow to mint a fresh access token.
 *
 * Not a link to /login: requireUnAuth sends signed-in users straight back to
 * the dashboard, and a rejected GitHub token does not invalidate the Orvix
 * session — so that route would just bounce. Re-authorising with the provider
 * is what actually replaces the stored token.
 */
export function ReconnectGithub({ callbackURL = "/dashboard" }: { callbackURL?: string }) {
    const [pending, setPending] = React.useState(false)

    const reconnect = async () => {
        if (pending) return
        setPending(true)

        try {
            await signIn.social({ provider: "github", callbackURL })
        } finally {
            setPending(false)
        }
    }

    return (
        <Button size="sm" disabled={pending} onClick={reconnect}>
            {pending ? "Redirecting…" : "Reconnect GitHub"}
        </Button>
    )
}

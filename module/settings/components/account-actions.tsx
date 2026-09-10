"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { AlertTriangle, LogOut, Unplug } from "lucide-react"
import { toast } from "sonner"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signOut } from "@/lib/auth-client"

import { disconnectGithub } from "../actions"

export function AccountActions() {
    const router = useRouter()
    const [signingOut, setSigningOut] = useState(false)
    const [disconnectOpen, setDisconnectOpen] = useState(false)

    const handleSignOut = async () => {
        if (signingOut) return
        setSigningOut(true)

        try {
            await signOut()
            router.push("/login")
            router.refresh()
        } finally {
            setSigningOut(false)
        }
    }

    const disconnectMutation = useMutation({
        mutationFn: async () => await disconnectGithub(),
        onSuccess: async (result) => {
            if (!result?.success) {
                toast.error(result?.error ?? "Failed to disconnect GitHub")
                return
            }

            setDisconnectOpen(false)
            toast.success("GitHub disconnected")

            await signOut()
            router.push("/login")
            router.refresh()
        },
        onError: () => {
            toast.error("Failed to disconnect GitHub")
        }
    })

    const busy = signingOut || disconnectMutation.isPending

    return (
        <Card>
            <CardHeader>
                <CardTitle>Account access</CardTitle>
                <CardDescription>
                    Sign out of this device, or remove Orvix&apos;s access to your GitHub account.
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
                    <div className="min-w-0">
                        <p className="text-sm font-medium">Sign out</p>
                        <p className="text-sm text-muted-foreground">
                            End your session on this device. Your repositories stay connected.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" disabled={busy} onClick={handleSignOut}>
                        <LogOut className="size-3.5" />
                        {signingOut ? "Signing out…" : "Sign out"}
                    </Button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 px-4 py-3">
                    <div className="min-w-0">
                        <p className="text-sm font-medium">Disconnect GitHub</p>
                        <p className="text-sm text-muted-foreground">
                            Disconnects every repository and removes your stored GitHub token.
                        </p>
                    </div>

                    <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
                        <AlertDialogTrigger
                            render={
                                <Button variant="outline" size="sm" disabled={busy}>
                                    <Unplug className="size-3.5" />
                                    Disconnect
                                </Button>
                            }
                        />
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertTriangle className="size-5 text-destructive" />
                                <AlertDialogTitle>Disconnect GitHub?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This removes the Orvix webhook from every connected repository,
                                    deletes their indexed code, and forgets your GitHub token. You
                                    will be signed out and need to authorise GitHub again to use
                                    Orvix.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={disconnectMutation.isPending}>
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    variant="destructive"
                                    disabled={disconnectMutation.isPending}
                                    onClick={() => disconnectMutation.mutate()}
                                >
                                    {disconnectMutation.isPending ? "Disconnecting…" : "Disconnect"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    )
}

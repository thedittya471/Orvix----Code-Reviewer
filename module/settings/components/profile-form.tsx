"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

import { getUserProfile, updateUserProfile } from "../actions"

function initialsOf(name?: string | null, email?: string | null) {
    const source = name?.trim() || email?.trim() || ""

    if (!source) {
        return "?"
    }

    const parts = source.split(/[\s@._-]+/).filter(Boolean)

    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
}

export function ProfileForm() {
    const queryClient = useQueryClient()
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState<string | null>(null)

    const { data: profile, isLoading } = useQuery({
        queryKey: ["user-profile"],
        queryFn: async () => await getUserProfile(),
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false
    })

    const name = draft ?? profile?.name ?? ""

    const updateMutation = useMutation({
        mutationFn: async (data: { name: string }) => {
            return await updateUserProfile(data)
        },
        onSuccess: (result) => {
            if (result?.success) {
                setDraft(null)
                setEditing(false)
                queryClient.invalidateQueries({ queryKey: ["user-profile"] })
                toast.success("Profile updated successfully")
                return
            }

            toast.error(result?.error ?? "Failed to update profile")
        },
        onError: () => {
            toast.error("Failed to update profile")
        }
    })

    const cancelEditing = () => {
        setDraft(null)
        setEditing(false)
    }

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        updateMutation.mutate({ name })
    }

    const isDirty = name.trim().length > 0 && name !== (profile?.name || "")

    return (
        <Card>
            <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                    Your name as it appears across Orvix. Email comes from GitHub.
                </CardDescription>

                {!isLoading && profile && !editing ? (
                    <CardAction>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit account details"
                            onClick={() => setEditing(true)}
                        >
                            <Pencil className="size-4" />
                        </Button>
                    </CardAction>
                ) : null}
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="flex items-center gap-4">
                        <Skeleton className="size-12 rounded-full" />
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-56" />
                        </div>
                    </div>
                ) : !profile ? (
                    <p className="text-sm text-muted-foreground">
                        We could not load your profile. Please refresh and try again.
                    </p>
                ) : editing ? (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder="Your name"
                                className="max-w-sm"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={profile.email}
                                readOnly
                                disabled
                                className="max-w-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Managed by GitHub and cannot be changed here.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
                                {updateMutation.isPending ? "Saving…" : "Save changes"}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                disabled={updateMutation.isPending}
                                onClick={cancelEditing}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <Avatar size="lg">
                                {profile.image ? (
                                    <AvatarImage src={profile.image} alt={profile.name ?? "User avatar"} />
                                ) : null}
                                <AvatarFallback>{initialsOf(profile.name, profile.email)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="truncate font-medium">{profile.name || "Unnamed"}</p>
                                <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
                            </div>
                        </div>

                        <dl className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs text-muted-foreground">Name</dt>
                                <dd className="mt-0.5 text-sm">{profile.name || "—"}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">Email</dt>
                                <dd className="mt-0.5 truncate text-sm">{profile.email}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">Member since</dt>
                                <dd className="mt-0.5 text-sm">
                                    {format(profile.createdAt, "d MMM yyyy")}
                                </dd>
                            </div>
                        </dl>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

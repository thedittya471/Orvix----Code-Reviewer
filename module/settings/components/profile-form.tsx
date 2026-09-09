"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { getUserProfile, updateUserProfile } from "../actions"

export function ProfileForm() {
    const queryClient = useQueryClient()
    const [draft, setDraft] = useState<{ name: string; email: string } | null>(null)

    const {data:profile, isLoading} = useQuery({
        queryKey:["user-profile"],
        queryFn:async() => await getUserProfile(),
        staleTime:1000 * 60 * 5,
        refetchOnWindowFocus:false
    })

    const name = draft?.name ?? profile?.name ?? ""
    const email = draft?.email ?? profile?.email ?? ""

    const updateMutation = useMutation({
        mutationFn: async (data: {name:string; email:string}) => {
            return await updateUserProfile(data)
        },
        onSuccess:(result) => {
            if(result?.success) {
                setDraft(null)
                queryClient.invalidateQueries({queryKey:["user-profile"]})
                toast.success("Profile updated successfully")
                return
            }

            toast.error(result?.error ?? "Failed to update profile")
        },
        onError:() => {
            toast.error("Failed to update profile")
        }
    })

    const handleSubmit = (e:React.FormEvent) => {
        e.preventDefault()
        updateMutation.mutate({name, email})
    }

    const isDirty =
        name !== (profile?.name || "") || email !== (profile?.email || "")

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                    Your name and email as they appear across Orvix.
                </CardDescription>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-8 w-full max-w-sm" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-8 w-full max-w-sm" />
                        </div>
                        <Skeleton className="h-8 w-28 rounded-md" />
                    </div>
                ) : !profile ? (
                    <p className="text-sm text-muted-foreground">
                        We could not load your profile. Please refresh and try again.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(event) => setDraft({ name: event.target.value, email })}
                                placeholder="Your name"
                                className="max-w-sm"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) => setDraft({ name, email: event.target.value })}
                                placeholder="you@example.com"
                                className="max-w-sm"
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                disabled={!isDirty || updateMutation.isPending}
                            >
                                {updateMutation.isPending ? "Saving…" : "Save changes"}
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    )
}

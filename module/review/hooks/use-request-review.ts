"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { requestReview } from "../actions"

export function useRequestReview() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (prUrl: string) => {
            const result = await requestReview(prUrl)
            if (!result.success) throw new Error(result.message)
            return result
        },
        onSuccess: () => toast.success("Review queued"),
        onError: (error) => toast.error(error.message),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["reviews"] })
    })
}

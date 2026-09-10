"use client"

import { useQuery } from "@tanstack/react-query"

import { getReviews } from "../actions"

export const useReviews = () => {
    return useQuery({
        queryKey: ["reviews"],
        queryFn: async () => {
            return await getReviews()
        },
        refetchInterval: (query) =>
            query.state.data?.some((review) => review.status === "pending") ? 5000 : false
    })
}

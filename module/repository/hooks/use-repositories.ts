"use client"
import { useInfiniteQuery } from "@tanstack/react-query"
import { fetchRepositories } from "../actions"

export const useRepositories = () => {
    return useInfiniteQuery({
        queryKey:["repositories"],
        queryFn:async({pageParam = 1}) => {
            const data = await fetchRepositories(pageParam , 10)
            return data
        },
        getNextPageParam:(lastPage, allPages) => {
            // Stop paging on a failed page too, or the sentinel would keep
            // asking for the next one forever.
            if(lastPage.error || lastPage.items.length < 10) return undefined;
            return allPages.length + 1
        },
        initialPageParam:1,
    })
}
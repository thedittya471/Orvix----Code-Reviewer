import { QueryClient, isServer } from "@tanstack/react-query"

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // staleTime defaults to 0, which made every remount refetch —
                // that is why one dashboard visit fired the actions twice.
                staleTime: 5 * 60 * 1000,
                refetchOnWindowFocus: false
            }
        }
    })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
    // The server needs a fresh client per request; the browser must reuse one,
    // or a re-render would throw away the hydrated cache.
    if (isServer) {
        return makeQueryClient()
    }

    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient()
    }

    return browserQueryClient
}

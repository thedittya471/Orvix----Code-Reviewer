import { cache } from "react"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"

/**
 * Per-request memoised session lookup. The layout's requireAuth and the
 * dashboard action both need the session; without cache() that is two
 * identical lookups on every render.
 */
export const getCurrentSession = cache(async () => {
    return auth.api.getSession({
        headers: await headers()
    })
})

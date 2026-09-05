import { createAuthClient } from "better-auth/react"

// No baseURL: the client defaults to the current origin, which is correct on
// localhost, preview deploys, and production alike. BETTER_AUTH_URL is not
// NEXT_PUBLIC_-prefixed, so it is always undefined in the browser bundle.
export const { useSession, signIn, signOut, signUp } = createAuthClient()
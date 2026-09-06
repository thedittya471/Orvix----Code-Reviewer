"use server"

import { getCurrentSession } from "@/lib/session"
import { redirect } from "next/navigation"

export const requireAuth = async () => {
    const session = await getCurrentSession()

    if (!session){
        redirect("/login")
    }

    return session
}

export const requireUnAuth = async () => {
    const session = await getCurrentSession()

    if (session){
        redirect("/dashboard")
    }

    return session
}


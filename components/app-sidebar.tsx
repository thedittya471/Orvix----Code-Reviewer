"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
    BookOpen,
    GitPullRequest,
    FolderGit2,
    LayoutDashboard,
    LogIn,
    LogOut,
    Moon,
    Settings,
    Sun,
} from "lucide-react"

import { signOut, useSession } from "@/lib/auth-client"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSkeleton,
    SidebarRail,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { OrvixLogo } from "@/components/brand/orvix-logo"

type NavItem = {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    /** Match nested routes as well, e.g. /reviews/123. */
    nested?: boolean
}

const workspaceNav: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Repositories", href: "/dashboard/repositories", icon: FolderGit2, nested: true },
    { title: "Reviews", href: "/dashboard/reviews", icon: GitPullRequest, nested: true },
]

const resourcesNav: NavItem[] = [
    { title: "Documentation", href: "/docs", icon: BookOpen, nested: true },
    { title: "Settings", href: "/dashboard/settings", icon: Settings, nested: true },
]

function isItemActive(pathname: string, item: NavItem) {
    if (pathname === item.href) return true
    return item.nested ? pathname.startsWith(`${item.href}/`) : false
}

function initialsOf(name?: string | null, email?: string | null) {
    const source = name?.trim() || email?.trim() || ""
    if (!source) return "?"
    const parts = source.split(/[\s@._-]+/).filter(Boolean)
    return parts.slice(0, 2).map((part) => part[0]!.toUpperCase()).join("") || "?"
}

const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
    const pathname = usePathname()
    const router = useRouter()
    const { resolvedTheme, setTheme } = useTheme()
    const { data: session, isPending } = useSession()

    const [signingOut, setSigningOut] = React.useState(false)

    const user = session?.user

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

    const renderNav = (items: NavItem[]) =>
        items.map((item) => (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                    isActive={isItemActive(pathname, item)}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        ))

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            tooltip="Orvix"
                            render={<Link href="/dashboard" aria-label="Orvix home" />}
                            className="gap-2"
                        >
                            <OrvixLogo className="flex items-center gap-2 [&>svg]:shrink-0" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>{renderNav(workspaceNav)}</SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="mt-auto">
                    <SidebarGroupLabel>Resources</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>{renderNav(resourcesNav)}</SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarSeparator />

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Toggle theme"
                            onClick={() =>
                                setTheme(resolvedTheme === "dark" ? "light" : "dark")
                            }
                        >
                            {/* Driven by the `dark` class so there is no hydration flash. */}
                            <Moon className="size-4 dark:hidden" />
                            <Sun className="hidden size-4 dark:block" />
                            <span>
                                <span className="dark:hidden">Dark mode</span>
                                <span className="hidden dark:inline">Light mode</span>
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        {isPending ? (
                            <SidebarMenuSkeleton showIcon />
                        ) : user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <SidebarMenuButton
                                            size="lg"
                                            tooltip={user.name || user.email || "Account"}
                                        />
                                    }
                                >
                                    <Avatar size="sm">
                                        {user.image ? (
                                            <AvatarImage src={user.image} alt={user.name ?? "User avatar"} />
                                        ) : null}
                                        <AvatarFallback>{initialsOf(user.name, user.email)}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left leading-tight">
                                        <span className="truncate text-sm font-medium">
                                            {user.name || "Account"}
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {user.email}
                                        </span>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="top" align="end" className="min-w-56">
                                    <DropdownMenuLabel className="truncate">
                                        {user.email}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        render={<Link href="/dashboard/settings" />}
                                    >
                                        <Settings className="size-4" />
                                        Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        disabled={signingOut}
                                        onClick={handleSignOut}
                                    >
                                        <LogOut className="size-4" />
                                        {signingOut ? "Signing out…" : "Sign out"}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <SidebarMenuButton
                                tooltip="Sign in"
                                render={<Link href="/login" />}
                            >
                                <LogIn className="size-4" />
                                <span>Sign in</span>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}

export { AppSidebar }
export default AppSidebar

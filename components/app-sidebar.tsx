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

import { signOut } from "@/lib/auth-client"
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
    SidebarRail,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
    { title: "Repositories", href: "/dashboard/repository", icon: FolderGit2, nested: true },
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

export type SidebarUser = {
    name?: string | null
    email?: string | null
    image?: string | null
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
    /**
     * Handed down from the layout, which already resolved the session server-side.
     * Calling useSession() here would refetch the same session over the network
     * on every page load just to render a name and an avatar.
     */
    user?: SidebarUser | null
}

const AppSidebar = ({ user, ...props }: AppSidebarProps) => {
    const pathname = usePathname()
    const router = useRouter()
    const { resolvedTheme, setTheme } = useTheme()
    const [signingOut, setSigningOut] = React.useState(false)

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
                        {user ? (
                            <DropdownMenu>
                                {/* openOnHover on the menu rather than a HoverCard:
                                    Base UI's preview card is for non-interactive
                                    previews, and this popup holds real controls that
                                    need focus management and keyboard access. */}
                                <DropdownMenuTrigger
                                    openOnHover
                                    delay={150}
                                    closeDelay={200}
                                    render={<SidebarMenuButton size="lg" />}
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
                                <DropdownMenuContent
                                    side="right"
                                    align="end"
                                    sideOffset={8}
                                    className="w-72 min-w-72 p-2"
                                >
                                    <div className="flex items-center gap-3 px-1.5 py-2.5">
                                        <Avatar size="lg">
                                            {user.image ? (
                                                <AvatarImage src={user.image} alt={user.name ?? "User avatar"} />
                                            ) : null}
                                            <AvatarFallback>{initialsOf(user.name, user.email)}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid min-w-0 flex-1 leading-tight">
                                            <span className="truncate text-sm font-medium">
                                                {user.name || "Account"}
                                            </span>
                                            <span className="truncate text-xs text-muted-foreground">
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        // Keep the menu open so the theme change is
                                        // visible without reopening it.
                                        closeOnClick={false}
                                        onClick={() =>
                                            setTheme(resolvedTheme === "dark" ? "light" : "dark")
                                        }
                                        className="py-1.5"
                                    >
                                        {/* Driven by the `dark` class so there is no hydration flash. */}
                                        <Moon className="size-4 dark:hidden" />
                                        <Sun className="hidden size-4 dark:block" />
                                        <span className="dark:hidden">Dark mode</span>
                                        <span className="hidden dark:inline">Light mode</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        render={<Link href="/dashboard/settings" />}
                                        className="py-1.5"
                                    >
                                        <Settings className="size-4" />
                                        Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        disabled={signingOut}
                                        onClick={handleSignOut}
                                        className="py-1.5"
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

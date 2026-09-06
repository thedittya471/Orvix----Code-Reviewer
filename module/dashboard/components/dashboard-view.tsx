"use client"
import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { GitCommit, GitPullRequest, MessageSquare, GitBranch } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getDashboardData } from "@/module/dashboard/actions"
import { ContributionHeatmap } from "@/module/dashboard/components/contribution-heatmap"

// chart-2 / chart-3 are a colourblind-safe pair against the dark surface
// (deutan ΔE 17.3). chart-4 against chart-2 is not (ΔE 3.3) — don't swap them in.
const activityConfig = {
  commits: { label: "Commits", color: "var(--chart-1)" },
  prs: { label: "Pull requests", color: "var(--chart-2)" },
  reviews: { label: "AI reviews", color: "var(--chart-3)" },
} satisfies ChartConfig

type StatCardProps = {
  title: string
  value: number | undefined
  description: string
  icon: React.ComponentType<{ className?: string }>
  isLoading: boolean
}

const StatCard = ({ title, value, description, icon: Icon, isLoading }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="size-4 shrink-0 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <div className="text-3xl font-semibold tabular-nums tracking-tight">
          {(value ?? 0).toLocaleString("en-US")}
        </div>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
)

const ChartEmpty = ({ isLoading }: { isLoading: boolean }) =>
  isLoading ? (
    <Skeleton className="aspect-video w-full" />
  ) : (
    <div className="flex aspect-video w-full items-center justify-center rounded-md border border-dashed">
      <p className="text-sm text-muted-foreground">No activity in the last 6 months.</p>
    </div>
  )

export const DashboardView = () => {

  const {data, isLoading} = useQuery({
    queryKey:["dashboard"],
    queryFn: async() => await getDashboardData()
  })

  const stats = data?.stats
  const monthlyActivity = data?.monthlyActivity
  const calendar = data?.calendar

  const hasActivity = Boolean(monthlyActivity?.length)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your GitHub activity and review coverage over the last 6 months.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Commits"
          value={stats?.totalCommits}
          description="Contributions in the last year"
          icon={GitCommit}
          isLoading={isLoading}
        />
        <StatCard
          title="Pull requests"
          value={stats?.totalPRs}
          description="Opened by you in the last year"
          icon={GitPullRequest}
          isLoading={isLoading}
        />
        <StatCard
          title="AI reviews"
          value={stats?.totalReviews}
          description="Completed by Orvix"
          icon={MessageSquare}
          isLoading={isLoading}
        />
        <StatCard
          title="Repositories"
          value={stats?.totalRepos}
          description="Connected to Orvix"
          icon={GitBranch}
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contributions</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading the last year of activity"
              : `${(calendar?.totalContributions ?? 0).toLocaleString("en-US")} contributions in the last year`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContributionHeatmap days={calendar?.days ?? []} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Commits sit on their own axis: they run an order of magnitude above PRs
          and reviews, and sharing one scale would flatten those two to nothing. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commits</CardTitle>
            <CardDescription>Monthly contribution volume</CardDescription>
          </CardHeader>
          <CardContent>
            {hasActivity ? (
              <ChartContainer config={activityConfig}>
                <AreaChart data={monthlyActivity} margin={{ left: 4, right: 12, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis width={36} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="commits"
                    type="monotone"
                    stroke="var(--color-commits)"
                    strokeWidth={2}
                    fill="var(--color-commits)"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <ChartEmpty isLoading={isLoading} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pull requests &amp; reviews</CardTitle>
            <CardDescription>Opened versus reviewed, by month</CardDescription>
          </CardHeader>
          <CardContent>
            {hasActivity ? (
              <ChartContainer config={activityConfig}>
                <LineChart data={monthlyActivity} margin={{ left: 4, right: 12, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis width={36} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    dataKey="prs"
                    type="monotone"
                    stroke="var(--color-prs)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    dataKey="reviews"
                    type="monotone"
                    stroke="var(--color-reviews)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <ChartEmpty isLoading={isLoading} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

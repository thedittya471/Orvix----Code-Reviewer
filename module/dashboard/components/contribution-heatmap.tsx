"use client"

import * as React from "react"
import { ActivityCalendar, type Activity } from "react-activity-calendar"
import { useTheme } from "next-themes"

import "react-activity-calendar/tooltips.css"

import { Skeleton } from "@/components/ui/skeleton"

export type ContributionDay = {
  date: string
  count: number
}

const CALENDAR_THEME = {
  light: [
    "oklch(0.94 0.004 285)",
    "oklch(0.85 0.06 285)",
    "oklch(0.74 0.10 285)",
    "oklch(0.62 0.14 285)",
    "oklch(0.50 0.18 285)",
  ],
  dark: [
    "oklch(0.22 0.012 285)",
    "oklch(0.35 0.07 285)",
    "oklch(0.47 0.11 285)",
    "oklch(0.60 0.14 285)",
    "oklch(0.72 0.17 285)",
  ],
}

function buildThresholds(days: ContributionDay[]) {
  const active = days
    .map((day) => day.count)
    .filter((count) => count > 0)
    .sort((a, b) => a - b)

  if (!active.length) return [1, 2, 3]

  const at = (q: number) => active[Math.min(active.length - 1, Math.floor(active.length * q))]

  const first = at(0.25)
  const second = Math.max(at(0.5), first + 1)
  const third = Math.max(at(0.75), second + 1)

  return [first, second, third]
}

function levelOf(count: number, thresholds: number[]) {
  if (count <= 0) return 0
  if (count <= thresholds[0]) return 1
  if (count <= thresholds[1]) return 2
  if (count <= thresholds[2]) return 3
  return 4
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

type ContributionHeatmapProps = {
  days: ContributionDay[]
  isLoading: boolean
}

export function ContributionHeatmap({ days, isLoading }: ContributionHeatmapProps) {
  const { resolvedTheme } = useTheme()

  const data = React.useMemo<Activity[]>(() => {
    const thresholds = buildThresholds(days)

    return days.map((day) => ({
      date: day.date,
      count: day.count,
      level: levelOf(day.count, thresholds),
    }))
  }, [days])


  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (isLoading || !isMounted) {
    return <Skeleton className="h-35 w-full" />
  }

  if (!data.length) {
    return (
      <div className="flex h-35 w-full items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">No contributions to show.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-1">
      {/* w-max keeps horizontal scrolling intact on narrow screens; mx-auto
          centres the calendar when the card is wider than a year of blocks. */}
      <div className="mx-auto w-max">
        <ActivityCalendar
          data={data}
          theme={CALENDAR_THEME}
          colorScheme={resolvedTheme === "light" ? "light" : "dark"}
          weekStart={0}
          blockSize={12}
          blockMargin={3}
          blockRadius={2}
          fontSize={12}
          showWeekdayLabels
          showTotalCount={false}
          labels={{ legend: { less: "Less", more: "More" } }}
          tooltips={{
            activity: {
              text: (activity) =>
                `${activity.count} contribution${activity.count === 1 ? "" : "s"} on ${formatDate(activity.date)}`,
            },
          }}
        />
      </div>
    </div>
  )
}

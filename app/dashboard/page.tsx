"use client"

import { useEffect, useState } from "react"
import { useCalendarStore } from "@/store/calendar-store"
import { CalendarView } from "@/components/calendar/calendar-view"
import { CalendarControls } from "@/components/calendar/calendar-controls"
import { PostSheet } from "@/components/calendar/post-sheet"
import { StatsCards } from "@/components/dashboard/StatsCards"
import type { CalendarPost } from "@/types"

export default function DashboardPage() {
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const { currentWeekStart, getWeekEnd, setStats, stats } = useCalendarStore()

  useEffect(() => {
    const weekEnd = getWeekEnd()
    const params = new URLSearchParams({
      from: currentWeekStart.toISOString(),
      to: weekEnd.toISOString(),
    })

    fetch(`/api/posts?${params}`)
      .then((res) => res.json())
      .then((data: CalendarPost[]) => {
        setPosts(data)
        setStats({
          total: data.length,
          published: data.filter((p) => p.status === "PUBLISHED").length,
          scheduled: data.filter((p) => p.status === "PENDING").length,
          failed: data.filter((p) => p.status === "FAILED").length,
        })
      })
      .catch(() => {})
  }, [currentWeekStart, getWeekEnd, setStats])

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="px-3 pt-4 md:px-6">
        <StatsCards stats={stats} />
      </div>
      <CalendarControls />
      <CalendarView posts={posts} />
      <PostSheet />
    </div>
  )
}

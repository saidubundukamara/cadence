"use client"

import { useEffect, useState, useCallback } from "react"
import { useCalendarStore } from "@/store/calendar-store"
import { CalendarView } from "@/components/calendar/calendar-view"
import { CalendarMonthView } from "@/components/calendar/calendar-month-view"
import { CalendarControls } from "@/components/calendar/calendar-controls"
import { PostSheet } from "@/components/calendar/post-sheet"
import { StatsCards } from "@/components/dashboard/StatsCards"
import type { CalendarPost } from "@/types"

export default function DashboardPage() {
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const {
    currentWeekStart,
    viewMode,
    getDateRangeStart,
    getDateRangeEnd,
    setStats,
    stats,
  } = useCalendarStore()

  const fetchPosts = useCallback(() => {
    const rangeStart = getDateRangeStart()
    const rangeEnd = getDateRangeEnd()
    const params = new URLSearchParams({
      from: rangeStart.toISOString(),
      to: rangeEnd.toISOString(),
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
  }, [getDateRangeStart, getDateRangeEnd, setStats])

  useEffect(() => {
    fetchPosts()
  }, [currentWeekStart, viewMode, fetchPosts])

  async function handleReschedule(postId: string, newDate: Date) {
    const iso = newDate.toISOString()
    let previous: CalendarPost[] = []
    setPosts((curr) => {
      previous = curr
      return curr.map((p) =>
        p.id === postId ? { ...p, scheduledAt: iso } : p
      )
    })
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: iso }),
      })
      if (!res.ok) {
        setPosts(previous)
      }
    } catch {
      setPosts(previous)
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="px-3 pt-4 md:px-6">
        <StatsCards stats={stats} />
      </div>
      <CalendarControls />
      {viewMode === "week" ? (
        <CalendarView posts={posts} onReschedule={handleReschedule} />
      ) : (
        <CalendarMonthView posts={posts} />
      )}
      <PostSheet />
    </div>
  )
}

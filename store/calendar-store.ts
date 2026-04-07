import { create } from "zustand"
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isToday,
} from "date-fns"
import type { CalendarPost, PostStats } from "@/types"

type ViewMode = "week" | "month"

interface CalendarState {
  currentWeekStart: Date
  viewMode: ViewMode
  searchQuery: string
  platformFilter: "all" | "TWITTER" | "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "YOUTUBE"
  statusFilter: "all" | "PENDING" | "PUBLISHED" | "FAILED"
  selectedPostId: string | null
  stats: PostStats

  // Actions
  goToNext: () => void
  goToPrevious: () => void
  goToNextWeek: () => void
  goToPreviousWeek: () => void
  goToToday: () => void
  goToDate: (date: Date) => void
  setViewMode: (mode: ViewMode) => void
  setSearchQuery: (query: string) => void
  setPlatformFilter: (filter: CalendarState["platformFilter"]) => void
  setStatusFilter: (filter: CalendarState["statusFilter"]) => void
  selectPost: (id: string) => void
  clearSelection: () => void
  setStats: (stats: PostStats) => void

  // Computed
  getWeekDays: () => Date[]
  getWeekEnd: () => Date
  getMonthDays: () => Date[]
  getDateRangeStart: () => Date
  getDateRangeEnd: () => Date
  isCurrentWeek: () => boolean
  getFilteredPosts: (posts: CalendarPost[]) => CalendarPost[]
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentWeekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
  viewMode: "week",
  searchQuery: "",
  platformFilter: "all",
  statusFilter: "all",
  selectedPostId: null,
  stats: { total: 0, published: 0, scheduled: 0, failed: 0 },

  goToNext: () =>
    set((state) => ({
      currentWeekStart:
        state.viewMode === "week"
          ? addWeeks(state.currentWeekStart, 1)
          : startOfWeek(addMonths(state.currentWeekStart, 1), { weekStartsOn: 1 }),
    })),

  goToPrevious: () =>
    set((state) => ({
      currentWeekStart:
        state.viewMode === "week"
          ? subWeeks(state.currentWeekStart, 1)
          : startOfWeek(subMonths(state.currentWeekStart, 1), { weekStartsOn: 1 }),
    })),

  goToNextWeek: () =>
    set((state) => ({
      currentWeekStart: addWeeks(state.currentWeekStart, 1),
    })),

  goToPreviousWeek: () =>
    set((state) => ({
      currentWeekStart: subWeeks(state.currentWeekStart, 1),
    })),

  goToToday: () =>
    set({
      currentWeekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
    }),

  goToDate: (date: Date) =>
    set({
      currentWeekStart: startOfWeek(date, { weekStartsOn: 1 }),
    }),

  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setPlatformFilter: (filter) => set({ platformFilter: filter }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  selectPost: (id) => set({ selectedPostId: id }),
  clearSelection: () => set({ selectedPostId: null }),
  setStats: (stats) => set({ stats }),

  getWeekDays: () => {
    const { currentWeekStart } = get()
    return eachDayOfInterval({
      start: currentWeekStart,
      end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
    })
  },

  getWeekEnd: () => {
    const { currentWeekStart } = get()
    return endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  },

  getMonthDays: () => {
    const { currentWeekStart } = get()
    const monthStart = startOfMonth(currentWeekStart)
    const monthEnd = endOfMonth(currentWeekStart)
    // Extend to full weeks
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  },

  getDateRangeStart: () => {
    const { viewMode, currentWeekStart } = get()
    if (viewMode === "month") {
      return startOfWeek(startOfMonth(currentWeekStart), { weekStartsOn: 1 })
    }
    return currentWeekStart
  },

  getDateRangeEnd: () => {
    const { viewMode, currentWeekStart } = get()
    if (viewMode === "month") {
      return endOfWeek(endOfMonth(currentWeekStart), { weekStartsOn: 1 })
    }
    return endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  },

  isCurrentWeek: () => {
    const days = get().getWeekDays()
    return days.some((d) => isToday(d))
  },

  getFilteredPosts: (posts) => {
    const { searchQuery, platformFilter, statusFilter } = get()

    return posts.filter((post) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!post.content.toLowerCase().includes(query)) return false
      }

      if (platformFilter !== "all") {
        if (!post.platforms.includes(platformFilter)) return false
      }

      if (statusFilter !== "all") {
        if (post.status !== statusFilter) return false
      }

      return true
    })
  },
}))

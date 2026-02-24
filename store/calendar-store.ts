import { create } from "zustand"
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isToday,
} from "date-fns"
import type { CalendarPost } from "@/types"

interface CalendarState {
  currentWeekStart: Date
  searchQuery: string
  platformFilter: "all" | "TWITTER" | "FACEBOOK" | "INSTAGRAM"
  statusFilter: "all" | "PENDING" | "PUBLISHED" | "FAILED"
  selectedPostId: string | null

  // Actions
  goToNextWeek: () => void
  goToPreviousWeek: () => void
  goToToday: () => void
  goToDate: (date: Date) => void
  setSearchQuery: (query: string) => void
  setPlatformFilter: (filter: CalendarState["platformFilter"]) => void
  setStatusFilter: (filter: CalendarState["statusFilter"]) => void
  selectPost: (id: string) => void
  clearSelection: () => void

  // Computed
  getWeekDays: () => Date[]
  getWeekEnd: () => Date
  isCurrentWeek: () => boolean
  getFilteredPosts: (posts: CalendarPost[]) => CalendarPost[]
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentWeekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
  searchQuery: "",
  platformFilter: "all",
  statusFilter: "all",
  selectedPostId: null,

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

  setSearchQuery: (query) => set({ searchQuery: query }),
  setPlatformFilter: (filter) => set({ platformFilter: filter }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  selectPost: (id) => set({ selectedPostId: id }),
  clearSelection: () => set({ selectedPostId: null }),

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

"use client"

import { format } from "date-fns"
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useCalendarStore } from "@/store/calendar-store"
import { cn } from "@/lib/utils"

const platformOptions = [
  { value: "all", label: "All Platforms" },
  { value: "TWITTER", label: "X (Twitter)" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "YOUTUBE", label: "YouTube" },
] as const

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PUBLISHED", label: "Published" },
  { value: "FAILED", label: "Failed" },
] as const

export function CalendarControls() {
  const {
    currentWeekStart,
    searchQuery,
    setSearchQuery,
    platformFilter,
    setPlatformFilter,
    statusFilter,
    setStatusFilter,
    goToToday,
    goToDate,
    goToPreviousWeek,
    goToNextWeek,
    getWeekEnd,
    isCurrentWeek,
  } = useCalendarStore()

  const weekEnd = getWeekEnd()
  const hasActiveFilters = platformFilter !== "all" || statusFilter !== "all"

  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-3 py-4 md:px-6">
      {/* Search */}
      <div className="relative max-w-xs flex-1 min-w-36 md:min-w-48">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Navigation group */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={goToPreviousWeek}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          disabled={isCurrentWeek()}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={goToNextWeek}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Date range display with picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            {format(currentWeekStart, "MMM d")} &ndash;{" "}
            {format(weekEnd, "MMM d, yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={currentWeekStart}
            onSelect={(date) => date && goToDate(date)}
          />
        </PopoverContent>
      </Popover>

      {/* Filters — pushed to the right */}
      <div className="ml-auto">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <SlidersHorizontal className="size-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Platform</label>
              <div className="flex flex-col gap-0.5">
                {platformOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPlatformFilter(opt.value as typeof platformFilter)}
                    className={cn(
                      "flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                      platformFilter === opt.value && "bg-muted font-medium"
                    )}
                  >
                    {opt.label}
                    {platformFilter === opt.value && (
                      <Check className="size-3.5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Status</label>
              <div className="flex flex-col gap-0.5">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value as typeof statusFilter)}
                    className={cn(
                      "flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                      statusFilter === opt.value && "bg-muted font-medium"
                    )}
                  >
                    {opt.label}
                    {statusFilter === opt.value && (
                      <Check className="size-3.5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setPlatformFilter("all")
                  setStatusFilter("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

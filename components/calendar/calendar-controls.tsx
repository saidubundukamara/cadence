"use client"

import { format } from "date-fns"
import { Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCalendarStore } from "@/store/calendar-store"

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
    getWeekEnd,
    isCurrentWeek,
  } = useCalendarStore()

  const weekEnd = getWeekEnd()
  const hasActiveFilters = platformFilter !== "all" || statusFilter !== "all"

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Today button */}
      <Button
        variant="outline"
        size="sm"
        onClick={goToToday}
        disabled={isCurrentWeek()}
      >
        Today
      </Button>

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

      {/* Filters */}
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
          <div className="space-y-2">
            <label className="text-xs font-medium">Platform</label>
            <Select
              value={platformFilter}
              onValueChange={(v) => setPlatformFilter(v as typeof platformFilter)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="TWITTER">X (Twitter)</SelectItem>
                <SelectItem value="FACEBOOK">Facebook</SelectItem>
                <SelectItem value="INSTAGRAM">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium">Status</label>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
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
  )
}

"use client"

import { CalendarDays, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useCalendarStore } from "@/store/calendar-store"
import type { PostStats } from "@/types"

interface StatsCardsProps {
  stats: PostStats
}

const cards = [
  {
    key: "total" as const,
    label: "Total Posts",
    icon: CalendarDays,
    filter: "all" as const,
    color: "text-foreground",
  },
  {
    key: "published" as const,
    label: "Published",
    icon: CheckCircle,
    filter: "PUBLISHED" as const,
    color: "text-green-500",
  },
  {
    key: "scheduled" as const,
    label: "Scheduled",
    icon: Clock,
    filter: "PENDING" as const,
    color: "text-blue-500",
  },
  {
    key: "failed" as const,
    label: "Failed",
    icon: AlertCircle,
    filter: "FAILED" as const,
    color: "text-red-500",
  },
]

export function StatsCards({ stats }: StatsCardsProps) {
  const { setStatusFilter } = useCalendarStore()

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.key}
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() => setStatusFilter(card.filter)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className={`size-5 ${card.color}`} />
              <div>
                <p className="text-2xl font-bold">{stats[card.key]}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

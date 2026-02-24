"use client"

import { HOUR_HEIGHT, HOURS_IN_DAY, formatHourLabel } from "./calendar-utils"

export function CalendarHoursColumn() {
  return (
    <div className="relative w-16 shrink-0 border-r">
      {Array.from({ length: HOURS_IN_DAY }, (_, i) => (
        <div
          key={i}
          className="relative border-b border-border/50"
          style={{ height: HOUR_HEIGHT }}
        >
          <span className="absolute -top-2.5 right-2 text-[10px] text-muted-foreground">
            {formatHourLabel(i)}
          </span>
        </div>
      ))}
    </div>
  )
}

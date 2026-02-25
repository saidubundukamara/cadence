"use client"

import { HOUR_HEIGHT, HOURS_24 } from "./calendar-utils"

export function CalendarHoursColumn() {
  return (
    <div className="relative w-14 shrink-0 border-r pt-6 md:w-[80px] lg:w-[104px]">
      {HOURS_24.map((label, i) => (
        <div
          key={i}
          className="relative border-b border-border"
          style={{ height: HOUR_HEIGHT }}
        >
          <span className="absolute -top-3 left-1 right-1 text-right text-[10px] leading-tight text-muted-foreground md:left-2 md:right-2 md:text-xs lg:text-sm">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

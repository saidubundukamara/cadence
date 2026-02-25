"use client"

import { useState, useEffect } from "react"
import { getCurrentTimePosition } from "./calendar-utils"

export function CurrentTimeIndicator() {
  const [top, setTop] = useState(getCurrentTimePosition())

  useEffect(() => {
    const interval = setInterval(() => {
      setTop(getCurrentTimePosition())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="pointer-events-none absolute right-0 left-0 z-20"
      style={{ top: top + 24 }}
    >
      <div className="flex items-center">
        <div className="size-2 rounded-full bg-red-500" />
        <div className="h-px flex-1 bg-red-500" />
      </div>
    </div>
  )
}

import { Fragment } from "react"

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const hours = ["9 AM", "11 AM", "1 PM", "3 PM"]

const posts = [
  { day: 0, hour: 0, label: "LinkedIn Article", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" },
  { day: 1, hour: 1, label: "Twitter Thread", color: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400" },
  { day: 2, hour: 2, label: "Instagram Reel", color: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400" },
  { day: 3, hour: 0, label: "Blog Post", color: "bg-accent-mint/30 text-accent-mint-dark" },
  { day: 4, hour: 3, label: "Newsletter", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" },
  { day: 1, hour: 3, label: "Facebook Post", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400" },
  { day: 3, hour: 2, label: "Twitter Poll", color: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400" },
]

export function ProductMockupCalendar() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg shadow-black/[0.04] rotate-1">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-accent-mint" />
          <span className="text-sm font-medium">Week of Jan 13, 2026</span>
        </div>
        <div className="flex gap-1.5">
          <div className="size-6 rounded-lg bg-muted/60" />
          <div className="size-6 rounded-lg bg-muted/60" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[auto_repeat(5,1fr)]">
        {/* Header row */}
        <div className="border-b border-r border-border/30 p-2" />
        {days.map((day) => (
          <div
            key={day}
            className="border-b border-r border-border/30 p-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {/* Time rows */}
        {hours.map((hour, hourIdx) => (
          <Fragment key={hour}>
            <div
              className="border-r border-b border-border/30 p-2 text-xs text-muted-foreground whitespace-nowrap"
            >
              {hour}
            </div>
            {days.map((_, dayIdx) => {
              const post = posts.find((p) => p.day === dayIdx && p.hour === hourIdx)
              return (
                <div
                  key={`${dayIdx}-${hourIdx}`}
                  className="border-r border-b border-border/30 p-1 min-h-[3rem]"
                >
                  {post && (
                    <div
                      className={`rounded-lg px-2 py-1 text-[10px] font-medium leading-tight transition-transform duration-300 hover:scale-105 ${post.color}`}
                    >
                      {post.label}
                    </div>
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

export const HOUR_HEIGHT = 120 // pixels per hour slot
export const HOURS_IN_DAY = 24
export const TOTAL_HEIGHT = HOURS_IN_DAY * HOUR_HEIGHT // 2880px
export const INITIAL_SCROLL_OFFSET = 9 * HOUR_HEIGHT // auto-scroll to 9 AM (1080px)

export function getPostTopPosition(scheduledAt: Date | string): number {
  const date = typeof scheduledAt === "string" ? new Date(scheduledAt) : scheduledAt
  const hours = date.getHours()
  const minutes = date.getMinutes()
  return (hours * 60 + minutes) * (HOUR_HEIGHT / 60)
}

export function getPostHeight(durationMinutes: number = 30): number {
  const height = durationMinutes * (HOUR_HEIGHT / 60)
  return Math.max(height, 30) // minimum 30px
}

export function getCurrentTimePosition(): number {
  const now = new Date()
  return getPostTopPosition(now)
}

export function formatHourLabel(hour: number): string {
  if (hour === 0) return "12 AM"
  if (hour === 12) return "12 PM"
  if (hour < 12) return `${hour} AM`
  return `${hour - 12} PM`
}

export const HOURS_24 = Array.from({ length: 24 }, (_, i) => formatHourLabel(i))

export function getPostVariant(height: number): "short" | "medium" | "full" {
  if (height < 50) return "short"
  if (height < 90) return "medium"
  return "full"
}

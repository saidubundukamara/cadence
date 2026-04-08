interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  hint: string
}

export function EmptyState({ icon, title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 px-4 py-5 text-center">
      <div className="text-[var(--color-muted-foreground)]">{icon}</div>
      <div className="text-xs font-semibold">{title}</div>
      <div className="text-[11px] text-[var(--color-muted-foreground)]">{hint}</div>
    </div>
  )
}

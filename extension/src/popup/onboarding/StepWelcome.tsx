import { Bookmark, FolderHeart, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

export function StepWelcome() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Hero */}
      <div className="relative mb-6 h-36 w-full overflow-hidden rounded-xl bg-gradient-to-br from-[color-mix(in_oklch,var(--color-primary)_14%,transparent)] via-[color-mix(in_oklch,var(--color-primary)_6%,transparent)] to-transparent">
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[color-mix(in_oklch,var(--color-primary)_22%,transparent)] blur-2xl" />
        <div className="absolute -bottom-8 -right-6 h-28 w-28 rounded-full bg-[color-mix(in_oklch,var(--color-primary)_18%,transparent)] blur-2xl" />

        {/* Floating inspiration card */}
        <motion.div
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-1/2 top-1/2 w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--color-border)] bg-white p-3 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)]"
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600" />
            <div className="flex flex-col gap-0.5">
              <div className="h-1.5 w-16 rounded bg-[var(--color-muted)]" />
              <div className="h-1.5 w-10 rounded bg-[var(--color-muted)]" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-full rounded bg-[var(--color-muted)]" />
            <div className="h-1.5 w-4/5 rounded bg-[var(--color-muted)]" />
          </div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 280, damping: 18 }}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg"
          >
            <Bookmark className="size-3.5 fill-white" />
          </motion.div>
        </motion.div>
      </div>

      <h2 className="font-heading text-[24px] font-[700] leading-[1.15] tracking-[-0.025em]">
        Save the stuff you'll want later
      </h2>
      <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">
        Bookmarks pile up and you never look at them again. Cadence is the opposite of that.
      </p>

      <div className="mt-5 grid w-full grid-cols-3 gap-2">
        {[
          { icon: Bookmark, label: "Save anywhere" },
          { icon: FolderHeart, label: "Organize" },
          { icon: Sparkles, label: "Revisit" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/50 p-2.5"
          >
            <Icon className="size-4 text-[var(--color-primary)]" />
            <span className="text-[10px] font-medium text-[var(--color-muted-foreground)]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

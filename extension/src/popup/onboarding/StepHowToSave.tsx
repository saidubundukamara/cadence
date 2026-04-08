import { motion } from "framer-motion"
import { Bookmark, Check } from "lucide-react"

export function StepHowToSave() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Animated mock post */}
      <div className="relative mb-6 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4">
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-3">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600" />
            <div className="flex flex-col gap-1">
              <div className="h-1.5 w-20 rounded bg-[var(--color-muted)]" />
              <div className="h-1.5 w-14 rounded bg-[var(--color-muted)]/70" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-1.5 w-full rounded bg-[var(--color-muted)]" />
            <div className="h-1.5 w-5/6 rounded bg-[var(--color-muted)]" />
            <div className="h-1.5 w-2/3 rounded bg-[var(--color-muted)]" />
          </div>

          {/* Save button */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 260, damping: 18 }}
            className="absolute right-6 top-6"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ delay: 0.6, duration: 0.45 }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg shadow-[color-mix(in_oklch,var(--color-primary)_40%,transparent)]"
            >
              <Bookmark className="size-4 fill-white" />
            </motion.div>
          </motion.div>

          {/* Saved pill */}
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.1, duration: 0.3 }}
            className="absolute -right-1 -top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md"
          >
            <Check className="size-3" strokeWidth={3} />
            Saved
          </motion.div>
        </div>
      </div>

      <h2 className="font-heading text-[24px] font-[700] leading-[1.15] tracking-[-0.025em]">
        One click to save
      </h2>
      <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">
        Look for the Cadence button on a post. One click saves it.
      </p>

      {/* Platform chips */}
      <div className="mt-5 flex items-center gap-1.5">
        {[
          { label: "X", bg: "#000" },
          { label: "in", bg: "#0077b5" },
          { label: "r/", bg: "#ff4500" },
        ].map(({ label, bg }) => (
          <div
            key={label}
            className="flex h-7 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-2.5 text-[11px] font-semibold"
          >
            <span
              className="flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-bold text-white"
              style={{ background: bg }}
            >
              {label[0]}
            </span>
            {label === "X" ? "Twitter" : label === "in" ? "LinkedIn" : "Reddit"}
          </div>
        ))}
      </div>
    </div>
  )
}

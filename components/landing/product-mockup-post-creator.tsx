import { Check } from "lucide-react"

const platforms = [
  { name: "Twitter / X", active: true, color: "bg-sky-400" },
  { name: "LinkedIn", active: true, color: "bg-blue-600" },
  { name: "Facebook", active: false, color: "bg-blue-500" },
]

export function ProductMockupPostCreator() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg shadow-black/[0.04] -rotate-1">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-muted/30">
        <span className="text-sm font-medium">New Post</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Draft</span>
          <div className="size-2 rounded-full bg-amber-400" />
        </div>
      </div>

      {/* Platform selectors */}
      <div className="border-b border-border/50 px-4 py-3">
        <p className="text-xs text-muted-foreground mb-2">Platforms</p>
        <div className="flex gap-2">
          {platforms.map((p) => (
            <div
              key={p.name}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                p.active
                  ? "border-accent-mint/60 bg-accent-mint-bg text-foreground/80"
                  : "border-border/50 text-muted-foreground"
              }`}
            >
              <div className={`size-2 rounded-full ${p.color}`} />
              {p.name}
              {p.active && <Check className="size-3 text-accent-mint-dark" />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-sm leading-relaxed">
            Excited to announce our new AI-powered scheduling features!
          </p>
          <p className="text-sm leading-relaxed mt-2">
            Now you can write once and publish everywhere with platform-optimized content.
          </p>
          <p className="text-sm leading-relaxed mt-2 text-accent-mint-dark">
            #ProductUpdate #SocialMedia #AI
          </p>
        </div>

        {/* Schedule */}
        <div className="flex items-center justify-between rounded-xl border border-border/50 px-3 py-2">
          <div>
            <p className="text-xs text-muted-foreground">Scheduled for</p>
            <p className="text-sm font-medium">Jan 15, 2026 &middot; 10:00 AM</p>
          </div>
          <div className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background">
            Schedule
          </div>
        </div>
      </div>
    </div>
  )
}

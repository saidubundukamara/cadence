import { Sparkles } from "lucide-react"

export function ProductMockupAI() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg shadow-black/[0.04] rotate-1">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent-mint-dark" />
          <span className="text-sm font-medium">AI Content Generator</span>
        </div>
        <span className="rounded-full bg-accent-mint-bg px-2 py-0.5 text-xs text-muted-foreground">GPT-4o</span>
      </div>

      {/* Input */}
      <div className="border-b border-border/50 px-4 py-3">
        <p className="text-xs text-muted-foreground mb-1.5">Your topic</p>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-sm">Launching our new scheduling feature for social media managers</p>
        </div>
      </div>

      {/* Generated output */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Generated 3 variations</p>
        </div>

        {/* Variation 1 -- highlighted */}
        <div className="rounded-xl border border-accent-mint/40 bg-accent-mint-bg p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-accent-mint-dark">Twitter / X</span>
            <span className="text-[10px] text-muted-foreground">247 chars</span>
          </div>
          <p className="text-sm leading-relaxed">
            Stop juggling 5 tabs to post on social media. Our new scheduler lets you write once and publish everywhere. AI adapts your message for each platform automatically.
          </p>
        </div>

        {/* Variation 2 */}
        <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">LinkedIn</span>
            <span className="text-[10px] text-muted-foreground">412 chars</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Social media managers: how much time do you spend reformatting the same post for different platforms? We just launched something that changes that...
          </p>
        </div>
      </div>
    </div>
  )
}

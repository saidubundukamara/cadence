import Image from "next/image"
import { Chrome } from "lucide-react"

export function ProductMockupExtension() {
  return (
    <div className="relative -rotate-1">
      {/* Browser chrome wrapper */}
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg shadow-black/[0.06]">
        {/* Browser top bar */}
        <div className="flex items-center gap-2 border-b border-border/50 bg-muted/40 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-red-400/70" />
            <div className="size-2.5 rounded-full bg-amber-400/70" />
            <div className="size-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <div className="ml-3 flex flex-1 items-center gap-2 rounded-md bg-background/70 px-3 py-1">
            <Chrome className="size-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">x.com / @cadence_inspo</span>
          </div>
        </div>

        {/* Screenshot */}
        <div className="relative bg-muted/20 p-4">
          <Image
            src="/extension.png"
            alt="Cadence Chrome extension popup showing recently saved posts and inspiration boards"
            width={420}
            height={680}
            className="mx-auto h-auto w-full max-w-[340px] rounded-2xl border border-border/60 shadow-xl shadow-black/[0.08]"
            priority={false}
          />
        </div>
      </div>

      {/* Floating "Saved" pill */}
      <div className="absolute -bottom-3 -left-4 z-20 flex items-center gap-2 rounded-full border border-accent-mint/40 bg-card px-3 py-1.5 shadow-lg shadow-black/[0.06] rotate-3">
        <div className="flex size-5 items-center justify-center rounded-full bg-accent-mint-bg">
          <span className="text-xs leading-none">&#x1F516;</span>
        </div>
        <span className="text-xs font-semibold">Saved to Default</span>
      </div>
    </div>
  )
}

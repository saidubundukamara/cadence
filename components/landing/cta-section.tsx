"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useScrollReveal } from "@/hooks/use-scroll-reveal"

/* ── Hand-drawn SVG decorations ── */

function HandDrawnStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2L14.5 8.5L21 9.5L16 14L17.5 21L12 17.5L6.5 21L8 14L3 9.5L9.5 8.5L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HandDrawnArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 24" fill="none" className={className}>
      <path
        d="M4 12C8 11 16 8 24 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M20 8L24 12L20 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WavyUnderline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 8"
      fill="none"
      preserveAspectRatio="none"
      className={className}
    >
      <path
        d="M0 5C10 1 20 9 30 5C40 1 50 9 60 5C70 1 80 9 90 5C95 3 98 4 100 5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ── Avatar circles for social proof ── */

const avatars = [
  { initials: "SK", bg: "bg-accent-mint" },
  { initials: "JM", bg: "bg-accent-mint-dark" },
  { initials: "AL", bg: "bg-accent-mint-light" },
  { initials: "TR", bg: "bg-accent-mint/70" },
]

/* ── CTA Section ── */

export function CtaSection() {
  const ref = useScrollReveal<HTMLElement>()

  return (
    <section className="py-20" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative">
          {/* ── Floating micro-badges (outside the card) ── */}
          <div className="animate-float absolute -top-4 -right-2 z-20 rotate-3 rounded-full border border-accent-mint/30 bg-background px-3 py-1.5 text-xs font-semibold shadow-md md:-top-5 md:right-6">
            <span className="mr-1">&#10024;</span> AI Powered
          </div>
          <div className="animate-float absolute -bottom-4 -left-2 z-20 -rotate-2 rounded-full border border-accent-mint/30 bg-background px-3 py-1.5 text-xs font-semibold shadow-md [animation-delay:3s] md:-bottom-5 md:left-6">
            <span className="mr-1">&#128640;</span> Free to start
          </div>

          {/* ── Gradient border wrapper ── */}
          <div className="rounded-3xl bg-gradient-to-br from-accent-mint/30 via-transparent to-accent-mint/20 p-px">
            {/* ── Main CTA card ── */}
            <div
              className="scroll-reveal-scale relative overflow-hidden rounded-3xl bg-accent-mint-bg p-10 text-center md:p-16"
              style={{
                backgroundImage:
                  "radial-gradient(circle, oklch(0.82 0.1 160 / 0.07) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              {/* Soft blob decorations */}
              <div className="pointer-events-none absolute -top-16 -right-16 h-[250px] w-[300px] rounded-full bg-accent-mint/20 blur-[60px]" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-[200px] w-[250px] rounded-full bg-accent-mint/15 blur-[50px]" />

              {/* ── Hand-drawn stars in corners ── */}
              <HandDrawnStar className="pointer-events-none absolute top-5 left-5 size-5 text-accent-mint/40 md:top-8 md:left-8 md:size-6" />
              <HandDrawnStar className="pointer-events-none absolute top-6 right-10 size-4 text-accent-mint/30 md:top-10 md:right-14 md:size-5" />
              <HandDrawnStar className="pointer-events-none absolute bottom-8 right-6 size-5 text-accent-mint/35 md:bottom-10 md:right-10 md:size-6" />

              {/* ── Hand-drawn arrows pointing toward CTA ── */}
              <HandDrawnArrow className="pointer-events-none absolute bottom-28 left-6 hidden size-10 -rotate-12 text-accent-mint/30 md:left-12 md:block md:size-12" />
              <HandDrawnArrow className="pointer-events-none absolute bottom-28 right-6 hidden size-10 rotate-[192deg] text-accent-mint/30 md:right-12 md:block md:size-12" />

              {/* ── Content ── */}
              <div className="relative z-10 mx-auto max-w-2xl space-y-5">
                <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold md:text-4xl lg:text-5xl">
                  Ready to find your{" "}
                  <span className="relative inline-block">
                    rhythm
                    <WavyUnderline className="absolute -bottom-1.5 left-0 h-2 w-full text-accent-mint" />
                  </span>
                  ?
                </h2>

                <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                  Join creators and teams who use Cadence to save hours every week
                  on social media management. Start for free, no credit card required.
                </p>

                <Button
                  size="lg"
                  asChild
                  className="h-12 rounded-full bg-foreground px-8 text-base text-background transition-all duration-300 hover:scale-[1.02] hover:bg-foreground/90 active:scale-[0.98]"
                >
                  <Link href="/register">Start Scheduling Free</Link>
                </Button>

                {/* ── Social proof row ── */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <div className="flex -space-x-2">
                    {avatars.map((a) => (
                      <div
                        key={a.initials}
                        className={`flex size-8 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold text-white ${a.bg}`}
                      >
                        {a.initials}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Join 500+ creators
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

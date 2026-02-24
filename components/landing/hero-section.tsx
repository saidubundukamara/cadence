import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProductMockupCalendar } from "./product-mockup-calendar"

/* ------------------------------------------------------------------ */
/*  Hand-drawn SVG decorations                                        */
/* ------------------------------------------------------------------ */

function HandDrawnStar({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <path
        d="M10 2L11.5 7.5L17 7.5L12.5 11L14 17L10 13L6 17L7.5 11L3 7.5L8.5 7.5Z"
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
    <svg
      width="60"
      height="40"
      viewBox="0 0 60 40"
      fill="none"
      className={className}
    >
      <path
        d="M5 30C15 28 25 15 50 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M44 6L50 10L44 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HandDrawnCircle({ className }: { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
    >
      <path
        d="M16 4C24 3 29 10 28 18C27 26 20 30 12 28C4 26 2 18 4 12C6 6 12 5 16 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Floating micro-cards                                              */
/* ------------------------------------------------------------------ */

function MicroCardPublished() {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card px-3.5 py-2.5 shadow-lg shadow-black/[0.06]">
      <div className="flex size-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
        <span className="text-sm leading-none">&#x2705;</span>
      </div>
      <div>
        <p className="text-xs font-semibold leading-tight">Post Published</p>
        <p className="text-[10px] text-muted-foreground">2m ago</p>
      </div>
      <div className="ml-1 size-2 rounded-full bg-emerald-500" />
    </div>
  )
}

function MicroCardEngagement() {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card px-3.5 py-2.5 shadow-lg shadow-black/[0.06]">
      <div className="flex size-7 items-center justify-center rounded-full bg-accent-mint-bg">
        <span className="text-sm leading-none">&#x1F4C8;</span>
      </div>
      <div>
        <p className="text-xs font-semibold leading-tight text-emerald-600 dark:text-emerald-400">+47% engagement</p>
        <p className="text-[10px] text-muted-foreground">this week</p>
      </div>
    </div>
  )
}

function MicroCardAvatar() {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card px-3.5 py-2.5 shadow-lg shadow-black/[0.06]">
      <div className="flex size-7 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
        SK
      </div>
      <div>
        <p className="text-xs font-semibold leading-tight">Sarah K.</p>
        <p className="text-[10px] text-muted-foreground">Content Manager</p>
      </div>
    </div>
  )
}

function MicroCardAI() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-accent-mint/40 bg-accent-mint-bg px-3 py-1.5 shadow-lg shadow-black/[0.06]">
      <Sparkles className="size-3.5 text-accent-mint-dark" />
      <span className="text-xs font-semibold text-accent-mint-dark">AI Generated</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Hero Section                                                      */
/* ------------------------------------------------------------------ */

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pt-28 pb-20">
      {/* Hand-drawn stars scattered around the hero */}
      <HandDrawnStar className="pointer-events-none absolute top-24 left-[12%] text-accent-mint opacity-60 hidden lg:block" />
      <HandDrawnStar className="pointer-events-none absolute top-44 right-[8%] text-accent-mint-dark opacity-50 hidden lg:block" />
      <HandDrawnStar className="pointer-events-none absolute bottom-32 left-[6%] text-accent-mint opacity-40 hidden lg:block" />

      <div className="hero-animate relative z-10 mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Left -- Text */}
          <div className="relative max-w-xl">
            {/* Badge */}
            <Badge
              variant="outline"
              className="mb-6 gap-1.5 rounded-full border-accent-mint/40 bg-accent-mint-bg px-3 py-1.5 text-foreground/70"
            >
              <Sparkles className="size-3.5 text-accent-mint-dark" />
              AI-Powered Scheduling
            </Badge>

            {/* Headline */}
            <h1 className="font-[family-name:var(--font-heading)] font-bold text-5xl leading-[1.1] md:text-6xl lg:text-7xl">
              Your social media,{" "}
              <span className="relative">
                on demand.
                {/* Brush-style underline accent */}
                <svg
                  className="absolute -bottom-2 left-0 h-3 w-full text-accent-mint"
                  viewBox="0 0 200 12"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 8 C 30 2, 60 12, 100 6 C 140 0, 170 10, 198 4"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Write once, publish everywhere. Cadence uses AI to craft
              platform-perfect posts, schedule them at optimal times, and grow
              your audience.
            </p>

            {/* Hand-drawn arrow pointing from subtitle toward CTAs */}
            <div className="relative mt-2 mb-1 hidden lg:block">
              <HandDrawnArrow className="text-accent-mint-dark opacity-70" />
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-4 lg:mt-2">
              <Button
                size="lg"
                asChild
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Link href="/register">Get Started Free</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="rounded-full h-12 px-8 text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <a href="#features">See How It Works</a>
              </Button>

              {/* Small hand-drawn scribble circle near CTAs */}
              <HandDrawnCircle className="pointer-events-none absolute -right-2 bottom-0 text-accent-mint opacity-40 hidden lg:block" />
            </div>
          </div>

          {/* Right -- Floating product cards + micro-cards (desktop) */}
          <div className="relative hidden lg:block">
            {/* Soft mint blob behind cards */}
            <div className="pointer-events-none absolute inset-0 -top-12 rounded-full bg-accent-mint/15 blur-[60px]" />

            {/* Main card -- calendar */}
            <div className="animate-float relative z-10">
              <ProductMockupCalendar />
            </div>

            {/* Micro-card: Post Published -- top-right, overlapping */}
            <div
              className="absolute -top-4 -right-4 z-20 rotate-2 animate-float"
              style={{ animationDelay: "-1.5s" }}
            >
              <MicroCardPublished />
            </div>

            {/* Micro-card: Engagement -- bottom-left, overlapping */}
            <div
              className="absolute -bottom-6 -left-8 z-20 -rotate-2 animate-float"
              style={{ animationDelay: "-3s" }}
            >
              <MicroCardEngagement />
            </div>

            {/* Micro-card: Avatar -- top-left, overlapping */}
            <div
              className="absolute -top-8 -left-10 z-20 -rotate-1 animate-float"
              style={{ animationDelay: "-4.5s" }}
            >
              <MicroCardAvatar />
            </div>

            {/* Micro-card: AI Generated badge -- bottom-right */}
            <div
              className="absolute -bottom-2 right-8 z-20 rotate-1 animate-float"
              style={{ animationDelay: "-2s" }}
            >
              <MicroCardAI />
            </div>

            {/* Hand-drawn curvy arrow from cards area towards headline */}
            <svg
              width="120"
              height="80"
              viewBox="0 0 120 80"
              fill="none"
              className="pointer-events-none absolute -left-16 top-1/2 z-0 -translate-y-1/2 text-accent-mint opacity-50"
            >
              <path
                d="M110 65C85 60 50 50 30 35C20 27 12 18 8 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M12 4L8 10L15 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Mobile -- single calendar mockup below */}
        <div className="mt-12 lg:hidden">
          <ProductMockupCalendar />
        </div>
      </div>
    </section>
  )
}

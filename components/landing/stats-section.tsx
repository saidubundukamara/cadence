"use client"

import { useScrollReveal } from "@/hooks/use-scroll-reveal"

/* ─── Hand-drawn SVG icons ─────────────────────────────────────────── */

function LightningIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      className="text-accent-mint-dark mb-3"
    >
      <path
        d="M18 4L8 18H15L13 28L24 14H17L18 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* speed lines */}
      <path
        d="M4 12L7 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={0.5}
      />
      <path
        d="M5 17L8 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={0.5}
      />
    </svg>
  )
}

function ConnectedNodesIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      className="text-accent-mint-dark mb-3"
    >
      {/* three circles connected by wobbly lines */}
      <circle cx="7" cy="16" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="25" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="25" cy="23" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M10.5 15C14 13 17 10 21.5 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />
      <path
        d="M10.5 17C14 19 17 22 21.5 22.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />
    </svg>
  )
}

function ClockSunMoonIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      className="text-accent-mint-dark mb-3"
    >
      {/* clock circle */}
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.8" />
      {/* clock hands */}
      <path
        d="M16 10V16L20 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* small sun rays at top-right */}
      <circle cx="26" cy="6" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M26 2V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M29 3.5L28.3 4.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M30 6H29" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* small moon at bottom-left */}
      <path
        d="M4 26C4 24 5.5 22.5 7 22.5C5.5 22.5 4.5 21 5 19.5C3 20.5 2 23 4 26Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ─── Decorative elements ──────────────────────────────────────────── */

function CurvedArrow() {
  return (
    <svg
      width="64"
      height="40"
      viewBox="0 0 64 40"
      fill="none"
      className="text-accent-mint/40 hidden md:block"
    >
      <path
        d="M4 30C16 4 48 4 56 28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <path
        d="M52 22L56 28L50 30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ScatteredDots() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      className="text-accent-mint/30 hidden md:block"
    >
      <circle cx="8" cy="12" r="2" fill="currentColor" />
      <circle cx="22" cy="6" r="1.5" fill="currentColor" />
      <circle cx="16" cy="28" r="2.5" fill="currentColor" />
      <circle cx="32" cy="18" r="1.8" fill="currentColor" />
      <path
        d="M30 30L33 27L36 30L33 33Z"
        fill="currentColor"
        opacity={0.6}
      />
      <path
        d="M6 32L7.5 28L9 32L7.5 36Z"
        fill="currentColor"
        opacity={0.4}
      />
    </svg>
  )
}

/* ─── Data ─────────────────────────────────────────────────────────── */

const stats = [
  {
    metric: "10x Faster",
    label: "Content Creation",
    description: "AI writes and adapts your posts in seconds, not hours.",
    icon: LightningIcon,
  },
  {
    metric: "3 Platforms",
    label: "One Dashboard",
    description: "Manage Twitter, LinkedIn, and Facebook from a single view.",
    highlighted: true,
    icon: ConnectedNodesIcon,
  },
  {
    metric: "24/7",
    label: "Auto Publishing",
    description: "Schedule posts ahead and let Cadence handle the rest.",
    icon: ClockSunMoonIcon,
  },
]

/* ─── Component ────────────────────────────────────────────────────── */

export function StatsSection() {
  const ref = useScrollReveal<HTMLElement>()

  return (
    <section id="stats" className="py-16" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="scroll-reveal mb-12 text-center">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl md:text-4xl">
            Why teams love{" "}
            <span className="italic text-accent-mint-dark">Cadence</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Real results from real teams shipping content every day.
          </p>

          {/* Decorative squiggle under heading */}
          <svg
            width="120"
            height="8"
            viewBox="0 0 120 8"
            fill="none"
            className="mx-auto mt-4 text-accent-mint/50"
          >
            <path
              d="M0 4C15 0 30 8 45 4C60 0 75 8 90 4C105 0 112 4 120 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Stats cards with decorative elements in between */}
        <div className="scroll-reveal relative flex flex-col items-center gap-6 md:flex-row md:items-stretch md:gap-0">
          {stats.map((stat, i) => (
            <div key={stat.metric} className="flex flex-col items-center md:contents">
              {/* Card */}
              <div
                className={`stagger-${i + 1} w-full max-w-sm flex-1 rounded-2xl border p-8 text-center transition-all duration-500 hover:-translate-y-1 hover:shadow-lg md:max-w-none ${
                  stat.highlighted
                    ? "border-accent-mint/50 bg-accent-mint-bg shadow-lg shadow-black/[0.04]"
                    : "border-border/60 bg-card hover:border-accent-mint/30"
                }`}
              >
                {/* Hand-drawn icon */}
                <div className="flex justify-center">
                  <stat.icon />
                </div>

                <span className="font-[family-name:var(--font-heading)] font-bold text-4xl md:text-5xl text-foreground">
                  {stat.metric}
                </span>
                <p className="mt-2 text-base font-semibold">{stat.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stat.description}
                </p>
              </div>

              {/* Decorative arrow / dots between cards (not after last) */}
              {i < stats.length - 1 && (
                <div className="hidden shrink-0 px-2 md:flex md:flex-col md:items-center md:justify-center md:gap-1">
                  {i === 0 ? <CurvedArrow /> : <ScatteredDots />}
                </div>
              )}
            </div>
          ))}

          {/* Floating scattered decorative stars - top-left & bottom-right */}
          <div className="pointer-events-none absolute -left-4 -top-6 hidden lg:block">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent-mint/25">
              <path
                d="M12 2L13.5 9L20 8L14.5 12L18 18L12 14L6 18L9.5 12L4 8L10.5 9L12 2Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="pointer-events-none absolute -bottom-6 -right-4 hidden lg:block">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-accent-mint/20">
              <path
                d="M10 1L11.5 7.5L18 7L12.5 10.5L15.5 16L10 12.5L4.5 16L7.5 10.5L2 7L8.5 7.5L10 1Z"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Additional scattered dots - visible on large screens */}
          <div className="pointer-events-none absolute -top-3 right-1/3 hidden lg:block">
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
              <circle cx="3" cy="3" r="2.5" fill="currentColor" className="text-accent-mint/20" />
            </svg>
          </div>
          <div className="pointer-events-none absolute -bottom-4 left-1/4 hidden lg:block">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <circle cx="4" cy="4" r="3" fill="currentColor" className="text-accent-mint/15" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import { useEffect, useRef } from "react"
import { Sparkles, CalendarDays, Share2 } from "lucide-react"
import { ProductMockupAI } from "./product-mockup-ai"
import { ProductMockupCalendar } from "./product-mockup-calendar"
import { ProductMockupPostCreator } from "./product-mockup-post-creator"

/* ─── Hand-drawn SVG helpers ───────────────────────────────────────── */

function HandDrawnCheck({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d="M3 8.5L6.5 12L13 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WavySquiggle() {
  return (
    <svg
      width="200"
      height="8"
      viewBox="0 0 200 8"
      fill="none"
      className="mt-5 text-accent-mint/50"
    >
      <path
        d="M0 4C20 0 40 8 60 4C80 0 100 8 120 4C140 0 160 8 180 4C190 2 195 3 200 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DividerWithStar() {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      {/* left dashed line */}
      <div className="h-px flex-1 max-w-[200px] border-t border-dashed border-border/60" />

      {/* hand-drawn star */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="shrink-0 text-accent-mint/40"
      >
        <path
          d="M10 2L11.8 7.5L17 7L12.8 10.5L15 16L10 12.8L5 16L7.2 10.5L3 7L8.2 7.5L10 2Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* right dashed line */}
      <div className="h-px flex-1 max-w-[200px] border-t border-dashed border-border/60" />
    </div>
  )
}

function DividerWithSquiggle() {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <div className="h-px flex-1 max-w-[180px] border-t border-dashed border-border/60" />

      <svg
        width="32"
        height="12"
        viewBox="0 0 32 12"
        fill="none"
        className="shrink-0 text-accent-mint/40"
      >
        <path
          d="M2 6C6 2 10 10 16 6C22 2 26 10 30 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      <div className="h-px flex-1 max-w-[180px] border-t border-dashed border-border/60" />
    </div>
  )
}

/** Small hand-drawn arrow that points from the text toward the mockup */
function PointingArrow({ reversed }: { reversed: boolean }) {
  return (
    <svg
      width="40"
      height="24"
      viewBox="0 0 40 24"
      fill="none"
      className={`hidden text-accent-mint/40 lg:block ${reversed ? "scale-x-[-1]" : ""}`}
    >
      <path
        d="M4 12C12 8 24 8 32 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="3 3"
      />
      <path
        d="M28 8L32 12L28 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ─── Feature data ─────────────────────────────────────────────────── */

const features = [
  {
    category: "AI Writing",
    icon: Sparkles,
    title: "AI-powered writing that sounds like you",
    description:
      "Tell Cadence what you want to say, and it generates platform-optimized variations for every channel — matching tone, length, and hashtag conventions automatically.",
    bullets: [
      "Generate multiple platform variations from one idea",
      "Automatic hashtag and mention suggestions",
      "Tone and style customization per platform",
    ],
    callout: "Save 3+ hours per week",
    mockup: <ProductMockupAI />,
    reversed: false,
  },
  {
    category: "Calendar",
    icon: CalendarDays,
    title: "A visual calendar built for content teams",
    description:
      "See your entire content pipeline at a glance. Drag, drop, and reschedule posts across a clean weekly or monthly view.",
    bullets: [
      "Week and month calendar views",
      "Color-coded posts by platform",
      "Drag-and-drop rescheduling",
    ],
    callout: "Never miss a posting window",
    mockup: <ProductMockupCalendar />,
    reversed: true,
  },
  {
    category: "Publishing",
    icon: Share2,
    title: "Publish everywhere from one place",
    description:
      "Connect your social accounts, choose your platforms, and schedule posts in one flow. Cadence handles formatting and publishing for each network.",
    bullets: [
      "One-click multi-platform scheduling",
      "Platform-specific content previews",
      "Automated publishing at optimal times",
    ],
    callout: "One click, every platform",
    mockup: <ProductMockupPostCreator />,
    reversed: false,
  },
]

/* ─── Feature block ────────────────────────────────────────────────── */

function FeatureBlock({
  feature,
}: {
  feature: (typeof features)[number]
}) {
  const textRef = useRef<HTMLDivElement>(null)
  const mockupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const elements = [textRef.current, mockupRef.current].filter(
      Boolean
    ) as HTMLElement[]
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={`grid items-center gap-12 lg:grid-cols-2 ${
        feature.reversed ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      {/* Text side */}
      <div
        ref={textRef}
        className={
          feature.reversed ? "scroll-reveal-right" : "scroll-reveal-left"
        }
      >
        <div className="space-y-5">
          {/* Category pill with subtle hand-drawn circle decoration */}
          <div className="relative inline-block">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-mint/40 bg-accent-mint-bg px-3 py-1 text-xs font-medium text-foreground/70">
              <feature.icon className="size-3.5 text-accent-mint-dark" />
              {feature.category}
            </span>
            {/* Hand-drawn circle around pill */}
            <svg
              className="pointer-events-none absolute -inset-1.5 text-accent-mint/20"
              viewBox="0 0 100 32"
              fill="none"
              preserveAspectRatio="none"
            >
              <ellipse
                cx="50"
                cy="16"
                rx="48"
                ry="14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            </svg>
          </div>

          <h3 className="font-[family-name:var(--font-heading)] font-bold text-3xl leading-snug lg:text-4xl">
            {feature.title}
          </h3>

          <p className="text-base leading-relaxed text-muted-foreground">
            {feature.description}
          </p>

          {/* Callout card */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-accent-mint/30 bg-accent-mint-bg px-4 py-2.5 shadow-sm shadow-black/[0.02]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0 text-accent-mint-dark"
            >
              <path
                d="M8 2L9.2 6L13 5.5L10 8L12 12L8 9.5L4 12L6 8L3 5.5L6.8 6L8 2Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-semibold text-foreground/80">
              {feature.callout}
            </span>
          </div>

          <ul className="space-y-3 pt-1">
            {feature.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-mint/25">
                  <HandDrawnCheck className="size-3.5 text-accent-mint-dark" />
                </div>
                <span className="text-sm text-muted-foreground">{bullet}</span>
              </li>
            ))}
          </ul>

          {/* Small arrow pointing toward the mockup */}
          <div className="pt-2">
            <PointingArrow reversed={feature.reversed} />
          </div>
        </div>
      </div>

      {/* Mockup side */}
      <div
        ref={mockupRef}
        className={`${
          feature.reversed ? "scroll-reveal-left" : "scroll-reveal-right"
        } stagger-2`}
      >
        <div className="transition-transform duration-500 hover:scale-[1.02]">
          {feature.mockup}
        </div>
      </div>
    </div>
  )
}

/* ─── Features section ─────────────────────────────────────────────── */

export function FeaturesSection() {
  return (
    <section id="features" className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="mb-16 max-w-2xl">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl md:text-5xl">
            Choose Your <span className="italic">Perfect</span>
            <br />
            Workflow
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Work smarter with a suite of tools designed to streamline your
            social media workflow from creation to publishing.
          </p>

          {/* Hand-drawn squiggle below header */}
          <WavySquiggle />

          {/* Category pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {features.map((f) => (
              <span
                key={f.category}
                className="cursor-default rounded-full border border-border/80 px-4 py-1.5 text-sm transition-colors hover:border-accent-mint/50 hover:bg-accent-mint-bg"
              >
                {f.category}
              </span>
            ))}
          </div>
        </div>

        {/* Feature blocks with decorative dividers */}
        <div className="space-y-20">
          {features.map((feature, i) => (
            <div key={feature.category}>
              <FeatureBlock feature={feature} />

              {/* Decorative divider between feature blocks (not after last) */}
              {i < features.length - 1 && (
                <div className="mt-20">
                  {i % 2 === 0 ? <DividerWithStar /> : <DividerWithSquiggle />}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

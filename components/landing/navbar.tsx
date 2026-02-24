"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { AudioWaveform, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#stats" },
]

/** Hand-drawn squiggle underline SVG for nav link hover */
function SquiggleUnderline() {
  return (
    <svg
      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[calc(100%-16px)] h-[6px] text-accent-mint opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      viewBox="0 0 80 6"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M0 3C10 0.5 20 5.5 30 3C40 0.5 50 5.5 60 3C70 0.5 75 4 80 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Small hand-drawn sparkle SVG decoration */
function SparkleDecoration() {
  return (
    <svg
      className="size-4 text-accent-mint shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M10 0C10 0 11.5 6.5 10 10C8.5 6.5 10 0 10 0Z" />
      <path d="M0 10C0 10 6.5 8.5 10 10C6.5 11.5 0 10 0 10Z" />
      <path d="M10 20C10 20 8.5 13.5 10 10C11.5 13.5 10 20 10 20Z" />
      <path d="M20 10C20 10 13.5 11.5 10 10C13.5 8.5 20 10 20 10Z" />
      <path d="M3 3C3 3 7 7.5 10 10C7.5 7 3 3 3 3Z" />
      <path d="M17 3C17 3 13 7.5 10 10C12.5 7 17 3 17 3Z" />
      <path d="M3 17C3 17 7 12.5 10 10C7.5 13 3 17 3 17Z" />
      <path d="M17 17C17 17 13 12.5 10 10C12.5 13 17 17 17 17Z" />
    </svg>
  )
}

export function Navbar() {
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border/60 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-accent-mint text-foreground">
            <AudioWaveform className="size-4" />
          </div>
          <span className="font-[family-name:var(--font-heading)] font-bold text-xl">Cadence</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/60"
            >
              {link.label}
              <SquiggleUnderline />
            </a>
          ))}
        </div>

        {/* Desktop right */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {session ? (
            <Button asChild className="rounded-full">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="rounded-full">
                <Link href="/login">Log in</Link>
              </Button>
              <div className="flex items-center gap-1.5">
                <SparkleDecoration />
                <Button
                  asChild
                  className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-5 shadow-sm hover:shadow-md hover:shadow-accent-mint/20 transition-shadow"
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-lg md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/60"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-border/50 pt-3">
              {session ? (
                <Button asChild className="rounded-full">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild className="rounded-full">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button
                    asChild
                    className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-5 shadow-sm"
                  >
                    <Link href="/register">Get Started</Link>
                  </Button>
                </>
              )}
              <div className="flex justify-start pt-1">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

import Link from "next/link"
import { AudioWaveform } from "lucide-react"

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#stats" },
  { label: "Get Started", href: "/register" },
]

const companyLinks = [
  { label: "Log in", href: "/login" },
  { label: "Register", href: "/register" },
]

export function Footer() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Logo + tagline */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-accent-mint text-foreground">
                <AudioWaveform className="size-4" />
              </div>
              <span className="font-[family-name:var(--font-heading)] font-bold text-xl">Cadence</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Save ideas. Write with AI. Post on six sites. All in one place.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Product</h4>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("#") ? (
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Account</h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Hand-drawn wave separator + copyright */}
        <div className="mt-8">
          <svg width="100%" height="8" viewBox="0 0 400 8" fill="none" preserveAspectRatio="none" className="text-border mb-6">
            <path d="M0 4C40 0 80 8 120 4C160 0 200 8 240 4C280 0 320 8 360 4C380 2 390 5 400 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          </svg>

          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Cadence. All rights reserved.
          </p>
          <p className="text-center text-[11px] text-muted-foreground/60 mt-1">
            Made with &#9749; for creators everywhere
          </p>
        </div>
      </div>
    </footer>
  )
}

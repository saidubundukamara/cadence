import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { AudioWaveform, Eye, EyeOff, Loader2 } from "lucide-react"
import { setAuth } from "@/lib/auth"
import { getLastEmail, setLastEmail } from "@/lib/onboarding"

interface LoginFormProps {
  onSuccess: () => void
}

const DEFAULT_URL = import.meta.env.VITE_CADENCE_URL as string

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorIsNetwork, setErrorIsNetwork] = useState(false)
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getLastEmail().then((last) => {
      if (last) {
        setEmail(last)
        setTimeout(() => passwordRef.current?.focus(), 50)
      } else {
        setTimeout(() => emailRef.current?.focus(), 50)
      }
    })
  }, [])

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault?.()
    setError(null)
    setErrorIsNetwork(false)
    setLoading(true)
    const cleanEmail = email.trim().toLowerCase()
    try {
      const base = DEFAULT_URL.replace(/\/$/, "")
      const res = await fetch(`${base}/api/auth/extension-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "That email and password didn't match.")
        return
      }
      await setAuth({
        token: data.token,
        expiresAt: data.expiresAt,
        user: data.user,
        cadenceUrl: base,
      })
      await setLastEmail(cleanEmail)
      chrome.runtime.sendMessage({ type: "AUTH_SUCCESS" })
      onSuccess()
    } catch {
      setError("Couldn't reach Cadence. Check your connection.")
      setErrorIsNetwork(true)
    } finally {
      setLoading(false)
    }
  }

  function openSignup() {
    const base = DEFAULT_URL.replace(/\/$/, "")
    chrome.tabs.create({ url: `${base}/signup` })
  }

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
  }
  const rise = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <div className="relative min-h-[600px] overflow-hidden">
      {/* Decorative mint blob — brand flourish, behind content */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full opacity-55 blur-3xl"
        style={{ background: "var(--color-mint)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-48 h-48 w-48 rounded-full opacity-35 blur-3xl"
        style={{ background: "var(--color-mint-bg)" }}
      />

      {/* Hand-drawn star decoration */}
      <svg
        aria-hidden
        className="pointer-events-none absolute right-10 top-32 opacity-45"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-mint-dark)"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
      </svg>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative flex min-h-[600px] flex-col px-10 pb-10 pt-12"
      >
        {/* Logo + wordmark */}
        <motion.div variants={rise} className="mb-12 flex items-center gap-2.5">
          <div
            className="flex size-9 items-center justify-center rounded-xl"
            style={{ background: "var(--color-mint)" }}
          >
            <AudioWaveform className="size-[18px] text-[var(--color-foreground)]" strokeWidth={2.25} />
          </div>
          <span className="font-heading text-xl font-[700] tracking-[-0.02em]">
            Cadence
          </span>
        </motion.div>

        {/* Heading */}
        <motion.div variants={rise} className="mb-1.5">
          <h1 className="font-heading text-[30px] font-[700] leading-[1.1] tracking-[-0.025em]">
            Welcome back
          </h1>
        </motion.div>
        <motion.p
          variants={rise}
          className="mb-10 text-[14px] leading-relaxed text-[var(--color-muted-foreground)]"
        >
          Sign in to start saving.
        </motion.p>

        {/* Form */}
        <motion.form variants={rise} onSubmit={handleSubmit} className="flex flex-col gap-[22px]">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              role="alert"
              aria-live="polite"
              className="rounded-xl border border-[color-mix(in_oklch,var(--color-destructive)_30%,transparent)] bg-[color-mix(in_oklch,var(--color-destructive)_6%,transparent)] px-3.5 py-2.5 text-[13px] leading-snug text-[var(--color-destructive)]"
            >
              <div>{error}</div>
              {errorIsNetwork && (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="mt-1.5 text-[12px] font-semibold underline underline-offset-2"
                >
                  Try again
                </button>
              )}
            </motion.div>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-[13px] font-medium text-[var(--color-foreground)]"
            >
              Email
            </label>
            <input
              id="email"
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => setEmail(e.target.value.trim())}
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={loading}
              className="input-brand"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-[13px] font-medium text-[var(--color-foreground)]"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
                className="input-brand pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-4">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </motion.form>

        {/* Footer */}
        <motion.div
          variants={rise}
          className="mt-auto pt-10 text-center text-[13px] text-[var(--color-muted-foreground)]"
        >
          New to Cadence?{" "}
          <button
            onClick={openSignup}
            className="font-medium text-[var(--color-foreground)] underline decoration-[var(--color-mint)] decoration-2 underline-offset-4 hover:decoration-[var(--color-mint-dark)] transition-colors"
          >
            Create one
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}

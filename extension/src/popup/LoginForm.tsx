import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { setAuth } from "@/lib/auth"
import { getLastEmail, setLastEmail } from "@/lib/onboarding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LoginFormProps {
  onSuccess: () => void
}

const DEFAULT_URL = import.meta.env.VITE_CADENCE_URL as string

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getLastEmail().then((last) => {
      if (last) {
        setEmail(last)
        // Focus password since email is prefilled
        setTimeout(() => passwordRef.current?.focus(), 50)
      } else {
        setTimeout(() => emailRef.current?.focus(), 50)
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
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
        setError(data.error ?? "That email and password didn't match. Try again.")
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
      setError("Couldn't reach Cadence. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  function openSignup() {
    const base = DEFAULT_URL.replace(/\/$/, "")
    chrome.tabs.create({ url: `${base}/signup` })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-[520px] flex-col p-6"
    >
      {/* Brand */}
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--color-primary)_12%,transparent)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-primary)">
            <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
            <path d="M12 8v4l3 3-1.5 1.5-3.5-3.5V8H12z" />
          </svg>
        </div>
        <span className="text-base font-semibold tracking-tight">Cadence</span>
      </div>

      {/* Heading */}
      <div className="mb-6 space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Sign in to save inspirations from anywhere on the web.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Alert variant="destructive" aria-live="polite">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
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
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <motion.div whileTap={{ scale: 0.985 }}>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </motion.div>
      </form>

      {/* Footer */}
      <div className="mt-auto pt-6 text-center text-xs text-[var(--color-muted-foreground)]">
        New to Cadence?{" "}
        <button
          onClick={openSignup}
          className="font-semibold text-[var(--color-primary)] hover:underline underline-offset-2"
        >
          Create an account
        </button>
      </div>
    </motion.div>
  )
}

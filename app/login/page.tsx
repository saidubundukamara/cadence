"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AudioWaveform, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const verified = searchParams.get("verified") === "true"
  const tokenError = searchParams.get("error")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Invalid email or password")
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — branding panel (desktop only) */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-mint-bg via-background to-[oklch(0.95_0.03_290)]" />

        {/* Blurred blobs */}
        <div
          className="animate-blob-drift absolute -top-20 right-[10%] h-[400px] w-[450px] rounded-full opacity-50 blur-[80px]"
          style={{ background: "radial-gradient(ellipse, oklch(0.9 0.08 160), transparent)" }}
        />
        <div
          className="animate-blob-drift absolute bottom-[10%] left-[5%] h-[350px] w-[400px] rounded-full opacity-35 blur-[80px]"
          style={{ background: "radial-gradient(ellipse, oklch(0.93 0.05 50), transparent)", animationDelay: "-10s" }}
        />
        <div
          className="absolute top-[40%] left-[30%] h-[300px] w-[350px] rounded-full opacity-30 blur-[70px]"
          style={{ background: "radial-gradient(ellipse, oklch(0.93 0.04 290), transparent)" }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-accent-mint text-foreground">
              <AudioWaveform className="size-4" />
            </div>
            <span className="font-[family-name:var(--font-heading)] font-bold text-xl">Cadence</span>
          </Link>

          {/* Center content */}
          <div className="max-w-md">
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-tight">
              Your social media,{" "}
              <span className="relative">
                on demand.
                <svg
                  className="absolute -bottom-1.5 left-0 h-2.5 w-full text-accent-mint"
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
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Write once, publish everywhere. AI-powered scheduling that grows your audience across every platform.
            </p>

            {/* Floating testimonial card */}
            <div className="mt-8 animate-float rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 shadow-lg shadow-black/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-accent-mint-bg">
                  <Sparkles className="size-4 text-accent-mint-dark" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Smart Scheduling</p>
                  <p className="text-xs text-muted-foreground">Post at optimal times across platforms</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom decorative dots */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="size-1.5 rounded-full bg-accent-mint/40" />
            <div className="size-1.5 rounded-full bg-[oklch(0.88_0.05_290)]/40" />
            <div className="size-1.5 rounded-full bg-[oklch(0.88_0.06_50)]/40" />
          </div>
        </div>

        {/* Hand-drawn star decorations */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="absolute top-[20%] right-[15%] text-accent-mint opacity-50">
          <path d="M10 2L11.5 7.5L17 7.5L12.5 11L14 17L10 13L6 17L7.5 11L3 7.5L8.5 7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="absolute bottom-[25%] right-[25%] text-accent-mint-dark opacity-40">
          <path d="M10 2L11.5 7.5L17 7.5L12.5 11L14 17L10 13L6 17L7.5 11L3 7.5L8.5 7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Right — form panel */}
      <div className="relative flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        {/* Subtle background blob (mobile only) */}
        <div
          className="pointer-events-none absolute -top-20 right-0 h-[300px] w-[350px] rounded-full opacity-30 blur-[80px] lg:hidden"
          style={{ background: "radial-gradient(ellipse, oklch(0.9 0.08 160), transparent)" }}
        />

        <div className="relative z-10 w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-accent-mint text-foreground">
                <AudioWaveform className="size-4" />
              </div>
              <span className="font-[family-name:var(--font-heading)] font-bold text-xl">Cadence</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl">Welcome back</h1>
            <p className="mt-2 text-muted-foreground">Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {verified && (
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3.5 text-sm text-green-700 dark:text-green-400">
                Email verified successfully! You can now sign in.
              </div>
            )}
            {tokenError && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-sm text-destructive">
                {tokenError === "expired-token"
                  ? "Verification link has expired. Please register again."
                  : tokenError === "invalid-token"
                    ? "Invalid verification link."
                    : "Verification failed."}
              </div>
            )}
            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-11 rounded-xl border-border/60 bg-muted/30 transition-colors focus:bg-background"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="********"
                className="h-11 rounded-xl border-border/60 bg-muted/30 transition-colors focus:bg-background"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-full bg-foreground text-background hover:bg-foreground/90 text-sm font-medium transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

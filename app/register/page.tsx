"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AudioWaveform, Calendar, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Threads from "@/components/Threads"

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterForm) {
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      setLoading(false)
      setError(result.error || "Something went wrong")
      return
    }

    // Auto sign-in after successful registration
    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    setLoading(false)

    if (signInResult?.error) {
      setError("Account created but sign-in failed. Please log in manually.")
      router.push("/login")
      return
    }

    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — branding panel (desktop only) */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-mint-bg via-background to-[oklch(0.95_0.03_290)]" />

        {/* Animated Threads layer */}
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <Threads
            color={[0.55, 0.85, 0.72]}
            amplitude={1.2}
            distance={0.3}
            enableMouseInteraction={true}
          />
        </div>

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
              Start growing your{" "}
              <span className="relative">
                audience.
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
              Join creators and teams who use Cadence to schedule smarter and grow faster.
            </p>

            {/* Feature cards */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm px-4 py-3 shadow-lg shadow-black/[0.06]">
                <div className="flex size-8 items-center justify-center rounded-full bg-accent-mint-bg">
                  <Sparkles className="size-4 text-accent-mint-dark" />
                </div>
                <div>
                  <p className="text-sm font-semibold">AI-Powered Content</p>
                  <p className="text-xs text-muted-foreground">Generate platform-perfect posts instantly</p>
                </div>
              </div>
              <div className="animate-float flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm px-4 py-3 shadow-lg shadow-black/[0.06]" style={{ animationDelay: "-2s" }}>
                <div className="flex size-8 items-center justify-center rounded-full bg-[oklch(0.95_0.03_290)]">
                  <Calendar className="size-4 text-[oklch(0.55_0.1_290)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Visual Calendar</p>
                  <p className="text-xs text-muted-foreground">Plan your content with drag-and-drop</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm px-4 py-3 shadow-lg shadow-black/[0.06]">
                <div className="flex size-8 items-center justify-center rounded-full bg-[oklch(0.95_0.04_50)]">
                  <Zap className="size-4 text-[oklch(0.6_0.15_50)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Multi-Platform</p>
                  <p className="text-xs text-muted-foreground">Twitter, Facebook, and Instagram</p>
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
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="absolute top-[18%] right-[12%] text-accent-mint opacity-50">
          <path d="M10 2L11.5 7.5L17 7.5L12.5 11L14 17L10 13L6 17L7.5 11L3 7.5L8.5 7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="absolute bottom-[30%] right-[20%] text-accent-mint-dark opacity-40">
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
            <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl">Create your account</h1>
            <p className="mt-2 text-muted-foreground">Get started with Cadence for free</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                placeholder="Your name"
                className="h-11 rounded-xl border-border/60 bg-muted/30 transition-colors focus:bg-background"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
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
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
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
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="********"
                className="h-11 rounded-xl border-border/60 bg-muted/30 transition-colors focus:bg-background"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-full bg-foreground text-background hover:bg-foreground/90 text-sm font-medium transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

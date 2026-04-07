"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AudioWaveform, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const schema = z.object({
  email: z.string().email("Invalid email"),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-accent-mint text-foreground">
              <AudioWaveform className="size-4" />
            </div>
            <span className="font-[family-name:var(--font-heading)] font-bold text-xl">
              Cadence
            </span>
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl">
            Reset your password
          </h1>
          <p className="mt-2 text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-700 dark:text-green-400">
              If an account exists with that email, you&apos;ll receive a password reset link shortly.
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-full bg-foreground text-background hover:bg-foreground/90 text-sm font-medium"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <p className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

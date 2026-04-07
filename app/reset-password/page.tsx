"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AudioWaveform, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type FormData = z.infer<typeof schema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Invalid reset link.</p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Request a new one
          </Link>
        </div>
      </div>
    )
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || "Failed to reset password")
        return
      }

      router.push("/login?verified=true")
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
            Set new password
          </h1>
          <p className="mt-2 text-muted-foreground">
            Choose a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              New Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              className="h-11 rounded-xl border-border/60 bg-muted/30 transition-colors focus:bg-background"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
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
            className="h-11 w-full rounded-full bg-foreground text-background hover:bg-foreground/90 text-sm font-medium"
          >
            {loading ? "Resetting..." : "Reset Password"}
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
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}

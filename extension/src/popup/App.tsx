import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { isAuthenticated } from "@/lib/auth"
import { isOnboarded } from "@/lib/onboarding"
import { LoginForm } from "./LoginForm"
import { Home } from "./Home"
import { Onboarding } from "./Onboarding"

type Stage = "loading" | "unauthed" | "onboarding" | "authed"

export function App() {
  const [stage, setStage] = useState<Stage>("loading")

  useEffect(() => {
    ;(async () => {
      const authed = await isAuthenticated()
      if (!authed) return setStage("unauthed")
      const onboarded = await isOnboarded()
      setStage(onboarded ? "authed" : "onboarding")
    })()
  }, [])

  if (stage === "loading") {
    return (
      <div className="flex min-h-[520px] items-center justify-center text-[var(--color-muted-foreground)]">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  if (stage === "unauthed") {
    return (
      <LoginForm
        onSuccess={async () => {
          const onboarded = await isOnboarded()
          setStage(onboarded ? "authed" : "onboarding")
        }}
      />
    )
  }

  if (stage === "onboarding") {
    return <Onboarding onDone={() => setStage("authed")} />
  }

  return <Home onLogout={() => setStage("unauthed")} />
}

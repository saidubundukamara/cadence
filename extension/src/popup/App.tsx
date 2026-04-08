import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { isAuthenticated } from "@/lib/auth"
import { isOnboarded } from "@/lib/onboarding"
import { LoginForm } from "./LoginForm"
import { Home } from "./Home"
import { Onboarding } from "./Onboarding"
import { BoardDetail } from "./BoardDetail"

type Stage = "loading" | "unauthed" | "onboarding" | "authed"
type View = { kind: "home" } | { kind: "board"; boardId: string }

export function App() {
  const [stage, setStage] = useState<Stage>("loading")
  const [view, setView] = useState<View>({ kind: "home" })

  useEffect(() => {
    ;(async () => {
      const authed = await isAuthenticated()
      if (!authed) return setStage("unauthed")
      const onboarded = await isOnboarded()
      setStage(onboarded ? "authed" : "onboarding")
    })()

    // If apiFetch wipes the auth record after a 401, route back to login
    // immediately instead of leaving the popup stuck on an empty Home.
    const onChanged = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: chrome.storage.AreaName
    ) => {
      if (area !== "local") return
      if ("cadence_auth" in changes && !changes.cadence_auth.newValue) {
        setStage("unauthed")
        setView({ kind: "home" })
      }
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  if (stage === "loading") {
    return (
      <div className="flex min-h-[600px] items-center justify-center text-[var(--color-muted-foreground)]">
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

  if (view.kind === "board") {
    return (
      <BoardDetail
        boardId={view.boardId}
        onBack={() => setView({ kind: "home" })}
      />
    )
  }

  return (
    <Home
      onLogout={() => setStage("unauthed")}
      onOpenBoard={(boardId) => setView({ kind: "board", boardId })}
    />
  )
}

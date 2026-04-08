import { useEffect, useState } from "react"
import { isAuthenticated } from "../lib/auth"
import { LoginForm } from "./LoginForm"
import { Home } from "./Home"

export function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    isAuthenticated().then(setAuthed)
  }, [])

  if (authed === null) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#6b7280", fontSize: 14 }}>
        Loading…
      </div>
    )
  }

  if (!authed) {
    return <LoginForm onSuccess={() => setAuthed(true)} />
  }

  return <Home onLogout={() => setAuthed(false)} />
}

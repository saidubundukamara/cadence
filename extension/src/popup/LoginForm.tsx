import { useState } from "react"
import { setAuth } from "../lib/auth"

interface LoginFormProps {
  onSuccess: () => void
}

const DEFAULT_URL = "https://app.cadence.so"

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [cadenceUrl, setCadenceUrl] = useState(DEFAULT_URL)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const base = cadenceUrl.replace(/\/$/, "")
      const res = await fetch(`${base}/api/auth/extension-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Login failed")
        return
      }

      await setAuth({ token: data.token, expiresAt: data.expiresAt, user: data.user, cadenceUrl: base })

      // Notify service worker to refresh boards cache
      chrome.runtime.sendMessage({ type: "AUTH_SUCCESS" })

      onSuccess()
    } catch {
      setError("Could not connect to Cadence. Check the URL.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.logo}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#6366f1">
          <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
          <path d="M12 8v4l3 3-1.5 1.5-3.5-3.5V8H12z" />
        </svg>
        <span style={styles.logoText}>Cadence</span>
      </div>

      <h2 style={styles.title}>Sign in</h2>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.field}>
        <label style={styles.label}>Cadence URL</label>
        <input
          type="url"
          value={cadenceUrl}
          onChange={(e) => setCadenceUrl(e.target.value)}
          style={styles.input}
          required
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
          autoComplete="email"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
          autoComplete="current-password"
        />
      </div>

      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  )
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111827",
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: "#111827",
    margin: 0,
  },
  error: {
    padding: "8px 12px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 6,
    color: "#dc2626",
    fontSize: 13,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: "#374151",
  },
  input: {
    padding: "8px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
    outline: "none",
    color: "#111827",
  },
  button: {
    padding: "10px",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  },
}

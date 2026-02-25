"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Clock, Save, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

type UserSettings = {
  id: string
  name: string | null
  email: string
  timezone: string
  defaultPostTime: string
  notifyOnPublish: boolean
  notifyOnFail: boolean
  createdAt: string
}

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Kolkata", label: "Kolkata (IST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST)" },
]

export default function SettingsPage() {
  const { update } = useSession()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)

  const [name, setName] = useState("")
  const [timezone, setTimezone] = useState("")
  const [defaultPostTime, setDefaultPostTime] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch("/api/user/settings")
      if (!res.ok) {
        const text = await res.text()
        console.error("Settings API error:", res.status, text)
        toast.error("Failed to load settings")
        return
      }
      const data: UserSettings = await res.json()
      setSettings(data)
      setName(data.name ?? "")
      setTimezone(data.timezone)
      setDefaultPostTime(data.defaultPostTime)
    } catch (err) {
      console.error("Failed to fetch settings:", err)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    setSavingProfile(true)
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        toast.success("Profile updated")
        await update()
      } else {
        toast.error("Failed to update profile")
      }
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveSchedule() {
    setSavingSchedule(true)
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone, defaultPostTime }),
      })
      if (res.ok) {
        toast.success("Scheduling defaults updated")
      } else {
        toast.error("Failed to update scheduling defaults")
      }
    } finally {
      setSavingSchedule(false)
    }
  }

  async function toggleNotification(field: "notifyOnPublish" | "notifyOnFail", value: boolean) {
    setSettings((prev) => prev ? { ...prev, [field]: value } : prev)
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      if (res.ok) {
        toast.success("Notification preference saved")
      } else {
        toast.error("Failed to update preference")
        setSettings((prev) => prev ? { ...prev, [field]: !value } : prev)
      }
    } catch {
      setSettings((prev) => prev ? { ...prev, [field]: !value } : prev)
    }
  }

  if (loading) {
    return <SettingsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">General Settings</h2>
        <p className="text-muted-foreground">Manage your account preferences.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
              {name ? name.charAt(0).toUpperCase() : <User className="size-6" />}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{settings?.email}</p>
              <p className="text-xs text-muted-foreground">
                Member since {settings?.createdAt ? new Date(settings.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={settings?.email ?? ""} disabled />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={savingProfile}>
              <Save className="mr-2 size-4" />
              {savingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scheduling Defaults */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduling Defaults</CardTitle>
          <CardDescription>Default time and timezone for new posts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postTime">Default post time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="postTime"
                  type="time"
                  value={defaultPostTime}
                  onChange={(e) => setDefaultPostTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveSchedule} disabled={savingSchedule}>
              <Save className="mr-2 size-4" />
              {savingSchedule ? "Saving..." : "Save Defaults"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what you get notified about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Post published successfully</Label>
              <p className="text-sm text-muted-foreground">Get notified when a scheduled post is published.</p>
            </div>
            <Switch
              checked={settings?.notifyOnPublish ?? true}
              onCheckedChange={(v) => toggleNotification("notifyOnPublish", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Post failed to publish</Label>
              <p className="text-sm text-muted-foreground">Get notified when a scheduled post fails.</p>
            </div>
            <Switch
              checked={settings?.notifyOnFail ?? true}
              onCheckedChange={(v) => toggleNotification("notifyOnFail", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Account details and metadata.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span>{settings?.createdAt ? new Date(settings.createdAt).toLocaleDateString() : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account ID</span>
            <span className="font-mono text-xs">{settings?.id}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="size-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

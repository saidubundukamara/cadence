import { Twitter, Facebook, Instagram, Linkedin, Youtube } from "lucide-react"
import type { Platform } from "@/types"

export type PlatformConfig = {
  label: string
  icon: typeof Twitter
  color: string
  bgColor: string
  borderColor: string
}

export const platformConfig: Record<Platform, PlatformConfig> = {
  TWITTER: {
    label: "X",
    icon: Twitter,
    color: "text-sky-500",
    bgColor: "bg-sky-50 dark:bg-sky-950/40",
    borderColor: "border-sky-200 dark:border-sky-800",
  },
  FACEBOOK: {
    label: "Facebook",
    icon: Facebook,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  INSTAGRAM: {
    label: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/40",
    borderColor: "border-pink-200 dark:border-pink-800",
  },
  LINKEDIN: {
    label: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-700",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  YOUTUBE: {
    label: "YouTube",
    icon: Youtube,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/40",
    borderColor: "border-red-200 dark:border-red-800",
  },
}

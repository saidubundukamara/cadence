import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-md border px-3 py-2.5 text-xs [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-current flex gap-2 items-start",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-muted)] text-[var(--color-foreground)] border-[var(--color-border)]",
        destructive:
          "border-[color-mix(in_oklch,var(--color-destructive)_30%,transparent)] bg-[color-mix(in_oklch,var(--color-destructive)_8%,transparent)] text-[var(--color-destructive)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
Alert.displayName = "Alert"

export const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("leading-relaxed", className)} {...props} />
))
AlertDescription.displayName = "AlertDescription"

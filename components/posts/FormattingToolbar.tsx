"use client"

import { Bold, Italic, type LucideIcon } from "lucide-react"
import { toggleUnicodeStyle } from "@/lib/unicode-format"
import { cn } from "@/lib/utils"

interface FormattingToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onContentChange: (value: string) => void
}

interface ToolbarAction {
  icon?: LucideIcon
  label: string
  style: "bold" | "italic" | "boldItalic"
  shortcut: string
  text?: string
}

const actions: ToolbarAction[] = [
  { icon: Bold, label: "Bold", style: "bold", shortcut: "⌘B" },
  { icon: Italic, label: "Italic", style: "italic", shortcut: "⌘I" },
  { label: "Bold Italic", style: "boldItalic", shortcut: "⌘B then ⌘I", text: "BI" },
]

function applyFormatting(
  textarea: HTMLTextAreaElement,
  style: "bold" | "italic" | "boldItalic",
  onContentChange: (value: string) => void
) {
  const { selectionStart, selectionEnd, value } = textarea
  if (selectionStart === selectionEnd) return

  const selected = value.slice(selectionStart, selectionEnd)
  const formatted = toggleUnicodeStyle(selected, style)

  textarea.focus()
  textarea.setSelectionRange(selectionStart, selectionEnd)

  if (document.execCommand) {
    document.execCommand("insertText", false, formatted)
  } else {
    const newValue = value.slice(0, selectionStart) + formatted + value.slice(selectionEnd)
    onContentChange(newValue)
  }

  requestAnimationFrame(() => {
    const newEnd = selectionStart + formatted.length
    textarea.setSelectionRange(selectionStart, newEnd)
    textarea.focus()
  })
}

export function FormattingToolbar({ textareaRef, onContentChange }: FormattingToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 border-b bg-muted/30 px-1.5 py-1">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <button
            key={action.style}
            type="button"
            className={cn(
              "inline-flex h-7 items-center justify-center rounded px-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              action.text && "text-xs font-semibold italic"
            )}
            title={`${action.label} (${action.shortcut})`}
            onMouseDown={(e) => {
              e.preventDefault()
              if (textareaRef.current) {
                applyFormatting(textareaRef.current, action.style, onContentChange)
              }
            }}
          >
            {Icon ? <Icon className="size-3.5" /> : action.text}
          </button>
        )
      })}
    </div>
  )
}

export { applyFormatting }

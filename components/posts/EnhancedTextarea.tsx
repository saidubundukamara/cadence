"use client"

import { useRef, useCallback, useEffect } from "react"
import { FormattingToolbar, applyFormatting } from "@/components/posts/FormattingToolbar"
import { CharacterCounts } from "@/components/posts/CharacterCounts"
import { EmojiPickerButton } from "@/components/posts/EmojiPickerButton"
import { cn } from "@/lib/utils"
import type { Platform } from "@/types"

interface EnhancedTextareaProps {
  value: string
  onChange: (value: string) => void
  platforms: Platform[]
  placeholder?: string
  "aria-invalid"?: boolean
}

export function EnhancedTextarea({
  value,
  onChange,
  platforms,
  placeholder = "Write your post content...",
  "aria-invalid": ariaInvalid,
}: EnhancedTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize fallback for browsers without field-sizing support
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    // Only use JS fallback if field-sizing isn't supported
    if (CSS.supports("field-sizing", "content")) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.max(128, textarea.scrollHeight)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target !== textareaRef.current) return
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key === "b") {
        e.preventDefault()
        if (textareaRef.current) {
          applyFormatting(textareaRef.current, "bold", onChange)
        }
      } else if (mod && e.key === "i") {
        e.preventDefault()
        if (textareaRef.current) {
          applyFormatting(textareaRef.current, "italic", onChange)
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onChange])

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-background shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        ariaInvalid && "border-destructive"
      )}
    >
      <FormattingToolbar textareaRef={textareaRef} onContentChange={onChange} />

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          adjustHeight()
        }}
        placeholder={placeholder}
        className="w-full min-h-32 resize-none border-0 bg-transparent px-3 py-2 text-sm shadow-none outline-none placeholder:text-muted-foreground [field-sizing:content]"
        aria-invalid={ariaInvalid}
      />

      <div className="flex items-center justify-between border-t px-2 py-1.5">
        <EmojiPickerButton textareaRef={textareaRef} onContentChange={onChange} />
        <CharacterCounts content={value} platforms={platforms} />
      </div>
    </div>
  )
}

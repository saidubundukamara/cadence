"use client"

import { Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
  EmojiPickerFooter,
} from "@/components/ui/emoji-picker"
import { useState } from "react"

interface EmojiPickerButtonProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onContentChange: (value: string) => void
}

export function EmojiPickerButton({ textareaRef, onContentChange }: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false)

  function handleEmojiSelect(emoji: string) {
    const textarea = textareaRef.current
    if (!textarea) return

    const { selectionStart, value } = textarea
    const before = value.slice(0, selectionStart)
    const after = value.slice(selectionStart)

    textarea.focus()
    if (document.execCommand) {
      textarea.setSelectionRange(selectionStart, selectionStart)
      document.execCommand("insertText", false, emoji)
    } else {
      onContentChange(before + emoji + after)
    }

    setOpen(false)

    // Restore focus and cursor after emoji insertion
    requestAnimationFrame(() => {
      const newPos = selectionStart + emoji.length
      textarea.setSelectionRange(newPos, newPos)
      textarea.focus()
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          title="Insert emoji"
        >
          <Smile className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-fit p-0"
        side="top"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <EmojiPicker
          className="h-[320px]"
          onEmojiSelect={(emoji) => handleEmojiSelect(emoji.emoji)}
        >
          <EmojiPickerSearch placeholder="Search emoji..." />
          <EmojiPickerContent />
          <EmojiPickerFooter />
        </EmojiPicker>
      </PopoverContent>
    </Popover>
  )
}

"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Bot,
  Send,
  Loader2,
  X,
  Sparkles,
  Copy,
  Link as LinkIcon,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export function AiCopilot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function detectUrl(text: string): string | undefined {
    const urlMatch = text.match(/https?:\/\/[^\s]+/)
    return urlMatch ? urlMatch[0] : undefined
  }

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || streaming) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setStreaming(true)

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    }
    setMessages((prev) => [...prev, assistantMsg])

    try {
      const extractUrl = detectUrl(trimmed)
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory,
          extractUrl,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to get response")
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error("No response body")

      let fullContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") break

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                fullContent += parsed.content
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: fullContent }
                      : m
                  )
                )
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong"
      toast.error(message)
      // Remove empty assistant message on error
      setMessages((prev) =>
        prev.filter((m) => m.id !== assistantMsg.id || m.content)
      )
    } finally {
      setStreaming(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  function clearChat() {
    setMessages([])
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <Sparkles className="size-3.5" />
          AI Copilot
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Bot className="size-4" />
              AI Copilot
            </SheetTitle>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={clearChat}
              >
                <Trash2 className="size-3" />
                Clear
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Sparkles className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  How can I help with your content?
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ask me to write posts, refine content, extract from URLs, or
                  brainstorm ideas.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                {[
                  "Write a tweet about product launches",
                  "Create a LinkedIn post about remote work",
                  "Turn this into a thread: ...",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInput(prompt)
                      inputRef.current?.focus()
                    }}
                    className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="size-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "group relative max-w-[85%] rounded-xl px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.role === "assistant" && msg.content && (
                      <button
                        onClick={() => copyToClipboard(msg.content)}
                        className="absolute -right-8 top-1 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Copy className="size-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                    {msg.role === "assistant" &&
                      !msg.content &&
                      streaming && (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t px-4 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your content..."
              disabled={streaming}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || streaming}
            >
              {streaming ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            <LinkIcon className="mr-0.5 inline size-2.5" />
            Paste a URL to extract content from a webpage
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

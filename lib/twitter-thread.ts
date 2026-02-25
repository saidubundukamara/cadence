const MAX_TWEET_LENGTH = 280

/**
 * Splits content into tweet-sized chunks for threading.
 * Prefers splitting at sentence boundaries, falls back to word boundaries,
 * and hard-splits at 280 chars as a last resort.
 */
export function splitIntoThread(content: string): string[] {
  if (content.length <= MAX_TWEET_LENGTH) {
    return [content]
  }

  const chunks: string[] = []
  let remaining = content.trim()

  while (remaining.length > 0) {
    if (remaining.length <= MAX_TWEET_LENGTH) {
      chunks.push(remaining)
      break
    }

    let splitIndex = -1

    // Try to split at sentence boundary (. ! ? followed by space)
    for (let i = MAX_TWEET_LENGTH - 1; i >= 100; i--) {
      if (
        (remaining[i] === "." || remaining[i] === "!" || remaining[i] === "?") &&
        (i + 1 >= remaining.length || remaining[i + 1] === " " || remaining[i + 1] === "\n")
      ) {
        splitIndex = i + 1
        break
      }
    }

    // Fall back to word boundary
    if (splitIndex === -1) {
      for (let i = MAX_TWEET_LENGTH - 1; i >= 50; i--) {
        if (remaining[i] === " " || remaining[i] === "\n") {
          splitIndex = i
          break
        }
      }
    }

    // Hard-split at max length as last resort
    if (splitIndex === -1) {
      splitIndex = MAX_TWEET_LENGTH
    }

    chunks.push(remaining.slice(0, splitIndex).trim())
    remaining = remaining.slice(splitIndex).trim()
  }

  return chunks
}

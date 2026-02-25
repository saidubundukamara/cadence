type UnicodeStyle = "bold" | "italic" | "boldItalic"

// Unicode Mathematical Alphanumeric Symbols offsets (sans-serif variants)
const RANGES: Record<UnicodeStyle, { upper: number; lower: number; digit: number }> = {
  bold:       { upper: 0x1D5D4, lower: 0x1D5EE, digit: 0x1D7EC },
  italic:     { upper: 0x1D608, lower: 0x1D622, digit: 0x1D7EC }, // no italic digits, reuse bold
  boldItalic: { upper: 0x1D63C, lower: 0x1D656, digit: 0x1D7EC },
}

function charToUnicode(char: string, style: UnicodeStyle): string {
  const code = char.codePointAt(0)!
  const range = RANGES[style]

  if (code >= 65 && code <= 90) {
    return String.fromCodePoint(range.upper + (code - 65))
  }
  if (code >= 97 && code <= 122) {
    return String.fromCodePoint(range.lower + (code - 97))
  }
  if (code >= 48 && code <= 57) {
    return String.fromCodePoint(range.digit + (code - 48))
  }
  return char
}

/** Convert plain text to Unicode styled characters */
export function toUnicode(text: string, style: UnicodeStyle): string {
  return Array.from(text).map((ch) => charToUnicode(ch, style)).join("")
}

/** Detect the style of a Unicode math character, or null if not styled */
function detectStyle(codePoint: number): UnicodeStyle | null {
  // Bold Italic (check first — more specific)
  if (
    (codePoint >= 0x1D63C && codePoint <= 0x1D655) ||
    (codePoint >= 0x1D656 && codePoint <= 0x1D66F)
  ) return "boldItalic"
  // Bold
  if (
    (codePoint >= 0x1D5D4 && codePoint <= 0x1D5ED) ||
    (codePoint >= 0x1D5EE && codePoint <= 0x1D607)
  ) return "bold"
  // Italic
  if (
    (codePoint >= 0x1D608 && codePoint <= 0x1D621) ||
    (codePoint >= 0x1D622 && codePoint <= 0x1D63B)
  ) return "italic"
  // Bold digits
  if (codePoint >= 0x1D7EC && codePoint <= 0x1D7F5) return "bold"
  return null
}

/** Convert Unicode styled text back to plain ASCII */
export function fromUnicode(text: string): string {
  const result: string[] = []
  for (const ch of text) {
    const cp = ch.codePointAt(0)!
    const style = detectStyle(cp)
    if (!style) {
      result.push(ch)
      continue
    }
    const range = RANGES[style]
    if (cp >= range.upper && cp < range.upper + 26) {
      result.push(String.fromCharCode(65 + (cp - range.upper)))
    } else if (cp >= range.lower && cp < range.lower + 26) {
      result.push(String.fromCharCode(97 + (cp - range.lower)))
    } else if (cp >= range.digit && cp < range.digit + 10) {
      result.push(String.fromCharCode(48 + (cp - range.digit)))
    } else {
      result.push(ch)
    }
  }
  return result.join("")
}

/** Check if a character is Unicode-styled */
export function isUnicodeStyled(char: string): boolean {
  return detectStyle(char.codePointAt(0)!) !== null
}

/** Detect the dominant style in a string */
function detectDominantStyle(text: string): UnicodeStyle | null {
  for (const ch of text) {
    const style = detectStyle(ch.codePointAt(0)!)
    if (style) return style
  }
  return null
}

/** Toggle a Unicode style on text — applies if plain, reverts if already that style */
export function toggleUnicodeStyle(text: string, style: UnicodeStyle): string {
  const currentStyle = detectDominantStyle(text)
  if (currentStyle === style) {
    return fromUnicode(text)
  }
  // Convert back to plain first, then apply new style
  return toUnicode(fromUnicode(text), style)
}

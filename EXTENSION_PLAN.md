# Cadence Chrome Extension — Implementation Plan

## Overview

This document outlines the full implementation plan for the Cadence Chrome Extension feature. The goal is to allow users to save posts from X/Twitter, LinkedIn, and Reddit directly into Cadence boards (like Pinterest), and use those saved inspirations to power a weekly AI suggestion engine that learns the user's content style over time.

---

## Feature Summary

| Feature | Description |
|---|---|
| Chrome Extension | "Save to Cadence" button on X, LinkedIn, Reddit posts |
| Board System | Pinterest-style boards to organise saved inspirations |
| Inspiration Library | Dashboard page to browse and manage saved posts |
| Weekly AI Suggestions | GPT-4o generates 3 tailored post drafts per platform per week |
| Style Memory | Tracks accepted/rejected suggestions to refine AI output over time |

---

## Repo Structure

The extension lives in `extension/` at the repo root — a **monorepo** approach. It has its own `package.json` and Vite build pipeline. It does **not** affect the existing `next build` in any way.

```
cadence/
├── app/                        # Existing Next.js app
├── components/                 # Existing components
├── prisma/                     # Shared schema (extended)
├── lib/                        # Existing + new API utilities
├── extension/                  # NEW — Chrome Extension (Vite + React)
│   ├── manifest.json
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── background/
│       ├── content/
│       ├── popup/
│       └── lib/
└── EXTENSION_PLAN.md           # This file
```

---

## Phase 1 — Database Schema

**File to modify:** `prisma/schema.prisma`

### New Models

#### `ExtensionToken`
Stores hashed tokens issued to the Chrome extension for authentication.

```prisma
model ExtensionToken {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   @unique   // SHA-256 hash of the raw token
  createdAt DateTime @default(now())
  expiresAt DateTime           // 90 days from creation
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### `Board`
Named collections for organising saved inspirations.

```prisma
model Board {
  id           String        @id @default(cuid())
  userId       String
  name         String
  description  String?
  coverImage   String?       // URL of the first saved inspiration's thumbnail
  isDefault    Boolean       @default(false)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  inspirations Inspiration[]

  @@unique([userId, name])
}
```

#### `Inspiration`
A saved post from an external platform.

```prisma
model Inspiration {
  id             String    @id @default(cuid())
  userId         String
  boardId        String
  originalUrl    String
  sourcePlatform String    // "twitter" | "linkedin" | "reddit"
  content        String?   // text body of the post
  authorName     String?
  authorHandle   String?
  authorAvatar   String?
  thumbnailUrl   String?
  note           String?   // optional user note on why they saved it
  savedAt        DateTime  @default(now())
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  board          Board     @relation(fields: [boardId], references: [id], onDelete: Cascade)
}
```

#### `SuggestedPost`
An AI-generated post suggestion for a given week.

```prisma
model SuggestedPost {
  id              String           @id @default(cuid())
  userId          String
  platform        Platform
  content         String
  topic           String?
  tone            String?
  weekOf          DateTime         // Monday of the target week
  status          SuggestionStatus @default(PENDING)
  inspirationIds  String[]         // IDs of inspirations that informed this suggestion
  acceptedAt      DateTime?
  rejectedAt      DateTime?
  convertedPostId String?          // Post.id if accepted and turned into a draft
  createdAt       DateTime         @default(now())
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### `StyleMemory`
Accumulated knowledge about a user's preferred content style per platform.

```prisma
model StyleMemory {
  id            String   @id @default(cuid())
  userId        String
  platform      Platform
  acceptedTones String[] // e.g. ["conversational", "data-driven"]
  rejectedTones String[]
  topTopics     String[] // recurring themes in accepted suggestions
  avgPostLength Int?     // characters
  usesEmoji     Boolean  @default(false)
  usesHashtags  Boolean  @default(false)
  samplePosts   String[] // last 10 accepted post bodies for few-shot prompting
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, platform])
}
```

#### New Enum

```prisma
enum SuggestionStatus {
  PENDING
  ACCEPTED
  REJECTED
  PUBLISHED
}
```

### `User` model additions
Add these relations to the existing `User` model:

```prisma
extensionTokens ExtensionToken[]
boards          Board[]
inspirations    Inspiration[]
suggestedPosts  SuggestedPost[]
styleMemory     StyleMemory[]
```

### Migration command
```bash
npx prisma migrate dev --name add_extension_boards_suggestions
```

---

## Phase 2 — Backend Infrastructure

### 2a. Extension Authentication

**New file:** `lib/extension-auth.ts`

Two functions:
- `issueExtensionToken(userId: string)` — generates a cryptographically random 32-byte token, stores the SHA-256 hash in `ExtensionToken` with a 90-day expiry, returns the raw token (shown to the user exactly once).
- `verifyExtensionToken(rawToken: string)` — hashes the incoming token and looks up in the DB. Returns `userId` or `null` if not found/expired.

**New file:** `lib/api-auth.ts`

A shared helper used by all new API routes:
```typescript
async function getAuthUser(req: Request): Promise<string | null>
```
- First tries to get `userId` from the existing NextAuth session (for dashboard use)
- Falls back to reading `Authorization: Bearer <token>` header and calling `verifyExtensionToken()`
- Returns `userId` or `null`

All new routes use `getAuthUser()` so they work seamlessly for both the dashboard and the extension.

**New route:** `POST /api/auth/extension-login`

```
Body: { email: string, password: string }
Response: { token: string, expiresAt: string, user: { name, email } }
```

- Validates credentials using the same bcrypt check as NextAuth credentials provider
- Calls `issueExtensionToken(userId)`
- Returns the raw token (stored in `chrome.storage.local` by the extension)
- Token lifetime: 90 days

---

### 2b. Boards API

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/boards` | List all boards for the user with inspiration counts |
| `POST` | `/api/boards` | Create a new board. Auto-creates a "Default" board on first request if none exist |
| `PATCH` | `/api/boards/[id]` | Update board name or description |
| `DELETE` | `/api/boards/[id]` | Delete board and cascade-delete its inspirations |

All routes use `getAuthUser()` for auth.

---

### 2c. Inspirations API

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/inspirations` | Paginated list. Query params: `boardId`, `page`, `limit` (default 20) |
| `POST` | `/api/inspirations` | Save a new inspiration (called by the extension). Auto-sets `Board.coverImage` if empty |
| `PATCH` | `/api/inspirations/[id]` | Update note or move to different board |
| `DELETE` | `/api/inspirations/[id]` | Remove inspiration |

---

### 2d. Suggestions API

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/suggestions` | List suggestions. Query params: `weekOf`, `platform`, `status` |
| `POST` | `/api/suggestions/[id]/accept` | Mark as ACCEPTED, upsert StyleMemory, optionally create a draft Post |
| `POST` | `/api/suggestions/[id]/reject` | Mark as REJECTED, append tone to `rejectedTones` in StyleMemory |
| `POST` | `/api/suggestions/generate` | Manually trigger generation (rate-limited to once per 24h per user via Upstash Redis) |

**Accept flow detail:**
1. Set `status = ACCEPTED`, `acceptedAt = now()`
2. Upsert `StyleMemory` for the suggestion's platform:
   - Prepend `content` to `samplePosts`, keep last 10
   - Append `tone` to `acceptedTones`, deduplicate, keep last 20
   - Append `topic` to `topTopics`, deduplicate, keep last 20
   - Recalculate `avgPostLength` from `samplePosts`
3. If `body.createPost === true`: create a `Post` record (`status: DRAFT, aiGenerated: true`), set `convertedPostId`, return `postId` for redirect to editor

**Reject flow detail:**
1. Set `status = REJECTED`, `rejectedAt = now()`
2. Append `tone` to `StyleMemory.rejectedTones` (max 20). This tone is down-weighted in future prompts.

---

### 2e. Suggestions Cron Job

**New route:** `POST /api/cron/suggestions`
- Secured with QStash signature verification (same pattern as `/api/publish`)
- Runs every Monday at 6 AM UTC

**New file:** `lib/suggestions.ts`

```typescript
// Core functions:

buildSuggestionPrompt(inspirations, styleMemory, platform): string
// Constructs the GPT-4o prompt with:
// - Last 30 inspiration snippets
// - StyleMemory: accepted/rejected tones, topics, sample posts
// - Requests JSON: [{ content, topic, tone, inspirationIds }]

generateSuggestionsForUser(userId, weekOf): Promise<void>
// 1. Fetch user's last 30 inspirations
// 2. Fetch StyleMemory per connected platform
// 3. Call GPT-4o for each platform (3 suggestions each)
// 4. Bulk insert SuggestedPost records
```

**Cron registration** in `lib/queue.ts`:
```typescript
async function scheduleWeeklySuggestions(): Promise<void>
// Registers QStash cron: "0 6 * * 1" → /api/cron/suggestions
```

The cron route processes users in batches of 10 using `Promise.allSettled()` to avoid overwhelming Neon connection pool and OpenAI rate limits.

**Eligibility criteria for generation:**
- User has ≥ 5 saved inspirations
- User has ≥ 1 connected social account

---

## Phase 3 — Dashboard UI

### 3a. Sidebar Navigation

**File to modify:** `components/calendar/calendar-sidebar.tsx`

Add two items to the `navItems` array:

```typescript
{ title: "Inspiration", href: "/inspiration", icon: BookmarkIcon }
{ title: "Suggestions", href: "/suggestions", icon: SparklesIcon }
```

---

### 3b. Inspiration Pages

**`app/inspiration/page.tsx`** — Board browser

Layout:
- **Left panel** (240px): Board list showing name + count. "New Board" button at top.
- **Main area**: Masonry/responsive grid of Inspiration cards for the selected board.

Inspiration card shows:
- Thumbnail image OR platform icon (color-coded: blue for Twitter, blue-dark for LinkedIn, orange for Reddit)
- Content text preview (truncated to 3 lines)
- Author handle
- Source platform badge
- Relative save time ("2 days ago")
- "Use as inspiration" button → opens the new post composer with content pre-filled

---

**`app/inspiration/[boardId]/page.tsx`** — Individual board view

- Same grid layout scoped to one board
- Board title, description, edit/delete controls
- Breadcrumb: Inspiration > Board Name

---

### 3c. Suggestions Page

**`app/suggestions/page.tsx`** — Weekly suggestions

Layout:
- **Header**: "Week of [Monday date]" with ← → navigation to browse past/future weeks
- **Platform tabs**: All | X | LinkedIn | Instagram | Facebook | YouTube (only show connected platforms)
- **Cards grid**: One card per `SuggestedPost`

Suggestion card shows:
- Platform badge + icon
- Content preview (full text, scrollable if long)
- Tone label (e.g. "Conversational", "Data-driven")
- Source inspirations (small thumbnails/links, collapsible)
- **Accept** button (green) → opens post editor drawer with content pre-loaded
- **Reject** button (ghost) → marks rejected, card dims/collapses

**Footer section — "Your Style Profile":**
- Per-platform breakdown of learned tones, topics, avg post length
- Shows only after ≥3 accepted suggestions
- "Generate now" button with 24-hour cooldown indicator

---

## Phase 4 — Chrome Extension

### 4a. Build Setup

**`extension/package.json`** — standalone, not connected to root `package.json`:
```json
{
  "name": "cadence-extension",
  "private": true,
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build"
  },
  "dependencies": { "react": "^19", "react-dom": "^19" },
  "devDependencies": { "vite": "^6", "@vitejs/plugin-react": "^4", "typescript": "^5" }
}
```

**`extension/vite.config.ts`** — multi-entry build outputting `service-worker.js`, `content.js`, `popup.html`, `options.html`.

---

### 4b. Manifest (MV3)

**`extension/manifest.json`**:

```json
{
  "manifest_version": 3,
  "name": "Save to Cadence",
  "version": "1.0.0",
  "description": "Save social media posts as inspiration to your Cadence boards",
  "permissions": ["storage", "activeTab"],
  "host_permissions": [
    "https://twitter.com/*",
    "https://x.com/*",
    "https://www.linkedin.com/*",
    "https://www.reddit.com/*"
  ],
  "background": {
    "service_worker": "dist/service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://twitter.com/*", "https://x.com/*", "https://www.linkedin.com/*", "https://www.reddit.com/*"],
      "js": ["dist/content.js"],
      "css": ["dist/content.css"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" }
  },
  "icons": { "48": "icons/icon48.png", "128": "icons/icon128.png" }
}
```

---

### 4c. File Structure

```
extension/src/
│
├── background/
│   └── service-worker.ts
│       - Listens for SAVE_INSPIRATION messages from content scripts
│       - Reads token from chrome.storage.local
│       - Performs fetch() to POST /api/inspirations
│       - Replies with { success, inspiration } or { error }
│       - Reads boards list on startup and caches in chrome.storage.local
│
├── content/
│   ├── index.ts
│   │   - MutationObserver watches for new post elements added to DOM
│   │   - On mouseenter detected post → inject Save button overlay
│   │   - Delegates DOM queries to platform-specific extractors
│   │
│   ├── overlay.tsx
│   │   - React component rendered into shadow DOM
│   │   - Shows "Save" button (Cadence logo + "Save" text)
│   │   - On click: immediately sends save message to service worker
│   │     using lastUsedBoardId from chrome.storage.local
│   │   - Simultaneously shows the board picker popover
│   │   - On success: replaces button with green checkmark for 2 seconds
│   │
│   ├── popover.tsx
│   │   - Board list loaded from chrome.storage.local (cached from service worker)
│   │   - Selecting a board: updates lastUsedBoardId, re-saves to that board
│   │   - "New board" option opens a text input inline
│   │
│   └── platforms/
│       ├── twitter.ts
│       │   Selector: article[data-testid="tweet"]
│       │   Extracts: tweet text, author name, handle, avatar,
│       │             first image/video thumbnail, tweet URL
│       │
│       ├── linkedin.ts
│       │   Selector: .feed-shared-update-v2
│       │   Extracts: post text, author name, handle, avatar,
│       │             image thumbnail, post URL (from timestamp link)
│       │
│       └── reddit.ts
│           Selector: shreddit-post (Web Component)
│           Extracts: post title + text, author, subreddit,
│                     thumbnail (from post-media), post URL
│
├── popup/
│   ├── main.tsx         - React root mount
│   ├── App.tsx          - Auth gate: shows LoginForm or Home
│   ├── LoginForm.tsx
│   │   - Email + password fields
│   │   - Calls POST /api/auth/extension-login
│   │   - Stores token in chrome.storage.local on success
│   └── Home.tsx
│       - "Recently saved" — last 5 inspirations (from cached storage)
│       - Board list with counts
│       - Link to open Cadence dashboard
│
└── lib/
    ├── api.ts
    │   - Typed fetch wrapper
    │   - Reads CADENCE_URL from chrome.storage.local (set during login)
    │   - Attaches Authorization: Bearer <token> header
    │   - Exports: saveInspiration(), getBoards(), createBoard()
    │
    ├── auth.ts
    │   - getToken(): reads from chrome.storage.local
    │   - setToken(token, expiresAt, user): writes to chrome.storage.local
    │   - clearToken(): logout
    │   - isAuthenticated(): checks token exists + not expired
    │
    └── types.ts
        - Board, Inspiration, SuggestedPost (mirrors Prisma types)
```

---

### 4d. Content Script Interaction Model

**Why shadow DOM?**
The Save button and board popover are mounted into a shadow DOM root (`el.attachShadow({ mode: "open" })`). This prevents the host page's CSS (X, LinkedIn, Reddit all have aggressive global styles) from breaking the extension UI. The extension's own CSS is scoped inside the shadow root.

**Why service worker message passing for API calls?**
The content script runs in the page context and could theoretically be inspected. The API token should never be accessible from the page's JavaScript scope. The service worker holds the token and performs all fetch calls. Content scripts only send/receive structured messages.

**MutationObserver pattern:**
```
document loads
  → MutationObserver observes document.body (subtree, childList)
  → On mutation: scan added nodes for matching post selectors
  → For each new post element found:
      - Add mouseenter listener
      - On mouseenter: inject overlay into shadow DOM within the post element
      - On mouseleave (from both post and overlay): remove overlay after 300ms delay
```

---

## Phase 5 — AI Suggestion Pipeline (Detail)

### Prompt Structure

```
System:
You are a social media strategist for a content creator.
Analyze their saved inspirations and style history to generate
3 original post suggestions for {platform}.
Return a JSON array only, no other text.

User:
## Style Profile for {platform}
- Preferred tones: {acceptedTones.join(", ") || "not yet established"}
- Tones to avoid: {rejectedTones.join(", ") || "none"}
- Favourite topics: {topTopics.join(", ") || "general"}
- Typical post length: {avgPostLength || "flexible"} characters
- Uses emoji: {usesEmoji}
- Uses hashtags: {usesHashtags}

## Sample posts they liked:
{samplePosts.slice(0, 3).map((p, i) => `${i+1}. "${p}"`).join("\n")}

## Recent inspirations they saved:
{inspirations.map(i => `- [${i.sourcePlatform}] ${i.content?.slice(0, 200) ?? i.originalUrl}`).join("\n")}

Generate exactly 3 suggestions for {platform}.
Return: [{ "content": "...", "topic": "...", "tone": "...", "inspirationIds": [...] }]
```

### Cron Flow

```
Every Monday 6 AM UTC → POST /api/cron/suggestions (QStash)
  ↓
Fetch all eligible users (≥5 inspirations, ≥1 connected account)
  ↓
Batch into groups of 10
  ↓
For each batch → Promise.allSettled([generateSuggestionsForUser(userId, weekOf), ...])
  ↓
For each user:
  1. Fetch last 30 inspirations
  2. Fetch StyleMemory per platform
  3. For each connected platform:
     - Build prompt
     - Call GPT-4o (gpt-4o, temperature: 0.8, response_format: json)
     - Parse JSON array (3 items)
     - Insert SuggestedPost records
  4. Send SYSTEM notification: "Your weekly suggestions are ready"
```

---

## Environment Variables

No new third-party services are introduced. The following existing variables are reused:

```
OPENAI_API_KEY         # already used for AI chat/generate
QSTASH_TOKEN           # already used for post scheduling
NEXTAUTH_URL           # extension uses this as the base URL for API calls
```

One new env variable needed:
```
EXTENSION_TOKEN_SECRET # used to salt SHA-256 token hashing (32-char random string)
```

---

## Verification Checklist

### Schema
- [ ] `prisma migrate dev` runs without errors
- [ ] All new models visible in database

### Extension Auth
- [ ] `POST /api/auth/extension-login` returns token for valid credentials
- [ ] Returns 401 for wrong password
- [ ] Token works as `Authorization: Bearer` on `GET /api/boards`
- [ ] Token correctly expires after 90 days

### Boards & Inspirations
- [ ] Create board via API, appears in `GET /api/boards`
- [ ] Save inspiration via extension, appears on `/inspiration` dashboard page
- [ ] `Board.coverImage` auto-populated from first inspiration
- [ ] Delete board cascades to inspirations

### Chrome Extension
- [ ] Load `extension/dist` as unpacked in `chrome://extensions`
- [ ] Login form authenticates and stores token
- [ ] Save button appears on hover over tweets (X/Twitter)
- [ ] Save button appears on LinkedIn posts
- [ ] Save button appears on Reddit posts
- [ ] Board picker shows correct boards, last-used board pre-selected
- [ ] Saved inspiration appears in Cadence dashboard

### AI Suggestions
- [ ] Hit `POST /api/cron/suggestions` manually → `SuggestedPost` rows created
- [ ] `GET /api/suggestions` returns generated suggestions
- [ ] Accept suggestion → `StyleMemory` row updated with tone/topic/sample
- [ ] Reject suggestion → tone added to `rejectedTones`
- [ ] Next generation prompt includes `StyleMemory` data
- [ ] Manual generate button respects 24h rate limit

### No Regression
- [ ] `next build` completes without errors after schema changes
- [ ] `extension/` directory does not affect the Next.js build

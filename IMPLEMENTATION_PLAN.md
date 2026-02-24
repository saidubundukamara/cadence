# Cadence — Implementation Plan

## Context
**Cadence** is a full-stack AI-powered social media scheduling platform. Users can import a CSV of scheduled posts or create them manually. The platform uses OpenAI to generate/adapt content per platform, queues posts via Upstash QStash, and publishes automatically to X (Twitter) and Facebook/Instagram. The name reflects the steady rhythm of content flowing out to social platforms on schedule.

---

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Database | Neon (serverless Postgres) via Prisma ORM |
| Queue / Scheduler | Upstash Redis + Upstash QStash |
| Media Storage | Cloudinary |
| Auth | NextAuth v5 (Auth.js) |
| AI | OpenAI API (GPT-4o) |
| Social APIs | X API v2, Meta Graph API (Facebook + Instagram) |
| UI | shadcn/ui + Tailwind CSS v4 |
| State Management | Zustand |
| Date Handling | date-fns + react-day-picker |
| Icons | Lucide React |
| Theming | next-themes (dark-first, oklch color space) |
| Class Utils | clsx + tailwind-merge + class-variance-authority |

### UI Design Reference
The UI is modeled after the [Square UI Calendar Template](https://github.com/ln-dev7/square-ui/tree/master/templates-baseui/calendar) ([live demo](https://square-ui-calendar.vercel.app)). Key design principles adopted:
- **Dark-first design** with oklch color space for CSS variables, light/dark theme toggle
- **Sidebar + main content layout** — collapsible sidebar with navigation, workspace branding, and user profile footer
- **Week-view calendar** as the central dashboard — 7-day grid with hour slots (120px per hour), posts positioned absolutely by scheduled time
- **Post cards** on the calendar — styled like Square UI's event cards with 3 rendering variants based on duration/content length
- **Side sheet (panel)** for post details — opens from the right (560px max width) showing full post content, platform results, and actions
- **Synchronized scrolling** across day columns with auto-scroll to current time on load
- **Current-time indicator** — red horizontal line on today's column
- **Responsive design** — sidebar collapses to sheet on mobile (768px breakpoint)

**Adaptations from Square UI → Our App:**
| Square UI | Our Adaptation |
|---|---|
| Calendar events | Scheduled posts (with platform icons + status badges) |
| Event cards (3 variants by duration) | Post cards (3 variants: short preview, medium, full with media thumbnails) |
| EventSheet side panel | PostSheet — post content, platform results, retry button, edit/delete actions |
| Create Event dialog | Create Post dialog — platform selector, content, AI generate, media upload, schedule time |
| Sidebar nav (Dashboard, Candidates, etc.) | Sidebar nav (Dashboard, Posts, Import, Settings/Connections) |
| Notifications dropdown | Publish results notifications (published, failed, scheduled) |
| Filter popover (event type, participants) | Filter popover (platform: X/FB/IG, status: pending/published/failed) |
| Schedule popover | Quick-schedule popover with platform + date/time selection |
| Zustand calendar store | Zustand post/calendar store (week navigation, search, filters, post CRUD) |

---

## Folder Structure
```
cadence/
├── app/
│   ├── globals.css                  # Tailwind v4 imports, oklch CSS variables, light/dark themes
│   ├── layout.tsx                   # Root layout: font, ThemeProvider (dark default)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx               # SidebarProvider + Sidebar + main content shell
│   │   ├── dashboard/page.tsx       # CalendarHeader + CalendarControls + CalendarView
│   │   ├── posts/
│   │   │   ├── page.tsx             # All posts list (table view)
│   │   │   ├── new/page.tsx         # Create post form
│   │   │   └── [id]/page.tsx        # Post detail / edit
│   │   ├── import/page.tsx          # CSV import page
│   │   └── settings/
│   │       ├── page.tsx             # General settings
│   │       └── connections/page.tsx # Connected social accounts
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── posts/
│       │   ├── route.ts             # GET list, POST create
│       │   ├── [id]/route.ts        # GET, PATCH, DELETE
│       │   └── import/route.ts      # POST CSV bulk import
│       ├── publish/route.ts         # QStash webhook receiver
│       ├── ai/
│       │   └── generate/route.ts    # OpenAI content generation
│       ├── upload/route.ts          # Cloudinary signed upload
│       └── social/
│           ├── connect/[platform]/route.ts   # OAuth initiation
│           └── callback/[platform]/route.ts  # OAuth callback
├── components/
│   ├── theme-provider.tsx           # next-themes ThemeProvider wrapper
│   ├── theme-toggle.tsx             # Sun/Moon toggle button
│   ├── ui/                          # shadcn/ui auto-generated (Radix-based)
│   │   ├── button.tsx               # CVA-based with variants + sizes
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx                # Side panel for post details
│   │   ├── popover.tsx
│   │   ├── sidebar.tsx              # Full sidebar system (collapsible, mobile sheet)
│   │   ├── calendar.tsx             # react-day-picker wrapper
│   │   └── ...                      # badge, card, input, table, etc.
│   ├── calendar/                    # ── SCHEDULE CALENDAR (modeled after Square UI) ──
│   │   ├── calendar-controls.tsx    # Search bar, Today button, date range picker, filters popover
│   │   ├── calendar-day-column.tsx  # Single day column with hour grid + posts + time indicator
│   │   ├── calendar-header.tsx      # Top bar: date title, notifications dropdown, create post, theme toggle
│   │   ├── calendar-hours-column.tsx # Left-side hours column (12 AM – 11 PM)
│   │   ├── calendar-sidebar.tsx     # Left sidebar: nav, search, quick stats, user footer
│   │   ├── calendar-utils.ts        # Constants (HOUR_HEIGHT=120px) + position/height calculations
│   │   ├── calendar-view.tsx        # Main week view: orchestrates columns + scroll sync
│   │   ├── calendar-week-header.tsx # Day headers row (MON–SUN) with prev/next arrows
│   │   ├── create-post-dialog.tsx   # Modal dialog for creating new posts
│   │   ├── current-time-indicator.tsx # Red line showing current time on today's column
│   │   ├── post-card.tsx            # Individual post block on calendar (3 variants by content length)
│   │   ├── post-sheet.tsx           # Side sheet showing full post details + platform results + actions
│   │   └── schedule-popover.tsx     # Quick schedule popover from header
│   ├── posts/
│   │   ├── PostForm.tsx             # Full create/edit form (used in /posts/new and /posts/[id])
│   │   ├── PostStatusBadge.tsx
│   │   └── PlatformSelector.tsx
│   ├── import/
│   │   └── CSVImporter.tsx          # Drag-drop + parse + preview
│   └── dashboard/
│       └── StatsCards.tsx           # Overview stat cards above the calendar
├── hooks/
│   └── use-mobile.ts               # Media query hook (768px breakpoint)
├── store/
│   └── calendar-store.ts           # Zustand store: week nav, search, filters, post CRUD
├── lib/
│   ├── db.ts                        # Prisma client singleton
│   ├── utils.ts                     # cn() utility (clsx + tailwind-merge)
│   ├── auth.ts                      # NextAuth config
│   ├── openai.ts                    # OpenAI client + helpers
│   ├── cloudinary.ts                # Cloudinary upload helpers
│   ├── queue.ts                     # Upstash QStash schedule/cancel
│   ├── encryption.ts                # Token encrypt/decrypt helpers
│   └── social/
│       ├── twitter.ts               # X API v2 OAuth + publish
│       ├── facebook.ts              # Meta Graph API OAuth + publish
│       └── instagram.ts             # Instagram publish (via Meta API)
├── types/
│   └── index.ts                     # Shared TypeScript types
├── prisma/
│   └── schema.prisma
├── .env.local                       # All secrets
└── middleware.ts                    # Protect dashboard routes
```

---

## Prisma Schema (`prisma/schema.prisma`)
```prisma
model User {
  id             String          @id @default(cuid())
  name           String?
  email          String          @unique
  emailVerified  DateTime?
  image          String?
  password       String?         // hashed, for credentials login
  createdAt      DateTime        @default(now())
  accounts       Account[]       // NextAuth
  sessions       Session[]       // NextAuth
  socialAccounts SocialAccount[]
  posts          Post[]
}

model Account {
  // NextAuth standard Account model
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  // NextAuth standard Session model
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model SocialAccount {
  id            String   @id @default(cuid())
  userId        String
  platform      Platform
  accessToken   String   // encrypted at rest via lib/encryption.ts
  refreshToken  String?  // encrypted at rest
  accountId     String   // platform's user/page ID
  accountName   String   // display name (e.g., "@handle" or "My Page")
  pageId        String?  // Facebook Page ID (needed for FB/IG publishing)
  pageToken     String?  // Facebook Page Access Token (encrypted)
  expiresAt     DateTime?
  scopes        String[] // granted OAuth scopes for reference
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, platform])
}

model Post {
  id           String        @id @default(cuid())
  userId       String
  content      String        // base content
  platforms    Platform[]
  scheduledAt  DateTime
  status       PostStatus    @default(PENDING)
  mediaUrls    String[]
  aiGenerated  Boolean       @default(false)
  qstashId     String?       // for cancellation
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  results      PostResult[]
}

model PostResult {
  id             String    @id @default(cuid())
  postId         String
  platform       Platform
  status         PostStatus
  platformPostId String?   // ID returned by the platform after publish
  error          String?
  publishedAt    DateTime?
  post           Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
}

enum Platform {
  TWITTER
  FACEBOOK
  INSTAGRAM
}

enum PostStatus {
  PENDING
  PUBLISHED
  FAILED
  CANCELLED
}
```

---

## API Routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/[...nextauth]` | NextAuth handler |
| GET | `/api/posts` | List user's posts (with status filter) |
| POST | `/api/posts` | Create post + enqueue in QStash |
| GET | `/api/posts/[id]` | Get single post + results |
| PATCH | `/api/posts/[id]` | Reschedule or edit post |
| DELETE | `/api/posts/[id]` | Cancel post (remove from QStash) |
| POST | `/api/posts/import` | Parse CSV + bulk create + enqueue |
| POST | `/api/publish` | **QStash webhook** — executes posting |
| POST | `/api/ai/generate` | Generate platform-specific content |
| POST | `/api/upload` | Get Cloudinary signed upload URL |
| GET | `/api/social/connect/[platform]` | Redirect user to platform OAuth consent screen |
| GET | `/api/social/callback/[platform]` | Handle OAuth callback, exchange code for tokens, save to DB |
| DELETE | `/api/social/disconnect/[platform]` | Revoke tokens + delete SocialAccount record |
| POST | `/api/social/refresh/[platform]` | Refresh expired access tokens |

---

## CSV Import Format
```csv
platform,content,scheduled_at,media_url
TWITTER,"Check out our latest update!",2026-02-25T10:00:00Z,
FACEBOOK,"Big announcement coming soon. Stay tuned!",2026-02-25T12:00:00Z,https://example.com/image.jpg
INSTAGRAM,"Beautiful day",2026-02-26T09:00:00Z,https://example.com/photo.jpg
```

---

## Social Account OAuth Flow (How Users Grant Posting Permission)

### General Flow
```
User navigates to /settings/connections
        ↓
Clicks "Connect [Platform]" button
        ↓
GET /api/social/connect/[platform]
        ↓
Server generates OAuth URL with required scopes + PKCE/state params
        ↓
User is redirected to the platform's consent screen
        ↓
Platform shows: "Cadence wants to: Post on your behalf..."
        ↓
User clicks "Allow" / "Authorize"
        ↓
Platform redirects to GET /api/social/callback/[platform]?code=xxx&state=yyy
        ↓
Server verifies state, exchanges code for access_token + refresh_token
        ↓
Tokens are encrypted (AES-256-GCM) and saved to SocialAccount table
        ↓
User is redirected back to /settings/connections with success toast
```

### X (Twitter) — OAuth 2.0 with PKCE
```
Required scopes: tweet.read, tweet.write, users.read, offline.access

Authorization URL:
  https://twitter.com/i/oauth2/authorize
    ?response_type=code
    &client_id={TWITTER_CLIENT_ID}
    &redirect_uri={BASE_URL}/api/social/callback/twitter
    &scope=tweet.read tweet.write users.read offline.access
    &state={random_state}
    &code_challenge={pkce_challenge}
    &code_challenge_method=S256

Token exchange:
  POST https://api.twitter.com/2/oauth2/token
    grant_type=authorization_code
    &code={auth_code}
    &redirect_uri={same_redirect_uri}
    &code_verifier={pkce_verifier}

Token refresh:
  POST https://api.twitter.com/2/oauth2/token
    grant_type=refresh_token
    &refresh_token={encrypted_refresh_token}

Notes:
  - PKCE is REQUIRED (no client_secret in the browser flow)
  - Store code_verifier in an HTTP-only cookie or server session during the flow
  - Access tokens expire in 2 hours; refresh tokens last 6 months
  - offline.access scope is required to get a refresh token
```

### Facebook — OAuth 2.0
```
Required scopes: pages_manage_posts, pages_read_engagement, pages_show_list

Authorization URL:
  https://www.facebook.com/v21.0/dialog/oauth
    ?client_id={META_APP_ID}
    &redirect_uri={BASE_URL}/api/social/callback/facebook
    &scope=pages_manage_posts,pages_read_engagement,pages_show_list
    &state={random_state}

Token exchange:
  GET https://graph.facebook.com/v21.0/oauth/access_token
    ?client_id={META_APP_ID}
    &client_secret={META_APP_SECRET}
    &redirect_uri={same_redirect_uri}
    &code={auth_code}

After getting user token, fetch Page token:
  1. GET /me/accounts → returns list of Pages the user manages
  2. User selects which Page to connect (if multiple)
  3. Store the Page Access Token (long-lived, doesn't expire for pages)

Notes:
  - Facebook posting is done on PAGES, not personal profiles
  - Short-lived user token → exchange for long-lived token (60 days)
  - Page tokens derived from long-lived user tokens don't expire
  - Meta App must pass App Review for pages_manage_posts scope
```

### Instagram — Via Meta Graph API
```
Required scopes: instagram_basic, instagram_content_publish, pages_show_list

Authorization URL:
  Same as Facebook, but with additional Instagram scopes:
  https://www.facebook.com/v21.0/dialog/oauth
    ?client_id={META_APP_ID}
    &redirect_uri={BASE_URL}/api/social/callback/facebook
    &scope=pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish
    &state={random_state}

After OAuth:
  1. Get user's Pages: GET /me/accounts
  2. For each Page, get linked IG account: GET /{page_id}?fields=instagram_business_account
  3. Store the Instagram Business Account ID in SocialAccount.accountId
  4. Use the Page token (SocialAccount.pageToken) to publish to Instagram

Publishing to Instagram (two-step):
  Step 1 — Create media container:
    POST /{ig_account_id}/media
      ?image_url={public_image_url}
      &caption={content}
      &access_token={page_token}
  Step 2 — Publish the container:
    POST /{ig_account_id}/media_publish
      ?creation_id={container_id}
      &access_token={page_token}

Notes:
  - Instagram REQUIRES a Business or Creator account linked to a Facebook Page
  - Images MUST be publicly accessible URLs (Cloudinary handles this)
  - Instagram does NOT support text-only posts; media is required
  - Carousel posts need a different flow (create children, then carousel container)
```

### Token Security & Refresh Strategy
```
Encryption:
  - All tokens encrypted using AES-256-GCM before storing in DB
  - Encryption key stored in SOCIAL_TOKEN_ENCRYPTION_KEY env var
  - lib/encryption.ts provides encrypt() and decrypt() functions

Token refresh strategy:
  - On each publish attempt, check if token expires within 10 minutes
  - If expiring soon, refresh BEFORE attempting to post
  - If refresh fails, mark SocialAccount as needing re-authorization
  - Show warning banner on dashboard: "Your X connection has expired. Please reconnect."

Disconnecting:
  - DELETE /api/social/disconnect/[platform]
  - Revoke token with the platform's revocation endpoint (if available)
  - Delete SocialAccount record from DB
  - Cancel any PENDING posts that target only this platform
```

---

## QStash Scheduling Flow
```
User creates post
      ↓
POST /api/posts
      ↓
Validate: user has connected accounts for selected platforms
      ↓
Save Post to DB (status: PENDING)
      ↓
QStash.publishJSON({
  url: {BASE_URL}/api/publish,
  body: { postId },
  delay: secondsUntilScheduledAt,
  retries: 3
})
      ↓
Store qstashId on Post record
      ↓
[At scheduled time] QStash calls POST /api/publish
      ↓
Verify QStash signature (QSTASH_CURRENT_SIGNING_KEY / QSTASH_NEXT_SIGNING_KEY)
      ↓
Fetch post + user's social tokens from DB
      ↓
Check token expiry → refresh if needed
      ↓
For each platform in post.platforms:
  → Call twitter.ts / facebook.ts / instagram.ts publish functions
  → Create PostResult record (PUBLISHED or FAILED with error)
      ↓
Update Post.status:
  → All results PUBLISHED → Post status = PUBLISHED
  → Any result FAILED → Post status = FAILED (partial failures possible)
```

---

## AI Content Generation Flow
```
User fills brief (topic, tone, platforms selected)
      ↓
POST /api/ai/generate { topic, tone, platforms[], existingContent? }
      ↓
Build platform-specific system prompts:
  - Twitter: "Max 280 chars, punchy, hashtags, no markdown"
  - Facebook: "Longer form, engaging, can include links"
  - Instagram: "Caption style, heavy on hashtags, emoji-friendly"
      ↓
OpenAI GPT-4o generates platform-specific variants
      ↓
Return { twitter: "...", facebook: "...", instagram: "..." }
      ↓
Pre-fill PostForm with platform variants
      ↓
User can edit before scheduling
```

---

## Environment Variables (`.env.local`)
```env
# Database
DATABASE_URL=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# OpenAI
OPENAI_API_KEY=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# X (Twitter) API v2
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

# Meta (Facebook + Instagram)
META_APP_ID=
META_APP_SECRET=

# Token Encryption
SOCIAL_TOKEN_ENCRYPTION_KEY=          # 32-byte hex key for AES-256-GCM
```

---

## Implementation Phases

---

### Phase 1 — Project Scaffold & Infrastructure
**Goal:** Set up the project skeleton, install all dependencies, configure the database, establish the UI foundation with the Square UI design system.

**Steps:**
1. Initialize Next.js 15 project with TypeScript and Tailwind
   - `npx create-next-app@latest . --typescript --tailwind --app --src-dir=false`
2. Install all dependencies
   ```
   # Core
   npm i @prisma/client next-auth@beta @upstash/redis @upstash/qstash openai next-cloudinary papaparse zod react-hook-form @hookform/resolvers date-fns twitter-api-v2 bcryptjs

   # UI (Square UI pattern)
   npm i zustand next-themes react-day-picker clsx tailwind-merge class-variance-authority lucide-react tw-animate-css

   # Dev
   npm i -D prisma @types/papaparse @types/bcryptjs
   ```
3. Initialize Prisma with the full schema above
   - `npx prisma init`
   - Configure `DATABASE_URL` pointing to Neon
   - Add all models, enums from the schema section
   - `npx prisma db push` to sync with Neon
4. Initialize shadcn/ui
   - `npx shadcn@latest init`
   - Add components: button, input, card, dialog, sheet, popover, toast, dropdown-menu, badge, calendar, table, tabs, separator, sidebar, checkbox, select, textarea, tooltip, skeleton, avatar
5. Set up Tailwind CSS v4 with oklch color theming
   - Configure `app/globals.css` with `@theme inline` for CSS variable mapping
   - Define oklch color palette for light and dark themes (neutral grays, accent color)
   - Set up CSS custom properties for all design tokens: colors, border-radius, sidebar dimensions
6. Set up theming
   - Create `components/theme-provider.tsx` — next-themes ThemeProvider wrapper (dark default)
   - Create `components/theme-toggle.tsx` — Sun/Moon toggle button
   - Configure `app/layout.tsx` with ThemeProvider and font (Geist Sans)
7. Create utility files
   - `lib/utils.ts` — `cn()` function combining clsx + tailwind-merge
   - `lib/db.ts` — Prisma client singleton
   - `types/index.ts` — shared TypeScript types
   - `hooks/use-mobile.ts` — media query hook for responsive breakpoint (768px)
8. Set up `.env.local` with all environment variable placeholders

**Files created:**
- `prisma/schema.prisma`
- `app/globals.css` (oklch theme variables)
- `app/layout.tsx` (ThemeProvider, font)
- `components/theme-provider.tsx`
- `components/theme-toggle.tsx`
- `hooks/use-mobile.ts`
- `lib/utils.ts`
- `lib/db.ts`
- `types/index.ts`
- `.env.local`
- `components/ui/*` (shadcn — button, dialog, sheet, popover, sidebar, calendar, etc.)

**Deliverable:** App runs with `npm run dev`, dark theme active by default, Prisma connected to Neon, shadcn/ui + theming ready.

---

### Phase 2 — Authentication & Dashboard Layout Shell
**Goal:** Users can register, log in, and access protected dashboard routes. The dashboard layout (sidebar + header) follows the Square UI pattern.

**Steps:**
1. Configure NextAuth v5 (`lib/auth.ts`)
   - Credentials provider (email + bcrypt-hashed password)
   - Google OAuth provider (optional, for easy signup)
   - Prisma adapter for session/account storage
   - JWT strategy for session handling
2. Create auth API route
   - `app/api/auth/[...nextauth]/route.ts` — NextAuth handler
3. Create auth pages
   - `app/(auth)/login/page.tsx` — email/password form + Google button
   - `app/(auth)/register/page.tsx` — name, email, password, confirm password
   - Form validation with Zod + react-hook-form
   - Dark-themed, minimal design matching the dashboard aesthetic
4. Create route protection middleware
   - `middleware.ts` — redirect unauthenticated users from `/dashboard/*` to `/login`
   - Allow public access to `/login`, `/register`, `/api/auth/*`
5. Create dashboard layout shell (Square UI sidebar pattern)
   - `app/(dashboard)/layout.tsx`:
     - Wraps content in `SidebarProvider` from shadcn sidebar component
     - Sidebar + main content area with responsive behavior
   - `components/calendar/calendar-sidebar.tsx` (modeled after Square UI's `calendar-sidebar.tsx`):
     ```
     ┌──────────────────────┐
     │  Logo + "Cadence"    │  ← App branding
     │──────────────────────│
     │  🔍 Search... ⌘K    │  ← Search input with keyboard shortcut
     │──────────────────────│
     │  📊 Dashboard        │  ← Active state: highlighted bg
     │  📝 Posts            │  ← With count badge (pending posts)
     │  📥 Import           │
     │  📅 Calendar         │
     │  ⚙️ Settings         │
     │    └─ Connections    │
     │──────────────────────│
     │  Quick Stats         │  ← Collapsible section
     │  • 5 scheduled today │
     │  • 2 failed          │
     │──────────────────────│
     │                      │
     │  [+ New Post]        │  ← Quick action CTA button
     │──────────────────────│
     │  👤 User Name        │  ← Avatar + name + logout
     │  user@email.com      │
     └──────────────────────┘
     ```
     - 16rem wide (256px), collapsible
     - On mobile (< 768px): collapses to a sheet/drawer overlay
     - Navigation items with icons (Lucide), active state highlighting
     - Collapsible quick-stats section showing today's post counts
     - User profile footer with avatar, name, email, logout action
   - `components/calendar/calendar-header.tsx` (modeled after Square UI's `calendar-header.tsx`):
     ```
     ┌────────────────────────────────────────────────────────────┐
     │  February 24, 2026 • 3 posts scheduled today              │
     │                          [🔔] [📅 Schedule] [+ Create] [🌙]│
     └────────────────────────────────────────────────────────────┘
     ```
     - Left: formatted date + today's post summary
     - Right: notifications dropdown, quick-schedule popover, create post button, theme toggle
     - Notifications dropdown shows recent publish results (published, failed, scheduled)

**Files created:**
- `lib/auth.ts`
- `app/api/auth/[...nextauth]/route.ts`
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `middleware.ts`
- `app/(dashboard)/layout.tsx`
- `components/calendar/calendar-sidebar.tsx`
- `components/calendar/calendar-header.tsx`

**Deliverable:** Users can register, log in, see the full dashboard shell with Square UI-style sidebar and header, and are redirected if not authenticated.

---

### Phase 3 — Social Account Connections (OAuth Permissions)
**Goal:** Users can connect their X, Facebook, and Instagram accounts so the app can post on their behalf.

**This is how users grant the app permission to post on their platforms.**

#### Step 3.1 — Token Encryption Utility
- Create `lib/encryption.ts` with AES-256-GCM encrypt/decrypt functions
- Uses `SOCIAL_TOKEN_ENCRYPTION_KEY` from env
- All tokens are encrypted before writing to DB, decrypted when read

#### Step 3.2 — X (Twitter) OAuth 2.0 with PKCE
- Create `app/api/social/connect/twitter/route.ts`:
  1. Generate random `state` and PKCE `code_verifier` + `code_challenge`
  2. Store `state` and `code_verifier` in an HTTP-only cookie (short-lived, 10 min)
  3. Build authorization URL:
     ```
     https://twitter.com/i/oauth2/authorize
       ?response_type=code
       &client_id={TWITTER_CLIENT_ID}
       &redirect_uri={BASE_URL}/api/social/callback/twitter
       &scope=tweet.read tweet.write users.read offline.access
       &state={state}
       &code_challenge={code_challenge}
       &code_challenge_method=S256
     ```
  4. Redirect user to Twitter's consent screen
- Create `app/api/social/callback/twitter/route.ts`:
  1. Verify `state` matches cookie
  2. Exchange `code` + `code_verifier` for tokens:
     ```
     POST https://api.twitter.com/2/oauth2/token
       grant_type=authorization_code
       &code={code}
       &redirect_uri={redirect_uri}
       &code_verifier={code_verifier}
     ```
  3. Fetch user profile: `GET https://api.twitter.com/2/users/me`
  4. Encrypt `access_token` and `refresh_token`
  5. Upsert `SocialAccount` record with platform=TWITTER
  6. Redirect to `/settings/connections` with `?connected=twitter`

#### Step 3.3 — Facebook OAuth 2.0
- Create `app/api/social/connect/facebook/route.ts`:
  1. Generate random `state`, store in HTTP-only cookie
  2. Build authorization URL:
     ```
     https://www.facebook.com/v21.0/dialog/oauth
       ?client_id={META_APP_ID}
       &redirect_uri={BASE_URL}/api/social/callback/facebook
       &scope=pages_manage_posts,pages_read_engagement,pages_show_list
       &state={state}
     ```
  3. Redirect user to Facebook's consent screen
- Create `app/api/social/callback/facebook/route.ts`:
  1. Verify `state` matches cookie
  2. Exchange code for short-lived user token:
     ```
     GET https://graph.facebook.com/v21.0/oauth/access_token
       ?client_id={META_APP_ID}
       &client_secret={META_APP_SECRET}
       &redirect_uri={redirect_uri}
       &code={code}
     ```
  3. Exchange short-lived token for long-lived token (60 days):
     ```
     GET https://graph.facebook.com/v21.0/oauth/access_token
       ?grant_type=fb_exchange_token
       &client_id={META_APP_ID}
       &client_secret={META_APP_SECRET}
       &fb_exchange_token={short_lived_token}
     ```
  4. Fetch user's Pages: `GET /me/accounts?access_token={long_lived_token}`
  5. If multiple Pages, redirect to a page-selection UI; if one, auto-select
  6. Store the Page Access Token (derived from long-lived user token — doesn't expire)
  7. Encrypt tokens, upsert `SocialAccount` with platform=FACEBOOK, store `pageId` and `pageToken`
  8. Redirect to `/settings/connections` with `?connected=facebook`

#### Step 3.4 — Instagram (via Meta OAuth)
- Instagram uses the SAME Meta OAuth flow as Facebook, with additional scopes
- Extend the Facebook connect route to include Instagram scopes when user wants Instagram:
  ```
  Additional scopes: instagram_basic, instagram_content_publish
  ```
- In the callback, after getting the Page token:
  1. Fetch linked Instagram Business Account:
     ```
     GET /{page_id}?fields=instagram_business_account&access_token={page_token}
     ```
  2. If no Instagram Business Account linked, show error: "Please link an Instagram Business account to your Facebook Page"
  3. Store Instagram Business Account ID in `SocialAccount.accountId` for platform=INSTAGRAM
  4. Use the same Page token (`pageToken`) for Instagram API calls

#### Step 3.5 — Connections Settings Page
- Create `app/(dashboard)/settings/connections/page.tsx`:
  - Fetch user's `SocialAccount` records
  - Display connection status for each platform:
    ```
    ┌─────────────────────────────────────────┐
    │  🐦 X (Twitter)                         │
    │  Connected as @username                  │
    │  Scopes: tweet.read, tweet.write         │
    │  Expires: Mar 15, 2026                   │
    │  [Disconnect]                            │
    ├─────────────────────────────────────────┤
    │  📘 Facebook                             │
    │  Connected as "My Business Page"         │
    │  Page token: Never expires               │
    │  [Disconnect]                            │
    ├─────────────────────────────────────────┤
    │  📷 Instagram                            │
    │  Not connected                           │
    │  [Connect Instagram]                     │
    │  ⚠ Requires a Business/Creator account   │
    │    linked to a Facebook Page              │
    └─────────────────────────────────────────┘
    ```
  - "Connect" buttons → redirect to `/api/social/connect/[platform]`
  - "Disconnect" buttons → call `DELETE /api/social/disconnect/[platform]`
  - Show warning banners for expired tokens

#### Step 3.6 — Token Refresh Utility
- Create `lib/social/tokenRefresh.ts`:
  - `refreshTwitterToken(socialAccount)` — uses refresh_token to get new access_token
  - `refreshFacebookToken(socialAccount)` — exchange for new long-lived token if within 60-day window
  - Instagram uses the same Page token as Facebook (doesn't expire)
  - Called automatically before each publish attempt in Phase 6
  - If refresh fails, mark account status and alert user

#### Step 3.7 — Disconnect Flow
- Create `app/api/social/disconnect/[platform]/route.ts`:
  1. Authenticate the user
  2. Revoke the token with the platform (best-effort):
     - Twitter: `POST https://api.twitter.com/2/oauth2/revoke`
     - Facebook: `DELETE https://graph.facebook.com/{user_id}/permissions`
  3. Delete the `SocialAccount` record from DB
  4. Find any PENDING posts targeting ONLY this platform → update status to CANCELLED + cancel QStash job
  5. Return success

**Files created:**
- `lib/encryption.ts`
- `lib/social/tokenRefresh.ts`
- `app/api/social/connect/twitter/route.ts`
- `app/api/social/callback/twitter/route.ts`
- `app/api/social/connect/facebook/route.ts`
- `app/api/social/callback/facebook/route.ts`
- `app/api/social/disconnect/[platform]/route.ts`
- `app/(dashboard)/settings/connections/page.tsx`
- `app/(dashboard)/settings/page.tsx`

**Deliverable:** Users can connect/disconnect X, Facebook, and Instagram. Tokens are encrypted and stored. Expired tokens show warnings.

---

### Phase 4 — Post Creation & Scheduling
**Goal:** Users can create posts, attach media, select platforms, pick a schedule time, and the post is queued for publishing.

#### Step 4.1 — Cloudinary Media Upload
- Create `lib/cloudinary.ts` — generate signed upload URLs
- Create `app/api/upload/route.ts` — returns signed upload params
- Integrate Cloudinary upload widget (or drag-drop zone) in PostForm

#### Step 4.2 — Post Form Component
- Create `components/posts/PostForm.tsx`:
  - Platform selector (checkboxes for connected platforms only; disabled platforms show "Connect in Settings" link)
  - Content textarea with character count (280 for Twitter, 63,206 for Facebook, 2,200 for Instagram)
  - Date/time picker for `scheduledAt` (must be in the future)
  - Media upload zone (drag-drop or click to upload via Cloudinary)
  - Media preview thumbnails with remove button
  - "Generate with AI" button (wired in Phase 7)
  - Zod validation schema for all fields
  - Submit → `POST /api/posts`

#### Step 4.3 — Posts API Routes
- Create `app/api/posts/route.ts`:
  - `GET` — list user's posts with optional status filter, paginated, sorted by scheduledAt
  - `POST` — validate input, check user has connected accounts for selected platforms, save to DB, schedule via QStash
- Create `app/api/posts/[id]/route.ts`:
  - `GET` — fetch post with PostResult records
  - `PATCH` — edit content, reschedule (cancel old QStash job, create new one)
  - `DELETE` — cancel post (update status to CANCELLED, cancel QStash job)
- Create `lib/queue.ts`:
  - `schedulePost(postId, scheduledAt)` — QStash publishJSON with delay
  - `cancelPost(qstashId)` — QStash delete message

#### Step 4.4 — Post List & Detail Pages
- Create `app/(dashboard)/posts/page.tsx` — table/list of all posts with status badges, filter tabs (All, Pending, Published, Failed)
- Create `app/(dashboard)/posts/new/page.tsx` — renders PostForm for creation
- Create `app/(dashboard)/posts/[id]/page.tsx` — post detail with edit form + publish results per platform
- Create `components/posts/PostCard.tsx` — card view for post list
- Create `components/posts/PostStatusBadge.tsx` — colored badge (pending=yellow, published=green, failed=red)
- Create `components/posts/PlatformSelector.tsx` — platform checkbox group

**Files created:**
- `lib/cloudinary.ts`
- `lib/queue.ts`
- `app/api/upload/route.ts`
- `app/api/posts/route.ts`
- `app/api/posts/[id]/route.ts`
- `app/(dashboard)/posts/page.tsx`
- `app/(dashboard)/posts/new/page.tsx`
- `app/(dashboard)/posts/[id]/page.tsx`
- `components/posts/PostForm.tsx`
- `components/posts/PostCard.tsx`
- `components/posts/PostStatusBadge.tsx`
- `components/posts/PlatformSelector.tsx`

**Deliverable:** Users can create, edit, delete, and schedule posts. Posts are queued in QStash.

---

### Phase 5 — CSV Import
**Goal:** Users can bulk-import posts from a CSV file with preview and editing before scheduling.

#### Step 5.1 — CSV Importer Component
- Create `components/import/CSVImporter.tsx`:
  - Drag-and-drop zone + file input for CSV files
  - Parse CSV using PapaParse (client-side)
  - Validate each row: required fields, valid platform enum, valid date, valid URL (if provided)
  - Show errors inline per row
  - Preview table with editable cells (content, platform, date, media URL)
  - "Import All" button → `POST /api/posts/import`

#### Step 5.2 — Bulk Import API
- Create `app/api/posts/import/route.ts`:
  - Accept array of post objects
  - Validate all rows server-side with Zod
  - Check user has connected accounts for all referenced platforms
  - Bulk create Post records in a transaction
  - Schedule each post via QStash
  - Return summary: { imported: N, failed: N, errors: [...] }

#### Step 5.3 — Import Page
- Create `app/(dashboard)/import/page.tsx`:
  - Renders CSVImporter
  - Shows import results summary after submission
  - Link to download a CSV template

**Files created:**
- `components/import/CSVImporter.tsx`
- `app/api/posts/import/route.ts`
- `app/(dashboard)/import/page.tsx`

**Deliverable:** Users can upload a CSV, preview/edit rows, and bulk-schedule posts.

---

### Phase 6 — QStash Publish Webhook (Actual Posting)
**Goal:** When QStash fires at the scheduled time, the app publishes to the social platforms.

#### Step 6.1 — Publish Webhook
- Create `app/api/publish/route.ts`:
  1. Verify QStash signature using `@upstash/qstash` Receiver
  2. Extract `postId` from the request body
  3. Fetch Post + User's SocialAccounts from DB
  4. For each platform in `post.platforms`:
     a. Get the corresponding SocialAccount
     b. Decrypt tokens
     c. Check token expiry → refresh if needed (using `lib/social/tokenRefresh.ts`)
     d. Call the platform-specific publish function
     e. Create a PostResult record (PUBLISHED or FAILED)
  5. Update Post.status based on results

#### Step 6.2 — Twitter Publish Function
- Create `lib/social/twitter.ts`:
  - `publishToTwitter(content, mediaUrls, accessToken)`:
    1. If mediaUrls exist, upload media to Twitter's media endpoint first
    2. Create tweet: `POST https://api.twitter.com/2/tweets` with `{ text, media: { media_ids } }`
    3. Return `{ platformPostId, success }` or `{ error }`

#### Step 6.3 — Facebook Publish Function
- Create `lib/social/facebook.ts`:
  - `publishToFacebook(content, mediaUrls, pageId, pageToken)`:
    1. If mediaUrls, upload photo: `POST /{page_id}/photos` with `url` + `caption`
    2. If no media, create text post: `POST /{page_id}/feed` with `message`
    3. Return `{ platformPostId, success }` or `{ error }`

#### Step 6.4 — Instagram Publish Function
- Create `lib/social/instagram.ts`:
  - `publishToInstagram(content, mediaUrls, igAccountId, pageToken)`:
    1. Instagram REQUIRES at least one image — skip if no media
    2. Step 1: Create container: `POST /{ig_account_id}/media` with `image_url` + `caption`
    3. Step 2: Wait for container to be ready (poll status)
    4. Step 3: Publish: `POST /{ig_account_id}/media_publish` with `creation_id`
    5. Return `{ platformPostId, success }` or `{ error }`

**Files created:**
- `app/api/publish/route.ts`
- `lib/social/twitter.ts`
- `lib/social/facebook.ts`
- `lib/social/instagram.ts`

**Deliverable:** QStash triggers publishing at scheduled time. Posts go live on connected platforms. Results are recorded per platform.

---

### Phase 7 — AI Content Generation
**Goal:** Users can generate platform-optimized content using OpenAI GPT-4o.

#### Step 7.1 — OpenAI Integration
- Create `lib/openai.ts`:
  - Initialize OpenAI client
  - `generateContent(topic, tone, platforms[])` function:
    - Build system prompt per platform with rules:
      - Twitter: Max 280 chars, punchy, hashtags allowed, no markdown
      - Facebook: Longer form, engaging, links allowed, call to action
      - Instagram: Caption style, heavy hashtags, emoji-friendly, max 2200 chars
    - Call GPT-4o with structured output (JSON mode)
    - Return `{ twitter?: string, facebook?: string, instagram?: string }`

#### Step 7.2 — AI Generate API
- Create `app/api/ai/generate/route.ts`:
  - Accept `{ topic, tone, platforms[], existingContent? }`
  - Call `generateContent()` from lib/openai.ts
  - Return platform-specific variants
  - Rate limit: max 20 requests per user per hour (using Upstash Redis)

#### Step 7.3 — PostForm AI Integration
- Add "Generate with AI" button to `components/posts/PostForm.tsx`:
  - Opens a dialog: topic input, tone selector (professional, casual, humorous, etc.)
  - Calls `POST /api/ai/generate`
  - Pre-fills content textareas with generated variants
  - User can edit before scheduling
  - Show character count validation after generation

**Files created:**
- `lib/openai.ts`
- `app/api/ai/generate/route.ts`

**Files modified:**
- `components/posts/PostForm.tsx` (add AI generate button + dialog)

**Deliverable:** Users can generate AI content per platform, edit it, then schedule.

---

### Phase 8 — Dashboard: Schedule Calendar & Analytics (Square UI Pattern)
**Goal:** The main dashboard is a week-view schedule calendar (modeled after Square UI) where users see all their posts positioned by scheduled time, plus stats and filtering.

#### Step 8.1 — Zustand Calendar Store
- Create `store/calendar-store.ts`:
  - State:
    - `currentWeekStart` — Monday of the currently displayed week
    - `searchQuery` — text filter for post content
    - `platformFilter` — `"all" | "twitter" | "facebook" | "instagram"`
    - `statusFilter` — `"all" | "pending" | "published" | "failed"`
    - `selectedPostId` — post currently open in the side sheet (null if closed)
  - Actions:
    - `goToNextWeek()`, `goToPreviousWeek()`, `goToToday()`, `goToDate(date)`
    - `setSearchQuery(query)`, `setPlatformFilter(filter)`, `setStatusFilter(filter)`
    - `selectPost(id)`, `clearSelection()`
  - Computed:
    - `getWeekDays()` — returns 7 Date objects (Mon–Sun) for current week
    - `getFilteredPosts(posts)` — applies search, platform, and status filters

#### Step 8.2 — Calendar Utility Constants
- Create `components/calendar/calendar-utils.ts`:
  ```
  HOUR_HEIGHT = 120        // pixels per hour slot
  HOURS_IN_DAY = 24
  TOTAL_HEIGHT = 24 * 120  // 2880px total scrollable height
  INITIAL_SCROLL_OFFSET = 9 * 120  // auto-scroll to 9 AM on load (1080px)

  getPostTopPosition(scheduledAt: Date) → pixels from top
  getPostHeight(estimatedDuration: number) → pixels height
  formatHourLabel(hour: number) → "12 AM", "1 AM", ..., "11 PM"
  ```

#### Step 8.3 — Calendar Week View
- Create `components/calendar/calendar-view.tsx` (main orchestrator):
  - Renders the 7-day week grid with hours column on the left
  - **Synchronized scrolling**: all day columns + hours column scroll together via linked `onScroll` handlers and `useRef` arrays
  - Auto-scrolls to 9 AM on mount using `INITIAL_SCROLL_OFFSET`
  - Updates current time every 60 seconds via `setInterval`
  - Clicking a post card opens the `PostSheet` side panel
  - Layout:
    ```
    ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
    │  Hours  │   MON   │   TUE   │   WED   │   THU   │   FRI   │ SAT/SUN │
    ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
    │ 12 AM   │         │         │         │         │         │         │
    │  1 AM   │         │         │         │         │         │         │
    │  ...    │         │ ┌─────┐ │         │         │         │         │
    │  9 AM   │ ┌─────┐ │ │ 📘  │ │         │ ┌─────┐ │         │         │
    │ 10 AM   │ │ 🐦  │ │ │ FB  │ │         │ │ 📷  │ │         │         │
    │ 11 AM   │ │Tweet │ │ │Post │ │         │ │ IG  │ │         │         │
    │ 12 PM   │ └─────┘ │ └─────┘ │         │ └─────┘ │         │         │
    │  ...    │         │    ───── red time indicator (today)     │         │
    │ 11 PM   │         │         │         │         │         │         │
    └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
    ```

- Create `components/calendar/calendar-week-header.tsx`:
  - Day headers row showing MON 24, TUE 25, etc.
  - Previous/next week arrow buttons
  - Today's date highlighted with accent color

- Create `components/calendar/calendar-hours-column.tsx`:
  - Left-side column showing hour labels (12 AM – 11 PM)
  - Each slot is `HOUR_HEIGHT` (120px) tall

- Create `components/calendar/calendar-day-column.tsx`:
  - Single day column with 24 hour-slot divs
  - Posts positioned absolutely using calculated `top` and `height`:
    - `top = (hour * 60 + minute) * (HOUR_HEIGHT / 60)` pixels
    - `height = estimatedDuration * (HOUR_HEIGHT / 60)` pixels (min height: 30px)
  - Renders `PostCard` for each post scheduled on this day

- Create `components/calendar/current-time-indicator.tsx`:
  - Red horizontal line with a dot on the left
  - Only visible on today's column
  - Position updates every 60 seconds

#### Step 8.4 — Post Cards on Calendar (3 Variants)
- Create `components/calendar/post-card.tsx`:
  - **Short posts** (single platform, short content): Single-line layout with platform icon dot + truncated content + time
  - **Medium posts** (multi-platform or medium content): Two-line layout with platform icons + content preview on first line, time on second
  - **Full posts** (long content or with media): Full card with platform icons, content preview, media thumbnail, status badge
  - Color-coding by status:
    - Pending: neutral/gray border
    - Published: green accent border
    - Failed: red accent border
  - Platform icons: X logo, Facebook logo, Instagram logo (from Lucide or custom SVGs)
  - Click → opens PostSheet side panel
  - Hover → subtle scale/shadow animation

#### Step 8.5 — Post Detail Side Sheet
- Create `components/calendar/post-sheet.tsx` (modeled after Square UI's EventSheet):
  - Opens from the right side (560px max width) when a post card is clicked
  - Content:
    ```
    ┌──────────────────────────────────────┐
    │  Post Details                   [X]  │
    │──────────────────────────────────────│
    │  "Check out our latest update!..."   │  ← Full post content
    │──────────────────────────────────────│
    │  📅 Feb 25, 2026 at 10:00 AM        │  ← Scheduled time
    │  🌍 UTC-5 (Eastern)                  │  ← Timezone
    │──────────────────────────────────────│
    │  Platforms:                           │
    │  🐦 Twitter  ✅ Published            │  ← Per-platform results
    │     → tweet ID: 1234567890           │
    │  📘 Facebook ❌ Failed               │
    │     → Error: Token expired           │
    │     [Retry Facebook]                 │
    │──────────────────────────────────────│
    │  📎 Media:                           │
    │  [thumbnail] [thumbnail]             │  ← Media previews
    │──────────────────────────────────────│
    │  🤖 AI Generated: Yes               │
    │──────────────────────────────────────│
    │  [Edit] [Reschedule] [Delete]        │  ← Action buttons
    └──────────────────────────────────────┘
    ```
  - "Retry" button for failed platforms → re-enqueue in QStash for failed platforms only
  - "Edit" → navigate to `/posts/[id]`
  - "Reschedule" → date/time picker popover inline
  - "Delete" → confirmation dialog → cancel QStash + update status

#### Step 8.6 — Calendar Controls
- Create `components/calendar/calendar-controls.tsx` (modeled after Square UI):
  ```
  ┌────────────────────────────────────────────────────────────────────┐
  │  🔍 Search posts...  │  [Today]  │  Feb 24 – Mar 2, 2026  │ 🔽  │
  └────────────────────────────────────────────────────────────────────┘
  ```
  - Search input: filters posts by content text (real-time via Zustand)
  - "Today" button: jumps to current week
  - Date range display showing current week range (clickable → react-day-picker to jump to any date)
  - Filter popover (🔽 button):
    - Platform filter: All / X only / Facebook only / Instagram only
    - Status filter: All / Pending / Published / Failed
    - Active filter indicator dot on the filter button when filters are active

#### Step 8.7 — Schedule Popover
- Create `components/calendar/schedule-popover.tsx`:
  - Quick-schedule popover triggered from the header "Schedule" button
  - Compact form: platform checkboxes, content textarea, date picker, time inputs
  - "Schedule" button → `POST /api/posts`

#### Step 8.8 — Create Post Dialog
- Create `components/calendar/create-post-dialog.tsx`:
  - Full modal dialog for creating a new post (triggered from header "Create" button)
  - Fields: platform selector, content textarea, date/time picker, media upload, AI generate
  - More detailed than the schedule popover — same fields as the full PostForm

#### Step 8.9 — Stats Cards
- Create `components/dashboard/StatsCards.tsx`:
  - Displayed above the calendar on the dashboard page
  - Cards: Total posts, Published this week, Scheduled (upcoming), Failed (needs attention)
  - Each card clickable → applies the corresponding status filter on the calendar

#### Step 8.10 — Dashboard Page Assembly
- Create `app/(dashboard)/dashboard/page.tsx`:
  - Assembles all calendar components:
    ```
    <CalendarHeader />
    <StatsCards />
    <CalendarControls />
    <CalendarView />
    <PostSheet />  <!-- conditionally rendered when a post is selected -->
    ```
  - Fetches posts for the current week from the API (server component or client fetch)
  - Passes posts to CalendarView for rendering

**Files created:**
- `store/calendar-store.ts`
- `components/calendar/calendar-utils.ts`
- `components/calendar/calendar-view.tsx`
- `components/calendar/calendar-week-header.tsx`
- `components/calendar/calendar-hours-column.tsx`
- `components/calendar/calendar-day-column.tsx`
- `components/calendar/current-time-indicator.tsx`
- `components/calendar/post-card.tsx`
- `components/calendar/post-sheet.tsx`
- `components/calendar/calendar-controls.tsx`
- `components/calendar/schedule-popover.tsx`
- `components/calendar/create-post-dialog.tsx`
- `components/dashboard/StatsCards.tsx`
- `app/(dashboard)/dashboard/page.tsx`

**Deliverable:** Full Square UI-style week-view calendar dashboard showing scheduled posts positioned by time, with search, filters, post detail side sheet, quick-schedule, create post dialog, stats cards, and current-time indicator. Posts are color-coded by status and show platform icons.

---

## Prerequisites Before Development

Before starting Phase 1, you need these external accounts and credentials set up:

| Service | What to set up | URL |
|---|---|---|
| Neon | Create a Postgres database | https://neon.tech |
| Upstash | Create Redis database + enable QStash | https://upstash.com |
| Cloudinary | Create account, get API keys | https://cloudinary.com |
| OpenAI | Get API key | https://platform.openai.com |
| X Developer | Create app, get OAuth 2.0 client ID/secret, set callback URL | https://developer.x.com |
| Meta Developer | Create app, configure Facebook Login, request page permissions, set callback URL | https://developers.facebook.com |

### Platform App Review Requirements
- **X (Twitter):** Must apply for Elevated access to use tweet.write scope with real users
- **Meta (Facebook/Instagram):** Must submit app for review to use `pages_manage_posts` and `instagram_content_publish` scopes beyond test users

---

## Key Libraries
```json
{
  "dependencies": {
    "next": "^15",
    "next-auth": "^5",
    "@prisma/client": "^5",
    "@upstash/redis": "^1",
    "@upstash/qstash": "^2",
    "openai": "^4",
    "next-cloudinary": "^6",
    "papaparse": "^5",
    "zod": "^3",
    "react-hook-form": "^7",
    "@hookform/resolvers": "^3",
    "date-fns": "^3",
    "react-day-picker": "^9",
    "twitter-api-v2": "^1",
    "bcryptjs": "^2",
    "zustand": "^5",
    "next-themes": "^0.4",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "class-variance-authority": "^0.7",
    "lucide-react": "^0.460",
    "tw-animate-css": "^1"
  },
  "devDependencies": {
    "prisma": "^5",
    "@types/papaparse": "^5",
    "@types/bcryptjs": "^2"
  }
}
```

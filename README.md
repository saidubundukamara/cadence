# Cadence

AI-powered social media scheduling platform. Write once, publish everywhere — Cadence uses AI to craft platform-perfect posts, schedule them at optimal times, and publish automatically to Twitter, Facebook, and Instagram.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Neon (serverless Postgres) via Prisma v7 |
| Queue / Scheduler | Upstash QStash |
| Media Storage | Cloudinary |
| Auth | NextAuth v5 (Credentials + JWT) |
| AI | OpenAI API (GPT-4o) |
| Social APIs | Twitter API v2, Meta Graph API |
| UI | shadcn/ui + Tailwind CSS v4 (oklch) |
| State | Zustand |

## Features

- **Multi-platform publishing** — Twitter, Facebook, and Instagram from a single post
- **AI content generation** — Generate and adapt content per platform using OpenAI
- **Visual calendar** — Week-view calendar dashboard with drag-and-drop scheduling
- **CSV import** — Bulk import posts from spreadsheets
- **Scheduled publishing** — Queue posts via QStash with automatic retry
- **OAuth connections** — Connect social accounts through OAuth 2.0 flows
- **Dark/light mode** — Theme toggle with oklch color space

## Project Structure

```
app/
├── api/
│   ├── ai/generate/        # AI content generation
│   ├── auth/                # NextAuth + registration
│   ├── posts/               # CRUD + CSV import
│   ├── publish/             # QStash webhook handler
│   ├── social/              # OAuth connect/callback/disconnect
│   └── upload/              # Cloudinary media upload
├── dashboard/               # Calendar dashboard
├── import/                  # CSV import page
├── login/                   # Auth pages
├── register/
├── posts/                   # Post management
└── settings/                # Account connections
components/
├── calendar/                # Calendar view components
├── landing/                 # Landing page sections
├── posts/                   # Post form & selectors
└── ui/                      # shadcn/ui primitives
lib/
├── auth.ts                  # NextAuth config
├── db.ts                    # Prisma client
├── encryption.ts            # Token encryption
├── openai.ts                # OpenAI client
├── queue.ts                 # QStash scheduling
└── social/                  # Platform publish + token refresh
prisma/
└── schema.prisma            # Database schema
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- API keys for: OpenAI, Twitter, Meta (Facebook/Instagram), Cloudinary, Upstash QStash

### Environment Variables

Create a `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# OpenAI
OPENAI_API_KEY="sk-..."

# Twitter OAuth 2.0
TWITTER_CLIENT_ID=""
TWITTER_CLIENT_SECRET=""

# Meta (Facebook + Instagram)
META_APP_ID=""
META_APP_SECRET=""

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Upstash QStash
QSTASH_TOKEN=""
QSTASH_CURRENT_SIGNING_KEY=""
QSTASH_NEXT_SIGNING_KEY=""

# Encryption
ENCRYPTION_KEY="32-byte-hex-key"
```

### Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Database Schema

Key models: `User`, `SocialAccount` (OAuth tokens per platform), `Post` (content + scheduling), and `PostResult` (per-platform publish outcome). See `prisma/schema.prisma` for the full schema.

## Deployment

Deploy to [Vercel](https://vercel.com):

```bash
npm run build
```

Ensure all environment variables are configured in your Vercel project settings. The `NEXTAUTH_URL` must match your production domain for OAuth callbacks to work correctly.

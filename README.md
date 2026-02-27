# Semantic Compatibility Engine

A full-stack web application that analyzes compatibility between two Reddit users by comparing their posting histories using a Large Language Model. Enter two usernames, get back a structured compatibility report with shared interests, communication style analysis, and conversation starters.

**Live:** [Deploy URL] | **Stack:** Next.js 14, TypeScript, Groq (Llama 3.3 70B), PostgreSQL

---

## How It Works

```
Enter usernames --> Fetch Reddit posts --> Smart sample pairs --> LLM analysis --> Structured report
```

1. Fetches each user's submissions and comments via the Reddit OAuth2 API
2. Creates all possible cross-product pairs, then selects a hybrid sample: 50% random (for topic diversity) + 50% longest posts (for personality signal)
3. Sends the sampled pairs to Groq's Llama 3.3 70B model with a social psychologist prompt
4. Parses the structured JSON response into a visual compatibility report

No embeddings, no cosine similarity, no vector databases. A well-prompted LLM analyzing raw text outperforms a multi-stage embedding pipeline with far less infrastructure.

---

## Features

- **LLM-first analysis** -- qualitative compatibility assessment using Llama 3.3 70B via Groq
- **Smart sampling** -- hybrid random + longest-post pair selection maximizes signal within token limits
- **Structured output** -- JSON schema response renders into score circle, analysis cards, and conversation starters
- **24h response caching** -- normalized user pairs `(A,B) == (B,A)` avoid redundant LLM calls
- **Rate limiting** -- in-memory sliding window (10 req/min per IP)
- **Request validation** -- Zod schemas with specific error codes
- **Graceful degradation** -- runs without a database (caching disabled, analysis still works)
- **Glassmorphism UI** -- dark cosmic theme with glass panels, radar chart visualization, and animated score circle

---

## Quick Start

### Prerequisites

- Node.js 18+
- Reddit API credentials ([create app](https://www.reddit.com/prefs/apps) -- choose "script" type)
- Groq API key ([console.groq.com](https://console.groq.com))
- PostgreSQL database (optional -- [neon.tech](https://neon.tech), [railway.app](https://railway.app), or [render.com](https://render.com))

### Setup

```bash
cd web
npm install

# Create environment file
cp .env.example .env.local
```

Edit `.env.local`:

```env
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
GROQ_API_KEY=your_groq_api_key

# Optional -- enables 24h result caching
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
```

If using a database, initialize the schema:

```bash
psql $DATABASE_URL -f sql/schema.sql
```

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

### Deploy to Vercel

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Set root directory to `web`
4. Add environment variables in Vercel dashboard
5. Deploy

---

## API

### `POST /api/analyze`

**Request:**

```json
{
  "userA": "spez",
  "userB": "kn0thing",
  "postsLimit": 50,
  "samplePairs": 15
}
```

| Field         | Type   | Range  | Default | Required |
| ------------- | ------ | ------ | ------- | -------- |
| `userA`       | string | 1-20   | --      | Yes      |
| `userB`       | string | 1-20   | --      | Yes      |
| `postsLimit`  | number | 20-200 | 50      | No       |
| `samplePairs` | number | 10-30  | 15      | No       |

**Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userA": "spez",
  "userB": "kn0thing",
  "postsFetchedA": 47,
  "postsFetchedB": 50,
  "pairsAnalyzed": 15,
  "provider": "groq",
  "report": {
    "overallScore": "High - Strong intellectual and cultural overlap",
    "sharedInterests": [
      {
        "title": "Technology & Platform Development",
        "description": "Both users frequently discuss..."
      }
    ],
    "complementaryDifferences": "...",
    "communicationStyle": "...",
    "relationshipPotential": "...",
    "conversationStarters": ["...", "...", "...", "...", "..."]
  },
  "latencyMs": 3200,
  "createdAt": "2026-02-28T12:00:00.000Z",
  "cached": false
}
```

**Error codes:**

| Code                | HTTP | Cause                              |
| ------------------- | ---- | ---------------------------------- |
| `RATE_LIMITED`       | 429  | Too many requests from this IP     |
| `VALIDATION_ERROR`  | 400  | Invalid request parameters         |
| `SAME_USER`         | 400  | Cannot compare a user with itself  |
| `NO_POSTS`          | 404  | User has no public posts           |
| `USER_NOT_FOUND`    | 404  | Reddit username does not exist     |
| `USER_INACCESSIBLE` | 403  | Profile is private or suspended    |
| `CONFIG_ERROR`      | 503  | Missing API keys                   |
| `REDDIT_AUTH_ERROR`  | 503  | Reddit API authentication failed   |
| `INTERNAL_ERROR`    | 500  | Unexpected server error            |

**Headers:**

| Header                  | Value           |
| ----------------------- | --------------- |
| `X-Cache`               | `HIT` or `MISS` |
| `X-Latency-Ms`          | Request duration |
| `X-RateLimit-Remaining` | Requests left   |

---

## Architecture

```
web/src/
  app/
    api/analyze/route.ts    -- API orchestration (validation, rate limiting, caching, error normalization)
    page.tsx                -- Landing page (hero, input form, architecture diagram, features)
    results/page.tsx        -- Results page (score circle, radar chart, analysis cards)
    layout.tsx              -- Root layout (fonts, metadata)
    globals.css             -- Synapse design system (glass panels, cosmic theme)
  components/
    Navbar.tsx              -- Navigation bar
    Footer.tsx              -- Page footer
    LoadingOverlay.tsx      -- 4-step progress indicator
  lib/
    analyzer.ts             -- Smart sampling + prompt construction + Groq LLM + JSON parsing
    reddit.ts               -- Reddit OAuth2 client credentials + post fetching
    db.ts                   -- PostgreSQL connection pool + 24h cache + normalized user pairs
    rate-limit.ts           -- Sliding window rate limiter
    logger.ts               -- JSON-structured logging
  types/
    index.ts                -- TypeScript interfaces
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system diagram and component map.
See [DESIGN.md](DESIGN.md) for rationale behind every design decision.
See [HOW_IT_WORKS.md](HOW_IT_WORKS.md) for a detailed step-by-step walkthrough.

---

## Tech Stack

| Layer      | Technology                     | Why                                    |
| ---------- | ------------------------------ | -------------------------------------- |
| Framework  | Next.js 14 (App Router)       | API routes + frontend in one deploy    |
| Language   | TypeScript                     | End-to-end type safety                 |
| Styling    | Tailwind CSS                   | Utility-first + custom design tokens   |
| Validation | Zod                            | Runtime schema validation              |
| LLM        | Groq (Llama 3.3 70B)          | Free tier, fast inference              |
| Reddit     | OAuth2 REST API (direct)       | Zero-dependency, serverless-compatible |
| Database   | PostgreSQL (Neon/Railway)      | Optional, for caching + history        |
| Deployment | Vercel                         | Serverless, zero-config                |

---

## Example Users to Try

- **mistersavage** (Adam Savage)
- **J_Kenji_Lopez-Alt** (Chef Kenji)
- **GovSchwarzenegger** (Arnold Schwarzenegger)
- **thisisbillgates** (Bill Gates)

---

## Project Evolution

This project went through three distinct phases:

1. **ML Pipeline** -- Cross-encoder embeddings, cosine similarity, GPU compute backends, multi-stage analysis pipeline. 10+ Python files with PyTorch and sentence-transformers dependencies.

2. **Streamlit Prototype** -- Simplified to 3 Python files (streamlit_app.py, llm_providers.py, reddit_scraper.py). Replaced embeddings with direct LLM prompting. Deployed on Streamlit Cloud.

3. **Production App** (current) -- Full-stack Next.js 14 with TypeScript. React UI with Synapse design system. PostgreSQL caching, rate limiting, structured logging, Zod validation. Deployed on Vercel.

The legacy Python files remain in the repository root for reference. The active application lives in `web/`.

---

## Portfolio Positioning

This project demonstrates:

**System Design**
- Migrating a prototype to a production-grade full-stack application
- Layered architecture with clear separation of concerns (API orchestration, services, data access)
- Graceful degradation (database optional, error normalization, fallback parsing)

**Backend Engineering**
- TypeScript API route with Zod schema validation and typed error responses
- OAuth2 client credentials flow with in-memory token caching
- Normalized cache keys for bidirectional user pair deduplication
- Sliding window rate limiter with probabilistic cleanup
- Structured JSON logging for production observability

**Frontend Engineering**
- Converting static HTML mockups to interactive React components with data binding
- Custom design system implementation (glassmorphism, CSS animations, responsive layout)
- Multi-step loading state management
- Client-side navigation with state passing between routes

**AI/ML Engineering**
- Prompt engineering for structured JSON output from an LLM
- Hybrid sampling strategy (random + longest) for maximizing information density
- Graceful handling of unpredictable LLM output (JSON parse with markdown fallback)
- Understanding when NOT to use complex ML (embeddings, vector DBs) and choosing the simpler, more effective approach

**Key decision:** Replaced a multi-stage embedding pipeline with a single well-prompted LLM call -- fewer moving parts, better results, lower infrastructure cost.

---

## License

MIT

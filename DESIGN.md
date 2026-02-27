# Design

## Design Philosophy

This project intentionally evolved from a complex ML pipeline (vector embeddings, cross-encoders, cosine similarity) to a streamlined **LLM-first approach**, and then from a Python/Streamlit prototype to a **production-grade Next.js 14 application**.

The core insight: a well-prompted large language model analyzing raw post text produces comparable or better compatibility analysis than a multi-stage embedding pipeline -- with far less infrastructure complexity.

As stated in the original source code: *"No cross-encoder, no BS scoring -- just smart sampling + LLM!"*

---

## Key Design Decisions

### 1. Direct LLM Analysis over Embedding Pipelines

**Decision:** Send raw post text directly to an LLM rather than computing vector embeddings and similarity scores.

**Rationale:**
- LLMs capture nuance, humor, tone, and context that cosine similarity between embeddings cannot
- Eliminates the need for GPU infrastructure, embedding models, and similarity computation
- A single API call replaces an entire multi-stage pipeline
- Qualitative analysis (shared interests, communication style, conversation starters) is more useful than a raw similarity score

**Trade-off:** Less "scientific" -- the analysis depends on LLM quality and prompt engineering rather than deterministic computation. Mitigated by requesting structured JSON output with specific fields.

### 2. Next.js 14 over Streamlit

**Decision:** Migrate from Streamlit (Python) to Next.js 14 with App Router (TypeScript) for a single Vercel deployment.

**Rationale:**
- **Single deployment:** API routes + frontend in one Vercel project eliminates cold-start coordination between separate backend and frontend services
- **Real UI control:** React components provide full control over layout, animations, and interactivity that Streamlit's widget model cannot achieve
- **Production readiness:** Rate limiting, request validation (Zod), structured error codes, and JSON logging are natural in a Node.js/TypeScript API route but awkward in Streamlit
- **Design fidelity:** The Synapse design system (glassmorphism, radar charts, cosmic theme) required custom HTML/CSS that would be impossible to replicate in Streamlit
- **Type safety:** End-to-end TypeScript from API request validation to frontend rendering

**Trade-off:** Higher initial setup cost. More files and configuration than Streamlit's single-file model. Justified by production requirements.

### 3. Hybrid Smart Sampling Strategy

**Decision:** Select post pairs using a 50/50 split of random sampling and longest-post sampling.

**Rationale:**
- **Random pairs** ensure topic diversity and reduce bias toward any single interest area
- **Longest-post pairs** capture the most substantive content, where users reveal more personality, opinion depth, and communication style
- This hybrid approach maximizes information density within token limits

**Implementation:**
```
All possible cross-product pairs (user1 posts x user2 posts)
   |
   +-- numSamples / 2 randomly selected pairs     --> diversity
   +-- numSamples / 2 longest-text pairs           --> substance
   |
   +-- Combined, deduplicated, sent to LLM
```

### 4. Post Truncation at 300 Characters

**Decision:** Each post in a pair is truncated to 300 characters in the LLM prompt.

**Rationale:**
- With 15 pairs at ~600 chars each, total input stays around 10-12K characters -- well within LLM context windows
- First 300 characters typically contain the thesis or main point of a post
- Prevents a single long post from consuming disproportionate context budget
- Keeps API costs low (fewer input tokens)

### 5. Structured JSON Output over Raw Markdown

**Decision:** The LLM prompt requests a specific JSON schema rather than freeform Markdown.

**Rationale:**
- Enables the results page to render each section (score, shared interests, communication style) in dedicated UI components with custom styling
- Makes the data programmatically accessible for future features (e.g., comparison history, trend analysis)
- Eliminates fragile Markdown parsing

**Schema:**
```json
{
  "overallScore": "string",
  "sharedInterests": [{ "title": "string", "description": "string" }],
  "complementaryDifferences": "string",
  "communicationStyle": "string",
  "relationshipPotential": "string",
  "conversationStarters": ["string"]
}
```

**Fallback:** If the LLM returns invalid JSON, the parser falls back to wrapping the raw response as `rawMarkdown`, so the UI always has something to display.

### 6. Direct Reddit REST API over PRAW/snoowrap

**Decision:** Use Reddit's OAuth2 REST API directly via `fetch()` instead of wrapping libraries like PRAW (Python) or snoowrap (Node.js).

**Rationale:**
- Zero library dependencies for Reddit data access
- Full control over request construction, error handling, and timeout behavior
- OAuth2 client credentials flow is simple (one POST for a token, then Bearer auth on API calls)
- In-memory token caching avoids redundant auth requests
- Works cleanly in Vercel's serverless edge environment without native dependency issues

### 7. PostgreSQL with Graceful Degradation (No Supabase)

**Decision:** Use a standard PostgreSQL database (Neon/Railway/Render) with `pg` driver, but make the database entirely optional.

**Rationale:**
- **No Supabase:** Avoids Supabase's opinionated auth, RLS, and client SDK overhead for what is fundamentally a simple key-value cache
- **Optional database:** The app works without `DATABASE_URL` -- analysis still runs, caching and history are just disabled. This simplifies local development and testing.
- **Normalized user pairs:** Alphabetically sorting `(userA, userB)` before storage ensures `(alice, bob)` and `(bob, alice)` hit the same cache entry
- **24h TTL:** Cache entries expire after 24 hours, balancing freshness with API cost savings

### 8. In-Memory Rate Limiting

**Decision:** Sliding window rate limiter using a simple `Map<string, number[]>` in-process, rather than Redis or a distributed counter.

**Rationale:**
- Adequate for single-instance or low-traffic Vercel deployments
- Zero infrastructure dependencies
- Probabilistic cleanup (5% chance per request) prevents memory leaks
- Configurable via environment variables (`RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_MS`)

**Trade-off:** Not shared across Vercel serverless instances. If the app scales to multiple concurrent instances, each has its own counter. Acceptable for this use case; upgrade to Upstash Redis if needed.

### 9. Synapse Design System

**Decision:** Convert two static HTML mockups into React components with the Synapse design system, preserving visual fidelity.

**Design tokens:**
- Background: `#020410` (deep cosmic dark)
- Primary accent: cyan `#06b6d4`
- Secondary accent: blue `#3B82F6`
- Fonts: Inter (UI), JetBrains Mono (code/data)
- Glass effects: `backdrop-blur`, semi-transparent borders, subtle gradients
- CSS classes: `glass-panel`, `glass-card`, `cosmic-orb`, `radar-grid`, `radar-area`, `bg-grid`, `scanline`

**Rationale:** The HTML mockups demonstrated a polished, portfolio-grade aesthetic. Converting them to React/Tailwind preserves the design while making it interactive and data-driven.

---

## Prompt Engineering

The LLM prompt assigns a **social psychologist** persona and requests structured JSON output:

1. **Overall Compatibility Score** -- qualitative assessment with descriptor
2. **Shared Interests & Values** -- 3-5 specific overlap areas with evidence from posts
3. **Complementary Differences** -- enriching contrasts, not conflicts
4. **Communication Style Analysis** -- tone, formality, humor, engagement patterns
5. **Relationship Potential** -- friendship, intellectual exchange, collaboration potential
6. **Conversation Starters** -- 5 specific prompts based on shared interests

The prompt includes all sampled post pairs inline, formatted as:
```
Pair 1:
- userA: [truncated post text]
- userB: [truncated post text]
```

Temperature is set to **0.7** -- high enough for creative, natural-sounding analysis but low enough to stay grounded in actual post content. Max tokens is **2,500**.

---

## Architectural Evolution

### Phase 1: ML Pipeline (abandoned)

Complex multi-stage pipeline with GPU dependencies:

| Component                        | Purpose                              |
| -------------------------------- | ------------------------------------ |
| `cross_encoder_pipeline.py`      | Cross-encoder semantic similarity    |
| `stage_1_analyze_pairs.py`       | Multi-stage pipeline: pair analysis  |
| `stage_2_synthesize_report.py`   | Multi-stage pipeline: report synthesis |
| `embed_post.py`                  | Vector embedding generation          |
| `cuda.py` / `cpu.py`            | GPU and CPU compute backends         |

### Phase 2: Streamlit + LLM-first (prototype)

Simplified to 3 Python files with API-only dependencies:

| Component           | Purpose                           |
| -------------------- | --------------------------------- |
| `streamlit_app.py`  | UI + orchestration (374 lines)    |
| `llm_providers.py`  | Multi-provider LLM abstraction    |
| `reddit_scraper.py` | PRAW wrapper for Reddit data      |

### Phase 3: Next.js production app (current)

Full-stack TypeScript application:

| Old Approach                          | Current Approach                           |
| ------------------------------------- | ------------------------------------------ |
| Streamlit UI widgets                  | React 18 + Tailwind CSS + Synapse design   |
| Python + PRAW                         | TypeScript + Reddit OAuth2 REST API        |
| Raw Markdown LLM output              | Structured JSON with typed interfaces      |
| `@st.cache_data(ttl=3600)`           | PostgreSQL 24h cache with normalized keys  |
| No validation                         | Zod schema validation                      |
| No rate limiting                      | Sliding window per-IP rate limiter         |
| Console print statements             | JSON-structured logging                    |
| Streamlit Cloud deployment            | Vercel serverless deployment               |
| 5 optional LLM providers             | Groq only (simplicity, free tier)          |

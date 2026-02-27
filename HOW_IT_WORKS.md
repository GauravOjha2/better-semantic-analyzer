# How It Works

A step-by-step walkthrough of the Semantic Compatibility Engine, from user input to final report.

---

## User Journey

```
[1. Enter Usernames] --> [2. Validate + Rate Limit] --> [3. Check Cache] --> [4. Fetch Posts] --> [5. Sample Pairs] --> [6. LLM Analysis] --> [7. Store + Display]
```

---

## Step 1: User Input

The user opens the landing page (`web/src/app/page.tsx`) and sees:

- **Hero section** with the app title and description
- **Two input fields** for Reddit usernames (e.g., `spez` and `kn0thing`)
- **"Analyze Compatibility" button** to start the process

When the button is clicked, the frontend sends a POST request to `/api/analyze`:

```json
{
  "userA": "spez",
  "userB": "kn0thing",
  "postsLimit": 50,
  "samplePairs": 15
}
```

A `LoadingOverlay` component appears, showing progress through 4 steps: fetching user A, fetching user B, sampling pairs, and generating the report.

---

## Step 2: Request Validation + Rate Limiting

**File:** `web/src/app/api/analyze/route.ts`

The API route performs two checks before any work begins:

### Rate Limiting

```
IP address --> sliding window counter (Map<IP, timestamps[]>)
                |
                +-- 10 requests per 60 seconds (configurable)
                +-- Returns 429 if exceeded
```

### Zod Validation

```typescript
const AnalyzeSchema = z.object({
  userA: z.string().min(1).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  userB: z.string().min(1).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  postsLimit: z.number().int().min(20).max(200).optional().default(50),
  samplePairs: z.number().int().min(10).max(30).optional().default(15),
});
```

Also checks that userA and userB are not the same person.

---

## Step 3: Cache Check (24h Dedup)

**File:** `web/src/lib/db.ts`

If a `DATABASE_URL` is configured, the system checks for a recent analysis of the same user pair:

1. **Normalize the user pair** -- alphabetically sort `(userA, userB)` so that `(alice, bob)` and `(bob, alice)` are treated as the same pair
2. **Query PostgreSQL** for an analysis created within the last 24 hours
3. **If found:** return the cached result immediately with `X-Cache: HIT` header
4. **If not found:** proceed to Step 4

If no database is configured, this step is skipped entirely (graceful degradation).

---

## Step 4: Reddit Data Collection

**File:** `web/src/lib/reddit.ts` -- `fetchUserPosts()`

For each username, the system:

1. **Authenticates** with Reddit via OAuth2 client credentials flow:
   ```
   POST https://www.reddit.com/api/v1/access_token
   Authorization: Basic base64(client_id:client_secret)
   Body: grant_type=client_credentials
   ```
   Tokens are cached in-memory until near-expiry.

2. **Fetches submissions** (`limit / 2` posts) via:
   ```
   GET https://oauth.reddit.com/user/{username}/submitted?sort=new&limit={n}
   ```
   Extracts `title + selftext` as the post text.

3. **Fetches comments** (`limit / 2` posts) via:
   ```
   GET https://oauth.reddit.com/user/{username}/comments?sort=new&limit={n}
   ```
   Extracts `body` as the post text.

4. **Filters** out posts shorter than 10 characters (too short to be meaningful)

5. **Sorts by score** (most popular posts first)

6. **Returns** an array of `RedditPost` objects:
   ```typescript
   interface RedditPost {
     text: string;
     type: "submission" | "comment";
     score: number;
     created_utc: number;
     subreddit: string;
   }
   ```

If a user has no public posts, returns 404 with error code `NO_POSTS`. If the profile is private or suspended, returns 403 with `USER_INACCESSIBLE`.

---

## Step 5: Smart Pair Sampling

**File:** `web/src/lib/analyzer.ts` -- `samplePairs()`

Once both users' posts are fetched, the system creates post pairs for comparison:

1. **Generate all possible pairs** -- every combination of (user1 post, user2 post) as a cross-product
2. **Select random pairs** (`numSamples / 2`) -- provides topic diversity, avoids bias
3. **Select longest pairs** (`numSamples / 2`) -- prioritizes substantive content with more personality signal
4. **Combine and deduplicate** using a `Set` keyed on the first 50 characters of each post

**Why this matters:** With 50 posts per user, there are 2,500 possible pairs. Sending all of them to an LLM would be expensive and hit token limits. The hybrid sampling strategy (random + longest) maximizes information quality within a budget of ~15 pairs.

---

## Step 6: LLM Analysis

**File:** `web/src/lib/analyzer.ts` -- `buildPrompt()` + `generateAnalysis()`

### Prompt Construction

The prompt includes:

1. **Persona assignment:** *"You are an expert social psychologist analyzing Reddit users for compatibility"*
2. **The two usernames** being compared
3. **All sampled pairs**, formatted as:
   ```
   Pair 1:
   - userA: [first 300 characters of post]
   - userB: [first 300 characters of post]
   ```
4. **Requested JSON output structure** with specific fields:
   - `overallScore` -- qualitative descriptor with justification
   - `sharedInterests[]` -- 3-5 items with title and evidence
   - `complementaryDifferences` -- enriching contrasts
   - `communicationStyle` -- tone, formality, humor
   - `relationshipPotential` -- type of connection
   - `conversationStarters[]` -- 5 specific engaging questions

### LLM Invocation

```typescript
const completion = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.7,
  max_tokens: 2500,
});
```

### Response Parsing

The raw LLM response is parsed into a typed `CompatibilityReport`:

1. Strip markdown code fences if present
2. Attempt `JSON.parse()` on the response
3. Map fields to the `CompatibilityReport` interface with sensible defaults
4. **Fallback:** If JSON parsing fails, the raw text is stored in `rawMarkdown` and the UI renders it directly

---

## Step 7: Store + Display

### Database Storage

**File:** `web/src/lib/db.ts` -- `storeAnalysis()`

If a database is configured, the analysis is stored:

```sql
INSERT INTO analyses (id, user_a, user_b, posts_fetched_a, posts_fetched_b,
                      pairs_analyzed, provider, report_json, latency_ms)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
```

The `report_json` column stores the full `CompatibilityReport` as JSONB, enabling future queries against individual fields.

### API Response

The endpoint returns a structured `AnalysisResponse`:

```json
{
  "id": "uuid",
  "userA": "spez",
  "userB": "kn0thing",
  "postsFetchedA": 47,
  "postsFetchedB": 50,
  "pairsAnalyzed": 15,
  "provider": "groq",
  "report": {
    "overallScore": "High - Strong intellectual overlap...",
    "sharedInterests": [...],
    "complementaryDifferences": "...",
    "communicationStyle": "...",
    "relationshipPotential": "...",
    "conversationStarters": [...]
  },
  "latencyMs": 3200,
  "createdAt": "2026-02-28T...",
  "cached": false
}
```

Custom headers: `X-Cache: MISS`, `X-Latency-Ms: 3200`, `X-RateLimit-Remaining: 9`

### Results Page

**File:** `web/src/app/results/page.tsx`

The frontend navigates to `/results` and renders:

1. **Score circle** -- animated circular gauge showing the overall compatibility descriptor
2. **Radar chart** -- visual representation of compatibility dimensions
3. **Analysis cards** (glassmorphism panels):
   - Shared Interests -- each interest as a titled card with evidence
   - Complementary Differences
   - Communication Style
   - Relationship Potential
4. **Conversation Starters** -- 5 actionable prompts
5. **Developer mode toggle** -- shows raw JSON, metadata, and latency

---

## Complete Data Flow Diagram

```
User enters usernames: "alice" and "bob"
           |
           v
+---------------------+
|  POST /api/analyze   |  (route.ts)
+---------------------+
           |
           +-- Rate limit check (in-memory sliding window)
           +-- Zod validation (usernames, limits)
           +-- Same-user check
           |
           v
+---------------------+
|  Cache lookup        |  (db.ts)
|  WHERE user_a=$1     |  Normalized: ("alice","bob") == ("bob","alice")
|  AND user_b=$2       |  TTL: 24 hours
|  AND age < 24h       |
+---------------------+
           |
           | (cache miss)
           v
+---------------------+
|  fetchUserPosts()    |  (reddit.ts)
|  for "alice"         |
+---------------------+
           |
           |  OAuth2 token (cached) --> Reddit REST API
           |  Returns: 50 posts (25 submissions + 25 comments)
           v
+---------------------+
|  fetchUserPosts()    |  (reddit.ts)
|  for "bob"           |
+---------------------+
           |
           |  Same process for second user
           v
+---------------------+
|  samplePairs()       |  (analyzer.ts)
+---------------------+
           |
           |  1. Cross-product: 50 x 50 = 2,500 possible pairs
           |  2. Select 7-8 random pairs
           |  3. Select 7-8 longest pairs
           |  4. Combine into ~15 unique pairs
           v
+---------------------+
|  buildPrompt()       |  (analyzer.ts)
+---------------------+
           |
           |  Social psychologist persona
           |  15 pairs, each post truncated to 300 chars
           |  Requests structured JSON output
           v
+---------------------+
|  Groq API            |  (analyzer.ts via groq-sdk)
|  Llama 3.3 70B       |
|  temp=0.7, max=2500  |
+---------------------+
           |
           |  Returns: JSON compatibility report
           v
+---------------------+
|  parseReport()       |  (analyzer.ts)
|  JSON.parse()        |  Fallback: raw markdown
+---------------------+
           |
           v
+---------------------+
|  storeAnalysis()     |  (db.ts)
|  INSERT INTO analyses|  JSONB storage
+---------------------+
           |
           v
+---------------------+
|  JSON response       |  (route.ts)
|  + custom headers    |
+---------------------+
           |
           v
+---------------------+
|  Results page        |  (results/page.tsx)
|  - Score circle      |
|  - Radar chart       |
|  - Analysis cards    |
|  - Starters          |
+---------------------+
```

---

## Module Interaction Summary

```
page.tsx (landing)
    |
    +---> POST /api/analyze (route.ts)
              |
              +---> rate-limit.ts (check rate limit)
              +---> db.ts (cache lookup)
              +---> reddit.ts
              |         |
              |         +---> Reddit OAuth2 REST API
              |
              +---> analyzer.ts
              |         |
              |         +---> Groq API (Llama 3.3 70B)
              |
              +---> db.ts (store result)
              |
              v
         JSON response
              |
              v
results/page.tsx (results display)
```

- `route.ts` is the single orchestration point -- all service modules are imported here
- `reddit.ts`, `analyzer.ts`, and `db.ts` are independent of each other
- All external API communication (Reddit, Groq) happens via `fetch()` or SDK, never raw HTTP from the browser

---

## Running the App

```bash
# Navigate to the web directory
cd web

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your API keys:
# REDDIT_CLIENT_ID=your_id
# REDDIT_CLIENT_SECRET=your_secret
# GROQ_API_KEY=your_key
# DATABASE_URL=postgresql://... (optional)

# Start development server
npm run dev
```

The app starts on `http://localhost:3000`.

For production deployment on Vercel, set the environment variables in the Vercel dashboard and deploy via `git push`.

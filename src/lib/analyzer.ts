/**
 * Smart Sampling + LLM Analysis Module
 *
 * Port of generate_analysis() from streamlit_app.py.
 * Preserves: hybrid sampling (random + longest), 300-char truncation, exact prompt structure.
 * Enhancement: returns structured JSON instead of raw Markdown.
 */

import Groq from "groq-sdk";
import type { RedditPost, CompatibilityReport } from "@/types";

const MODEL = "llama-3.3-70b-versatile";

let _groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!_groq) {
    _groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return _groq;
}

/**
 * Hybrid smart sampling: 50% random + 50% longest posts.
 * Exact port of the Python logic from streamlit_app.py.
 */
function samplePairs(
  postsA: RedditPost[],
  postsB: RedditPost[],
  numSamples: number
): Array<[RedditPost, RedditPost]> {
  // Generate all possible cross-product pairs
  const allPairs: Array<[RedditPost, RedditPost]> = [];
  for (const a of postsA) {
    for (const b of postsB) {
      allPairs.push([a, b]);
    }
  }

  if (allPairs.length === 0) return [];

  const halfSamples = Math.floor(numSamples / 2);

  // Random sampling for diversity
  const shuffled = [...allPairs].sort(() => Math.random() - 0.5);
  const randomPairs = shuffled.slice(
    0,
    Math.min(halfSamples, allPairs.length)
  );

  // Longest-post sampling for substance
  const sortedByLength = [...allPairs].sort(
    (a, b) => b[0].text.length + b[1].text.length - (a[0].text.length + a[1].text.length)
  );
  const longestPairs = sortedByLength.slice(
    0,
    Math.min(halfSamples, allPairs.length)
  );

  // Combine and deduplicate
  const seen = new Set<string>();
  const result: Array<[RedditPost, RedditPost]> = [];

  for (const pair of [...randomPairs, ...longestPairs]) {
    const key = `${pair[0].text.slice(0, 50)}::${pair[1].text.slice(0, 50)}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(pair);
    }
  }

  return result.slice(0, numSamples);
}

/**
 * Build the analysis prompt -- exact structure from streamlit_app.py.
 */
function buildPrompt(
  pairs: Array<[RedditPost, RedditPost]>,
  userA: string,
  userB: string
): string {
  let pairsText = "";
  for (let i = 0; i < pairs.length; i++) {
    const [p1, p2] = pairs[i];
    const t1 = p1.text.length > 300 ? p1.text.slice(0, 300) + "..." : p1.text;
    const t2 = p2.text.length > 300 ? p2.text.slice(0, 300) + "..." : p2.text;
    pairsText += `\n**Pair ${i + 1}:**\n`;
    pairsText += `- ${userA}: ${t1}\n`;
    pairsText += `- ${userB}: ${t2}\n`;
  }

  return `You are an expert social psychologist analyzing Reddit users for compatibility.

**Users:** u/${userA} and u/${userB}

**Sample Post Comparisons:**
${pairsText}

**Your Task:**
Create a comprehensive, insightful compatibility report. Respond in valid JSON format with the following structure:

{
  "overallScore": "Excellent/High/Moderate/Low/Minimal - brief justification",
  "sharedInterests": [
    { "title": "Interest area name", "description": "Specific examples from their posts" }
  ],
  "complementaryDifferences": "What differences make them interesting to each other. Not conflicts, but complementary traits.",
  "communicationStyle": "How do they express themselves? Formal vs casual? Humorous vs serious? Data-driven vs emotional?",
  "relationshipPotential": "What kind of connection would work best? Friendship, mentorship, collaboration, romantic, etc.",
  "conversationStarters": [
    "Specific engaging question 1",
    "Specific engaging question 2",
    "Specific engaging question 3",
    "Specific engaging question 4",
    "Specific engaging question 5"
  ]
}

Provide 3-5 shared interests with specific evidence from their posts.
**Tone:** Insightful, warm, honest. Focus on genuine compatibility, not forced connections.
**IMPORTANT:** Return ONLY valid JSON, no markdown fencing, no extra text.`;
}

/**
 * Parse the LLM response into a structured CompatibilityReport.
 * Falls back to raw markdown if JSON parsing fails.
 */
function parseReport(raw: string): CompatibilityReport {
  // Try to extract JSON from the response
  let jsonStr = raw.trim();

  // Remove markdown code fences if present
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      overallScore: parsed.overallScore || "Unable to determine",
      sharedInterests: Array.isArray(parsed.sharedInterests)
        ? parsed.sharedInterests.map((item: { title?: string; description?: string }) => ({
            title: item.title || "Interest",
            description: item.description || "",
          }))
        : [],
      complementaryDifferences: parsed.complementaryDifferences || "",
      communicationStyle: parsed.communicationStyle || "",
      relationshipPotential: parsed.relationshipPotential || "",
      conversationStarters: Array.isArray(parsed.conversationStarters)
        ? parsed.conversationStarters
        : [],
      rawMarkdown: raw,
    };
  } catch {
    // Fallback: return raw text as markdown
    return {
      overallScore: "See full report",
      sharedInterests: [],
      complementaryDifferences: "",
      communicationStyle: "",
      relationshipPotential: "",
      conversationStarters: [],
      rawMarkdown: raw,
    };
  }
}

/**
 * Generate compatibility analysis using smart sampling + Groq LLM.
 * Core pipeline: sample pairs -> build prompt -> call LLM -> parse response.
 */
export async function generateAnalysis(
  postsA: RedditPost[],
  postsB: RedditPost[],
  userA: string,
  userB: string,
  numSamples: number = 15
): Promise<{ report: CompatibilityReport; pairsAnalyzed: number }> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  // Step 1: Smart sampling
  const pairs = samplePairs(postsA, postsB, numSamples);

  if (pairs.length === 0) {
    throw new Error("No post pairs available for analysis. Users may have no public posts.");
  }

  // Step 2: Build prompt (exact structure from streamlit_app.py)
  const prompt = buildPrompt(pairs, userA, userB);

  // Step 3: Call Groq LLM
  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
  });

  const rawResponse = completion.choices[0]?.message?.content || "";

  // Step 4: Parse into structured report
  const report = parseReport(rawResponse);

  return { report, pairsAnalyzed: pairs.length };
}

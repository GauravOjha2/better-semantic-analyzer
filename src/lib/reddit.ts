/**
 * Reddit Data Collection Module
 *
 * Fetches user submissions and comments via the Reddit API.
 * Port of reddit_scraper.py -- preserves the same data shape and filtering logic.
 */

import type { RedditPost } from "@/types";

const REDDIT_USER_AGENT = "SemanticCompatibilityEngine/1.0";

interface RedditToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: RedditToken | null = null;

/**
 * Get an OAuth2 token from Reddit using client credentials flow.
 * Tokens are cached in-memory until expiry.
 */
async function getRedditToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at) {
    return cachedToken.access_token;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are required");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": REDDIT_USER_AGENT,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Reddit auth failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.access_token;
}

/**
 * Fetch submissions and comments from a Reddit user.
 * Mirrors RedditScraper.fetch_user_posts() from reddit_scraper.py.
 *
 * @param username - Reddit username (without u/)
 * @param limit - Maximum number of posts to fetch (split between submissions and comments)
 * @returns Array of RedditPost objects sorted by score descending
 */
export async function fetchUserPosts(
  username: string,
  limit: number = 100
): Promise<RedditPost[]> {
  const token = await getRedditToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    "User-Agent": REDDIT_USER_AGENT,
  };

  const halfLimit = Math.floor(limit / 2);
  const posts: RedditPost[] = [];

  // Fetch submissions
  const submissionsRes = await fetch(
    `https://oauth.reddit.com/user/${encodeURIComponent(username)}/submitted?sort=new&limit=${halfLimit}&raw_json=1`,
    { headers }
  );

  if (!submissionsRes.ok) {
    if (submissionsRes.status === 404) {
      throw new Error(`User u/${username} not found`);
    }
    if (submissionsRes.status === 403) {
      throw new Error(`User u/${username} profile is private or suspended`);
    }
    throw new Error(
      `Failed to fetch submissions for u/${username}: ${submissionsRes.status}`
    );
  }

  const submissionsData = await submissionsRes.json();
  for (const child of submissionsData.data?.children ?? []) {
    const s = child.data;
    const text = `${s.title}. ${s.selftext || ""}`.trim();
    if (text && text.length > 10) {
      posts.push({
        text,
        type: "submission",
        score: s.score,
        created_utc: s.created_utc,
        subreddit: s.subreddit,
      });
    }
  }

  // Fetch comments
  const commentsRes = await fetch(
    `https://oauth.reddit.com/user/${encodeURIComponent(username)}/comments?sort=new&limit=${halfLimit}&raw_json=1`,
    { headers }
  );

  if (commentsRes.ok) {
    const commentsData = await commentsRes.json();
    for (const child of commentsData.data?.children ?? []) {
      const c = child.data;
      const text = (c.body || "").trim();
      if (text && text.length > 10) {
        posts.push({
          text,
          type: "comment",
          score: c.score,
          created_utc: c.created_utc,
          subreddit: c.subreddit,
        });
      }
    }
  }

  // Sort by score descending (most popular first)
  posts.sort((a, b) => b.score - a.score);

  return posts;
}

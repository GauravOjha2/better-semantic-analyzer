// Shared types for the Semantic Compatibility Engine

export interface RedditPost {
  text: string;
  type: "submission" | "comment";
  score: number;
  created_utc: number;
  subreddit: string;
}

export interface AnalysisRequest {
  userA: string;
  userB: string;
  postsLimit?: number;
  samplePairs?: number;
}

export interface CompatibilityReport {
  overallScore: string;
  sharedInterests: ReportSection[];
  complementaryDifferences: string;
  communicationStyle: string;
  relationshipPotential: string;
  conversationStarters: string[];
  rawMarkdown: string;
}

export interface ReportSection {
  title: string;
  description: string;
}

export interface AnalysisResponse {
  id: string;
  userA: string;
  userB: string;
  postsFetchedA: number;
  postsFetchedB: number;
  pairsAnalyzed: number;
  provider: string;
  report: CompatibilityReport;
  latencyMs: number;
  createdAt: string;
  cached: boolean;
}

export interface AnalysisMetadata {
  postsFetchedA: number;
  postsFetchedB: number;
  pairsAnalyzed: number;
  provider: string;
  latencyMs: number;
  cached: boolean;
}

export interface ApiError {
  error: string;
  code: string;
  details?: string;
}

// Progress steps for the loading UI
export type AnalysisStep =
  | "idle"
  | "fetching_user_a"
  | "fetching_user_b"
  | "sampling"
  | "generating"
  | "complete"
  | "error";

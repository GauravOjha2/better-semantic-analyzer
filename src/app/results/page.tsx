"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import type { AnalysisResponse, AnalysisMetadata } from "@/types";

/* ─── Animation Variants ─── */
const EASE_OUT: [number, number, number, number] = [0.25, 0.4, 0.25, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT, delay },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerChild = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeUp}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Score Circle with animated stroke ─── */
function ScoreCircle({ score }: { score: string }) {
  const scoreMap: Record<string, number> = {
    excellent: 92,
    high: 78,
    moderate: 58,
    low: 35,
    minimal: 15,
  };
  const key = score.toLowerCase().split(/[\s-]/)[0];
  const pct = scoreMap[key] || 60;
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (pct / 100) * circumference;

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="relative size-52 md:size-60">
      <svg className="size-full -rotate-90 transform" viewBox="0 0 100 100">
        <circle
          className="text-reddit-border"
          cx="50"
          cy="50"
          fill="transparent"
          r="42"
          stroke="currentColor"
          strokeWidth="5"
        />
        <motion.circle
          className="text-reddit-orange"
          cx="50"
          cy="50"
          fill="transparent"
          r="42"
          stroke="currentColor"
          strokeDasharray={String(circumference)}
          strokeLinecap="round"
          strokeWidth="5"
          initial={{ strokeDashoffset: circumference }}
          animate={
            isInView
              ? { strokeDashoffset: dashOffset }
              : { strokeDashoffset: circumference }
          }
          transition={{ duration: 1.5, ease: EASE_OUT, delay: 0.3 }}
          style={{
            filter: "drop-shadow(0 0 6px rgba(255, 69, 0, 0.4))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8, type: "spring", stiffness: 120 }}
          className="text-5xl md:text-6xl font-black text-reddit-text tracking-tighter"
        >
          {pct}
          <span className="text-2xl text-reddit-orange align-top">%</span>
        </motion.span>
        <span className="text-xs font-bold text-reddit-orange uppercase tracking-widest mt-1">
          Match
        </span>
      </div>
    </div>
  );
}

/* ─── Radar Chart ─── */
function RadarChart() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.svg
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.8, ease: EASE_OUT }}
      className="w-full h-full max-w-[320px]"
      viewBox="0 0 400 400"
    >
      <polygon
        className="radar-grid"
        fill="rgba(255,255,255,0.02)"
        points="200,40 352,150 294,330 106,330 48,150"
      />
      <polygon
        className="radar-grid"
        fill="none"
        points="200,80 314,162 270,298 130,298 86,162"
      />
      <polygon
        className="radar-grid"
        fill="none"
        points="200,120 276,175 247,265 153,265 124,175"
      />
      <line className="radar-grid" x1="200" x2="200" y1="200" y2="40" />
      <line className="radar-grid" x1="200" x2="352" y1="200" y2="150" />
      <line className="radar-grid" x1="200" x2="294" y1="200" y2="330" />
      <line className="radar-grid" x1="200" x2="106" y1="200" y2="330" />
      <line className="radar-grid" x1="200" x2="48" y1="200" y2="150" />
      <motion.polygon
        className="radar-area"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.5 }}
        points="200,60 330,160 260,300 130,280 90,180"
      />
      {[
        [200, 60],
        [330, 160],
        [260, 300],
        [130, 280],
        [90, 180],
      ].map(([cx, cy], i) => (
        <motion.circle
          key={i}
          className="fill-reddit-orange"
          cx={cx}
          cy={cy}
          initial={{ r: 0 }}
          animate={isInView ? { r: 4 } : {}}
          transition={{ duration: 0.3, delay: 0.7 + i * 0.1 }}
        />
      ))}
      <text
        className="fill-reddit-text-muted text-[10px] font-bold uppercase"
        textAnchor="middle"
        x="200"
        y="25"
      >
        Topic Overlap
      </text>
      <text
        className="fill-reddit-text-muted text-[10px] font-bold uppercase"
        textAnchor="start"
        x="360"
        y="150"
      >
        Sentiment
      </text>
      <text
        className="fill-reddit-text-muted text-[10px] font-bold uppercase"
        textAnchor="middle"
        x="310"
        y="350"
      >
        Comm. Tone
      </text>
      <text
        className="fill-reddit-text-muted text-[10px] font-bold uppercase"
        textAnchor="middle"
        x="90"
        y="350"
      >
        Engagement
      </text>
      <text
        className="fill-reddit-text-muted text-[10px] font-bold uppercase"
        textAnchor="end"
        x="40"
        y="150"
      >
        Expertise
      </text>
    </motion.svg>
  );
}

/* ─── Developer Panel ─── */
function DeveloperPanel({ metadata }: { metadata: AnalysisMetadata }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-[10px] font-mono text-reddit-text-faint"
    >
      <span>
        Posts A:{" "}
        <span className="text-reddit-orange">{metadata.postsFetchedA}</span>
      </span>
      <span>
        Posts B:{" "}
        <span className="text-reddit-orange">{metadata.postsFetchedB}</span>
      </span>
      <span>
        Pairs:{" "}
        <span className="text-reddit-orange">{metadata.pairsAnalyzed}</span>
      </span>
      <span>
        Provider:{" "}
        <span className="text-reddit-orange">{metadata.provider}</span>
      </span>
      <span>
        Latency:{" "}
        <span className="text-reddit-orange">{metadata.latencyMs}ms</span>
      </span>
      <span>
        Cache:{" "}
        <span className="text-reddit-orange">
          {metadata.cached ? "HIT" : "MISS"}
        </span>
      </span>
    </motion.div>
  );
}

/* ─── Results Content ─── */
function ResultsContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult");
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        // ignore parse error
      }
    }
  }, []);

  if (!data) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-full bg-reddit-orange/10 flex items-center justify-center mx-auto mb-6 border border-reddit-orange/20">
              <span className="material-symbols-outlined text-reddit-orange text-2xl">
                search_off
              </span>
            </div>
            <h2 className="text-2xl font-bold text-reddit-text mb-3">
              No Results Found
            </h2>
            <p className="text-reddit-text-muted mb-8">
              Run an analysis from the home page first.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-reddit-orange text-white font-semibold rounded-xl hover:bg-reddit-orange-dark transition-colors shadow-lg shadow-reddit-orange/20"
            >
              Go to Home
            </Link>
          </motion.div>
        </main>
      </>
    );
  }

  const report = data.report;
  const metadata: AnalysisMetadata = {
    postsFetchedA: data.postsFetchedA,
    postsFetchedB: data.postsFetchedB,
    pairsAnalyzed: data.pairsAnalyzed,
    provider: data.provider,
    latencyMs: data.latencyMs,
    cached: data.cached,
  };

  const reportCards = [
    {
      icon: "diversity_3",
      title: "Shared Interests & Values",
      color: "text-reddit-orange",
      border: "border-t-reddit-orange",
      content: (
        <ul className="space-y-2.5">
          {report.sharedInterests.length > 0 ? (
            report.sharedInterests.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-reddit-text-muted"
              >
                <span className="text-reddit-orange mt-0.5 shrink-0">▸</span>
                <span>
                  <strong className="text-reddit-text">{item.title}:</strong>{" "}
                  {item.description}
                </span>
              </li>
            ))
          ) : (
            <li className="text-xs text-reddit-text-faint italic">
              See full report below
            </li>
          )}
        </ul>
      ),
    },
    {
      icon: "contrast",
      title: "Complementary Differences",
      color: "text-purple-400",
      border: "border-t-purple-500",
      content: (
        <p className="text-xs text-reddit-text-muted leading-relaxed">
          {report.complementaryDifferences ||
            "See full report below for details."}
        </p>
      ),
    },
    {
      icon: "chat",
      title: "Communication Analysis",
      color: "text-emerald-400",
      border: "border-t-emerald-500",
      content: (
        <p className="text-xs text-reddit-text-muted leading-relaxed">
          {report.communicationStyle || "See full report below for details."}
        </p>
      ),
    },
    {
      icon: "trending_up",
      title: "Relationship Potential",
      color: "text-amber-400",
      border: "border-t-amber-500",
      content: (
        <p className="text-xs text-reddit-text-muted leading-relaxed">
          {report.relationshipPotential || "See full report below for details."}
        </p>
      ),
    },
  ];

  return (
    <>
      <Navbar />

      {/* Background cosmic orb */}
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] cosmic-orb pointer-events-none z-0 opacity-40"></div>

      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 py-8 lg:px-8 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-6"
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-reddit-orange/10 border border-reddit-orange/20 text-reddit-orange text-xs font-mono mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-reddit-orange opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-reddit-orange"></span>
              </span>
              ANALYSIS COMPLETE
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-reddit-text">
              Compatibility Report
            </h1>
            <p className="text-reddit-text-muted text-base flex items-center gap-2 font-mono">
              <span className="text-reddit-orange">u/{data.userA}</span>
              <span className="text-reddit-text-faint">&#8596;</span>
              <span className="text-reddit-orange">u/{data.userB}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 bg-reddit-card p-1.5 pl-4 pr-2 rounded-lg border border-reddit-border">
              <span className="text-[10px] font-bold text-reddit-text-muted tracking-wider uppercase">
                Dev Mode
              </span>
              <button
                onClick={() => setDevMode(!devMode)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-reddit-orange focus:ring-offset-2 focus:ring-offset-reddit-dark ${
                  devMode ? "bg-reddit-orange" : "bg-reddit-border"
                }`}
              >
                <span className="sr-only">Toggle developer mode</span>
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                    devMode ? "translate-x-5" : "translate-x-1"
                  }`}
                ></span>
              </button>
            </div>
            {devMode && <DeveloperPanel metadata={metadata} />}
          </div>
        </motion.div>

        {/* Score + Summary */}
        <AnimatedSection delay={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            <div className="lg:col-span-8 lg:col-start-3 card-elevated rounded-2xl p-8 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 relative overflow-hidden">
              {/* Subtle glow behind score */}
              <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-reddit-orange/[0.04] rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex items-center justify-center shrink-0 relative z-10">
                <ScoreCircle score={report.overallScore} />
              </div>
              <div className="max-w-sm text-center md:text-left relative z-10">
                <h3 className="text-xl font-bold text-reddit-text mb-2 flex items-center justify-center md:justify-start gap-2">
                  <span className="material-symbols-outlined text-reddit-orange">
                    hub
                  </span>
                  {report.overallScore.split("-")[0]?.trim() ||
                    report.overallScore}
                </h3>
                <p className="text-reddit-text-muted text-sm leading-relaxed">
                  {report.overallScore}
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Analysis Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Radar Chart */}
          <AnimatedSection delay={0.15} className="lg:col-span-5">
            <div className="card rounded-2xl p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-reddit-text uppercase tracking-wider">
                  Trait Alignment
                </h3>
                <span
                  className="material-symbols-outlined text-reddit-text-faint text-lg cursor-help"
                  title="Visualization of compatibility dimensions"
                >
                  help
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center relative min-h-[300px]">
                <RadarChart />
              </div>
            </div>
          </AnimatedSection>

          {/* Report Cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {reportCards.map((card, i) => (
              <motion.div
                key={i}
                variants={staggerChild}
                whileHover={{ y: -3 }}
                className={`card rounded-2xl p-5 border-t-2 ${card.border} transition-shadow duration-300 hover:shadow-lg hover:shadow-black/20`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`material-symbols-outlined ${card.color}`}
                  >
                    {card.icon}
                  </span>
                  <h4 className="font-bold text-reddit-text text-sm">
                    {card.title}
                  </h4>
                </div>
                {card.content}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Conversation Starters */}
        {report.conversationStarters.length > 0 && (
          <AnimatedSection delay={0.1}>
            <div className="card-elevated rounded-2xl p-8 mb-12 relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-60 h-60 bg-reddit-orange/[0.03] rounded-full blur-3xl pointer-events-none"></div>
              <h3 className="text-lg font-bold text-reddit-text mb-6 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-reddit-orange">
                  forum
                </span>
                Conversation Starters
              </h3>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10"
              >
                {report.conversationStarters.map((starter, i) => (
                  <motion.div
                    key={i}
                    variants={staggerChild}
                    whileHover={{ y: -3, borderColor: "rgba(255,69,0,0.3)" }}
                    className="bg-reddit-dark border border-reddit-border p-4 rounded-xl transition-colors cursor-default group"
                  >
                    <div className="text-reddit-orange font-mono text-xs mb-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <p className="text-sm text-reddit-text leading-relaxed">
                      &ldquo;{starter}&rdquo;
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </AnimatedSection>
        )}

        {/* Raw Report Fallback */}
        {report.rawMarkdown && report.sharedInterests.length === 0 && (
          <AnimatedSection>
            <div className="card-elevated rounded-2xl p-8 mb-12">
              <h3 className="text-lg font-bold text-reddit-text mb-4">
                Full Report
              </h3>
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-reddit-text-muted text-sm leading-relaxed">
                {report.rawMarkdown}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Footer Metadata */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="pt-8 border-t border-reddit-border flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-reddit-text-faint font-mono uppercase tracking-widest mb-12"
        >
          <div className="flex gap-6">
            <span>
              ID:{" "}
              <span className="text-reddit-text-muted">
                {data.id.slice(0, 12)}
              </span>
            </span>
            <span>
              Latency:{" "}
              <span className="text-reddit-text-muted">
                {data.latencyMs}ms
              </span>
            </span>
            <span>
              Cache:{" "}
              <span className="text-reddit-text-muted">
                {data.cached ? "HIT" : "MISS"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500/30 flex items-center justify-center">
              <div className="size-1 rounded-full bg-green-500"></div>
            </div>
            System Operational
          </div>
          <Link
            href="/"
            className="text-reddit-text-muted hover:text-reddit-orange transition-colors normal-case tracking-normal text-xs flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>
            Run Another Analysis
          </Link>
        </motion.div>
      </main>

      <Footer />
    </>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-reddit-dark">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-8 h-8 border-2 border-reddit-orange border-t-transparent rounded-full animate-spin"></div>
            <span className="text-reddit-text-muted text-sm font-mono">
              Loading results...
            </span>
          </motion.div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}

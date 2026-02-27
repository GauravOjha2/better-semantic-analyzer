"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import type { AnalysisStep, AnalysisResponse } from "@/types";

/* ─── Animation Variants ─── */
const EASE_OUT: [number, number, number, number] = [0.25, 0.4, 0.25, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT, delay },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay: number) => ({
    opacity: 1,
    transition: { duration: 0.6, delay },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: EASE_OUT, delay },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const staggerChild = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

/* ─── Section wrapper with scroll-triggered animation ─── */
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
  const isInView = useInView(ref, { once: true, margin: "-80px" });
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

/* ─── Animated counter ─── */
function Counter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      className="text-4xl md:text-5xl font-black text-reddit-orange counter-glow"
    >
      {value}
      {suffix}
    </motion.span>
  );
}

export default function Home() {
  const router = useRouter();
  const [userA, setUserA] = useState("");
  const [userB, setUserB] = useState("");
  const [step, setStep] = useState<AnalysisStep>("idle");
  const [error, setError] = useState<string | null>(null);

  // Parallax for the hero orb
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const orbY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const orbScale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const orbOpacity = useTransform(scrollYProgress, [0, 0.8], [0.7, 0]);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!userA.trim() || !userB.trim()) return;

    setError(null);
    setStep("fetching_user_a");

    try {
      const progressTimer = setTimeout(() => setStep("fetching_user_b"), 2000);
      const samplingTimer = setTimeout(() => setStep("sampling"), 4000);
      const generatingTimer = setTimeout(() => setStep("generating"), 5500);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userA: userA.trim(),
          userB: userB.trim(),
          postsLimit: 50,
          samplePairs: 15,
        }),
      });

      clearTimeout(progressTimer);
      clearTimeout(samplingTimer);
      clearTimeout(generatingTimer);

      if (!res.ok) {
        const errData = await res
          .json()
          .catch(() => ({ error: "Request failed" }));
        throw new Error(
          errData.error || `Request failed with status ${res.status}`
        );
      }

      const data: AnalysisResponse = await res.json();
      setStep("complete");

      sessionStorage.setItem("analysisResult", JSON.stringify(data));
      router.push(
        `/results?userA=${encodeURIComponent(data.userA)}&userB=${encodeURIComponent(data.userB)}`
      );
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Analysis failed");
      setTimeout(() => setStep("idle"), 100);
    }
  }

  return (
    <>
      <Navbar />

      {step !== "idle" && step !== "error" && step !== "complete" && (
        <LoadingOverlay step={step} userA={userA} userB={userB} />
      )}

      {/* ═══════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════ */}
      <main
        ref={heroRef}
        className="relative pt-32 pb-20 sm:pt-44 sm:pb-28 overflow-hidden flex flex-col justify-center min-h-[100vh]"
      >
        {/* Aurora ambient background */}
        <div className="aurora-bg"></div>

        {/* Background grid */}
        <div className="absolute inset-0 z-0 pointer-events-none bg-grid opacity-60"></div>

        {/* Cosmic orb — parallax */}
        <motion.div
          style={{ y: orbY, scale: orbScale, opacity: orbOpacity }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] sm:w-[1000px] sm:h-[1000px] cosmic-orb pointer-events-none z-0"
        />

        {/* Floating particles — upgraded with varied sizes */}
        <div className="particles">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full ${i % 3 === 0 ? 'w-1.5 h-1.5 bg-reddit-orange/20' : 'w-1 h-1 bg-reddit-orange/30'}`}
              style={{
                top: `${10 + i * 11}%`,
                left: `${8 + i * 11}%`,
              }}
              animate={{
                y: [0, -30 + i * 5, 0],
                x: [0, i % 2 === 0 ? 10 : -10, 0],
                opacity: [0.15, 0.5, 0.15],
              }}
              transition={{
                duration: 5 + i * 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.6,
              }}
            />
          ))}
        </div>

        {/* Neural connection lines floating in background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-30" aria-hidden="true">
          <motion.line
            className="neural-line"
            x1="15%" y1="20%" x2="35%" y2="45%"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 1 }}
          />
          <motion.line
            className="neural-line"
            x1="65%" y1="15%" x2="80%" y2="40%"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 1.5 }}
          />
          <motion.line
            className="neural-line"
            x1="75%" y1="60%" x2="90%" y2="80%"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 2 }}
          />
        </svg>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center rounded-full border border-reddit-orange/20 bg-reddit-orange/5 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-reddit-orange mb-8 font-mono"
          >
            <span className="relative flex h-1.5 w-1.5 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-reddit-orange opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-reddit-orange"></span>
            </span>
            Open Source &middot; LLM-Powered &middot; v2.0
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT }}
            className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
          >
            <span className="text-reddit-text">Reddit</span>
            <br />
            <span className="gradient-text">Compatibility.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-lg sm:text-xl text-reddit-text-muted max-w-2xl mx-auto mb-14 font-light leading-relaxed"
          >
            Deep behavioral analysis of Reddit users through smart post sampling
            and LLM-powered language understanding. Discover how two users truly
            connect.
          </motion.p>

          {/* Input Form */}
          <motion.form
            onSubmit={handleAnalyze}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <div className="glass-panel rounded-2xl p-2 sm:p-4 max-w-3xl mx-auto group relative">
              {/* Hover glow */}
              <div className="absolute -inset-px bg-gradient-to-r from-reddit-orange/20 via-reddit-orange/5 to-reddit-orange/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-sm"></div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center relative z-10">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-reddit-text-faint font-mono text-sm">
                      u/
                    </span>
                  </div>
                  <input
                    type="text"
                    value={userA}
                    onChange={(e) => setUserA(e.target.value)}
                    className="block w-full pl-9 py-3.5 bg-reddit-dark/80 border border-reddit-border rounded-xl text-reddit-text placeholder-reddit-text-faint focus:outline-none focus:ring-2 focus:ring-reddit-orange/40 focus:border-reddit-orange/50 transition-all font-mono text-sm hover:border-reddit-border-light"
                    placeholder="first_username"
                    required
                    pattern="[a-zA-Z0-9_-]+"
                    maxLength={20}
                  />
                </div>
                <span className="material-symbols-outlined text-reddit-orange/50 rotate-90 sm:rotate-0 text-xl">
                  compare_arrows
                </span>
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-reddit-text-faint font-mono text-sm">
                      u/
                    </span>
                  </div>
                  <input
                    type="text"
                    value={userB}
                    onChange={(e) => setUserB(e.target.value)}
                    className="block w-full pl-9 py-3.5 bg-reddit-dark/80 border border-reddit-border rounded-xl text-reddit-text placeholder-reddit-text-faint focus:outline-none focus:ring-2 focus:ring-reddit-orange/40 focus:border-reddit-orange/50 transition-all font-mono text-sm hover:border-reddit-border-light"
                    placeholder="second_username"
                    required
                    pattern="[a-zA-Z0-9_-]+"
                    maxLength={20}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={step !== "idle" && step !== "error"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto px-8 py-3.5 bg-reddit-orange text-white font-semibold rounded-xl hover:bg-reddit-orange-dark transition-colors whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-reddit-orange/20 hover:shadow-reddit-orange/30"
                >
                  Analyze
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </motion.button>
              </div>
              <div className="mt-3 flex justify-between items-center px-2 border-t border-reddit-border/50 pt-3 relative z-10">
                <span className="text-xs text-reddit-text-faint font-mono tracking-wide">
                  Enter two Reddit usernames to compare
                </span>
                <span className="text-xs text-green-500 font-mono flex items-center gap-1.5">
                  <span className="block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Ready
                </span>
              </div>
            </div>
          </motion.form>

          {/* Error display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 max-w-3xl mx-auto p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-20"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2 text-reddit-text-faint"
            >
              <span className="text-[10px] font-mono uppercase tracking-[0.2em]">
                Scroll to explore
              </span>
              <span className="material-symbols-outlined text-lg">
                expand_more
              </span>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 border-y border-reddit-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: "70B", suffix: "", label: "LLM Parameters" },
              { value: "15", suffix: "+", label: "Post Pairs Analyzed" },
              { value: "50", suffix: "/50", label: "Smart Sampling Split" },
              { value: "<8", suffix: "s", label: "Average Latency" },
            ].map((stat, i) => (
              <motion.div key={i} variants={staggerChild}>
                <Counter value={stat.value} suffix={stat.suffix} />
                <p className="text-reddit-text-muted text-xs font-mono uppercase tracking-wider mt-2">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS — PIPELINE
      ═══════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden z-10" id="how-it-works">
        {/* Subtle background orb */}
        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] cosmic-orb opacity-30 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="mb-16">
            <div className="max-w-3xl">
              <span className="text-reddit-orange font-mono text-xs uppercase tracking-[0.2em] mb-4 block">
                Architecture
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-reddit-text mb-5">
                How It Works
              </h2>
              <p className="text-lg text-reddit-text-muted leading-relaxed">
                A three-stage processing pipeline that transforms raw Reddit
                activity into deep compatibility insights.
              </p>
            </div>
          </AnimatedSection>

          {/* Pipeline stages */}
          <div className="flex flex-col gap-8">
            {/* Stage 1 */}
            <AnimatedSection delay={0.1}>
              <div className="card card-hover rounded-2xl p-8 sm:p-10 relative overflow-hidden grid md:grid-cols-2 gap-10 items-center">
                <div className="absolute top-6 right-8 opacity-[0.04] pointer-events-none">
                  <span className="text-[120px] font-black text-reddit-text leading-none">
                    01
                  </span>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-reddit-orange/10 flex items-center justify-center mb-6 border border-reddit-orange/20 text-reddit-orange">
                    <span className="material-symbols-outlined text-xl">
                      input
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-reddit-text mb-3">
                    Reddit Data Collection
                  </h3>
                  <p className="text-sm text-reddit-text-muted leading-relaxed mb-5">
                    We interface with the official Reddit API via OAuth2 to fetch up
                    to 50 recent comments and submissions per user. Raw text is
                    cleaned, deduplicated, and filtered — removing posts shorter
                    than 10 characters to ensure high-quality input for analysis.
                  </p>
                  <ul className="space-y-2 text-sm text-reddit-text-muted font-mono">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-reddit-orange text-sm">
                        check
                      </span>
                      Official Reddit OAuth2 API
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-reddit-orange text-sm">
                        check
                      </span>
                      Text sanitization + length filtering
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-reddit-orange text-sm">
                        check
                      </span>
                      Comments & submissions combined
                    </li>
                  </ul>
                </div>
                <div className="terminal">
                  <div className="terminal-header">
                    <div className="terminal-dot bg-red-500/80"></div>
                    <div className="terminal-dot bg-yellow-500/80"></div>
                    <div className="terminal-dot bg-green-500/80"></div>
                    <span className="text-[10px] text-reddit-text-faint ml-2 uppercase tracking-widest">
                      api_output
                    </span>
                  </div>
                  <div className="p-5 text-xs sm:text-sm text-reddit-text-muted space-y-2">
                    <div>
                      <span className="text-reddit-orange">&#62;</span>{" "}
                      fetchUserPosts(&quot;target_user&quot;, 50)
                    </div>
                    <div>
                      <span className="text-reddit-orange">&#62;</span> Reddit
                      OAuth2:{" "}
                      <span className="text-yellow-300/80">200 OK</span>
                    </div>
                    <div className="opacity-50">&#62; extracting comments...</div>
                    <div className="opacity-50">
                      &#62; extracting submissions...
                    </div>
                    <div>
                      <span className="text-reddit-orange">&#62;</span>{" "}
                      <span className="text-green-400">48 posts</span> retrieved
                    </div>
                    <div>
                      <span className="text-reddit-orange">&#62;</span> filtering
                      (min_length: 10)...{" "}
                      <span className="text-green-400">42 passed</span>
                    </div>
                    <div className="text-reddit-orange/40 mt-1">
                      &#62; ready for sampling_
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Stage 2 */}
            <AnimatedSection delay={0.15}>
              <div className="card card-hover rounded-2xl p-8 sm:p-10 relative overflow-hidden grid md:grid-cols-2 gap-10 items-center">
                <div className="absolute top-6 right-8 opacity-[0.04] pointer-events-none">
                  <span className="text-[120px] font-black text-reddit-text leading-none">
                    02
                  </span>
                </div>
                <div className="md:order-2">
                  <div className="w-12 h-12 rounded-xl bg-reddit-orange/10 flex items-center justify-center mb-6 border border-reddit-orange/20 text-reddit-orange">
                    <span className="material-symbols-outlined text-xl">
                      polyline
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-reddit-text mb-3">
                    Hybrid Smart Sampling
                  </h3>
                  <p className="text-sm text-reddit-text-muted leading-relaxed mb-5">
                    We generate all possible cross-product pairs between both
                    users&apos; posts, then select a carefully balanced mix: 50%
                    random pairs for topic diversity and 50% longest pairs for
                    maximum personality signal. Each post is truncated to 300
                    characters to optimize LLM token budgets.
                  </p>
                  <ul className="space-y-2 text-sm text-reddit-text-muted font-mono">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-reddit-orange text-sm">
                        check
                      </span>
                      Random + longest hybrid strategy
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-reddit-orange text-sm">
                        check
                      </span>
                      300-char truncation per post
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-reddit-orange text-sm">
                        check
                      </span>
                      Cross-product pair generation
                    </li>
                  </ul>
                </div>
                <div className="md:order-1 bg-reddit-dark rounded-xl p-6 border border-reddit-border min-h-[220px] flex flex-col justify-center gap-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-reddit-orange/5 rounded-xl py-4 border border-reddit-orange/10"
                    >
                      <div className="text-[10px] text-reddit-text-faint uppercase tracking-wider mb-1">
                        Random
                      </div>
                      <span className="text-reddit-orange font-bold text-lg">
                        7
                      </span>
                      <div className="text-[10px] text-reddit-text-faint">
                        pairs
                      </div>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-reddit-orange/5 rounded-xl py-4 border border-reddit-orange/10"
                    >
                      <div className="text-[10px] text-reddit-text-faint uppercase tracking-wider mb-1">
                        Longest
                      </div>
                      <span className="text-reddit-orange font-bold text-lg">
                        8
                      </span>
                      <div className="text-[10px] text-reddit-text-faint">
                        pairs
                      </div>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-reddit-orange/10 rounded-xl py-4 border border-reddit-orange/25"
                    >
                      <div className="text-[10px] text-reddit-text uppercase tracking-wider mb-1 font-bold">
                        Total
                      </div>
                      <span className="text-reddit-orange font-bold text-lg">
                        15
                      </span>
                      <div className="text-[10px] text-reddit-text-faint">
                        pairs
                      </div>
                    </motion.div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-reddit-text-faint font-mono px-1">
                    <div className="flex-1 h-1.5 rounded-full bg-reddit-border overflow-hidden">
                      <div className="h-full w-[47%] bg-reddit-orange/40 rounded-full"></div>
                    </div>
                    <span>47% random</span>
                    <div className="flex-1 h-1.5 rounded-full bg-reddit-border overflow-hidden">
                      <div className="h-full w-[53%] bg-reddit-orange/70 rounded-full"></div>
                    </div>
                    <span>53% longest</span>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Stage 3 */}
            <AnimatedSection delay={0.2}>
              <div className="card card-hover rounded-2xl p-8 sm:p-10 relative overflow-hidden grid md:grid-cols-2 gap-10 items-center">
                <div className="absolute top-6 right-8 opacity-[0.04] pointer-events-none">
                  <span className="text-[120px] font-black text-reddit-text leading-none">
                    03
                  </span>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-reddit-orange/10 flex items-center justify-center mb-6 border border-reddit-orange/20 text-reddit-orange">
                    <span className="material-symbols-outlined text-xl">
                      hub
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-reddit-text mb-3">
                    LLM Compatibility Analysis
                  </h3>
                  <p className="text-sm text-reddit-text-muted leading-relaxed mb-5">
                    Sampled post pairs are sent to Groq&apos;s Llama 3.3 70B
                    model with a structured social psychology prompt. The LLM
                    produces a rich JSON response including shared interests with
                    evidence, complementary differences, communication style
                    analysis, relationship potential, and personalized
                    conversation starters.
                  </p>
                  <ul className="space-y-2 text-sm text-reddit-text-muted font-mono">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-reddit-orange text-sm">
                        check
                      </span>
                      Structured JSON output schema
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-reddit-orange text-sm">
                        check
                      </span>
                      Social psychologist persona
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-reddit-orange text-sm">
                        check
                      </span>
                      24h result caching via PostgreSQL
                    </li>
                  </ul>
                </div>
                <div className="h-64 relative flex items-center justify-center bg-reddit-dark rounded-xl border border-reddit-border overflow-hidden">
                  {/* Neural network visualization */}
                  <div className="absolute w-40 h-40 rounded-full border border-reddit-orange/10 animate-spin-slow"></div>
                  <div className="absolute w-28 h-28 rounded-full border border-reddit-orange/15 animate-spin-reverse"></div>
                  <div className="absolute w-56 h-56 rounded-full border border-dashed border-reddit-border/50 animate-spin-slower"></div>
                  <div className="absolute w-20 h-20 rounded-full border border-reddit-orange/5 animate-spin-slower"></div>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-4 h-4 bg-reddit-orange rounded-full z-10 relative shadow-lg shadow-reddit-orange/40"
                  />
                  {/* Corner labels */}
                  <div className="absolute top-3 left-3 text-[8px] font-mono text-reddit-text-faint uppercase tracking-wider">
                    groq_llm
                  </div>
                  <div className="absolute bottom-3 right-3 text-[8px] font-mono text-reddit-text-faint uppercase tracking-wider">
                    llama_3.3_70b
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          DIVIDER
      ═══════════════════════════════════════════════════ */}
      <div className="section-divider"></div>

      {/* ═══════════════════════════════════════════════════
          WHAT YOU GET — OUTPUT SHOWCASE
      ═══════════════════════════════════════════════════ */}
      <section className="py-28 relative z-10" id="output">
        <div className="absolute top-0 left-0 -translate-x-1/2 w-[500px] h-[500px] cosmic-orb opacity-20 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="text-reddit-orange font-mono text-xs uppercase tracking-[0.2em] mb-4 block">
              Output
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-reddit-text mb-5">
              What You Get
            </h2>
            <p className="text-reddit-text-muted max-w-2xl mx-auto text-lg">
              Every analysis produces a comprehensive compatibility report with
              six structured dimensions.
            </p>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {[
              {
                icon: "speed",
                title: "Overall Score",
                desc: "A qualitative compatibility rating (Excellent, High, Moderate, Low) derived from holistic analysis of all dimensions.",
                color: "text-reddit-orange",
                border: "border-t-reddit-orange",
              },
              {
                icon: "diversity_3",
                title: "Shared Interests",
                desc: "Specific topics, subreddits, and values both users care about — backed by evidence from actual posts.",
                color: "text-blue-400",
                border: "border-t-blue-400",
              },
              {
                icon: "contrast",
                title: "Complementary Differences",
                desc: "Areas where users differ in ways that could strengthen a connection rather than create friction.",
                color: "text-purple-400",
                border: "border-t-purple-400",
              },
              {
                icon: "chat",
                title: "Communication Style",
                desc: "Analysis of tone, humor, verbosity, formality, and engagement patterns across both users' post history.",
                color: "text-emerald-400",
                border: "border-t-emerald-400",
              },
              {
                icon: "trending_up",
                title: "Relationship Potential",
                desc: "An assessment of long-term compatibility potential based on behavioral patterns and interest alignment.",
                color: "text-amber-400",
                border: "border-t-amber-400",
              },
              {
                icon: "forum",
                title: "Conversation Starters",
                desc: "Five personalized, algorithmically generated topics designed to spark genuine conversation between both users.",
                color: "text-rose-400",
                border: "border-t-rose-400",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={staggerChild}
                whileHover={{ y: -4 }}
                className={`card rounded-xl p-6 border-t-2 ${item.border} transition-all duration-300 hover:shadow-lg hover:shadow-black/20`}
              >
                <span
                  className={`material-symbols-outlined ${item.color} text-2xl mb-4 block`}
                >
                  {item.icon}
                </span>
                <h3 className="text-base font-bold text-reddit-text mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-reddit-text-muted leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="section-divider"></div>

      {/* ═══════════════════════════════════════════════════
          FEATURES — BENTO GRID
      ═══════════════════════════════════════════════════ */}
      <section className="py-28 relative z-10" id="features">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="text-reddit-orange font-mono text-xs uppercase tracking-[0.2em] mb-4 block">
              Features
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-reddit-text mb-5">
              Engineered for Depth
            </h2>
            <p className="text-reddit-text-muted max-w-2xl mx-auto text-lg">
              Every design decision serves a purpose — from how we sample posts
              to how we prompt the model.
            </p>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[minmax(240px,auto)]"
          >
            {/* LLM-First — spans 2 cols */}
            <motion.div
              variants={staggerChild}
              className="md:col-span-2 card card-hover rounded-2xl p-8 relative overflow-hidden group"
            >
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-reddit-orange/[0.03] rounded-full blur-3xl group-hover:bg-reddit-orange/[0.06] transition-colors duration-500 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="w-11 h-11 rounded-xl bg-reddit-orange/10 flex items-center justify-center mb-5 border border-reddit-orange/20">
                  <span className="material-symbols-outlined text-reddit-orange">
                    psychology
                  </span>
                </div>
                <h3 className="text-xl font-bold text-reddit-text mb-3">
                  LLM-First Analysis
                </h3>
                <p className="text-reddit-text-muted max-w-md text-sm leading-relaxed">
                  No embeddings. No cosine similarity. No TF-IDF. We use direct
                  LLM prompting with a social psychologist persona to capture
                  nuance, humor, sarcasm, tone, and interpersonal context that
                  statistical methods fundamentally cannot detect.
                </p>
              </div>
            </motion.div>

            {/* Smart Sampling — spans 2 rows */}
            <motion.div
              variants={staggerChild}
              className="row-span-2 card card-hover rounded-2xl p-8 relative overflow-hidden group"
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-11 h-11 rounded-xl bg-reddit-orange/10 flex items-center justify-center mb-5 border border-reddit-orange/20">
                  <span className="material-symbols-outlined text-reddit-orange">
                    network_node
                  </span>
                </div>
                <h3 className="text-xl font-bold text-reddit-text mb-3">
                  Smart Sampling
                </h3>
                <p className="text-reddit-text-muted mb-6 flex-grow text-sm leading-relaxed">
                  Our hybrid sampling strategy maximizes information density
                  within LLM token budgets. Random selection provides topic
                  breadth; longest-post selection provides personality depth.
                </p>
                <div className="mt-auto bg-reddit-dark rounded-xl p-4 border border-reddit-border">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-reddit-orange/5 rounded-lg p-3 border border-reddit-orange/10">
                      <div className="text-reddit-orange text-2xl font-black">
                        50%
                      </div>
                      <div className="text-[10px] text-reddit-text-faint uppercase tracking-wider mt-1">
                        Random
                      </div>
                    </div>
                    <div className="bg-reddit-orange/5 rounded-lg p-3 border border-reddit-orange/10">
                      <div className="text-reddit-orange text-2xl font-black">
                        50%
                      </div>
                      <div className="text-[10px] text-reddit-text-faint uppercase tracking-wider mt-1">
                        Longest
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Structured Reports */}
            <motion.div
              variants={staggerChild}
              className="card card-hover rounded-2xl p-8 relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-11 h-11 rounded-xl bg-reddit-orange/10 flex items-center justify-center mb-5 border border-reddit-orange/20">
                  <span className="material-symbols-outlined text-reddit-orange">
                    summarize
                  </span>
                </div>
                <h3 className="text-lg font-bold text-reddit-text mb-2">
                  Structured JSON Reports
                </h3>
                <p className="text-reddit-text-muted text-sm leading-relaxed">
                  Every report follows a strict schema — overallScore, shared
                  interests with evidence, communication style, and 5
                  conversation starters. Reliable, parseable, actionable.
                </p>
              </div>
            </motion.div>

            {/* Caching */}
            <motion.div
              variants={staggerChild}
              className="card card-hover rounded-2xl p-8 relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-11 h-11 rounded-xl bg-reddit-orange/10 flex items-center justify-center mb-5 border border-reddit-orange/20">
                  <span className="material-symbols-outlined text-reddit-orange">
                    cached
                  </span>
                </div>
                <h3 className="text-lg font-bold text-reddit-text mb-2">
                  Intelligent Caching
                </h3>
                <p className="text-reddit-text-muted text-sm leading-relaxed">
                  Results are cached in PostgreSQL for 24 hours. Repeat queries
                  return instantly without re-processing. Saves API calls and
                  delivers sub-second response times.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="section-divider"></div>

      {/* ═══════════════════════════════════════════════════
          TECH STACK
      ═══════════════════════════════════════════════════ */}
      <section className="py-28 relative z-10" id="stack">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="text-reddit-orange font-mono text-xs uppercase tracking-[0.2em] mb-4 block">
              Stack
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-reddit-text mb-5">
              Built With Modern Tools
            </h2>
            <p className="text-reddit-text-muted max-w-2xl mx-auto text-lg">
              Production-grade architecture, deployed on Vercel as a single
              serverless application.
            </p>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {[
              {
                name: "Next.js 14",
                desc: "Full-stack React framework with App Router, API routes, and server-side rendering.",
                icon: "code",
                tag: "Frontend + API",
              },
              {
                name: "Groq + Llama 3.3",
                desc: "70B parameter model via Groq's ultra-fast inference API. Sub-second token generation.",
                icon: "neurology",
                tag: "LLM Engine",
              },
              {
                name: "PostgreSQL",
                desc: "24h result caching, analysis storage, and rate limiting via connection pooling.",
                icon: "database",
                tag: "Database",
              },
              {
                name: "Vercel",
                desc: "Edge network deployment with automatic scaling, preview deployments, and zero config.",
                icon: "cloud",
                tag: "Infrastructure",
              },
            ].map((tech, i) => (
              <motion.div
                key={i}
                variants={staggerChild}
                whileHover={{ y: -4 }}
                className="card card-hover rounded-2xl p-6 text-center flex flex-col items-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-reddit-orange/10 flex items-center justify-center mb-5 border border-reddit-orange/20">
                  <span className="material-symbols-outlined text-reddit-orange text-2xl">
                    {tech.icon}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-reddit-orange uppercase tracking-widest mb-2">
                  {tech.tag}
                </span>
                <h3 className="text-lg font-bold text-reddit-text mb-2">
                  {tech.name}
                </h3>
                <p className="text-sm text-reddit-text-muted leading-relaxed">
                  {tech.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="section-divider"></div>

      {/* ═══════════════════════════════════════════════════
          CTA — BOTTOM
      ═══════════════════════════════════════════════════ */}
      <section className="py-32 relative z-10 overflow-hidden">
        <div className="absolute inset-0 cosmic-orb opacity-20 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center">
            <h2 className="text-3xl sm:text-5xl font-bold text-reddit-text mb-6">
              Ready to discover
              <br />
              <span className="text-reddit-orange">compatibility?</span>
            </h2>
            <p className="text-reddit-text-muted text-lg max-w-xl mx-auto mb-10">
              Enter any two Reddit usernames and get a comprehensive AI-powered
              compatibility report in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-reddit-orange text-white font-semibold rounded-xl hover:bg-reddit-orange-dark transition-colors shadow-lg shadow-reddit-orange/20 flex items-center gap-2"
              >
                Try It Now
                <span className="material-symbols-outlined text-xl">
                  arrow_upward
                </span>
              </motion.a>
              <a
                href="https://github.com/GauravOjha2/better-semantic-analyzer"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 border border-reddit-border text-reddit-text-muted font-semibold rounded-xl hover:border-reddit-border-light hover:text-reddit-text transition-colors flex items-center gap-2"
              >
                View on GitHub
                <span className="material-symbols-outlined text-xl">
                  open_in_new
                </span>
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </>
  );
}

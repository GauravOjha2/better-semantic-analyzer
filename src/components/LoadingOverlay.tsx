"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { AnalysisStep } from "@/types";

interface LoadingOverlayProps {
  step: AnalysisStep;
  userA: string;
  userB: string;
}

const STEPS: { key: AnalysisStep; label: string; detail: string; icon: string }[] = [
  {
    key: "fetching_user_a",
    label: "Fetching Posts",
    detail: "Collecting submissions and comments from Reddit API",
    icon: "download",
  },
  {
    key: "fetching_user_b",
    label: "Fetching Posts",
    detail: "Collecting second user's Reddit activity",
    icon: "download",
  },
  {
    key: "sampling",
    label: "Smart Sampling",
    detail: "Selecting hybrid random + longest post pairs",
    icon: "shuffle",
  },
  {
    key: "generating",
    label: "Generating Report",
    detail: "LLM analyzing compatibility patterns",
    icon: "neurology",
  },
];

export function LoadingOverlay({ step, userA, userB }: LoadingOverlayProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === step);
  const progressPct = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-reddit-dark/95 backdrop-blur-md"
      >
        {/* Background cosmic orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] cosmic-orb opacity-20 pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] }}
          className="card-elevated p-8 max-w-md w-full mx-4 relative overflow-hidden"
        >
          {/* Top progress bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-reddit-border/50 overflow-hidden">
            <motion.div
              className="h-full progress-bar rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          <div className="text-center mb-6">
            {/* Animated brain icon */}
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-reddit-orange/10 border border-reddit-orange/20 mb-4"
            >
              <span className="material-symbols-outlined text-reddit-orange text-2xl">
                neurology
              </span>
            </motion.div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-reddit-orange/10 border border-reddit-orange/20 text-reddit-orange text-xs font-mono mb-3">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-reddit-orange opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-reddit-orange"></span>
              </span>
              PROCESSING
            </div>
            <h2 className="text-lg font-semibold text-reddit-text mb-1">
              Analyzing Compatibility
            </h2>
            <p className="text-reddit-text-muted text-sm font-mono">
              u/{userA} &harr; u/{userB}
            </p>
          </div>

          <div className="space-y-2">
            {STEPS.map((s, index) => {
              const isActive = s.key === step;
              const isComplete = index < currentIndex;

              return (
                <motion.div
                  key={s.key}
                  initial={false}
                  animate={{
                    opacity: isComplete ? 0.5 : isActive ? 1 : 0.25,
                    scale: isActive ? 1 : 0.98,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "bg-reddit-card border border-reddit-orange/20"
                      : ""
                  }`}
                >
                  <div className="flex-shrink-0">
                    {isComplete ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-green-900/40 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-green-500 text-sm">
                          check
                        </span>
                      </motion.div>
                    ) : isActive ? (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full bg-reddit-orange/10 animate-ping"></div>
                        <div className="w-3.5 h-3.5 border-2 border-reddit-orange border-t-transparent rounded-full animate-spin relative z-10"></div>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-reddit-card flex items-center justify-center border border-reddit-border">
                        <span className="text-[10px] font-mono text-reddit-text-faint">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-sm ${isActive ? "text-reddit-orange" : "text-reddit-text-faint"}`}>
                        {s.icon}
                      </span>
                      <p className={`text-sm ${isActive ? "text-reddit-text font-medium" : "text-reddit-text-muted"}`}>
                        {s.label}
                      </p>
                    </div>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-xs text-reddit-text-faint mt-0.5 ml-6"
                      >
                        {s.detail}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom hint */}
          <div className="mt-5 pt-4 border-t border-reddit-border/50 text-center">
            <p className="text-[10px] text-reddit-text-faint font-mono uppercase tracking-widest">
              Powered by Llama 3.3 70B via Groq
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

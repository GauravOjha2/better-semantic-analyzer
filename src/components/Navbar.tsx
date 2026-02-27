"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] }}
      className={`fixed top-0 w-full z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-reddit-border bg-reddit-dark/95 backdrop-blur-md shadow-lg shadow-black/20"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Synapse logo — neural connection icon */}
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-lg bg-reddit-orange/20 blur-sm group-hover:bg-reddit-orange/30 transition-colors duration-300"></div>
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-reddit-orange to-reddit-orange-dark flex items-center justify-center shadow-md shadow-reddit-orange/20">
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {/* Neural connection paths */}
                  <circle cx="6" cy="6" r="2" fill="currentColor" stroke="none" />
                  <circle cx="18" cy="6" r="2" fill="currentColor" stroke="none" />
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
                  <circle cx="6" cy="18" r="2" fill="currentColor" stroke="none" />
                  <circle cx="18" cy="18" r="2" fill="currentColor" stroke="none" />
                  <line x1="7.5" y1="7.5" x2="10.5" y2="10.5" opacity="0.7" />
                  <line x1="16.5" y1="7.5" x2="13.5" y2="10.5" opacity="0.7" />
                  <line x1="7.5" y1="16.5" x2="10.5" y2="13.5" opacity="0.7" />
                  <line x1="16.5" y1="16.5" x2="13.5" y2="13.5" opacity="0.7" />
                </svg>
              </div>
            </div>
            <span className="font-semibold text-base tracking-tight text-reddit-text group-hover:text-white transition-colors">
              synapse
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-reddit-text-muted">
            <a href="#how-it-works" className="hover:text-reddit-text transition-colors relative group/link">
              How It Works
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-reddit-orange group-hover/link:w-full transition-all duration-300"></span>
            </a>
            <a href="#features" className="hover:text-reddit-text transition-colors relative group/link">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-reddit-orange group-hover/link:w-full transition-all duration-300"></span>
            </a>
            <a href="#stack" className="hover:text-reddit-text transition-colors relative group/link">
              Stack
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-reddit-orange group-hover/link:w-full transition-all duration-300"></span>
            </a>
            <a
              href="https://github.com/GauravOjha2/better-semantic-analyzer"
              className="hover:text-reddit-text transition-colors relative group/link"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-reddit-orange group-hover/link:w-full transition-all duration-300"></span>
            </a>
          </div>

          <a
            href="https://github.com/GauravOjha2/better-semantic-analyzer"
            className="group/btn text-xs font-medium text-reddit-text-muted border border-reddit-border px-3 py-1.5 rounded-full hover:text-reddit-text hover:border-reddit-orange/40 hover:bg-reddit-orange/5 transition-all duration-300 flex items-center gap-1.5"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Star
          </a>
        </div>
      </div>
    </motion.nav>
  );
}

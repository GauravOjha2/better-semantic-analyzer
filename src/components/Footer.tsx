"use client";

import { motion } from "framer-motion";

export function Footer() {
  return (
    <footer className="relative border-t border-reddit-border overflow-hidden">
      {/* Subtle glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-reddit-orange/30 to-transparent"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-reddit-orange to-reddit-orange-dark flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
              <span className="font-semibold text-reddit-text tracking-tight">synapse</span>
            </div>
            <p className="text-sm text-reddit-text-muted leading-relaxed max-w-sm">
              Deep behavioral analysis of Reddit users through LLM-powered language understanding. 
              Open source and built for the curious.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-bold text-reddit-text uppercase tracking-widest mb-4">Project</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#how-it-works" className="text-reddit-text-muted hover:text-reddit-text transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className="text-reddit-text-muted hover:text-reddit-text transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#stack" className="text-reddit-text-muted hover:text-reddit-text transition-colors">
                  Tech Stack
                </a>
              </li>
            </ul>
          </div>

          {/* External */}
          <div>
            <h4 className="text-xs font-bold text-reddit-text uppercase tracking-widest mb-4">Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://github.com/GauravOjha2/better-semantic-analyzer"
                  className="text-reddit-text-muted hover:text-reddit-text transition-colors flex items-center gap-1.5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/GauravOjha2"
                  className="text-reddit-text-muted hover:text-reddit-text transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @GauravOjha2
                </a>
              </li>
              <li>
                <a
                  href="https://console.groq.com"
                  className="text-reddit-text-muted hover:text-reddit-text transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Groq Console
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-reddit-border/50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-reddit-text-faint font-mono">
            Built by{" "}
            <a
              href="https://github.com/GauravOjha2"
              className="text-reddit-text-muted hover:text-reddit-orange transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Gaurav Ojha
            </a>
          </p>
          <div className="flex items-center gap-4 text-[10px] text-reddit-text-faint font-mono uppercase tracking-widest">
            <span>Next.js 14</span>
            <span className="text-reddit-border">|</span>
            <span>Groq</span>
            <span className="text-reddit-border">|</span>
            <span>Llama 3.3 70B</span>
            <span className="text-reddit-border">|</span>
            <span>PostgreSQL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

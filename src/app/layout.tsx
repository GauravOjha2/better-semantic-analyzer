import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Synapse - Reddit Compatibility Analyzer",
  description:
    "Analyze Reddit user compatibility using LLM-powered behavioral analysis. Enter two usernames and discover shared interests, communication patterns, and relationship potential.",
  keywords: [
    "Reddit",
    "compatibility",
    "LLM",
    "AI",
    "semantic analysis",
    "user comparison",
    "Synapse",
  ],
  authors: [{ name: "Gaurav Ojha", url: "https://github.com/GauravOjha2" }],
  openGraph: {
    title: "Synapse - Reddit Compatibility Analyzer",
    description: "AI-powered Reddit user compatibility analysis",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans overflow-x-hidden`}
      >
        <div className="noise-overlay" aria-hidden="true"></div>
        {children}
      </body>
    </html>
  );
}

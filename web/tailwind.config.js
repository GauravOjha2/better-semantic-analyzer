/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        reddit: {
          orange: "#ff4500",
          "orange-dark": "#cc3700",
          "orange-light": "#ff5722",
          "orange-glow": "rgba(255, 69, 0, 0.15)",
          blue: "#0079d3",
          dark: "#0e1113",
          "dark-lighter": "#141618",
          card: "#1a1a1b",
          "card-hover": "#222324",
          border: "#343536",
          "border-light": "#4a4b4d",
          text: "#d7dadc",
          "text-muted": "#818384",
          "text-faint": "#4a4b4d",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse-slow 8s infinite ease-in-out",
        "pulse-glow": "pulse-glow 3s infinite ease-in-out",
        "spin-slow": "spin 20s linear infinite",
        "spin-slower": "spin 40s linear infinite",
        "spin-reverse": "spin 15s linear infinite reverse",
        "fade-in": "fade-in 0.6s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out infinite 3s",
        "typewriter": "typewriter 2s steps(20) forwards",
        "blink": "blink 1s step-end infinite",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.03)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 69, 0, 0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(255, 69, 0, 0.4)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "typewriter": {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
        "blink": {
          "0%, 50%": { borderColor: "#ff4500" },
          "51%, 100%": { borderColor: "transparent" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

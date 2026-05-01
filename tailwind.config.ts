import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Backgrounds (use rgb() wrapper for opacity-modifier support) ──
        "bg-base": "rgb(var(--bg-base-rgb) / <alpha-value>)",
        "bg-soft": "rgb(var(--bg-soft-rgb) / <alpha-value>)",
        // ── Surfaces (derived via color-mix in CSS — no opacity modifiers) ──
        "surface-1": "var(--surface-1)",
        "surface-2": "var(--surface-2)",
        "surface-active": "var(--surface-active)",
        "surface-overlay": "var(--surface-overlay)",
        // ── Text ──
        "text-primary": "rgb(var(--text-primary-rgb) / <alpha-value>)",
        "text-secondary": "rgb(var(--text-primary-rgb) / 0.70)",
        "text-muted": "rgb(var(--text-primary-rgb) / 0.45)",
        // ── Accent ──
        "accent": "rgb(var(--accent-rgb) / <alpha-value>)",
        "accent-soft": "var(--accent-soft)",
        "accent-glow": "var(--accent-glow)",
        // ── Borders ──
        "border-soft": "var(--border-soft)",
        "border-active": "var(--border-active)",
        "border-warm": "var(--border-warm)",
        // ── Status ──
        "status-error": "rgb(var(--status-error-rgb) / <alpha-value>)",
        // ── Backward-compatible aliases ──
        "border-subtle": "var(--border-soft)",
        "border-muted": "var(--border-soft)",
        "bg-card": "var(--surface-1)",
        "surface-control": "var(--surface-2)",
        "redwood": "rgb(var(--status-error-rgb) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"PingFang SC"',
          '"Noto Sans SC"',
          "sans-serif",
        ],
        serif: ['var(--font-serif)', '"Noto Serif SC"', 'serif'],
        mono: [
          '"SF Mono"',
          '"JetBrains Mono"',
          '"Cascadia Code"',
          "monospace",
        ],
      },
      fontSize: {
        micro: ["0.75rem", { lineHeight: "1.5" }],
        xs: ["0.75rem", { lineHeight: "1.6" }],
        sm: ["0.8125rem", { lineHeight: "1.6" }],
        base: ["0.9375rem", { lineHeight: "1.75" }],
        lg: ["1.0625rem", { lineHeight: "1.7" }],
        xl: ["1.25rem", { lineHeight: "1.5" }],
        display: ["1.5rem", { lineHeight: "1.4" }],
      },
      letterSpacing: {
        widest: "0.2em",
        wider: "0.12em",
        wide: "0.06em",
        normal: "0",
        tight: "-0.01em",
      },
      maxWidth: {
        app: "480px",
      },
      borderRadius: {
        card: "8px",
        button: "6px",
        tag: "3px",
        panel: "10px",
      },
    },
  },
  plugins: [],
};

export default config;

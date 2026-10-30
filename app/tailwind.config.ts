import type { Config } from "tailwindcss";

// Every color is a CSS variable (see globals.css) so light/dark themes swap in one place.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: token("brand"),
          text: token("brand-text"),
          deep: token("brand-deep"),
          soft: token("brand-soft"),
        },
        band: token("band"),
        nav: token("nav"),
        accent: {
          DEFAULT: token("accent"),
          ink: token("on-accent"),
        },
        bg: token("bg"),
        surface: token("surface"),
        card: token("card"),
        ink: token("ink"),
        muted: token("muted"),
        subtle: token("subtle"),
        line: token("line"),
        success: token("success"),
        warning: token("warning"),
        danger: token("danger"),
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        app: "440px",
      },
      borderRadius: {
        card: "20px",
      },
      boxShadow: {
        card: "0 4px 12px rgba(13, 10, 44, 0.06)",
        lift: "0 12px 32px rgba(13, 10, 44, 0.14)",
        sheet: "0 -8px 32px rgba(13, 10, 44, 0.14)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "70%": { opacity: "1", transform: "scale(1.06)" },
          "100%": { transform: "scale(1)" },
        },
        "scan-line": {
          "0%": { top: "6%" },
          "50%": { top: "90%" },
          "100%": { top: "6%" },
        },
        "ring-pulse": {
          "0%": { transform: "scale(0.8)", opacity: "0.6" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "draw": {
          to: { strokeDashoffset: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "sheet-up": "sheet-up 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        pop: "pop 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "scan-line": "scan-line 2.2s ease-in-out infinite",
        "ring-pulse": "ring-pulse 1.8s ease-out infinite",
        draw: "draw 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Servora Brand Identity: Midnight Navy (#0B1E36) + Vibrant Teal (#0D9488) + Warm Amber (#F59E0B)
        primary: "#0D9488", // Vibrant Servora Teal / Emerald Cyan
        "primary-container": "#0B1E36", // Deep Brand Midnight Navy
        "on-primary": "#ffffff",
        "on-primary-container": "#ccfbf1",
        "primary-fixed": "#ccfbf1",
        "primary-fixed-dim": "#5eead4",
        "on-primary-fixed": "#115e59",
        "on-primary-fixed-variant": "#0f766e",
        "inverse-primary": "#2dd4bf",

        secondary: "#0B1E36", // Deep Midnight Navy
        "secondary-container": "#1e293b",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#f1f5f9",
        "secondary-fixed": "#e2e8f0",
        "secondary-fixed-dim": "#cbd5e1",
        "on-secondary-fixed": "#0f172a",
        "on-secondary-fixed-variant": "#334155",

        tertiary: "#F59E0B", // Servora Golden Amber Accent
        "tertiary-container": "#fef3c7",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#92400e",
        "tertiary-fixed": "#fef3c7",
        "tertiary-fixed-dim": "#fde68a",
        "on-tertiary-fixed": "#78350f",
        "on-tertiary-fixed-variant": "#b45309",

        surface: "#f8fafc", // Clean Slate Surface
        "surface-bright": "#ffffff",
        "surface-dim": "#f1f5f9",
        "surface-container": "#f1f5f9",
        "surface-container-low": "#f8fafc",
        "surface-container-high": "#e2e8f0",
        "surface-container-highest": "#cbd5e1",
        "surface-container-lowest": "#ffffff",
        "on-surface": "#0f172a",
        "on-surface-variant": "#475569",
        "surface-variant": "#e2e8f0",
        "surface-tint": "#0D9488",

        outline: "#94a3b8",
        "outline-variant": "#cbd5e1",

        "inverse-surface": "#0f172a",
        "inverse-on-surface": "#f8fafc",

        error: "#e11d48",
        "on-error": "#ffffff",
        "error-container": "#ffe4e6",
        "on-error-container": "#9f1239",

        background: "#f8fafc",
        "on-background": "#0f172a",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

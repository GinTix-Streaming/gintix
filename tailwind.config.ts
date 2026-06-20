import type { Config } from "tailwindcss";

/**
 * GinTix brand system.
 * Deep slate-black canvas, electric obsidian slate panels,
 * cyber-amethyst liquid purple as the energetic accent.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#08090d",
        surface: "#0f1116",
        obsidian: "#1a1d27",
        amethyst: {
          DEFAULT: "#8a2be2",
          glow: "#a64dff",
          deep: "#5e1a9e",
          soft: "#c08cff",
        },
        ink: {
          DEFAULT: "#f2f3f7",
          muted: "#9aa1b0",
        },
      },
      boxShadow: {
        glow: "0 0 28px 0 rgba(138, 43, 226, 0.45)",
        "glow-sm": "0 0 14px 0 rgba(138, 43, 226, 0.35)",
        card: "0 10px 30px -12px rgba(0,0,0,0.7)",
        lift: "0 18px 40px -14px rgba(0,0,0,0.8)",
      },
      backgroundImage: {
        "amethyst-fluid":
          "radial-gradient(120% 120% at 0% 0%, rgba(138,43,226,0.22) 0%, rgba(8,9,13,0) 55%)",
        "amethyst-grad":
          "linear-gradient(135deg, #8a2be2 0%, #a64dff 100%)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

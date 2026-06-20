import type { Config } from "tailwindcss";

/**
 * GinTix brand system.
 * Deep slate-black canvas, electric obsidian slate panels,
 * cyber-amethyst liquid purple as the single energetic accent.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0B0C10",        // primary deep slate-black interface
        obsidian: "#1F2833",      // electric obsidian slate (panels/cards)
        amethyst: {
          DEFAULT: "#8A2BE2",     // cyber-amethyst liquid purple accent
          glow: "#A64DFF",
          deep: "#5E1A9E",
        },
        ink: {
          DEFAULT: "#E7E9EE",     // high-contrast foreground
          muted: "#8B93A7",
        },
      },
      boxShadow: {
        glow: "0 0 24px 0 rgba(138, 43, 226, 0.45)",
        "glow-sm": "0 0 12px 0 rgba(138, 43, 226, 0.35)",
      },
      backgroundImage: {
        "amethyst-fluid":
          "radial-gradient(120% 120% at 0% 0%, rgba(138,43,226,0.18) 0%, rgba(11,12,16,0) 55%)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

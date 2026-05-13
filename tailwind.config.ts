import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./stores/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "Geist Fallback", "ui-sans-serif", "system-ui"],
        mono: ["Geist Mono", "Geist Mono Fallback", "ui-monospace", "SFMono-Regular"]
      },
      colors: {
        accent: {
          DEFAULT: "#475569",
          strong: "#64748b",
          soft: "#1e293b"
        }
      }
    }
  },
  plugins: []
}

export default config

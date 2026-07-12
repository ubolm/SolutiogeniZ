import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0F",
        muted: "#6B7280",
        paper: "#F5F5F7",
        line: "#E5E7EB",
        night: "#1B1D24",
        primary: "#5B6CFF",
        "primary-strong": "#4454F5",
        indigo: "#7B61FF",
        aqua: "#7AD7FF"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(11, 11, 15, 0.08)",
        focus: "0 0 0 4px rgba(91, 108, 255, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;

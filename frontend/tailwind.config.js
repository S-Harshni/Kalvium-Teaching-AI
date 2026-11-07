/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Instrument Sans'", "Inter", "ui-sans-serif", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        ink: { 50: "#f6f7fb", 100: "#eceef6", 200: "#d9dcea", 300: "#b5bad1", 400: "#8b91ad", 500: "#646a88", 600: "#4a4f6b", 700: "#363a52", 800: "#22253a", 900: "#14162a", 950: "#0b0c1a" },
        brand: { 50: "#eef0ff", 100: "#e0e3ff", 200: "#c6cbff", 300: "#a3a8fd", 400: "#8080f8", 500: "#6461f0", 600: "#5345e3", 700: "#4637c8", 800: "#3a2fa1", 900: "#322c7f", 950: "#1e1a4a" },
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,22,42,.04), 0 2px 8px rgba(20,22,42,.04)",
        lift: "0 1px 2px rgba(20,22,42,.06), 0 12px 32px -8px rgba(20,22,42,.12)",
      },
    },
  },
  plugins: [typography],
};

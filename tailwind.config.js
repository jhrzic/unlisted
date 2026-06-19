/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs", "./public/**/*.js"],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#0B0C0E",
          soft: "#15171A",
        },
        panel: "#1B1E22",
        bone: {
          DEFAULT: "#E8E5DC",
          dim: "#B8B4A8",
        },
        steel: "#7A8089",
        signal: {
          DEFAULT: "#FF3B30",
          dim: "#7A1F1A",
        },
        verified: "#3FAE6A",
        line: "rgba(232,229,220,0.12)",
        "line-strong": "rgba(232,229,220,0.22)",
      },
      fontFamily: {
        display: ["'Big Shoulders Display'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      keyframes: {
        redact: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        redact: "redact 0.7s cubic-bezier(.65,0,.35,1) forwards",
      },
    },
  },
  plugins: [],
};

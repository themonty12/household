import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        mist: "#f7f9fb",
        paper: "#f1f4f7",
        line: "#dfe4ea",
        leaf: "#087f5b",
        coral: "#ba1a1a",
        gold: "#a66a00",
        info: "#2563eb",
        slate: "#091426"
      },
      boxShadow: {
        panel: "0 1px 2px rgba(9, 20, 38, 0.04), 0 8px 24px rgba(9, 20, 38, 0.05)"
      }
    }
  },
  plugins: []
};

export default config;

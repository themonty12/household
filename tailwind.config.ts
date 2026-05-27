import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        mist: "#f6f7f4",
        line: "#dce2dc",
        leaf: "#3f7f63",
        coral: "#c95f4a",
        gold: "#b88a2c"
      }
    }
  },
  plugins: []
};

export default config;

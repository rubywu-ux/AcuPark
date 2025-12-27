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
        primary: {
          DEFAULT: "#502E83", // Deep Purple from Figma (Rectangle 1)
          light: "#6B4C9A",
          dark: "#3A2160",
        },
        secondary: {
          DEFAULT: "#FFC700", // Yellow from CTA
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#121212",
        },
        text: {
          primary: "#211F27", // Dark text
          secondary: "#929292", // Gray text
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;

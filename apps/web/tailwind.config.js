/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm cream + deep green, matching the UI references
        // (Downloads/Requirement_Petcare.docx mockups).
        brand: {
          50: "#f3f6f2",
          100: "#e4ebe1",
          200: "#c8d6c2",
          400: "#7a9e6d",
          600: "#3f6b3a",
          700: "#2f5c2b", // primary actions
          900: "#16311a",
        },
        cream: "#faf6ef",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

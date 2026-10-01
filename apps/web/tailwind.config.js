/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Backed by CSS variables (defined in index.css's :root) instead of
        // fixed hex, so a hospital's own pages/shell can override the scale
        // with their chosen brand color — see shared/utils/brandScale.ts and
        // shared/components/BrandScope.tsx. Default values (warm mint/cream
        // + deep teal-green) are sampled from the PetConnect UI reference set
        // (UX:UI.zip) provided by the user.
        brand: {
          50: "rgb(var(--brand-50) / <alpha-value>)",
          100: "rgb(var(--brand-100) / <alpha-value>)",
          200: "rgb(var(--brand-200) / <alpha-value>)",
          300: "rgb(var(--brand-300) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)", // primary actions
          800: "rgb(var(--brand-800) / <alpha-value>)",
          900: "rgb(var(--brand-900) / <alpha-value>)",
        },
        cream: "#faf6ef",
      },
      backgroundImage: {
        // Soft diagonal mint-to-cream page background used by every
        // authenticated shell, matching the reference mockups.
        "app-gradient": "linear-gradient(135deg, #f6faf7 0%, #fefaf6 100%)",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

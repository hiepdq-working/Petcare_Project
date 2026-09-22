/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm mint/cream + deep teal-green, sampled from the PetConnect UI
        // reference set (UX:UI.zip) provided by the user.
        brand: {
          50: "#f3f9f6",
          100: "#e6f4ec",
          200: "#c9e4d5",
          300: "#a3d0b9",
          400: "#74b494",
          500: "#4c9977",
          600: "#327d60",
          700: "#1f6b53", // primary actions
          800: "#1b5645",
          900: "#16302a",
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

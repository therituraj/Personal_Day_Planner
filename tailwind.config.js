/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs", "./public/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#14110f",
          900: "#1c1814",
          800: "#2a241e",
          700: "#3d342c",
        },
        sand: {
          50: "#fbf7f0",
          100: "#f4eadb",
          200: "#e8d7bf",
        },
        clay: {
          500: "#c45c26",
          600: "#a94a1c",
          700: "#8b3c16",
        },
        moss: {
          400: "#6f8f6a",
          500: "#4f7a57",
          600: "#3d6145",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Fraunces"', "Georgia", "serif"],
      },
      boxShadow: {
        lift: "0 18px 45px -20px rgba(28, 24, 20, 0.35)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: "#17301D",
          darker: "#295234",
          base: "#3F7B4F",
          light: "#4F9863",
          lighter: "#46935B",
          accent1: "#4E9762",
          accent2: "#46935B",
          highlight: "#85ED85",
          pale: "#C7FFDE",
        },
        secondary: {
          dark: "#17301D",
          darker: "#1E2C00",
          base: "#466400",
          light: "#6A9700",
          lighter: "#6A9700",
          accent1: "#85BE00",
          accent2: "#B0F906",
          highlight: "#B3FF02",
          pale: "#d1ff66",
        }
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"]
      }
    },
  },
  plugins: [],
}


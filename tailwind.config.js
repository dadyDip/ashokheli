/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pinkCustom: "rgb(236,72,153)",   // matches your old CSS
        greenCustom: "rgb(34,197,94)",
        blueCustom: "rgb(59,130,246)",
        // add more colors as needed
      },
    },
  },
  plugins: [],
};

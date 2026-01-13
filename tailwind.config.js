/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                ruby: {
                    light: '#FCA5A5', // red-300
                    DEFAULT: '#F87171', // red-400  
                    dark: '#DC2626', // red-600
                    darker: '#991B1B', // red-800
                },
            },
        },
    },
    plugins: [],
}

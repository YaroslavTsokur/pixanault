// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  // !!! КЛЮЧЕВАЯ СТРОКА: УКАЗЫВАЕТ TAILWIND СЛЕДИТЬ ЗА КЛАССОМ 'dark' !!!
  darkMode: 'class', 
  
  content: [
    // Укажите пути ко всем вашим файлам с кодом, где используются классы Tailwind
    // Я предполагаю, что ваши файлы находятся в корне проекта и в папках components, pages и context
    "./**/*.{js,ts,jsx,tsx}", 
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Здесь можно добавить ваши фирменные цвета (например, pixana-purple), 
      // если они не были определены в другом месте
      colors: {
        'pixana-purple': '#6d28d9', // Фиолетовый
        'pixana-dark': '#4c1d95',   // Темный фиолетовый для ховера
        'pixana-pink': '#ec4899',   // Розовый
      },
    },
  },
  plugins: [],
}
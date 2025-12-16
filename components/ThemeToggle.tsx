import React from 'react';
// ПУТЬ: Убедитесь, что этот путь верен относительно ThemeToggle.tsx!
// Если ThemeToggle в 'components/' и ThemeContext в 'context/', то '..' нужен.
import { useTheme } from '../context/ThemeContext'; 
import { Sun, Moon } from 'lucide-react'; 

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Переключить тему"
      // Стилизация кнопки (пример для Tailwind CSS)
      className="p-2 rounded-lg transition-colors duration-300 
                 text-gray-600 dark:text-gray-300 
                 hover:bg-gray-100 dark:hover:bg-gray-700
                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {/* Логика: Если сейчас светлая тема ('light'), показываем Луну (Moon), 
        чтобы предложить пользователю переключиться на темную.
        Если сейчас темная тема ('dark'), показываем Солнце (Sun), 
        чтобы предложить пользователю переключиться на светлую.
      */}
      {theme === 'light' ? (
        // Иконка Луны для переключения в Темную тему
        <Moon className="h-6 w-6" />
      ) : (
        // Иконка Солнца для переключения в Светлую тему
        <Sun className="h-6 w-6 text-yellow-400" />
      )}
    </button>
  );
};

export default ThemeToggle;
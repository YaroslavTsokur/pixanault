import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Sun, Moon } from 'lucide-react'; 

// 1. Определяем типы
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// 2. Создаем контекст
// Если вы получаете ошибку о 'lucide-react', возможно, вам нужно установить пакет: npm install lucide-react
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Хук для использования контекста
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// 3. Компонент-провайдер с логикой
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Инициализация темы: из localStorage или 'light' по умолчанию
  const [theme, setTheme] = useState<Theme>(() => {
    // Проверяем, что мы в браузере (для SSR-проектов)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme;
      if (storedTheme) return storedTheme;
      
      // Проверка системных предпочтений
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  // Эффект для обновления класса 'dark' на <html> теге
  useEffect(() => {
    // Эта строка позволяет Tailwind CSS или другим стилям знать, какой класс применить
    const root = window.document.documentElement;
    
    // Удаляем старый класс и добавляем новый
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Сохраняем в localStorage для сохранения выбора пользователя
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Функция переключения
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
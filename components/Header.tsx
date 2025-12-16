// components/Header.tsx
import React from 'react';
import { Search, Bell, User } from 'lucide-react';
// Импортируем компонент ThemeToggle
import ThemeToggle from './ThemeToggle'; 

const Header: React.FC = () => {
  return (
    // Модифицируем классы header для поддержки темной темы:
    // bg-white -> bg-white dark:bg-gray-900 
    // border-b border-slate-200 -> border-slate-200 dark:border-gray-700
    // text-slate-500 -> text-slate-500 dark:text-gray-400 (для иконок и текста)
    <header className="h-16 
                       bg-white dark:bg-gray-900 
                       border-b border-slate-200 dark:border-gray-700 
                       flex items-center justify-between px-8 sticky top-0 z-40
                       transition-colors duration-300">
      
      <div className="flex items-center w-1/3">
        <div className="relative w-full max-w-md">
          {/* Цвет иконки поиска в темной теме */}
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500">
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder="Поиск по событиям, компаниям или ИНН..." 
            // Стили input в темной теме
            className="w-full pl-10 pr-4 py-2 
                       bg-slate-50 dark:bg-gray-800 
                       border border-slate-200 dark:border-gray-700 
                       rounded-lg focus:outline-none focus:ring-2 focus:ring-pixana-purple/50 
                       focus:border-pixana-purple transition-all text-sm
                       text-slate-800 dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        
        {/* Размещение кнопки переключения темы ДО уведомлений */}
        <ThemeToggle />
        
        {/* Кнопка Уведомлений: обновляем цвет в темной теме */}
        <button className="relative text-slate-500 dark:text-gray-400 hover:text-pixana-purple transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
        </button>
        
        <div className="flex items-center space-x-3 border-l 
                        border-slate-200 dark:border-gray-700 
                        pl-6">
          <div className="text-right hidden md:block">
            {/* Обновляем цвет текста */}
            <p className="text-sm font-semibold text-slate-800 dark:text-white">Александр М.</p>
            <p className="text-xs text-slate-500 dark:text-gray-400">Менеджер продаж</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pixana-purple to-pixana-pink flex items-center justify-center text-white shadow-md">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
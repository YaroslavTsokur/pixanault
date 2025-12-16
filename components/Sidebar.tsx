// Sidebar.tsx

import PixanaLogo from '../assets/PixanaLogo.png'; 
import React, { Dispatch, SetStateAction } from 'react';
import { 
    Home, BarChart, Users, Zap, FileText, Settings, LogOut, MessageSquare, Briefcase, Zap as ThemeIcon 
    // Zap переименован в ThemeIcon, чтобы не путать с Zap для Заявок
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Page } from '../types'; // Предполагаем, что Page импортируется из src/types

// 1. ОПРЕДЕЛЯЕМ ИНТЕРФЕЙС PROP-ов
interface SidebarProps {
    currentPage: Page;
    onNavigate: Dispatch<SetStateAction<Page>>;
}

// Конфигурация навигации
const navItems = [
    { page: Page.DASHBOARD, icon: Home, label: "Дашборд" },
    { page: Page.EVENTS, icon: Zap, label: "Заявки" },
    { page: Page.ANALYTICS, icon: BarChart, label: "Аналитика" },
    { page: Page.PARSING, icon: Briefcase, label: "Парсинг (Новое)" },
    { page: Page.AI_CHAT, icon: MessageSquare, label: "AI Ассистент" },
];

// 2. ИСПОЛЬЗУЕМ ИНТЕРФЕЙС SidebarProps и ДЕСТРУКТУРИРУЕМ ПРОПСЫ
const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
    // useTheme теперь не используется для переключения, только для чтения темы (если нужно)
    const { theme } = useTheme(); 

    return (
        <div className="w-64 flex flex-col h-screen 
                        bg-white dark:bg-gray-800 
                        shadow-lg dark:shadow-2xl dark:shadow-black/50 
                        transition-colors duration-300
                        flex-shrink-0">

            {/* БЛОК ЛОГОТИПА */}
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-gray-700">
                <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); onNavigate(Page.DASHBOARD); }} 
                    className="flex items-center space-x-2"
                >
                    <img 
                        src={PixanaLogo} 
                        alt="Pixana Logo" 
                        className="h-45 w-45 object-contain transition-transform hover:scale-[1.03]" 
                    />
                </a>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <a
                        key={item.page}
                        href="#"
                        onClick={(e) => { e.preventDefault(); onNavigate(item.page); }}
                        className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors duration-200 
                            ${currentPage === item.page 
                                ? 'bg-pixana-purple text-white shadow-md'
                                : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                            }`
                        }
                    >
                        <item.icon size={20} className="mr-3 flex-shrink-0" />
                        {item.label}
                    </a>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-100 dark:border-gray-700 space-y-2">
                
                {/* Настройки */}
                <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); onNavigate(Page.SETTINGS as Page); }}
                    className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors duration-200 
                        ${currentPage === Page.SETTINGS
                            ? 'bg-pixana-purple text-white shadow-md'
                            : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                        }`
                    }
                >
                    <Settings size={20} className="mr-3" />
                    Настройки
                </a>
                
                {/* ВЫРЕЗАНО: Кнопка переключения темы */}

                {/* Выход */}
                <button className="w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors duration-200 text-red-500 hover:bg-red-50 dark:hover:bg-gray-700">
                    <LogOut size={20} className="mr-3" />
                    Выход
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
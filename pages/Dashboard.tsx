// Dashboard.tsx
import React, { useMemo, useState, useCallback } from 'react'; 
import EventCard from '../components/EventCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'; 
import { EventData, ChartData, MetricData } from '../types';
import { useTheme } from '../context/ThemeContext';

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ДАТ ---

// 1. Функция для корректного парсинга даты DD.MM.YYYY HH:MM
const parseCustomDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    
    // Ожидаемый формат: 15.12.2025 15:43
    const parts = dateString.match(/(\d{2})\.(\d{2})\.(\d{4})\s(\d{2}):(\d{2})/);
    
    if (parts) {
        // parts[1]=День, parts[2]=Месяц (1-based), parts[3]=Год
        // ВАЖНО: Месяцы в JS начинаются с 0 (Январь=0), поэтому вычитаем 1 из Месяца.
        return new Date(
            parseInt(parts[3]),  // Год
            parseInt(parts[2]) - 1, // Месяц (0-11)
            parseInt(parts[1]),  // День
            parseInt(parts[4]),  // Час
            parseInt(parts[5])   // Минута
        );
    }
    // Попытка стандартного парсинга, если наш формат не совпал
    const standardDate = new Date(dateString);
    if (!isNaN(standardDate.getTime())) {
        return standardDate;
    }
    
    return null; 
};


// 2. Получает дату начала недели (Понедельник) для заданного смещения (0 = текущая неделя, -1 = прошлая)
const getStartOfWeek = (offset: number): Date => {
    const today = new Date();
    // 0=Вс, 1=Пн, ..., 6=Сб
    let dayOfWeek = today.getDay(); 
    if (dayOfWeek === 0) {
        dayOfWeek = 7; // Превращаем 0 (Вс) в 7, чтобы неделя начиналась с Пн (1)
    }

    // Смещение к Понедельнику текущей недели
    const diff = today.getDate() - dayOfWeek + 1; 
    
    const startOfWeek = new Date(today.setDate(diff + (offset * 7)));
    startOfWeek.setHours(0, 0, 0, 0); // Обнуляем время
    return startOfWeek;
};

// 3. Агрегирует события по дням недели
const aggregateEventsByDay = (events: EventData[], offset: number): ChartData[] => {
    const startOfWeek = getStartOfWeek(offset);
    
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const weekData: ChartData[] = [];
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    // Инициализация структуры данных на неделю
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek.getTime() + i * MS_PER_DAY);
        
        const dayKey = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }); 
        
        weekData.push({ 
            name: dayNames[i], 
            value: 0, 
            dateKey: dayKey, 
            nameLabel: 'Заявок' 
        });
    }

    // Агрегация реальных событий
    events.forEach(event => {
        // Используем парсер для корректного получения объекта Date
        const eventDate = parseCustomDate(event.date); 
        
        if (!eventDate) return; 
        
        // Обнуляем время события для сравнения с началом недели
        eventDate.setHours(0, 0, 0, 0); 
        
        // Проверяем, находится ли событие в текущей неделе
        // Проверка: eventDate >= startOfWeek И eventDate < startOfWeek + 7 дней
        if (eventDate.getTime() >= startOfWeek.getTime() && 
            eventDate.getTime() < startOfWeek.getTime() + 7 * MS_PER_DAY) {
            
            // Вычисляем, какой это день недели относительно начала недели
            const dayIndex = Math.floor((eventDate.getTime() - startOfWeek.getTime()) / MS_PER_DAY);
            
            if (dayIndex >= 0 && dayIndex < 7) {
                weekData[dayIndex].value += 1;
            }
        }
    });
    
    return weekData;
};


// --- ИНТЕРФЕЙС PROP-ов ---
interface DashboardProps {
    metrics: MetricData[];
    events: EventData[];
}

// --- АДАПТИВНЫЙ CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // Проверяем, включен ли темный режим (требуется доступ к window.document)
        const isDarkMode = typeof window !== 'undefined' && window.document.documentElement.classList.contains('dark');
        
        // Получаем дату из payload
        const dateKey = payload[0].payload.dateKey;
        const formattedLabel = `${label} (${dateKey})`;

        return (
            <div className={`p-3 rounded-lg border text-sm shadow-md 
                             ${isDarkMode 
                                 ? 'bg-gray-700 border-gray-600 text-white' 
                                 : 'bg-white border-slate-200 text-slate-800'
                             }`}
            >
                <p className="font-bold mb-1">{formattedLabel}</p>
                {payload.map((item: any, index: number) => (
                    <p key={index} style={{ color: item.color || item.stroke }} className="whitespace-nowrap">
                        {`${item.nameLabel || item.name || 'Объем'}: ${item.value}`}
                    </p>
                ))}
            </div>
        );
    }

    return null;
};
// --- КОНЕЦ CUSTOM TOOLTIP ---


const Dashboard: React.FC<DashboardProps> = ({ metrics, events }) => {
    
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    
    // НОВОЕ СОСТОЯНИЕ: Смещение недели (0 = текущая неделя, -1 = прошлая и т.д.)
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

    const chartTextColor = isDarkMode ? '#e5e7eb' : '#334155';
    const chartGridColor = isDarkMode ? '#4b5563' : '#e2e8f0';
    const chartAxisStroke = isDarkMode ? '#6b7280' : '#94a3b8';

    // ДИНАМИЧЕСКИЕ ДАННЫЕ ДЛЯ ГРАФИКА
    const trendData = useMemo(() => {
        return aggregateEventsByDay(events, currentWeekOffset);
    }, [events, currentWeekOffset]);

    // Логика переключения недель
    const handlePrevWeek = useCallback(() => {
        setCurrentWeekOffset(prev => prev - 1);
    }, []);

    const handleNextWeek = useCallback(() => {
        // Запрещаем переход в будущее, если мы уже на текущей неделе
        if (currentWeekOffset < 0) {
            setCurrentWeekOffset(prev => prev + 1);
        }
    }, [currentWeekOffset]);
    
    // Заголовок текущей недели
    const weekTitle = useMemo(() => {
        const start = getStartOfWeek(currentWeekOffset);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        // Используем day и short month для вывода в заголовок
        const startMonth = start.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
        const endMonth = end.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
        
        let title = `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth}`;

        if (currentWeekOffset === 0) {
            title += ' (Текущая)';
        } else if (currentWeekOffset === -1) {
            title += ' (Прошлая)';
        }

        return title;
    }, [currentWeekOffset]);


    // Горячие события (берем только 2 последних)
    const hotEvents = useMemo(() => {
        return events.slice(0, 2); 
    }, [events]);

    // 2. Инициализируем данные для KPI-карт
    const getMetricByKey = (key: string) => metrics.find(m => m.key === key);

    
    const newEventsMetric = getMetricByKey('orders_in_work') || { 
        title: 'Всего заявок в работе', 
        key: 'orders_in_work',
        value: 0, 
        change: 0, 
        trend: 'neutral' 
    };
    
    const urgentSignalsMetric = getMetricByKey('urgent_signals') || { 
        title: 'Срочных сделок', 
        key: 'urgent_signals',
        value: 0, 
        change: 0, 
        trend: 'neutral' 
    };
    
    // Вспомогательные функции для рендеринга KPI
    const getTrendClass = (trend: 'up' | 'down' | 'neutral') => {
        if (trend === 'up') return 'text-emerald-600';
        if (trend === 'down') return 'text-red-600';
        return 'text-slate-400 dark:text-gray-500';
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
        if (trend === 'up') return <TrendingUp size={12} className="mr-1 transform rotate-0" />;
        if (trend === 'neutral') return <AlertCircle size={12} className="mr-1" />;
        return <TrendingUp size={12} className="mr-1 transform rotate-180" />; 
    };

    return (
    <div className="p-8 space-y-8 animate-fade-in transition-colors duration-300"> 
        {/* Header Section */}
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Дашборд</h1> 
                <p className="text-slate-500 dark:text-gray-400 mt-1">Обзор рынка и ключевые показатели на сегодня</p> 
            </div>
            <div className="flex space-x-2">
                <select className="bg-white dark:bg-gray-800 
                                     border border-slate-200 dark:border-gray-700 
                                     text-slate-700 dark:text-white 
                                     text-sm rounded-lg p-2.5 focus:ring-pixana-purple focus:border-pixana-purple">
                    <option>Все регионы</option>
                    <option>Москва</option>
                    <option>Урал</option>
                </select>
                <button className="bg-pixana-purple hover:bg-pixana-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Экспорт отчета
                </button>
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* KPI 1: Всего заявок в работе */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:shadow-none border border-slate-100 dark:border-gray-700 transition-colors duration-300">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-gray-400">{newEventsMetric.title}</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{newEventsMetric.value}</h3>
                    </div>
                    {/* Адаптация иконки к темной теме (Фиолетовый) */}
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg text-pixana-purple dark:text-purple-300">
                        <Package size={20} />
                    </div>
                </div>
                <p className={`text-xs ${getTrendClass(newEventsMetric.trend)} flex items-center mt-3 font-medium`}>
                    {getTrendIcon(newEventsMetric.trend)} {newEventsMetric.change > 0 ? '+' : ''}{newEventsMetric.change}% к прошлой неделе
                </p>
            </div>

            {/* KPI 2: Срочные сигналы */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:shadow-none border border-slate-100 dark:border-gray-700 transition-colors duration-300">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-gray-400">{urgentSignalsMetric.title}</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{urgentSignalsMetric.value}</h3>
                    </div>
                    {/* Адаптация иконки к темной теме (Красный) */}
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg text-red-500 dark:text-red-300">
                        <AlertCircle size={20} />
                    </div>
                </div>
                <p className="text-xs text-red-500 mt-3 font-medium">
                    Требуют внимания
                </p>
            </div>
            
        </div>

        {/* Main Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:shadow-none border border-slate-100 dark:border-gray-700 transition-colors duration-300">
            {/* БЛОК: Заголовок и навигация по неделям */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Тренд спроса</h2>
                <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-gray-300">
                    <button 
                        onClick={handlePrevWeek}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="font-medium text-slate-700 dark:text-white w-48 text-center">{weekTitle}</span>
                    <button 
                        onClick={handleNextWeek}
                        disabled={currentWeekOffset === 0} 
                        className={`p-1 rounded-full transition-colors 
                                     ${currentWeekOffset === 0 
                                         ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                                         : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                     }`}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7937e2" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#7937e2" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="name" 
                            stroke={chartAxisStroke}
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            tick={{ fill: chartTextColor }}
                        />
                        <YAxis 
                            stroke={chartAxisStroke}
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            tick={{ fill: chartTextColor }}
                            domain={[0, 'auto']} 
                            allowDecimals={false} 
                        />
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            vertical={false} 
                            stroke={chartGridColor} 
                        />
                        <Tooltip 
                            content={<CustomTooltip />}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            name="Заявок" 
                            stroke="#7937e2" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorValue)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Hot Events Section */}
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                    <span className="mr-2">🔥</span> Горячие события
                </h2>
                <button className="text-sm text-pixana-purple hover:underline">Все</button>
            </div>
            {/* ИСПРАВЛЕННАЯ СТРОКА 376: Класс теперь полностью закрыт */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
                {hotEvents.map(event => (
                    <EventCard key={event.id} event={event} /> 
                ))}
            </div>
        </div>
    </div>
    );
};

export default Dashboard;
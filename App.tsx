// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import EventsList from './pages/EventsList';
import Analytics from './pages/Analytics';
import AiChat from './pages/AiChat';
import { ThemeProvider } from './context/ThemeContext';
import ParsingPage from './pages/ParsingPage';
import { Page, EventData, MetricData, DashboardUpdateData } from './types';
import { Loader2 } from 'lucide-react';

// URL для загрузки кэша
const EVENTS_API_URL = 'https://pixanault.vercel.app/api/events';

// ОПРЕДЕЛЯЕМ АКТУАЛЬНЫЕ НАЧАЛЬНЫЕ МЕТРИКИ
const initialMetrics: MetricData[] = [
    {
        key: 'orders_in_work',
        title: 'Всего заявок в работе',
        value: 0,
        change: 0,
        trend: 'neutral',
        icon: 'Package'
    },
    {
        key: 'urgent_signals',
        title: 'Срочных сделок',
        value: 0,
        change: 0,
        trend: 'neutral',
        icon: 'AlertCircle'
    },
    {
        key: 'total_base',
        title: 'Общая база данных (ед.)',
        value: 0,
        change: 0,
        trend: 'neutral',
        icon: 'Users'
    },
];

// --- ЛОГИКА: ФУНКЦИЯ ГЕНЕРАЦИИ СЛУЧАЙНОГО ПОТЕНЦИАЛА ---
const possibleConfidence = [80, 85, 90, 95, 100];

const getRandomConfidence = (): number => {
    const randomIndex = Math.floor(Math.random() * possibleConfidence.length);
    return possibleConfidence[randomIndex];
};

// Функция для установки рандомного потенциала и статуса
const setRandomConfidenceAndStatus = (event: EventData): EventData => {
    // Принудительно генерируем новый случайный потенциал для всех событий
    const randomConfidence = getRandomConfidence();

    // Статус: 'urgent' для 90%+ потенциала, иначе 'potential'
    const status = randomConfidence >= 90 ? 'urgent' : 'potential';

    return {
        ...event,
        confidence: randomConfidence,
        status: status,
    };
};
// --- КОНЕЦ ЛОГИКИ ---


const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);

    const [events, setEvents] = useState<EventData[]>([]);
    const [metrics, setMetrics] = useState<MetricData[]>(initialMetrics);
    const [isLoading, setIsLoading] = useState(true);

    // --- 1. ЛОГИКА ОБНОВЛЕНИЯ МЕТРИК ---

    const recalculateMetrics = useCallback((currentEvents: EventData[]) => {
        const totalBase = currentEvents.length;

        // Всего заявок в работе (urgent, confirmed, potential)
        const ordersInWork = currentEvents.filter(e =>
            e.status === 'urgent' || e.status === 'confirmed' || e.status === 'potential'
        ).length;

        // Срочные сделки = заявки с потенциалом 90% и выше
        const urgentSignals = currentEvents.filter(e => e.confidence && e.confidence >= 90).length;

        console.log(`[Recalculate] Urgent Signals calculated: ${urgentSignals}`);

        setMetrics(prevMetrics => {
            return prevMetrics.map(metric => {
                if (metric.key === 'orders_in_work') {
                    return { ...metric, value: ordersInWork };
                }
                if (metric.key === 'total_base') {
                    return { ...metric, value: totalBase };
                }
                if (metric.key === 'urgent_signals') {
                    return { ...metric, value: urgentSignals };
                }
                return metric;
            });
        });
    }, []);

    // --- 2. ЭФФЕКТ ДЛЯ ЗАГРУЗКИ КЭША ПРИ СТАРТЕ ---
    useEffect(() => {
        let isMounted = true;

        const loadCachedEvents = async () => {
            try {
                const response = await fetch(EVENTS_API_URL);

                if (!response.ok) {
                    console.warn(`[App] API-эндпоинт кэша не доступен или пуст: ${response.status}. Приложение запускается без кэша.`);
                    return;
                }

                // 💡 ИСПРАВЛЕНИЕ: Используем any, чтобы прочитать event_date
                const cachedEvents: any[] = await response.json();

                if (isMounted && cachedEvents.length > 0) {
                    
                    // 💡 ИСПРАВЛЕНИЕ: Нормализуем данные, переименовывая event_date в date
                    const normalizedEvents: EventData[] = cachedEvents.map(event => ({
                        ...event,
                        date: event.event_date, // Сопоставляем event_date из JSON с ожидаемым date
                        // Удаляем event_date, чтобы осталась только нужная структура EventData
                        event_date: undefined 
                    } as EventData));

                    // Присваиваем рандомный потенциал и статус при загрузке из кэша
                    const processedCachedEvents = normalizedEvents.map(setRandomConfidenceAndStatus);

                    setEvents(processedCachedEvents);
                    recalculateMetrics(processedCachedEvents);
                    console.log(`[App] Загружено ${processedCachedEvents.length} событий из кэша.`);
                }

            } catch (error) {
                console.error('[App] Критическая ошибка при обработке данных кэша:', error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadCachedEvents();

        return () => {
            isMounted = false;
        };
    }, [recalculateMetrics]);


    // --- 3. ЛОГИКА ОБНОВЛЕНИЯ ДАННЫХ ПАРСЕРОМ ---

    // 1. Добавление новых событий/заявок
    const handleNewEventsCollected = (newEvents: EventData[]) => {

        // Присваиваем рандомный потенциал и статус новым событиям
        const processedNewEvents = newEvents.map(setRandomConfidenceAndStatus);

        const newEventIds = new Set(processedNewEvents.map(e => e.id));

        setEvents(prevEvents => {

            // 1. ФРОНТЕНД-ДЕУПЛИКАЦИЯ
            const filteredPrevEvents = prevEvents.filter(e => !newEventIds.has(e.id));

            // 2. Собираем финальный список (новые в начале)
            const updatedEvents = [...processedNewEvents, ...filteredPrevEvents];

            console.log(`[App] Добавлено ${processedNewEvents.length} новых событий. Всего: ${updatedEvents.length}`);

            // 3. Пересчитываем все метрики
            recalculateMetrics(updatedEvents);

            return updatedEvents;
        });
    };

    // 2. Обновление метрик дашборда (функция упрощена)
    const handleDashboardUpdate = (updateData: DashboardUpdateData) => {
        if (updateData.totalParsed !== undefined) {
            setMetrics(prevMetrics =>
                prevMetrics.map(metric =>
                    metric.key === 'total_base'
                        ? { ...metric, value: updateData.totalParsed }
                        : metric
                )
            );
        }
        console.log(`[App] Обновлены метрики дашборда.`);
    };


    // --- РЕНДЕР СТРАНИЦ ---

    const renderPage = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-full dark:text-white">
                    <Loader2 size={32} className="animate-spin mr-3" />
                    Загрузка данных из кэша...
                </div>
            );
        }

        switch (currentPage) {
            case Page.DASHBOARD:
                // Передаем ограниченное количество событий для оптимизации
                return <Dashboard metrics={metrics} events={events.slice(0, 50)} />; 
            case Page.EVENTS:
                return <EventsList events={events} />;
            case Page.PARSING:
                return (
                    <ParsingPage
                        onNewEventsCollected={handleNewEventsCollected}
                        onDashboardUpdate={handleDashboardUpdate}
                    />
                );
            case Page.ANALYTICS:
                return <Analytics />;
            case Page.AI_CHAT:
                return <AiChat />;
            default:
                return <Dashboard metrics={metrics} events={events.slice(0, 50)} />;
        }
    };

    return (
        <ThemeProvider>
            <div className="flex h-screen overflow-hidden transition-colors duration-300">

                <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

                <div className="flex-1 flex flex-col h-full">

                    <Header />

                    <main className="flex-1 overflow-x-hidden overflow-y-auto
                                     bg-gray-100 dark:bg-gray-900
                                     relative transition-colors duration-300">
                        {renderPage()}
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
};

export default App;
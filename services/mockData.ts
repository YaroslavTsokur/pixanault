// mockData.ts
import { EventData, ChartData, MetricData } from '../types';

// =========================================================
// ДАННЫЕ ДЛЯ МЕТРИК (MetricData)
// Добавлено поле 'key' для надежной идентификации в App.tsx
// =========================================================
export const initialMetrics: MetricData[] = [
    { 
        key: 'new_orders_week', 
        title: 'Новые заявки за неделю', 
        value: 120, 
        change: 15, 
        trend: 'up' 
    },
    { 
        key: 'orders_in_work', // <-- КЛЮЧ: Обновляется парсером (количество новых заявок)
        title: 'Всего заявок в работе', 
        value: 452, 
        change: -5, 
        trend: 'down' 
    },
    { 
        key: 'total_base', // <-- КЛЮЧ: Обновляется парсером (общая база)
        title: 'Общая база данных (ед.)', 
        value: 503, 
        change: 3, 
        trend: 'up' 
    },
    { 
        key: 'avg_confidence', 
        title: 'Средняя уверенность (Confidence)', 
        value: '78%', 
        change: 2, 
        trend: 'up' 
    },
];

// =========================================================
// ДАННЫЕ ДЛЯ СОБЫТИЙ (EventData)
// MOCK_EVENTS переименован в initialEvents для соответствия App.tsx
// =========================================================
export const initialEvents: EventData[] = [
  {
    id: 1532,
    product: "Арматура А500С",
    company: "Мосстрой №5",
    region: "Москва",
    volume: "300 тонн",
    intent: "Строительство ЖК 'Высота'",
    event_date: "2025-01-07",
    status: 'urgent',
    confidence: 92,
    source: "TenderPro"
  },
  {
    id: 1533,
    product: "Листовой прокат",
    company: "УралМашЗавод",
    region: "Екатеринбург",
    volume: "150 тонн",
    intent: "Закупка для производства",
    event_date: "2025-01-08",
    status: 'potential',
    confidence: 65,
    source: "News Parser"
  },
  {
    id: 1534,
    product: "Бетон М400",
    company: "СПб Реновация",
    region: "Санкт-Петербург",
    volume: "500 куб.м",
    intent: "Заливка фундамента",
    event_date: "2025-01-09",
    status: 'confirmed',
    confidence: 98,
    source: "Direct Contract"
  },
  {
    id: 1535,
    product: "Швеллер 20",
    company: "СибСтрой",
    region: "Новосибирск",
    volume: "45 тонн",
    intent: "Реконструкция склада",
    event_date: "2025-01-10",
    status: 'potential',
    confidence: 45,
    source: "Avito Parse"
  },
  {
    id: 1536,
    product: "Арматура А240",
    company: "ЮгСтройИнвест",
    region: "Краснодар",
    volume: "1200 тонн",
    intent: "Новый микрорайон",
    event_date: "2025-01-06",
    status: 'urgent',
    confidence: 89,
    source: "GosZakupki"
  }
];

// Для совместимости, если где-то используется старый импорт:
export const MOCK_EVENTS: EventData[] = initialEvents;


// =========================================================
// ДАННЫЕ ДЛЯ ГРАФИКОВ (ChartData)
// =========================================================
export const DEMAND_TREND_DATA: ChartData[] = [
  { name: 'Янв', value: 4000 },
  { name: 'Фев', value: 3000 },
  { name: 'Мар', value: 2000 },
  { name: 'Апр', value: 2780 },
  { name: 'Май', value: 1890 },
  { name: 'Июн', value: 2390 },
  { name: 'Июл', value: 3490 },
];

export const REGION_DATA: ChartData[] = [
  { name: 'Москва', value: 45 },
  { name: 'СПб', value: 25 },
  { name: 'Урал', value: 15 },
  { name: 'Сибирь', value: 10 },
  { name: 'Юг', value: 5 },
];
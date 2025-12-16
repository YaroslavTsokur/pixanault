// mockData.ts
import { EventData, MetricData } from './types';

// Начальные фейковые события
export const initialEvents: EventData[] = [
    {
        id: 101,
        product: 'Проект 1: Крупная закупка арматуры',
        company: 'ООО "СтройКапитал"',
        region: 'Москва',
        volume: '1000 т.',
        intent: 'Срочно ищут поставщика металлопроката для гос. заказа.',
        event_date: '10.12.2025',
        status: 'urgent',
        confidence: 90,
        source: 'Fake API'
    },
    {
        id: 102,
        product: 'Заявка на профнастил С-20',
        company: 'ЗАО "Фасад-Монтаж"',
        region: 'Самара',
        volume: '5000 м²',
        intent: 'Планируют начать строительство крупного ангара в следующем квартале.',
        event_date: '15.01.2026',
        status: 'potential',
        confidence: 75,
        source: 'Fake API'
    },
];

// Начальные метрики дашборда
export const initialMetrics: MetricData[] = [
    {
        title: 'Всего заявок в работе',
        value: initialEvents.length,
        change: 15,
        trend: 'up'
    },
    {
        title: 'Потенциальный объем (т.)',
        value: '1500',
        change: -5,
        trend: 'down'
    },
    {
        title: 'Срочных сделок',
        value: 1,
        change: 0,
        trend: 'neutral'
    },
    // Добавим метрику, которую будет обновлять парсер
    {
        title: 'Общая база данных (ед.)',
        value: 503, 
        change: 8,
        trend: 'up'
    }
];
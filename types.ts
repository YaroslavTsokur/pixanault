// types.ts

// --- Интерфейсы данных ---

export interface EventData {
  id: number;
  product: string;
  company: string;
  region: string;
  volume: string;
  intent?: string; // <-- Сделано необязательным для соответствия парсеру
  event_date: string; // Формат ДД.ММ.ГГГГ ЧЧ:ММ
  status: 'urgent' | 'potential' | 'confirmed'; // red, yellow, green
  confidence: number;
  source?: string; // Источник
}

export interface ChartData {
  name: string;
  value: number;
  value2?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
}

// --- Интерфейсы для Дашборда ---

// Тип для отдельной метрики (например, "Новые заявки за неделю")
export interface MetricData {
    key: string; // <-- НОВОЕ: Уникальный ключ для идентификации метрики
    title: string;
    value: number | string;
    change: number; // Процент изменения относительно предыдущего периода
    trend: 'up' | 'down' | 'neutral';
}

// Тип для обновления дашборда после парсинга
export interface DashboardUpdateData {
    // Используются ключи, соответствующие MetricData.key
    newOrders?: number; // Соответствует, например, key: 'orders_in_work'
    totalParsed?: number; // Соответствует, например, key: 'total_base'
    // ... здесь могут быть и другие метрики
}


// --- Навигация ---

export enum Page {
  DASHBOARD = 'dashboard',
  EVENTS = 'events',
  PARSING = 'parsing', 
  ANALYTICS = 'analytics',
  AI_CHAT = 'ai_chat',
  SETTINGS = "SETTINGS",
  REPORTS = "REPORTS",
  USERS = "USERS",
}
// ParsingPage.tsx
import React, { useState } from 'react';
import { EventData, DashboardUpdateData } from '../types';
import { Play, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

// Определяем интерфейс пропсов для функций обратного вызова
interface ParsingPageProps {
  onNewEventsCollected: (events: EventData[]) => void;
  onDashboardUpdate: (data: DashboardUpdateData) => void;
}

// URL вашего API-маршрута, который запускает Python-скрипт
const API_URL = 'http://localhost:3002/api/parse';

const ParsingPage: React.FC<ParsingPageProps> = ({ onNewEventsCollected, onDashboardUpdate }) => {
  const [isParsing, setIsParsing] = useState(false);
  const [message, setMessage] = useState('Нажмите кнопку, чтобы собрать заявки за вчерашний день.');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');

  // Генерация уникального ID для новых событий (для моковых данных)
  const generateUniqueId = () => Math.floor(Math.random() * 1000000);

  const startParsing = async () => {
    if (isParsing) return;

    setIsParsing(true);
    setStatusType('info');
    setMessage('Запуск сбора данных за последние дни. Пожалуйста, подождите, это может занять до минуты...');

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        // Пытаемся получить детали ошибки из тела ответа
        const errorData = await response.json().catch(() => ({ message: 'Ошибка HTTP-запроса', details: response.statusText }));
        throw new Error(errorData.message || 'Неизвестная ошибка сервера.');
      }

      // Ответ должен быть массивом EventData в формате JSON
      const collectedEvents: EventData[] = await response.json();
      
      // Добавляем ID к новым событиям, если они не были добавлены Python'ом
      const eventsWithIds: EventData[] = collectedEvents.map(e => ({
        ...e,
        id: e.id || generateUniqueId(),
      }));

      // 1. Обновляем список событий в App.tsx
      onNewEventsCollected(eventsWithIds);

      // 2. Обновляем метрики дашборда в App.tsx
      onDashboardUpdate({
        newOrders: eventsWithIds.length,
        // Пример: Общая база данных увеличивается на количество новых событий
        totalParsed: 503 + eventsWithIds.length
      });

      setStatusType('success');
      setMessage(`Сбор завершен! Найдено ${eventsWithIds.length} новых заявок. Данные добавлены в список событий.`);

    } catch (error) {
      setStatusType('error');
      setMessage(`Критическая ошибка: ${error.message}. Проверьте консоль сервера Node.js.`);
      console.error('Ошибка парсинга:', error);
    } finally {
      setIsParsing(false);
    }
  };

  // ИЗМЕНЕНИЕ: Обновлены стили для темной темы в функции getStatusStyles
  const getStatusStyles = () => {
    switch (statusType) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-600';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-600';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-600';
    }
  };

  const getStatusIcon = () => {
    switch (statusType) {
      case 'success':
        return <CheckCircle size={20} className="mr-2" />;
      case 'error':
        return <AlertCircle size={20} className="mr-2" />;
      default:
        return isParsing ? <Loader2 size={20} className="mr-2 animate-spin" /> : <Play size={20} className="mr-2" />;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-4xl mx-auto transition-colors duration-300">
      {/* ИЗМЕНЕНИЕ: Заголовок */}
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Сбор заявок (Парсинг)</h1>
      {/* ИЗМЕНЕНИЕ: Описание */}
      <p className="text-slate-500 dark:text-gray-400">
        Здесь вы можете запустить единый скрипт для сбора заявок с MetalTrade и MetalInfo. 
        Логика сбора: предыдущий рабочий день (Пн: Пт, Сб, Вс).
      </p>

      {/* ИЗМЕНЕНИЕ: Основная карточка */}
      <div className="bg-white dark:bg-gray-800 
                      p-6 rounded-xl shadow-lg dark:shadow-none 
                      border border-slate-100 dark:border-gray-700 
                      space-y-4">
        
        {/* ИЗМЕНЕНИЕ: Подзаголовок */}
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Единый запуск</h2>
        {/* ИЗМЕНЕНИЕ: Описание блока */}
        <p className="text-slate-600 dark:text-gray-300">
          Эта кнопка запускает единый бэкенд-скрипт, который выполняет парсинг обоих источников, 
          автоматически определяя целевые даты.
        </p>

        <button
          onClick={startParsing}
          disabled={isParsing}
          className={`flex items-center justify-center px-6 py-3 rounded-xl text-lg font-bold transition-all w-full
            ${isParsing 
              // ИЗМЕНЕНИЕ: Кнопка в состоянии disabled
              ? 'bg-slate-400 dark:bg-slate-600 text-white cursor-not-allowed' 
              : 'bg-pixana-purple hover:bg-pixana-dark text-white shadow-md hover:shadow-lg'}`
          }
        >
          {isParsing ? (
            <>
              <Loader2 size={24} className="animate-spin mr-3" /> 
              Парсинг в процессе...
            </>
          ) : (
            <>
              <Play size={24} className="mr-3 fill-white" /> 
              Запустить сбор заявок (авто-дата)
            </>
          )}
        </button>
        
        {/* Блок статуса: использует обновленные getStatusStyles() */}
        <div className={`p-4 rounded-lg border flex items-center text-sm ${getStatusStyles()}`}>
          {getStatusIcon()}
          <p className="font-medium">{message}</p>
        </div>

      </div>
    </div>
  );
};

export default ParsingPage;
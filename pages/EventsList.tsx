// EventsList.tsx
import React, { useState, useMemo } from 'react';
import { api } from '../services/api'; 
import { Filter, Download, Send, ExternalLink, Loader2 } from 'lucide-react';
import { EventData } from '../types';

interface EventsListProps {
    events: EventData[]; // Принимаем список событий из App.tsx
}

const getStatusClasses = (status: EventData['status']) => {
    switch (status) {
        case 'urgent':
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        case 'confirmed':
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        default:
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
};

const getStatusLabel = (status: EventData['status']) => {
    switch (status) {
        case 'urgent':
            return 'Срочно';
        case 'confirmed':
            return 'Подтвержден';
        default:
            return 'Потенциал';
    }
};


const EventsList: React.FC<EventsListProps> = ({ events }) => {
    const [filter, setFilter] = useState('');

    const filteredEvents = useMemo(() => {
        return events.filter(e => 
            e.product.toLowerCase().includes(filter.toLowerCase()) || 
            e.company.toLowerCase().includes(filter.toLowerCase())
        );
    }, [events, filter]); // Пересчитываем при изменении событий или фильтра

    const handleCreateLead = async (id: number) => {
        try {
            const response = await api.events.createLead(id);
            alert(`Лид по событию ${id} создан: ${response.message}`);
        } catch (error) {
            console.error("Failed to create lead", error);
            alert("Ошибка при создании лида.");
        }
    };
    
    // Временно оставляем лоадер, если список пуст.
    if (events.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-slate-400 dark:text-gray-500">
                <Loader2 className="animate-spin mr-2" /> Заявок не найдено.
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6 transition-colors duration-300">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Заявки рынка</h1>
                <div className="flex space-x-3">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Фильтр..." 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="pl-4 pr-10 py-2 border border-slate-300 dark:border-gray-700 
                                       rounded-lg text-sm focus:ring-pixana-purple focus:border-pixana-purple
                                       bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-200"
                        />
                        <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                    </div>
                    <button className="flex items-center space-x-2 
                                       bg-white dark:bg-gray-800 
                                       border border-slate-300 dark:border-gray-700 
                                       px-4 py-2 rounded-lg text-sm font-medium 
                                       text-slate-700 dark:text-gray-200
                                       hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                        <Download size={16} />
                        <span>Экспорт</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 
                            shadow-sm dark:shadow-xl dark:shadow-black/20 
                            border border-slate-200 dark:border-gray-700 
                            rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-gray-700 
                                          text-slate-500 dark:text-gray-400 
                                          font-medium border-b border-slate-200 dark:border-gray-600">
                            <tr>
                                <th className="px-6 py-4">Продукт</th>
                                <th className="px-6 py-4">Компания</th>
                                <th className="px-6 py-4">Регион</th>
                                <th className="px-6 py-4">Объем</th>
                                <th className="px-6 py-4">Дата</th>
                                <th className="px-6 py-4">Статус</th>
                                <th className="px-6 py-4">Вероятность</th>
                                <th className="px-6 py-4 text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                            {filteredEvents.map((event) => (
                                <tr key={event.id} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/30 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{event.product}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-gray-400">{event.company}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-gray-400">{event.region}</td>
                                    <td className="px-6 py-4 text-slate-800 dark:text-gray-200 font-medium">{event.volume}</td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-gray-500">{event.event_date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(event.status)}`}>
                                            {getStatusLabel(event.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-1.5 w-24">
                                            <div 
                                                className={`h-1.5 rounded-full ${event.confidence > 80 ? 'bg-green-500' : event.confidence > 50 ? 'bg-yellow-500' : 'bg-slate-400'}`} 
                                                style={{ width: `${event.confidence}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-slate-400 dark:text-gray-500 mt-1 block">{event.confidence}%</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleCreateLead(event.id)}
                                                className="p-1.5 text-pixana-purple hover:bg-purple-100 dark:hover:bg-gray-700/50 rounded" 
                                                title="В CRM"
                                            >
                                                <Send size={16} />
                                            </button>
                                            <a href={event.source} target="_blank" rel="noopener noreferrer" 
                                               className="p-1.5 text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700/50 rounded" 
                                               title="Источник">
                                                <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700 flex justify-center">
                    <button className="text-sm text-pixana-purple font-medium hover:underline">Загрузить еще</button>
                </div>
            </div>
        </div>
    );
};

export default EventsList;
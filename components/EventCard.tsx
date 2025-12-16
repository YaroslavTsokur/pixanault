// EventCard.tsx (Предполагается, что это окончательный код после предыдущих модификаций)
import React from 'react';
import { EventData } from '../types';
import { Truck, MapPin, DollarSign, Calendar, Zap, TrendingUp, Send } from 'lucide-react';

interface EventCardProps {
    event: EventData;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
    // Helper function to get color based on confidence
    const getConfidenceColor = (confidence: number) => {
        if (confidence > 80) return 'text-green-500 bg-green-500/20';
        if (confidence > 50) return 'text-yellow-500 bg-yellow-500/20';
        return 'text-slate-500 bg-slate-500/20';
    };

    // Helper function to get status colors (updated for dark theme)
    const getStatusColor = (status: EventData['status']) => {
        switch (status) {
            case 'urgent':
                return 'bg-red-500 text-white';
            case 'confirmed':
                return 'bg-green-500 text-white';
            default:
                return 'bg-yellow-500 text-white';
        }
    };

    const statusLabel = event.status === 'urgent' ? 'Срочно' : event.status === 'confirmed' ? 'Подтвержден' : 'Потенциал';

    return (
        // ИЗМЕНЕНИЕ: shadow-md заменен на shadow-sm для легкости в светлой теме.
        // dark:shadow-none оставлен, так как он уже делает карточку легче в темной теме.
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:shadow-none">
            
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug pr-4">{event.product}</h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center ${getStatusColor(event.status)}`}>
                    <Zap size={12} className="mr-1" /> {statusLabel}
                </span>
            </div>

            <div className="space-y-3 text-sm text-slate-600 dark:text-gray-400">
                <div className="flex items-center">
                    <Truck size={16} className="mr-3 flex-shrink-0 text-pixana-purple" />
                    <span className="font-medium text-slate-800 dark:text-gray-200">{event.company}</span>
                </div>

                <div className="flex items-center">
                    <MapPin size={16} className="mr-3 flex-shrink-0 text-slate-400 dark:text-gray-500" />
                    <span>{event.region}</span>
                </div>

                <div className="flex items-center">
                    <DollarSign size={16} className="mr-3 flex-shrink-0 text-slate-400 dark:text-gray-500" />
                    <span>Объем: <span className="font-semibold text-slate-800 dark:text-gray-200">{event.volume}</span></span>
                </div>
                
                <div className="flex items-center">
                    <Calendar size={16} className="mr-3 flex-shrink-0 text-slate-400 dark:text-gray-500" />
                    <span>Дата: {event.event_date}</span>
                </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <TrendingUp size={16} className={`mr-1 ${getConfidenceColor(event.confidence)}`} />
                    <span className={`text-sm font-semibold ${getConfidenceColor(event.confidence)}`}>
                        Вероятность: {event.confidence}%
                    </span>
                </div>
                
                <button
                    className="flex items-center text-sm text-pixana-purple font-medium hover:text-purple-600 transition-colors"
                    onClick={() => console.log(`Creating lead for event ${event.id}`)}
                >
                    <Send size={16} className="mr-1" />
                    В CRM
                </button>
            </div>
        </div>
    );
};

export default EventCard;
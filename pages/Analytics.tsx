// Analytics.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { ChartData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext'; 

// Тип для данных графика с индексной сигнатурой (для совместимости с recharts)
type RechartsChartData = ChartData & Record<string, any>;

// Кастомный TooltipContent для поддержки темной темы
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const isDarkMode = window.document.documentElement.classList.contains('dark');
        
        return (
            <div className={`p-3 rounded-lg border text-sm shadow-md 
                             ${isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-slate-200 text-slate-800'
                              }`}
            >
                <p className="font-bold mb-1">{label}</p>
                {payload.map((item: any, index: number) => (
                    <p key={index} style={{ color: item.color }}>
                        {`${item.name || 'Объем'}: ${item.value}`}
                    </p>
                ))}
            </div>
        );
    }

    return null;
};

// КОМПОНЕНТ ДЛЯ АКТИВНОГО СЕКТОРА (ЭФФЕКТ УВЕЛИЧЕНИЯ)
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8} // УВЕЛИЧИВАЕМ РАДИУС
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.9}
        stroke={fill}
      />
    </g>
  );
};

// --- НОВОЕ ИСПРАВЛЕНИЕ: Обертка для подавления ошибок типизации ---
const PieWrapper = (props: any) => {
    const PieComponent = Pie as any; 
    return <PieComponent {...props} />;
}
// ------------------------------------------------------------------

const Analytics: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [regionData, setRegionData] = useState<RechartsChartData[]>([]); 
    const [trendData, setTrendData] = useState<RechartsChartData[]>([]);
    
    const [activeIndex, setActiveIndex] = useState(-1);

    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    
    const chartTextColor = isDarkMode ? '#e5e7eb' : '#334155';
    const chartGridColor = isDarkMode ? '#4b5563' : '#e2e8f0';
    const chartAxisStroke = isDarkMode ? '#6b7280' : '#94a3b8';

    const COLORS = ['#6d28d9', '#d946ef', '#0f172a', '#94a3b8', '#cbd5e1'];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [regions, trends] = await Promise.all([
                    api.analytics.getRegionDistribution(),
                    api.analytics.getDemandTrends()
                ]);
                setRegionData(regions as RechartsChartData[]);
                setTrendData(trends as RechartsChartData[]);
            } catch (e) {
                console.error("Error loading analytics", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const onPieEnter = useCallback((_: any, index: number) => {
        setActiveIndex(index);
    }, []);

    const onPieLeave = useCallback(() => {
        setActiveIndex(-1);
    }, []);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-gray-500">
                <Loader2 className="animate-spin mr-2" /> Генерация отчетов...
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-fade-in transition-colors duration-300">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Аналитика рынка</h1>
                <p className="text-slate-500 dark:text-gray-400 mt-1">Прогнозы и распределение спроса</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Region Chart */}
                <div className="bg-white dark:bg-gray-800 
                                p-6 rounded-xl shadow-sm dark:shadow-none 
                                border border-slate-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Спрос по регионам (%)</h3>
                    <div className="h-80 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                {/* ИСПОЛЬЗУЕМ ОБЕРТКУ ВМЕСТО <Pie> */}
                                <PieWrapper
                                    data={regionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    
                                    activeIndex={activeIndex} 
                                    activeShape={renderActiveShape} 
                                    onMouseEnter={onPieEnter}
                                    onMouseLeave={onPieLeave}
                                >
                                    {regionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </PieWrapper>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center space-x-4 mt-4">
                        {regionData.map((entry, index) => (
                            <div key={index} className="flex items-center text-xs text-slate-600 dark:text-gray-300">
                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                {entry.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Forecast Chart */}
                <div className="bg-white dark:bg-gray-800 
                                p-6 rounded-xl shadow-sm dark:shadow-none 
                                border border-slate-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Прогноз объемов (Тонны)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={trendData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                                
                                <XAxis 
                                    dataKey="name" 
                                    stroke={chartAxisStroke} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    fontSize={12} 
                                    tick={{ fill: chartTextColor }}
                                />
                                <YAxis 
                                    stroke={chartAxisStroke} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    fontSize={12} 
                                    tick={{ fill: chartTextColor }}
                                />
                                
                                <Tooltip 
                                    cursor={{fill: isDarkMode ? '#374151' : '#e5e7eb'}} 
                                    content={<CustomTooltip />}
                                />
                                <Bar dataKey="value" fill="#d946ef" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
import React, { useMemo } from 'react';
import { DailyExpense, FutureExpense, Category, CycleProfile } from '../types';

interface DashboardNotificationsProps {
  allDailyExpenses: { [cycleId: string]: { [date: string]: DailyExpense[] } };
  allFutureExpenses: { [cycleId:string]: FutureExpense[] };
  categories: Category[];
  cycleProfiles: CycleProfile[];
}

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    const days = Math.floor(interval);
    if (days > 1) return `hace ${days} días`;
    if (days === 1) return 'ayer';
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
    return 'justo ahora';
};

export const DashboardNotifications: React.FC<DashboardNotificationsProps> = ({ 
    allDailyExpenses, 
    allFutureExpenses, 
    categories,
    cycleProfiles
}) => {
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

    const recentActivity = useMemo(() => {
        const flatExpenses = Object.entries(allDailyExpenses).flatMap(([cycleId, dates]) => {
            const cycle = cycleProfiles.find(p => p.id === cycleId);
            return Object.entries(dates).flatMap(([dateStr, expenses]) => 
                expenses.map(exp => ({
                    ...exp,
                    date: new Date(`${dateStr}T12:00:00`), // Assume noon to avoid timezone issues
                    cycleName: cycle?.name || 'Calendario'
                }))
            );
        });

        return flatExpenses
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 5);
    }, [allDailyExpenses, cycleProfiles]);

    const upcomingExpenses = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);
        threeDaysFromNow.setHours(23, 59, 59, 999);

        const flatFutureExpenses = Object.values(allFutureExpenses).reduce<FutureExpense[]>((acc, val) => acc.concat(val as FutureExpense[]), []);
        
        const allUpcoming: (FutureExpense & { date: Date })[] = [];

        for (const fe of flatFutureExpenses) {
            let currentDate = new Date(`${fe.startDate}T00:00:00`);
            const feEndDate = fe.endDate ? new Date(fe.endDate) : null;

            if (currentDate > threeDaysFromNow) continue;
            
            while ((!feEndDate || currentDate <= feEndDate) && currentDate <= threeDaysFromNow) {
                if (currentDate >= today) {
                    allUpcoming.push({ ...fe, date: new Date(currentDate) });
                }
                
                if (fe.frequency === 'una-vez') break;
                
                const lastDate = new Date(currentDate);
                switch(fe.frequency) {
                    case 'semanal': currentDate.setDate(currentDate.getDate() + 7); break;
                    case 'quincenal': currentDate.setDate(currentDate.getDate() + 14); break;
                    case 'mensual': currentDate.setMonth(currentDate.getMonth() + 1); break;
                    case 'anual': currentDate.setFullYear(currentDate.getFullYear() + 1); break;
                }
                if (currentDate <= lastDate) break;
            }
        }
        
        return allUpcoming
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 3);

    }, [allFutureExpenses]);

    const nextPlannedExpense = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = Object.values(allFutureExpenses).reduce<FutureExpense[]>((acc, val) => acc.concat(val as FutureExpense[]), []).flatMap(fe => {
            const occurrences = [];
            let currentDate = new Date(`${fe.startDate}T00:00:00`);
            const feEndDate = fe.endDate ? new Date(fe.endDate) : null;

            while (!feEndDate || currentDate <= feEndDate) {
                if (currentDate >= today) {
                    occurrences.push({ ...fe, date: new Date(currentDate) });
                    // Only need the first upcoming one for each future expense
                    break; 
                }
                if (fe.frequency === 'una-vez') break;
                 switch(fe.frequency) {
                    case 'semanal': currentDate.setDate(currentDate.getDate() + 7); break;
                    case 'quincenal': currentDate.setDate(currentDate.getDate() + 14); break;
                    case 'mensual': currentDate.setMonth(currentDate.getMonth() + 1); break;
                    case 'anual': currentDate.setFullYear(currentDate.getFullYear() + 1); break;
                }
            }
            return occurrences;
        });

        return upcoming.sort((a, b) => a.date.getTime() - b.date.getTime())[0] || null;

    }, [allFutureExpenses]);

    return (
        <div className="bg-neutral-800 p-6 rounded-3xl shadow-lg space-y-4 self-start">
            <h2 className="text-2xl font-bold text-neutral-100 border-b border-neutral-700 pb-3">Actividad Reciente</h2>

            {upcomingExpenses.length > 0 && (
                <div className="bg-amber-900/50 border border-amber-700 p-3 rounded-lg flex items-start gap-3">
                    <i className="fa-solid fa-bell text-amber-400 mt-1"></i>
                    <div>
                        <p className="text-sm font-semibold text-amber-300">Próximos Vencimientos (3 días)</p>
                        <div className="space-y-1 mt-1">
                            {upcomingExpenses.map(exp => {
                                const today = new Date();
                                today.setHours(0,0,0,0);
                                const daysUntil = Math.ceil((exp.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                let dueText = `Vence en ${daysUntil} días`;
                                if (daysUntil === 1) dueText = 'Vence mañana';
                                if (daysUntil <= 0) dueText = 'Vence hoy';

                                return (
                                    <div key={`${exp.id}-${exp.date.toISOString()}`}>
                                        <p className="font-bold text-neutral-100 text-sm">{exp.note} - ${exp.amount.toFixed(2)}</p>
                                        <p className="text-xs text-amber-400">{dueText} - {exp.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            
            {nextPlannedExpense && (
                <div className="bg-blue-900/50 p-3 rounded-lg flex items-start gap-3">
                    <i className="fa-solid fa-flag text-blue-400 mt-1"></i>
                    <div>
                        <p className="text-sm font-semibold text-blue-300">Próximo Gasto Planificado</p>
                        <p className="font-bold text-neutral-100">{nextPlannedExpense.note} - ${nextPlannedExpense.amount.toFixed(2)}</p>
                        <p className="text-xs text-blue-400">{nextPlannedExpense.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                </div>
            )}

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {recentActivity.length > 0 ? (
                    recentActivity.map(exp => {
                        const category = categoryMap.get(exp.categoryId);
                        return (
                            <div key={exp.id} className="flex items-center gap-4 p-3 bg-neutral-700/50 rounded-lg">
                                <div className="flex-shrink-0">
                                    {category ? (
                                        <i className={`${category.icon} fa-fw text-xl`} style={{ color: category.color }}></i>
                                    ) : (
                                        <i className="fa-solid fa-question-circle fa-fw text-xl text-neutral-500"></i>
                                    )}
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-neutral-200">{exp.note || category?.name}</p>
                                    <p className="text-xs text-neutral-400">
                                        {timeAgo(exp.date)} &bull; {exp.cycleName}
                                    </p>
                                </div>
                                <div className="font-bold text-red-400 text-lg">
                                    -${exp.amount.toFixed(2)}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-center text-neutral-500 py-4">No hay gastos recientes. ¡Añade uno en la pestaña de Gastos!</p>
                )}
            </div>
        </div>
    );
};
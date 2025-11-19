import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DailyExpense, Category, PayCycleConfig, FutureExpense, BudgetRecord, CycleProfile } from '../types';
import { CycleSettingsModal } from './CycleSettingsModal';
import { FutureExpenseModal } from './FutureExpenseModal';
import { CustomSelect } from './CustomSelect';
import { CurrentCycleBudgetView } from './CurrentCycleBudgetView';

interface DailyExpenseViewProps {
  expenses: { [date: string]: DailyExpense[] };
  setExpenses: React.Dispatch<React.SetStateAction<{ [date: string]: DailyExpense[] }>>;
  categories: Category[];
  onForceCreateBudget: () => void;
  futureExpenses: FutureExpense[];
  setFutureExpenses: React.Dispatch<React.SetStateAction<FutureExpense[]>>;
  currentCycleBudget: BudgetRecord | null;
  cycleProfiles: CycleProfile[];
  setCycleProfiles: React.Dispatch<React.SetStateAction<CycleProfile[]>>;
  activeCycleId: string | null;
  setActiveCycleId: (id: string | null) => void;
  pendingAction: string | null;
  onActionHandled: () => void;
}

type SubTab = 'calendar' | 'planned';

const toISODateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CycleManager: React.FC<{
    profiles: CycleProfile[],
    activeId: string | null,
    onSelect: (id: string) => void,
    onManage: () => void,
}> = ({ profiles, activeId, onSelect, onManage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const activeProfile = profiles.find(p => p.id === activeId);
    const managerRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (managerRef.current && !managerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (id: string) => {
        onSelect(id);
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={managerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 bg-gray-100 dark:bg-neutral-700 p-2 rounded-lg w-full text-left"
            >
                {activeProfile ? (
                    <>
                        <span className="w-3 h-3 rounded-full" style={{backgroundColor: activeProfile.color}}></span>
                        <span className="font-bold text-gray-900 dark:text-neutral-100 flex-grow">{activeProfile.name}</span>
                    </>
                ) : (
                    <span className="font-bold text-gray-600 dark:text-neutral-300 flex-grow">Seleccionar Calendario</span>
                )}
                 <i className={`fa-solid fa-chevron-down text-sm text-gray-500 dark:text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isOpen && (
                 <div className="absolute top-full mt-2 w-full bg-white dark:bg-neutral-800 rounded-lg shadow-lg z-10 p-2 border border-gray-200 dark:border-neutral-700">
                    <ul className="space-y-1">
                        {profiles.map(profile => (
                            <li key={profile.id}>
                                <button onClick={() => handleSelect(profile.id)} className={`w-full text-left p-2 rounded-md flex items-center gap-3 ${activeId === profile.id ? 'bg-blue-600 text-white' : 'active:bg-gray-100 dark:active:bg-neutral-700 text-gray-800 dark:text-neutral-200'}`}>
                                    <span className="w-3 h-3 rounded-full" style={{backgroundColor: profile.color}}></span>
                                    <span>{profile.name}</span>
                                </button>
                            </li>
                        ))}
                         <li>
                            <button onClick={onManage} className="w-full text-left p-2 rounded-md active:bg-gray-100 dark:active:bg-neutral-700 text-blue-500 dark:text-blue-400 font-semibold mt-1 border-t border-gray-200 dark:border-neutral-700">
                                <i className="fa-solid fa-cog mr-2"></i>
                                Gestionar Calendarios
                            </button>
                        </li>
                    </ul>
                 </div>
            )}
        </div>
    )
}


export const DailyExpenseView: React.FC<DailyExpenseViewProps> = ({
  expenses,
  setExpenses,
  categories,
  onForceCreateBudget,
  futureExpenses,
  setFutureExpenses,
  currentCycleBudget,
  cycleProfiles,
  setCycleProfiles,
  activeCycleId,
  setActiveCycleId,
  pendingAction,
  onActionHandled
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isFutureExpenseModalOpen, setIsFutureExpenseModalOpen] = useState(false);
  const [editingFutureExpense, setEditingFutureExpense] = useState<FutureExpense | null>(null);
  const [isCycleBudgetModalOpen, setIsCycleBudgetModalOpen] = useState(false);

  const [deletingCycleProfile, setDeletingCycleProfile] = useState<CycleProfile | null>(null);
  const [expandedInCycleModalId, setExpandedInCycleModalId] = useState<string | null>(null);

  // New expense form state
  const [newExpenseNote, setNewExpenseNote] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategoryId, setNewExpenseCategoryId] = useState<string>(categories[0]?.id || '');

  const firstDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), [currentDate]);
  const daysInMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(), [currentDate]);

  const categoryMap = useMemo(() => 
    new Map(categories.map(cat => [cat.id, cat])),
  [categories]);
  
  const categoryOptions = useMemo(() => categories.map(cat => ({
    value: cat.id,
    label: cat.name,
  })), [categories]);

  const payCycleConfig = useMemo(() => cycleProfiles.find(p => p.id === activeCycleId)?.config || null, [cycleProfiles, activeCycleId]);

    useEffect(() => {
        if (!pendingAction) return;

        if (pendingAction === 'add_cycle') {
            setIsCycleModalOpen(true);
        } else if (pendingAction === 'add_daily_expense') {
            setCurrentDate(new Date()); // Ensure calendar is on current month
            // Use timeout to allow state to update before opening modal
            setTimeout(() => openExpenseModal(new Date().getDate()), 0);
        } else if (pendingAction === 'add_future_expense') {
            setActiveSubTab('planned');
            handleOpenFutureExpenseModal(null);
        }

        onActionHandled();
    }, [pendingAction, onActionHandled]);

  const payDaysInMonth = useMemo(() => {
    if (!payCycleConfig) return new Set();
    
    const days = new Set<string>();
    let payDate = new Date(`${payCycleConfig.startDate}T00:00:00`);
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const endDate = new Date(year, month + 1, 0);

    // Find first relevant payday
    while (payDate < new Date(year, month, 1)) {
        switch(payCycleConfig.frequency) {
            case 'semanal': payDate.setDate(payDate.getDate() + 7); break;
            case 'quincenal': payDate.setDate(payDate.getDate() + 14); break;
            case 'mensual': payDate.setMonth(payDate.getMonth() + 1); break;
            case 'anual': payDate.setFullYear(payDate.getFullYear() + 1); break;
        }
    }

    while (payDate <= endDate) {
        if(payDate.getMonth() === month) {
            days.add(toISODateString(payDate));
        }
        switch(payCycleConfig.frequency) {
            case 'semanal': payDate.setDate(payDate.getDate() + 7); break;
            case 'quincenal': payDate.setDate(payDate.getDate() + 14); break;
            case 'mensual': payDate.setMonth(payDate.getMonth() + 1); break;
            case 'anual': payDate.setFullYear(payDate.getFullYear() + 1); break;
        }
    }
    return days;
  }, [payCycleConfig, currentDate]);

  const plannedExpensesInMonth = useMemo(() => {
    const monthMap = new Map<string, FutureExpense[]>();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStartDate = new Date(year, month, 1);
    const monthEndDate = new Date(year, month + 1, 0);

    for (const fe of futureExpenses) {
        let occurrenceDate = new Date(`${fe.startDate}T00:00:00`);
        const feEndDate = fe.endDate ? new Date(fe.endDate) : null;
        
        while(occurrenceDate <= monthEndDate && (!feEndDate || occurrenceDate <= feEndDate)) {
             if (occurrenceDate >= monthStartDate) {
                const dateKey = toISODateString(occurrenceDate);
                const dayExpenses = monthMap.get(dateKey) || [];
                monthMap.set(dateKey, [...dayExpenses, fe]);
             }
             if (fe.frequency === 'una-vez') break;
             switch(fe.frequency) {
                case 'semanal': occurrenceDate.setDate(occurrenceDate.getDate() + 7); break;
                case 'quincenal': occurrenceDate.setDate(occurrenceDate.getDate() + 14); break;
                case 'mensual': occurrenceDate.setMonth(occurrenceDate.getMonth() + 1); break;
                case 'anual': occurrenceDate.setFullYear(occurrenceDate.getFullYear() + 1); break;
             }
        }
    }
    return monthMap;

  }, [futureExpenses, currentDate]);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const openExpenseModal = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setIsExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setSelectedDate(null);
    setNewExpenseNote('');
    setNewExpenseAmount('');
    setNewExpenseCategoryId(categories[0]?.id || '');
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !newExpenseCategoryId || !newExpenseAmount) return;

    const amount = parseFloat(newExpenseAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Por favor, introduce un importe válido.");
      return;
    }

    const dateKey = toISODateString(selectedDate);
    const newExpense: DailyExpense = {
      id: Date.now().toString(),
      note: newExpenseNote.trim(),
      amount,
      categoryId: newExpenseCategoryId,
    };

    setExpenses(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newExpense],
    }));

    setNewExpenseNote('');
    setNewExpenseAmount('');
  };

  const handleDeleteExpense = (date: Date, expenseId: string) => {
    const dateKey = toISODateString(date);
    setExpenses(prev => {
      const updatedDayExpenses = (prev[dateKey] || []).filter(exp => exp.id !== expenseId);
      const newExpenses = { ...prev };
      if (updatedDayExpenses.length > 0) {
        newExpenses[dateKey] = updatedDayExpenses;
      } else {
        delete newExpenses[dateKey];
      }
      return newExpenses;
    });
  };

  const handleOpenFutureExpenseModal = (expense: FutureExpense | null = null) => {
    setEditingFutureExpense(expense);
    setIsFutureExpenseModalOpen(true);
  }

  const handleDeleteFutureExpense = (id: string) => {
    if (window.confirm("¿Seguro que quieres eliminar este gasto planificado?")) {
        setFutureExpenses(prev => prev.filter(exp => exp.id !== id));
    }
  }

  const handleInitiateDeleteCycle = (profileId: string) => {
    const profileToDelete = cycleProfiles.find(p => p.id === profileId);
    if (profileToDelete) {
      setDeletingCycleProfile(profileToDelete);
      setIsCycleModalOpen(false); // Close the settings modal as requested
    }
  };

  const handleCancelDeleteCycle = () => {
    setDeletingCycleProfile(null);
  };

  const handleConfirmDeleteCycle = () => {
    if (!deletingCycleProfile) return;
    
    const remainingProfiles = cycleProfiles.filter(p => p.id !== deletingCycleProfile.id);
    setCycleProfiles(remainingProfiles);

    // If active cycle was the one deleted, select another one.
    if (activeCycleId === deletingCycleProfile.id) {
        setActiveCycleId(remainingProfiles.length > 0 ? remainingProfiles[0].id : null);
    }

    setDeletingCycleProfile(null);
  };

  const renderCalendar = () => {
    const calendarDays = [];
    const startingDay = firstDayOfMonth.getDay();
    for (let i = 0; i < startingDay; i++) {
      calendarDays.push(<div key={`blank-${i}`} className="border-r border-b border-gray-200 dark:border-neutral-700"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = toISODateString(date);
      const dayExpenses = expenses[dateKey] || [];
      const dayPlannedExpenses = plannedExpensesInMonth.get(dateKey) || [];
      const totalDayExpense = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const isToday = toISODateString(new Date()) === dateKey;
      const isPayDay = payDaysInMonth.has(dateKey);

      calendarDays.push(
        <div
            key={day} 
            className="border-r border-b border-gray-200 dark:border-neutral-700 p-1.5 flex flex-col cursor-pointer active:bg-blue-100 dark:active:bg-blue-900/50 transition-colors relative aspect-square"
            onClick={() => openExpenseModal(day)}
        >
          <div className="flex justify-between items-start">
             <span className={`font-bold text-sm ${isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-800 dark:text-neutral-200'}`}>{day}</span>
             <div className="flex flex-col items-end space-y-1">
                {isPayDay && <i className="fa-solid fa-dollar-sign text-green-500 text-xs" title="Día de pago"></i>}
                 {dayPlannedExpenses.length > 0 && (
                    <div className="flex items-center space-x-1">
                        {dayPlannedExpenses.slice(0, 3).map(pExp => {
                             const category = categoryMap.get(pExp.categoryId);
                             return <i key={pExp.id} className="fa-solid fa-flag text-xs" style={{ color: category?.color || '#9ca3af' }} title={`Planificado: ${pExp.note} ($${pExp.amount})`}></i>
                        })}
                    </div>
                )}
             </div>
          </div>
          {totalDayExpense > 0 && (
            <span className="text-xs text-red-500 font-semibold mt-auto self-end">
                -${totalDayExpense.toFixed(2)}
            </span>
          )}
        </div>
      );
    }
    return calendarDays;
  };

  const renderPlannedExpenses = () => {
    const sortedFutureExpenses = [...futureExpenses].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    return (
        <div className="space-y-4">
            <button onClick={() => handleOpenFutureExpenseModal(null)} className="w-full sm:w-auto bg-blue-600 active:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-plus mr-2"></i>Añadir Gasto Planificado
            </button>
            {sortedFutureExpenses.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-neutral-400 py-8">No tienes gastos planificados.</p>
            ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {sortedFutureExpenses.map(exp => {
                        const category = categoryMap.get(exp.categoryId);
                        return (
                            <div key={exp.id} className="bg-gray-100 dark:bg-neutral-700 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-neutral-200">{exp.note}</p>
                                    <p className="text-sm text-gray-700 dark:text-neutral-300">
                                        {category?.name} &bull; ${exp.amount.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-neutral-400 capitalize">
                                        {exp.frequency.replace('-', ' ')} &bull; Inicia: {new Date(`${exp.startDate}T00:00:00`).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleOpenFutureExpenseModal(exp)} className="p-2 w-8 h-8 rounded-lg active:bg-gray-200 dark:active:bg-neutral-600 text-blue-500 dark:text-blue-400"><i className="fa-solid fa-pencil"></i></button>
                                    <button onClick={() => handleDeleteFutureExpense(exp.id)} className="p-2 w-8 h-8 rounded-lg active:bg-gray-200 dark:active:bg-neutral-600 text-red-500 dark:text-red-400"><i className="fa-solid fa-trash-can"></i></button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
  }
  
  const selectedDateExpenses = selectedDate ? expenses[toISODateString(selectedDate)] || [] : [];
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const tabButtonClasses = (tabName: SubTab) =>
    `px-4 py-2 font-semibold rounded-lg transition-colors ${
        activeSubTab === tabName
        ? 'bg-blue-500 text-white'
        : 'bg-transparent text-gray-600 dark:text-neutral-300 active:bg-gray-200 dark:active:bg-neutral-700'
    }`;


  return (
    <>
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl shadow-lg">
        <div className="border-b pb-4 border-gray-200 dark:border-neutral-700 mb-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Rastreador de Gastos</h2>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsCycleBudgetModalOpen(true)} 
                        disabled={!currentCycleBudget}
                        className="text-sm bg-teal-600 active:bg-teal-700 text-white font-semibold py-2 px-3 rounded-lg disabled:bg-gray-400 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed transition-colors"
                        title={!currentCycleBudget ? "Configura un ciclo de pago para ver el presupuesto" : "Ver presupuesto del ciclo actual"}
                    >
                        <i className="fa-solid fa-chart-pie mr-2"></i>Ver Presupuesto
                    </button>
                    <button 
                        onClick={onForceCreateBudget} 
                        disabled={!payCycleConfig}
                        className="text-sm bg-blue-600 active:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg disabled:bg-gray-400 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed transition-colors"
                        title={!payCycleConfig ? "Configura un ciclo de pago para usar esta función" : "Crear presupuesto con los gastos hasta hoy"}
                    >
                        <i className="fa-solid fa-bolt mr-2"></i>Crear Presupuesto
                    </button>
                </div>
            </div>
            <div className="mt-4 max-w-sm">
                <CycleManager 
                    profiles={cycleProfiles}
                    activeId={activeCycleId}
                    onSelect={setActiveCycleId}
                    onManage={() => setIsCycleModalOpen(true)}
                />
            </div>
        </div>

        {activeCycleId && !payCycleConfig && (
            <div className="bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg my-6 flex items-start gap-4 animate-fade-in-scale">
                <i className="fa-solid fa-triangle-exclamation text-xl mt-1 text-yellow-500 dark:text-yellow-400"></i>
                <div>
                    <h3 className="font-bold text-base text-yellow-900 dark:text-yellow-100">¡Configura tu ciclo de pagos!</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                        Añade tus ingresos y la frecuencia de tus pagos para activar el presupuesto en tiempo real y la creación automática de resúmenes.
                    </p>
                    <button
                        onClick={() => {
                            setIsCycleModalOpen(true);
                            setExpandedInCycleModalId(activeCycleId);
                        }}
                        className="bg-yellow-500 text-yellow-950 font-bold text-sm py-1.5 px-3 rounded-md hover:bg-yellow-400 transition-colors"
                    >
                        Configurar Ciclo
                    </button>
                </div>
            </div>
        )}

        <div className="mb-6 flex space-x-2 p-1 bg-gray-100 dark:bg-neutral-900/50 rounded-xl self-start">
            <button onClick={() => setActiveSubTab('calendar')} className={tabButtonClasses('calendar')}>
                <i className="fa-solid fa-calendar-alt mr-2"></i>Calendario
            </button>
            <button onClick={() => setActiveSubTab('planned')} className={tabButtonClasses('planned')}>
                <i className="fa-solid fa-clock-rotate-left mr-2"></i>Planificados
            </button>
        </div>
        
        {activeCycleId ? (
            activeSubTab === 'calendar' ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full text-gray-600 dark:text-neutral-300 active:bg-gray-200 dark:active:bg-neutral-700"><i className="fa-solid fa-chevron-left"></i></button>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-100">{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h3>
                    <button onClick={handleNextMonth} className="p-2 rounded-full text-gray-600 dark:text-neutral-300 active:bg-gray-200 dark:active:bg-neutral-700"><i className="fa-solid fa-chevron-right"></i></button>
                    </div>

                    <div className="grid grid-cols-7 border-t border-l border-gray-200 dark:border-neutral-700 select-none">
                    {weekDays.map(day => (
                        <div key={day} className="text-center font-bold p-2 border-r border-b border-gray-200 dark:border-neutral-700 text-sm text-gray-500 dark:text-neutral-400">{day}</div>
                    ))}
                    {renderCalendar()}
                    </div>
                </>
            ) : (
                renderPlannedExpenses()
            )
        ) : (
            <div className="text-center py-12">
                <p className="text-gray-500 dark:text-neutral-400">Por favor, crea o selecciona un calendario para empezar.</p>
            </div>
        )}

      </div>

      {/* Expense Modal */}
      {isExpenseModalOpen && selectedDate && (() => {
        const selectedDateKey = toISODateString(selectedDate);
        const plannedForDay = plannedExpensesInMonth.get(selectedDateKey) || [];

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={closeExpenseModal}>
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-6 w-full max-w-md transform transition-all animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-neutral-100">Gastos del {selectedDate.toLocaleDateString('es-ES')}</h3>
                    
                    {plannedForDay.length > 0 && (
                        <div className="mb-4 border-b border-gray-200 dark:border-neutral-700 pb-4">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-flag text-blue-500 dark:text-blue-400"></i>
                                Gastos Planificados
                            </h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                {plannedForDay.map(pExp => {
                                    const category = categoryMap.get(pExp.categoryId);
                                    return (
                                        <div key={pExp.id} className="flex justify-between items-center bg-gray-100 dark:bg-neutral-700/50 p-2 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                {category && <i className={`${category.icon} fa-fw`} style={{ color: category.color }}></i>}
                                                <span className="text-sm text-gray-800 dark:text-neutral-200">{pExp.note}</span>
                                            </div>
                                            <span className="font-semibold text-sm text-gray-900 dark:text-neutral-100">${pExp.amount.toFixed(2)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-cash-register text-green-500 dark:text-green-400"></i>
                        Gastos Registrados
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto mb-4 pr-2">
                        {selectedDateExpenses.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-neutral-400">No hay gastos para este día.</p>
                        ) : (
                            selectedDateExpenses.map(exp => {
                                const category = categoryMap.get(exp.categoryId);
                                return (
                                    <div key={exp.id} className="flex justify-between items-center bg-gray-100 dark:bg-neutral-700 p-2 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {category && <i className={`${category.icon} fa-fw`} style={{ color: category.color }}></i>}
                                            <span className="text-gray-800 dark:text-neutral-200">{exp.note || category?.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-semibold text-gray-900 dark:text-neutral-100">${exp.amount.toFixed(2)}</span>
                                            <button onClick={() => handleDeleteExpense(selectedDate, exp.id)} className="text-red-500 active:text-red-700 w-6 h-6 rounded flex items-center justify-center"><i className="fa-solid fa-trash-can text-xs"></i></button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <form onSubmit={handleAddExpense} className="space-y-3 border-t border-gray-200 dark:border-neutral-700 pt-4">
                        <CustomSelect
                            options={categoryOptions}
                            value={newExpenseCategoryId}
                            onChange={setNewExpenseCategoryId}
                            className="[&>button]:p-2 [&>button]:text-base [&>button]:font-normal"
                        />
                        <input type="text" value={newExpenseNote} onChange={e => setNewExpenseNote(e.target.value)} placeholder="Nota (ej. Café)" className="w-full p-2 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-600 rounded-lg" />
                        <input type="number" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} placeholder="Importe" className="w-full p-2 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-600 rounded-lg" min="0.01" step="0.01" required />
                        <button type="submit" className="w-full bg-blue-600 active:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Añadir Gasto</button>
                    </form>
                </div>
            </div>
        )
      })()}

      {/* Other Modals */}
       <CycleSettingsModal
        isOpen={isCycleModalOpen}
        onClose={() => setIsCycleModalOpen(false)}
        profiles={cycleProfiles}
        setProfiles={setCycleProfiles}
        setActiveId={setActiveCycleId}
        onInitiateDelete={handleInitiateDeleteCycle}
        initialExpandedId={expandedInCycleModalId}
        onExpandedChange={setExpandedInCycleModalId}
      />
      <FutureExpenseModal 
        isOpen={isFutureExpenseModalOpen}
        onClose={() => setIsFutureExpenseModalOpen(false)}
        expense={editingFutureExpense}
        setFutureExpenses={setFutureExpenses}
        categories={categories}
      />
      <CurrentCycleBudgetView
        isOpen={isCycleBudgetModalOpen}
        onClose={() => setIsCycleBudgetModalOpen(false)}
        budget={currentCycleBudget}
      />

       {/* Delete Cycle Confirmation Modal */}
        {deletingCycleProfile && (
            <div
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 p-4"
                onClick={handleCancelDeleteCycle}
                aria-modal="true"
                role="dialog"
            >
                <div
                    className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 w-full max-w-md m-4 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale text-center"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
                        <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500 dark:text-red-400"></i>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-neutral-100">Eliminar Calendario</h2>
                    <p className="text-gray-600 dark:text-neutral-300 mb-6">
                        ¿Seguro que quieres eliminar el calendario <strong className="text-gray-800 dark:text-neutral-100">"{deletingCycleProfile.name}"</strong>?
                        <br/>
                        Todos los gastos diarios y planificados asociados a él serán borrados permanentemente. Esta acción no se puede deshacer.
                    </p>
                    <div className="mt-8 flex justify-center space-x-4">
                    <button
                        onClick={handleCancelDeleteCycle}
                        className="px-6 py-2.5 rounded-lg bg-gray-200 text-gray-800 dark:bg-neutral-600 dark:text-neutral-200 active:bg-gray-300 dark:active:bg-neutral-500 font-semibold transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirmDeleteCycle}
                        className="px-8 py-2.5 rounded-lg bg-red-600 active:bg-red-700 text-white font-bold transition-colors shadow-lg shadow-red-500/20"
                        autoFocus
                    >
                        Sí, Eliminar
                    </button>
                    </div>
                </div>
                <style>{`
                    @keyframes fade-in-scale {
                      from { opacity: 0; transform: scale(0.95); }
                      to { opacity: 1; transform: scale(1); }
                    }
                    .animate-fade-in-scale {
                      animation: fade-in-scale 0.2s ease-out forwards;
                    }
                `}</style>
            </div>
        )}
    <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.3s ease-out forwards;
        }
    `}</style>
    </>
  );
};
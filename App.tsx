import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Category, BudgetRecord, DailyExpense, PayCycleConfig, FutureExpense, PayCycleFrequency, CycleProfile } from './types';
import { INITIAL_CATEGORIES } from './constants';
import { BudgetChart } from './components/BudgetChart';
import { Header } from './components/Header';
import { GlobalSavingsCard } from './components/GlobalSavingsCard';
import { HistoryView } from './components/HistoryView';
import { BottomNav } from './components/BottomNav';
import { HistoryPanel } from './components/HistoryPanel';
import { BudgetEditorModal } from './components/EditBudgetModal';
import { SideMenu } from './components/SideMenu';
import { DailyExpenseView } from './components/DailyExpenseView';
import { ForceCreateBudgetModal } from './components/ForceCreateBudgetModal';
import { CalculatorsView } from './components/CalculatorsView';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { DashboardNotifications } from './components/DashboardNotifications';

type ActiveTab = 'dashboard' | 'history' | 'expenses' | 'calculators';

interface CurrentPeriodSpendingProps {
  spentByCategory: { category: Category; amount: number }[];
  periodStartDate: Date | null;
  periodEndDate: Date | null;
}

const FabAction = ({ buttonProps, label, icon }: { buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement>, label: string, icon: string }) => (
    <div className="flex items-center gap-3 w-max justify-end">
        <span className="bg-neutral-700 text-neutral-200 text-xs font-semibold px-3 py-1 rounded-md shadow-md">
            {label}
        </span>
        <button 
            {...buttonProps}
            className="bg-neutral-200 text-neutral-800 w-10 h-10 rounded-full flex items-center justify-center shadow-md active:bg-neutral-300"
            aria-label={label}
        >
            <i className={`fa-solid ${icon}`}></i>
        </button>
    </div>
);


const CurrentPeriodSpending: React.FC<CurrentPeriodSpendingProps> = ({
  spentByCategory,
  periodStartDate,
  periodEndDate,
}) => {
  if (!periodStartDate || !periodEndDate) {
    return (
      <div className="bg-neutral-800 p-6 rounded-3xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-neutral-100 mb-2">Gastos del Período</h2>
        <p className="text-neutral-400 text-sm">
          Configura un <i className="fa-solid fa-cog mx-1"></i><strong>Ciclo de Pago</strong> en la pestaña de Gastos para ver un resumen de tus gastos actuales aquí.
        </p>
      </div>
    );
  }

  const totalSpent = spentByCategory.reduce((sum, item) => sum + item.amount, 0);
  const formattedStartDate = periodStartDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const formattedEndDate = periodEndDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  return (
    <div className="bg-neutral-800 p-6 rounded-3xl shadow-lg space-y-4 self-start">
      <div className="border-b border-neutral-700 pb-3 mb-3">
        <h2 className="text-2xl font-bold text-neutral-100">Gastos del Período Actual</h2>
        <p className="text-sm text-neutral-400">{formattedStartDate} - {formattedEndDate}</p>
      </div>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {spentByCategory.length > 0 ? (
          spentByCategory.map(({ category, amount }) => (
            <div key={category.id} className="flex justify-between items-center bg-neutral-700/50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <i className={`${category.icon} fa-fw text-lg`} style={{ color: category.color }}></i>
                <span className="font-semibold text-neutral-200">{category.name}</span>
              </div>
              <span className="font-bold text-lg text-red-400">-${amount.toFixed(2)}</span>
            </div>
          ))
        ) : (
          <p className="text-center text-neutral-500 py-4">No hay gastos registrados en este período.</p>
        )}
      </div>

      <div className="border-t border-neutral-700 pt-3 mt-3 flex justify-between items-center">
        <span className="font-bold text-neutral-100 text-lg">Total Gastado</span>
        <span className="font-extrabold text-2xl text-red-400">-${totalSpent.toFixed(2)}</span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // State for tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isFabVisible, setIsFabVisible] = useState(true);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  
  // State for menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // State for budgets and UI
  const [savedBudgets, setSavedBudgets] = useState<BudgetRecord[]>(() => {
    try {
      const item = window.localStorage.getItem('financial-organizer-budgets');
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error("Failed to parse budgets from localStorage", error);
      return [];
    }
  });

  const [activeBudgetId, setActiveBudgetId] = useState<string | null>(() => {
     try {
      const item = window.localStorage.getItem('financial-organizer-budgets');
      const budgets = item ? JSON.parse(item) : [];
      if (budgets.length > 0) {
        const sorted = [...budgets].sort((a, b) => new Date(b.dateSaved).getTime() - new Date(a.dateSaved).getTime());
        return sorted[0].id;
      }
      return null;
    } catch (error) {
      console.error("Failed to parse budgets from localStorage for initial ID", error);
      return null;
    }
  });

  const [globalSavings, setGlobalSavings] = useState<number>(() => {
     try {
      const item = window.localStorage.getItem('financial-organizer-global-savings');
      return item ? JSON.parse(item) : 0;
    } catch (error) {
      console.error("Failed to parse global savings from localStorage", error);
      return 0;
    }
  });

  const [cycleProfiles, setCycleProfiles] = useState<CycleProfile[]>([]);
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null);
  const [allDailyExpenses, setAllDailyExpenses] = useState<{ [cycleId: string]: { [date: string]: DailyExpense[] } }>({});
  const [allFutureExpenses, setAllFutureExpenses] = useState<{ [cycleId: string]: FutureExpense[] }>({});
    
  const [lastCycleCheckDate, setLastCycleCheckDate] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem('financial-organizer-last-cycle-check');
    } catch {
      return null;
    }
  });

  // State for the "live" budget based on the current pay cycle
  const [currentCycleBudget, setCurrentCycleBudget] = useState<BudgetRecord | null>(null);

  // State for modals
  const [editingBudget, setEditingBudget] = useState<BudgetRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isForceCreateModalOpen, setIsForceCreateModalOpen] = useState(false);
  const [forceCreateInfo, setForceCreateInfo] = useState<{ startDate: Date, endDate: Date } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetRecord | null>(null);

  // Scroll effect for FAB
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsFabVisible(false); // Hide on scroll down
        setIsFabMenuOpen(false); // Also close menu
      } else {
        setIsFabVisible(true); // Show on scroll up
      }
      lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
    };

    if (activeTab === 'dashboard') {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      // If we navigate away, make sure the button is visible for when we come back
      setIsFabVisible(true);
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab]);

  // Data Migration Effect
    useEffect(() => {
        let migrated = false;
        try {
            const oldPayCycle = window.localStorage.getItem('financial-organizer-pay-cycle');
            const oldDaily = window.localStorage.getItem('financial-organizer-daily-expenses');
            const oldFuture = window.localStorage.getItem('financial-organizer-future-expenses');

            if (oldPayCycle || oldDaily || oldFuture) {
                console.log("Old data detected, starting migration...");
                const defaultCycleId = 'default_cycle_01';
                
                // Migrate pay cycle config
                const config: PayCycleConfig | null = oldPayCycle ? JSON.parse(oldPayCycle) : null;
                const newProfile: CycleProfile = {
                    id: defaultCycleId,
                    name: 'Mi Calendario',
                    color: '#3b82f6', // blue-500
                    config: config
                };
                setCycleProfiles([newProfile]);
                setActiveCycleId(defaultCycleId);

                // Migrate daily expenses
                if (oldDaily) {
                    const dailyData = JSON.parse(oldDaily);
                    // Check if it's the old format (not keyed by cycle ID)
                    if (!dailyData[defaultCycleId]) {
                        setAllDailyExpenses({ [defaultCycleId]: dailyData });
                    }
                } else {
                    setAllDailyExpenses({ [defaultCycleId]: {} });
                }

                // Migrate future expenses
                if (oldFuture) {
                    const futureData = JSON.parse(oldFuture);
                    // Check if it's the old format (array, not object)
                    if (Array.isArray(futureData)) {
                         setAllFutureExpenses({ [defaultCycleId]: futureData });
                    }
                } else {
                    setAllFutureExpenses({ [defaultCycleId]: [] });
                }

                // Clean up old data
                window.localStorage.removeItem('financial-organizer-pay-cycle');
                window.localStorage.removeItem('financial-organizer-daily-expenses');
                window.localStorage.removeItem('financial-organizer-future-expenses');
                console.log("Migration complete. Old data removed.");
                migrated = true;
            }
        } catch (error) {
            console.error("Migration failed:", error);
        }

        // If no migration happened, load new data format from localStorage
        if (!migrated) {
            try {
                const profiles = window.localStorage.getItem('financial-organizer-cycle-profiles');
                setCycleProfiles(profiles ? JSON.parse(profiles) : []);

                const activeId = window.localStorage.getItem('financial-organizer-active-cycle-id');
                setActiveCycleId(activeId ? JSON.parse(activeId) : null);
                
                const daily = window.localStorage.getItem('financial-organizer-all-daily');
                setAllDailyExpenses(daily ? JSON.parse(daily) : {});
                
                const future = window.localStorage.getItem('financial-organizer-all-future');
                setAllFutureExpenses(future ? JSON.parse(future) : {});
            } catch (error) {
                 console.error("Failed to load new data format from localStorage", error);
            }
        }
    }, []);

    // Effect to select first cycle if none is active
    useEffect(() => {
      if (!activeCycleId && cycleProfiles.length > 0) {
        setActiveCycleId(cycleProfiles[0].id);
      }
    }, [cycleProfiles, activeCycleId]);

     // Effect to clean up orphaned expense data when a profile is deleted
    useEffect(() => {
        const profileIds = new Set(cycleProfiles.map(p => p.id));

        const cleanup = <T,>(data: { [key: string]: T }): { [key: string]: T } => {
            const cleanedData: { [key: string]: T } = {};
            let changed = false;
            for (const id in data) {
                if (profileIds.has(id)) {
                    cleanedData[id] = data[id];
                } else {
                    changed = true;
                }
            }
            return changed ? cleanedData : data;
        };

        setAllDailyExpenses(prev => cleanup(prev));
        setAllFutureExpenses(prev => cleanup(prev));

    }, [cycleProfiles]);


    // Selectors for active cycle data
    const activeCycle = useMemo(() => cycleProfiles.find(p => p.id === activeCycleId), [cycleProfiles, activeCycleId]);
    const payCycleConfig = useMemo(() => activeCycle?.config || null, [activeCycle]);
    const dailyExpenses = useMemo(() => (activeCycleId ? allDailyExpenses[activeCycleId] : {}) || {}, [allDailyExpenses, activeCycleId]);
    const futureExpenses = useMemo(() => (activeCycleId ? allFutureExpenses[activeCycleId] : []) || [], [allFutureExpenses, activeCycleId]);

    // Wrapped setters for active cycle data
    const setDailyExpenses = useCallback((updater: React.SetStateAction<{ [date: string]: DailyExpense[] }>) => {
        if (!activeCycleId) return;
        setAllDailyExpenses(prev => {
            const currentExpenses = prev[activeCycleId] || {};
            const newExpenses = typeof updater === 'function' ? updater(currentExpenses) : updater;
            return { ...prev, [activeCycleId]: newExpenses };
        });
    }, [activeCycleId]);

    const setFutureExpenses = useCallback((updater: React.SetStateAction<FutureExpense[]>) => {
        if (!activeCycleId) return;
        setAllFutureExpenses(prev => {
            const currentExpenses = prev[activeCycleId] || [];
            const newExpenses = typeof updater === 'function' ? updater(currentExpenses) : updater;
            return { ...prev, [activeCycleId]: newExpenses };
        });
    }, [activeCycleId]);

  useEffect(() => {
    try {
      window.localStorage.setItem('financial-organizer-budgets', JSON.stringify(savedBudgets));
      const totalSaved = savedBudgets.reduce((total, budget) => {
        const savingsCategory = budget.categories.find(c => c.id === 'savings');
        return total + (savingsCategory ? savingsCategory.amount : 0);
      }, 0);
      setGlobalSavings(totalSaved);
    } catch (error) {
      console.error("Failed to save budgets to localStorage", error);
    }
  }, [savedBudgets]);
  
   useEffect(() => {
    try {
      window.localStorage.setItem('financial-organizer-global-savings', JSON.stringify(globalSavings));
    } catch (error) {
      console.error("Failed to save global savings to localStorage", error);
    }
  }, [globalSavings]);

    useEffect(() => {
        try {
            window.localStorage.setItem('financial-organizer-cycle-profiles', JSON.stringify(cycleProfiles));
        } catch (error) {
            console.error("Failed to save cycle profiles to localStorage", error);
        }
    }, [cycleProfiles]);

    useEffect(() => {
        try {
            window.localStorage.setItem('financial-organizer-active-cycle-id', JSON.stringify(activeCycleId));
        } catch (error) {
            console.error("Failed to save active cycle ID to localStorage", error);
        }
    }, [activeCycleId]);

    useEffect(() => {
        try {
            window.localStorage.setItem('financial-organizer-all-daily', JSON.stringify(allDailyExpenses));
        } catch (error) {
            console.error("Failed to save all daily expenses to localStorage", error);
        }
    }, [allDailyExpenses]);

    useEffect(() => {
        try {
            window.localStorage.setItem('financial-organizer-all-future', JSON.stringify(allFutureExpenses));
        } catch (error) {
            console.error("Failed to save all future expenses to localStorage", error);
        }
    }, [allFutureExpenses]);

    useEffect(() => {
        try {
            if (lastCycleCheckDate) {
                window.localStorage.setItem('financial-organizer-last-cycle-check', lastCycleCheckDate);
            }
        } catch (error) {
             console.error("Failed to save last cycle check date to localStorage", error);
        }
    }, [lastCycleCheckDate]);

  const handleCreateBudgetFromExpenses = useCallback((name: string, income: number, expensesForPeriod: DailyExpense[], isAutomatic: boolean = false) => {
    const categoryTotals: { [key: string]: number } = {};
    for (const expense of expensesForPeriod) {
        categoryTotals[expense.categoryId] = (categoryTotals[expense.categoryId] || 0) + expense.amount;
    }

    const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    
    const newCategories = INITIAL_CATEGORIES.map(({ id, name, color, icon }) => ({
        id,
        name,
        color,
        icon,
        amount: categoryTotals[id] || 0,
    }));

    const savingsCategory = newCategories.find(c => c.id === 'savings');
    if (savingsCategory) {
        savingsCategory.amount = Math.max(0, income - totalSpent);
    }

    const newBudget: BudgetRecord = {
        id: Date.now().toString(),
        name,
        totalIncome: income,
        categories: newCategories,
        dateSaved: new Date().toISOString(),
        frequency: 'mensual', // Default frequency for auto-created budgets
    };

    setSavedBudgets(prev => [newBudget, ...prev]);
    const alertMessage = isAutomatic
        ? `¡Nuevo presupuesto "${name}" creado automáticamente al finalizar tu ciclo de pago!`
        : `¡Presupuesto "${name}" creado con éxito a partir de tus gastos del período!`;
    alert(alertMessage);
  }, []);

    // Effect for automatic budget creation at end of cycle
    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        if (lastCycleCheckDate === todayStr) {
            return; // Already checked today
        }
        
        if (payCycleConfig) {
            let cycleStartDate = new Date(payCycleConfig.startDate);
            cycleStartDate.setHours(0, 0, 0, 0);
            let nextCycleDate = new Date(cycleStartDate);

            // Find the most recent cycle start date that has passed
            while(nextCycleDate <= today) {
                cycleStartDate = new Date(nextCycleDate);
                switch(payCycleConfig.frequency) {
                    case 'semanal': nextCycleDate.setDate(nextCycleDate.getDate() + 7); break;
                    case 'quincenal': nextCycleDate.setDate(nextCycleDate.getDate() + 14); break;
                    case 'mensual': nextCycleDate.setMonth(nextCycleDate.getMonth() + 1); break;
                    case 'anual': nextCycleDate.setFullYear(nextCycleDate.getFullYear() + 1); break;
                }
            }
            
            // cycleEndDate is the day before the next cycle starts
            const cycleEndDate = new Date(nextCycleDate);
            cycleEndDate.setDate(cycleEndDate.getDate() - 1);

            // Check if today is the end of a cycle that we haven't processed
            if (today >= cycleEndDate) {
                 const cycleStartDateStr = cycleStartDate.toISOString().split('T')[0];
                 const cycleEndDateStr = cycleEndDate.toISOString().split('T')[0];
                 
                 // Check if a budget for this cycle already exists
                 const budgetExists = savedBudgets.some(b => b.name.includes(`(${cycleStartDate.toLocaleDateString()})`));

                 if (!budgetExists) {
                    // FIX: Replaced .map().flat() with .reduce() for better TypeScript type inference.
                    const dailyExpensesForCycle = Object.entries(dailyExpenses)
                        .filter(([dateKey]) => dateKey >= cycleStartDateStr && dateKey <= cycleEndDateStr)
                        // Fix: Cast `daily` to `DailyExpense[]` to resolve type inference issue.
                        .reduce((acc: DailyExpense[], [, daily]) => acc.concat(daily as DailyExpense[]), []);

                    const futureExpensesForCycle: DailyExpense[] = [];
                    futureExpenses.forEach(fe => {
                        let occurrenceDate = new Date(fe.startDate);
                        const feEndDate = fe.endDate ? new Date(fe.endDate) : null;
                        
                        while(occurrenceDate <= cycleEndDate) {
                             if (occurrenceDate >= cycleStartDate && (!feEndDate || occurrenceDate <= feEndDate)) {
                                futureExpensesForCycle.push({
                                    id: `${fe.id}-${occurrenceDate.toISOString()}`,
                                    note: `(Planificado) ${fe.note}`,
                                    amount: fe.amount,
                                    categoryId: fe.categoryId,
                                });
                             }
                             if (fe.frequency === 'una-vez') break;
                             switch(fe.frequency) {
                                case 'semanal': occurrenceDate.setDate(occurrenceDate.getDate() + 7); break;
                                case 'quincenal': occurrenceDate.setDate(occurrenceDate.getDate() + 14); break;
                                case 'mensual': occurrenceDate.setMonth(occurrenceDate.getMonth() + 1); break;
                                case 'anual': occurrenceDate.setFullYear(occurrenceDate.getFullYear() + 1); break;
                             }
                        }
                    });

                    const expensesForCycle = [...dailyExpensesForCycle, ...futureExpensesForCycle];

                    if (expensesForCycle.length > 0 || payCycleConfig.income > 0) {
                        handleCreateBudgetFromExpenses(
                            `Automático ${cycleStartDate.toLocaleDateString()}`,
                            payCycleConfig.income,
                            expensesForCycle,
                            true // isAutomatic
                        );
                    }
                 }
            }
        }

        setLastCycleCheckDate(todayStr);

    }, [payCycleConfig, dailyExpenses, futureExpenses, savedBudgets, lastCycleCheckDate, handleCreateBudgetFromExpenses]);

    // Effect for the "live" current cycle budget
    useEffect(() => {
        if (!payCycleConfig) {
            setCurrentCycleBudget(null);
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let cycleStartDate = new Date(payCycleConfig.startDate);
        cycleStartDate.setHours(0, 0, 0, 0);
        
        if (cycleStartDate > today) { // Cycle hasn't started yet
            setCurrentCycleBudget(null);
            return;
        }

        // Find the start date of the current cycle
        let nextCycleStartDate = new Date(cycleStartDate);
        while (true) {
            let tempNext = new Date(nextCycleStartDate);
            switch (payCycleConfig.frequency) {
                case 'semanal': tempNext.setDate(tempNext.getDate() + 7); break;
                case 'quincenal': tempNext.setDate(tempNext.getDate() + 14); break;
                case 'mensual': tempNext.setMonth(tempNext.getMonth() + 1); break;
                case 'anual': tempNext.setFullYear(tempNext.getFullYear() + 1); break;
            }
            if (tempNext > today) break;
            nextCycleStartDate = tempNext;
        }
        cycleStartDate = nextCycleStartDate;
        
        const cycleEndDate = new Date(nextCycleStartDate);
        switch (payCycleConfig.frequency) {
            case 'semanal': cycleEndDate.setDate(cycleEndDate.getDate() + 7 - 1); break;
            case 'quincenal': cycleEndDate.setDate(cycleEndDate.getDate() + 14 - 1); break;
            case 'mensual': cycleEndDate.setMonth(cycleEndDate.getMonth() + 1); cycleEndDate.setDate(0); break;
            case 'anual': cycleEndDate.setFullYear(cycleEndDate.getFullYear() + 1); cycleEndDate.setDate(0); break;
        }

        const cycleStartDateStr = cycleStartDate.toISOString().split('T')[0];
        const cycleEndDateStr = cycleEndDate.toISOString().split('T')[0];

        const daily = Object.entries(dailyExpenses)
            .filter(([date]) => date >= cycleStartDateStr && date <= cycleEndDateStr)
            .reduce((acc, [, exp]) => acc.concat(exp as DailyExpense[]), [] as DailyExpense[]);
        
        const future = futureExpenses.flatMap(fe => {
            const occurrences: DailyExpense[] = [];
            let currentDate = new Date(fe.startDate);
            const feEndDate = fe.endDate ? new Date(fe.endDate) : null;

            while(currentDate <= cycleEndDate && (!feEndDate || currentDate <= feEndDate)) {
                if (currentDate >= cycleStartDate) {
                    occurrences.push({
                        id: `${fe.id}-${currentDate.toISOString()}`,
                        note: `(Planificado) ${fe.note}`,
                        amount: fe.amount,
                        categoryId: fe.categoryId
                    });
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
        
        const allExpensesForCycle = [...daily, ...future];
        const categoryTotals: { [key: string]: number } = {};
        allExpensesForCycle.forEach(exp => {
            categoryTotals[exp.categoryId] = (categoryTotals[exp.categoryId] || 0) + exp.amount;
        });

        const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

        const budgetCategories = INITIAL_CATEGORIES.map(cat => ({
            ...cat,
            amount: categoryTotals[cat.id] || 0
        }));

        const savings = Math.max(0, payCycleConfig.income - totalSpent);
        const savingsCategory = budgetCategories.find(c => c.id === 'savings');
        if (savingsCategory) {
            savingsCategory.amount = savings;
        }

        setCurrentCycleBudget({
            id: 'current_cycle_budget',
            name: `Presupuesto del Ciclo Actual (${cycleStartDate.toLocaleDateString()})`,
            totalIncome: payCycleConfig.income,
            categories: budgetCategories,
            dateSaved: cycleStartDate.toISOString(),
            frequency: payCycleConfig.frequency
        });

    }, [payCycleConfig, dailyExpenses, futureExpenses]);

  const handleOpenCreateModal = useCallback(() => {
    setEditingBudget(null); // Null signifies "create" mode for the modal
    setIsCreateModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((budget: BudgetRecord) => {
    setEditingBudget(budget);
  }, []);
  
  const handleCloseEditModal = useCallback(() => {
    setEditingBudget(null);
    setIsCreateModalOpen(false);
  }, []);

  const handleSaveNewBudget = useCallback((newBudgetData: Omit<BudgetRecord, 'id'>) => {
    const newBudget: BudgetRecord = {
      ...newBudgetData,
      id: Date.now().toString(),
    };
    const newSavedBudgets = [...savedBudgets, newBudget].sort((a,b) => new Date(b.dateSaved).getTime() - new Date(a.dateSaved).getTime());
    setSavedBudgets(newSavedBudgets);
    setActiveBudgetId(newBudget.id);
    alert(`¡Presupuesto "${newBudget.name}" guardado con éxito!`);
  }, [savedBudgets]);

  const handleUpdateBudget = useCallback((updatedBudget: BudgetRecord) => {
    const updatedBudgets = savedBudgets.map(b =>
      b.id === updatedBudget.id ? updatedBudget : b
    );
    setSavedBudgets(updatedBudgets);
    alert(`¡Presupuesto "${updatedBudget.name}" actualizado con éxito!`);
  }, [savedBudgets]);
  
  const handleDeleteBudget = useCallback((id: string) => {
    const budgetToDeleteIndex = savedBudgets.findIndex(b => b.id === id);
    if (budgetToDeleteIndex === -1) return;

    const remainingBudgets = savedBudgets.filter(b => b.id !== id);
    setSavedBudgets(remainingBudgets);
    
    if (activeBudgetId === id) {
        if (remainingBudgets.length > 0) {
            const sorted = [...remainingBudgets].sort((a, b) => new Date(b.dateSaved).getTime() - new Date(a.dateSaved).getTime());
            setActiveBudgetId(sorted[0].id);
        } else {
            setActiveBudgetId(null);
        }
    }
  }, [activeBudgetId, savedBudgets]);

  const handleOpenDeleteModal = useCallback((budget: BudgetRecord) => {
    setBudgetToDelete(budget);
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setBudgetToDelete(null);
    setIsDeleteModalOpen(false);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (budgetToDelete) {
        handleDeleteBudget(budgetToDelete.id);
    }
    handleCloseDeleteModal();
  }, [budgetToDelete, handleDeleteBudget, handleCloseDeleteModal]);

  const handleConfirmForceCreateBudget = useCallback(() => {
    if (!currentCycleBudget) {
      alert("No hay un presupuesto de ciclo activo para guardar.");
      return;
    }

    const budgetToSave = {
      ...currentCycleBudget,
      id: Date.now().toString(),
      name: `Presupuesto Parcial (${new Date(currentCycleBudget.dateSaved).toLocaleDateString('es-ES')})`,
      dateSaved: new Date().toISOString()
    };
    
    const budgetExists = savedBudgets.some(b => b.name === budgetToSave.name);
    if (budgetExists) {
      alert(`Ya existe un presupuesto llamado "${budgetToSave.name}". Por favor, elimina o renombra el existente si quieres crear uno nuevo.`);
      return;
    }

    setSavedBudgets(prev => [budgetToSave, ...prev]);
    alert(`¡Presupuesto "${budgetToSave.name}" guardado en tu historial!`);

  }, [currentCycleBudget, savedBudgets]);


  const handleOpenForceCreateModal = useCallback(() => {
    if (!payCycleConfig) {
      alert("Primero debes configurar un ciclo de pago.");
      return;
    }
     if (!currentCycleBudget) {
      alert("No hay un presupuesto de ciclo activo para guardar.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cycleStartDate = new Date(currentCycleBudget.dateSaved);
    
    setForceCreateInfo({ startDate: cycleStartDate, endDate: today });
    setIsForceCreateModalOpen(true);

  }, [payCycleConfig, currentCycleBudget]);


  const averageBudgetData = useMemo(() => {
    if (savedBudgets.length === 0) {
        return {
            averageTotalIncome: 0,
            averageCategories: INITIAL_CATEGORIES.map(c => ({ ...c, amount: 0 })),
        };
    }

    const totalIncomeSum = savedBudgets.reduce((sum, budget) => sum + budget.totalIncome, 0);
    const categorySums: { [key: string]: number } = {};

    for (const budget of savedBudgets) {
        for (const category of budget.categories) {
            categorySums[category.id] = (categorySums[category.id] || 0) + category.amount;
        }
    }

    const averageTotalIncome = totalIncomeSum / savedBudgets.length;
    const averageCategories = INITIAL_CATEGORIES.map(category => ({
        ...category,
        amount: (categorySums[category.id] || 0) / savedBudgets.length,
    }));

    return { averageTotalIncome, averageCategories };
  }, [savedBudgets]);

  const averageChartData = useMemo(() => {
      return averageBudgetData.averageCategories.map(cat => ({
          name: cat.name,
          value: cat.amount,
          fill: cat.color,
      })).filter(cat => cat.value > 0);
  }, [averageBudgetData]);

  const currentPeriodSpendingData = useMemo(() => {
    if (!payCycleConfig) {
      return { spentByCategory: [], periodStartDate: null, periodEndDate: null };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999); // Use end of today for inclusive check

    let cycleStartDate = new Date(payCycleConfig.startDate);
    cycleStartDate.setHours(0, 0, 0, 0);

    // Find the start date of the current cycle
    while (true) {
      let nextCycleStartDate = new Date(cycleStartDate);
      switch (payCycleConfig.frequency) {
        case 'semanal': nextCycleStartDate.setDate(nextCycleStartDate.getDate() + 7); break;
        case 'quincenal': nextCycleStartDate.setDate(nextCycleStartDate.getDate() + 14); break;
        case 'mensual': nextCycleStartDate.setMonth(nextCycleStartDate.getMonth() + 1); break;
        case 'anual': nextCycleStartDate.setFullYear(nextCycleStartDate.getFullYear() + 1); break;
      }
      if (nextCycleStartDate > today) break;
      cycleStartDate = nextCycleStartDate;
    }
    
    const periodStartDate = new Date(cycleStartDate);
    periodStartDate.setHours(0,0,0,0);
    const periodEndDate = new Date();
    periodEndDate.setHours(0,0,0,0);


    const cycleStartDateStr = periodStartDate.toISOString().split('T')[0];
    const cycleEndDateStr = today.toISOString().split('T')[0];

    // Get daily expenses
    // FIX: Replaced .map().flat() with .reduce() for better TypeScript type inference.
    const dailyExpensesForPeriod = Object.entries(dailyExpenses)
      .filter(([dateKey]) => dateKey >= cycleStartDateStr && dateKey <= cycleEndDateStr)
      // Fix: Cast `daily` to `DailyExpense[]` to resolve type inference issue.
      .reduce((acc: DailyExpense[], [, daily]) => acc.concat(daily as DailyExpense[]), []);

    // Get future expenses
    const futureExpensesForPeriod: DailyExpense[] = [];
    futureExpenses.forEach(fe => {
      let currentDate = new Date(fe.startDate);
      const feEndDate = fe.endDate ? new Date(fe.endDate) : null;
      while (currentDate <= today) {
        if (currentDate >= periodStartDate && (!feEndDate || currentDate <= feEndDate)) {
          futureExpensesForPeriod.push({
            id: `${fe.id}-${currentDate.toISOString()}`,
            note: `(Planificado) ${fe.note}`,
            amount: fe.amount,
            categoryId: fe.categoryId,
          });
        }
        if (fe.frequency === 'una-vez') break;
        switch (fe.frequency) {
          case 'semanal': currentDate.setDate(currentDate.getDate() + 7); break;
          case 'quincenal': currentDate.setDate(currentDate.getDate() + 14); break;
          case 'mensual': currentDate.setMonth(currentDate.getMonth() + 1); break;
          case 'anual': currentDate.setFullYear(currentDate.getFullYear() + 1); break;
        }
      }
    });

    const allExpenses: DailyExpense[] = [...dailyExpensesForPeriod, ...futureExpensesForPeriod];
    const categoryTotals: { [key: string]: number } = {};
    for (const expense of allExpenses) {
      categoryTotals[expense.categoryId] = (categoryTotals[expense.categoryId] || 0) + expense.amount;
    }

    const categoryMap = new Map(INITIAL_CATEGORIES.map(c => [c.id, c]));

    const spentByCategory = Object.entries(categoryTotals)
      .map(([categoryId, amount]) => ({
        category: categoryMap.get(categoryId)!,
        amount,
      }))
      .filter(item => item.category) // Ensure category exists
      .sort((a, b) => b.amount - a.amount);

    return { spentByCategory, periodStartDate, periodEndDate };
  }, [payCycleConfig, dailyExpenses, futureExpenses]);

  const renderSummaryAndCharts = () => {
    return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-neutral-800 p-6 rounded-3xl shadow-lg h-[400px]">
              <h3 className="text-xl font-bold mb-4 text-neutral-100">Distribución Promedio de Gastos</h3>
              {savedBudgets.length > 0 ? (
                  <BudgetChart data={averageChartData} totalIncome={averageBudgetData.averageTotalIncome} />
              ) : (
                  <div className="flex items-center justify-center h-full text-center text-neutral-500 p-4">
                     <p>Añade tu primer presupuesto para ver un resumen promedio de tus gastos.</p>
                  </div>
              )}
            </div>
            <div className="lg:col-span-1">
                <GlobalSavingsCard
                    value={globalSavings}
                    onSave={setGlobalSavings}
                />
            </div>
          </div>
        </div>
    )
  }

    // FAB Action handlers
    const handleFabQuickBudget = () => {
        setIsFabMenuOpen(false);
        handleOpenCreateModal();
    };

    const ensureCalendarAndProceed = (actionCallback: () => void) => {
        if (cycleProfiles.length === 0) {
            const newProfile: CycleProfile = {
                id: Date.now().toString(),
                name: 'Mi Primer Calendario',
                color: '#3b82f6', // default blue
                config: null,
            };
            setCycleProfiles([newProfile]);
            setActiveCycleId(newProfile.id);
            alert("No tenías calendarios, así que hemos creado 'Mi Primer Calendario' para ti.");
        }
        actionCallback();
    };
    
    const handleFabAddCycle = () => {
        ensureCalendarAndProceed(() => {
            setIsFabMenuOpen(false);
            setActiveTab('expenses');
            setPendingAction('add_cycle');
        });
    };
    const handleFabAddDailyExpense = () => {
        ensureCalendarAndProceed(() => {
            setIsFabMenuOpen(false);
            setActiveTab('expenses');
            setPendingAction('add_daily_expense');
        });
    };
    const handleFabAddFutureExpense = () => {
        ensureCalendarAndProceed(() => {
            setIsFabMenuOpen(false);
            setActiveTab('expenses');
            setPendingAction('add_future_expense');
        });
    };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-200 font-sans">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onMenuClick={() => setIsMenuOpen(true)}
      />
      <SideMenu 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
      <BudgetEditorModal
        isOpen={editingBudget !== null || isCreateModalOpen}
        onClose={handleCloseEditModal}
        budget={editingBudget}
        onUpdate={handleUpdateBudget}
        onSave={handleSaveNewBudget}
      />
      <ForceCreateBudgetModal
        isOpen={isForceCreateModalOpen}
        onClose={() => setIsForceCreateModalOpen(false)}
        onConfirm={handleConfirmForceCreateBudget}
        cycleStartDate={forceCreateInfo?.startDate || null}
        cycleEndDate={forceCreateInfo?.endDate || null}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        budgetName={budgetToDelete?.name || ''}
        budgetDate={budgetToDelete?.dateSaved || ''}
      />
      <main className="container mx-auto p-4 md:p-8 pb-24 md:pb-8">
        {activeTab === 'dashboard' && (
           <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-12">
              <div className="xl:col-span-2 space-y-8">
                 <DashboardNotifications
                    allDailyExpenses={allDailyExpenses}
                    allFutureExpenses={allFutureExpenses}
                    categories={INITIAL_CATEGORIES}
                    cycleProfiles={cycleProfiles}
                 />
                 {renderSummaryAndCharts()}
              </div>
              <div className="space-y-8">
                 <HistoryPanel 
                    budgets={savedBudgets}
                    activeBudgetId={activeBudgetId}
                    onCreateNew={handleOpenCreateModal}
                    onEditBudget={handleOpenEditModal}
                    onOpenDeleteModal={handleOpenDeleteModal}
                 />
                 <CurrentPeriodSpending
                    spentByCategory={currentPeriodSpendingData.spentByCategory}
                    periodStartDate={currentPeriodSpendingData.periodStartDate}
                    periodEndDate={currentPeriodSpendingData.periodEndDate}
                 />
              </div>
            </div>
        )}
        {activeTab === 'history' && (
          <HistoryView
            budgets={savedBudgets}
            globalSavings={globalSavings}
            onUpdateGlobalSavings={setGlobalSavings}
            onEditBudget={handleOpenEditModal}
            onOpenDeleteModal={handleOpenDeleteModal}
          />
        )}
        {activeTab === 'expenses' && (
            <DailyExpenseView
                expenses={dailyExpenses}
                setExpenses={setDailyExpenses}
                categories={INITIAL_CATEGORIES.filter(c => c.id !== 'savings')}
                onForceCreateBudget={handleOpenForceCreateModal}
                futureExpenses={futureExpenses}
                setFutureExpenses={setFutureExpenses}
                currentCycleBudget={currentCycleBudget}
                cycleProfiles={cycleProfiles}
                setCycleProfiles={setCycleProfiles}
                activeCycleId={activeCycleId}
                setActiveCycleId={setActiveCycleId}
                pendingAction={pendingAction}
                onActionHandled={() => setPendingAction(null)}
            />
        )}
        {activeTab === 'calculators' && (
            <CalculatorsView />
        )}
      </main>
      {activeTab === 'dashboard' && (
        <div className="fixed bottom-24 right-4 z-30 md:hidden flex flex-col items-end">
             <div 
              className={`flex flex-col items-end gap-4 transition-all duration-300 ease-in-out ${isFabMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
            >
              <FabAction buttonProps={{onClick: handleFabAddFutureExpense}} label="Gasto Planificado" icon="fa-flag" />
              <FabAction buttonProps={{onClick: handleFabAddDailyExpense}} label="Gasto Diario" icon="fa-cash-register" />
              <FabAction buttonProps={{onClick: handleFabAddCycle}} label="Nuevo Ciclo" icon="fa-calendar-plus" />
              <FabAction buttonProps={{onClick: handleFabQuickBudget}} label="Presupuesto Rápido" icon="fa-file-invoice-dollar" />
          </div>
          <button
            onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
            className={`mt-4 bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:bg-blue-700 transition-all duration-300 ease-in-out ${isFabVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'} ${isFabMenuOpen ? 'rotate-45' : ''}`}
            aria-label="Acciones rápidas"
            aria-expanded={isFabMenuOpen}
            tabIndex={isFabVisible ? 0 : -1}
          >
            <i className="fa-solid fa-plus text-2xl"></i>
          </button>
        </div>
      )}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default App;
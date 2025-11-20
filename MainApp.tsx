import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Category, BudgetRecord, DailyExpense, PayCycleConfig, FutureExpense, PayCycleFrequency, CycleProfile, User, Users } from './types';
import { INITIAL_CATEGORIES } from './constants';
import { Header } from './components/Header';
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
import { ProfileCustomizationModal } from './components/ProfileCustomizationModal';
import * as storage from './storage';

type ActiveTab = 'dashboard' | 'history' | 'expenses' | 'calculators';

interface MainAppProps {
    currentUser: string;
    onLogout: () => void;
}

interface CurrentPeriodSpendingProps {
  spentByCategory: { category: Category; amount: number }[];
  periodStartDate: Date | null;
  periodEndDate: Date | null;
}

const CurrentPeriodSpending: React.FC<CurrentPeriodSpendingProps> = ({
  spentByCategory,
  periodStartDate,
  periodEndDate,
}) => {
  if (!periodStartDate || !periodEndDate) {
    return (
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border border-gray-200/80 dark:border-white/10 p-6 rounded-3xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-2">Gastos del Período</h2>
        <p className="text-gray-500 dark:text-neutral-400 text-sm">
          Configura un <i className="fa-solid fa-cog mx-1"></i><strong>Ciclo de Pago</strong> en la pestaña de Gastos para ver un resumen de tus gastos actuales aquí.
        </p>
      </div>
    );
  }

  const totalSpent = spentByCategory.reduce((sum, item) => sum + item.amount, 0);
  const formattedStartDate = periodStartDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const formattedEndDate = periodEndDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  return (
    <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border border-gray-200/80 dark:border-white/10 p-6 rounded-3xl shadow-lg space-y-4 self-start">
      <div className="border-b border-gray-200 dark:border-neutral-700 pb-3 mb-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Gastos del Período Actual</h2>
        <p className="text-sm text-gray-500 dark:text-neutral-400">{formattedStartDate} - {formattedEndDate}</p>
      </div>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {spentByCategory.length > 0 ? (
          spentByCategory.map(({ category, amount }) => (
            <div key={category.id} className="flex justify-between items-center bg-gray-100 dark:bg-neutral-700/50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <i className={`${category.icon} fa-fw text-lg`} style={{ color: category.color }}></i>
                <span className="font-semibold text-gray-800 dark:text-neutral-200">{category.name}</span>
              </div>
              <span className="font-bold text-lg text-red-500 dark:text-red-400">-${amount.toFixed(2)}</span>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-neutral-500 py-4">No hay gastos registrados en este período.</p>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-neutral-700 pt-3 mt-3 flex justify-between items-center">
        <span className="font-bold text-gray-900 dark:text-neutral-100 text-lg">Total Gastado</span>
        <span className="font-extrabold text-2xl text-red-500 dark:text-red-400">-${totalSpent.toFixed(2)}</span>
      </div>
    </div>
  );
};

export const MainApp: React.FC<MainAppProps> = ({ currentUser, onLogout }) => {
    // Keys for localStorage/IndexedDB
    const KEYS = useMemo(() => ({
        USERS: 'financial-organizer-users',
        BUDGETS: `financial-organizer-${currentUser}-budgets`,
        GLOBAL_SAVINGS: `financial-organizer-${currentUser}-global-savings`,
        CYCLE_PROFILES: `financial-organizer-${currentUser}-cycle-profiles`,
        ACTIVE_CYCLE_ID: `financial-organizer-${currentUser}-active-cycle-id`,
        ALL_DAILY: `financial-organizer-${currentUser}-all-daily`,
        ALL_FUTURE: `financial-organizer-${currentUser}-all-future`,
        THEME: 'financial-organizer-theme',
    }), [currentUser]);

  // State for loading
  const [isLoading, setIsLoading] = useState(true);

  // State for tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  
  // State for menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // User profile state (remains in localStorage for sync access)
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Theme state (remains in localStorage for sync access)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
        const storedTheme = window.localStorage.getItem(KEYS.THEME);
        return storedTheme === 'light' ? 'light' : 'dark'; // Default to dark
    } catch {
        return 'dark';
    }
  });

  // State for budgets and UI (now with default empty values)
  const [savedBudgets, setSavedBudgets] = useState<BudgetRecord[]>([]);
  const [globalSavings, setGlobalSavings] = useState<number>(0);
  const [cycleProfiles, setCycleProfiles] = useState<CycleProfile[]>([]);
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null);
  const [allDailyExpenses, setAllDailyExpenses] = useState<{ [cycleId: string]: { [date: string]: DailyExpense[] } }>({});
  const [allFutureExpenses, setAllFutureExpenses] = useState<{ [cycleId: string]: FutureExpense[] }>({});
    
  // State for the "live" budget based on the current pay cycle
  const [currentCycleBudget, setCurrentCycleBudget] = useState<BudgetRecord | null>(null);

  // State for modals
  const [editingBudget, setEditingBudget] = useState<BudgetRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isForceCreateModalOpen, setIsForceCreateModalOpen] = useState(false);
  const [forceCreateInfo, setForceCreateInfo] = useState<{ startDate: Date, endDate: Date } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetRecord | null>(null);

    // Effect to get user profile on load (from localStorage)
    useEffect(() => {
        try {
            const usersData = window.localStorage.getItem(KEYS.USERS);
            if(usersData) {
                const users: Users = JSON.parse(usersData);
                const userData = users[currentUser];
                 if (typeof userData === 'object' && userData !== null) {
                    setUserProfile(userData);
                } else if (typeof userData === 'string') { // Handle migration
                    const migratedUser = { password: userData, avatarId: '0', background: 'default' };
                    setUserProfile(migratedUser);
                }
            }
        } catch (e) {
            console.error("Failed to load user profile:", e);
        }
    }, [currentUser, KEYS.USERS]);

    // Async data loading from IndexedDB
    useEffect(() => {
        async function loadInitialData() {
            try {
                await storage.migrateFromLocalStorage();

                const [
                    sBudgets,
                    sGlobalSavings,
                    sCycleProfiles,
                    sActiveCycleId,
                    sAllDaily,
                    sAllFuture,
                ] = await Promise.all([
                    storage.get<BudgetRecord[]>(KEYS.BUDGETS),
                    storage.get<number>(KEYS.GLOBAL_SAVINGS),
                    storage.get<CycleProfile[]>(KEYS.CYCLE_PROFILES),
                    storage.get<string | null>(KEYS.ACTIVE_CYCLE_ID),
                    storage.get<{ [cycleId: string]: { [date: string]: DailyExpense[] } }>(KEYS.ALL_DAILY),
                    storage.get<{ [cycleId: string]: FutureExpense[] }>(KEYS.ALL_FUTURE),
                ]);

                setSavedBudgets(sBudgets || []);
                setGlobalSavings(sGlobalSavings || 0);
                setCycleProfiles(sCycleProfiles || []);
                setActiveCycleId(sActiveCycleId || null);
                setAllDailyExpenses(sAllDaily || {});
                setAllFutureExpenses(sAllFuture || {});

            } catch (error) {
                console.error("Failed to load user data from storage. Starting with a clean state.", error);
                // Even on error, we must stop loading to not block the UI.
                // The app will proceed with an empty state.
            } finally {
                setIsLoading(false);
            }
        }

        loadInitialData();
    }, [KEYS]);

    // Hide loading spinner when done
    useEffect(() => {
        if (!isLoading) {
            const loadingEl = document.getElementById('app-loading');
            if (loadingEl) {
                loadingEl.style.opacity = '0';
                setTimeout(() => {
                    loadingEl.style.display = 'none';
                }, 300);
            }
        }
    }, [isLoading]);

    const handleUpdateUserProfile = (updatedFields: Partial<User>) => {
        try {
            const usersData = window.localStorage.getItem(KEYS.USERS);
            if(usersData) {
                const users: Users = JSON.parse(usersData);
                const userData = users[currentUser];
                 if (typeof userData === 'object' && userData !== null) {
                    const updatedUser = { ...userData, ...updatedFields };
                    const updatedUsers = { ...users, [currentUser]: updatedUser };
                    window.localStorage.setItem(KEYS.USERS, JSON.stringify(updatedUsers));
                    setUserProfile(updatedUser);
                }
            }
        } catch (e) {
            console.error("Failed to update user profile:", e);
        }
    };
    
    const handleUpdateAvatar = (avatarId: string) => {
        handleUpdateUserProfile({ avatarId });
    };

    const handleUpdateBackground = (background: string) => {
        handleUpdateUserProfile({ background });
        setIsProfileModalOpen(false);
    };

    // Effect to select first cycle if none is active
    useEffect(() => {
      if (!isLoading && !activeCycleId && cycleProfiles.length > 0) {
        setActiveCycleId(cycleProfiles[0].id);
      }
    }, [cycleProfiles, activeCycleId, isLoading]);

     // Effect to clean up orphaned expense data when a profile is deleted
    useEffect(() => {
      if (isLoading) return;
        const profileIds = new Set(cycleProfiles.map(p => p.id));
        
        const cleanExpenses = (allExpenses: any) => {
            const cleaned: any = {};
            let changed = false;
            for(const profileId in allExpenses) {
                if (profileIds.has(profileId)) {
                    cleaned[profileId] = allExpenses[profileId];
                } else {
                    changed = true;
                }
            }
            return { cleaned, changed };
        }

        const { cleaned: cleanedDaily, changed: dailyChanged } = cleanExpenses(allDailyExpenses);
        if (dailyChanged) setAllDailyExpenses(cleanedDaily);

        const { cleaned: cleanedFuture, changed: futureChanged } = cleanExpenses(allFutureExpenses);
        if (futureChanged) setAllFutureExpenses(cleanedFuture);

    }, [cycleProfiles, isLoading, allDailyExpenses, allFutureExpenses]);

    // Apply theme to HTML element
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
        try {
            window.localStorage.setItem(KEYS.THEME, theme);
        } catch (e) {
             console.warn("Could not save theme to localStorage", e);
        }
    }, [theme, KEYS.THEME]);

  // Derived state for current expenses (for the active cycle)
  const currentDailyExpenses = useMemo<{ [date: string]: DailyExpense[] }>(() => activeCycleId ? allDailyExpenses[activeCycleId] || {} : {}, [allDailyExpenses, activeCycleId]);
  const currentFutureExpenses = useMemo(() => activeCycleId ? allFutureExpenses[activeCycleId] || [] : [], [allFutureExpenses, activeCycleId]);
  const setCurrentDailyExpenses = useCallback((expenses: React.SetStateAction<{ [date: string]: DailyExpense[] }>) => {
    if (activeCycleId) {
      setAllDailyExpenses(prev => ({ ...prev, [activeCycleId]: typeof expenses === 'function' ? expenses(prev[activeCycleId] || {}) : expenses }));
    }
  }, [activeCycleId]);
  const setCurrentFutureExpenses = useCallback((expenses: React.SetStateAction<FutureExpense[]>) => {
    if (activeCycleId) {
      setAllFutureExpenses(prev => ({ ...prev, [activeCycleId]: typeof expenses === 'function' ? expenses(prev[activeCycleId] || []) : expenses }));
    }
  }, [activeCycleId]);
  
  const activeCycleProfile = useMemo(() => cycleProfiles.find(p => p.id === activeCycleId), [cycleProfiles, activeCycleId]);
  const activeCycleConfig = useMemo(() => activeCycleProfile?.config || null, [activeCycleProfile]);

  const { currentPeriodSpending, periodStartDate, periodEndDate } = useMemo(() => {
    if (!activeCycleConfig) {
      return { currentPeriodSpending: [], periodStartDate: null, periodEndDate: null };
    }
    
    const now = new Date();
    const { startDate, frequency } = activeCycleConfig;
    const cycleStart = new Date(`${startDate}T00:00:00`);
    
    let currentCycleStart = new Date(cycleStart);
    let nextCycleStart = new Date(currentCycleStart);

    while (nextCycleStart <= now) {
      currentCycleStart = new Date(nextCycleStart);
      switch (frequency) {
        case 'semanal': nextCycleStart.setDate(nextCycleStart.getDate() + 7); break;
        case 'quincenal': nextCycleStart.setDate(nextCycleStart.getDate() + 14); break;
        case 'mensual': nextCycleStart.setMonth(nextCycleStart.getMonth() + 1); break;
        case 'anual': nextCycleStart.setFullYear(nextCycleStart.getFullYear() + 1); break;
      }
    }
    
    const periodStartDate = currentCycleStart;
    const periodEndDate = new Date(nextCycleStart.getTime() - 1);

    const spentByCategory = new Map<string, { category: Category; amount: number }>();
    INITIAL_CATEGORIES.forEach(cat => spentByCategory.set(cat.id, { category: cat, amount: 0 }));

    Object.entries(currentDailyExpenses).forEach(([dateStr, expenses]) => {
      const expenseDate = new Date(`${dateStr}T12:00:00`);
      if (expenseDate >= periodStartDate && expenseDate <= periodEndDate) {
        (expenses as DailyExpense[]).forEach(exp => {
          const entry = spentByCategory.get(exp.categoryId);
          if (entry) {
            entry.amount += exp.amount;
          }
        });
      }
    });

    return { 
      currentPeriodSpending: Array.from(spentByCategory.values()).filter(item => item.amount > 0),
      periodStartDate,
      periodEndDate
    };

  }, [activeCycleConfig, currentDailyExpenses]);

  // Effect to calculate and set the "live" budget for the current cycle
  useEffect(() => {
    if (activeCycleConfig && periodStartDate && periodEndDate) {
      const budgetCategories = INITIAL_CATEGORIES.map(cat => {
        const spentItem = currentPeriodSpending.find(item => item.category.id === cat.id);
        return {
          ...cat,
          amount: spentItem ? spentItem.amount : 0,
        };
      });
      
      const liveBudget: BudgetRecord = {
        id: 'live-cycle-budget',
        name: `Presupuesto de Ciclo Actual (${activeCycleProfile?.name || ''})`,
        totalIncome: activeCycleConfig.income,
        categories: budgetCategories,
        dateSaved: new Date().toISOString(),
        frequency: activeCycleConfig.frequency,
      };
      setCurrentCycleBudget(liveBudget);
    } else {
      setCurrentCycleBudget(null);
    }
  }, [currentPeriodSpending, activeCycleConfig, periodStartDate, periodEndDate, activeCycleProfile]);

  // Save to IndexedDB whenever data changes
    useEffect(() => { if (!isLoading) storage.set(KEYS.BUDGETS, savedBudgets); }, [savedBudgets, KEYS.BUDGETS, isLoading]);
    useEffect(() => { if (!isLoading) storage.set(KEYS.GLOBAL_SAVINGS, globalSavings); }, [globalSavings, KEYS.GLOBAL_SAVINGS, isLoading]);
    useEffect(() => { if (!isLoading) storage.set(KEYS.CYCLE_PROFILES, cycleProfiles); }, [cycleProfiles, KEYS.CYCLE_PROFILES, isLoading]);
    useEffect(() => {
        if (!isLoading) {
            if (activeCycleId) storage.set(KEYS.ACTIVE_CYCLE_ID, activeCycleId);
            else storage.remove(KEYS.ACTIVE_CYCLE_ID);
        }
    }, [activeCycleId, KEYS.ACTIVE_CYCLE_ID, isLoading]);
    useEffect(() => { if (!isLoading) storage.set(KEYS.ALL_DAILY, allDailyExpenses); }, [allDailyExpenses, KEYS.ALL_DAILY, isLoading]);
    useEffect(() => { if (!isLoading) storage.set(KEYS.ALL_FUTURE, allFutureExpenses); }, [allFutureExpenses, KEYS.ALL_FUTURE, isLoading]);

  // Handlers for budget creation, update, and deletion
  const handleSaveNewBudget = (newBudgetData: Omit<BudgetRecord, 'id'>) => {
    const newBudget: BudgetRecord = {
        ...newBudgetData,
        id: Date.now().toString(),
    };
    const updatedBudgets = [...savedBudgets, newBudget];
    setSavedBudgets(updatedBudgets);
  };

  const handleUpdateBudget = (updatedBudget: BudgetRecord) => {
    setSavedBudgets(prev => prev.map(b => b.id === updatedBudget.id ? updatedBudget : b));
  };
  
  const openDeleteModal = (budget: BudgetRecord) => {
    setBudgetToDelete(budget);
    setIsDeleteModalOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (budgetToDelete) {
      const newBudgets = savedBudgets.filter(b => b.id !== budgetToDelete.id);
      setSavedBudgets(newBudgets);
      
      setIsDeleteModalOpen(false);
      setBudgetToDelete(null);
    }
  };

  const handleCreateNewBudget = () => {
    setEditingBudget(null);
    setIsCreateModalOpen(true);
  };

  const handleEditBudget = (budget: BudgetRecord) => {
    setEditingBudget(budget);
    setIsCreateModalOpen(true);
  };
  
  const handleForceCreateBudget = () => {
    if (periodStartDate && periodEndDate) {
      setForceCreateInfo({ startDate: periodStartDate, endDate: periodEndDate });
      setIsForceCreateModalOpen(true);
    } else {
      alert("No hay un ciclo de pago activo configurado para crear un presupuesto.")
    }
  };

  const handleConfirmForceCreate = () => {
    if (activeCycleConfig && periodStartDate && periodEndDate) {
      const allExpensesInCycle: { [date: string]: DailyExpense[] } = { ...currentDailyExpenses };

      // Add future expenses to the daily list for calculation
      for (const fe of currentFutureExpenses) {
        let occurrenceDate = new Date(`${fe.startDate}T00:00:00`);
        const feEndDate = fe.endDate ? new Date(fe.endDate) : null;
        
        while(occurrenceDate <= periodEndDate && (!feEndDate || occurrenceDate <= feEndDate)) {
             if (occurrenceDate >= periodStartDate) {
                const dateKey = `${occurrenceDate.getFullYear()}-${(occurrenceDate.getMonth() + 1).toString().padStart(2, '0')}-${occurrenceDate.getDate().toString().padStart(2, '0')}`;
                
                const dailyExp: DailyExpense = { id: `future-${fe.id}-${dateKey}`, note: fe.note, amount: fe.amount, categoryId: fe.categoryId };
                allExpensesInCycle[dateKey] = [...(allExpensesInCycle[dateKey] || []), dailyExp];
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

      const categoryAmounts = new Map<string, number>();
      Object.values(allExpensesInCycle).flat().forEach(exp => {
        const dailyExpense = exp as DailyExpense;
        categoryAmounts.set(dailyExpense.categoryId, (categoryAmounts.get(dailyExpense.categoryId) || 0) + dailyExpense.amount);
      });
      
      const newCategories = INITIAL_CATEGORIES.map(cat => ({
        ...cat,
        amount: categoryAmounts.get(cat.id) || 0,
      }));
      
      const totalAllocated = newCategories.filter(c => c.id !== 'savings').reduce((sum, c) => sum + c.amount, 0);
      const savings = Math.max(0, activeCycleConfig.income - totalAllocated);
      const savingsCategoryIndex = newCategories.findIndex(c => c.id === 'savings');
      if (savingsCategoryIndex > -1) {
        newCategories[savingsCategoryIndex].amount = savings;
      }

      const today = new Date();
      const newBudget: Omit<BudgetRecord, 'id'> = {
        name: `Presupuesto Parcial ${today.toLocaleDateString('es-ES')}`,
        totalIncome: activeCycleConfig.income,
        categories: newCategories,
        dateSaved: today.toISOString(),
        frequency: activeCycleConfig.frequency,
      };

      handleSaveNewBudget(newBudget);
      setActiveTab('history'); // Navigate to history to see the new budget
    }
  };

  const backgroundUrl = useMemo(() => {
    if (!userProfile?.background || userProfile.background === 'default') return null;
    if (userProfile.background.startsWith('data:')) return userProfile.background;
    switch(userProfile.background) {
        case 'beach': return 'https://images.unsplash.com/photo-1507525428034-b723a996f6ea?q=80&w=1080&auto=format&fit=crop';
        case 'snow': return 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?q=80&w=1080&auto=format&fit=crop';
        case 'city': return 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=1080&auto=format&fit=crop';
        default: return null;
    }
  }, [userProfile?.background]);

  const backgroundActive = !!backgroundUrl;

  if (isLoading) {
    return null; // The index.html spinner is showing.
  }

  return (
    <>
        {backgroundActive && (
            <div className="fixed inset-0 -z-10">
                <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                style={{ backgroundImage: `url(${backgroundUrl})` }}
                />
                <div className="absolute inset-0 bg-black/50" />
            </div>
        )}
        <div className={`text-gray-900 dark:text-neutral-100 min-h-screen transition-colors duration-300 ${backgroundActive ? 'bg-transparent' : 'bg-gray-50 dark:bg-neutral-900'}`}>
            <Header activeTab={activeTab} onTabChange={setActiveTab} onMenuClick={() => setIsMenuOpen(true)} />
            <SideMenu 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                currentUser={currentUser} 
                onLogout={onLogout}
                avatarId={userProfile?.avatarId || '0'}
                onOpenProfileEditor={() => setIsProfileModalOpen(true)}
                theme={theme}
                onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            />
            <main className="container mx-auto px-4 md:px-8 py-8 pb-24 md:pb-8">
                {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                    <CurrentPeriodSpending 
                        spentByCategory={currentPeriodSpending} 
                        periodStartDate={periodStartDate}
                        periodEndDate={periodEndDate}
                        />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                    <DashboardNotifications 
                        allDailyExpenses={allDailyExpenses}
                        allFutureExpenses={allFutureExpenses}
                        categories={INITIAL_CATEGORIES}
                        cycleProfiles={cycleProfiles}
                    />
                    <HistoryPanel
                        budgets={savedBudgets}
                        activeBudgetId={null}
                        onOpenDeleteModal={openDeleteModal}
                        onCreateNew={handleCreateNewBudget}
                        onEditBudget={handleEditBudget}
                    />
                    </div>
                </div>
                )}
                {activeTab === 'history' && (
                    <HistoryView 
                        budgets={savedBudgets} 
                        globalSavings={globalSavings}
                        onUpdateGlobalSavings={setGlobalSavings}
                        onEditBudget={handleEditBudget}
                        onOpenDeleteModal={openDeleteModal}
                    />
                )}
                {activeTab === 'expenses' && (
                <DailyExpenseView
                    expenses={currentDailyExpenses}
                    setExpenses={setCurrentDailyExpenses}
                    categories={INITIAL_CATEGORIES}
                    onForceCreateBudget={handleForceCreateBudget}
                    futureExpenses={currentFutureExpenses}
                    setFutureExpenses={setCurrentFutureExpenses}
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
            
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

            <BudgetEditorModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleSaveNewBudget}
                onUpdate={handleUpdateBudget}
                budget={editingBudget}
            />
            <ForceCreateBudgetModal
                isOpen={isForceCreateModalOpen}
                onClose={() => setIsForceCreateModalOpen(false)}
                onConfirm={handleConfirmForceCreate}
                cycleStartDate={forceCreateInfo?.startDate || null}
                cycleEndDate={forceCreateInfo?.endDate || null}
            />
            {budgetToDelete && (
                <DeleteConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    budgetName={budgetToDelete.name}
                    budgetDate={budgetToDelete.dateSaved}
                />
            )}
            <ProfileCustomizationModal 
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                currentAvatarId={userProfile?.avatarId || '0'}
                onSelectAvatar={handleUpdateAvatar}
                currentBackground={userProfile?.background || 'default'}
                onSelectBackground={handleUpdateBackground}
            />
        </div>
    </>
  );
};
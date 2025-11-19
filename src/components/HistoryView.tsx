import React, { useMemo, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BudgetRecord, PayCycleFrequency } from '../types';
import { BudgetChart } from './BudgetChart';
import { GlobalSavingsCard } from './GlobalSavingsCard';
import { SummaryCard } from './SummaryCard';
import { BudgetComparison } from './BudgetComparison';
import { BudgetPDFLayout } from './BudgetPDFLayout';

// Global libraries are accessed via the `window` object, so declarations are not needed here.

interface HistoryViewProps {
  budgets: BudgetRecord[];
  globalSavings: number;
  onUpdateGlobalSavings: (newValue: number) => void;
  onEditBudget: (budget: BudgetRecord) => void;
  onOpenDeleteModal: (budget: BudgetRecord) => void;
}

const pluralFrequencyLabels: Record<PayCycleFrequency, string> = {
    semanal: 'Semanales',
    quincenal: 'Quincenales',
    mensual: 'Mensuales',
    anual: 'Anuales'
};

export const HistoryView: React.FC<HistoryViewProps> = ({ 
  budgets, 
  globalSavings, 
  onUpdateGlobalSavings,
  onEditBudget,
  onOpenDeleteModal,
}) => {
  const sortedBudgets = useMemo(() => [...budgets].sort((a, b) => new Date(b.dateSaved).getTime() - new Date(a.dateSaved).getTime()), [budgets]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(sortedBudgets.length > 0 ? sortedBudgets[0].id : null);
  
  // Effect to handle selection after a budget is deleted
  useEffect(() => {
    // If a budget is selected but it no longer exists in the list (it was deleted)
    if (selectedBudgetId && !budgets.some(b => b.id === selectedBudgetId)) {
      // If there are other budgets, select the newest one. Otherwise, select null.
      setSelectedBudgetId(sortedBudgets.length > 0 ? sortedBudgets[0].id : null);
    }
    // If no budget is selected but there are budgets available, select the newest one.
    else if (!selectedBudgetId && sortedBudgets.length > 0) {
       setSelectedBudgetId(sortedBudgets.length > 0 ? sortedBudgets[0].id : null);
    }
  }, [budgets, sortedBudgets, selectedBudgetId]);


  const selectedBudget = useMemo(() => {
    return budgets.find(b => b.id === selectedBudgetId);
  }, [budgets, selectedBudgetId]);

  const previousBudget = useMemo(() => {
    if (!selectedBudget) return null;
    const currentIndex = sortedBudgets.findIndex(b => b.id === selectedBudget.id);
    if (currentIndex > -1 && currentIndex < sortedBudgets.length -1) {
      return sortedBudgets[currentIndex + 1];
    }
    return null;
  }, [sortedBudgets, selectedBudget]);

  const chartData = useMemo(() => {
    if (!selectedBudget) return [];
    return selectedBudget.categories.map(cat => ({
      name: cat.name,
      value: cat.amount,
      fill: cat.color,
    })).filter(cat => cat.value > 0);
  }, [selectedBudget]);
  
  const totalAllocated = useMemo(() => {
    if (!selectedBudget) return 0;
    return selectedBudget.categories.reduce((sum, cat) => sum + cat.amount, 0);
  }, [selectedBudget]);

  const groupedBudgets = useMemo(() => {
    return sortedBudgets.reduce((acc, budget) => {
        const freq = budget.frequency || 'mensual';
        if (!acc[freq]) {
            acc[freq] = [];
        }
        acc[freq].push(budget);
        return acc;
    }, {} as Record<PayCycleFrequency, BudgetRecord[]>);
  }, [sortedBudgets]);

  const frequencies: PayCycleFrequency[] = ['semanal', 'quincenal', 'mensual', 'anual'];

  const handleDownloadPdf = () => {
    if (typeof (window as any).html2canvas === 'undefined' || typeof (window as any).jspdf === 'undefined') {
      alert("Las librerías para exportar a PDF no se pudieron cargar. Por favor, revisa tu conexión e inténtalo de nuevo.");
      return;
    }
    if (!selectedBudget) return;

    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'absolute';
    pdfContainer.style.left = '-9999px'; // Position off-screen
    pdfContainer.style.top = '-9999px';
    document.body.appendChild(pdfContainer);

    const root = ReactDOM.createRoot(pdfContainer);
    root.render(<BudgetPDFLayout budget={selectedBudget} />);

    setTimeout(() => { // Timeout to ensure content is fully rendered
        const content = pdfContainer.querySelector('#pdf-content') as HTMLElement;
        if (content) {
            (window as any).html2canvas(content, {
                scale: 2, // Improve resolution
                useCORS: true, 
                backgroundColor: null,
            }).then((canvas: any) => {
                const imgData = canvas.toDataURL('image/png');
                const { jsPDF } = (window as any).jspdf;
                
                // A4 dimensions in points: 595.28 x 841.89
                const pdfWidth = 595.28;
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'pt',
                    format: 'a4'
                });

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`presupuesto-${selectedBudget.name.replace(/\s/g, '_')}.pdf`);

                // Cleanup
                root.unmount();
                document.body.removeChild(pdfContainer);
            });
        }
    }, 500);
  };
  
  const handleDownloadCsv = () => {
    if (!selectedBudget) return;
    
    const balance = selectedBudget.totalIncome - totalAllocated;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `"Presupuesto: ${selectedBudget.name}"\r\n`;
    csvContent += `"Fecha: ${new Date(selectedBudget.dateSaved).toLocaleDateString('es-ES')}"\r\n\r\n`;
    csvContent += "Categoría,Monto,Porcentaje del Ingreso\r\n";

    selectedBudget.categories.forEach(cat => {
        const percentage = selectedBudget.totalIncome > 0 ? (cat.amount / selectedBudget.totalIncome) * 100 : 0;
        csvContent += `"${cat.name}",${cat.amount.toFixed(2)},"${percentage.toFixed(2)}%"\r\n`;
    });

    csvContent += `\r\nResumen\r\n`;
    csvContent += `"Ingreso Total",${selectedBudget.totalIncome.toFixed(2)}\r\n`;
    csvContent += `"Total Gastado",${totalAllocated.toFixed(2)}\r\n`;
    csvContent += `"Balance Final",${balance.toFixed(2)}\r\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `presupuesto-${selectedBudget.name.replace(/\s/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadXlsx = () => {
    if (typeof (window as any).XLSX === 'undefined') {
        alert("La librería para exportar a Excel no se pudo cargar. Por favor, revisa tu conexión e inténtalo de nuevo.");
        return;
    }
    if (!selectedBudget) return;

    const XLSX = (window as any).XLSX;
    const balance = selectedBudget.totalIncome - totalAllocated;

    const header = ["Categoría", "Monto", "Porcentaje del Ingreso"];
    const data = selectedBudget.categories.map(cat => {
        const percentage = selectedBudget.totalIncome > 0 ? (cat.amount / selectedBudget.totalIncome) * 100 : 0;
        return [cat.name, cat.amount, `${percentage.toFixed(2)}%`];
    });

    const summary = [
        [], // Spacer
        ["Resumen"],
        ["Ingreso Total", selectedBudget.totalIncome],
        ["Total Gastado", totalAllocated],
        ["Balance Final", balance]
    ];
    
    const aoa = [
        ["Presupuesto:", selectedBudget.name],
        ["Fecha:", new Date(selectedBudget.dateSaved).toLocaleDateString('es-ES')],
        [],
        header,
        ...data,
        ...summary
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resumen Presupuesto");

    XLSX.writeFile(wb, `presupuesto-${selectedBudget.name.replace(/\s/g, '_')}.xlsx`);
  };


  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="md:col-span-2 lg:col-span-1">
          <GlobalSavingsCard value={globalSavings} onSave={onUpdateGlobalSavings} />
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-neutral-100 border-b pb-4 border-gray-200 dark:border-neutral-700">Explorar Historial</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budget List */}
          <div className="lg:col-span-1 self-start">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-neutral-200">Presupuestos Guardados</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {budgets.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-neutral-400 p-3 bg-gray-100 dark:bg-neutral-700/50 rounded-lg">No hay presupuestos guardados.</p>
              ) : (
                frequencies.map(freq => (
                  groupedBudgets[freq] && groupedBudgets[freq].length > 0 && (
                    <div key={freq}>
                        <h4 className="text-base font-semibold text-blue-600 dark:text-blue-400 capitalize mb-2 sticky top-0 bg-white dark:bg-neutral-800 py-1">{pluralFrequencyLabels[freq]}</h4>
                        <div className="grid grid-cols-1 gap-3">
                            {groupedBudgets[freq].map(budget => (
                              <div 
                                  key={budget.id}
                                  className={`p-3 rounded-xl transition-all duration-200 border-2 ${selectedBudgetId === budget.id ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-500' : 'bg-gray-100 dark:bg-neutral-700 border-transparent active:border-gray-300 dark:active:border-neutral-600'}`}
                              >
                                <div className="flex justify-between items-center">
                                    <div 
                                      className="flex-grow cursor-pointer"
                                      onClick={() => setSelectedBudgetId(budget.id)}
                                    >
                                        <p className={`font-bold ${selectedBudgetId === budget.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-neutral-200'}`}>{budget.name}</p>
                                        <p className={`text-xs ${selectedBudgetId === budget.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-neutral-400'}`}>
                                            {new Date(budget.dateSaved).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditBudget(budget);
                                        }}
                                        className={`text-sm p-2 h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${selectedBudgetId === budget.id ? 'text-blue-600 dark:text-blue-500 active:bg-blue-200 dark:active:bg-blue-500/20' : 'text-gray-400 dark:text-neutral-500/70 active:text-blue-500 active:bg-blue-100 dark:active:bg-blue-500/10'}`}
                                        aria-label={`Editar ${budget.name}`}
                                      >
                                          <i className="fa-solid fa-pencil"></i>
                                      </button>
                                       <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              onOpenDeleteModal(budget);
                                          }}
                                          className={`text-sm p-2 h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${selectedBudgetId === budget.id ? 'text-red-500 active:bg-red-200 dark:active:bg-red-500/20' : 'text-red-400 dark:text-red-500/70 active:text-red-500 active:bg-red-100 dark:active:bg-red-500/10'}`}
                                          aria-label={`Eliminar ${budget.name}`}
                                        >
                                          <i className="fa-solid fa-trash-can"></i>
                                      </button>
                                    </div>
                                </div>
                              </div>
                            ))}
                        </div>
                    </div>
                  )
                ))
              )}
            </div>
          </div>

          {/* Selected Budget Details */}
          <div className="lg:col-span-2">
            {selectedBudget ? (
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-neutral-700 pb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-100">Resumen de {selectedBudget.name}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SummaryCard title="Ingreso Total" value={`$${selectedBudget.totalIncome.toFixed(2)}`} icon="fa-solid fa-dollar-sign" color="text-green-500" bgColor="bg-green-100 dark:bg-green-900/50 text-green-500 dark:text-green-400" />
                  <SummaryCard title="Total Gastado" value={`$${totalAllocated.toFixed(2)}`} icon="fa-solid fa-coins" color="text-amber-500" bgColor="bg-amber-100 dark:bg-amber-900/50 text-amber-500 dark:text-amber-400" />
                  <SummaryCard title="Balance Final" value={`$${(selectedBudget.totalIncome - totalAllocated).toFixed(2)}`} icon="fa-solid fa-wallet" color="text-blue-500" bgColor="bg-blue-100 dark:bg-blue-900/50 text-blue-500 dark:text-blue-400" />
                </div>
                
                <div className="bg-gray-100 dark:bg-neutral-700/50 p-4 rounded-2xl border border-gray-200 dark:border-neutral-700">
                    <h4 className="text-base font-bold mb-3 text-gray-800 dark:text-neutral-200">Opciones de Exportación</h4>
                     <div className="flex flex-wrap gap-3">
                         <button
                            onClick={handleDownloadPdf}
                            className="flex-1 bg-red-100 text-red-700 dark:bg-red-800/50 dark:text-red-300 active:bg-red-200 dark:active:bg-red-700/50 font-semibold py-2 px-4 rounded-lg text-sm flex items-center justify-center transition-colors min-w-[120px]"
                          >
                              <i className="fa-solid fa-file-pdf mr-2"></i>
                              Exportar PDF
                          </button>
                          <button
                            onClick={handleDownloadCsv}
                            className="flex-1 bg-green-100 text-green-700 dark:bg-green-800/50 dark:text-green-300 active:bg-green-200 dark:active:bg-green-700/50 font-semibold py-2 px-4 rounded-lg text-sm flex items-center justify-center transition-colors min-w-[120px]"
                          >
                              <i className="fa-solid fa-file-csv mr-2"></i>
                              Exportar CSV
                          </button>
                          <button
                            onClick={handleDownloadXlsx}
                            className="flex-1 bg-teal-100 text-teal-700 dark:bg-teal-800/50 dark:text-teal-300 active:bg-teal-200 dark:active:bg-teal-700/50 font-semibold py-2 px-4 rounded-lg text-sm flex items-center justify-center transition-colors min-w-[120px]"
                          >
                              <i className="fa-solid fa-file-excel mr-2"></i>
                              Exportar Excel
                          </button>
                     </div>
                </div>

                {previousBudget && <BudgetComparison current={selectedBudget} previous={previousBudget} />}
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-center">
                    <div className="h-[300px]">
                        <BudgetChart data={chartData} totalIncome={selectedBudget.totalIncome} />
                    </div>
                    <ul className="space-y-3">
                    {selectedBudget.categories.map(cat => {
                        const percentage = selectedBudget.totalIncome > 0 ? (cat.amount / selectedBudget.totalIncome) * 100 : 0;
                        return (
                        <li key={cat.id} className="flex justify-between items-center p-2 rounded-lg">
                            <div className="flex items-center space-x-3">
                            <span className="w-8 h-8 flex items-center justify-center rounded-full text-white text-sm" style={{backgroundColor: cat.color}}>
                                <i className={cat.icon}></i>
                            </span>
                            <span className="font-medium text-sm text-gray-600 dark:text-neutral-300">{cat.name}</span>
                            </div>
                            <div className="text-right">
                            <p className="font-semibold text-base text-gray-800 dark:text-neutral-100">${cat.amount.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 dark:text-neutral-400">{percentage.toFixed(1)}%</p>
                            </div>
                        </li>
                        )
                    })}
                    </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-10 bg-gray-100 dark:bg-neutral-700/50 rounded-2xl">
                  <i className="fa-solid fa-folder-open text-5xl text-gray-400 dark:text-neutral-500 mb-4"></i>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-neutral-200">No hay datos que mostrar</h3>
                  <p className="text-gray-500 dark:text-neutral-400">Selecciona un presupuesto de la lista para ver sus detalles.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
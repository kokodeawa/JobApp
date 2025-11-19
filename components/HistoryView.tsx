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

      <div className="bg-neutral-800 p-6 rounded-3xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-neutral-100 border-b pb-4 border-neutral-700">Explorar Historial</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budget List */}
          <div className="lg:col-span-1 self-start">
            <h3 className="text-lg font-semibold mb-3 text-neutral-200">Presupuestos Guardados</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {budgets.length === 0 ? (
                <p className="text-sm text-neutral-400 p-3 bg-neutral-700/50 rounded-lg">No hay presupuestos guardados.</p>
              ) : (
                frequencies.map(freq => (
                  groupedBudgets[freq] && groupedBudgets[freq].length > 0 && (
                    <div key={freq}>
                        <h4 className="text-base font-semibold text-blue-400 capitalize mb-2 sticky top-0 bg-neutral-800 py-1">{pluralFrequencyLabels[freq]}</h4>
                        <div className="grid grid-cols-1 gap-3">
                            {groupedBudgets
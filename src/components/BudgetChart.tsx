import React from 'react';

interface ChartData {
  name: string;
  value: number;
  fill: string;
}

interface BudgetChartProps {
  data: ChartData[];
  totalIncome: number;
}

export const BudgetChart: React.FC<BudgetChartProps> = ({ data, totalIncome }) => {
  const totalAllocated = data.reduce((sum, entry) => sum + entry.value, 0);

  if (data.length === 0 || totalAllocated === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-neutral-500">
        <p>Añade gastos para ver la distribución.</p>
      </div>
    );
  }

  const totalData = {
      name: 'Total Asignado',
      value: totalAllocated,
      percentage: totalIncome > 0 ? (totalAllocated / totalIncome) * 100 : 0,
  };

  return (
    <div className="space-y-4 pt-2 h-full overflow-y-auto pr-2">
      {data.map((entry, index) => {
        const percentage = totalIncome > 0 ? (entry.value / totalIncome) * 100 : 0;
        return (
          <div key={index} aria-label={`${entry.name}: ${entry.value.toFixed(2)} (${percentage.toFixed(1)}% del ingreso)`}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center space-x-2">
                 <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }}></span>
                 <span className="text-sm font-medium text-gray-600 dark:text-neutral-300">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-gray-800 dark:text-neutral-100">${entry.value.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2.5">
              <div 
                className="h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, backgroundColor: entry.fill }}
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
          </div>
        );
      })}

      {data.length > 0 && <hr className="border-gray-200 dark:border-neutral-700 !my-5" />}
      
      <div aria-label={`${totalData.name}: ${totalData.value.toFixed(2)} (${totalData.percentage.toFixed(1)}% del ingreso)`}>
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center space-x-2">
             <span className="text-sm font-bold text-gray-800 dark:text-neutral-100">{totalData.name}</span>
          </div>
          <span className="text-sm font-bold text-gray-800 dark:text-neutral-100">${totalData.value.toFixed(2)}</span>
        </div>
        <div 
            className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2.5 flex overflow-hidden"
            role="progressbar"
            aria-valuenow={totalData.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            title={`Total Asignado: ${totalData.percentage.toFixed(1)}%`}
        >
          {data.map((entry, index) => {
            const percentageOfTotalIncome = totalIncome > 0 ? (entry.value / totalIncome) * 100 : 0;
            if (percentageOfTotalIncome === 0) return null;
            return (
              <div
                key={`total-segment-${index}`}
                className="h-full"
                style={{
                  width: `${percentageOfTotalIncome}%`,
                  backgroundColor: entry.fill,
                  transition: 'width 0.5s ease-in-out'
                }}
                title={`${entry.name}: ${percentageOfTotalIncome.toFixed(1)}%`}
              ></div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
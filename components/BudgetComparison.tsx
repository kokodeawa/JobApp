

import React from 'react';
import { BudgetRecord } from '../types';

interface BudgetComparisonProps {
  current: BudgetRecord;
  previous: BudgetRecord;
}

const DifferenceIndicator: React.FC<{ value: number; unit?: string; invertColors?: boolean }> = ({ value, unit = '$', invertColors = false }) => {
  const isPositive = value > 0;
  const isNegative = value < 0;
  let color = 'text-neutral-400';
  let icon = 'fa-solid fa-minus';
  
  if (isPositive) {
    color = invertColors ? 'text-red-400' : 'text-green-400';
    icon = 'fa-solid fa-arrow-trend-up';
  } else if (isNegative) {
    color = invertColors ? 'text-green-400' : 'text-red-400';
    icon = 'fa-solid fa-arrow-trend-down';
  }

  const formattedValue = `${isPositive ? '+' : ''}${unit}${value.toFixed(2)}`;

  return (
    <span className={`font-semibold ${color} flex items-center gap-2 text-sm`}>
       <i className={`${icon} text-xs`}></i>
       {formattedValue}
    </span>
  );
};

export const BudgetComparison: React.FC<BudgetComparisonProps> = ({ current, previous }) => {
  const totalAllocatedCurrent = current.categories.reduce((sum, cat) => sum + cat.amount, 0);
  const totalAllocatedPrevious = previous.categories.reduce((sum, cat) => sum + cat.amount, 0);
  
  const incomeDiff = current.totalIncome - previous.totalIncome;
  const allocatedDiff = totalAllocatedCurrent - totalAllocatedPrevious;
  
  const balanceCurrent = current.totalIncome - totalAllocatedCurrent;
  const balancePrevious = previous.totalIncome - totalAllocatedPrevious;
  const balanceDiff = balanceCurrent - balancePrevious;

  const categoryChanges = current.categories.map(currentCat => {
    const previousCat = previous.categories.find(pCat => pCat.id === currentCat.id);
    const previousAmount = previousCat ? previousCat.amount : 0;
    const difference = currentCat.amount - previousAmount;
    return { ...currentCat, difference, previousAmount };
  }).filter(cat => cat.difference !== 0);

  return (
    <div className="bg-neutral-700/50 p-4 rounded-2xl mt-6 border border-neutral-700">
      <h4 className="text-base font-bold mb-4 text-neutral-200">Comparación con <span className="text-blue-400">{previous.name}</span></h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-neutral-800 rounded-xl">
          <p className="text-xs text-neutral-400 mb-1">Ingresos</p>
          <DifferenceIndicator value={incomeDiff} />
        </div>
        <div className="p-3 bg-neutral-800 rounded-xl">
          <p className="text-xs text-neutral-400 mb-1">Gastos Asignados</p>
          <DifferenceIndicator value={allocatedDiff} invertColors />
        </div>
        <div className="p-3 bg-neutral-800 rounded-xl">
          <p className="text-xs text-neutral-400 mb-1">Balance</p>
          <DifferenceIndicator value={balanceDiff} />
        </div>
      </div>
      
      {categoryChanges.length > 0 && (
        <div>
          <h5 className="font-semibold mb-2 text-sm text-neutral-300">Cambios por Categoría</h5>
          <ul className="space-y-2">
            {categoryChanges.map(cat => (
              <li key={cat.id} className="flex justify-between items-center p-2 rounded-lg bg-neutral-800 text-sm">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full text-white text-xs" style={{ backgroundColor: cat.color }}>
                    <i className={cat.icon}></i>
                  </span>
                  <span className="font-medium text-neutral-200">{cat.name}</span>
                </div>
                <div className="text-right flex items-center gap-3">
                    <span className="text-xs text-neutral-500">${cat.previousAmount.toFixed(2)} &rarr; ${cat.amount.toFixed(2)}</span>
                    <DifferenceIndicator value={cat.difference} invertColors />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
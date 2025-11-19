import React, { useState } from 'react';
import { Category } from '../types';

interface CategoryInputProps {
  category: Category;
  totalIncome: number;
  onAmountChange: (id: string, value: number) => void;
  disabled?: boolean;
}

export const CategoryInput: React.FC<CategoryInputProps> = ({ category, onAmountChange, totalIncome, disabled = false }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Permite que el campo esté vacío, tratándolo como 0.
    if (val === '') {
        onAmountChange(category.id, 0);
        return;
    }
    const num = parseFloat(val);
    // Solo actualiza el estado si es un número válido y no negativo.
    if (!isNaN(num) && num >= 0) {
        onAmountChange(category.id, num);
    }
  };

  const percentage = totalIncome > 0 ? (category.amount / totalIncome) * 100 : 0;

  return (
    <div className="bg-neutral-800 p-5 rounded-2xl border border-neutral-700">
      <div className="flex justify-between items-center mb-4">
        <label htmlFor={category.id} className={`font-semibold text-neutral-200 flex items-center text-lg ${disabled ? 'opacity-70' : ''}`}>
          <i className={`${category.icon} mr-3 fa-fw text-xl`} style={{ color: category.color }}></i>
          {category.name}
        </label>
         <span className="font-bold text-neutral-400 text-base" aria-label="Porcentaje del total">
             {percentage.toFixed(1)}%
         </span>
      </div>
      <div className="flex items-center bg-neutral-700 border-2 border-neutral-600 focus-within:border-blue-500 rounded-xl transition-colors has-[:disabled]:bg-neutral-700/50 has-[:disabled]:cursor-not-allowed">
        <span className="pl-5 text-xl text-neutral-400" aria-hidden="true">
            $
        </span>
        <input
            type="number"
            id={category.id}
            value={isFocused && category.amount === 0 ? '' : category.amount}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full p-4 pl-3 text-2xl font-bold text-white text-left bg-transparent border-0 focus:ring-0 focus:outline-none disabled:cursor-not-allowed"
            min="0"
            step="10"
            placeholder="0"
            aria-label={`Monto para ${category.name}`}
            disabled={disabled}
        />
      </div>
    </div>
  );
};
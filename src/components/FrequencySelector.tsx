import React from 'react';
import { PayCycleFrequency } from '../types';

interface FrequencySelectorProps {
  selected: PayCycleFrequency;
  onChange: (frequency: PayCycleFrequency) => void;
}

const frequencyOptions: { value: PayCycleFrequency; label: string }[] = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'anual', label: 'Anual' },
];

export const FrequencySelector: React.FC<FrequencySelectorProps> = ({ selected, onChange }) => {
  return (
    <div>
        <label className="text-xl font-bold text-gray-700 dark:text-neutral-300 mb-3 block">
            Frecuencia del Presupuesto
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-gray-100 dark:bg-neutral-700 rounded-xl">
        {frequencyOptions.map(({ value, label }) => (
            <button
            key={value}
            onClick={() => onChange(value)}
            className={`w-full text-center px-4 py-2 font-semibold rounded-lg transition-all duration-200 text-sm md:text-base ${
                selected === value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-transparent text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
            }`}
            >
            {label}
            </button>
        ))}
        </div>
    </div>
  );
};
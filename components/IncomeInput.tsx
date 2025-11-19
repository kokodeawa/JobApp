import React, { useState } from 'react';

interface IncomeInputProps {
    value: number;
    onChange: (value: number) => void;
    label: string;
}

export const IncomeInput: React.FC<IncomeInputProps> = ({ value, onChange, label }) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Permite que el campo esté vacío, tratándolo como 0.
        if (val === '') {
            onChange(0);
            return;
        }
        const num = parseFloat(val);
        // Solo actualiza el estado si es un número válido y no negativo.
        if (!isNaN(num) && num >= 0) {
            onChange(num);
        }
    };

    return (
        <div className="space-y-3">
            <label htmlFor="total-income" className="text-xl font-bold text-neutral-300">
                {label}
            </label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-2xl text-neutral-400">
                    $
                </span>
                <input
                    type="number"
                    id="total-income"
                    value={isFocused && value === 0 ? '' : value}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full p-5 pl-14 text-3xl font-bold bg-neutral-800 border-2 border-neutral-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-white"
                    placeholder="0"
                    min="0"
                />
            </div>
        </div>
    );
};

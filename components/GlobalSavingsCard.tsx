import React, { useState, useEffect } from 'react';

interface GlobalSavingsCardProps {
  value: number;
  onSave: (newValue: number) => void;
}

export const GlobalSavingsCard: React.FC<GlobalSavingsCardProps> = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toFixed(2));

  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toFixed(2));
    }
  }, [value, isEditing]);

  const handleSave = () => {
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onSave(numValue);
    } else {
      // Revert if invalid
      setInputValue(value.toFixed(2));
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(value.toFixed(2));
    }
  };


  return (
    <div className="bg-neutral-800 p-5 rounded-3xl shadow-lg flex flex-col items-start space-y-3">
      <div className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center bg-teal-900/50 text-teal-400`}>
        <i className="fa-solid fa-vault"></i>
      </div>
      <div className="text-left w-full">
        <div className="flex justify-between items-center">
             <p className="text-sm text-neutral-400 font-medium">Ahorro Global</p>
             <button onClick={() => setIsEditing(!isEditing)} className="text-xs text-neutral-500 active:text-blue-400">
                <i className={`fa-solid ${isEditing ? 'fa-times' : 'fa-pencil'}`}></i>
             </button>
        </div>
        {isEditing ? (
            <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="text-3xl font-bold text-neutral-100 bg-transparent w-full focus:outline-none focus:ring-0 border-b border-blue-500"
                autoFocus
            />
        ) : (
            <p className="text-3xl font-bold text-neutral-100">${value.toFixed(2)}</p>
        )}
      </div>
    </div>
  );
};
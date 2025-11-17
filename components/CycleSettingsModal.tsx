
import React, { useState, useEffect } from 'react';
import { CycleProfile, PayCycleConfig, PayCycleFrequency } from '../types';
import { CustomSelect } from './CustomSelect';

const toISODateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const colors = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#a855f7', // purple-500
    '#ec4899', // pink-500
];

interface CycleEditorProps {
    profile: CycleProfile;
    onUpdate: (updatedProfile: CycleProfile) => void;
    onInitiateDelete: (id: string) => void;
    isExpanded: boolean;
    onExpandToggle: () => void;
}

const CycleEditor: React.FC<CycleEditorProps> = ({ profile, onUpdate, onInitiateDelete, isExpanded, onExpandToggle }) => {
    const [name, setName] = useState(profile.name);
    const [color, setColor] = useState(profile.color);

    // Config state
    const [frequency, setFrequency] = useState<PayCycleFrequency>(profile.config?.frequency || 'mensual');
    const [startDate, setStartDate] = useState<string>(profile.config?.startDate || toISODateString(new Date()));
    const [income, setIncome] = useState<string>(profile.config?.income?.toString() || '');
    
    useEffect(() => {
        setName(profile.name);
        setColor(profile.color);
        setFrequency(profile.config?.frequency || 'mensual');
        setStartDate(profile.config?.startDate || toISODateString(new Date()));
        setIncome(profile.config?.income?.toString() || '');
    }, [profile, isExpanded]);

    const handleSave = () => {
        const incomeNum = parseFloat(income);
        if (name.trim() === '') {
            alert("El nombre del calendario no puede estar vacío.");
            return;
        }
        
        const newConfig: PayCycleConfig | null = (startDate && !isNaN(incomeNum) && incomeNum >= 0)
            ? { frequency, startDate, income: incomeNum }
            : null;
        
        onUpdate({ ...profile, name: name.trim(), color, config: newConfig });
        onExpandToggle();
    };

    const frequencyOptions = [
        { value: 'semanal', label: 'Semanal' },
        { value: 'quincenal', label: 'Quincenal' },
        { value: 'mensual', label: 'Mensual' },
        { value: 'anual', label: 'Anual' },
    ];
    
    return (
        <div className="bg-neutral-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-grow">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: isExpanded ? color : profile.color }}></span>
                    <p className="font-semibold">{profile.name}</p>
                </div>
                <div className="flex items-center gap-1">
                     <button onClick={onExpandToggle} className="p-2 w-8 h-8 rounded-lg active:bg-neutral-600 text-blue-400"><i className={`fa-solid fa-chevron-down transition-transform ${isExpanded ? 'rotate-180' : ''}`}></i></button>
                     <button onClick={() => onInitiateDelete(profile.id)} className="p-2 w-8 h-8 rounded-lg active:bg-neutral-600 text-red-400"><i className="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-neutral-600 space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del Calendario" className="w-full p-2 bg-neutral-600 rounded" />
                    <div className="flex justify-around">
                        {colors.map(c => (
                            <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'ring-2 ring-white scale-110' : ''}`} style={{ backgroundColor: c }}></button>
                        ))}
                    </div>
                    <h4 className="font-bold text-sm pt-2">Configuración de Pagos (Opcional)</h4>
                    <CustomSelect options={frequencyOptions} value={frequency} onChange={(v) => setFrequency(v as PayCycleFrequency)} />
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-neutral-600 rounded" />
                    <input type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="Ingreso por ciclo" className="w-full p-2 bg-neutral-600 rounded" />
                    <button onClick={handleSave} className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg">Guardar Cambios</button>
                </div>
            )}
        </div>
    )
}


interface CycleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: CycleProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<CycleProfile[]>>;
  setActiveId: (id: string | null) => void;
  onInitiateDelete: (id: string) => void;
  initialExpandedId: string | null;
  onExpandedChange: (id: string | null) => void;
}

export const CycleSettingsModal: React.FC<CycleSettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    profiles, 
    setProfiles, 
    setActiveId, 
    onInitiateDelete,
    initialExpandedId,
    onExpandedChange
}) => {
    
    useEffect(() => {
        if (!isOpen) {
            onExpandedChange(null);
        }
    }, [isOpen]);
    
    const handleAddCycle = () => {
        const newCycle: CycleProfile = {
            id: Date.now().toString(),
            name: `Calendario ${profiles.length + 1}`,
            color: colors[profiles.length % colors.length],
            config: null,
        };
        const newProfiles = [...profiles, newCycle];
        setProfiles(newProfiles);
        setActiveId(newCycle.id);
        onExpandedChange(newCycle.id); // Expand the new one
    };

    const handleUpdateCycle = (updatedProfile: CycleProfile) => {
        setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    };

    const handleExpandToggle = (profileId: string) => {
        const newId = initialExpandedId === profileId ? null : profileId;
        onExpandedChange(newId);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-neutral-800 rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-neutral-100">Gestionar Calendarios</h2>
                <div className="space-y-3 flex-grow overflow-y-auto pr-2 -mr-2">
                    {profiles.map(profile => (
                        <CycleEditor
                            key={profile.id}
                            profile={profile}
                            onUpdate={handleUpdateCycle}
                            onInitiateDelete={onInitiateDelete}
                            isExpanded={initialExpandedId === profile.id}
                            onExpandToggle={() => handleExpandToggle(profile.id)}
                        />
                    ))}
                </div>
                {initialExpandedId === null && (
                     <div className="mt-4 pt-4 border-t border-neutral-700 space-y-3">
                        <button onClick={handleAddCycle} className="w-full bg-green-600 text-white font-bold py-2 rounded-lg">
                            <i className="fa-solid fa-plus mr-2"></i>Añadir Nuevo Calendario
                        </button>
                        <button onClick={onClose} className="w-full bg-neutral-600 text-white font-bold py-2 rounded-lg">Cerrar</button>
                    </div>
                )}
            </div>
        </div>
    );
};

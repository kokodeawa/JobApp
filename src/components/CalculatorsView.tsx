import React, { useState, useMemo } from 'react';
import { CustomSelect } from './CustomSelect';

type ActiveCalculator = 'goal' | 'work' | 'return' | 'standard';

const TimeToGoalCalculator: React.FC = () => {
    const [goal, setGoal] = useState('10000');
    const [current, setCurrent] = useState('1000');
    const [contribution, setContribution] = useState('200');
    const [frequency, setFrequency] = useState<'mensual' | 'quincenal' | 'semanal'>('mensual');

    const result = useMemo(() => {
        const goalNum = parseFloat(goal) || 0;
        const currentNum = parseFloat(current) || 0;
        const contributionNum = parseFloat(contribution) || 0;

        if (goalNum <= currentNum) {
            return { text: "¡Felicidades, ya has alcanzado tu meta!", date: null };
        }
        if (contributionNum <= 0) {
            return { text: "Necesitas un aporte positivo para alcanzar tu meta.", date: null };
        }

        const remaining = goalNum - currentNum;
        const contributionsNeeded = Math.ceil(remaining / contributionNum);

        const now = new Date();
        let targetDate = new Date(now);

        switch (frequency) {
            case 'semanal':
                targetDate.setDate(now.getDate() + contributionsNeeded * 7);
                break;
            case 'quincenal':
                targetDate.setDate(now.getDate() + contributionsNeeded * 14);
                break;
            case 'mensual':
                targetDate.setMonth(now.getMonth() + contributionsNeeded);
                break;
        }

        const diffTime = Math.abs(targetDate.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        
        let textResult = 'Alcanzarás tu meta en aprox. ';
        if (years > 0) textResult += `${years} año${years > 1 ? 's' : ''}`;
        if (years > 0 && months > 0) textResult += ` y `;
        if (months > 0) textResult += `${months} mes${months > 1 ? 'es' : ''}`;
        if (years === 0 && months === 0) textResult = `Alcanzarás tu meta en menos de un mes.`
        
        return { text: textResult.trim(), date: targetDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) };

    }, [goal, current, contribution, frequency]);
    
    const frequencyOptions = [
        { value: 'mensual', label: 'Mensual' },
        { value: 'quincenal', label: 'Quincenal' },
        { value: 'semanal', label: 'Semanal' },
    ];

    return (
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-1">Calculadora de Metas</h2>
            <p className="text-gray-500 dark:text-neutral-400 mb-6">Estima cuánto tiempo te tomará alcanzar tu objetivo de ahorro.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-neutral-300">Meta de Ahorro ($)</label>
                        <input type="number" value={goal} onChange={e => setGoal(e.target.value)} className="w-full mt-1 p-3 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-600 rounded-lg text-lg font-semibold" />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-neutral-300">Ahorro Actual ($)</label>
                        <input type="number" value={current} onChange={e => setCurrent(e.target.value)} className="w-full mt-1 p-3 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-600 rounded-lg text-lg font-semibold" />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-neutral-300">Aporte Periódico ($)</label>
                        <input type="number" value={contribution} onChange={e => setContribution(e.target.value)} className="w-full mt-1 p-3 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-600 rounded-lg text-lg font-semibold" />
                    </div>
                    <div>
                         <CustomSelect
                            label="Frecuencia del Aporte"
                            options={frequencyOptions}
                            value={frequency}
                            onChange={(val) => setFrequency(val as 'mensual' | 'quincenal' | 'semanal')}
                        />
                    </div>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <i className="fa-solid fa-flag-checkered text-4xl text-blue-500 dark:text-blue-400 mb-4"></i>
                    <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">{result.text}</p>
                    {result.date && <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">Fecha estimada: <span className="font-bold">{result.date}</span></p>}
                </div>
            </div>
        </div>
    );
};

const WorkCalculator: React.FC = () => {
    const [baseSalary, setBaseSalary] = useState('2000');
    const [payPeriod, setPayPeriod] = useState<'mensual' | 'quincenal' | 'semanal'>('mensual');
    const [normalHours, setNormalHours] = useState('160'); // Assuming a 40-hour week * 4
    const [overtimeHours, setOvertimeHours] = useState('0');
    const [nightHours, setNightHours] = useState('0');
    const [holidayHours, setHolidayHours] = useState('0');

    const calculation = useMemo(() => {
        const salary = parseFloat(baseSalary) || 0;
        if (salary <= 0) return null;

        let hoursInPeriod: number;
        switch (payPeriod) {
            case 'mensual': hoursInPeriod = 240; break; // 30 days * 8 hours
            case 'quincenal': hoursInPeriod = 120; break; // 15 days * 8 hours
            case 'semanal': hoursInPeriod = 40; break; // 5 days * 8 hours
        }

        const standardRate = salary / hoursInPeriod;

        const normal = (parseFloat(normalHours) || 0) * standardRate;
        
        // Multipliers can be adjusted based on local regulations
        const overtimePay = (parseFloat(overtimeHours) || 0) * standardRate * 1.5;
        const nightPay = (parseFloat(nightHours) || 0) * standardRate * 1.25;
        const holidayPay = (parseFloat(holidayHours) || 0) * standardRate * 2.0;

        const totalPay = normal + overtimePay + nightPay + holidayPay;

        return {
            standardRate: standardRate.toFixed(2),
            normalPay: normal.toFixed(2),
            overtimePay: overtimePay.toFixed(2),
            nightPay: nightPay.toFixed(2),
            holidayPay: holidayPay.toFixed(2),
            totalPay: totalPay.toFixed(2),
        };

    }, [baseSalary, payPeriod, normalHours, overtimeHours, nightHours, holidayHours]);
    
    const payPeriodOptions = [
        { value: 'mensual', label: 'Mensual' },
        { value: 'quincenal', label: 'Quincenal' },
        { value: 'semanal', label: 'Semanal' },
    ];

    return (
         <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-1">Calculadora Laboral</h2>
            <p className="text-gray-500 dark:text-neutral-400 mb-6">Calcula tu pago total basado en tu sueldo base y horas trabajadas.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-neutral-300">Sueldo Base ($)</label>
                        <input type="number" value={baseSalary} onChange={e => setBaseSalary(e.target.value)} className="w-full mt-1 p-3 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-600 rounded-lg text-lg font-semibold" />
                    </div>
                     <div>
                        <CustomSelect
                            label="Período de Pago"
                            options={payPeriodOptions}
                            value={payPeriod}
                            onChange={(val) => setPayPeriod(val as 'mensual' | 'quincenal' | 'semanal')}
                        />
                    </div>
                    <p className="text-xs text-center text-gray-500 dark:text-neutral-400 pt-2">Introduce las horas totales trabajadas en el período:</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-gray-700 dark:text-neutral-300">Horas Normales</label>
                            <input type="number" value={normalHours} onChange={e => setNormalHours(e.target.value)} className="w-full mt-1 p-3 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-600 rounded-lg text-lg font-semibold" />
                        </div>
                         <div>
                            <label className="text-sm font-bold text-gray-700 dark:text-neutral-300">Horas Extra (1.5x)</label>
                            <input type="number" value={overtimeHours} onChange={e => setOvertimeHours(e.target.value)} className="w-full mt-1 p-3 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-600 rounded-lg text-lg font-semibold" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 dark:text-neutral-300">Horas Nocturnas (1.25x)</label>
                            <input type="number" value={nightHours} onChange={e => setNightHours(e.target.value)} className="w-full mt-1 p-3 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-600 rounded-lg text-lg font-semibold" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 dark:text-neutral-300">Horas Feriado (2x)</label>
                            <input type="number" value={holidayHours} onChange={e => setHolidayHours(e.target.value)} className="w-full mt-1 p-3 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-600 rounded-lg text-lg font-semibold" />
                        </div>
                    </div>
                </div>
                 <div className="bg-green-100 dark:bg-green-900/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <i className="fa-solid fa-money-bill-wave text-4xl text-green-500 dark:text-green-400 mb-4"></i>
                    <p className="text-lg font-semibold text-green-800 dark:text-green-200">Pago Total Estimado</p>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">${calculation?.totalPay || '0.00'}</p>
                    {calculation && (
                        <div className="text-left mt-4 w-full text-xs space-y-1 text-green-700 dark:text-green-300">
                             <p className="text-center pb-1 mb-1 border-b border-green-200 dark:border-green-800">Tarifa por hora: ${calculation.standardRate}</p>
                             <p className="flex justify-between"><span>Pago Normal:</span> <strong>${calculation.normalPay}</strong></p>
                             <p className="flex justify-between"><span>Pago Extra:</span> <strong>${calculation.overtimePay}</strong></p>
                             <p className="flex justify-between"><span>Pago Nocturno:</span> <strong>${calculation.nightPay}</strong></p>
                             <p className="flex justify-between"><span>Pago Feriado:</span> <strong>${calculation.holidayPay}</strong></p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ReturnTimeCalculator: React.FC = () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const currentTime = now.toISOString().slice(11, 16);

    const [startDate, setStartDate] = useState(today);
    const [startTime, setStartTime] = useState(currentTime);
    const [durationHours, setDurationHours] = useState('1');
    const [durationMinutes, setDurationMinutes] = useState('0');

    const returnTime = useMemo(() => {
        if (!startDate || !startTime) {
            return { date: 'Inválido', time: 'Inválido' };
        }
        
        const startDateTime = new Date(`${startDate}T${startTime}`);
        if (isNaN(startDateTime.getTime())) {
            return { date: 'Inválido', time: 'Inválido' };
        }

        const hours = parseInt(durationHours) || 0;
        const minutes = parseInt(durationMinutes) || 0;

        const returnDateTime = new Date(startDateTime.getTime() + (hours * 60 + minutes) * 60000);

        return {
            date: returnDateTime.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: returnDateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
        };
    }, [startDate, startTime, durationHours, durationMinutes]);

     return (
         <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-1">Calculadora de Regreso Laboral</h2>
            <p className="text-gray-500 dark:text-neutral-400 mb-6">Determina cuándo regresar después de un permiso o descanso.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                     <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-neutral-300">Fecha y Hora de Salida</label>
                        <div className="flex gap-2 mt-1">
                             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-600 rounded-lg text-lg font-semibold" />
                             <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-600 rounded-lg text-lg font-semibold" />
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 mb-1">Duración del Permiso</label>
                        <div className="flex gap-2">
                            <div className="w-full">
                                <label htmlFor="duration-hours" className="text-xs font-medium text-gray-500 dark:text-neutral-400">Horas</label>
                                <input id="duration-hours" type="number" value={durationHours} onChange={e => setDurationHours(e.target.value)} min="0" className="w-full mt-1 p-3 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-600 rounded-lg text-lg font-semibold" />
                            </div>
                            <div className="w-full">
                                <label htmlFor="duration-minutes" className="text-xs font-medium text-gray-500 dark:text-neutral-400">Minutos</label>
                                <input id="duration-minutes" type="number" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} min="0" max="59" step="1" className="w-full mt-1 p-3 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-600 rounded-lg text-lg font-semibold" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-neutral-500 mt-2 px-1">Ej: para media hora, introduce 0 en Horas y 30 en Minutos.</p>
                    </div>
                </div>
                 <div className="bg-purple-100 dark:bg-purple-900/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <i className="fa-solid fa-clock-rotate-left text-4xl text-purple-500 dark:text-purple-400 mb-4"></i>
                    <p className="text-lg font-semibold text-purple-800 dark:text-purple-200">Deberás regresar el:</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-2 capitalize">{returnTime.date}</p>
                    <p className="text-xl font-semibold text-purple-700 dark:text-purple-300">a las <span className="font-bold">{returnTime.time}</span></p>
                </div>
            </div>
        </div>
    );
};

const StandardCalculator: React.FC = () => {
    const [display, setDisplay] = useState('0');
    const [expression, setExpression] = useState('');

    const handleButtonClick = (value: string) => {
        if (value === 'C') {
            setDisplay('0');
            setExpression('');
        } else if (value === '=') {
            try {
                // Using a safer evaluation method
                const result = new Function('return ' + expression.replace(/[^-()\d/*+.]/g, ''))();
                const formattedResult = Number(result.toFixed(10)); // Avoid floating point issues
                setDisplay(String(formattedResult));
                setExpression(String(formattedResult));
            } catch (error) {
                setDisplay('Error');
                setExpression('');
            }
        } else {
            if (display === '0' && value !== '.') {
                setDisplay(value);
                setExpression(value);
            } else if (display === 'Error') {
                 setDisplay(value);
                 setExpression(value);
            } else {
                setDisplay(display + value);
                setExpression(expression + value);
            }
        }
    };

    const buttons = [
        'C', '(', ')', '/', 
        '7', '8', '9', '*', 
        '4', '5', '6', '-', 
        '1', '2', '3', '+',
        '0', '.', '='
    ];
    
    const getButtonClass = (btn: string) => {
        if (['/', '*', '-', '+', '='].includes(btn)) return 'bg-blue-500 active:bg-blue-600 text-white';
        if (btn === 'C') return 'bg-red-500 active:bg-red-600 text-white';
        if (btn === '0') return 'col-span-2';
        return 'bg-gray-200 dark:bg-neutral-600 active:bg-gray-300 dark:active:bg-neutral-500 text-gray-900 dark:text-white';
    }

    return (
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl shadow-lg max-w-sm mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-4">Calculadora Estándar</h2>
            <div className="bg-gray-100 dark:bg-neutral-900/50 p-4 rounded-lg text-right text-4xl font-mono mb-4 overflow-x-auto break-all text-gray-900 dark:text-white">
                {display}
            </div>
            <div className="grid grid-cols-4 gap-2">
                {buttons.map(btn => (
                    <button
                        key={btn}
                        onClick={() => handleButtonClick(btn)}
                        className={`text-xl md:text-2xl font-bold p-3 md:p-4 rounded-lg transition-colors ${getButtonClass(btn)}`}
                    >
                        {btn}
                    </button>
                ))}
            </div>
        </div>
    );
};


export const CalculatorsView: React.FC = () => {
  const [activeCalculator, setActiveCalculator] = useState<ActiveCalculator>('goal');
  
  const calculatorTabs = useMemo(() => [
    { id: 'goal', label: 'Meta Ahorro', icon: 'fa-solid fa-flag-checkered' },
    { id: 'work', label: 'Laboral', icon: 'fa-solid fa-briefcase' },
    { id: 'return', label: 'Regreso', icon: 'fa-solid fa-clock-rotate-left' },
    { id: 'standard', label: 'Estándar', icon: 'fa-solid fa-calculator' },
  ], []);

  const activeCalculatorIndex = useMemo(() => calculatorTabs.findIndex(tab => tab.id === activeCalculator), [activeCalculator, calculatorTabs]);

  const renderActiveCalculator = () => {
    switch(activeCalculator) {
        case 'goal':
            return <TimeToGoalCalculator />;
        case 'work':
            return <WorkCalculator />;
        case 'return':
            return <ReturnTimeCalculator />;
        case 'standard':
            return <StandardCalculator />;
        default:
            return null;
    }
  }

  return (
    <div className="space-y-6">
        <div className="relative bg-gray-100 dark:bg-neutral-900/50 p-1 rounded-xl flex items-center justify-center max-w-lg mx-auto">
            <div
                className="absolute top-1 bottom-1 bg-blue-500 rounded-lg shadow-md transition-all duration-300 ease-in-out"
                style={{
                    width: `calc((100% - 0.5rem) / ${calculatorTabs.length})`,
                    left: '0.25rem',
                    transform: `translateX(${activeCalculatorIndex * 100}%)`,
                }}
            />
            {calculatorTabs.map(tab => (
                 <button 
                    key={tab.id}
                    onClick={() => setActiveCalculator(tab.id as ActiveCalculator)}
                    className={`relative z-10 flex-1 px-1 py-2 font-semibold text-sm transition-colors duration-300 flex items-center justify-center gap-2 ${activeCalculator === tab.id ? 'text-white' : 'text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white'}`}
                >
                    <i className={`${tab.icon} hidden sm:inline`}></i>
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
        <div>
            {renderActiveCalculator()}
        </div>
    </div>
  );
};
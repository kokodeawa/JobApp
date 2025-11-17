import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color, bgColor }) => {
  return (
    <div className="bg-neutral-800 p-5 rounded-3xl shadow-lg flex flex-col items-start space-y-3">
      <div className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center ${color} ${bgColor}`}>
        <i className={icon}></i>
      </div>
      <div className="text-left">
        <p className="text-sm text-neutral-400 font-medium">{title}</p>
        <p className="text-3xl font-bold text-neutral-100">{value}</p>
      </div>
    </div>
  );
};
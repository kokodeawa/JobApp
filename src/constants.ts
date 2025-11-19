import { Category } from './types';

// Based on an initial income of $1500
export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'housing',
    name: 'Vivienda y Servicios',
    amount: 525,
    color: '#3b82f6', // blue-500
    icon: 'fa-solid fa-house-chimney',
  },
  {
    id: 'transport',
    name: 'Transporte',
    amount: 225,
    color: '#8b5cf6', // violet-500
    icon: 'fa-solid fa-car',
  },
  {
    id: 'food',
    name: 'Alimentación',
    amount: 225,
    color: '#10b981', // emerald-500
    icon: 'fa-solid fa-utensils',
  },
  {
    id: 'needs',
    name: 'Necesidades Personales',
    amount: 150,
    color: '#f97316', // orange-500
    icon: 'fa-solid fa-heart-pulse',
  },
  {
    id: 'wants',
    name: 'Ocio y Deseos',
    amount: 150,
    color: '#ec4899', // pink-500
    icon: 'fa-solid fa-gift',
  },
  {
    id: 'savings',
    name: 'Ahorro e Inversión',
    amount: 225,
    color: '#f59e0b', // amber-500
    icon: 'fa-solid fa-piggy-bank',
  },
];
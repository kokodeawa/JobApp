import React from 'react';
import { BudgetRecord } from '../types';

interface BudgetPDFLayoutProps {
  budget: BudgetRecord;
}

export const BudgetPDFLayout: React.FC<BudgetPDFLayoutProps> = ({ budget }) => {
  const totalAllocated = budget.categories.reduce((sum, cat) => sum + cat.amount, 0);
  const remainingBalance = budget.totalIncome - totalAllocated;
  const categoriesToDisplay = budget.categories.filter(c => c.amount > 0 && c.id !== 'savings');
  const savings = budget.categories.find(c => c.id === 'savings');

  return (
    <div 
        id="pdf-content" 
        style={{ 
            width: '800px', 
            fontFamily: 'system-ui, sans-serif', 
            backgroundColor: '#f8fafc', 
            color: '#0f172a',
            padding: '40px'
        }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Resumen de Presupuesto</h1>
          <h2 style={{ fontSize: '20px', margin: '4px 0 0', color: '#475569' }}>{budget.name}</h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
            <i className="fa-solid fa-wallet" style={{ color: '#3b82f6', marginRight: '8px' }}></i>
            Finanzas Pro
          </div>
          <p style={{ fontSize: '12px', margin: '4px 0 0', color: '#64748b' }}>Generado: {new Date().toLocaleDateString('es-ES')}</p>
        </div>
      </header>
      
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <i className="fa-solid fa-dollar-sign" style={{ fontSize: '24px', color: '#16a34a', marginBottom: '8px' }}></i>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#475569', margin: 0, textTransform: 'uppercase' }}>Ingreso Total</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534', margin: '4px 0 0' }}>${budget.totalIncome.toFixed(2)}</p>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <i className="fa-solid fa-coins" style={{ fontSize: '24px', color: '#f59e0b', marginBottom: '8px' }}></i>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#475569', margin: 0, textTransform: 'uppercase' }}>Total Gastado</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#b45309', margin: '4px 0 0' }}>${totalAllocated.toFixed(2)}</p>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <i className="fa-solid fa-piggy-bank" style={{ fontSize: '24px', color: '#3b82f6', marginBottom: '8px' }}></i>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#475569', margin: 0, textTransform: 'uppercase' }}>Balance Final</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af', margin: '4px 0 0' }}>${remainingBalance.toFixed(2)}</p>
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '24px' }}>Desglose de Gastos</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {categoriesToDisplay.map(cat => {
            const percentage = budget.totalIncome > 0 ? (cat.amount / budget.totalIncome) * 100 : 0;
            return (
              <div key={cat.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <i className={cat.icon} style={{ color: cat.color, fontSize: '16px', width: '28px', textAlign: 'center' }}></i>
                    <span style={{ fontWeight: '600', color: '#334155', marginLeft: '8px' }}>{cat.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#0f172a' }}>${cat.amount.toFixed(2)}</span>
                    <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>{percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div style={{ backgroundColor: '#e2e8f0', borderRadius: '9999px', height: '12px', overflow: 'hidden' }}>
                  <div style={{ width: `${percentage}%`, backgroundColor: cat.color, height: '100%', borderRadius: '9999px' }}></div>
                </div>
              </div>
            );
          })}
        </div>
        
        {savings && savings.amount > 0 && (
             <div style={{ marginTop: '32px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <i className={savings.icon} style={{color: savings.color, fontSize: '24px', marginRight: '16px' }}></i>
                    <div>
                        <h4 style={{margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#b45309'}}>{savings.name}</h4>
                        <p style={{margin: '2px 0 0', fontSize: '12px', color: '#d97706'}}>Tu sobrante ha sido asignado aquí.</p>
                    </div>
                </div>
                 <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#92400e', margin: 0 }}>${savings.amount.toFixed(2)}</p>
             </div>
        )}

      </section>
      
      <footer style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '24px', marginTop: '40px' }}>
        Gracias por usar Organizador Financiero Pro.
      </footer>
    </div>
  );
};

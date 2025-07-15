'use client';

import React from 'react';

interface CashDisplayProps {
  amount: number;
  className?: string;
}

export const CashDisplay: React.FC<CashDisplayProps> = ({ amount, className = '' }) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className={`hud-element flex items-center gap-2 px-4 py-2 ${className}`}>
      <div className="flex items-center gap-2">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-[--gold-yellow]"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 6V18M9 9H15C15 9 16 9 16 10.5C16 12 15 12 15 12H9C9 12 8 12 8 13.5C8 15 9 15 9 15H15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span 
          className="text-xl font-bold"
          style={{ color: 'var(--gold-yellow)' }}
        >
          {formatCurrency(amount)}
        </span>
      </div>
    </div>
  );
};

export default CashDisplay;
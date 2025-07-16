'use client';

import React from 'react';
import TimeDisplay from './TimeDisplay';
import EventCalendar from './EventCalendar';
import { useEconomyStore } from '@/app/store/useEconomyStore';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface GameHUDProps {
  showEventCalendar?: boolean;
}

const GameHUD: React.FC<GameHUDProps> = ({ showEventCalendar = false }) => {
  const { playerFinancials } = useEconomyStore();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const profitMarginPercent = Math.round(playerFinancials.profitMargin * 100);
  const profitMarginColor = profitMarginPercent >= 0 ? 'text-green-400' : 'text-red-400';
  const ProfitIcon = profitMarginPercent >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4">
      {/* Financial Status */}
      <div className="bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg shadow-xl border border-green-500/30">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Financial Status</h3>
        
        <div className="space-y-2">
          {/* Cash */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm">Cash</span>
            </div>
            <span className="font-mono font-bold text-lg">
              {formatCurrency(playerFinancials.cash)}
            </span>
          </div>
          
          {/* Net Worth */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-400" />
              <span className="text-sm">Net Worth</span>
            </div>
            <span className="font-mono">
              {formatCurrency(playerFinancials.netWorth)}
            </span>
          </div>
          
          {/* Profit Margin */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ProfitIcon className={`w-4 h-4 ${profitMarginColor}`} />
              <span className="text-sm">Profit Margin</span>
            </div>
            <span className={`font-mono ${profitMarginColor}`}>
              {profitMarginPercent}%
            </span>
          </div>
          
          {/* Credit Rating */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <span className="text-sm">Credit Rating</span>
            <span className="font-bold text-yellow-400">
              {playerFinancials.creditRating}
            </span>
          </div>
        </div>
      </div>

      {/* Time Display */}
      <TimeDisplay />
      
      {/* Event Calendar (toggleable) */}
      {showEventCalendar && <EventCalendar />}
    </div>
  );
};

export default GameHUD;
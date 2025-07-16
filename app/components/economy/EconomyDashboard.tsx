'use client';

import { useEffect } from 'react';
import { useEconomyStore } from '@/app/store/useEconomyStore';
import type { RouteCalculation } from '@/app/lib/types/economy';

export function EconomyDashboard() {
  const {
    goods,
    marketState,
    playerFinancials,
    economyModifiers,
    initializeEconomy,
    updateMarketPrices,
    calculateRouteProfit,
    updateMarketCondition,
    applySpecialistBonus
  } = useEconomyStore();

  useEffect(() => {
    if (goods.size === 0) {
      initializeEconomy();
    }
  }, [goods.size, initializeEconomy]);

  const handleSimulateRoute = () => {
    const calculation: RouteCalculation = {
      distance: 1500,
      baseRatePerMile: 2.5,
      cargoValueMultiplier: 1.8,
      assetLevel: 3,
      specialistBonus: 2,
      marketConditions: marketState.condition,
      maintenanceCostRate: 0.15
    };

    const profit = calculateRouteProfit(calculation);
    console.log('Route Profit Calculation:', profit);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-white">Economy Dashboard</h2>
        
        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-sm text-gray-400">Cash Balance</h3>
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(playerFinancials.cash)}
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-sm text-gray-400">Credit Rating</h3>
            <p className="text-2xl font-bold text-yellow-400">
              {playerFinancials.creditRating}
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-sm text-gray-400">Profit Margin</h3>
            <p className="text-2xl font-bold text-blue-400">
              {formatPercentage(playerFinancials.profitMargin)}
            </p>
          </div>
        </div>

        {/* Market State */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Market Conditions</h3>
          <div className="flex gap-2">
            {(['boom', 'normal', 'recession', 'crisis'] as const).map((condition) => (
              <button
                key={condition}
                onClick={() => updateMarketCondition(condition)}
                className={`px-4 py-2 rounded ${
                  marketState.condition === condition
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {condition.charAt(0).toUpperCase() + condition.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Goods Prices */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Current Market Prices</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from(goods.entries()).map(([id, good]) => (
              <div key={id} className="bg-gray-800 p-3 rounded">
                <h4 className="text-sm font-medium text-gray-400">{good.name}</h4>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(good.currentPrice || 0)}
                </p>
                <p className="text-xs text-gray-500">
                  Base: {formatCurrency(good.baseCost)}
                </p>
                <p className="text-xs text-gray-500">
                  D/S: {(good.totalDemand / good.totalSupply).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Economy Modifiers */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Economy Modifiers</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-3 rounded">
              <h4 className="text-sm text-gray-400">Asset Efficiency</h4>
              <p className="text-lg font-bold text-white">
                {formatPercentage(economyModifiers.assetEfficiency - 1)}
              </p>
            </div>
            <div className="bg-gray-800 p-3 rounded">
              <h4 className="text-sm text-gray-400">Specialist Bonus</h4>
              <p className="text-lg font-bold text-white">
                {formatPercentage(economyModifiers.specialistBonus)}
              </p>
            </div>
            <div className="bg-gray-800 p-3 rounded">
              <h4 className="text-sm text-gray-400">Disaster Penalty</h4>
              <p className="text-lg font-bold text-red-400">
                -{formatPercentage(economyModifiers.disasterPenalty)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => updateMarketPrices()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Update Market Prices
          </button>
          <button
            onClick={handleSimulateRoute}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Simulate Route Profit
          </button>
          <button
            onClick={() => applySpecialistBonus(0.1)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Add Specialist (+10%)
          </button>
        </div>

        {/* Financial Summary */}
        <div className="mt-6 bg-gray-800 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2 text-white">Financial Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Total Revenue:</span>
              <p className="font-bold text-green-400">
                {formatCurrency(playerFinancials.totalRevenue)}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Total Expenses:</span>
              <p className="font-bold text-red-400">
                {formatCurrency(playerFinancials.totalExpenses)}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Net Worth:</span>
              <p className="font-bold text-white">
                {formatCurrency(playerFinancials.netWorth)}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Active Loans:</span>
              <p className="font-bold text-yellow-400">
                {playerFinancials.loans.filter(l => l.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
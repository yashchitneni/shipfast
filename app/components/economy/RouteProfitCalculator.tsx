'use client';

import { useState } from 'react';
import { useEconomyStore } from '@/app/store/useEconomyStore';
import type { RouteCalculation, MarketCondition } from '@/app/lib/types/economy';

export function RouteProfitCalculator() {
  const { calculateRouteProfit, marketState } = useEconomyStore();
  
  const [calculation, setCalculation] = useState<RouteCalculation>({
    distance: 1000,
    baseRatePerMile: 2.5,
    cargoValueMultiplier: 1.0,
    assetLevel: 1,
    specialistBonus: 0,
    marketConditions: marketState.condition,
    maintenanceCostRate: 0.1
  });

  const [result, setResult] = useState<ReturnType<typeof calculateRouteProfit> | null>(null);

  const handleCalculate = () => {
    const profit = calculateRouteProfit(calculation);
    setResult(profit);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4 text-white">Route Profit Calculator</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Distance */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Distance (miles)
          </label>
          <input
            type="number"
            value={calculation.distance}
            onChange={(e) => setCalculation({ ...calculation, distance: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
          />
        </div>

        {/* Base Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Base Rate per Mile ($)
          </label>
          <input
            type="number"
            step="0.1"
            value={calculation.baseRatePerMile}
            onChange={(e) => setCalculation({ ...calculation, baseRatePerMile: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
          />
        </div>

        {/* Cargo Value Multiplier */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Cargo Value Multiplier
          </label>
          <input
            type="number"
            step="0.1"
            value={calculation.cargoValueMultiplier}
            onChange={(e) => setCalculation({ ...calculation, cargoValueMultiplier: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
          />
        </div>

        {/* Asset Level */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Asset Level (1-10)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={calculation.assetLevel}
            onChange={(e) => setCalculation({ ...calculation, assetLevel: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
          />
        </div>

        {/* Specialist Bonus */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Specialist Count
          </label>
          <input
            type="number"
            min="0"
            max="5"
            value={calculation.specialistBonus}
            onChange={(e) => setCalculation({ ...calculation, specialistBonus: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
          />
        </div>

        {/* Market Conditions */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Market Conditions
          </label>
          <select
            value={calculation.marketConditions}
            onChange={(e) => setCalculation({ ...calculation, marketConditions: e.target.value as MarketCondition })}
            className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
          >
            <option value="boom">Boom (+30%)</option>
            <option value="normal">Normal</option>
            <option value="recession">Recession (-30%)</option>
            <option value="crisis">Crisis (-50%)</option>
          </select>
        </div>

        {/* Maintenance Cost Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Maintenance Cost Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="0.5"
            value={calculation.maintenanceCostRate}
            onChange={(e) => setCalculation({ ...calculation, maintenanceCostRate: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
          />
        </div>
      </div>

      <button
        onClick={handleCalculate}
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
      >
        Calculate Profit
      </button>

      {result && (
        <div className="mt-6 space-y-4">
          <h4 className="text-lg font-semibold text-white">Calculation Breakdown</h4>
          
          <div className="bg-gray-800 p-4 rounded space-y-2">
            {/* Formula Display */}
            <div className="text-sm text-gray-400 mb-3">
              <p className="font-mono">Base Profit = Distance × Base Rate × Cargo Value</p>
              <p className="font-mono">Asset Efficiency = 1 + (Asset Level × 0.1) + (Specialists × 0.05)</p>
              <p className="font-mono">Total = Base × Efficiency × Market × (1 - Maintenance)</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-400">Base Profit:</div>
              <div className="text-white font-medium">{formatCurrency(result.baseProfit)}</div>
              
              <div className="text-gray-400">Asset Efficiency Modifier:</div>
              <div className="text-green-400 font-medium">×{result.assetEfficiencyModifier.toFixed(2)}</div>
              
              <div className="text-gray-400">Market Condition Modifier:</div>
              <div className="text-yellow-400 font-medium">×{result.marketConditionModifier.toFixed(2)}</div>
              
              <div className="text-gray-400">Maintenance Cost Modifier:</div>
              <div className="text-red-400 font-medium">×{result.maintenanceCostModifier.toFixed(2)}</div>
            </div>
            
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg text-gray-300">Total Profit:</span>
                <span className="text-2xl font-bold text-green-400">
                  {formatCurrency(result.totalProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Calculations */}
          <div className="bg-gray-800 p-4 rounded text-sm text-gray-300">
            <h5 className="font-semibold mb-2">Detailed Calculations:</h5>
            <p>Base: {calculation.distance} × ${calculation.baseRatePerMile} × {calculation.cargoValueMultiplier} = {formatCurrency(result.baseProfit)}</p>
            <p>Asset Efficiency: 1 + ({calculation.assetLevel} × 0.1) + ({calculation.specialistBonus} × 0.05) = {result.assetEfficiencyModifier.toFixed(2)}</p>
            <p>Final: {formatCurrency(result.baseProfit)} × {result.assetEfficiencyModifier.toFixed(2)} × {result.marketConditionModifier.toFixed(2)} × {result.maintenanceCostModifier.toFixed(2)} = {formatCurrency(result.totalProfit)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useEffect, useState } from 'react';
import GameHUD from '../../../src/components/game/GameHUD';
import { useTimeSync } from '@/app/hooks/useTimeSync';
import { useTimeStore } from '@/app/stores/timeStore';
import { useEconomyStore } from '@/app/store/useEconomyStore';
import { Activity, Package, Clock, TrendingUp } from 'lucide-react';

const TimeSystemDemo: React.FC = () => {
  const [showCalendar, setShowCalendar] = useState(true);
  const { currentQuarter, totalDaysPlayed, speed } = useTimeStore();
  const { goods, playerFinancials, calculateRouteProfit } = useEconomyStore();
  const [recentProfits, setRecentProfits] = useState<number[]>([]);

  // Initialize time sync
  useTimeSync();

  // Initialize economy on mount
  useEffect(() => {
    const { initializeEconomy } = useEconomyStore.getState();
    initializeEconomy();
  }, []);

  // Simulate route profits periodically
  useEffect(() => {
    if (speed === 0) return;
    
    const interval = setInterval(() => {
      // Simulate a route completion
      const profit = calculateRouteProfit({
        distance: Math.random() * 1000 + 500,
        baseRatePerMile: 2.5,
        cargoValueMultiplier: 1 + Math.random() * 0.5,
        assetLevel: Math.floor(Math.random() * 5) + 1,
        specialistBonus: Math.random() * 0.2,
        marketConditions: 'normal',
        maintenanceCostRate: 0.1 + Math.random() * 0.1
      });
      
      setRecentProfits(prev => [...prev.slice(-4), profit.totalProfit]);
    }, 5000 / speed); // More frequent with higher speed
    
    return () => clearInterval(interval);
  }, [speed, calculateRouteProfit]);

  // Sample goods for display
  const sampleGoods = Array.from(goods.values()).slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Game HUD */}
              <GameHUD />
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">ShipFast Time System</h1>
          <p className="text-gray-400">Watch how time progression affects the economy</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Days Played */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-8 h-8 text-blue-400" />
              <h3 className="text-lg font-semibold">Days Played</h3>
            </div>
            <p className="text-3xl font-bold">{Math.floor(totalDaysPlayed)}</p>
            <p className="text-sm text-gray-400">Current: {currentQuarter}</p>
          </div>
          
          {/* Total Revenue */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <h3 className="text-lg font-semibold">Total Revenue</h3>
            </div>
            <p className="text-3xl font-bold">
              ${playerFinancials.totalRevenue.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">
              Expenses: ${playerFinancials.totalExpenses.toLocaleString()}
            </p>
          </div>
          
          {/* Active Routes */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-8 h-8 text-orange-400" />
              <h3 className="text-lg font-semibold">Route Activity</h3>
            </div>
            <p className="text-3xl font-bold">{recentProfits.length}</p>
            <p className="text-sm text-gray-400">Routes completed</p>
          </div>
        </div>
        
        {/* Market Prices */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-400" />
            Current Market Prices
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sampleGoods.map(good => (
              <div key={good.id} className="bg-gray-700 p-4 rounded">
                <h4 className="font-semibold text-sm mb-1">{good.name}</h4>
                <p className="text-2xl font-bold text-green-400">
                  ${good.currentPrice?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-400">
                  Base: ${good.baseCost}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent Profits */}
        {recentProfits.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Recent Route Profits</h3>
            <div className="space-y-2">
              {recentProfits.map((profit, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-700 p-3 rounded"
                >
                  <span className="text-sm">Route #{index + 1}</span>
                  <span className="font-mono font-bold text-green-400">
                    +${profit.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Controls */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Controls</h3>
          <div className="flex gap-4">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              {showCalendar ? 'Hide' : 'Show'} Event Calendar
            </button>
            <button
              onClick={() => useTimeStore.getState().reset()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              Reset Time
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSystemDemo;
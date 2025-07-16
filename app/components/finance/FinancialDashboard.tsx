'use client';

import React, { useState } from 'react';
import { Panel } from '../ui/Panel';
import { useEmpireStore } from '@/src/store/empireStore';

interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  timestamp: Date;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
}

export const FinancialDashboard: React.FC = () => {
  const { player } = useEmpireStore();
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'all'>('week');
  
  // Mock financial data
  const [records] = useState<FinancialRecord[]>([
    { id: '1', type: 'income', category: 'Shipping', description: 'Route: Shanghai-Rotterdam', amount: 45000, timestamp: new Date(Date.now() - 86400000) },
    { id: '2', type: 'expense', category: 'Fuel', description: 'Bunker fuel for MV Horizon', amount: 12000, timestamp: new Date(Date.now() - 86400000 * 2) },
    { id: '3', type: 'income', category: 'Trading', description: 'Electronics sale in Rotterdam', amount: 8500, timestamp: new Date(Date.now() - 86400000 * 2) },
    { id: '4', type: 'expense', category: 'Maintenance', description: 'Engine maintenance', amount: 5000, timestamp: new Date(Date.now() - 86400000 * 3) },
    { id: '5', type: 'income', category: 'Shipping', description: 'Route: LA-Tokyo Express', amount: 32000, timestamp: new Date(Date.now() - 86400000 * 3) },
    { id: '6', type: 'expense', category: 'Port Fees', description: 'Rotterdam port charges', amount: 3500, timestamp: new Date(Date.now() - 86400000 * 4) },
    { id: '7', type: 'expense', category: 'Crew', description: 'Monthly wages', amount: 18000, timestamp: new Date(Date.now() - 86400000 * 5) },
    { id: '8', type: 'income', category: 'Charter', description: 'Short-term vessel charter', amount: 15000, timestamp: new Date(Date.now() - 86400000 * 5) },
  ]);

  const calculateSummary = (): FinancialSummary => {
    const filteredRecords = filterRecordsByTimeframe(records);
    const totalIncome = filteredRecords
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = filteredRecords
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return { totalIncome, totalExpenses, netProfit, profitMargin };
  };

  const filterRecordsByTimeframe = (allRecords: FinancialRecord[]): FinancialRecord[] => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (timeframe) {
      case 'day':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        return allRecords;
    }

    return allRecords.filter(record => record.timestamp >= cutoffDate);
  };

  const summary = calculateSummary();
  const filteredRecords = filterRecordsByTimeframe(records);

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Shipping': '🚢',
      'Trading': '📈',
      'Fuel': '⛽',
      'Maintenance': '🔧',
      'Port Fees': '⚓',
      'Crew': '👥',
      'Charter': '📋',
    };
    return icons[category] || '💰';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Current Balance</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(player?.cash || 0)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-green-700">
            {formatCurrency(summary.totalIncome)}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-red-600 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-700">
            {formatCurrency(summary.totalExpenses)}
          </p>
        </div>
        <div className={`rounded-lg p-4 border ${
          summary.netProfit >= 0 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <p className={`text-sm mb-1 ${
            summary.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'
          }`}>
            Net Profit
          </p>
          <p className={`text-2xl font-bold ${
            summary.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'
          }`}>
            {formatCurrency(summary.netProfit)}
          </p>
        </div>
      </div>

      {/* Profit Chart (simplified visualization) */}
      <Panel title="Profit Margin" className="mb-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Profit Margin</span>
            <span className="font-medium">
              {summary.profitMargin.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-8">
            <div
              className={`h-8 rounded-full flex items-center justify-center text-white font-medium ${
                summary.profitMargin >= 20 ? 'bg-green-500' :
                summary.profitMargin >= 10 ? 'bg-yellow-500' :
                summary.profitMargin >= 0 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, summary.profitMargin))}%` }}
            >
              {summary.profitMargin > 5 && `${summary.profitMargin.toFixed(1)}%`}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </Panel>

      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-4">
        {(['day', 'week', 'month', 'all'] as const).map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeframe === tf
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tf.charAt(0).toUpperCase() + tf.slice(1)}
          </button>
        ))}
      </div>

      {/* Transaction History */}
      <Panel title="Transaction History" className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {filteredRecords.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No transactions in this period
            </p>
          ) : (
            <div className="space-y-2">
              {filteredRecords.map(record => (
                <div
                  key={record.id}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">
                        {getCategoryIcon(record.category)}
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {record.description}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {record.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        record.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {record.type === 'income' ? '+' : '-'}
                        {formatCurrency(record.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">Avg Transaction</p>
          <p className="text-lg font-bold">
            {formatCurrency(
              filteredRecords.length > 0
                ? filteredRecords.reduce((sum, r) => sum + r.amount, 0) / filteredRecords.length
                : 0
            )}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">Transactions</p>
          <p className="text-lg font-bold">{filteredRecords.length}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">Daily Avg</p>
          <p className="text-lg font-bold">
            {formatCurrency(
              timeframe === 'day' ? summary.netProfit :
              timeframe === 'week' ? summary.netProfit / 7 :
              timeframe === 'month' ? summary.netProfit / 30 :
              summary.netProfit / 365
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
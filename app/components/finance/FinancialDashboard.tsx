'use client';

import React, { useState, useEffect } from 'react';
import { Panel } from '../ui/Panel';
import { useEmpireStore } from '@/src/store/empireStore';
import { useEconomyStore } from '@/app/store/useEconomyStore';
import type { FinancialRecord } from '@/app/lib/types/economy';

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
}

export const FinancialDashboard: React.FC = () => {
  const { player } = useEmpireStore();
  const { 
    financialRecords, 
    playerFinancials,
    monthlyFinancials,
    initializeEconomy,
    updateMonthlyFinancials
  } = useEconomyStore();
  
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'all'>('week');
  
  // Initialize economy on mount
  useEffect(() => {
    initializeEconomy();
    updateMonthlyFinancials();
  }, [initializeEconomy, updateMonthlyFinancials]);

  const calculateSummary = (): FinancialSummary => {
    const filteredRecords = filterRecordsByTimeframe(financialRecords);
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

    return allRecords.filter(record => new Date(record.timestamp) >= cutoffDate);
  };

  const summary = calculateSummary();
  const filteredRecords = filterRecordsByTimeframe(financialRecords);

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'route-profit': '🚢',
      'trading': '📈',
      'market-trade': '🏪',
      'fuel': '⛽',
      'maintenance': '🔧',
      'port-fees': '⚓',
      'crew': '👥',
      'charter': '📋',
      'loan': '🏦',
      'loan-payment': '💸',
      'disaster': '⚠️',
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
            {formatCurrency(playerFinancials.cash)}
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
          <p className="text-xs mt-1">
            {playerFinancials.profitMargin > 0 
              ? `${(playerFinancials.profitMargin * 100).toFixed(1)}% margin`
              : ''}
          </p>
        </div>
      </div>

      {/* Profit Chart (simplified visualization) */}
      <Panel title="Financial Overview" className="mb-4">
        <div className="space-y-4">
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
          </div>
          
          {/* Additional financial metrics */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-600">Credit Rating</p>
              <p className="font-bold">{playerFinancials.creditRating}</p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-600">Net Worth</p>
              <p className="font-bold">{formatCurrency(playerFinancials.netWorth)}</p>
            </div>
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
                          {record.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                        {new Date(record.timestamp).toLocaleDateString()}
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

      {/* Monthly Performance */}
      {monthlyFinancials.length > 0 && (
        <Panel title="Monthly Performance" className="mt-4">
          <div className="grid grid-cols-2 gap-2">
            {monthlyFinancials.slice(-2).map((monthly) => (
              <div key={monthly.month} className="bg-gray-50 rounded p-3">
                <p className="text-sm font-medium text-gray-700">{monthly.month}</p>
                <p className={`text-lg font-bold ${monthly.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(monthly.profit)}
                </p>
                <p className="text-xs text-gray-500">
                  Revenue: {formatCurrency(monthly.revenue)}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
};

export default FinancialDashboard;
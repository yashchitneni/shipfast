'use client';

import React, { useEffect } from 'react';
import { RevenueDisplay } from '@/components/revenue/RevenueDisplay';
import { FinancialReport } from '@/components/revenue/FinancialReport';
import { useRevenueGeneration } from '@/hooks/useRevenueGeneration';
import { useEconomyStore } from '@/store/useEconomyStore';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Example integration of the revenue generation system
 * 
 * This component demonstrates how to:
 * 1. Initialize and use the revenue generation hook
 * 2. Handle revenue and expense events
 * 3. Display real-time revenue information
 * 4. Show financial reports
 */
export function RevenueIntegrationExample() {
  const playerFinancials = useEconomyStore(state => state.playerFinancials);
  
  // Initialize revenue generation with event handlers
  const { forceProcessCycle } = useRevenueGeneration({
    enabled: true,
    onRevenueGenerated: (amount) => {
      toast({
        title: "Revenue Generated!",
        description: `+$${amount.toLocaleString()} added to your account`,
        variant: "default",
      });
    },
    onExpenseIncurred: (amount) => {
      toast({
        title: "Expenses Deducted",
        description: `-$${amount.toLocaleString()} for operating costs`,
        variant: "destructive",
      });
    },
    onCycleCompleted: (netIncome) => {
      const message = netIncome >= 0 
        ? `Net profit: +$${netIncome.toLocaleString()}`
        : `Net loss: -$${Math.abs(netIncome).toLocaleString()}`;
        
      toast({
        title: "Revenue Cycle Completed",
        description: message,
        variant: netIncome >= 0 ? "default" : "destructive",
      });
    }
  });
  
  // Initialize economy on mount
  useEffect(() => {
    const economyStore = useEconomyStore.getState();
    if (economyStore.goods.size === 0) {
      economyStore.initializeEconomy();
    }
  }, []);
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg p-6 border">
        <h1 className="text-3xl font-bold mb-2">Revenue Management</h1>
        <p className="text-muted-foreground mb-4">
          Monitor your shipping empire's financial performance
        </p>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold">
              ${playerFinancials.cash.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              ${playerFinancials.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Profit Margin</p>
            <p className="text-2xl font-bold">
              {(playerFinancials.profitMargin * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <RevenueDisplay />
            </div>
            <div className="lg:col-span-2">
              {/* Additional dashboard components would go here */}
              <div className="bg-card rounded-lg p-6 border">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={forceProcessCycle}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                  >
                    Force Process Revenue Cycle
                  </button>
                  <p className="text-xs text-muted-foreground text-center">
                    Useful for testing - normally processes automatically every game hour
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="reports">
          <FinancialReport />
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="bg-card rounded-lg p-6 border max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Revenue Generation Settings</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Configure how revenue is calculated and processed
            </p>
            
            {/* Settings would go here */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Cycle Interval</label>
                <p className="text-xs text-muted-foreground mb-2">
                  How often revenue is processed (in game time)
                </p>
                <select className="w-full px-3 py-2 border rounded">
                  <option value="30">Every 30 minutes</option>
                  <option value="60" selected>Every hour</option>
                  <option value="120">Every 2 hours</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Market Volatility Impact</label>
                <p className="text-xs text-muted-foreground mb-2">
                  How much market conditions affect revenue
                </p>
                <input
                  type="range"
                  min="0"
                  max="50"
                  defaultValue="20"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
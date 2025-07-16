'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useRevenueGeneration } from '@/hooks/useRevenueGeneration';
import { cn } from '@/lib/utils';

export function RevenueDisplay() {
  const {
    currentCycle,
    isProcessing,
    nextCycleTime,
    recentEvents,
    getLatestSummary,
    getRevenueRate
  } = useRevenueGeneration();
  
  const latestSummary = getLatestSummary();
  const revenueRate = getRevenueRate();
  
  // Calculate time until next cycle
  const timeUntilNext = Math.max(0, nextCycleTime - Date.now());
  const minutesUntilNext = Math.floor(timeUntilNext / 60000);
  const secondsUntilNext = Math.floor((timeUntilNext % 60000) / 1000);
  
  return (
    <div className="space-y-4">
      {/* Revenue Rate Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Generation
            </CardTitle>
            {isProcessing && (
              <Badge variant="secondary" className="animate-pulse">
                Processing...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Revenue Rate</p>
              <p className="text-2xl font-bold">
                ${revenueRate.toLocaleString('en-US', { maximumFractionDigits: 0 })}/hr
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Cycle</p>
              <p className="text-lg font-semibold">
                {minutesUntilNext}:{secondsUntilNext.toString().padStart(2, '0')}
              </p>
            </div>
          </div>
          
          {/* Progress to next cycle */}
          <div className="mt-4">
            <Progress 
              value={((60 * 60 * 1000 - timeUntilNext) / (60 * 60 * 1000)) * 100} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Latest Summary */}
      {latestSummary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Latest Cycle Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <span className="font-semibold text-green-600">
                  +${latestSummary.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Expenses</span>
                <span className="font-semibold text-red-600">
                  -${latestSummary.totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Net Profit</span>
                  <span className={cn(
                    "font-bold text-lg",
                    latestSummary.netProfit >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {latestSummary.netProfit >= 0 ? '+' : ''} 
                    ${latestSummary.netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {/* Asset Utilization */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Asset Utilization</span>
                  <span className="text-sm font-medium">
                    {(latestSummary.assetUtilization * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={latestSummary.assetUtilization * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Recent Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentEvents.length > 0 ? (
              recentEvents.map(event => (
                <div 
                  key={event.id} 
                  className="flex items-start gap-2 text-sm py-1 border-b last:border-0"
                >
                  {event.type === 'revenue-generated' && (
                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                  )}
                  {event.type === 'expense-incurred' && (
                    <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                  )}
                  {event.type === 'cycle-completed' && (
                    <Activity className="h-4 w-4 text-blue-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-muted-foreground">{event.description}</p>
                    <p className={cn(
                      "font-medium",
                      event.type === 'expense-incurred' ? "text-red-600" : "text-green-600"
                    )}>
                      {event.type === 'expense-incurred' ? '-' : '+'}
                      ${event.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No revenue activity yet</p>
                <p className="text-xs mt-1">Assign assets to routes to start generating revenue</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
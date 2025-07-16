import { useEffect, useRef } from 'react';
import { useRevenueService } from '@/services/revenueService';
import { useEmpireStore } from '../../src/store/empireStore';
import { useGameLoop } from '../../hooks/useGameLoop';

interface UseRevenueGenerationOptions {
  enabled?: boolean;
  onRevenueGenerated?: (amount: number) => void;
  onExpenseIncurred?: (amount: number) => void;
  onCycleCompleted?: (netIncome: number) => void;
}

export function useRevenueGeneration(options: UseRevenueGenerationOptions = {}) {
  const { 
    enabled = true, 
    onRevenueGenerated,
    onExpenseIncurred,
    onCycleCompleted
  } = options;
  
  const revenueService = useRevenueService();
  const isPaused = useEmpireStore(state => state.isPaused);
  const gameSpeed = useEmpireStore(state => state.gameSpeed);
  const currentTime = useEmpireStore(state => state.currentTime);
  
  const lastCheckRef = useRef<number>(Date.now());
  const isProcessingRef = useRef<boolean>(false);
  
  // Initialize service on mount
  useEffect(() => {
    revenueService.initializeService();
  }, []);
  
  // Subscribe to revenue events
  useEffect(() => {
    const unsubscribe = useRevenueService.subscribe(
      state => state.revenueEvents,
      (events, prevEvents) => {
        if (events.length > prevEvents.length) {
          const latestEvent = events[0];
          
          switch (latestEvent.type) {
            case 'revenue-generated':
              onRevenueGenerated?.(latestEvent.amount);
              break;
            case 'expense-incurred':
              onExpenseIncurred?.(latestEvent.amount);
              break;
            case 'cycle-completed':
              onCycleCompleted?.(latestEvent.amount);
              break;
          }
        }
      }
    );
    
    return unsubscribe;
  }, [onRevenueGenerated, onExpenseIncurred, onCycleCompleted]);
  
  // Process revenue generation in game loop
  useGameLoop(
    async (deltaTime) => {
      if (!enabled || isPaused || isProcessingRef.current) return;
      
      const now = Date.now();
      const gameTimeDelta = deltaTime * gameSpeed;
      
      // Check if it's time for next revenue cycle
      if (now >= revenueService.nextCycleTime) {
        isProcessingRef.current = true;
        
        try {
          await revenueService.startRevenueCycle();
        } catch (error) {
          console.error('Error processing revenue cycle:', error);
        } finally {
          isProcessingRef.current = false;
        }
      }
    },
    { paused: !enabled || isPaused }
  );
  
  // Public API
  return {
    // Current state
    currentCycle: revenueService.currentCycle,
    isProcessing: revenueService.isProcessing,
    nextCycleTime: revenueService.nextCycleTime,
    recentEvents: revenueService.revenueEvents.slice(0, 10),
    
    // Actions
    forceProcessCycle: async () => {
      if (!isProcessingRef.current) {
        isProcessingRef.current = true;
        try {
          await revenueService.startRevenueCycle();
        } finally {
          isProcessingRef.current = false;
        }
      }
    },
    
    generateReport: (days: number) => revenueService.generateFinancialReport(days),
    
    updateConfig: revenueService.updateConfig,
    
    // Summary data
    getLatestSummary: () => {
      const latestCycle = revenueService.cycleHistory[revenueService.cycleHistory.length - 1];
      return latestCycle?.summary || null;
    },
    
    getRevenueRate: () => {
      // Calculate revenue per hour based on last few cycles
      const recentCycles = revenueService.cycleHistory.slice(-5);
      if (recentCycles.length === 0) return 0;
      
      const totalRevenue = recentCycles.reduce((sum, cycle) => sum + cycle.summary.totalRevenue, 0);
      const totalTime = recentCycles.reduce((sum, cycle) => 
        sum + (cycle.endTime - cycle.startTime), 0
      );
      
      return totalTime > 0 ? (totalRevenue / totalTime) * 3600000 : 0; // Revenue per hour
    }
  };
}
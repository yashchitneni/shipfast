'use client';

import { useEffect } from 'react';
import { useTimeStore } from '@/app/stores/timeStore';
import { useEconomyStore } from '@/app/store/useEconomyStore';

export const useTimeSync = () => {
  const { activeEvents, updateTime, isPaused } = useTimeStore();
  const { applyTimeEventEffects, removeTimeEventEffects } = useEconomyStore();

  // Sync active events with economy
  useEffect(() => {
    if (activeEvents.length > 0) {
      // Combine all active event effects
      const combinedEffects = activeEvents.reduce(
        (acc, event) => {
          return {
            demandMultiplier: (acc.demandMultiplier || 1) * (event.effects.demandMultiplier || 1),
            priceMultiplier: (acc.priceMultiplier || 1) * (event.effects.priceMultiplier || 1),
            costMultiplier: (acc.costMultiplier || 1) * (event.effects.costMultiplier || 1)
          };
        },
        { demandMultiplier: 1, priceMultiplier: 1, costMultiplier: 1 }
      );
      
      applyTimeEventEffects(combinedEffects);
    } else {
      removeTimeEventEffects();
    }
  }, [activeEvents, applyTimeEventEffects, removeTimeEventEffects]);

  // Auto-update time when not paused
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        updateTime();
      }, 100); // Update every 100ms
      
      return () => clearInterval(interval);
    }
  }, [isPaused, updateTime]);
};
import { useEffect, useCallback } from 'react';
import { useAIStore } from '@/app/store/useAIStore';
import { PerformanceMetrics } from '@/types/ai-companion';

interface UseAICompanionOptions {
  userId: string;
  autoInitialize?: boolean;
  suggestionInterval?: number; // in milliseconds
}

export function useAICompanion({
  userId,
  autoInitialize = true,
  suggestionInterval = 30000,
}: UseAICompanionOptions) {
  const aiStore = useAIStore();
  const { companion, loadAIState, generateSuggestions, saveAIState } = aiStore;

  // Initialize AI on mount
  useEffect(() => {
    if (autoInitialize && userId && !companion) {
      loadAIState(userId);
    }
  }, [userId, autoInitialize, companion, loadAIState]);

  // Auto-save AI state periodically
  useEffect(() => {
    if (!companion) return;

    const saveInterval = setInterval(() => {
      saveAIState();
    }, 60000); // Save every minute

    return () => clearInterval(saveInterval);
  }, [companion, saveAIState]);

  // Generate suggestions periodically
  useEffect(() => {
    if (!companion || suggestionInterval <= 0) return;

    const suggestionTimer = setInterval(() => {
      generateSuggestions({}); // Pass actual game state here
    }, suggestionInterval);

    return () => clearInterval(suggestionTimer);
  }, [companion, suggestionInterval, generateSuggestions]);

  // Helper function to track route performance
  const trackRoutePerformance = useCallback((metrics: PerformanceMetrics) => {
    aiStore.learnFromRoute(metrics);
  }, [aiStore]);

  // Helper function to track market data
  const trackMarketData = useCallback((
    portId: string,
    goodId: string,
    price: number,
    volume: number
  ) => {
    aiStore.updateMarketInsights(portId, goodId, price, volume);
  }, [aiStore]);

  // Helper function to reward AI for successful suggestions
  const rewardSuggestion = useCallback((suggestionId: string, success: boolean) => {
    if (success) {
      aiStore.addExperience(50);
      // Update successful suggestions count
      aiStore.acceptSuggestion(suggestionId);
    } else {
      aiStore.dismissSuggestion(suggestionId);
    }
  }, [aiStore]);

  // Calculate current profit bonus
  const profitBonus = aiStore.getProfitBonus();
  const accuracy = aiStore.calculateAccuracy();

  return {
    companion,
    suggestions: aiStore.suggestions,
    isProcessing: aiStore.isProcessing,
    profitBonus,
    accuracy,
    trackRoutePerformance,
    trackMarketData,
    rewardSuggestion,
    generateSuggestions: () => generateSuggestions({}), // Pass game state
    dismissSuggestion: aiStore.dismissSuggestion,
    acceptSuggestion: aiStore.acceptSuggestion,
  };
}

// Example usage in a game component:
/*
const GameComponent = () => {
  const { user } = useUser();
  const {
    companion,
    suggestions,
    profitBonus,
    trackRoutePerformance,
    trackMarketData,
    acceptSuggestion,
    dismissSuggestion,
  } = useAICompanion({
    userId: user.id,
    suggestionInterval: 20000, // Generate suggestions every 20 seconds
  });

  // When a route is completed
  const onRouteComplete = (routeData) => {
    const metrics: PerformanceMetrics = {
      routeId: routeData.id,
      startTime: routeData.startTime,
      endTime: new Date(),
      profit: routeData.profit,
      expenses: routeData.expenses,
      cargo: routeData.cargo,
      incidents: routeData.incidents || [],
      weatherConditions: routeData.weather,
      success: routeData.profit > 0,
    };
    
    trackRoutePerformance(metrics);
  };

  // When market prices update
  const onMarketUpdate = (portId, goodId, price, volume) => {
    trackMarketData(portId, goodId, price, volume);
  };

  // Apply profit bonus to calculations
  const calculateFinalProfit = (baseProfit) => {
    return baseProfit * (1 + profitBonus);
  };

  return (
    <div>
      {companion && (
        <AICompanionPanel
          userId={user.id}
          gameState={gameState}
        />
      )}
      // Rest of game UI
    </div>
  );
};
*/
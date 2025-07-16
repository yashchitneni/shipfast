import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  AICompanionState, 
  AILevel, 
  AISuggestion, 
  PerformanceMetrics, 
  RoutePattern,
  MarketInsight,
  AI_LEVEL_CONFIGS,
  LearningData,
  PricePoint,
  DisasterPrediction,
  SuggestedAction
} from '@/types/ai-companion';
import { Route } from '@/types/game';

interface AIStore {
  // AI State
  companion: AICompanionState | null;
  suggestions: AISuggestion[];
  isProcessing: boolean;
  
  // Actions
  initializeAI: (userId: string, name?: string) => void;
  loadAIState: (userId: string) => Promise<void>;
  saveAIState: () => Promise<void>;
  
  // Learning actions
  learnFromRoute: (metrics: PerformanceMetrics) => void;
  updateMarketInsights: (portId: string, goodId: string, price: number, volume: number) => void;
  analyzeDisasterPatterns: (disasters: any[]) => void;
  
  // Suggestion actions
  generateSuggestions: (gameState: any) => void;
  dismissSuggestion: (suggestionId: string) => void;
  acceptSuggestion: (suggestionId: string) => void;
  
  // Level progression
  addExperience: (amount: number) => void;
  checkLevelUp: () => void;
  
  // Utility
  calculateAccuracy: () => number;
  getProfitBonus: () => number;
}

export const useAIStore = create<AIStore>()(
  subscribeWithSelector((set, get) => ({
    companion: null,
    suggestions: [],
    isProcessing: false,

    initializeAI: (userId: string, name = 'Navigator AI') => {
      const initialState: AICompanionState = {
        id: `ai-${userId}-${Date.now()}`,
        userId,
        name,
        level: AILevel.NOVICE,
        experience: 0,
        totalSuggestions: 0,
        successfulSuggestions: 0,
        accuracy: 0,
        learningData: {
          routePatterns: [],
          marketInsights: [],
          disasterPredictions: [],
          lastAnalyzedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set({ companion: initialState });
    },

    loadAIState: async (userId: string) => {
      try {
        // This will be implemented with Supabase integration
        const { loadAICompanion } = await import('@/lib/supabase/ai-companion');
        const companion = await loadAICompanion(userId);
        
        if (companion) {
          set({ companion });
        } else {
          get().initializeAI(userId);
        }
      } catch (error) {
        console.error('Failed to load AI state:', error);
        get().initializeAI(userId);
      }
    },

    saveAIState: async () => {
      const { companion } = get();
      if (!companion) return;

      try {
        const { saveAICompanion } = await import('@/lib/supabase/ai-companion');
        await saveAICompanion(companion);
      } catch (error) {
        console.error('Failed to save AI state:', error);
      }
    },

    learnFromRoute: (metrics: PerformanceMetrics) => {
      set((state) => {
        if (!state.companion) return state;

        const { routeId, profit, cargo, incidents } = metrics;
        const successRate = incidents.length === 0 ? 1 : 0.5;
        const profitMargin = profit / cargo.reduce((sum, c) => sum + (c.buyPrice * c.quantity), 0);

        // Find or create route pattern
        let routePattern = state.companion.learningData.routePatterns.find(
          (rp) => rp.routeId === routeId
        );

        if (routePattern) {
          // Update existing pattern
          routePattern.averageProfitMargin = 
            (routePattern.averageProfitMargin * routePattern.timesUsed + profitMargin) / 
            (routePattern.timesUsed + 1);
          routePattern.successRate = 
            (routePattern.successRate * routePattern.timesUsed + successRate) / 
            (routePattern.timesUsed + 1);
          routePattern.timesUsed++;
          routePattern.lastUsed = new Date();
          
          // Update optimal goods based on profit
          const profitableGoods = cargo
            .filter(c => c.sellPrice > c.buyPrice * 1.2)
            .map(c => c.goodId);
          routePattern.optimalGoods = [...new Set([...routePattern.optimalGoods, ...profitableGoods])];
        } else {
          // Create new pattern
          const newPattern: RoutePattern = {
            routeId,
            startPort: metrics.routeId.split('-')[0], // Simplified, should use actual data
            endPort: metrics.routeId.split('-')[1],
            averageProfitMargin: profitMargin,
            successRate,
            optimalGoods: cargo.map(c => c.goodId),
            bestTimeOfDay: new Date().getHours(),
            weatherPreference: 'any',
            timesUsed: 1,
            lastUsed: new Date(),
          };
          state.companion.learningData.routePatterns.push(newPattern);
        }

        // Add experience based on profit
        const expGained = Math.floor(profit / 1000) + (metrics.success ? 10 : 0);
        
        return {
          companion: {
            ...state.companion,
            experience: state.companion.experience + expGained,
            learningData: {
              ...state.companion.learningData,
              lastAnalyzedAt: new Date(),
            },
            updatedAt: new Date(),
          },
        };
      });

      get().checkLevelUp();
      get().saveAIState();
    },

    updateMarketInsights: (portId: string, goodId: string, price: number, volume: number) => {
      set((state) => {
        if (!state.companion) return state;

        let insight = state.companion.learningData.marketInsights.find(
          (mi) => mi.portId === portId && mi.goodId === goodId
        );

        const pricePoint: PricePoint = {
          price,
          timestamp: new Date(),
          volume,
        };

        if (insight) {
          insight.priceHistory.push(pricePoint);
          
          // Keep only last 100 price points
          if (insight.priceHistory.length > 100) {
            insight.priceHistory = insight.priceHistory.slice(-100);
          }

          // Analyze price trend
          const recentPrices = insight.priceHistory.slice(-10).map(p => p.price);
          const avgRecent = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
          const avgOlder = insight.priceHistory.slice(-20, -10).map(p => p.price)
            .reduce((a, b) => a + b, 0) / 10;

          if (avgRecent > avgOlder * 1.1) {
            insight.demandPattern = 'rising';
          } else if (avgRecent < avgOlder * 0.9) {
            insight.demandPattern = 'falling';
          } else if (Math.max(...recentPrices) / Math.min(...recentPrices) > 1.3) {
            insight.demandPattern = 'volatile';
          } else {
            insight.demandPattern = 'stable';
          }

          insight.profitPotential = (Math.max(...recentPrices) - Math.min(...recentPrices)) / avgRecent;
        } else {
          // Create new insight
          const newInsight: MarketInsight = {
            portId,
            goodId,
            priceHistory: [pricePoint],
            demandPattern: 'stable',
            bestBuyTimes: [],
            bestSellTimes: [],
            profitPotential: 0,
          };
          state.companion.learningData.marketInsights.push(newInsight);
        }

        return {
          companion: {
            ...state.companion,
            learningData: {
              ...state.companion.learningData,
              lastAnalyzedAt: new Date(),
            },
            updatedAt: new Date(),
          },
        };
      });
    },

    analyzeDisasterPatterns: (disasters: any[]) => {
      // This will analyze historical disaster data to predict future events
      // Implementation depends on disaster system integration
    },

    generateSuggestions: (gameState: any) => {
      const { companion } = get();
      if (!companion) return;

      set({ isProcessing: true });

      const suggestions: AISuggestion[] = [];
      const config = AI_LEVEL_CONFIGS[companion.level];

      // Generate route suggestions based on learned patterns
      if (config.unlockedFeatures.includes('route_optimization')) {
        const topRoutes = companion.learningData.routePatterns
          .sort((a, b) => b.averageProfitMargin - a.averageProfitMargin)
          .slice(0, 3);

        topRoutes.forEach((route) => {
          if (route.successRate > 0.7) {
            suggestions.push({
              id: `route-${Date.now()}-${Math.random()}`,
              type: 'route',
              priority: route.averageProfitMargin > 0.5 ? 'high' : 'medium',
              title: `Profitable Route: ${route.startPort} to ${route.endPort}`,
              description: `This route has shown ${(route.averageProfitMargin * 100).toFixed(1)}% average profit margin with ${(route.successRate * 100).toFixed(0)}% success rate.`,
              expectedProfit: route.averageProfitMargin * 10000, // Example calculation
              riskLevel: 1 - route.successRate,
              actionRequired: true,
              suggestedAction: {
                type: 'navigate',
                target: route.routeId,
                timing: 'within_hour',
                reasoning: `Based on ${route.timesUsed} successful runs`,
              },
              createdAt: new Date(),
            });
          }
        });
      }

      // Generate market predictions
      if (config.unlockedFeatures.includes('market_predictions')) {
        const volatileMarkets = companion.learningData.marketInsights
          .filter(mi => mi.demandPattern === 'rising' || mi.demandPattern === 'volatile')
          .slice(0, 2);

        volatileMarkets.forEach((market) => {
          suggestions.push({
            id: `market-${Date.now()}-${Math.random()}`,
            type: 'trade',
            priority: market.profitPotential > 0.3 ? 'high' : 'medium',
            title: `Market Opportunity: ${market.goodId} at ${market.portId}`,
            description: `${market.demandPattern === 'rising' ? 'Rising' : 'Volatile'} market detected with ${(market.profitPotential * 100).toFixed(1)}% profit potential.`,
            expectedProfit: market.profitPotential * 5000,
            actionRequired: true,
            suggestedAction: {
              type: market.demandPattern === 'rising' ? 'buy' : 'wait',
              target: market.goodId,
              timing: 'immediate',
              reasoning: `Market analysis shows ${market.demandPattern} trend`,
            },
            createdAt: new Date(),
          });
        });
      }

      set({ suggestions, isProcessing: false });
    },

    dismissSuggestion: (suggestionId: string) => {
      set((state) => ({
        suggestions: state.suggestions.filter(s => s.id !== suggestionId),
      }));
    },

    acceptSuggestion: (suggestionId: string) => {
      set((state) => {
        if (!state.companion) return state;

        return {
          suggestions: state.suggestions.filter(s => s.id !== suggestionId),
          companion: {
            ...state.companion,
            totalSuggestions: state.companion.totalSuggestions + 1,
            updatedAt: new Date(),
          },
        };
      });
    },

    addExperience: (amount: number) => {
      set((state) => {
        if (!state.companion) return state;

        return {
          companion: {
            ...state.companion,
            experience: state.companion.experience + amount,
            updatedAt: new Date(),
          },
        };
      });
    },

    checkLevelUp: () => {
      const { companion } = get();
      if (!companion) return;

      const currentLevelIndex = Object.values(AILevel).indexOf(companion.level);
      const nextLevel = Object.values(AILevel)[currentLevelIndex + 1];

      if (nextLevel) {
        const nextConfig = AI_LEVEL_CONFIGS[nextLevel];
        if (companion.experience >= nextConfig.requiredExperience) {
          set((state) => ({
            companion: state.companion ? {
              ...state.companion,
              level: nextLevel,
              updatedAt: new Date(),
            } : null,
          }));

          // Could trigger a notification here
          console.log(`AI Companion leveled up to ${nextLevel}!`);
        }
      }
    },

    calculateAccuracy: () => {
      const { companion } = get();
      if (!companion || companion.totalSuggestions === 0) return 0;
      
      const baseAccuracy = companion.successfulSuggestions / companion.totalSuggestions;
      const config = AI_LEVEL_CONFIGS[companion.level];
      
      return Math.min(baseAccuracy + config.accuracyBonus, 1);
    },

    getProfitBonus: () => {
      const { companion } = get();
      if (!companion) return 0;
      
      return AI_LEVEL_CONFIGS[companion.level].profitBonus;
    },
  }))
);
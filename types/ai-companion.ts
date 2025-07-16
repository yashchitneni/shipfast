// AI Companion Types for Flexport

export enum AILevel {
  NOVICE = 'novice',
  COMPETENT = 'competent',
  EXPERIENCED = 'experienced',
  EXPERT = 'expert',
  MASTER = 'master',
}

export interface AILevelConfig {
  level: AILevel;
  requiredExperience: number;
  accuracyBonus: number;
  profitBonus: number;
  unlockedFeatures: string[];
}

export interface AICompanionState {
  id: string;
  userId: string;
  name: string;
  level: AILevel;
  experience: number;
  totalSuggestions: number;
  successfulSuggestions: number;
  accuracy: number;
  learningData: LearningData;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningData {
  routePatterns: RoutePattern[];
  marketInsights: MarketInsight[];
  disasterPredictions: DisasterPrediction[];
  lastAnalyzedAt: Date;
}

export interface RoutePattern {
  routeId: string;
  startPort: string;
  endPort: string;
  averageProfitMargin: number;
  successRate: number;
  optimalGoods: string[];
  bestTimeOfDay: number; // 0-23 hours
  weatherPreference: 'calm' | 'moderate' | 'any';
  timesUsed: number;
  lastUsed: Date;
}

export interface MarketInsight {
  portId: string;
  goodId: string;
  priceHistory: PricePoint[];
  demandPattern: 'stable' | 'rising' | 'falling' | 'volatile';
  bestBuyTimes: number[]; // hours of day
  bestSellTimes: number[];
  profitPotential: number;
}

export interface PricePoint {
  price: number;
  timestamp: Date;
  volume: number;
}

export interface DisasterPrediction {
  type: 'storm' | 'piracy' | 'mechanical' | 'market_crash';
  likelihood: number; // 0-1
  affectedArea?: { x: number; y: number; radius: number };
  predictedTime: Date;
  confidence: number; // 0-1
}

export interface AISuggestion {
  id: string;
  type: 'route' | 'trade' | 'warning' | 'opportunity';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedProfit?: number;
  riskLevel?: number;
  actionRequired: boolean;
  suggestedAction?: SuggestedAction;
  expiresAt?: Date;
  createdAt: Date;
}

export interface SuggestedAction {
  type: 'buy' | 'sell' | 'navigate' | 'wait' | 'hire' | 'upgrade';
  target?: string; // goodId, portId, staffId, etc.
  quantity?: number;
  timing?: 'immediate' | 'within_hour' | 'today' | 'this_week';
  reasoning: string;
}

export interface PerformanceMetrics {
  routeId: string;
  startTime: Date;
  endTime: Date;
  profit: number;
  expenses: number;
  cargo: { goodId: string; quantity: number; buyPrice: number; sellPrice: number }[];
  incidents: { type: string; cost: number; delay: number }[];
  weatherConditions: string;
  success: boolean;
}

// Level configurations
export const AI_LEVEL_CONFIGS: Record<AILevel, AILevelConfig> = {
  [AILevel.NOVICE]: {
    level: AILevel.NOVICE,
    requiredExperience: 0,
    accuracyBonus: 0,
    profitBonus: 0,
    unlockedFeatures: ['basic_suggestions'],
  },
  [AILevel.COMPETENT]: {
    level: AILevel.COMPETENT,
    requiredExperience: 100,
    accuracyBonus: 0.1,
    profitBonus: 0.01,
    unlockedFeatures: ['basic_suggestions', 'route_optimization'],
  },
  [AILevel.EXPERIENCED]: {
    level: AILevel.EXPERIENCED,
    requiredExperience: 500,
    accuracyBonus: 0.2,
    profitBonus: 0.02,
    unlockedFeatures: ['basic_suggestions', 'route_optimization', 'market_predictions'],
  },
  [AILevel.EXPERT]: {
    level: AILevel.EXPERT,
    requiredExperience: 1500,
    accuracyBonus: 0.35,
    profitBonus: 0.03,
    unlockedFeatures: ['basic_suggestions', 'route_optimization', 'market_predictions', 'disaster_warnings'],
  },
  [AILevel.MASTER]: {
    level: AILevel.MASTER,
    requiredExperience: 5000,
    accuracyBonus: 0.5,
    profitBonus: 0.05,
    unlockedFeatures: ['basic_suggestions', 'route_optimization', 'market_predictions', 'disaster_warnings', 'advanced_strategies'],
  },
};
import { supabase } from './supabase';
import type { AICompanionState, AILevel, AISuggestion, MarketInsight, RoutePattern } from '@/types/ai-companion';

export const aiCompanionService = {
  /**
   * Load AI companion for a user
   */
  async loadAICompanion(userId: string): Promise<AICompanionState | null> {
    try {
      // Get companion data
      const { data: companion, error } = await supabase
        .from('ai_companions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !companion) {
        return null;
      }

      // Load route patterns
      const { data: routePatterns } = await supabase
        .from('ai_route_patterns')
        .select('*')
        .eq('companion_id', companion.id);

      // Load market insights
      const { data: marketInsights } = await supabase
        .from('ai_market_insights')
        .select('*')
        .eq('companion_id', companion.id);

      // Load recent disaster predictions
      const { data: disasterPredictions } = await supabase
        .from('ai_disaster_predictions')
        .select('*')
        .eq('companion_id', companion.id)
        .gte('predicted_date', new Date().toISOString());

      return {
        id: companion.id,
        userId: companion.user_id,
        name: companion.name,
        level: companion.level as AILevel,
        experience: companion.experience,
        totalSuggestions: companion.total_suggestions,
        successfulSuggestions: companion.successful_suggestions,
        accuracy: companion.accuracy,
        learningData: {
          routePatterns: routePatterns || [],
          marketInsights: marketInsights || [],
          disasterPredictions: disasterPredictions || [],
          lastAnalyzedAt: new Date(),
        },
        createdAt: new Date(companion.created_at),
        updatedAt: new Date(companion.updated_at),
      };
    } catch (error) {
      console.error('Error loading AI companion:', error);
      return null;
    }
  },

  /**
   * Save AI companion state
   */
  async saveAICompanion(companion: AICompanionState): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_companions')
        .upsert({
          id: companion.id,
          user_id: companion.userId,
          name: companion.name,
          level: companion.level,
          experience: companion.experience,
          total_suggestions: companion.totalSuggestions,
          successful_suggestions: companion.successfulSuggestions,
          accuracy: companion.accuracy,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving AI companion:', error);
        return false;
      }

      // Save route patterns
      if (companion.learningData.routePatterns.length > 0) {
        await supabase
          .from('ai_route_patterns')
          .upsert(
            companion.learningData.routePatterns.map(pattern => ({
              ...pattern,
              companion_id: companion.id,
            }))
          );
      }

      // Save market insights
      if (companion.learningData.marketInsights.length > 0) {
        await supabase
          .from('ai_market_insights')
          .upsert(
            companion.learningData.marketInsights.map(insight => ({
              ...insight,
              companion_id: companion.id,
              demand_pattern: insight.demandPattern,
              best_buy_times: insight.bestBuyTimes,
              best_sell_times: insight.bestSellTimes,
              profit_potential: insight.profitPotential,
            }))
          );
      }

      return true;
    } catch (error) {
      console.error('Error saving AI companion:', error);
      return false;
    }
  },

  /**
   * Create a new AI companion for a user
   */
  async createAICompanion(userId: string, name: string = 'Navigator AI'): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('ai_companions')
        .insert({
          user_id: userId,
          name,
          level: 'novice',
          experience: 0,
          total_suggestions: 0,
          successful_suggestions: 0,
          accuracy: 0,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating AI companion:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error creating AI companion:', error);
      return null;
    }
  },

  /**
   * Add experience to AI companion
   */
  async addExperience(companionId: string, experience: number): Promise<{ leveledUp: boolean; newLevel?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('add_ai_experience', {
          p_companion_id: companionId,
          p_experience: experience,
        });

      if (error) {
        console.error('Error adding experience:', error);
        return { leveledUp: false };
      }

      return {
        leveledUp: data.leveled_up,
        newLevel: data.new_level,
      };
    } catch (error) {
      console.error('Error adding experience:', error);
      return { leveledUp: false };
    }
  },

  /**
   * Save a new suggestion
   */
  async saveSuggestion(companionId: string, suggestion: Omit<AISuggestion, 'id'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('ai_suggestions')
        .insert({
          companion_id: companionId,
          type: suggestion.type,
          priority: suggestion.priority,
          title: suggestion.title,
          description: suggestion.description,
          expected_profit: suggestion.expectedProfit,
          risk_level: suggestion.riskLevel,
          action_required: suggestion.actionRequired,
          action_type: suggestion.suggestedAction?.type,
          action_target: suggestion.suggestedAction?.target,
          action_timing: suggestion.suggestedAction?.timing,
          action_reasoning: suggestion.suggestedAction?.reasoning,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving suggestion:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error saving suggestion:', error);
      return null;
    }
  },

  /**
   * Update suggestion status
   */
  async updateSuggestionStatus(suggestionId: string, status: 'accepted' | 'dismissed'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({
          status,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', suggestionId);

      if (error) {
        console.error('Error updating suggestion status:', error);
        return false;
      }

      // Update companion stats if accepted
      if (status === 'accepted') {
        const { data: suggestion } = await supabase
          .from('ai_suggestions')
          .select('companion_id')
          .eq('id', suggestionId)
          .single();

        if (suggestion) {
          await supabase
            .from('ai_companions')
            .update({
              total_suggestions: supabase.raw('total_suggestions + 1'),
              successful_suggestions: supabase.raw('successful_suggestions + 1'),
            })
            .eq('id', suggestion.companion_id);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating suggestion status:', error);
      return false;
    }
  },

  /**
   * Save price history for market analysis
   */
  async savePriceHistory(insightId: string, price: number, volume: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_price_history')
        .insert({
          insight_id: insightId,
          price,
          volume,
        });

      if (error) {
        console.error('Error saving price history:', error);
        return false;
      }

      // Clean up old price history
      await supabase.rpc('cleanup_old_price_history');

      return true;
    } catch (error) {
      console.error('Error saving price history:', error);
      return false;
    }
  },

  /**
   * Log a learning event
   */
  async logLearningEvent(
    companionId: string,
    eventType: string,
    eventData: any,
    experienceGained: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_learning_events')
        .insert({
          companion_id: companionId,
          event_type: eventType,
          event_data: eventData,
          experience_gained: experienceGained,
        });

      if (error) {
        console.error('Error logging learning event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error logging learning event:', error);
      return false;
    }
  },
};

// Export for AI store integration
export const loadAICompanion = aiCompanionService.loadAICompanion;
export const saveAICompanion = aiCompanionService.saveAICompanion;
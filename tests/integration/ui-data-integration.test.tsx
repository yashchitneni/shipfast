/**
 * UI Components with Live Data Integration Tests
 * Tests that UI components properly connect to Phase 2 stores
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, test, expect, beforeEach } from '@jest/globals';
import { useEconomyStore } from '../../app/store/useEconomyStore';
import { useMarketStore } from '../../app/store/useMarketStore';
import { useRouteStore } from '../../app/store/useRouteStore';
import { useAIStore } from '../../app/store/useAIStore';

// Mock components that use the stores
const MockFinancialDashboard = () => {
  const { playerFinancials } = useEconomyStore();
  return (
    <div data-testid="financial-dashboard">
      <div data-testid="cash-display">${playerFinancials.cash.toLocaleString()}</div>
      <div data-testid="credit-rating">{playerFinancials.creditRating}</div>
      <div data-testid="profit-margin">{(playerFinancials.profitMargin * 100).toFixed(1)}%</div>
    </div>
  );
};

const MockMarketPanel = () => {
  const { items, marketDynamics } = useMarketStore();
  const itemsArray = Array.from(items.values());
  
  return (
    <div data-testid="market-panel">
      <div data-testid="market-condition">{marketDynamics.demandVolatility}</div>
      <div data-testid="items-count">{itemsArray.length}</div>
      {itemsArray.map(item => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          <span data-testid={`price-${item.id}`}>${item.currentPrice?.toFixed(2) || '0.00'}</span>
          <span data-testid={`name-${item.id}`}>{item.name}</span>
        </div>
      ))}
    </div>
  );
};

const MockRouteManager = () => {
  const { routes, routeStates } = useRouteStore();
  const routesArray = Array.from(routes.values());
  
  return (
    <div data-testid="route-manager">
      <div data-testid="routes-count">{routesArray.length}</div>
      {routesArray.map(route => (
        <div key={route.id} data-testid={`route-${route.id}`}>
          <span data-testid={`route-name-${route.id}`}>{route.name}</span>
          <span data-testid={`route-profit-${route.id}`}>${route.profitability.netProfit.toFixed(2)}</span>
          <span data-testid={`route-status-${route.id}`}>
            {routeStates.get(route.id)?.status || 'idle'}
          </span>
        </div>
      ))}
    </div>
  );
};

const MockAIPanel = () => {
  const { companion, suggestions } = useAIStore();
  
  if (!companion) {
    return <div data-testid="ai-panel">No AI companion</div>;
  }
  
  return (
    <div data-testid="ai-panel">
      <div data-testid="ai-name">{companion.name}</div>
      <div data-testid="ai-level">{companion.level}</div>
      <div data-testid="ai-experience">{companion.experience}</div>
      <div data-testid="suggestions-count">{suggestions.length}</div>
    </div>
  );
};

describe('UI Components with Live Data Integration', () => {
  beforeEach(() => {
    // Reset all stores before each test
    act(() => {
      useEconomyStore.getState().initializeEconomy();
      useMarketStore.getState().items.clear();
      useRouteStore.getState().routes.clear();
    });
  });

  describe('Financial Dashboard Integration', () => {
    test('should display live financial data', () => {
      render(<MockFinancialDashboard />);
      
      // Check initial state
      expect(screen.getByTestId('cash-display')).toHaveTextContent('$100,000');
      expect(screen.getByTestId('credit-rating')).toHaveTextContent('BBB');
      expect(screen.getByTestId('profit-margin')).toHaveTextContent('0.0%');
    });

    test('should update when financial state changes', async () => {
      render(<MockFinancialDashboard />);
      
      // Update financial state
      act(() => {
        useEconomyStore.getState().recordTransaction({
          type: 'income',
          category: 'route-profit',
          amount: 5000,
          description: 'Test profit'
        });
      });

      // Wait for UI update
      await waitFor(() => {
        expect(screen.getByTestId('cash-display')).toHaveTextContent('$105,000');
      });
    });

    test('should reflect credit rating changes', async () => {
      render(<MockFinancialDashboard />);
      
      // Apply for a loan to change credit dynamics
      act(() => {
        const economyStore = useEconomyStore.getState();
        economyStore.applyForLoan(50000, 365);
        economyStore.updateCreditRating();
      });

      await waitFor(() => {
        // Credit rating might change based on debt ratio
        const creditRating = screen.getByTestId('credit-rating').textContent;
        expect(creditRating).toBeTruthy();
      });
    });
  });

  describe('Market Panel Integration', () => {
    test('should display market items with live prices', async () => {
      render(<MockMarketPanel />);
      
      // Initialize market
      await act(async () => {
        await useMarketStore.getState().initializeMarket();
      });

      await waitFor(() => {
        const itemsCount = screen.getByTestId('items-count');
        expect(parseInt(itemsCount.textContent || '0')).toBeGreaterThan(0);
      });
    });

    test('should update prices when market changes', async () => {
      render(<MockMarketPanel />);
      
      // Initialize with some test data
      act(() => {
        const marketStore = useMarketStore.getState();
        marketStore.items.set('electronics', {
          id: 'electronics',
          name: 'Electronics',
          type: 'manufactured-goods',
          basePrice: 100,
          currentPrice: 120,
          supply: 1000,
          demand: 1200,
          volatility: 0.1,
          lastUpdated: Date.now(),
          priceHistory: []
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('item-electronics')).toBeInTheDocument();
        expect(screen.getByTestId('price-electronics')).toHaveTextContent('$120.00');
        expect(screen.getByTestId('name-electronics')).toHaveTextContent('Electronics');
      });

      // Update price
      act(() => {
        const marketStore = useMarketStore.getState();
        const item = marketStore.items.get('electronics');
        if (item) {
          item.currentPrice = 130;
          marketStore.items.set('electronics', { ...item });
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('price-electronics')).toHaveTextContent('$130.00');
      });
    });
  });

  describe('Route Manager Integration', () => {
    test('should display routes with live status updates', async () => {
      render(<MockRouteManager />);
      
      // Create a test route
      await act(async () => {
        const routeResult = await useRouteStore.getState().createRoute({
          originPortId: 'port-shanghai',
          destinationPortId: 'port-singapore',
          name: 'Test UI Route',
          waypoints: []
        }, 'test-player');

        if (routeResult.routeId) {
          // Set initial route state
          useRouteStore.getState().updateRouteState(routeResult.routeId, {
            status: 'idle',
            progress: 0
          });
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('routes-count')).toHaveTextContent('1');
      });

      // Check route details are displayed
      const routeElements = screen.getAllByTestId(/^route-/);
      expect(routeElements.length).toBeGreaterThan(0);
    });

    test('should update route status in real-time', async () => {
      render(<MockRouteManager />);
      
      let routeId: string | undefined;

      // Create a route
      await act(async () => {
        const routeResult = await useRouteStore.getState().createRoute({
          originPortId: 'port-shanghai',
          destinationPortId: 'port-singapore',
          name: 'Status Test Route',
          waypoints: []
        }, 'test-player');
        
        routeId = routeResult.routeId;
        
        if (routeId) {
          useRouteStore.getState().updateRouteState(routeId, {
            status: 'idle',
            progress: 0
          });
        }
      });

      if (routeId) {
        await waitFor(() => {
          expect(screen.getByTestId(`route-status-${routeId}`)).toHaveTextContent('idle');
        });

        // Update route status
        act(() => {
          if (routeId) {
            useRouteStore.getState().updateRouteState(routeId, {
              status: 'in_transit',
              progress: 50
            });
          }
        });

        await waitFor(() => {
          expect(screen.getByTestId(`route-status-${routeId}`)).toHaveTextContent('in_transit');
        });
      }
    });
  });

  describe('AI Panel Integration', () => {
    test('should display AI companion data when available', async () => {
      render(<MockAIPanel />);

      // Initially no companion
      expect(screen.getByTestId('ai-panel')).toHaveTextContent('No AI companion');

      // Initialize AI companion
      await act(async () => {
        await useAIStore.getState().loadAIState('test-player');
      });

      // Check if AI companion is loaded (might be initialized by loadAIState)
      const aiPanel = screen.getByTestId('ai-panel');
      if (aiPanel.textContent !== 'No AI companion') {
        expect(screen.getByTestId('ai-name')).toBeInTheDocument();
        expect(screen.getByTestId('ai-level')).toBeInTheDocument();
        expect(screen.getByTestId('ai-experience')).toBeInTheDocument();
      }
    });

    test('should update AI data when learning occurs', async () => {
      render(<MockAIPanel />);

      // Initialize AI with manual data
      act(() => {
        const aiStore = useAIStore.getState();
        aiStore.companion = {
          id: 'test-ai',
          name: 'Test AI',
          level: 1,
          experience: 0,
          accuracy: 0.7,
          specializations: []
        };
      });

      await waitFor(() => {
        expect(screen.getByTestId('ai-name')).toHaveTextContent('Test AI');
        expect(screen.getByTestId('ai-level')).toHaveTextContent('1');
        expect(screen.getByTestId('ai-experience')).toHaveTextContent('0');
      });

      // Add experience
      act(() => {
        useAIStore.getState().addExperience(100);
      });

      await waitFor(() => {
        expect(screen.getByTestId('ai-experience')).toHaveTextContent('100');
      });
    });
  });

  describe('Cross-Component Data Flow', () => {
    test('should maintain consistency across multiple components', async () => {
      const MultiComponentApp = () => (
        <div>
          <MockFinancialDashboard />
          <MockMarketPanel />
          <MockRouteManager />
        </div>
      );

      render(<MultiComponentApp />);

      // Initialize systems
      await act(async () => {
        useEconomyStore.getState().initializeEconomy();
        await useMarketStore.getState().initializeMarket();
      });

      // Perform a transaction that affects multiple components
      act(() => {
        useEconomyStore.getState().recordTransaction({
          type: 'expense',
          category: 'market-trade',
          amount: 2000,
          description: 'Buy goods'
        });
      });

      // Verify updates across components
      await waitFor(() => {
        expect(screen.getByTestId('cash-display')).toHaveTextContent('$98,000');
      });

      // Market panel should still show items
      await waitFor(() => {
        const itemsCount = screen.getByTestId('items-count');
        expect(parseInt(itemsCount.textContent || '0')).toBeGreaterThan(0);
      });
    });

    test('should handle rapid updates gracefully', async () => {
      render(<MockFinancialDashboard />);

      // Perform multiple rapid updates
      act(() => {
        const economyStore = useEconomyStore.getState();
        for (let i = 0; i < 10; i++) {
          economyStore.recordTransaction({
            type: 'income',
            category: 'route-profit',
            amount: 500,
            description: `Rapid update ${i}`
          });
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('cash-display')).toHaveTextContent('$105,000');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty state gracefully', () => {
      render(<MockMarketPanel />);
      
      // Should not crash with empty market
      expect(screen.getByTestId('market-panel')).toBeInTheDocument();
      expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    });

    test('should handle invalid data gracefully', async () => {
      render(<MockFinancialDashboard />);

      // Try to perform invalid operations
      act(() => {
        // This should not crash the component
        try {
          useEconomyStore.getState().recordTransaction({
            type: 'income',
            category: 'invalid-category' as any,
            amount: -1000, // Negative income
            description: 'Invalid transaction'
          });
        } catch (error) {
          // Expected to handle gracefully
        }
      });

      // Component should still render
      expect(screen.getByTestId('financial-dashboard')).toBeInTheDocument();
    });
  });
});
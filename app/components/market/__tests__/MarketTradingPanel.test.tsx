import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MarketTradingPanel } from '../MarketTradingPanel';
import { useMarketStore } from '@/app/store/useMarketStore';
import { useEmpireStore } from '@/src/store/empireStore';

// Mock the stores
jest.mock('@/app/store/useMarketStore');
jest.mock('@/src/store/empireStore');

const mockUseMarketStore = useMarketStore as jest.MockedFunction<typeof useMarketStore>;
const mockUseEmpireStore = useEmpireStore as jest.MockedFunction<typeof useEmpireStore>;

describe('MarketTradingPanel', () => {
  const mockMarketItems = new Map([
    ['item-1', {
      id: 'item-1',
      name: 'Electronics',
      type: 'GOODS',
      category: 'MANUFACTURED',
      basePrice: 120,
      currentPrice: 125,
      supply: 150,
      demand: 180,
      volatility: 0.02,
      productionCostModifier: 1.0,
      lastUpdated: new Date()
    }],
    ['item-2', {
      id: 'item-2',
      name: 'Oil',
      type: 'GOODS',
      category: 'RAW_MATERIALS',
      basePrice: 80,
      currentPrice: 85,
      supply: 500,
      demand: 450,
      volatility: 0.03,
      productionCostModifier: 1.0,
      lastUpdated: new Date()
    }]
  ]);

  const mockPlayer = {
    id: 'player-1',
    name: 'Test Player',
    cash: 50000,
    avatar: 'captain'
  };

  beforeEach(() => {
    mockUseMarketStore.mockReturnValue({
      items: mockMarketItems,
      transactions: [],
      isLoading: false,
      error: null,
      initializeMarket: jest.fn(),
      buyItem: jest.fn().mockResolvedValue({
        id: 'tx-1',
        marketItemId: 'item-1',
        type: 'BUY',
        quantity: 10,
        pricePerUnit: 125,
        totalPrice: 1250,
        playerId: 'player-1',
        timestamp: new Date()
      }),
      sellItem: jest.fn().mockResolvedValue({
        id: 'tx-2',
        marketItemId: 'item-1',
        type: 'SELL',
        quantity: 5,
        pricePerUnit: 125,
        totalPrice: 625,
        playerId: 'player-1',
        timestamp: new Date()
      }),
      getItemsByCategory: jest.fn((category) => 
        Array.from(mockMarketItems.values()).filter(item => item.category === category)
      ),
      getMarketTrends: jest.fn(() => ({ trend: 'up', percentageChange: 5.2 }))
    } as any);

    mockUseEmpireStore.mockReturnValue({
      player: mockPlayer,
      updatePlayerCash: jest.fn()
    } as any);
  });

  it('renders market items correctly', async () => {
    render(<MarketTradingPanel />);

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Oil')).toBeInTheDocument();
    });
  });

  it('filters items by category', async () => {
    render(<MarketTradingPanel />);

    const manufacturedButton = screen.getByText('Manufactured');
    fireEvent.click(manufacturedButton);

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.queryByText('Oil')).not.toBeInTheDocument();
    });
  });

  it('shows item details when selected', async () => {
    render(<MarketTradingPanel />);

    const electronicsItem = screen.getByText('Electronics').closest('div[class*="cursor-pointer"]');
    fireEvent.click(electronicsItem!);

    await waitFor(() => {
      expect(screen.getByText('Trade Electronics')).toBeInTheDocument();
      expect(screen.getByText('$125.00')).toBeInTheDocument();
      expect(screen.getByText('150 units')).toBeInTheDocument();
    });
  });

  it('handles buy transaction', async () => {
    const { buyItem, updatePlayerCash } = mockUseMarketStore();
    const { updatePlayerCash: updateCash } = mockUseEmpireStore();

    render(<MarketTradingPanel />);

    // Select an item
    const electronicsItem = screen.getByText('Electronics').closest('div[class*="cursor-pointer"]');
    fireEvent.click(electronicsItem!);

    // Set quantity
    const quantityInput = screen.getByRole('spinbutton');
    fireEvent.change(quantityInput, { target: { value: '10' } });

    // Click buy
    const buyButton = screen.getByText('Buy');
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(buyItem).toHaveBeenCalledWith('item-1', 10, 'player-1');
      expect(updateCash).toHaveBeenCalledWith(-1250);
    });
  });

  it('shows loading state', () => {
    mockUseMarketStore.mockReturnValue({
      ...mockUseMarketStore(),
      isLoading: true
    } as any);

    render(<MarketTradingPanel />);
    expect(screen.getByText('Loading market data...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseMarketStore.mockReturnValue({
      ...mockUseMarketStore(),
      error: 'Failed to load market data'
    } as any);

    render(<MarketTradingPanel />);
    expect(screen.getByText('Failed to load market data')).toBeInTheDocument();
  });

  it('disables buy button when insufficient funds', async () => {
    mockUseEmpireStore.mockReturnValue({
      player: { ...mockPlayer, cash: 100 },
      updatePlayerCash: jest.fn()
    } as any);

    render(<MarketTradingPanel />);

    // Select an item
    const electronicsItem = screen.getByText('Electronics').closest('div[class*="cursor-pointer"]');
    fireEvent.click(electronicsItem!);

    // Set high quantity
    const quantityInput = screen.getByRole('spinbutton');
    fireEvent.change(quantityInput, { target: { value: '100' } });

    // Buy button should be disabled
    const buyButton = screen.getByText('Buy');
    expect(buyButton).toBeDisabled();
  });
});
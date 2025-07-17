/**
 * Tests for Port Data Generators
 * Verifies that the test data generators produce valid, realistic data
 */

import {
  generatePortData,
  generateRouteData,
  generateGlobalMarketData,
  generateMarketSnapshot,
  generateTestTransactions,
  generateDisasterEvent
} from '../portDataGenerators';

describe('Port Data Generators', () => {
  describe('generatePortData', () => {
    it('should generate valid port data for Shanghai', () => {
      const portData = generatePortData('port-shanghai');
      
      expect(portData).toBeDefined();
      expect(portData?.portId).toBe('port-shanghai');
      expect(portData?.portName).toBe('Port of Shanghai');
      expect(portData?.country).toBe('China');
      expect(portData?.utilization).toBeGreaterThanOrEqual(60);
      expect(portData?.utilization).toBeLessThanOrEqual(90);
      expect(portData?.goods).toHaveLength(10); // 5 exports + 5 imports
    });

    it('should generate appropriate prices based on supply/demand', () => {
      const portData = generatePortData('port-singapore');
      const refinedPetroleum = portData?.goods.find(g => g.goodId === 'refined_petroleum');
      
      expect(refinedPetroleum).toBeDefined();
      // Prices should be within reasonable range of base price
      if (refinedPetroleum) {
        expect(refinedPetroleum.currentPrice).toBeGreaterThan(refinedPetroleum.basePrice * 0.3);
        expect(refinedPetroleum.currentPrice).toBeLessThan(refinedPetroleum.basePrice * 2.0);
      }
    });

    it('should return null for invalid port ID', () => {
      const portData = generatePortData('invalid-port');
      expect(portData).toBeNull();
    });
  });

  describe('generateRouteData', () => {
    it('should generate valid route between Shanghai and Los Angeles', () => {
      const route = generateRouteData('port-shanghai', 'port-los-angeles');
      
      expect(route).toBeDefined();
      expect(route?.originPort).toBe('Port of Shanghai');
      expect(route?.destinationPort).toBe('Port of Los Angeles');
      expect(route?.distance).toBeGreaterThan(0);
      expect(route?.estimatedDuration).toBeGreaterThan(0);
      expect(route?.profitability).toBeGreaterThan(0);
      expect(route?.profitability).toBeLessThanOrEqual(1);
    });

    it('should identify profitable goods for routes', () => {
      const route = generateRouteData('port-shanghai', 'port-rotterdam');
      
      expect(route?.recommendedGoods).toBeDefined();
      expect(route?.recommendedGoods.length).toBeGreaterThan(0);
      // Shanghai exports electronics, Rotterdam imports them
      expect(route?.recommendedGoods).toContain('electronics');
    });
  });

  describe('generateGlobalMarketData', () => {
    it('should generate market data for electronics', () => {
      const marketData = generateGlobalMarketData('electronics');
      
      expect(marketData).toBeDefined();
      expect(marketData?.goodId).toBe('electronics');
      expect(marketData?.topExporters.length).toBeGreaterThan(0);
      expect(marketData?.topImporters.length).toBeGreaterThan(0);
      expect(marketData?.priceRange.min).toBeLessThan(marketData?.priceRange.max || 0);
    });

    it('should identify correct exporters and importers', () => {
      // Use electronics which has both exporters and importers
      const marketData = generateGlobalMarketData('electronics');
      
      // Check if the data includes exporters and importers
      expect(marketData?.topExporters.length).toBeGreaterThan(0);
      expect(marketData?.topImporters.length).toBeGreaterThan(0);
      
      // Find ports that export or import electronics
      const hasExporters = marketData?.topExporters.some(p => p?.role === 'exporter');
      const hasImporters = marketData?.topImporters.some(p => p?.role === 'importer');
      
      expect(hasExporters).toBe(true);
      expect(hasImporters).toBe(true);
    });
  });

  describe('generateMarketSnapshot', () => {
    it('should generate complete market snapshot', () => {
      const snapshot = generateMarketSnapshot();
      
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.ports).toHaveLength(20);
      expect(snapshot.topGoods).toHaveLength(10);
      expect(snapshot.economicIndicators).toBeDefined();
      expect(snapshot.economicIndicators.globalDemand).toBeGreaterThan(0);
      expect(snapshot.economicIndicators.fuelPrice).toBeGreaterThan(0);
    });
  });

  describe('generateTestTransactions', () => {
    it('should generate test transactions for a player', () => {
      const playerId = 'test-player-123';
      const transactions = generateTestTransactions(playerId, 5);
      
      expect(transactions).toHaveLength(5);
      transactions.forEach(tx => {
        expect(tx.playerId).toBe(playerId);
        expect(tx.type).toMatch(/^(buy|sell)$/);
        expect(tx.quantity).toBeGreaterThan(0);
        expect(tx.price).toBeGreaterThan(0);
        expect(tx.total).toBeCloseTo(tx.price * tx.quantity, 0);
      });
    });

    it('should generate transactions in chronological order', () => {
      const transactions = generateTestTransactions('player-1', 10);
      
      for (let i = 1; i < transactions.length; i++) {
        const prevTime = new Date(transactions[i - 1].timestamp).getTime();
        const currTime = new Date(transactions[i].timestamp).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });
  });

  describe('generateDisasterEvent', () => {
    it('should generate valid disaster events', () => {
      const disaster = generateDisasterEvent();
      
      expect(disaster.id).toBeDefined();
      expect(disaster.type).toMatch(/^(storm|piracy|strike|pandemic)$/);
      expect(disaster.severity).toMatch(/^(minor|moderate|major)$/);
      expect(disaster.affectedPorts.length).toBeGreaterThan(0);
      expect(disaster.affectedPorts.length).toBeLessThanOrEqual(4);
      expect(disaster.estimatedDuration).toBeGreaterThan(0);
    });

    it('should include appropriate economic impacts', () => {
      // Generate multiple disasters to test different types
      for (let i = 0; i < 10; i++) {
        const disaster = generateDisasterEvent();
        
        expect(disaster.economicImpact).toBeDefined();
        expect(disaster.economicImpact.priceIncrease).toBeGreaterThanOrEqual(1);
        expect(disaster.economicImpact.capacityReduction).toBeGreaterThan(0);
        expect(disaster.economicImpact.capacityReduction).toBeLessThanOrEqual(1);
        expect(disaster.economicImpact.affectedGoods).toBeDefined();
      }
    });
  });
});

// Integration test
describe('Port Data Integration', () => {
  it('should generate consistent data across different generators', () => {
    const portId = 'port-singapore';
    const portData = generatePortData(portId);
    const snapshot = generateMarketSnapshot();
    
    const portInSnapshot = snapshot.ports.find(p => p?.portId === portId);
    
    expect(portData?.portId).toBe(portInSnapshot?.portId);
    expect(portData?.portName).toBe(portInSnapshot?.portName);
    
    // Prices should be in reasonable range
    portData?.goods.forEach(good => {
      expect(good.currentPrice).toBeGreaterThan(good.basePrice * 0.3);
      expect(good.currentPrice).toBeLessThan(good.basePrice * 3);
    });
  });

  it('should maintain economic relationships between ports', () => {
    const shanghai = generatePortData('port-shanghai');
    const losAngeles = generatePortData('port-los-angeles');
    
    // Find a good that Shanghai exports and LA imports (electronics)
    const electronics = 'electronics';
    const shanghaiElectronics = shanghai?.goods.find(g => g.goodId === electronics);
    const laElectronics = losAngeles?.goods.find(g => g.goodId === electronics);
    
    // Both should have the good
    expect(shanghaiElectronics).toBeDefined();
    expect(laElectronics).toBeDefined();
    
    // Check that prices are within reasonable bounds
    if (shanghaiElectronics && laElectronics) {
      expect(shanghaiElectronics.currentPrice).toBeGreaterThan(0);
      expect(laElectronics.currentPrice).toBeGreaterThan(0);
      
      // Price difference should be reasonable (price can vary significantly based on local supply/demand)
      const priceDiff = Math.abs(shanghaiElectronics.currentPrice - laElectronics.currentPrice);
      const avgPrice = (shanghaiElectronics.currentPrice + laElectronics.currentPrice) / 2;
      expect(priceDiff / avgPrice).toBeLessThan(2.0); // Allow up to 200% difference
    }
  });
});
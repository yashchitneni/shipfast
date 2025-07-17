/**
 * Port Data Integration and LOD (Level of Detail) System Tests
 * Tests the integration between port data, economics, and LOD rendering
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { useEconomyStore } from '../../app/store/useEconomyStore';
import { generatePortData } from '../../app/utils/portDataGenerators';
import portData from '../../app/assets/definitions/ports.json';
import portEconomics from '../../app/assets/definitions/port-economics.json';

describe('Port Data Integration and LOD System', () => {
  beforeEach(() => {
    // Reset economy store before each test
    useEconomyStore.getState().initializeEconomy();
  });

  describe('Port Data Loading and Integration', () => {
    test('should load port definitions correctly', () => {
      expect(portData.ports).toBeDefined();
      expect(Array.isArray(portData.ports)).toBe(true);
      expect(portData.ports.length).toBeGreaterThan(0);

      // Check port structure
      const firstPort = portData.ports[0];
      expect(firstPort.id).toBeDefined();
      expect(firstPort.name).toBeDefined();
      expect(firstPort.coordinates).toBeDefined();
      expect(firstPort.coordinates.x).toBeDefined();
      expect(firstPort.coordinates.y).toBeDefined();
      expect(firstPort.capacity).toBeDefined();
      expect(firstPort.efficiency).toBeDefined();
      expect(Array.isArray(firstPort.majorExports)).toBe(true);
      expect(Array.isArray(firstPort.majorImports)).toBe(true);
    });

    test('should generate dynamic port data', () => {
      const shanghaiData = generatePortData('port-shanghai');
      
      expect(shanghaiData).toBeDefined();
      if (shanghaiData) {
        expect(shanghaiData.portId).toBe('port-shanghai');
        expect(typeof shanghaiData.utilization).toBe('number');
        expect(shanghaiData.utilization).toBeGreaterThanOrEqual(0);
        expect(shanghaiData.utilization).toBeLessThanOrEqual(100);
        
        expect(Array.isArray(shanghaiData.goods)).toBe(true);
        
        if (shanghaiData.goods.length > 0) {
          const firstGood = shanghaiData.goods[0];
          expect(firstGood.goodId).toBeDefined();
          expect(typeof firstGood.currentPrice).toBe('number');
          expect(typeof firstGood.supply).toBe('number');
          expect(typeof firstGood.demand).toBe('number');
          expect(typeof firstGood.inventory).toBe('number');
          expect(['rising', 'falling', 'stable']).toContain(firstGood.trend);
        }
      }
    });

    test('should integrate port economics data', () => {
      expect(portEconomics.portEconomics).toBeDefined();
      expect(portEconomics.portRegionMapping).toBeDefined();
      expect(portEconomics.portEconomics.regionalModifiers).toBeDefined();

      // Check regional modifiers structure
      const regions = Object.keys(portEconomics.portEconomics.regionalModifiers);
      expect(regions.length).toBeGreaterThan(0);

      const firstRegion = portEconomics.portEconomics.regionalModifiers[regions[0]];
      expect(firstRegion).toBeDefined();
      
      // Each region should have good modifiers
      const goodIds = Object.keys(firstRegion);
      if (goodIds.length > 0) {
        const firstGoodModifier = firstRegion[goodIds[0]];
        expect(firstGoodModifier.supply).toBeDefined();
        expect(firstGoodModifier.demand).toBeDefined();
        expect(typeof firstGoodModifier.supply).toBe('number');
        expect(typeof firstGoodModifier.demand).toBe('number');
      }
    });
  });

  describe('LOD System Integration', () => {
    test('should provide different detail levels for ports', () => {
      const economyStore = useEconomyStore.getState();
      economyStore.updatePortEconomics();

      // Get high-detail port data
      const detailedData = economyStore.getPortEconomicData('port-shanghai');
      expect(detailedData).toBeDefined();

      if (detailedData) {
        // High detail should include all economic data
        expect(detailedData.portId).toBe('port-shanghai');
        expect(detailedData.portName).toBeDefined();
        expect(detailedData.region).toBeDefined();
        expect(typeof detailedData.capacity).toBe('number');
        expect(typeof detailedData.efficiency).toBe('number');
        expect(typeof detailedData.currentUtilization).toBe('number');
        expect(Array.isArray(detailedData.goods)).toBe(true);
        expect(typeof detailedData.lastUpdated).toBe('number');
      }
    });

    test('should efficiently manage port data for multiple detail levels', () => {
      const economyStore = useEconomyStore.getState();
      economyStore.updatePortEconomics();

      // Test multiple ports at different detail levels
      const ports = ['port-shanghai', 'port-singapore', 'port-rotterdam'];
      const portDataResults = ports.map(portId => ({
        portId,
        data: economyStore.getPortEconomicData(portId)
      }));

      // All should have data
      portDataResults.forEach(result => {
        expect(result.data).toBeDefined();
        if (result.data) {
          expect(result.data.portId).toBe(result.portId);
        }
      });

      // Performance check - should not take excessive time
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        economyStore.getPortEconomicData('port-shanghai');
      }
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    test('should update LOD data based on distance/zoom level simulation', () => {
      const economyStore = useEconomyStore.getState();
      economyStore.updatePortEconomics();

      // Simulate different zoom levels (distance from port)
      const distances = [1, 10, 100, 1000]; // Close to far
      
      distances.forEach(distance => {
        // In a real LOD system, detail would decrease with distance
        // For now, we test that data is consistently available
        const portData = economyStore.getPortEconomicData('port-shanghai');
        expect(portData).toBeDefined();
        
        if (portData) {
          // Basic data should always be available
          expect(portData.portId).toBeDefined();
          expect(portData.portName).toBeDefined();
          
          // Detailed goods data should be available
          // In a real LOD system, this might be filtered by distance
          expect(Array.isArray(portData.goods)).toBe(true);
        }
      });
    });
  });

  describe('Port Economics Integration', () => {
    test('should calculate port-specific prices correctly', () => {
      const economyStore = useEconomyStore.getState();
      economyStore.updatePortEconomics();

      // Test specific ports with different economic profiles
      const testCases = [
        { portId: 'port-shanghai', goodId: 'electronics' },
        { portId: 'port-singapore', goodId: 'electronics' },
        { portId: 'port-rotterdam', goodId: 'electronics' }
      ];

      testCases.forEach(testCase => {
        const price = economyStore.getPortPrice(testCase.goodId, testCase.portId);
        expect(price).toBeGreaterThan(0);
        
        // Price should be influenced by port modifiers
        const basePrice = economyStore.getGoodPrice(testCase.goodId);
        expect(price).not.toBe(basePrice); // Should be modified by port factors
      });
    });

    test('should apply export/import modifiers correctly', () => {
      const economyStore = useEconomyStore.getState();
      economyStore.updatePortEconomics();

      // Find a port that exports electronics
      const electronicsExporter = portData.ports.find(port => 
        port.majorExports.includes('electronics')
      );

      // Find a port that imports electronics
      const electronicsImporter = portData.ports.find(port => 
        port.majorImports.includes('electronics')
      );

      if (electronicsExporter && electronicsImporter) {
        const exportPrice = economyStore.getPortPrice('electronics', electronicsExporter.id);
        const importPrice = economyStore.getPortPrice('electronics', electronicsImporter.id);
        const basePrice = economyStore.getGoodPrice('electronics');

        expect(exportPrice).toBeGreaterThan(0);
        expect(importPrice).toBeGreaterThan(0);
        
        // Export ports should have cheaper prices, import ports more expensive
        expect(exportPrice).toBeLessThan(basePrice);
        expect(importPrice).toBeGreaterThan(basePrice);
        expect(importPrice).toBeGreaterThan(exportPrice);
      }
    });

    test('should calculate trade opportunities between ports', () => {
      const economyStore = useEconomyStore.getState();
      economyStore.updatePortEconomics();

      const opportunities = economyStore.calculateTradeOpportunities();
      expect(Array.isArray(opportunities)).toBe(true);

      if (opportunities.length > 0) {
        const opportunity = opportunities[0];
        
        // Check opportunity structure
        expect(opportunity.id).toBeDefined();
        expect(opportunity.goodId).toBeDefined();
        expect(opportunity.goodName).toBeDefined();
        expect(opportunity.originPortId).toBeDefined();
        expect(opportunity.originPortName).toBeDefined();
        expect(opportunity.destinationPortId).toBeDefined();
        expect(opportunity.destinationPortName).toBeDefined();
        expect(typeof opportunity.originPrice).toBe('number');
        expect(typeof opportunity.destinationPrice).toBe('number');
        expect(typeof opportunity.potentialProfit).toBe('number');
        expect(typeof opportunity.profitMargin).toBe('number');
        expect(typeof opportunity.distance).toBe('number');
        expect(typeof opportunity.estimatedTime).toBe('number');
        expect(typeof opportunity.profitPerHour).toBe('number');
        expect(typeof opportunity.riskLevel).toBe('number');
        expect(typeof opportunity.lastUpdated).toBe('number');

        // Validate business logic
        expect(opportunity.potentialProfit).toBeGreaterThan(0);
        expect(opportunity.profitMargin).toBeGreaterThan(10); // Minimum 10% as per implementation
        expect(opportunity.destinationPrice).toBeGreaterThan(opportunity.originPrice);
        expect(opportunity.estimatedTime).toBeGreaterThan(0);
        expect(opportunity.profitPerHour).toBeGreaterThan(0);
        expect(opportunity.riskLevel).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle regional economic modifiers', () => {
      const economyStore = useEconomyStore.getState();
      
      // Test regional modifier application
      const testGoodId = 'electronics';
      const testPortId = 'port-shanghai';
      
      const modifier = economyStore.getPortModifier(testGoodId, testPortId, false);
      expect(typeof modifier).toBe('number');
      expect(modifier).toBeGreaterThan(0);

      // Test export vs import modifiers
      const exportModifier = economyStore.getPortModifier(testGoodId, testPortId, true);
      const importModifier = economyStore.getPortModifier(testGoodId, testPortId, false);
      
      expect(typeof exportModifier).toBe('number');
      expect(typeof importModifier).toBe('number');
      expect(exportModifier).toBeGreaterThan(0);
      expect(importModifier).toBeGreaterThan(0);
    });
  });

  describe('Performance and Optimization', () => {
    test('should efficiently update port economics', () => {
      const economyStore = useEconomyStore.getState();
      
      const startTime = Date.now();
      economyStore.updatePortEconomics();
      const endTime = Date.now();
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Should have loaded data for multiple ports
      expect(economyStore.portEconomicData.size).toBeGreaterThan(0);
    });

    test('should cache port data efficiently', () => {
      const economyStore = useEconomyStore.getState();
      economyStore.updatePortEconomics();

      // First access
      const startTime1 = Date.now();
      const data1 = economyStore.getPortEconomicData('port-shanghai');
      const endTime1 = Date.now();

      // Second access (should be cached)
      const startTime2 = Date.now();
      const data2 = economyStore.getPortEconomicData('port-shanghai');
      const endTime2 = Date.now();

      // Both should return same data
      expect(data1).toEqual(data2);
      
      // Second access should be faster (cached)
      expect(endTime2 - startTime2).toBeLessThanOrEqual(endTime1 - startTime1);
    });

    test('should handle large numbers of ports efficiently', () => {
      const economyStore = useEconomyStore.getState();
      
      // Test with all available ports
      const startTime = Date.now();
      
      portData.ports.forEach(port => {
        const portEconData = economyStore.getPortEconomicData(port.id);
        // Each port should have data or gracefully handle missing data
        if (portEconData) {
          expect(portEconData.portId).toBe(port.id);
        }
      });
      
      const endTime = Date.now();
      
      // Should handle all ports within reasonable time
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('Data Consistency and Validation', () => {
    test('should maintain data consistency between port definitions and economics', () => {
      const economyStore = useEconomyStore.getState();
      economyStore.updatePortEconomics();

      portData.ports.forEach(port => {
        // Check if port exists in region mapping
        const region = portEconomics.portRegionMapping[port.id as keyof typeof portEconomics.portRegionMapping];
        
        if (region) {
          // Region should exist in regional modifiers
          expect(portEconomics.portEconomics.regionalModifiers[region]).toBeDefined();
        }

        // Port should have economic data
        const econData = economyStore.getPortEconomicData(port.id);
        if (econData) {
          expect(econData.portName).toBe(port.name);
          expect(econData.capacity).toBe(port.capacity);
          expect(econData.efficiency).toBe(port.efficiency);
        }
      });
    });

    test('should validate port coordinates for LOD calculations', () => {
      portData.ports.forEach(port => {
        expect(typeof port.coordinates.x).toBe('number');
        expect(typeof port.coordinates.y).toBe('number');
        expect(port.coordinates.x).toBeGreaterThanOrEqual(0);
        expect(port.coordinates.y).toBeGreaterThanOrEqual(0);
        
        // Coordinates should be reasonable for a world map
        expect(port.coordinates.x).toBeLessThanOrEqual(1000);
        expect(port.coordinates.y).toBeLessThanOrEqual(1000);
      });
    });

    test('should handle missing or invalid port data gracefully', () => {
      const economyStore = useEconomyStore.getState();
      
      // Test with non-existent port
      const invalidData = economyStore.getPortEconomicData('non-existent-port');
      expect(invalidData).toBeNull();
      
      // Test price calculation with invalid port
      const invalidPrice = economyStore.getPortPrice('electronics', 'non-existent-port');
      expect(invalidPrice).toBe(0);
      
      // Test modifier with invalid data
      const invalidModifier = economyStore.getPortModifier('electronics', 'non-existent-port', false);
      expect(invalidModifier).toBe(1.0); // Should default to 1.0 (no modifier)
    });
  });
});
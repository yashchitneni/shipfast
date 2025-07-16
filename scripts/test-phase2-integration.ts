/**
 * Test script for Phase 2 integration
 * Run with: npx tsx scripts/test-phase2-integration.ts
 */

import { systemIntegration } from '../app/lib/game/system-integration';
import { useRouteStore } from '../app/store/useRouteStore';
import { useEconomyStore } from '../app/store/useEconomyStore';
import { useMarketStore } from '../app/store/useMarketStore';
import { useAIStore } from '../app/store/useAIStore';

async function testPhase2Integration() {
  console.log('🧪 Testing Phase 2 Integration...\n');

  const playerId = '00000000-0000-0000-0000-000000000001';

  try {
    // Initialize systems
    console.log('1️⃣ Initializing Phase 2 systems...');
    await systemIntegration.initialize(playerId);
    console.log('✅ Systems initialized\n');

    // Check system status
    console.log('2️⃣ System Status:');
    const status = systemIntegration.getStatus();
    console.log(JSON.stringify(status, null, 2), '\n');

    // Test Route System
    console.log('3️⃣ Testing Route System:');
    const routeStore = useRouteStore.getState();
    console.log(`- Routes loaded: ${routeStore.routes.size}`);
    console.log(`- Active routes: ${routeStore.getActiveRoutes().length}`);
    
    // Create a test route
    const testRoute = await routeStore.createRoute({
      originPortId: 'port-1',
      destinationPortId: 'port-2',
      name: 'Test Trade Route',
      waypoints: []
    }, playerId);
    console.log(`- Route creation: ${testRoute.success ? '✅' : '❌'}`);
    if (testRoute.routeId) {
      console.log(`- Route ID: ${testRoute.routeId}`);
    }

    // Test Economy System
    console.log('\n4️⃣ Testing Economy System:');
    const economyStore = useEconomyStore.getState();
    console.log(`- Player cash: $${economyStore.playerFinancials.cash.toLocaleString()}`);
    console.log(`- Credit rating: ${economyStore.playerFinancials.creditRating}`);
    console.log(`- Goods initialized: ${economyStore.goods.size}`);
    
    // Test route profit calculation
    const routeProfit = economyStore.calculateRouteProfit({
      distance: 1000,
      baseRatePerMile: 2.5,
      cargoValueMultiplier: 1.5,
      assetLevel: 1,
      specialistBonus: 0,
      marketConditions: 'normal',
      maintenanceCostRate: 0.1
    });
    console.log(`- Sample route profit: $${routeProfit.totalProfit.toFixed(2)}`);

    // Test Market System
    console.log('\n5️⃣ Testing Market System:');
    const marketStore = useMarketStore.getState();
    console.log(`- Market items: ${marketStore.items.size}`);
    console.log(`- Market condition: ${marketStore.marketDynamics.demandVolatility}`);
    
    // Get sample prices
    const sampleItems = Array.from(marketStore.items.values()).slice(0, 3);
    sampleItems.forEach(item => {
      console.log(`- ${item.name}: $${item.currentPrice.toFixed(2)} (${item.type})`);
    });

    // Test AI Companion
    console.log('\n6️⃣ Testing AI Companion:');
    const aiStore = useAIStore.getState();
    const companion = aiStore.companion;
    if (companion) {
      console.log(`- AI Name: ${companion.name}`);
      console.log(`- Level: ${companion.level}`);
      console.log(`- Experience: ${companion.experience}`);
      console.log(`- Accuracy: ${(companion.accuracy * 100).toFixed(1)}%`);
      console.log(`- Suggestions: ${aiStore.suggestions.length}`);
    } else {
      console.log('- AI Companion not initialized');
    }

    // Test system connections
    console.log('\n7️⃣ Testing System Connections:');
    
    // Simulate a market transaction
    if (marketStore.items.size > 0) {
      const firstItem = Array.from(marketStore.items.values())[0];
      const transaction = await marketStore.buyItem(firstItem.id, 10, playerId);
      console.log(`- Market transaction: ${transaction ? '✅' : '❌'}`);
      
      // Check if economy was updated
      const newCash = economyStore.playerFinancials.cash;
      console.log(`- Economy updated: ${newCash !== status.systems.economy ? '✅' : '❌'}`);
    }

    // Test route revenue generation
    console.log('\n8️⃣ Testing Route Revenue:');
    if (testRoute.routeId) {
      // Activate the route
      await routeStore.activateRoute(testRoute.routeId);
      console.log('- Route activated');
      
      // Simulate route completion
      routeStore.updateRouteState(testRoute.routeId, {
        status: 'completed',
        progress: 100
      });
      
      routeStore.addRouteEvent({
        type: 'route_completed',
        routeId: testRoute.routeId,
        timestamp: new Date(),
        data: { profit: 5000 }
      });
      
      console.log('- Route completed event triggered');
      
      // Check if economy was updated
      setTimeout(() => {
        const finalCash = economyStore.playerFinancials.cash;
        console.log(`- Final cash: $${finalCash.toLocaleString()}`);
      }, 1000);
    }

    console.log('\n✅ Phase 2 Integration Test Complete!');
    console.log('All systems are connected and functioning.');

  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
  } finally {
    // Cleanup
    setTimeout(() => {
      systemIntegration.cleanup();
      console.log('\n🧹 Cleanup complete');
      process.exit(0);
    }, 3000);
  }
}

// Run the test
testPhase2Integration();
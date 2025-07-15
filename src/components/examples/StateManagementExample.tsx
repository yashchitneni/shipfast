'use client';

import React from 'react';
import { useEmpireStore } from '../../store/empireStore';
import { 
  usePlayer, 
  usePlayerCash, 
  useShips, 
  useRoutes,
  useMarketGoods,
  useNotifications,
  useSelectedAsset 
} from '../../store/hooks/useEmpireSelectors';
import { useAutoSave } from '../../store/persistence/autosave';
import { useUndoRedoShortcuts } from '../../store/middleware/undoRedo';
import { stateBridge, BridgeEvent } from '../../utils/stateBridge';
import { multiplayerManager } from '../../store/realtime/multiplayer';
import { AssetType, ShipType } from '../../types/game';

// Example component demonstrating state management usage
export function StateManagementExample() {
  // Direct store access for actions
  const store = useEmpireStore();
  
  // Optimized selectors for data
  const player = usePlayer();
  const cash = usePlayerCash();
  const ships = useShips();
  const routes = useRoutes();
  const marketGoods = useMarketGoods();
  const notifications = useNotifications();
  const selectedAsset = useSelectedAsset();
  
  // Auto-save hook
  const { status: autoSaveStatus, forceSave } = useAutoSave({
    interval: 5,
    enabled: true
  });
  
  // Undo/redo keyboard shortcuts
  useUndoRedoShortcuts(store);
  
  // State bridge for Phaser communication
  React.useEffect(() => {
    // Listen for Phaser events
    const unsubscribe = stateBridge.on(BridgeEvent.ASSET_CLICKED, (data) => {
      console.log('Asset clicked in Phaser:', data);
    });
    
    return unsubscribe;
  }, []);
  
  // Multiplayer connection
  React.useEffect(() => {
    if (player?.id) {
      multiplayerManager.connect(player.id, 'global-world')
        .catch(console.error);
      
      return () => {
        multiplayerManager.disconnect();
      };
    }
  }, [player?.id]);
  
  // Example: Create a new player
  const handleCreatePlayer = () => {
    store.setPlayer({
      id: `player-${Date.now()}`,
      username: 'TestPlayer',
      email: 'test@example.com',
      cash: 50000, // Starting cash
      level: 1,
      experience: 0,
      achievements: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Start game session
    store.startGameSession(`player-${Date.now()}`);
  };
  
  // Example: Purchase a ship
  const handlePurchaseShip = () => {
    if (!player) return;
    
    const shipCost = 25000;
    
    if (cash >= shipCost) {
      // Create the ship
      const ship = {
        id: `ship-${Date.now()}`,
        playerId: player.id,
        name: 'MV Enterprise',
        type: AssetType.SHIP,
        shipType: ShipType.CONTAINER,
        purchasePrice: shipCost,
        maintenanceCost: 1000,
        efficiency: 85,
        condition: 100,
        isActive: true,
        capacity: 5000,
        speed: 20,
        fuelEfficiency: 75,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add ship to store
      store.addAsset(ship);
      
      // Deduct cash
      store.updatePlayerCash(-shipCost);
      
      // Record transaction
      store.addTransaction({
        playerId: player.id,
        type: 'EXPENSE',
        category: 'Asset Purchase',
        amount: -shipCost,
        description: `Purchased ship: ${ship.name}`,
        relatedEntityId: ship.id,
        relatedEntityType: 'ship'
      });
      
      // Add notification
      store.addNotification({
        type: 'SUCCESS',
        title: 'Ship Purchased!',
        message: `You've acquired ${ship.name} for $${shipCost.toLocaleString()}`,
        isRead: false
      });
      
      // Notify Phaser
      stateBridge.emit(BridgeEvent.ASSET_ADDED, { asset: ship });
    } else {
      store.addNotification({
        type: 'ERROR',
        title: 'Insufficient Funds',
        message: `You need $${shipCost.toLocaleString()} to purchase this ship`,
        isRead: false
      });
    }
  };
  
  // Example: Create a route
  const handleCreateRoute = () => {
    if (!player) return;
    
    const route = {
      id: `route-${Date.now()}`,
      playerId: player.id,
      name: 'Shanghai to Los Angeles',
      type: 'SEA' as const,
      origin: 'Shanghai',
      destination: 'Los Angeles',
      waypoints: [],
      distance: 10000,
      estimatedTime: 480, // 20 days
      profitability: 75,
      risk: 20,
      efficiency: 80,
      isActive: false,
      assignedAssets: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    store.addRoute(route);
    
    store.addNotification({
      type: 'SUCCESS',
      title: 'Route Created',
      message: `New route: ${route.name}`,
      isRead: false
    });
  };
  
  // Example: Simulate market update
  const handleMarketUpdate = () => {
    const goods = [
      { id: 'electronics', name: 'Electronics', basePrice: 1000, volatility: 20 },
      { id: 'textiles', name: 'Textiles', basePrice: 500, volatility: 10 },
      { id: 'machinery', name: 'Machinery', basePrice: 2000, volatility: 15 }
    ];
    
    goods.forEach(good => {
      // Random price fluctuation
      const priceChange = (Math.random() - 0.5) * good.volatility * 2;
      const newPrice = good.basePrice * (1 + priceChange / 100);
      
      store.updateMarketGood(good.id, {
        name: good.name,
        category: 'General',
        basePrice: good.basePrice,
        currentPrice: newPrice,
        volatility: good.volatility,
        demand: Math.random() * 100,
        supply: Math.random() * 100
      });
      
      store.recordPriceHistory(good.id, newPrice);
    });
    
    // Broadcast to other players
    multiplayerManager.broadcastMarketUpdate(marketGoods);
  };
  
  // Example: Save game
  const handleSaveGame = async () => {
    store.setLoading(true);
    try {
      await store.saveGame();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      store.setLoading(false);
    }
  };
  
  // Example: Undo/Redo
  const handleUndo = () => store.undo();
  const handleRedo = () => store.redo();
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">State Management Example</h1>
      
      {/* Player Info */}
      <section className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-4">Player Info</h2>
        {player ? (
          <div>
            <p>Username: {player.username}</p>
            <p>Cash: ${cash.toLocaleString()}</p>
            <p>Level: {player.level}</p>
            <p>Experience: {player.experience}</p>
          </div>
        ) : (
          <button
            onClick={handleCreatePlayer}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Player
          </button>
        )}
      </section>
      
      {/* Actions */}
      {player && (
        <section className="mb-8 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          
          <div className="flex gap-4">
            <button
              onClick={handlePurchaseShip}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Purchase Ship ($25,000)
            </button>
            
            <button
              onClick={handleCreateRoute}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Create Route
            </button>
            
            <button
              onClick={handleMarketUpdate}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Simulate Market Update
            </button>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleUndo}
              disabled={!store.canUndo()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Undo (Ctrl+Z)
            </button>
            
            <button
              onClick={handleRedo}
              disabled={!store.canRedo()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Redo (Ctrl+Y)
            </button>
            
            <button
              onClick={handleSaveGame}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Save Game
            </button>
            
            <button
              onClick={forceSave}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Force Auto-Save
            </button>
          </div>
        </section>
      )}
      
      {/* Assets */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Ships ({ships.length})</h2>
        <div className="space-y-2">
          {ships.map(ship => (
            <div 
              key={ship.id} 
              className={`p-3 border rounded cursor-pointer ${
                selectedAsset?.id === ship.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onClick={() => store.setSelectedAsset(ship.id)}
            >
              <p className="font-medium">{ship.name}</p>
              <p className="text-sm text-gray-600">
                Type: {ship.shipType} | Capacity: {ship.capacity} TEU | 
                Condition: {ship.condition}% | Efficiency: {ship.efficiency}%
              </p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Routes */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Routes ({routes.length})</h2>
        <div className="space-y-2">
          {routes.map(route => (
            <div 
              key={route.id} 
              className="p-3 border border-gray-300 rounded"
            >
              <p className="font-medium">{route.name}</p>
              <p className="text-sm text-gray-600">
                Distance: {route.distance} km | Risk: {route.risk}% | 
                Profitability: {route.profitability}% | 
                Status: {route.isActive ? '🟢 Active' : '🔴 Inactive'}
              </p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Market */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Market Prices</h2>
        <div className="space-y-2">
          {marketGoods.map(good => (
            <div key={good.id} className="p-3 border border-gray-300 rounded">
              <p className="font-medium">{good.name}</p>
              <p className="text-sm text-gray-600">
                Price: ${good.currentPrice?.toFixed(2) || 'N/A'} | 
                Demand: {good.demand?.toFixed(0) || 'N/A'}% | 
                Supply: {good.supply?.toFixed(0) || 'N/A'}%
              </p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Notifications */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Notifications ({notifications.filter(n => !n.isRead).length} unread)
        </h2>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {notifications.slice(0, 5).map(notification => (
            <div 
              key={notification.id} 
              className={`p-3 border rounded ${
                notification.isRead ? 'border-gray-300 bg-gray-50' : 'border-blue-400 bg-blue-50'
              }`}
            >
              <p className="font-medium flex items-center gap-2">
                {notification.type === 'SUCCESS' && '✅'}
                {notification.type === 'ERROR' && '❌'}
                {notification.type === 'WARNING' && '⚠️'}
                {notification.type === 'INFO' && 'ℹ️'}
                {notification.type === 'ACHIEVEMENT' && '🏆'}
                {notification.title}
              </p>
              <p className="text-sm text-gray-600">{notification.message}</p>
              {!notification.isRead && (
                <button
                  onClick={() => store.markNotificationRead(notification.id)}
                  className="text-xs text-blue-500 hover:underline mt-1"
                >
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
      
      {/* Auto-save Status */}
      <section className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-4">Auto-Save Status</h2>
        <p>Enabled: {autoSaveStatus.enabled ? 'Yes' : 'No'}</p>
        <p>Interval: {autoSaveStatus.interval} minutes</p>
        <p>Has unsaved changes: {autoSaveStatus.isDirty ? 'Yes' : 'No'}</p>
        <p>Save in progress: {autoSaveStatus.saveInProgress ? 'Yes' : 'No'}</p>
        <p>Last save: {autoSaveStatus.lastSaveTime?.toLocaleTimeString() || 'Never'}</p>
      </section>
      
      {/* Online Players */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Online Players</h2>
        <div className="space-y-2">
          {multiplayerManager.getOnlinePlayers().map(presence => (
            <div key={presence.playerId} className="p-2 border border-gray-300 rounded">
              <p className="font-medium">
                {presence.username} (Level {presence.level})
              </p>
              <p className="text-sm text-gray-600">
                Net Worth: ${presence.netWorth.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
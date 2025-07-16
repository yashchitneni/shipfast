'use client';

import React, { useState, useEffect } from 'react';
import { useEmpireStore } from '../../../src/store/empireStore';
import { loadAllAssetDefinitions, getMockPortNodes } from '../../lib/assetLoader';
import { AssetDefinition, AssetType, AssetCategory } from '../../lib/types/assets';

export const AssetPlacementUI: React.FC = () => {
  const {
    assetDefinitions,
    loadAssetDefinitions,
    setPortNodes,
    player,
    setAssetToPlace,
    assetToPlace,
    getAssetStats,
    placedAssets,
    updatePlayerCash
  } = useEmpireStore();

  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<AssetType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [placementMessage, setPlacementMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load assets on mount
  useEffect(() => {
    const loadAssets = async () => {
      const definitions = await loadAllAssetDefinitions();
      loadAssetDefinitions(definitions);
      setPortNodes(getMockPortNodes());
      setIsLoading(false);
    };
    loadAssets();
  }, [loadAssetDefinitions, setPortNodes]);

  // Handle asset selection
  const handleSelectAsset = (definitionId: string) => {
    // Set the asset to place, which will be handled by the WorldMapScene
    setAssetToPlace(definitionId);
    setPlacementMessage({ text: 'Click on a port to place the asset', type: 'success' });
    
    // Clear message after 3 seconds
    setTimeout(() => setPlacementMessage(null), 3000);
  };

  // Handle cancel placement
  const handleCancelPlacement = () => {
    setAssetToPlace(null);
  };

  // Filter assets
  const filteredAssets = Array.from(assetDefinitions.values()).filter(asset => {
    if (selectedCategory !== 'all' && asset.category !== selectedCategory) return false;
    if (selectedType !== 'all' && asset.type !== selectedType) return false;
    return true;
  });

  // Get stats
  const stats = getAssetStats();

  if (isLoading) {
    return <div className="p-4">Loading assets...</div>;
  }

  return (
    <div className="asset-placement-ui bg-gray-100 p-4 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Asset Management</h2>
      
      {/* Player Info */}
      <div className="mb-4 p-3 bg-white rounded">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Money: ${player?.cash.toLocaleString() || 0}</span>
          <span className="font-semibold">Level: {player?.level || 1}</span>
        </div>
      </div>

      {/* Asset Stats */}
      <div className="mb-4 p-3 bg-white rounded">
        <h3 className="font-semibold mb-2">Asset Statistics</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Total Assets: {stats.totalAssets}</div>
          <div>Total Value: ${stats.totalValue.toLocaleString()}</div>
          <div>Maintenance: ${stats.totalMaintenance.toLocaleString()}/quarter</div>
          <div>Utilization: {(stats.utilizationRate * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-2">
        <div>
          <label className="block text-sm font-medium mb-1">Category:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value as AssetCategory | 'all')}
            className="w-full p-2 border rounded"
          >
            <option value="all">All Categories</option>
            <option value="transport">Transport</option>
            <option value="storage">Storage</option>
            <option value="support">Support</option>
            <option value="financial">Financial</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Type:</label>
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value as AssetType | 'all')}
            className="w-full p-2 border rounded"
          >
            <option value="all">All Types</option>
            <option value="ship">Ships</option>
            <option value="plane">Planes</option>
            <option value="warehouse">Warehouses</option>
            <option value="infrastructure">Infrastructure</option>
          </select>
        </div>
      </div>

      {/* Asset List */}
      <div className="asset-list max-h-96 overflow-y-auto space-y-2">
        {filteredAssets.map(asset => (
          <AssetCard 
            key={asset.id} 
            asset={asset} 
            onSelect={handleSelectAsset}
            canAfford={(player?.cash || 0) >= asset.cost}
            meetsRequirements={
              (!asset.requirements?.minLevel || (player?.level || 1) >= asset.requirements.minLevel)
            }
          />
        ))}
      </div>

      {/* Placement Controls */}
      {assetToPlace && (
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <div className="flex justify-between items-center">
            <span className="text-sm">Placing: {assetDefinitions.get(assetToPlace)?.name}</span>
            <div className="space-x-2">
              <span className="text-sm">Move to map and click on a port</span>
              <button
                onClick={handleCancelPlacement}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {placementMessage && (
        <div className={`mt-4 p-3 rounded text-white ${
          placementMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {placementMessage.text}
        </div>
      )}
      
      {/* Debug/Test Section - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-200 rounded">
          <h4 className="font-semibold mb-2">Debug Actions</h4>
          <div className="space-y-2">
            <button
              onClick={() => {
                console.log('🧪 Store state:', {
                  player: player,
                  assetsCount: Array.from(placedAssets.values()).length,
                  definitionsCount: assetDefinitions.size,
                  assetToPlace: assetToPlace
                });
              }}
              className="w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Log Store State
            </button>
            <button
              onClick={() => {
                if (player) {
                  const testAmount = 1000;
                  const originalCash = player.cash;
                  updatePlayerCash(-testAmount);
                  setTimeout(() => {
                    const newCash = useEmpireStore.getState().player?.cash || 0;
                    console.log('💰 Cash test:', { originalCash, newCash, difference: newCash - originalCash });
                    updatePlayerCash(testAmount); // Restore
                  }, 100);
                }
              }}
              className="w-full px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Test Cash Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Asset Card Component
interface AssetCardProps {
  asset: AssetDefinition;
  onSelect: (id: string) => void;
  canAfford: boolean;
  meetsRequirements: boolean;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, onSelect, canAfford, meetsRequirements }) => {
  const isAvailable = canAfford && meetsRequirements;
  
  const getAssetIcon = () => {
    switch (asset.type) {
      case 'ship':
        return asset.subType === 'tanker' ? '🛢️' : '🚢';
      case 'plane':
        return '✈️';
      case 'warehouse':
        return '🏭';
      case 'infrastructure':
        if (asset.subType === 'route') return '〰️';
        if (asset.subType === 'license') return '📜';
        if (asset.subType === 'specialist') return '👔';
        return '🏗️';
      default:
        return '📦';
    }
  };

  return (
    <div 
      className={`p-3 bg-white rounded shadow cursor-pointer transition-all ${
        isAvailable 
          ? 'hover:shadow-md hover:bg-blue-50' 
          : 'opacity-50 cursor-not-allowed'
      }`}
      onClick={() => isAvailable && onSelect(asset.id)}
    >
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{getAssetIcon()}</div>
        <div className="flex-1">
          <h4 className="font-semibold">{asset.name}</h4>
          <p className="text-xs text-gray-600 mb-1">{asset.description}</p>
          <div className="flex justify-between items-center text-sm">
            <span className={canAfford ? 'text-green-600' : 'text-red-600'}>
              ${asset.cost.toLocaleString()}
            </span>
            <span className="text-gray-500">
              Maint: ${asset.maintenanceCost.toLocaleString()}/q
            </span>
          </div>
          {asset.requirements && (
            <div className="mt-1 text-xs text-gray-500">
              {asset.requirements.minLevel && (
                <span className={meetsRequirements ? '' : 'text-red-500'}>
                  Level {asset.requirements.minLevel} required
                </span>
              )}
              {asset.requirements.licenses && asset.requirements.licenses.length > 0 && (
                <span className="ml-2">
                  Licenses: {asset.requirements.licenses.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
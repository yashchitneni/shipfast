'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useEmpireStore } from '@/src/store/empireStore';
import { PortCapacityDisplay } from './PortCapacityDisplay';

interface PortData {
  id: string;
  name: string;
  position: { x: number; y: number };
  type: 'port' | 'hub' | 'depot';
  capacity: number;
  currentLoad: number;
  region: string;
}

interface AssetPlacementZone {
  id: string;
  name: string;
  position: { x: number; y: number };
  radius: number;
  type: 'docking' | 'storage' | 'maintenance';
  capacity: number;
  occupied: number;
}

export const EnhancedPortManagement: React.FC = () => {
  const { 
    selectedPort, 
    portNodes, 
    placedAssets, 
    getAssetsAtPort, 
    setSelectedPort,
    assetDefinitions,
    setAssetToPlace
  } = useEmpireStore();
  
  const [portData, setPortData] = useState<PortData | null>(null);
  const [portAssets, setPortAssets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'routes' | 'upgrade'>('overview');
  const [placementZones, setPlacementZones] = useState<AssetPlacementZone[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedPort) {
      const port = Array.from(portNodes.values()).find(p => p.id === selectedPort);
      if (port) {
        const portData: PortData = {
          id: port.id,
          name: port.name,
          position: port.position,
          type: 'port',
          capacity: port.capacity || 100,
          currentLoad: 0,
          region: port.region
        };
        setPortData(portData);
        
        const assets = getAssetsAtPort(selectedPort);
        setPortAssets(assets);
        
        // Generate placement zones around the port
        generatePlacementZones(port);
      }
    } else {
      setPortData(null);
      setPortAssets([]);
      setPlacementZones([]);
    }
  }, [selectedPort, portNodes, getAssetsAtPort]);

  const generatePlacementZones = (port: any) => {
    const zones: AssetPlacementZone[] = [
      {
        id: `${port.id}-dock-1`,
        name: 'Main Docking Area',
        position: { x: port.position.x - 50, y: port.position.y },
        radius: 30,
        type: 'docking',
        capacity: 5,
        occupied: 0
      },
      {
        id: `${port.id}-dock-2`,
        name: 'Secondary Docking',
        position: { x: port.position.x + 50, y: port.position.y },
        radius: 25,
        type: 'docking',
        capacity: 3,
        occupied: 0
      },
      {
        id: `${port.id}-storage-1`,
        name: 'Storage Facility',
        position: { x: port.position.x, y: port.position.y - 40 },
        radius: 20,
        type: 'storage',
        capacity: 10,
        occupied: 0
      },
      {
        id: `${port.id}-maintenance`,
        name: 'Maintenance Bay',
        position: { x: port.position.x, y: port.position.y + 40 },
        radius: 15,
        type: 'maintenance',
        capacity: 2,
        occupied: 0
      }
    ];
    
    // Calculate occupied slots based on existing assets
    portAssets.forEach(asset => {
      // Find closest zone to asset
      const closestZone = zones.reduce((closest, zone) => {
        const distToZone = Math.sqrt(
          Math.pow(asset.position.x - zone.position.x, 2) + 
          Math.pow(asset.position.y - zone.position.y, 2)
        );
        const distToClosest = Math.sqrt(
          Math.pow(asset.position.x - closest.position.x, 2) + 
          Math.pow(asset.position.y - closest.position.y, 2)
        );
        return distToZone < distToClosest ? zone : closest;
      }, zones[0]);
      
      closestZone.occupied++;
    });
    
    setPlacementZones(zones);
  };

  const handleAssetPlacement = (assetType: string) => {
    setAssetToPlace(assetType);
    // This would trigger the asset placement mode in the game
  };

  const handleUpgradePort = () => {
    // Implement port upgrade logic
    console.log('Upgrading port:', selectedPort);
  };

  const handleCreateRoute = () => {
    // Implement route creation logic
    console.log('Creating route from port:', selectedPort);
  };

  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setSelectedPort(null);
      }
    };

    if (selectedPort) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [selectedPort, setSelectedPort]);

  if (!selectedPort || !portData) {
    return null;
  }

  return (
    <div 
      ref={panelRef}
      className="fixed top-4 right-4 w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-[80vh] overflow-y-auto"
    >
      {/* Header */}
      <div className="bg-blue-600 px-4 py-3 rounded-t-lg">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">{portData.name}</h2>
          <button
            onClick={() => setSelectedPort(null)}
            className="text-white hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        <p className="text-blue-100 text-sm">{portData.region}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'assets', label: 'Assets' },
          { id: 'routes', label: 'Routes' },
          { id: 'upgrade', label: 'Upgrade' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-3 text-sm font-medium ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <PortCapacityDisplay portId={selectedPort} />
            
            {/* Quick Actions */}
            <div className="bg-gray-800 rounded p-3">
              <h4 className="text-white font-medium mb-2">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAssetPlacement('ship-container-small')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                >
                  Add Ship
                </button>
                <button
                  onClick={() => handleAssetPlacement('warehouse-standard')}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                >
                  Add Warehouse
                </button>
                <button
                  onClick={handleCreateRoute}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm"
                >
                  Create Route
                </button>
                <button
                  onClick={handleUpgradePort}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm"
                >
                  Upgrade Port
                </button>
              </div>
            </div>

            {/* Placement Zones */}
            <div className="bg-gray-800 rounded p-3">
              <h4 className="text-white font-medium mb-2">Placement Zones</h4>
              <div className="space-y-2">
                {placementZones.map(zone => (
                  <div key={zone.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{zone.name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      zone.occupied >= zone.capacity 
                        ? 'bg-red-600 text-white' 
                        : 'bg-green-600 text-white'
                    }`}>
                      {zone.occupied}/{zone.capacity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded p-3">
              <h4 className="text-white font-medium mb-2">Available Assets</h4>
              <div className="grid grid-cols-1 gap-2">
                {Array.from(assetDefinitions.values())
                  .filter(def => def.type === 'ship' || def.type === 'warehouse')
                  .map(asset => (
                    <button
                      key={asset.id}
                      onClick={() => handleAssetPlacement(asset.id)}
                      className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded text-left"
                    >
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-sm text-gray-400">
                        Cost: ${asset.cost.toLocaleString()} | Capacity: {asset.capacity || 0}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded p-3">
              <h4 className="text-white font-medium mb-2">Connected Routes</h4>
              <p className="text-gray-400 text-sm">No routes connected to this port yet.</p>
              <button
                onClick={handleCreateRoute}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Create New Route
              </button>
            </div>
          </div>
        )}

        {activeTab === 'upgrade' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded p-3">
              <h4 className="text-white font-medium mb-2">Port Upgrades</h4>
              <div className="space-y-3">
                <div className="border border-gray-600 rounded p-3">
                  <h5 className="text-white font-medium">Capacity Expansion</h5>
                  <p className="text-gray-400 text-sm">Increase port capacity by 50 slots</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-green-400">Cost: $500,000</span>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                      Upgrade
                    </button>
                  </div>
                </div>
                
                <div className="border border-gray-600 rounded p-3">
                  <h5 className="text-white font-medium">Efficiency Boost</h5>
                  <p className="text-gray-400 text-sm">Reduce loading/unloading time by 25%</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-green-400">Cost: $750,000</span>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                      Upgrade
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
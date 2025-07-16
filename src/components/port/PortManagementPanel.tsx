'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useEmpireStore } from '@/src/store/empireStore';

interface PortData {
  id: string;
  name: string;
  position: { x: number; y: number };
  type: 'port' | 'hub' | 'depot';
  capacity: number;
  currentLoad: number;
}

export const PortManagementPanel: React.FC = () => {
  const { selectedPort, portNodes, placedAssets, getAssetsAtPort, setSelectedPort } = useEmpireStore();
  const [portData, setPortData] = useState<PortData | null>(null);
  const [portAssets, setPortAssets] = useState<any[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedPort) {
      // Find the selected port data from the Map
      const port = Array.from(portNodes.values()).find(p => p.id === selectedPort);
      if (port) {
        // Convert PortNode to PortData
        const portData: PortData = {
          id: port.id,
          name: port.name,
          position: port.position,
          type: 'port', // Default type
          capacity: port.capacity || 100,
          currentLoad: 0 // Calculate from assets
        };
        setPortData(portData);
        
        // Get assets at this port
        const assets = getAssetsAtPort(selectedPort);
        setPortAssets(assets);
      }
    } else {
      setPortData(null);
      setPortAssets([]);
    }
  }, [selectedPort, portNodes, getAssetsAtPort]);

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

  const utilization = portData.capacity > 0 
    ? Math.round((portData.currentLoad / portData.capacity) * 100) 
    : 0;

  return (
    <div 
      ref={panelRef}
      className="absolute top-20 left-4 w-80 bg-gray-900 bg-opacity-95 rounded-lg shadow-xl"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg relative">
        <h2 className="text-xl font-bold pr-8">{portData.name}</h2>
        <p className="text-sm opacity-90">Port Management</p>
        <button
          onClick={() => setSelectedPort(null)}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          title="Close port panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Port Stats */}
      <div className="p-4 space-y-4">
        <div className="bg-gray-800 rounded p-3">
          <h3 className="text-gray-300 text-sm font-semibold mb-2">Port Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Type:</span>
              <span className="text-white capitalize">{portData.type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Capacity:</span>
              <span className="text-white">{portData.capacity} units</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Current Load:</span>
              <span className="text-white">{portData.currentLoad} units</span>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Utilization:</span>
                <span className={`font-semibold ${
                  utilization > 80 ? 'text-red-400' : 
                  utilization > 60 ? 'text-yellow-400' : 
                  'text-green-400'
                }`}>{utilization}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    utilization > 80 ? 'bg-red-500' : 
                    utilization > 60 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${utilization}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Assets at Port */}
        <div className="bg-gray-800 rounded p-3">
          <h3 className="text-gray-300 text-sm font-semibold mb-2">
            Assets at Port ({portAssets.length})
          </h3>
          {portAssets.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {portAssets.map((asset) => (
                <div key={asset.id} className="bg-gray-700 rounded p-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white font-medium">{asset.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      asset.status === 'active' ? 'bg-green-600' : 
                      asset.status === 'idle' ? 'bg-yellow-600' : 
                      'bg-gray-600'
                    }`}>
                      {asset.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No assets currently at this port</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors text-sm font-medium">
            Upgrade Port
          </button>
          <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors text-sm font-medium">
            View Routes
          </button>
          <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors text-sm font-medium">
            Port Statistics
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortManagementPanel;
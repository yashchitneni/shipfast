'use client';

import React from 'react';
import { useEmpireStore } from '@/src/store/empireStore';

interface PortCapacityDisplayProps {
  portId: string;
}

export const PortCapacityDisplay: React.FC<PortCapacityDisplayProps> = ({ portId }) => {
  const { portNodes, placedAssets, getAssetsAtPort } = useEmpireStore();
  
  const port = Array.from(portNodes.values()).find(p => p.id === portId);
  const assetsAtPort = getAssetsAtPort(portId);
  
  if (!port) return null;
  
  // Calculate capacity usage
  const totalSlots = port.capacity; // e.g., 100 asset slots
  const usedSlots = assetsAtPort.length; // number of assets at port
  const availableSlots = totalSlots - usedSlots;
  const utilizationPercent = (usedSlots / totalSlots) * 100;
  
  // Calculate total cargo capacity from all assets at port
  const totalCargoCapacity = assetsAtPort.reduce((total, asset) => {
    // Get asset definition to find its cargo capacity
    const assetDef = useEmpireStore.getState().assetDefinitions.get(asset.definitionId);
    return total + (assetDef?.capacity || 0);
  }, 0);
  
  // Calculate current cargo load
  const currentCargoLoad = assetsAtPort.reduce((total, asset) => {
    return total + (asset.currentLoad || 0);
  }, 0);
  
  const cargoUtilization = totalCargoCapacity > 0 ? (currentCargoLoad / totalCargoCapacity) * 100 : 0;
  
  return (
    <div className="bg-gray-800 rounded p-4 space-y-4">
      <h3 className="text-white font-semibold">Port Capacity</h3>
      
      {/* Asset Slots (Port Capacity) */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Asset Slots:</span>
          <span className="text-white">{usedSlots}/{totalSlots}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              utilizationPercent > 80 ? 'bg-red-500' : 
              utilizationPercent > 60 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${utilizationPercent}%` }}
          />
        </div>
        <div className="text-xs text-gray-500">
          {availableSlots} slots available for new assets
        </div>
      </div>
      
      {/* Cargo Capacity (from all assets) */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Cargo Capacity:</span>
          <span className="text-white">{currentCargoLoad.toLocaleString()}/{totalCargoCapacity.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              cargoUtilization > 80 ? 'bg-red-500' : 
              cargoUtilization > 60 ? 'bg-yellow-500' : 
              'bg-blue-500'
            }`}
            style={{ width: `${cargoUtilization}%` }}
          />
        </div>
        <div className="text-xs text-gray-500">
          Combined cargo capacity from all {assetsAtPort.length} assets
        </div>
      </div>
      
      {/* Asset Breakdown */}
      <div className="space-y-2">
        <h4 className="text-gray-300 text-sm font-medium">Assets at Port:</h4>
        {assetsAtPort.length === 0 ? (
          <p className="text-gray-500 text-sm">No assets stationed</p>
        ) : (
          <div className="space-y-1">
            {assetsAtPort.map((asset) => {
              const assetDef = useEmpireStore.getState().assetDefinitions.get(asset.definitionId);
              return (
                <div key={asset.id} className="flex justify-between text-xs">
                  <span className="text-gray-400">{assetDef?.name || 'Unknown'}</span>
                  <span className="text-white">
                    {asset.currentLoad || 0}/{assetDef?.capacity || 0}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}; 
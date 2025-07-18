'use client';

import React, { useState, useMemo } from 'react';
import { useEmpireStore } from '../../../src/store/empireStore';

interface PortSelectionModalProps {
  onSelectPort: (portId: string) => void;
  onCancel: () => void;
  assetType: string;
}

export const PortSelectionModal: React.FC<PortSelectionModalProps> = ({ 
  onSelectPort, 
  onCancel, 
  assetType 
}) => {
  const { portNodes } = useEmpireStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  // Get unique regions from ports
  const regions = useMemo(() => {
    const uniqueRegions = new Set<string>();
    portNodes.forEach(port => {
      uniqueRegions.add(port.region || 'Unknown');
    });
    return Array.from(uniqueRegions).sort();
  }, [portNodes]);

  // Filter ports based on search and region
  const filteredPorts = useMemo(() => {
    return Array.from(portNodes.values()).filter(port => {
      const matchesSearch = port.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = selectedRegion === 'all' || port.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [portNodes, searchTerm, selectedRegion]);

  // Group ports by region for better display
  const portsByRegion = useMemo(() => {
    const grouped: Record<string, typeof filteredPorts> = {};
    filteredPorts.forEach(port => {
      const region = port.region || 'Unknown';
      if (!grouped[region]) {
        grouped[region] = [];
      }
      grouped[region].push(port);
    });
    return grouped;
  }, [filteredPorts]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Select Port for {assetType}</h2>
        
        {/* Search and filter controls */}
        <div className="mb-4 space-y-2">
          <input
            type="text"
            placeholder="Search ports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="all">All Regions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        {/* Port list */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(portsByRegion).map(([region, ports]) => (
            <div key={region} className="mb-6">
              <h3 className="font-semibold text-lg mb-2 text-gray-700">{region}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ports.map(port => (
                  <button
                    key={port.id}
                    onClick={() => onSelectPort(port.id)}
                    className="p-3 border rounded hover:bg-blue-50 hover:border-blue-500 transition-colors text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{port.name}</h4>
                        <p className="text-sm text-gray-600">
                          Capacity: {port.capacity} • Routes: {port.connectedRoutes.length}
                        </p>
                      </div>
                      <span className="text-2xl">🏴</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          {filteredPorts.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No ports found matching your criteria
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
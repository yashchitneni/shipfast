'use client';

import React, { useState, useEffect } from 'react';
import { 
  generatePortData, 
  generateRouteData, 
  generateGlobalMarketData,
  generateMarketSnapshot,
  generateDisasterEvent
} from '@/app/utils/portDataGenerators';
import portDefinitions from '@/app/assets/definitions/ports.json';

export default function PortDataDemo() {
  const [selectedPort, setSelectedPort] = useState('port-shanghai');
  const [portData, setPortData] = useState<any>(null);
  const [selectedGood, setSelectedGood] = useState('electronics');
  const [marketData, setMarketData] = useState<any>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [disaster, setDisaster] = useState<any>(null);

  useEffect(() => {
    updatePortData();
  }, [selectedPort]);

  useEffect(() => {
    updateMarketData();
  }, [selectedGood]);

  const updatePortData = () => {
    const data = generatePortData(selectedPort);
    setPortData(data);
  };

  const updateMarketData = () => {
    const data = generateGlobalMarketData(selectedGood);
    setMarketData(data);
  };

  const generateNewSnapshot = () => {
    const data = generateMarketSnapshot();
    setSnapshot(data);
  };

  const triggerDisaster = () => {
    const event = generateDisasterEvent();
    setDisaster(event);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Port Data Demo</h1>
      
      {/* Port Data Section */}
      <section className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Port Information</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Port:</label>
          <select 
            value={selectedPort} 
            onChange={(e) => setSelectedPort(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {portDefinitions.ports.map(port => (
              <option key={port.id} value={port.id}>
                {port.name} ({port.countryName})
              </option>
            ))}
          </select>
        </div>

        {portData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Port Details</h3>
              <p>Name: {portData.portName}</p>
              <p>Country: {portData.country}</p>
              <p>Utilization: {portData.utilization}%</p>
              <p>Current Capacity: {portData.currentCapacity.toLocaleString()} TEU</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Infrastructure</h3>
              <p>Available Docks: {portData.infrastructure.docks.available} / {portData.infrastructure.docks.total}</p>
              <p>Operational Cranes: {portData.infrastructure.cranes.operational} / {portData.infrastructure.cranes.total}</p>
              <p>Warehouse Usage: {portData.infrastructure.warehouses.used.toLocaleString()} / {portData.infrastructure.warehouses.capacity.toLocaleString()} m²</p>
            </div>
          </div>
        )}

        {portData?.goods && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Market Prices</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Good</th>
                    <th className="px-4 py-2 text-right">Current Price</th>
                    <th className="px-4 py-2 text-right">Base Price</th>
                    <th className="px-4 py-2 text-right">Supply</th>
                    <th className="px-4 py-2 text-right">Demand</th>
                    <th className="px-4 py-2 text-center">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {portData.goods.map((good: any) => (
                    <tr key={good.goodId} className="border-b">
                      <td className="px-4 py-2">{good.name}</td>
                      <td className="px-4 py-2 text-right">${good.currentPrice.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">${good.basePrice.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{good.supply.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">{good.demand.toLocaleString()}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          good.trend === 'rising' ? 'bg-green-100 text-green-800' :
                          good.trend === 'falling' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {good.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Global Market Data Section */}
      <section className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Global Market Analysis</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Good:</label>
          <select 
            value={selectedGood} 
            onChange={(e) => setSelectedGood(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="electronics">Electronics</option>
            <option value="crude_petroleum">Crude Petroleum</option>
            <option value="machinery">Machinery</option>
            <option value="textiles">Textiles</option>
            <option value="automobiles">Automobiles</option>
            <option value="steel">Steel</option>
            <option value="chemicals">Chemicals</option>
            <option value="soybeans">Soybeans</option>
          </select>
        </div>

        {marketData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Price Overview</h3>
              <p>Global Average: ${marketData.globalAveragePrice.toFixed(2)}</p>
              <p>Price Range: ${marketData.priceRange.min.toFixed(2)} - ${marketData.priceRange.max.toFixed(2)}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Top Exporters</h3>
              <ul>
                {marketData.topExporters.slice(0, 3).map((port: any) => (
                  <li key={port.portId} className="text-sm">
                    {port.portName}: {port.supply.toLocaleString()} units @ ${port.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Market Snapshot Section */}
      <section className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Market Snapshot</h2>
        
        <button 
          onClick={generateNewSnapshot}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Generate New Snapshot
        </button>

        {snapshot && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Economic Indicators</h3>
              <p>Global Demand Index: {(snapshot.economicIndicators.globalDemand * 100).toFixed(1)}%</p>
              <p>Shipping Index: {(snapshot.economicIndicators.shippingIndex * 100).toFixed(1)}%</p>
              <p>Fuel Price: ${snapshot.economicIndicators.fuelPrice.toFixed(2)}/barrel</p>
              <p>Container Availability: {(snapshot.economicIndicators.containerAvailability * 100).toFixed(1)}%</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Top Traded Goods</h3>
              <ul>
                {snapshot.topGoods.slice(0, 5).map((good: any) => (
                  <li key={good.id} className="text-sm">
                    {good.name}: ${good.averagePrice.toFixed(2)} (volatility: {(good.volatility * 100).toFixed(0)}%)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Disaster Events Section */}
      <section className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Disaster Events</h2>
        
        <button 
          onClick={triggerDisaster}
          className="mb-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Trigger Random Disaster
        </button>

        {disaster && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h3 className="font-semibold text-red-800 mb-2">
              {disaster.type.toUpperCase()} - {disaster.severity.toUpperCase()}
            </h3>
            <p className="text-sm mb-2">Affected Ports: {disaster.affectedPorts.join(', ')}</p>
            <p className="text-sm mb-2">Duration: {disaster.estimatedDuration.toFixed(1)} days</p>
            <div className="text-sm">
              <p>Economic Impact:</p>
              <ul className="ml-4">
                <li>Price Increase: {((disaster.economicImpact.priceIncrease - 1) * 100).toFixed(0)}%</li>
                <li>Capacity Reduction: {((1 - disaster.economicImpact.capacityReduction) * 100).toFixed(0)}%</li>
                <li>Affected Goods: {disaster.economicImpact.affectedGoods.join(', ')}</li>
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
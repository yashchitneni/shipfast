'use client';

import React, { useEffect, useState } from 'react';
import { useEconomyStore } from '@/app/store/useEconomyStore';
import { PortEconomicData, TradeOpportunity } from '@/app/lib/types/economy';

interface PortEconomicsDemoProps {
  className?: string;
}

const PortEconomicsDemo: React.FC<PortEconomicsDemoProps> = ({ className = '' }) => {
  const {
    initializeEconomy,
    portEconomicData,
    tradeOpportunities,
    getPortPrice,
    updatePortEconomics,
    calculateTradeOpportunities
  } = useEconomyStore();

  const [selectedPortId, setSelectedPortId] = useState<string>('port-shanghai');
  const [selectedGoodId, setSelectedGoodId] = useState<string>('electronics');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        initializeEconomy();
        // Give it a moment to initialize
        setTimeout(() => {
          updatePortEconomics();
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Failed to initialize economy:', error);
        setIsLoading(false);
      }
    };

    initializeData();
  }, [initializeEconomy, updatePortEconomics]);

  const selectedPortData = portEconomicData.get(selectedPortId);
  const portPrice = getPortPrice(selectedGoodId, selectedPortId);
  const topOpportunities = tradeOpportunities.slice(0, 5);

  const refreshData = () => {
    updatePortEconomics();
    useEconomyStore.setState({ 
      tradeOpportunities: calculateTradeOpportunities() 
    });
  };

  if (isLoading) {
    return (
      <div className={`p-6 bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-yellow-400">Port Economics Dashboard</h2>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Port Selection and Data */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Port:
            </label>
            <select
              value={selectedPortId}
              onChange={(e) => setSelectedPortId(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
            >
              {Array.from(portEconomicData.keys()).map(portId => {
                const data = portEconomicData.get(portId);
                return (
                  <option key={portId} value={portId}>
                    {data?.portName || portId}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedPortData && (
            <div className="bg-gray-800 p-4 rounded border border-gray-600">
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">
                {selectedPortData.portName}
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Region:</span>
                  <span className="text-white">{selectedPortData.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Capacity:</span>
                  <span className="text-white">{selectedPortData.capacity.toLocaleString()} TEU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Efficiency:</span>
                  <span className="text-white">{Math.round(selectedPortData.efficiency * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Utilization:</span>
                  <span className={`font-semibold ${
                    selectedPortData.currentUtilization > 0.8 ? 'text-red-400' :
                    selectedPortData.currentUtilization > 0.6 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {Math.round(selectedPortData.currentUtilization * 100)}%
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Top Goods:</h4>
                <div className="space-y-1">
                  {selectedPortData.goods.slice(0, 4).map(good => (
                    <div key={good.goodId} className="flex justify-between text-xs">
                      <span className="text-gray-400">{good.goodId}:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white">${good.localPrice.toFixed(2)}</span>
                        <span className={`text-xs ${
                          good.trend === 'rising' ? 'text-green-400' :
                          good.trend === 'falling' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {good.trend === 'rising' ? '↗' : good.trend === 'falling' ? '↘' : '→'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Price Calculator */}
          <div className="bg-gray-800 p-4 rounded border border-gray-600">
            <h4 className="text-lg font-semibold text-yellow-400 mb-3">Price Calculator</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Good:
                </label>
                <select
                  value={selectedGoodId}
                  onChange={(e) => setSelectedGoodId(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="electronics">Electronics</option>
                  <option value="coffee">Coffee</option>
                  <option value="crude_petroleum">Crude Petroleum</option>
                  <option value="iron_ore">Iron Ore</option>
                  <option value="textiles">Textiles</option>
                </select>
              </div>
              
              <div className="bg-gray-700 p-3 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Port Price:</span>
                  <span className="text-2xl font-bold text-green-400">
                    ${portPrice.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Includes port modifiers and regional effects
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Opportunities */}
        <div>
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">
            Top Trade Opportunities
          </h3>
          
          <div className="space-y-3">
            {topOpportunities.length > 0 ? (
              topOpportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className="bg-gray-800 p-4 rounded border border-gray-600 hover:border-yellow-500 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-white">{opportunity.goodName}</h4>
                      <div className="text-sm text-gray-400">
                        {opportunity.originPortName} → {opportunity.destinationPortName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">
                        +{opportunity.profitMargin.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-400">
                        ${opportunity.potentialProfit.toFixed(2)} profit
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                    <div>
                      <span>Buy: ${opportunity.originPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span>Sell: ${opportunity.destinationPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span>Distance: {opportunity.distance.toFixed(0)} units</span>
                    </div>
                    <div>
                      <span>Profit/hr: ${opportunity.profitPerHour.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Risk Level:</span>
                      <span className={`font-medium ${
                        opportunity.riskLevel > 20 ? 'text-red-400' :
                        opportunity.riskLevel > 10 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {opportunity.riskLevel.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-800 p-4 rounded border border-gray-600 text-center text-gray-400">
                No trade opportunities found. Try refreshing the data.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortEconomicsDemo;
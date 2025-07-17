'use client';

import React, { useState, useEffect } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useEmpireStore } from '@/src/store/empireStore';
import { useRouteStore, useSelectedRoute, useRouteProfitSummary } from '@/app/store/useRouteStore';
import type { Route } from '@/types/route';

export const RouteManager: React.FC = () => {
  const { ports, player } = useEmpireStore();
  const { 
    routes, 
    isLoading, 
    error,
    loadPlayerRoutes,
    createRoute,
    deleteRoute,
    activateRoute,
    deactivateRoute,
    selectRoute,
    selectedRouteId
  } = useRouteStore();
  
  const selectedRoute = useSelectedRoute();
  const profitSummary = useRouteProfitSummary();
  
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [routeName, setRouteName] = useState<string>('');
  
  // Load player routes on mount
  useEffect(() => {
    if (player?.id) {
      loadPlayerRoutes(player.id);
    }
  }, [player?.id, loadPlayerRoutes]);

  const handleCreateRoute = async () => {
    if (selectedOrigin && selectedDestination && selectedOrigin !== selectedDestination && player?.id) {
      const result = await createRoute({
        name: routeName || `${selectedOrigin} - ${selectedDestination}`,
        originPortId: selectedOrigin,
        destinationPortId: selectedDestination,
        waypoints: []
      }, player.id);
      
      if (result.success) {
        setIsCreatingRoute(false);
        setSelectedOrigin('');
        setSelectedDestination('');
        setRouteName('');
        if (result.routeId) {
          selectRoute(result.routeId);
        }
      } else {
        alert(result.error || 'Failed to create route');
      }
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    const confirmed = confirm('Are you sure you want to delete this route?');
    if (confirmed) {
      const success = await deleteRoute(routeId);
      if (!success) {
        alert('Failed to delete route');
      }
    }
  };

  const toggleRouteStatus = async (routeId: string) => {
    const route = routes.get(routeId);
    if (route) {
      const success = route.isActive 
        ? await deactivateRoute(routeId)
        : await activateRoute(routeId);
      
      if (!success) {
        alert('Failed to update route status');
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Route Summary */}
      {routes.size > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600">Total Routes</p>
            <p className="text-2xl font-bold">{profitSummary.totalRoutes}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-600">Active Routes</p>
            <p className="text-2xl font-bold text-green-700">{profitSummary.activeRoutes}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-600">Daily Profit</p>
            <p className="text-2xl font-bold text-blue-700">
              ${profitSummary.totalProfitPerDay.toLocaleString()}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-purple-600">Avg ROI</p>
            <p className="text-2xl font-bold text-purple-700">
              {profitSummary.averageROI.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      <Panel
        title="Route Management"
        className="mb-4"
        actions={
          <Button
            onClick={() => setIsCreatingRoute(!isCreatingRoute)}
            variant="primary"
            size="small"
          >
            {isCreatingRoute ? 'Cancel' : '+ New Route'}
          </Button>
        }
      >
        {isCreatingRoute && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-3">Create New Route</h4>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route Name (optional)
              </label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="e.g., Asia-Europe Express"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origin Port
                </label>
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select origin...</option>
                  {ports.map(port => (
                    <option key={port.id} value={port.id}>
                      {port.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination Port
                </label>
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select destination...</option>
                  {ports
                    .filter(port => port.id !== selectedOrigin)
                    .map(port => (
                      <option key={port.id} value={port.id}>
                        {port.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <Button
              onClick={handleCreateRoute}
              variant="primary"
              disabled={!selectedOrigin || !selectedDestination}
              className="w-full"
            >
              Create Route
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-gray-500 text-center py-8">Loading routes...</p>
          ) : error ? (
            <p className="text-red-500 text-center py-8">{error}</p>
          ) : routes.size === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No routes created yet. Click "New Route" to start.
            </p>
          ) : (
            Array.from(routes.values()).map(route => {
              const originPort = ports.find(p => p.id === route.originPortId);
              const destPort = ports.find(p => p.id === route.destinationPortId);
              
              return (
                <div
                  key={route.id}
                  onClick={() => selectRoute(route.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedRouteId === route.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-white border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{route.name}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <span>{originPort?.name || route.originPortId}</span>
                        <span className="mx-2">→</span>
                        <span>{destPort?.name || route.destinationPortId}</span>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-gray-500">
                          Distance: {route.totalDistance.toLocaleString()} nm
                        </span>
                        <span className="text-green-600 font-medium">
                          Profit/Day: ${route.profitability.profitPerDay.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        route.isActive 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {route.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {route.assignedAssets.length} ship{route.assignedAssets.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Panel>

      {selectedRoute && (
        <Panel title="Route Details" className="flex-1">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Route Name</label>
                <p className="mt-1 text-lg font-semibold">{selectedRoute.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    selectedRoute.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedRoute.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Origin</label>
                <p className="mt-1 text-lg">
                  {ports.find(p => p.id === selectedRoute.originPortId)?.name || selectedRoute.originPortId}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Destination</label>
                <p className="mt-1 text-lg">
                  {ports.find(p => p.id === selectedRoute.destinationPortId)?.name || selectedRoute.destinationPortId}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Distance</label>
                <p className="mt-1 text-lg">{selectedRoute.totalDistance.toLocaleString()} nm</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Travel Time</label>
                <p className="mt-1 text-lg">{selectedRoute.estimatedTime.toFixed(0)} hours</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ships Assigned</label>
                <p className="mt-1 text-lg">{selectedRoute.assignedAssets.length}</p>
              </div>
            </div>

            {/* Profitability Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Profitability Analysis</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-lg font-semibold">${selectedRoute.profitability.revenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Costs</p>
                  <p className="text-lg font-semibold text-red-600">
                    ${Object.values(selectedRoute.profitability.costs).reduce((a, b) => a + b, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className="text-lg font-semibold text-green-600">
                    ${selectedRoute.profitability.netProfit.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Profit Margin</p>
                  <p className="text-lg font-semibold">{selectedRoute.profitability.profitMargin.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ROI</p>
                  <p className="text-lg font-semibold">{selectedRoute.profitability.roi.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Profit/Day</p>
                  <p className="text-lg font-semibold text-green-600">
                    ${selectedRoute.profitability.profitPerDay.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Route Performance */}
            {selectedRoute.performance.totalTrips > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Performance History</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Trips</p>
                    <p className="font-semibold">{selectedRoute.performance.totalTrips}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Success Rate</p>
                    <p className="font-semibold">
                      {((selectedRoute.performance.successfulTrips / selectedRoute.performance.totalTrips) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">On-Time %</p>
                    <p className="font-semibold">{selectedRoute.performance.onTimePercentage.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-4 flex gap-2">
              <Button
                onClick={() => toggleRouteStatus(selectedRoute.id)}
                variant={selectedRoute.isActive ? 'secondary' : 'primary'}
              >
                {selectedRoute.isActive ? 'Deactivate Route' : 'Activate Route'}
              </Button>
              <Button
                onClick={() => handleDeleteRoute(selectedRoute.id)}
                variant="danger"
              >
                Delete Route
              </Button>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
};

export default RouteManager;
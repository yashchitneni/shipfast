'use client';

import React, { useState } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useEmpireStore } from '@/src/store/empireStore';

interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: number;
  estimatedProfit: number;
  status: 'active' | 'paused' | 'planning';
  shipsAssigned: number;
}

export const RouteManager: React.FC = () => {
  const { ports } = useEmpireStore();
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  
  // Mock routes for demonstration
  const [routes, setRoutes] = useState<Route[]>([
    {
      id: '1',
      name: 'Asia-Europe Express',
      origin: 'Shanghai',
      destination: 'Rotterdam',
      distance: 11150,
      estimatedProfit: 45000,
      status: 'active',
      shipsAssigned: 2
    },
    {
      id: '2',
      name: 'Trans-Pacific Route',
      origin: 'Los Angeles',
      destination: 'Tokyo',
      distance: 5470,
      estimatedProfit: 32000,
      status: 'active',
      shipsAssigned: 1
    }
  ]);

  const handleCreateRoute = () => {
    if (selectedOrigin && selectedDestination && selectedOrigin !== selectedDestination) {
      const newRoute: Route = {
        id: Date.now().toString(),
        name: `${selectedOrigin} - ${selectedDestination}`,
        origin: selectedOrigin,
        destination: selectedDestination,
        distance: Math.floor(Math.random() * 10000) + 1000,
        estimatedProfit: Math.floor(Math.random() * 50000) + 10000,
        status: 'planning',
        shipsAssigned: 0
      };
      setRoutes([...routes, newRoute]);
      setIsCreatingRoute(false);
      setSelectedOrigin('');
      setSelectedDestination('');
    }
  };

  const handleDeleteRoute = (routeId: string) => {
    setRoutes(routes.filter(r => r.id !== routeId));
    if (selectedRoute?.id === routeId) {
      setSelectedRoute(null);
    }
  };

  const toggleRouteStatus = (routeId: string) => {
    setRoutes(routes.map(route => {
      if (route.id === routeId) {
        return {
          ...route,
          status: route.status === 'active' ? 'paused' : 'active'
        };
      }
      return route;
    }));
  };

  return (
    <div className="h-full flex flex-col">
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
                    <option key={port.id} value={port.name}>
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
                    .filter(port => port.name !== selectedOrigin)
                    .map(port => (
                      <option key={port.id} value={port.name}>
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
          {routes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No routes created yet. Click "New Route" to start.
            </p>
          ) : (
            routes.map(route => (
              <div
                key={route.id}
                onClick={() => setSelectedRoute(route)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedRoute?.id === route.id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-white border border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{route.name}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      <span>{route.origin}</span>
                      <span className="mx-2">→</span>
                      <span>{route.destination}</span>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-gray-500">
                        Distance: {route.distance.toLocaleString()} km
                      </span>
                      <span className="text-green-600 font-medium">
                        Est. Profit: ${route.estimatedProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      route.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : route.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {route.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {route.shipsAssigned} ship{route.shipsAssigned !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))
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
                    selectedRoute.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : selectedRoute.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedRoute.status.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Origin</label>
                <p className="mt-1 text-lg">{selectedRoute.origin}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Destination</label>
                <p className="mt-1 text-lg">{selectedRoute.destination}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Distance</label>
                <p className="mt-1 text-lg">{selectedRoute.distance.toLocaleString()} km</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Est. Profit</label>
                <p className="mt-1 text-lg text-green-600 font-semibold">
                  ${selectedRoute.estimatedProfit.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ships Assigned</label>
                <p className="mt-1 text-lg">{selectedRoute.shipsAssigned}</p>
              </div>
            </div>

            <div className="border-t pt-4 flex gap-2">
              <Button
                onClick={() => toggleRouteStatus(selectedRoute.id)}
                variant={selectedRoute.status === 'active' ? 'secondary' : 'primary'}
              >
                {selectedRoute.status === 'active' ? 'Pause Route' : 'Activate Route'}
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
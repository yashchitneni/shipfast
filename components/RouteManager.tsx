'use client';

import { useState } from 'react';
import { useRouteStore, useSelectedRoute, useRouteProfitSummary } from '../app/store/useRouteStore';
import { useEmpireStore } from '../src/store/empireStore';
import { routeBridge } from '../utils/routeBridge';

export default function RouteManager() {
  const [isCreating, setIsCreating] = useState(false);
  const [routeName, setRouteName] = useState('');
  
  const routes = useRouteStore(state => Array.from(state.routes.values()));
  const selectedRoute = useSelectedRoute();
  const routeSummary = useRouteProfitSummary();
  const player = useEmpireStore(state => state.player);
  const routeCreationMode = useRouteStore(state => state.routeCreationMode);
  const routePreview = useRouteStore(state => state.routePreview);
  
  const handleCreateRoute = async () => {
    if (!routeName.trim()) return;
    
    const result = await routeBridge.confirmRouteCreation(routeName);
    if (result.success) {
      setRouteName('');
      setIsCreating(false);
    } else {
      alert(`Failed to create route: ${result.error}`);
    }
  };
  
  const handleCancelRoute = () => {
    routeBridge.cancelRouteCreation();
    setIsCreating(false);
    setRouteName('');
  };
  
  const handleStartRouteCreation = () => {
    setIsCreating(true);
    // Route creation will start when user clicks on a port
  };
  
  const handleToggleRoute = async (routeId: string, isActive: boolean) => {
    const routeStore = useRouteStore.getState();
    if (isActive) {
      await routeStore.deactivateRoute(routeId);
    } else {
      await routeStore.activateRoute(routeId);
    }
  };
  
  const handleDeleteRoute = async (routeId: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      const routeStore = useRouteStore.getState();
      await routeStore.deleteRoute(routeId);
    }
  };
  
  return (
    <div className="fixed top-20 right-4 bg-black/80 text-white p-4 rounded-lg max-w-md">
      <h2 className="text-xl font-bold mb-4">Trade Routes</h2>
      
      {/* Route Summary */}
      <div className="mb-4 text-sm">
        <div>Total Routes: {routeSummary.totalRoutes}</div>
        <div>Active Routes: {routeSummary.activeRoutes}</div>
        <div className="text-green-400">
          Daily Profit: ${routeSummary.totalProfitPerDay.toLocaleString()}
        </div>
        <div>Average ROI: {routeSummary.averageROI.toFixed(1)}%</div>
      </div>
      
      {/* Route Creation */}
      {routeCreationMode && routePreview ? (
        <div className="mb-4 p-3 bg-blue-600/20 rounded">
          <h3 className="font-semibold mb-2">Creating New Route</h3>
          <div className="text-sm mb-2">
            <div>From: Port {routePreview.originPortId}</div>
            <div>To: {routePreview.destinationPortId || 'Select destination port'}</div>
          </div>
          <input
            type="text"
            placeholder="Route name"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            className="w-full px-2 py-1 rounded bg-black/50 text-white mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateRoute}
              disabled={!routePreview.isValid || !routeName.trim()}
              className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm"
            >
              Create Route
            </button>
            <button
              onClick={handleCancelRoute}
              className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleStartRouteCreation}
          className="w-full mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          Create New Route
        </button>
      )}
      
      {/* Route List */}
      <div className="max-h-96 overflow-y-auto">
        {routes.length === 0 ? (
          <p className="text-gray-400 text-sm">No routes created yet</p>
        ) : (
          routes.map(route => (
            <div
              key={route.id}
              className={`mb-2 p-2 rounded ${
                selectedRoute?.id === route.id ? 'bg-white/20' : 'bg-white/10'
              } hover:bg-white/15 cursor-pointer`}
              onClick={() => useRouteStore.getState().selectRoute(route.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{route.name}</h4>
                  <div className="text-xs text-gray-300">
                    {route.totalDistance.toFixed(0)} nm • {route.estimatedTime.toFixed(0)}h
                  </div>
                  <div className={`text-xs ${
                    route.profitability.netProfit > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${route.profitability.netProfit.toFixed(0)}/day
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleRoute(route.id, route.isActive);
                    }}
                    className={`px-2 py-1 text-xs rounded ${
                      route.isActive 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {route.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoute(route.id);
                    }}
                    className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {route.assignedAssets.length > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  {route.assignedAssets.length} ships assigned
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Instructions */}
      {isCreating && !routeCreationMode && (
        <div className="mt-4 p-2 bg-yellow-600/20 rounded text-xs">
          Click on a port to start creating a route
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useState, useEffect, memo } from 'react';
import { Minimap } from '../ui/Minimap';
import { ZoomControls } from '../ui/ZoomControls';
import { PortManagementPanel } from '../port/PortManagementPanel';
import { minimapBridge } from '../../../utils/minimapBridge';
import { useEmpireStore } from '@/src/store/empireStore';

interface GameHUDProps {}

export const GameHUD: React.FC<GameHUDProps> = memo(() => {
  const [minimapData, setMinimapData] = useState<{
    tileData?: Array<Array<{ type: 'ocean' | 'land' | 'port' }>>;
    mapDimensions?: { width: number; height: number };
    cameraViewport?: { x: number; y: number; width: number; height: number };
  }>({});
  
  const [currentZoom, setCurrentZoom] = useState(1);
  const { selectedPort } = useEmpireStore();

  useEffect(() => {
    // Listen for minimap updates
    const handleMinimapUpdate = (data: any) => {
      setMinimapData(data);
    };

    const handleViewportUpdate = (viewport: any) => {
      setMinimapData(prev => {
        // Only update if viewport actually changed
        if (prev?.cameraViewport && 
            Math.abs(prev.cameraViewport.x - viewport.x) < 1 &&
            Math.abs(prev.cameraViewport.y - viewport.y) < 1 &&
            Math.abs(prev.cameraViewport.width - viewport.width) < 1 &&
            Math.abs(prev.cameraViewport.height - viewport.height) < 1) {
          return prev; // No change, return same object
        }
        return {
          ...prev,
          cameraViewport: viewport
        };
      });
    };

    const handleZoomUpdate = (newZoom: number) => {
      setCurrentZoom(newZoom);
    };

    minimapBridge.on('minimap-update', handleMinimapUpdate);
    minimapBridge.on('viewport-update', handleViewportUpdate);
    minimapBridge.on('zoom-update', handleZoomUpdate);

    return () => {
      minimapBridge.off('minimap-update', handleMinimapUpdate);
      minimapBridge.off('viewport-update', handleViewportUpdate);
      minimapBridge.off('zoom-update', handleZoomUpdate);
    };
  }, []);

  const handleMinimapClick = (worldX: number, worldY: number) => {
    minimapBridge.handleMinimapClick(worldX, worldY);
  };

  const handleZoomIn = () => {
    minimapBridge.emit('zoom-in');
  };

  const handleZoomOut = () => {
    minimapBridge.emit('zoom-out');
  };

  const handleWorldView = () => {
    minimapBridge.emit('world-view');
  };

  return (
    <>
      {/* Minimap */}
      <Minimap
        tileData={minimapData.tileData}
        mapDimensions={minimapData.mapDimensions}
        cameraViewport={minimapData.cameraViewport}
        onMinimapClick={handleMinimapClick}
      />

      {/* Zoom Controls */}
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onWorldView={handleWorldView}
        currentZoom={currentZoom}
      />

      {/* Port Management Panel (when zoomed in on a port) */}
      {selectedPort && <PortManagementPanel />}
    </>
  );
});

GameHUD.displayName = 'GameHUD';

export default GameHUD;
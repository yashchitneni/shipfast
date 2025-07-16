'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { useEmpireStore } from '@/src/store/empireStore';

interface MinimapProps {
  tileData?: Array<Array<{ type: 'ocean' | 'land' | 'port' }>>;
  mapDimensions?: { width: number; height: number };
  cameraViewport?: { x: number; y: number; width: number; height: number };
  onMinimapClick?: (worldX: number, worldY: number) => void;
}

export const Minimap: React.FC<MinimapProps> = memo(({
  tileData,
  mapDimensions,
  cameraViewport,
  onMinimapClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { portNodes } = useEmpireStore();
  const [isHovered, setIsHovered] = useState(false);
  
  // Props changed, component will re-render

  // Minimap dimensions - adjusted for larger map
  const MINIMAP_WIDTH = 400;  // Increased for larger map
  const MINIMAP_HEIGHT = 200;  // Increased for larger map
  const TILE_SIZE = mapDimensions ? Math.min(
    MINIMAP_WIDTH / mapDimensions.width,
    MINIMAP_HEIGHT / mapDimensions.height
  ) : 1;

  // Colors for different tile types
  const COLORS = {
    ocean: '#0077BE',
    land: '#00A652',
    port: '#E03C31',
    viewport: '#FFD700',
    portMarker: '#FFD700'
  };

  // Draw the minimap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tileData || !mapDimensions) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Drawing minimap

    // Clear canvas
    ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);
    
    // Fill with background color first
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Draw tiles
    for (let y = 0; y < mapDimensions.height; y++) {
      for (let x = 0; x < mapDimensions.width; x++) {
        const tile = tileData[y]?.[x];
        if (!tile) continue;

        // Set color based on tile type
        ctx.fillStyle = COLORS[tile.type];
        
        // Draw tile
        ctx.fillRect(
          x * TILE_SIZE,
          y * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        );
      }
    }

    // Draw grid lines (optional, for better visibility)
    if (TILE_SIZE > 2) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 0.5;
      
      for (let x = 0; x <= mapDimensions.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE_SIZE, 0);
        ctx.lineTo(x * TILE_SIZE, mapDimensions.height * TILE_SIZE);
        ctx.stroke();
      }
      
      for (let y = 0; y <= mapDimensions.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE_SIZE);
        ctx.lineTo(mapDimensions.width * TILE_SIZE, y * TILE_SIZE);
        ctx.stroke();
      }
    }

    // Draw port markers
    Array.from(portNodes.values()).forEach(port => {
      // Convert world coordinates to tile coordinates
      const tileX = Math.floor((port.position.x / 64 + port.position.y / 32) / 2);
      const tileY = Math.floor((port.position.y / 32 - port.position.x / 64) / 2);
      
      // Draw port marker
      ctx.fillStyle = COLORS.portMarker;
      ctx.beginPath();
      ctx.arc(
        tileX * TILE_SIZE + TILE_SIZE / 2,
        tileY * TILE_SIZE + TILE_SIZE / 2,
        Math.max(2, TILE_SIZE / 2),
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    // Draw camera viewport
    if (cameraViewport && mapDimensions) {
      // Convert world coordinates to tile coordinates first
      // Using the inverse of the isometric conversion formula
      const worldToTileX = (worldX: number, worldY: number) => {
        return Math.floor((worldX / 32 + worldY / 16) / 2);
      };
      const worldToTileY = (worldX: number, worldY: number) => {
        return Math.floor((worldY / 16 - worldX / 32) / 2);
      };
      
      // Convert viewport corners to tile coordinates
      const topLeftTileX = worldToTileX(cameraViewport.x, cameraViewport.y);
      const topLeftTileY = worldToTileY(cameraViewport.x, cameraViewport.y);
      
      // Convert to minimap coordinates
      const viewX = topLeftTileX * TILE_SIZE;
      const viewY = topLeftTileY * TILE_SIZE;
      const viewWidth = (cameraViewport.width / 64) * TILE_SIZE;
      const viewHeight = (cameraViewport.height / 32) * TILE_SIZE;

      // Draw viewport rectangle
      ctx.strokeStyle = COLORS.viewport;
      ctx.lineWidth = 2;
      ctx.strokeRect(viewX, viewY, viewWidth, viewHeight);

      // Add a slight fill for visibility
      ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
      ctx.fillRect(viewX, viewY, viewWidth, viewHeight);
    }
  }, [tileData, mapDimensions, cameraViewport, portNodes, TILE_SIZE]);

  // Handle minimap click
  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onMinimapClick || !mapDimensions) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert minimap coordinates to tile coordinates
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    
    // Convert tile coordinates to world coordinates using isometric formula
    const worldX = (tileX - tileY) * 32;
    const worldY = (tileX + tileY) * 16;

    onMinimapClick(worldX, worldY);
  };

  // Don't render until we have data
  if (!tileData || !mapDimensions) {
    return (
      <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-90 border-2 border-gray-700 rounded-lg p-4 shadow-lg">
        <div className="text-xs text-gray-400">Loading map...</div>
      </div>
    );
  }

  return (
    <div 
      className={`
        absolute top-4 right-4 
        bg-gray-900 bg-opacity-90 
        border-2 border-gray-700 
        rounded-lg p-2 
        shadow-lg
        transition-all duration-200
        ${isHovered ? 'border-yellow-500' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas
        ref={canvasRef}
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        className="cursor-pointer"
        onClick={handleClick}
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="text-xs text-gray-400 mt-1 text-center">
        Minimap
      </div>
    </div>
  );
});

Minimap.displayName = 'Minimap';

export default Minimap;
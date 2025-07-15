'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AssetPlacementUI } from './AssetPlacementUI';
import { AssetPreview } from './AssetPreview';
import { useEmpireStore } from '../../../src/store/empireStore';

export const AssetManager: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { assetPreview, updateAssetPreview, placeAsset, cancelAssetPreview, player } = useEmpireStore();

  // Track mouse movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const position = { x: e.clientX, y: e.clientY };
    setMousePosition(position);
    
    if (assetPreview) {
      updateAssetPreview(position);
    }
  }, [assetPreview, updateAssetPreview]);

  // Handle clicks for placement
  const handleClick = useCallback(async (e: MouseEvent) => {
    if (assetPreview && assetPreview.isValid) {
      await placeAsset();
    }
  }, [assetPreview, placeAsset]);

  // Handle escape key to cancel placement
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && assetPreview) {
      cancelAssetPreview();
    } else if (e.key === 'r' && assetPreview) {
      // Rotate asset with 'r' key
      const newRotation = (assetPreview.rotation + 45) % 360;
      updateAssetPreview(mousePosition, newRotation);
    }
  }, [assetPreview, cancelAssetPreview, updateAssetPreview, mousePosition]);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseMove, handleClick, handleKeyDown]);

  return (
    <div className="asset-manager">
      {/* Asset placement UI sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg overflow-y-auto">
        <AssetPlacementUI />
      </div>

      {/* Asset preview follows mouse */}
      <AssetPreview 
        mousePosition={mousePosition} 
        isVisible={!!assetPreview} 
      />

      {/* Instructions */}
      {assetPreview && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded">
          <p className="text-sm mb-1">Click to place asset</p>
          <p className="text-sm mb-1">Press R to rotate</p>
          <p className="text-sm">Press ESC to cancel</p>
        </div>
      )}
    </div>
  );
};
'use client';

import React, { useEffect, useState } from 'react';
import { useEmpireStore } from '../../../src/store/empireStore';
import { AssetDefinition } from '../../lib/types/assets';

interface AssetPreviewProps {
  mousePosition: { x: number; y: number };
  isVisible: boolean;
}

export const AssetPreview: React.FC<AssetPreviewProps> = ({ mousePosition, isVisible }) => {
  const { assetPreview, assetDefinitions } = useEmpireStore();
  const [definition, setDefinition] = useState<AssetDefinition | null>(null);

  useEffect(() => {
    if (assetPreview?.definitionId) {
      const def = assetDefinitions.get(assetPreview.definitionId);
      setDefinition(def || null);
    } else {
      setDefinition(null);
    }
  }, [assetPreview, assetDefinitions]);

  if (!isVisible || !assetPreview || !definition) {
    return null;
  }

  const previewStyle: React.CSSProperties = {
    position: 'fixed',
    left: mousePosition.x,
    top: mousePosition.y,
    transform: `translate(-50%, -50%) rotate(${assetPreview.rotation}deg)`,
    pointerEvents: 'none',
    zIndex: 1000,
    opacity: assetPreview.isValid ? 0.8 : 0.5,
  };

  const getAssetIcon = () => {
    switch (definition.type) {
      case 'ship':
        return '🚢';
      case 'plane':
        // Different icons for different plane types
        if (definition.id.includes('passenger')) {
          return '🛩️'; // Passenger plane
        } else if (definition.id.includes('super')) {
          return '🛫'; // Large cargo plane
        }
        return '✈️'; // Standard cargo plane
      case 'warehouse':
        // Different icons for different warehouse types
        if (definition.id.includes('mega')) {
          return '🏗️'; // Mega distribution hub
        } else if (definition.id.includes('distribution')) {
          return '📦'; // Distribution center
        } else if (definition.id.includes('specialized')) {
          return '❄️'; // Cold storage
        }
        return '🏭'; // Standard warehouse
      case 'infrastructure':
        return definition.subType === 'route' ? '〰️' : '📜';
      default:
        return '📦';
    }
  };

  return (
    <div style={previewStyle} className="asset-preview">
      <div className="relative">
        {/* Asset Icon */}
        <div className="text-4xl">{getAssetIcon()}</div>
        
        {/* Snap indicator */}
        {assetPreview.snapToPort && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            Snap to port
          </div>
        )}
        
        {/* Validation errors */}
        {assetPreview.validationErrors && assetPreview.validationErrors.length > 0 && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {assetPreview.validationErrors[0]}
          </div>
        )}
        
        {/* Valid placement indicator */}
        {assetPreview.isValid && (
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-500 rounded-full"></div>
        )}
      </div>
    </div>
  );
};
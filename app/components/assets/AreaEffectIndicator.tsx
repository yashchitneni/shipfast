'use client';

import React from 'react';
import { AssetDefinition, PlacedAsset, Position } from '../../lib/types/assets';

interface AreaEffectIndicatorProps {
  asset: PlacedAsset;
  definition: AssetDefinition;
  isVisible: boolean;
}

export const AreaEffectIndicator: React.FC<AreaEffectIndicatorProps> = ({
  asset,
  definition,
  isVisible
}) => {
  if (!isVisible || !definition.areaEffect) {
    return null;
  }

  const { radius, type, value } = definition.areaEffect;

  // Calculate the visual circle style
  const circleStyle: React.CSSProperties = {
    position: 'absolute',
    left: asset.position.x - radius,
    top: asset.position.y - radius,
    width: radius * 2,
    height: radius * 2,
    borderRadius: '50%',
    border: `2px dashed ${getEffectColor(type)}`,
    backgroundColor: `${getEffectColor(type)}15`, // 15% opacity
    pointerEvents: 'none',
    zIndex: 10,
    transform: `rotate(${asset.rotation}deg)`,
    transition: 'all 0.3s ease',
  };

  // Get effect description for tooltip
  const getEffectDescription = () => {
    switch (type) {
      case 'port_efficiency':
        return `+${(value * 100).toFixed(0)}% Port Efficiency`;
      case 'risk_reduction':
        return `-${(value * 100).toFixed(0)}% Risk`;
      case 'speed_boost':
        return `+${(value * 100).toFixed(0)}% Speed`;
      default:
        return 'Area Effect';
    }
  };

  return (
    <div className="area-effect-indicator">
      {/* Effect circle */}
      <div style={circleStyle}>
        {/* Effect center indicator */}
        <div
          className="effect-center"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '6px',
            height: '6px',
            backgroundColor: getEffectColor(type),
            borderRadius: '50%',
            boxShadow: `0 0 10px ${getEffectColor(type)}`,
          }}
        />
        
        {/* Effect value indicator */}
        <div
          className="effect-value"
          style={{
            position: 'absolute',
            left: '50%',
            top: '10px',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            fontWeight: 'bold',
            color: getEffectColor(type),
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '2px 6px',
            borderRadius: '10px',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          }}
        >
          {getEffectDescription()}
        </div>
      </div>

      {/* Pulse animation for active effects */}
      <style jsx>{`
        .area-effect-indicator {
          animation: pulse 3s infinite ease-in-out;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }
        
        .effect-center {
          animation: glow 2s infinite ease-in-out alternate;
        }
        
        @keyframes glow {
          from {
            box-shadow: 0 0 5px ${getEffectColor(type)};
          }
          to {
            box-shadow: 0 0 20px ${getEffectColor(type)}, 0 0 30px ${getEffectColor(type)};
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to get color based on effect type
function getEffectColor(type: string): string {
  switch (type) {
    case 'port_efficiency':
      return '#00C851'; // Green for efficiency boost
    case 'risk_reduction':
      return '#007bff'; // Blue for risk reduction
    case 'speed_boost':
      return '#ff6900'; // Orange for speed boost
    default:
      return '#6c757d'; // Gray for unknown effects
  }
}
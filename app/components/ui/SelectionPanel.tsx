'use client';

import React from 'react';

interface AssetProperty {
  label: string;
  value: string | number;
  type?: 'text' | 'currency' | 'percentage' | 'status';
}

interface SelectedAsset {
  id: string;
  type: string;
  name: string;
  properties: AssetProperty[];
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }[];
}

interface SelectionPanelProps {
  selectedAsset: SelectedAsset | null;
  className?: string;
}

export const SelectionPanel: React.FC<SelectionPanelProps> = ({ selectedAsset, className = '' }) => {
  if (!selectedAsset) {
    return (
      <div className={`game-panel p-4 ${className}`}>
        <p className="text-gray-500 text-center">No asset selected</p>
      </div>
    );
  }

  const formatValue = (property: AssetProperty): string => {
    switch (property.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(property.value as number);
      case 'percentage':
        return `${property.value}%`;
      case 'status':
        return String(property.value);
      default:
        return String(property.value);
    }
  };

  const getStatusColor = (value: string | number): string => {
    const status = String(value).toLowerCase();
    switch (status) {
      case 'active':
      case 'operational':
        return 'var(--cargo-green)';
      case 'idle':
      case 'maintenance':
        return 'var(--warning-yellow)';
      case 'damaged':
      case 'offline':
        return 'var(--alert-red)';
      default:
        return 'var(--foreground)';
    }
  };

  const getButtonStyles = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-[--dashboard-blue] hover:bg-[--ocean-blue] text-white';
      case 'danger':
        return 'bg-[--alert-red] hover:bg-red-700 text-white';
      default:
        return 'bg-[--neutral-gray] hover:bg-gray-600 text-white';
    }
  };

  return (
    <div className={`game-panel p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-[--dashboard-blue]">{selectedAsset.name}</h3>
        <p className="text-sm text-gray-500">{selectedAsset.type}</p>
      </div>

      <div className="space-y-3 mb-4">
        {selectedAsset.properties.map((property, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">{property.label}:</span>
            <span 
              className="text-sm font-semibold"
              style={{ 
                color: property.type === 'status' 
                  ? getStatusColor(property.value) 
                  : property.type === 'currency' 
                    ? 'var(--gold-yellow)' 
                    : 'var(--foreground)'
              }}
            >
              {formatValue(property)}
            </span>
          </div>
        ))}
      </div>

      {selectedAsset.actions && selectedAsset.actions.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-gray-200">
          {selectedAsset.actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`game-button w-full ${getButtonStyles(action.variant)}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectionPanel;
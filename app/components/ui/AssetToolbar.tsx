'use client';

import React, { useState } from 'react';

interface AssetToolbarProps {
  onAssetSelect: (assetType: string) => void;
  className?: string;
}

interface ToolbarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export const AssetToolbar: React.FC<AssetToolbarProps> = ({ onAssetSelect, className = '' }) => {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const toolbarItems: ToolbarItem[] = [
    {
      id: 'ship',
      label: 'Ship',
      color: 'var(--ocean-blue)',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 17L5 18C5 19.1046 5.89543 20 7 20L17 20C18.1046 20 19 19.1046 19 18V17" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 4V17M12 4L7 9M12 4L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M3 17H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'warehouse',
      label: 'Warehouse',
      color: 'var(--earth-brown)',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="8" width="18" height="12" stroke="currentColor" strokeWidth="2"/>
          <path d="M3 8L12 3L21 8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M9 12H15V20H9V12Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
    },
    {
      id: 'plane',
      label: 'Plane',
      color: 'var(--sky-blue)',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12L16 8V11H8L5 7H3V10L8 14H16V17L21 13" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: 'port',
      label: 'Port',
      color: 'var(--port-orange)',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="12" width="8" height="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M4 16H8M16 16H20" stroke="currentColor" strokeWidth="2"/>
          <path d="M10 12V8L12 4L14 8V12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  const handleAssetClick = (assetId: string) => {
    setSelectedAsset(assetId);
    onAssetSelect(assetId);
  };

  return (
    <div className={`game-panel flex gap-2 p-2 ${className}`}>
      {toolbarItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleAssetClick(item.id)}
          className={`
            game-button relative flex flex-col items-center justify-center
            w-20 h-20 transition-all duration-200
            ${selectedAsset === item.id 
              ? 'ring-2 ring-offset-2 ring-[--dashboard-blue] scale-105' 
              : 'hover:scale-105'
            }
          `}
          style={{
            backgroundColor: selectedAsset === item.id ? item.color : 'transparent',
            borderColor: item.color,
            borderWidth: '2px',
            borderStyle: 'solid',
          }}
        >
          <div 
            className={selectedAsset === item.id ? 'text-white' : ''}
            style={{ color: selectedAsset === item.id ? 'white' : item.color }}
          >
            {item.icon}
          </div>
          <span 
            className={`text-xs mt-1 font-semibold ${selectedAsset === item.id ? 'text-white' : ''}`}
            style={{ color: selectedAsset === item.id ? 'white' : item.color }}
          >
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default AssetToolbar;
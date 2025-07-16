'use client';

import React from 'react';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onWorldView: () => void;
  currentZoom: number;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onWorldView,
  currentZoom
}) => {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-gray-900 bg-opacity-90 rounded-lg p-2">
      <button
        onClick={onZoomIn}
        className="
          w-10 h-10 
          bg-gray-800 hover:bg-gray-700 
          text-white font-bold 
          rounded-lg 
          transition-colors duration-200
          flex items-center justify-center
        "
        title="Zoom In"
      >
        +
      </button>
      
      <div className="text-xs text-gray-400 text-center">
        {(currentZoom * 100).toFixed(0)}%
      </div>
      
      <button
        onClick={onZoomOut}
        className="
          w-10 h-10 
          bg-gray-800 hover:bg-gray-700 
          text-white font-bold 
          rounded-lg 
          transition-colors duration-200
          flex items-center justify-center
        "
        title="Zoom Out"
      >
        −
      </button>
      
      <div className="border-t border-gray-700 mt-2 pt-2">
        <button
          onClick={onWorldView}
          className="
            w-10 h-10 
            bg-blue-600 hover:bg-blue-700 
            text-white 
            rounded-lg 
            transition-colors duration-200
            flex items-center justify-center
            text-xs
          "
          title="World View"
        >
          🗺️
        </button>
      </div>
    </div>
  );
};

export default ZoomControls;
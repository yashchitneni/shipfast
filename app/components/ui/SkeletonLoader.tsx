'use client';

import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  className = '', 
  count = 1 
}) => {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`animate-pulse ${className}`}
        >
          <div className="p-3 rounded-lg bg-white border border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded" />
                <div>
                  <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-6 w-20 bg-gray-200 rounded mb-1" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export const MarketItemSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
    <SkeletonLoader count={6} />
  </div>
);
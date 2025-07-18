'use client';

import React from 'react';

interface InventoryStatusProps {
  quantity: number;
  loading?: boolean;
}

export const InventoryStatus: React.FC<InventoryStatusProps> = ({ quantity, loading = false }) => {
  if (loading) {
    return <span className="text-xs text-gray-500">Loading...</span>;
  }

  return (
    <span className={`text-xs font-medium ${quantity > 0 ? 'text-green-600' : 'text-gray-400'}`}>
      You own: {quantity} units
    </span>
  );
};
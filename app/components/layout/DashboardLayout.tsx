'use client';

import React, { ReactNode } from 'react';
import CashDisplay from '../ui/CashDisplay';

interface DashboardLayoutProps {
  children: ReactNode;
  topBar?: ReactNode;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  bottomBar?: ReactNode;
  cash?: number;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  topBar,
  leftPanel,
  rightPanel,
  bottomBar,
  cash = 0,
}) => {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-4 bg-[--dashboard-blue] shadow-md">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">Flexport</h1>
          {topBar}
        </div>
        <CashDisplay amount={cash} className="bg-white/10 border-white/20" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        {leftPanel && (
          <div className="w-80 border-r border-gray-200 overflow-y-auto bg-white">
            {leftPanel}
          </div>
        )}

        {/* Game Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-50">
          {children}
        </div>

        {/* Right Panel */}
        {rightPanel && (
          <div className="w-80 border-l border-gray-200 overflow-y-auto bg-white">
            {rightPanel}
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      {bottomBar && (
        <div className="h-24 border-t border-gray-200 bg-white shadow-lg">
          {bottomBar}
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
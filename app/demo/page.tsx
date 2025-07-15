'use client';

import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  AssetToolbar,
  Button,
  Modal,
  NotificationContainer,
  useNotifications,
  Panel,
  SelectionPanel,
} from '../components/ui';

export default function DemoPage() {
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { notifications, addNotification, removeNotification } = useNotifications();
  const [cash, setCash] = useState(1000000);

  const handleAssetSelect = (assetType: string) => {
    const mockAssets = {
      ship: {
        id: 'ship-001',
        type: 'Cargo Ship',
        name: 'SS Flexport Express',
        properties: [
          { label: 'Capacity', value: '50,000 tons', type: 'text' },
          { label: 'Speed', value: '25 knots', type: 'text' },
          { label: 'Status', value: 'Active', type: 'status' },
          { label: 'Value', value: 2500000, type: 'currency' },
          { label: 'Fuel', value: 85, type: 'percentage' },
        ],
        actions: [
          {
            label: 'Send to Port',
            onClick: () => addNotification({
              type: 'info',
              title: 'Ship Dispatched',
              message: 'SS Flexport Express is heading to Shanghai',
            }),
            variant: 'primary',
          },
          {
            label: 'Sell Asset',
            onClick: () => setIsModalOpen(true),
            variant: 'danger',
          },
        ],
      },
      warehouse: {
        id: 'warehouse-001',
        type: 'Distribution Center',
        name: 'Los Angeles DC',
        properties: [
          { label: 'Capacity', value: '100,000 sqft', type: 'text' },
          { label: 'Occupancy', value: 72, type: 'percentage' },
          { label: 'Status', value: 'Operational', type: 'status' },
          { label: 'Value', value: 5000000, type: 'currency' },
        ],
        actions: [
          {
            label: 'Upgrade Facility',
            onClick: () => addNotification({
              type: 'success',
              title: 'Upgrade Started',
              message: 'Warehouse capacity will increase by 25%',
            }),
            variant: 'primary',
          },
        ],
      },
      plane: {
        id: 'plane-001',
        type: 'Cargo Plane',
        name: 'Flexport Air 747',
        properties: [
          { label: 'Capacity', value: '120 tons', type: 'text' },
          { label: 'Range', value: '7,500 miles', type: 'text' },
          { label: 'Status', value: 'Maintenance', type: 'status' },
          { label: 'Value', value: 8000000, type: 'currency' },
        ],
        actions: [
          {
            label: 'Schedule Flight',
            onClick: () => addNotification({
              type: 'warning',
              title: 'Cannot Schedule',
              message: 'Aircraft is currently in maintenance',
            }),
            variant: 'primary',
          },
        ],
      },
      port: {
        id: 'port-001',
        type: 'Shipping Port',
        name: 'Shanghai Port',
        properties: [
          { label: 'Berths', value: '12', type: 'text' },
          { label: 'Traffic', value: 'High', type: 'text' },
          { label: 'Status', value: 'Active', type: 'status' },
          { label: 'Daily Revenue', value: 150000, type: 'currency' },
        ],
        actions: [
          {
            label: 'View Schedules',
            onClick: () => setIsModalOpen(true),
            variant: 'primary',
          },
        ],
      },
    };

    setSelectedAsset(mockAssets[assetType as keyof typeof mockAssets]);
  };

  const leftPanel = (
    <div className="p-4">
      <Panel title="Asset Details" className="mb-4">
        <SelectionPanel selectedAsset={selectedAsset} />
      </Panel>
      
      <Panel title="Market Prices" collapsible defaultExpanded={false}>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Fuel</span>
            <span className="text-[--alert-red]">$3.25/gal ↑</span>
          </div>
          <div className="flex justify-between">
            <span>Container Rates</span>
            <span className="text-[--cargo-green]">$2,100 ↓</span>
          </div>
          <div className="flex justify-between">
            <span>Air Freight</span>
            <span className="text-[--alert-red]">$4.50/kg ↑</span>
          </div>
        </div>
      </Panel>
    </div>
  );

  const bottomBar = (
    <div className="flex items-center justify-center h-full p-4">
      <AssetToolbar onAssetSelect={handleAssetSelect} />
    </div>
  );

  return (
    <>
      <DashboardLayout
        cash={cash}
        leftPanel={leftPanel}
        bottomBar={bottomBar}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[--dashboard-blue] mb-4">
              Flexport UI Demo
            </h2>
            <p className="text-gray-600 mb-8">
              Select an asset from the toolbar below to see the UI components in action
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="success"
                onClick={() => {
                  setCash(cash + 100000);
                  addNotification({
                    type: 'success',
                    title: 'Cash Added',
                    message: '$100,000 has been added to your account',
                  });
                }}
              >
                Add Cash
              </Button>
              <Button
                variant="warning"
                onClick={() =>
                  addNotification({
                    type: 'warning',
                    title: 'Storm Warning',
                    message: 'Severe weather detected in Pacific shipping lanes',
                  })
                }
              >
                Test Warning
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  addNotification({
                    type: 'error',
                    title: 'Port Closed',
                    message: 'Singapore port temporarily closed due to incident',
                  })
                }
              >
                Test Error
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Asset Management"
      >
        <div className="space-y-4">
          <p>This modal can be used for complex forms and detailed information.</p>
          <div className="bg-gray-100 p-4 rounded">
            <h4 className="font-semibold mb-2">Example Content</h4>
            <p className="text-sm text-gray-600">
              Modals support any content and can be sized according to needs.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
      />
    </>
  );
}
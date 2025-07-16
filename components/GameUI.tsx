'use client';

import { useEmpireStore, usePlayer } from '../src/store/empireStore';
import dynamic from 'next/dynamic';

// Dynamically import panels to keep initial bundle small
const MarketTradingPanel = dynamic(() => import('../app/components/market/MarketTradingPanel'), { ssr: false });
const RouteManager = dynamic(() => import('../app/components/routes/RouteManager'), { ssr: false });
const FinancialDashboard = dynamic(() => import('../app/components/finance/FinancialDashboard'), { ssr: false });
const AICompanionPanel = dynamic(() => import('../app/components/ai/AICompanionPanel'), { ssr: false });
const AssetManager = dynamic(() => import('../app/components/assets/AssetManager').then(mod => ({ default: mod.AssetManager })), { ssr: false });

/**
 * TopBar component displays player stats and game controls.
 */
const TopBar = ({ player, isPaused, setPaused, gameSpeed }: any) => (
  <div className="absolute top-0 left-0 right-0 bg-gray-900/90 text-white p-4 pointer-events-auto">
    <div className="flex justify-between items-center max-w-7xl mx-auto">
      {/* Player Info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">💰</span>
          <span className="font-bold">${player?.cash.toLocaleString() || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-400">⭐</span>
          <span className="font-bold">{player?.experience || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-400">📊</span>
          <span className="font-bold">Level {player?.level || 1}</span>
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setPaused(!isPaused)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          {isPaused ? '▶️ Play' : '⏸️ Pause'}
        </button>
        <div className="text-sm">
          Speed: {gameSpeed}x
        </div>
      </div>
    </div>
  </div>
);

/**
 * BottomNav component contains the main navigation buttons for opening panels.
 */
const BottomNav = ({ activePanel, setActivePanel }: any) => (
  <div className="absolute bottom-0 left-0 right-0 bg-gray-900/90 p-4 pointer-events-auto">
    <div className="flex justify-center gap-4 max-w-6xl mx-auto">
      <PanelButton
        label="Routes"
        icon="🗺️"
        active={activePanel === 'routes'}
        onClick={() => setActivePanel(activePanel === 'routes' ? null : 'routes')}
      />
      <PanelButton
        label="Market"
        icon="📈"
        active={activePanel === 'market'}
        onClick={() => setActivePanel(activePanel === 'market' ? null : 'market')}
      />
      <PanelButton
        label="Finance"
        icon="💰"
        active={activePanel === 'finance'}
        onClick={() => setActivePanel(activePanel === 'finance' ? null : 'finance')}
      />
      <PanelButton
        label="Fleet"
        icon="🚢"
        active={activePanel === 'fleet'}
        onClick={() => setActivePanel(activePanel === 'fleet' ? null : 'fleet')}
      />
      <PanelButton
        label="Ports"
        icon="🏭"
        active={activePanel === 'ports'}
        onClick={() => setActivePanel(activePanel === 'ports' ? null : 'ports')}
      />
      <PanelButton
        label="AI Assistant"
        icon="🤖"
        active={activePanel === 'ai'}
        onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}
      />
      <PanelButton
        label="Assets"
        icon="🏗️"
        active={activePanel === 'assets'}
        onClick={() => setActivePanel(activePanel === 'assets' ? null : 'assets')}
      />
    </div>
  </div>
);

/**
 * GameUI is the top-level React component that renders the entire user interface
 * on top of the Phaser game canvas. It acts as the main orchestrator for all UI elements.
 */
export default function GameUI() {
  const player = usePlayer();
  const { activePanel, setActivePanel, isPaused, setPaused, gameSpeed } = useEmpireStore();

  return (
    <div className="absolute inset-0 pointer-events-none">
      <TopBar player={player} isPaused={isPaused} setPaused={setPaused} gameSpeed={gameSpeed} />
      <BottomNav activePanel={activePanel} setActivePanel={setActivePanel} />

      {/* Side Panels */}
      {activePanel && (
        <div className="absolute top-20 bottom-20 right-0 w-[500px] bg-white shadow-2xl pointer-events-auto overflow-hidden">
          <div className="h-full p-6">
            {renderPanel(activePanel)}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A reusable button component for the main bottom navigation bar.
 */
function PanelButton({ label, icon, active, onClick }: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-lg font-medium transition-all ${
        active
          ? 'bg-blue-600 text-white scale-105'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      <span className="text-2xl mr-2">{icon}</span>
      {label}
    </button>
  );
}

/**
 * Renders the currently active UI panel based on the `activePanel` state.
 */
function renderPanel(panel: string) {
  switch (panel) {
    case 'routes':
      return <RouteManager />;
    case 'market':
      return <MarketTradingPanel />;
    case 'finance':
      return <FinancialDashboard />;
    case 'fleet':
      return <FleetPanel />;
    case 'ports':
      return <PortsPanel />;
    case 'ai':
      return <AICompanionPanel />;
    case 'assets':
      return <AssetManager />;
    default:
      return null;
  }
}

// Placeholder panels
function FleetPanel() {
  const ships = useEmpireStore((state: any) => state.ships);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Fleet Management</h2>
      <p className="text-gray-600">Your shipping fleet</p>
      {ships.length === 0 ? (
        <p className="text-gray-500">No ships in your fleet</p>
      ) : (
        ships.map((ship: any) => (
          <div key={ship.id} className="bg-gray-100 p-3 rounded">
            <h3 className="font-bold text-gray-800">{ship.name}</h3>
            <div className="text-sm text-gray-600 mt-1">
              <p>Type: {ship.type}</p>
              <p>Status: {ship.status}</p>
              <p>Cargo: {ship.currentCargo}/{ship.capacity}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function PortsPanel() {
  const ports = useEmpireStore((state: any) => state.ports);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Port Management</h2>
      <p className="text-gray-600">Global ports and trade routes</p>
      {ports.length === 0 ? (
        <p className="text-gray-500">Loading port data...</p>
      ) : (
        ports.map((port: any) => (
          <div key={port.id} className="bg-gray-100 p-3 rounded">
            <h3 className="font-bold text-gray-800">{port.name}</h3>
            <p className="text-sm text-gray-600">Type: {port.type}</p>
          </div>
        ))
      )}
    </div>
  );
}
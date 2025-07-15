import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Game State Types
interface Ship {
  id: string;
  name: string;
  type: 'cargo' | 'tanker' | 'container';
  speed: number;
  capacity: number;
  currentCargo: number;
  position: { x: number; y: number };
  route?: string;
  status: 'idle' | 'sailing' | 'loading' | 'unloading';
}

interface Port {
  id: string;
  name: string;
  position: { x: number; y: number };
  type: 'export' | 'import' | 'both';
  goods: string[];
  demand: Record<string, number>;
  supply: Record<string, number>;
}

interface MarketPrice {
  good: string;
  price: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface Player {
  id: string;
  name: string;
  cash: number;
  reputation: number;
  level: number;
  experience: number;
}

interface GameState {
  // Player data
  player: Player | null;
  
  // Game entities
  ships: Ship[];
  ports: Port[];
  marketPrices: MarketPrice[];
  
  // Game state
  isPaused: boolean;
  gameSpeed: number;
  currentTime: Date;
  
  // UI state
  selectedShip: string | null;
  selectedPort: string | null;
  activePanel: 'market' | 'fleet' | 'ports' | 'ai' | null;
  
  // Actions
  setPlayer: (player: Player) => void;
  updateCash: (amount: number) => void;
  addShip: (ship: Ship) => void;
  updateShip: (id: string, updates: Partial<Ship>) => void;
  removeShip: (id: string) => void;
  updateMarketPrices: (prices: MarketPrice[]) => void;
  setSelectedShip: (id: string | null) => void;
  setSelectedPort: (id: string | null) => void;
  setActivePanel: (panel: 'market' | 'fleet' | 'ports' | 'ai' | null) => void;
  setPaused: (paused: boolean) => void;
  setGameSpeed: (speed: number) => void;
}

// Create the store
export const useGameStore = create<GameState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        player: null,
        ships: [],
        ports: [],
        marketPrices: [],
        isPaused: false,
        gameSpeed: 1,
        currentTime: new Date(),
        selectedShip: null,
        selectedPort: null,
        activePanel: null,
        
        // Actions
        setPlayer: (player) => set({ player }),
        
        updateCash: (amount) =>
          set((state) => ({
            player: state.player
              ? { ...state.player, cash: state.player.cash + amount }
              : null,
          })),
        
        addShip: (ship) =>
          set((state) => ({ ships: [...state.ships, ship] })),
        
        updateShip: (id, updates) =>
          set((state) => ({
            ships: state.ships.map((ship) =>
              ship.id === id ? { ...ship, ...updates } : ship
            ),
          })),
        
        removeShip: (id) =>
          set((state) => ({
            ships: state.ships.filter((ship) => ship.id !== id),
          })),
        
        updateMarketPrices: (prices) => set({ marketPrices: prices }),
        
        setSelectedShip: (id) => set({ selectedShip: id }),
        
        setSelectedPort: (id) => set({ selectedPort: id }),
        
        setActivePanel: (panel) => set({ activePanel: panel }),
        
        setPaused: (paused) => set({ isPaused: paused }),
        
        setGameSpeed: (speed) => set({ gameSpeed: speed }),
      }),
      {
        name: 'flexport-game-store',
      }
    )
  )
);

// Selectors for common queries
export const usePlayer = () => useGameStore((state) => state.player);
export const useShips = () => useGameStore((state) => state.ships);
export const usePorts = () => useGameStore((state) => state.ports);
export const useMarketPrices = () => useGameStore((state) => state.marketPrices);
export const useSelectedShip = () => {
  const selectedId = useGameStore((state) => state.selectedShip);
  const ships = useGameStore((state) => state.ships);
  return ships.find((ship) => ship.id === selectedId);
};
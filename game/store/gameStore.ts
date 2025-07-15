import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Ship {
  id: string;
  name: string;
  position: { x: number; y: number };
  destination: { x: number; y: number } | null;
  cargo: {
    type: string;
    amount: number;
    maxCapacity: number;
  }[];
  speed: number;
  fuel: number;
  maxFuel: number;
}

interface Port {
  id: string;
  name: string;
  position: { x: number; y: number };
  inventory: {
    type: string;
    amount: number;
    price: number;
  }[];
  demandSupply: {
    type: string;
    demand: number;
    supply: number;
  }[];
}

interface GameState {
  // Game state
  isPlaying: boolean;
  isPaused: boolean;
  gameSpeed: number;
  currentMoney: number;
  currentDay: number;
  currentTime: number;
  
  // Ships
  ships: Ship[];
  selectedShipId: string | null;
  
  // Ports
  ports: Port[];
  selectedPortId: string | null;
  
  // Camera
  cameraPosition: { x: number; y: number };
  cameraZoom: number;
  
  // UI
  showInventory: boolean;
  showMap: boolean;
  showTutorial: boolean;
  
  // Actions
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setGameSpeed: (speed: number) => void;
  
  // Ship actions
  addShip: (ship: Ship) => void;
  updateShip: (id: string, updates: Partial<Ship>) => void;
  selectShip: (id: string | null) => void;
  moveShip: (id: string, destination: { x: number; y: number }) => void;
  
  // Port actions
  selectPort: (id: string | null) => void;
  updatePortInventory: (portId: string, type: string, amount: number) => void;
  
  // Camera actions
  setCameraPosition: (position: { x: number; y: number }) => void;
  setCameraZoom: (zoom: number) => void;
  
  // UI actions
  toggleInventory: () => void;
  toggleMap: () => void;
  toggleTutorial: () => void;
  
  // Economic actions
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  
  // Time actions
  advanceTime: (delta: number) => void;
}

export const useGameStore = create<GameState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isPlaying: false,
        isPaused: false,
        gameSpeed: 1,
        currentMoney: 100000,
        currentDay: 1,
        currentTime: 12,
        
        ships: [],
        selectedShipId: null,
        
        ports: [],
        selectedPortId: null,
        
        cameraPosition: { x: 0, y: 0 },
        cameraZoom: 1,
        
        showInventory: false,
        showMap: true,
        showTutorial: true,
        
        // Actions
        startGame: () => set({ isPlaying: true, isPaused: false }),
        pauseGame: () => set({ isPaused: true }),
        resumeGame: () => set({ isPaused: false }),
        setGameSpeed: (speed) => set({ gameSpeed: speed }),
        
        // Ship actions
        addShip: (ship) => set((state) => ({ 
          ships: [...state.ships, ship] 
        })),
        
        updateShip: (id, updates) => set((state) => ({
          ships: state.ships.map(ship => 
            ship.id === id ? { ...ship, ...updates } : ship
          )
        })),
        
        selectShip: (id) => set({ selectedShipId: id }),
        
        moveShip: (id, destination) => set((state) => ({
          ships: state.ships.map(ship =>
            ship.id === id ? { ...ship, destination } : ship
          )
        })),
        
        // Port actions
        selectPort: (id) => set({ selectedPortId: id }),
        
        updatePortInventory: (portId, type, amount) => set((state) => ({
          ports: state.ports.map(port =>
            port.id === portId
              ? {
                  ...port,
                  inventory: port.inventory.map(item =>
                    item.type === type
                      ? { ...item, amount: item.amount + amount }
                      : item
                  )
                }
              : port
          )
        })),
        
        // Camera actions
        setCameraPosition: (position) => set({ cameraPosition: position }),
        setCameraZoom: (zoom) => set({ cameraZoom: zoom }),
        
        // UI actions
        toggleInventory: () => set((state) => ({ 
          showInventory: !state.showInventory 
        })),
        toggleMap: () => set((state) => ({ 
          showMap: !state.showMap 
        })),
        toggleTutorial: () => set((state) => ({ 
          showTutorial: !state.showTutorial 
        })),
        
        // Economic actions
        addMoney: (amount) => set((state) => ({ 
          currentMoney: state.currentMoney + amount 
        })),
        
        spendMoney: (amount) => {
          const state = get();
          if (state.currentMoney >= amount) {
            set({ currentMoney: state.currentMoney - amount });
            return true;
          }
          return false;
        },
        
        // Time actions
        advanceTime: (delta) => set((state) => {
          if (state.isPaused) return state;
          
          const newTime = state.currentTime + (delta * state.gameSpeed / 3600000); // Convert ms to hours
          const newDay = state.currentDay + Math.floor(newTime / 24);
          
          return {
            currentTime: newTime % 24,
            currentDay: newDay
          };
        })
      }),
      {
        name: 'flexport-game-storage',
        partialize: (state) => ({
          currentMoney: state.currentMoney,
          currentDay: state.currentDay,
          ships: state.ships,
          ports: state.ports
        })
      }
    )
  )
);
// Zustand store for asset management system
// Note: Zustand needs to be installed with: npm install zustand

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  AssetDefinition, 
  PlacedAsset, 
  AssetPreview, 
  AssetValidation,
  AssetStats,
  AssetType,
  AssetCategory,
  PortNode
} from '../lib/types/assets';

interface AssetStore {
  // Asset definitions (loaded from JSON)
  assetDefinitions: Map<string, AssetDefinition>;
  
  // Placed assets in the game world
  placedAssets: Map<string, PlacedAsset>;
  
  // Asset preview state
  assetPreview: AssetPreview | null;
  
  // Port nodes for snapping
  portNodes: Map<string, PortNode>;
  
  // Player state
  playerMoney: number;
  playerLevel: number;
  playerLicenses: string[];
  
  // Actions
  loadAssetDefinitions: (definitions: AssetDefinition[]) => void;
  setPortNodes: (ports: PortNode[]) => void;
  
  // Preview actions
  startAssetPreview: (definitionId: string, position: { x: number; y: number }) => void;
  updateAssetPreview: (position: { x: number; y: number }, rotation?: number) => void;
  cancelAssetPreview: () => void;
  
  // Placement actions
  placeAsset: () => { success: boolean; error?: string };
  removeAsset: (assetId: string) => boolean;
  
  // Asset management
  rotateAsset: (assetId: string, rotation: number) => void;
  assignAssetToRoute: (assetId: string, routeId: string) => void;
  unassignAsset: (assetId: string) => void;
  updateAssetStatus: (assetId: string, status: PlacedAsset['status']) => void;
  
  // Validation
  validateAssetPlacement: (definitionId: string, position: { x: number; y: number }) => AssetValidation;
  checkPortSnap: (position: { x: number; y: number }, snapDistance?: number) => PortNode | null;
  
  // Stats and queries
  getAssetStats: () => AssetStats;
  getAssetsByType: (type: AssetType) => PlacedAsset[];
  getAssetsByCategory: (category: AssetCategory) => PlacedAsset[];
  getAssetsAtPort: (portId: string) => PlacedAsset[];
  
  // Player state management
  setPlayerMoney: (amount: number) => void;
  deductMoney: (amount: number) => boolean;
  setPlayerLevel: (level: number) => void;
  addLicense: (license: string) => void;
}

const SNAP_DISTANCE = 50; // pixels

export const useAssetStore = create<AssetStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      assetDefinitions: new Map(),
      placedAssets: new Map(),
      assetPreview: null,
      portNodes: new Map(),
      playerMoney: 50000,
      playerLevel: 1,
      playerLicenses: [],
      
      // Load asset definitions from JSON
      loadAssetDefinitions: (definitions) => {
        const defMap = new Map<string, AssetDefinition>();
        definitions.forEach(def => defMap.set(def.id, def));
        set({ assetDefinitions: defMap });
      },
      
      // Set port nodes
      setPortNodes: (ports) => {
        const portMap = new Map<string, PortNode>();
        ports.forEach(port => portMap.set(port.id, port));
        set({ portNodes: portMap });
      },
      
      // Preview management
      startAssetPreview: (definitionId, position) => {
        const state = get();
        const definition = state.assetDefinitions.get(definitionId);
        if (!definition) return;
        
        const validation = state.validateAssetPlacement(definitionId, position);
        const snapPort = state.checkPortSnap(position);
        
        set({
          assetPreview: {
            definitionId,
            position,
            rotation: 0,
            isValid: validation.canAfford && validation.meetsRequirements && validation.hasValidPosition,
            snapToPort: snapPort?.id,
            validationErrors: validation.errors
          }
        });
      },
      
      updateAssetPreview: (position, rotation) => {
        const state = get();
        if (!state.assetPreview) return;
        
        const validation = state.validateAssetPlacement(state.assetPreview.definitionId, position);
        const snapPort = state.checkPortSnap(position);
        
        set({
          assetPreview: {
            ...state.assetPreview,
            position: snapPort ? snapPort.position : position,
            rotation: rotation ?? state.assetPreview.rotation,
            isValid: validation.canAfford && validation.meetsRequirements && validation.hasValidPosition,
            snapToPort: snapPort?.id,
            validationErrors: validation.errors
          }
        });
      },
      
      cancelAssetPreview: () => set({ assetPreview: null }),
      
      // Place asset
      placeAsset: () => {
        const state = get();
        const preview = state.assetPreview;
        if (!preview || !preview.isValid) {
          return { success: false, error: 'Invalid placement' };
        }
        
        const definition = state.assetDefinitions.get(preview.definitionId);
        if (!definition) {
          return { success: false, error: 'Asset definition not found' };
        }
        
        // Deduct money
        if (!state.deductMoney(definition.cost)) {
          return { success: false, error: 'Insufficient funds' };
        }
        
        // Create placed asset
        const assetId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const placedAsset: PlacedAsset = {
          id: assetId,
          definitionId: preview.definitionId,
          ownerId: 'player', // In multiplayer, this would be the actual player ID
          position: preview.position,
          rotation: preview.rotation,
          portId: preview.snapToPort,
          status: 'active',
          health: 100,
          purchasedAt: Date.now()
        };
        
        // Update state
        const newAssets = new Map(state.placedAssets);
        newAssets.set(assetId, placedAsset);
        
        set({
          placedAssets: newAssets,
          assetPreview: null
        });
        
        return { success: true };
      },
      
      // Remove asset
      removeAsset: (assetId) => {
        const state = get();
        const asset = state.placedAssets.get(assetId);
        if (!asset) return false;
        
        const definition = state.assetDefinitions.get(asset.definitionId);
        if (!definition) return false;
        
        // Refund partial value (50%)
        const refund = Math.floor(definition.cost * 0.5);
        state.setPlayerMoney(state.playerMoney + refund);
        
        // Remove asset
        const newAssets = new Map(state.placedAssets);
        newAssets.delete(assetId);
        set({ placedAssets: newAssets });
        
        return true;
      },
      
      // Asset management
      rotateAsset: (assetId, rotation) => {
        const state = get();
        const asset = state.placedAssets.get(assetId);
        if (!asset) return;
        
        const newAssets = new Map(state.placedAssets);
        newAssets.set(assetId, { ...asset, rotation });
        set({ placedAssets: newAssets });
      },
      
      assignAssetToRoute: (assetId, routeId) => {
        const state = get();
        const asset = state.placedAssets.get(assetId);
        if (!asset) return;
        
        const newAssets = new Map(state.placedAssets);
        newAssets.set(assetId, { ...asset, routeId, status: 'transit' });
        set({ placedAssets: newAssets });
      },
      
      unassignAsset: (assetId) => {
        const state = get();
        const asset = state.placedAssets.get(assetId);
        if (!asset) return;
        
        const newAssets = new Map(state.placedAssets);
        newAssets.set(assetId, { ...asset, routeId: undefined, status: 'active' });
        set({ placedAssets: newAssets });
      },
      
      updateAssetStatus: (assetId, status) => {
        const state = get();
        const asset = state.placedAssets.get(assetId);
        if (!asset) return;
        
        const newAssets = new Map(state.placedAssets);
        newAssets.set(assetId, { ...asset, status });
        set({ placedAssets: newAssets });
      },
      
      // Validation
      validateAssetPlacement: (definitionId, position) => {
        const state = get();
        const definition = state.assetDefinitions.get(definitionId);
        
        if (!definition) {
          return {
            canAfford: false,
            meetsRequirements: false,
            hasValidPosition: false,
            noConflicts: false,
            errors: ['Asset definition not found'],
            warnings: []
          };
        }
        
        const errors: string[] = [];
        const warnings: string[] = [];
        
        // Check money
        const canAfford = state.playerMoney >= definition.cost;
        if (!canAfford) {
          errors.push(`Insufficient funds. Need $${definition.cost.toLocaleString()}`);
        }
        
        // Check requirements
        let meetsRequirements = true;
        if (definition.requirements) {
          if (definition.requirements.minLevel && state.playerLevel < definition.requirements.minLevel) {
            meetsRequirements = false;
            errors.push(`Requires level ${definition.requirements.minLevel}`);
          }
          
          if (definition.requirements.licenses) {
            const missingLicenses = definition.requirements.licenses.filter(
              lic => !state.playerLicenses.includes(lic)
            );
            if (missingLicenses.length > 0) {
              meetsRequirements = false;
              errors.push(`Missing licenses: ${missingLicenses.join(', ')}`);
            }
          }
        }
        
        // Check position validity (basic bounds check)
        const hasValidPosition = position.x >= 0 && position.y >= 0;
        if (!hasValidPosition) {
          errors.push('Invalid position');
        }
        
        // Check for conflicts (simplified - in real game would check overlaps)
        const noConflicts = true;
        
        return {
          canAfford,
          meetsRequirements,
          hasValidPosition,
          noConflicts,
          errors,
          warnings
        };
      },
      
      // Check if position is near a port
      checkPortSnap: (position, snapDistance = SNAP_DISTANCE) => {
        const state = get();
        
        for (const port of state.portNodes.values()) {
          const distance = Math.sqrt(
            Math.pow(position.x - port.position.x, 2) + 
            Math.pow(position.y - port.position.y, 2)
          );
          
          if (distance <= snapDistance) {
            return port;
          }
        }
        
        return null;
      },
      
      // Stats
      getAssetStats: () => {
        const state = get();
        const assets = Array.from(state.placedAssets.values());
        
        const stats: AssetStats = {
          totalAssets: assets.length,
          assetsByType: {} as Record<AssetType, number>,
          assetsByCategory: {} as Record<AssetCategory, number>,
          totalValue: 0,
          totalMaintenance: 0,
          utilizationRate: 0
        };
        
        // Count assets and calculate totals
        assets.forEach(asset => {
          const definition = state.assetDefinitions.get(asset.definitionId);
          if (!definition) return;
          
          // Count by type
          stats.assetsByType[definition.type] = (stats.assetsByType[definition.type] || 0) + 1;
          
          // Count by category
          stats.assetsByCategory[definition.category] = (stats.assetsByCategory[definition.category] || 0) + 1;
          
          // Add to totals
          stats.totalValue += definition.cost;
          stats.totalMaintenance += definition.maintenanceCost;
        });
        
        // Calculate utilization (assets in transit vs total transport assets)
        const transportAssets = assets.filter(a => {
          const def = state.assetDefinitions.get(a.definitionId);
          return def?.category === 'transport';
        });
        
        const activeTransport = transportAssets.filter(a => a.status === 'transit').length;
        stats.utilizationRate = transportAssets.length > 0 
          ? activeTransport / transportAssets.length 
          : 0;
        
        return stats;
      },
      
      // Queries
      getAssetsByType: (type) => {
        const state = get();
        return Array.from(state.placedAssets.values()).filter(asset => {
          const definition = state.assetDefinitions.get(asset.definitionId);
          return definition?.type === type;
        });
      },
      
      getAssetsByCategory: (category) => {
        const state = get();
        return Array.from(state.placedAssets.values()).filter(asset => {
          const definition = state.assetDefinitions.get(asset.definitionId);
          return definition?.category === category;
        });
      },
      
      getAssetsAtPort: (portId) => {
        const state = get();
        return Array.from(state.placedAssets.values()).filter(
          asset => asset.portId === portId
        );
      },
      
      // Player state
      setPlayerMoney: (amount) => set({ playerMoney: amount }),
      
      deductMoney: (amount) => {
        const state = get();
        if (state.playerMoney < amount) return false;
        set({ playerMoney: state.playerMoney - amount });
        return true;
      },
      
      setPlayerLevel: (level) => set({ playerLevel: level }),
      
      addLicense: (license) => {
        const state = get();
        if (!state.playerLicenses.includes(license)) {
          set({ playerLicenses: [...state.playerLicenses, license] });
        }
      }
    }),
    {
      name: 'asset-store'
    }
  )
);
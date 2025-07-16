// Service for calculating and applying asset area effects
import { AssetDefinition, PlacedAsset, Position } from '../lib/types/assets';

export interface AreaEffectResult {
  targetId: string;
  targetType: 'port' | 'asset';
  effectType: string;
  effectValue: number;
  distance: number;
}

export class AssetEffectsService {
  // Calculate distance between two positions
  private static calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Get all targets within radius of a position
  private static getTargetsInRadius(
    position: Position,
    radius: number,
    ports: Array<{ id: string; position: Position }>,
    assets: PlacedAsset[]
  ): Array<{ id: string; type: 'port' | 'asset'; distance: number; position: Position }> {
    const targets: Array<{ id: string; type: 'port' | 'asset'; distance: number; position: Position }> = [];

    // Check ports
    for (const port of ports) {
      const distance = this.calculateDistance(position, port.position);
      if (distance <= radius) {
        targets.push({
          id: port.id,
          type: 'port',
          distance,
          position: port.position
        });
      }
    }

    // Check other assets
    for (const asset of assets) {
      const distance = this.calculateDistance(position, asset.position);
      if (distance <= radius && distance > 0) { // Exclude self
        targets.push({
          id: asset.id,
          type: 'asset',
          distance,
          position: asset.position
        });
      }
    }

    return targets;
  }

  // Calculate all area effects from placed assets
  public static calculateAreaEffects(
    placedAssets: PlacedAsset[],
    assetDefinitions: Map<string, AssetDefinition>,
    ports: Array<{ id: string; position: Position }>
  ): Map<string, AreaEffectResult[]> {
    const effectsMap = new Map<string, AreaEffectResult[]>();

    for (const asset of placedAssets) {
      const definition = assetDefinitions.get(asset.definitionId);
      if (!definition?.areaEffect) continue;

      const { radius, type, value } = definition.areaEffect;
      const targets = this.getTargetsInRadius(asset.position, radius, ports, placedAssets);

      const effects: AreaEffectResult[] = [];
      for (const target of targets) {
        // Only apply port efficiency boost to ports
        if (type === 'port_efficiency' && target.type !== 'port') continue;

        effects.push({
          targetId: target.id,
          targetType: target.type,
          effectType: type,
          effectValue: value,
          distance: target.distance
        });
      }

      if (effects.length > 0) {
        effectsMap.set(asset.id, effects);
      }
    }

    return effectsMap;
  }

  // Calculate cumulative effects on a specific target
  public static getCumulativeEffects(
    targetId: string,
    targetType: 'port' | 'asset',
    effectsMap: Map<string, AreaEffectResult[]>
  ): Map<string, number> {
    const cumulativeEffects = new Map<string, number>();

    for (const effects of effectsMap.values()) {
      for (const effect of effects) {
        if (effect.targetId === targetId && effect.targetType === targetType) {
          const currentValue = cumulativeEffects.get(effect.effectType) || 0;
          cumulativeEffects.set(effect.effectType, currentValue + effect.effectValue);
        }
      }
    }

    return cumulativeEffects;
  }

  // Apply efficiency boost to port operations
  public static applyPortEfficiencyBoost(
    baseEfficiency: number,
    boostPercentage: number
  ): number {
    return baseEfficiency * (1 + boostPercentage);
  }

  // Calculate storage network bonus (multiple warehouses working together)
  public static calculateStorageNetworkBonus(
    warehouses: PlacedAsset[],
    assetDefinitions: Map<string, AssetDefinition>
  ): number {
    let totalCapacity = 0;
    let warehouseCount = 0;

    for (const warehouse of warehouses) {
      const definition = assetDefinitions.get(warehouse.definitionId);
      if (definition?.type === 'warehouse') {
        totalCapacity += definition.storageCapacity || 0;
        warehouseCount++;
      }
    }

    // Network bonus: 2% per additional warehouse, max 20%
    const networkBonus = Math.min(0.20, (warehouseCount - 1) * 0.02);
    
    // Scale bonus: additional 1% per 10,000 capacity
    const scaleBonus = Math.min(0.10, Math.floor(totalCapacity / 10000) * 0.01);

    return networkBonus + scaleBonus;
  }

  // Check if a warehouse can store specific cargo type
  public static canStoreCargoType(
    warehouseDefinition: AssetDefinition,
    cargoType: string
  ): boolean {
    // Special handling for specialized warehouses
    if (warehouseDefinition.id === 'warehouse-specialized') {
      // Can only store perishables and sensitive cargo
      return ['perishable', 'sensitive', 'temperature-controlled'].includes(cargoType);
    }

    // Regular warehouses can store most cargo types
    return !['hazardous', 'oversized'].includes(cargoType);
  }

  // Calculate warehouse utilization penalty (efficiency drops when near capacity)
  public static calculateUtilizationPenalty(utilizationRate: number): number {
    if (utilizationRate < 0.8) return 0; // No penalty under 80%
    if (utilizationRate < 0.9) return 0.05; // 5% penalty at 80-90%
    if (utilizationRate < 0.95) return 0.10; // 10% penalty at 90-95%
    return 0.20; // 20% penalty above 95%
  }
}

export default AssetEffectsService;
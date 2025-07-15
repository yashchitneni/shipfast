import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '../../lib/supabase/client';
import { assetService } from '../../lib/supabase/assets';
import { AssetDefinition, PlacedAsset } from '../../app/lib/types/assets';

describe('Asset System Integration', () => {
  const supabase = createClient();
  const testPlayerId = 'test-player-' + Date.now();
  
  beforeAll(async () => {
    // Create test player
    const { error } = await supabase
      .from('player')
      .insert({
        user_id: testPlayerId,
        username: 'Test Player',
        cash: 100000,
        net_worth: 100000
      });
      
    if (error) {
      console.error('Failed to create test player:', error);
    }
  });
  
  afterAll(async () => {
    // Clean up test data
    await supabase
      .from('asset')
      .delete()
      .eq('owner_id', testPlayerId);
      
    await supabase
      .from('player')
      .delete()
      .eq('user_id', testPlayerId);
  });
  
  test('should create an asset in the database', async () => {
    const testAsset: PlacedAsset = {
      id: 'test-asset-1',
      definitionId: 'ship-container-small',
      ownerId: testPlayerId,
      position: { x: 100, y: 200 },
      rotation: 0,
      status: 'active',
      health: 100,
      purchasedAt: Date.now()
    };
    
    const testDefinition: AssetDefinition = {
      id: 'ship-container-small',
      name: 'Small Container Ship',
      type: 'ship',
      subType: 'container-vessel',
      category: 'transport',
      cost: 50000,
      maintenanceCost: 5000,
      efficiency: 0.75,
      description: 'A small container ship'
    };
    
    const { data, error } = await assetService.createAsset(
      testAsset,
      testDefinition,
      testPlayerId
    );
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.asset_id).toBe('test-asset-1');
    expect(data?.owner_id).toBe(testPlayerId);
  });
  
  test('should deduct player cash', async () => {
    const amount = 10000;
    
    // Get initial cash
    const { data: initialPlayer } = await supabase
      .from('player')
      .select('cash')
      .eq('user_id', testPlayerId)
      .single();
      
    const initialCash = initialPlayer?.cash || 0;
    
    // Deduct cash
    const { success } = await assetService.deductPlayerCash(testPlayerId, amount);
    expect(success).toBe(true);
    
    // Verify cash was deducted
    const { data: updatedPlayer } = await supabase
      .from('player')
      .select('cash')
      .eq('user_id', testPlayerId)
      .single();
      
    expect(updatedPlayer?.cash).toBe(initialCash - amount);
  });
  
  test('should load player assets', async () => {
    const { data, error } = await assetService.getPlayerAssets(testPlayerId);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });
  
  test('should update asset status', async () => {
    const assetId = 'test-asset-1';
    
    const { data, error } = await assetService.updateAsset(assetId, {
      status: 'maintenance'
    });
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    // Verify the update
    const stats = data?.stats as any;
    expect(stats.status).toBe('maintenance');
  });
  
  test('should delete an asset', async () => {
    const assetId = 'test-asset-1';
    
    const { error } = await assetService.deleteAsset(assetId);
    expect(error).toBeNull();
    
    // Verify deletion
    const { data } = await supabase
      .from('asset')
      .select()
      .eq('asset_id', assetId)
      .single();
      
    expect(data).toBeNull();
  });
}); 
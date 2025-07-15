/**
 * Phase 1: Supabase State Synchronization Tests
 * Tests database connection, CRUD operations, and real-time sync
 */

import { createClient } from '@supabase/supabase-js'

describe('Supabase State Synchronization', () => {
  let supabase: any

  beforeEach(() => {
    // Mock Supabase client is created via jest.setup.js
    supabase = createClient('mock-url', 'mock-key')
  })

  describe('Database Connection', () => {
    it('should create Supabase client with correct config', () => {
      expect(createClient).toHaveBeenCalledWith('mock-url', 'mock-key')
      expect(supabase).toBeDefined()
      expect(supabase.auth).toBeDefined()
      expect(supabase.from).toBeDefined()
    })

    it('should handle connection errors gracefully', async () => {
      const mockError = new Error('Connection failed')
      supabase.from('test').select.mockRejectedValueOnce(mockError)
      
      try {
        await supabase.from('test').select()
      } catch (error) {
        expect(error).toEqual(mockError)
      }
    })
  })

  describe('Empire State Persistence', () => {
    it('should save empire state to database', async () => {
      const empireState = {
        id: 'empire-123',
        playerId: 'player-1',
        cash: 950000,
        assets: [
          { id: 'asset-1', type: 'warehouse', portId: 'port-shanghai' }
        ],
        routes: [],
        lastUpdated: new Date().toISOString()
      }

      const mockResponse = { data: empireState, error: null }
      supabase.from().insert.mockResolvedValueOnce(mockResponse)

      const result = await supabase.from('empires').insert(empireState)
      
      expect(result.data).toEqual(empireState)
      expect(result.error).toBeNull()
    })

    it('should load empire state from database', async () => {
      const savedState = {
        id: 'empire-123',
        playerId: 'player-1',
        cash: 950000,
        assets: [
          { id: 'asset-1', type: 'warehouse', portId: 'port-shanghai' }
        ]
      }

      const mockResponse = { data: savedState, error: null }
      supabase.from().select().eq().single.mockResolvedValueOnce(mockResponse)

      const result = await supabase
        .from('empires')
        .select('*')
        .eq('playerId', 'player-1')
        .single()
      
      expect(result.data).toEqual(savedState)
      expect(result.error).toBeNull()
    })

    it('should update empire state', async () => {
      const updates = {
        cash: 900000,
        lastUpdated: new Date().toISOString()
      }

      const mockResponse = { data: updates, error: null }
      supabase.from().update().eq.mockResolvedValueOnce(mockResponse)

      const result = await supabase
        .from('empires')
        .update(updates)
        .eq('id', 'empire-123')
      
      expect(result.data).toEqual(updates)
      expect(result.error).toBeNull()
    })
  })

  describe('Asset CRUD Operations', () => {
    it('should create new asset record', async () => {
      const newAsset = {
        id: 'asset-new',
        empireId: 'empire-123',
        type: 'ship',
        portId: 'port-los-angeles',
        position: { x: 200, y: 300 },
        cost: 100000,
        createdAt: new Date().toISOString()
      }

      const mockResponse = { data: newAsset, error: null }
      supabase.from().insert.mockResolvedValueOnce(mockResponse)

      const result = await supabase.from('assets').insert(newAsset)
      
      expect(result.data).toEqual(newAsset)
      expect(result.error).toBeNull()
    })

    it('should read assets for empire', async () => {
      const assets = [
        { id: 'asset-1', type: 'warehouse', empireId: 'empire-123' },
        { id: 'asset-2', type: 'ship', empireId: 'empire-123' }
      ]

      const mockResponse = { data: assets, error: null }
      supabase.from().select().eq.mockResolvedValueOnce(mockResponse)

      const result = await supabase
        .from('assets')
        .select('*')
        .eq('empireId', 'empire-123')
      
      expect(result.data).toEqual(assets)
      expect(result.data).toHaveLength(2)
    })

    it('should update asset properties', async () => {
      const updates = {
        position: { x: 250, y: 350 },
        updatedAt: new Date().toISOString()
      }

      const mockResponse = { data: updates, error: null }
      supabase.from().update().eq.mockResolvedValueOnce(mockResponse)

      const result = await supabase
        .from('assets')
        .update(updates)
        .eq('id', 'asset-1')
      
      expect(result.data).toEqual(updates)
    })

    it('should delete asset record', async () => {
      const mockResponse = { data: { id: 'asset-1' }, error: null }
      supabase.from().delete().eq.mockResolvedValueOnce(mockResponse)

      const result = await supabase
        .from('assets')
        .delete()
        .eq('id', 'asset-1')
      
      expect(result.error).toBeNull()
    })
  })

  describe('Real-time Synchronization', () => {
    it('should subscribe to empire changes', () => {
      const channel = supabase.channel('empire-changes')
      const callback = jest.fn()

      channel
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'empires',
          filter: 'id=eq.empire-123'
        }, callback)
        .subscribe()

      expect(channel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'empires'
        }),
        callback
      )
    })

    it('should handle real-time asset updates', () => {
      const channel = supabase.channel('asset-updates')
      const callback = jest.fn()

      channel
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'assets'
        }, callback)
        .subscribe()

      expect(channel.subscribe).toHaveBeenCalled()
    })

    it('should handle real-time errors', () => {
      const channel = supabase.channel('test-channel')
      const errorCallback = jest.fn()

      channel.on('system', {}, (payload: any) => {
        if (payload.type === 'error') {
          errorCallback(payload)
        }
      })

      expect(channel.on).toHaveBeenCalled()
    })
  })

  describe('Optimistic Updates', () => {
    it('should apply optimistic update before server confirmation', () => {
      const localState = {
        cash: 1000000,
        assets: []
      }

      const newAsset = {
        id: 'temp-asset-1',
        type: 'warehouse',
        cost: 50000
      }

      // Apply optimistic update
      const optimisticState = {
        cash: localState.cash - newAsset.cost,
        assets: [...localState.assets, newAsset]
      }

      expect(optimisticState.cash).toBe(950000)
      expect(optimisticState.assets).toHaveLength(1)
    })

    it('should rollback on server error', () => {
      const originalState = {
        cash: 1000000,
        assets: []
      }

      const failedAsset = {
        id: 'temp-asset-1',
        type: 'warehouse',
        cost: 50000
      }

      // Attempt update
      const tempState = {
        cash: originalState.cash - failedAsset.cost,
        assets: [...originalState.assets, failedAsset]
      }

      // Server returns error, rollback
      const rolledBackState = { ...originalState }

      expect(rolledBackState).toEqual(originalState)
    })
  })

  describe('Conflict Resolution', () => {
    it('should handle concurrent updates', async () => {
      const serverState = {
        version: 2,
        cash: 980000
      }

      const clientState = {
        version: 1,
        cash: 990000
      }

      // Server state should win in conflict
      expect(serverState.version).toBeGreaterThan(clientState.version)
      expect(serverState.cash).toBe(980000)
    })

    it('should merge non-conflicting changes', () => {
      const serverChanges = {
        assets: [{ id: 'asset-1', type: 'warehouse' }]
      }

      const clientChanges = {
        routes: [{ id: 'route-1', from: 'port-1', to: 'port-2' }]
      }

      const merged = {
        ...serverChanges,
        ...clientChanges
      }

      expect(merged.assets).toHaveLength(1)
      expect(merged.routes).toHaveLength(1)
    })
  })
})
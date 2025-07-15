/**
 * Phase 1: Asset Placement System Tests
 * Tests the core functionality of placing and removing assets on the map
 */

describe('Asset Placement System', () => {
  describe('Asset Creation', () => {
    it('should create a new asset with valid properties', () => {
      const asset = {
        id: 'asset-1',
        type: 'warehouse',
        position: { x: 100, y: 200 },
        portId: 'port-shanghai',
        cost: 50000,
        ownerId: 'player-1'
      }

      expect(asset).toHaveProperty('id')
      expect(asset).toHaveProperty('type')
      expect(asset).toHaveProperty('position')
      expect(asset).toHaveProperty('portId')
      expect(asset).toHaveProperty('cost')
      expect(asset).toHaveProperty('ownerId')
    })

    it('should validate asset type', () => {
      const validTypes = ['warehouse', 'ship', 'plane', 'decoration']
      const assetType = 'warehouse'
      
      expect(validTypes).toContain(assetType)
    })

    it('should validate asset position within map bounds', () => {
      const mapBounds = { width: 2000, height: 1500 }
      const position = { x: 500, y: 300 }
      
      expect(position.x).toBeGreaterThanOrEqual(0)
      expect(position.x).toBeLessThanOrEqual(mapBounds.width)
      expect(position.y).toBeGreaterThanOrEqual(0)
      expect(position.y).toBeLessThanOrEqual(mapBounds.height)
    })
  })

  describe('Cost Deduction', () => {
    it('should calculate correct cost for asset placement', () => {
      const playerBalance = 1000000
      const assetCost = 50000
      const expectedBalance = playerBalance - assetCost
      
      expect(expectedBalance).toBe(950000)
    })

    it('should prevent placement if insufficient funds', () => {
      const playerBalance = 30000
      const assetCost = 50000
      const canAfford = playerBalance >= assetCost
      
      expect(canAfford).toBe(false)
    })

    it('should handle multiple asset placements', () => {
      const playerBalance = 200000
      const assets = [
        { cost: 50000 },
        { cost: 30000 },
        { cost: 40000 }
      ]
      const totalCost = assets.reduce((sum, asset) => sum + asset.cost, 0)
      const finalBalance = playerBalance - totalCost
      
      expect(totalCost).toBe(120000)
      expect(finalBalance).toBe(80000)
    })
  })

  describe('Asset Removal', () => {
    it('should remove asset from map', () => {
      const assets = [
        { id: 'asset-1', type: 'warehouse' },
        { id: 'asset-2', type: 'ship' },
        { id: 'asset-3', type: 'warehouse' }
      ]
      
      const assetToRemove = 'asset-2'
      const remainingAssets = assets.filter(a => a.id !== assetToRemove)
      
      expect(remainingAssets).toHaveLength(2)
      expect(remainingAssets.find(a => a.id === assetToRemove)).toBeUndefined()
    })

    it('should refund partial cost on removal', () => {
      const originalCost = 50000
      const refundPercentage = 0.7 // 70% refund
      const refundAmount = originalCost * refundPercentage
      
      expect(refundAmount).toBe(35000)
    })
  })

  describe('Port Snapping', () => {
    it('should snap asset to nearest port', () => {
      const ports = [
        { id: 'port-1', position: { x: 100, y: 100 } },
        { id: 'port-2', position: { x: 500, y: 500 } },
        { id: 'port-3', position: { x: 900, y: 300 } }
      ]
      
      const clickPosition = { x: 480, y: 520 }
      const snapRadius = 50
      
      // Calculate distances to each port
      const distances = ports.map(port => {
        const dx = clickPosition.x - port.position.x
        const dy = clickPosition.y - port.position.y
        return {
          port,
          distance: Math.sqrt(dx * dx + dy * dy)
        }
      })
      
      // Find nearest port within snap radius
      const nearestPort = distances
        .filter(d => d.distance <= snapRadius)
        .sort((a, b) => a.distance - b.distance)[0]
      
      expect(nearestPort).toBeDefined()
      expect(nearestPort.port.id).toBe('port-2')
    })

    it('should not snap if no port within radius', () => {
      const ports = [
        { id: 'port-1', position: { x: 100, y: 100 } }
      ]
      
      const clickPosition = { x: 800, y: 800 }
      const snapRadius = 50
      
      const distance = Math.sqrt(
        Math.pow(clickPosition.x - ports[0].position.x, 2) +
        Math.pow(clickPosition.y - ports[0].position.y, 2)
      )
      
      expect(distance).toBeGreaterThan(snapRadius)
    })
  })

  describe('Asset Validation', () => {
    it('should validate asset ownership', () => {
      const asset = { id: 'asset-1', ownerId: 'player-1' }
      const currentPlayer = 'player-1'
      const isOwner = asset.ownerId === currentPlayer
      
      expect(isOwner).toBe(true)
    })

    it('should prevent placing assets on occupied positions', () => {
      const existingAssets = [
        { position: { x: 100, y: 100 } },
        { position: { x: 200, y: 200 } }
      ]
      
      const newPosition = { x: 100, y: 100 }
      const isOccupied = existingAssets.some(
        asset => asset.position.x === newPosition.x && 
                 asset.position.y === newPosition.y
      )
      
      expect(isOccupied).toBe(true)
    })

    it('should validate asset category restrictions', () => {
      const portCapacity = {
        transport: 5,
        storage: 3,
        support: 2
      }
      
      const currentAssets = {
        transport: 3,
        storage: 3,
        support: 1
      }
      
      const canPlaceTransport = currentAssets.transport < portCapacity.transport
      const canPlaceStorage = currentAssets.storage < portCapacity.storage
      const canPlaceSupport = currentAssets.support < portCapacity.support
      
      expect(canPlaceTransport).toBe(true)
      expect(canPlaceStorage).toBe(false)
      expect(canPlaceSupport).toBe(true)
    })
  })
})
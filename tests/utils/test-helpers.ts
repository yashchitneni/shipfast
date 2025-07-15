/**
 * Test Helper Utilities
 * Common functions and mocks for testing
 */

import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock game state
export const createMockGameState = (overrides = {}) => ({
  empire: {
    id: 'test-empire',
    playerId: 'test-player',
    name: 'Test Empire',
    cash: 1000000,
    reputation: 50,
    level: 1,
    ...overrides
  },
  assets: [],
  routes: [],
  timestamp: new Date().toISOString()
})

// Mock asset factory
export const createMockAsset = (type: string, overrides = {}) => ({
  id: `asset-${Math.random().toString(36).substr(2, 9)}`,
  type,
  portId: 'port-test',
  position: { x: 100, y: 100 },
  cost: 50000,
  ownerId: 'test-player',
  createdAt: new Date().toISOString(),
  ...overrides
})

// Mock port factory
export const createMockPort = (overrides = {}) => ({
  id: `port-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Port',
  position: { x: 500, y: 500 },
  capacity: {
    transport: 10,
    storage: 5,
    support: 3
  },
  connections: [],
  ...overrides
})

// Mock route factory
export const createMockRoute = (from: string, to: string, overrides = {}) => ({
  id: `route-${Math.random().toString(36).substr(2, 9)}`,
  from,
  to,
  distance: 1000,
  profitPerTrip: 10000,
  riskLevel: 0.1,
  ...overrides
})

// Custom render with providers
export const renderWithProviders = (
  ui: ReactElement,
  options?: RenderOptions
) => {
  // Add any context providers here
  return render(ui, options)
}

// Mock Phaser scene
export class MockScene {
  cameras = {
    main: {
      scrollX: 0,
      scrollY: 0,
      zoom: 1,
      setScroll: jest.fn(),
      setZoom: jest.fn()
    }
  }
  
  add = {
    sprite: jest.fn(),
    graphics: jest.fn(),
    text: jest.fn()
  }
  
  input = {
    on: jest.fn(),
    off: jest.fn()
  }
  
  events = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  }
}

// Mock Zustand store
export const createMockStore = (initialState = {}) => {
  let state = initialState
  
  return {
    getState: () => state,
    setState: (newState: any) => {
      state = typeof newState === 'function' ? newState(state) : { ...state, ...newState }
    },
    subscribe: jest.fn(),
    destroy: jest.fn()
  }
}

// Performance measurement helpers
export const measurePerformance = async (fn: () => void | Promise<void>) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

// Wait for condition helper
export const waitFor = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now()
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition')
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
}

// Mock Supabase realtime
export const createMockRealtimeChannel = () => ({
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
  unsubscribe: jest.fn().mockReturnThis(),
  _events: new Map()
})

// Asset placement validator
export const validateAssetPlacement = (
  asset: any,
  port: any,
  existingAssets: any[]
) => {
  const errors = []
  
  // Check if asset is within snap radius
  const distance = Math.sqrt(
    Math.pow(asset.position.x - port.position.x, 2) +
    Math.pow(asset.position.y - port.position.y, 2)
  )
  
  if (distance > 50) {
    errors.push('Asset too far from port')
  }
  
  // Check for overlaps
  const hasOverlap = existingAssets.some(existing => 
    existing.position.x === asset.position.x &&
    existing.position.y === asset.position.y
  )
  
  if (hasOverlap) {
    errors.push('Position already occupied')
  }
  
  // Check capacity
  const assetsByType = existingAssets.filter(a => a.type === asset.type)
  const capacity = port.capacity[asset.category] || 0
  
  if (assetsByType.length >= capacity) {
    errors.push('Port capacity exceeded')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Generate test data
export const generateTestAssets = (count: number) => {
  const types = ['warehouse', 'ship', 'plane', 'decoration']
  const ports = ['port-shanghai', 'port-los-angeles', 'port-rotterdam', 'port-singapore']
  
  return Array(count).fill(null).map((_, i) => ({
    id: `asset-${i}`,
    type: types[i % types.length],
    portId: ports[i % ports.length],
    position: {
      x: 100 + (i % 10) * 100,
      y: 100 + Math.floor(i / 10) * 100
    },
    cost: 50000 + (i % 4) * 25000,
    ownerId: 'test-player'
  }))
}

// FPS counter mock
export class FPSCounter {
  private frames = 0
  private lastTime = performance.now()
  private fps = 60
  
  update() {
    this.frames++
    const currentTime = performance.now()
    const delta = currentTime - this.lastTime
    
    if (delta >= 1000) {
      this.fps = (this.frames * 1000) / delta
      this.frames = 0
      this.lastTime = currentTime
    }
  }
  
  getFPS() {
    return Math.round(this.fps)
  }
}

// Memory usage simulator
export const simulateMemoryUsage = () => {
  const baseline = 100 // MB
  const variation = Math.random() * 20 - 10 // ±10MB
  return baseline + variation
}

// Network latency simulator
export const simulateNetworkLatency = async (minMs = 20, maxMs = 100) => {
  const delay = minMs + Math.random() * (maxMs - minMs)
  await new Promise(resolve => setTimeout(resolve, delay))
}

// Export all helpers
export default {
  createMockGameState,
  createMockAsset,
  createMockPort,
  createMockRoute,
  renderWithProviders,
  MockScene,
  createMockStore,
  measurePerformance,
  waitFor,
  createMockRealtimeChannel,
  validateAssetPlacement,
  generateTestAssets,
  FPSCounter,
  simulateMemoryUsage,
  simulateNetworkLatency
}
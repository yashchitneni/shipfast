# Flexport Game Testing Documentation

## Overview
This directory contains comprehensive tests for the Flexport video game, organized by test type and phase.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── asset-placement.test.ts
│   └── camera-controls.test.ts
├── integration/             # Integration tests
│   ├── supabase-sync.test.ts
│   ├── save-load.test.ts
│   └── performance.test.ts
├── e2e/                    # End-to-end tests (future)
└── utils/                  # Test utilities and helpers
    └── test-helpers.ts
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

## Phase 1 Test Coverage

### Asset Placement System ✅
- Asset creation and validation
- Cost deduction and refunds
- Port snapping functionality
- Position validation and collision detection
- Ownership verification
- Category capacity limits

### Camera Controls ✅
- Pan functionality with drag
- Zoom with mouse wheel
- Boundary constraints
- Camera presets (global view, port focus)
- Smooth animations
- Performance throttling

### State Synchronization ✅
- Supabase connection
- CRUD operations for empires and assets
- Real-time synchronization
- Optimistic updates with rollback
- Conflict resolution
- Database queries

### Save/Load System ✅
- Game state serialization
- Save file compression
- Data integrity validation
- Format migration
- Auto-save functionality
- Multiple save slots
- Cloud sync support

### Performance Benchmarks ✅
- 60 FPS rendering target
- Asset count stress testing
- Memory leak prevention
- Texture caching
- State update batching
- Network request throttling
- Load time optimization

## Test Utilities

The `test-helpers.ts` file provides:
- Mock factories for game objects
- Phaser scene mocks
- Zustand store mocks
- Performance measurement tools
- Network simulation utilities
- Validation helpers

## Writing New Tests

### Unit Test Example
```typescript
import { createMockAsset } from '../utils/test-helpers'

describe('New Feature', () => {
  it('should work correctly', () => {
    const asset = createMockAsset('warehouse')
    expect(asset.type).toBe('warehouse')
  })
})
```

### Integration Test Example
```typescript
import { simulateNetworkLatency } from '../utils/test-helpers'

describe('API Integration', () => {
  it('should handle network delays', async () => {
    await simulateNetworkLatency(50, 100)
    // Test network-dependent functionality
  })
})
```

## Coverage Goals

- **Unit Tests**: 80% coverage
- **Integration Tests**: 70% coverage
- **Critical Paths**: 100% coverage

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Pre-deployment checks

## Debugging Tests

### VSCode Configuration
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Common Issues

1. **Mock Conflicts**: Clear jest cache with `jest --clearCache`
2. **Async Timeouts**: Increase timeout with `jest.setTimeout(10000)`
3. **Module Resolution**: Check `jest.config.js` moduleNameMapper

## Performance Testing

Performance tests ensure:
- Smooth 60 FPS gameplay
- Fast load times (<3s)
- Efficient memory usage
- Quick database queries (<100ms)
- Responsive input handling (<50ms)

## Future Improvements

- [ ] E2E tests with Playwright
- [ ] Visual regression testing
- [ ] Multiplayer interaction tests
- [ ] Mobile performance tests
- [ ] Accessibility testing
# Asset Migration Guide

## Overview

This guide explains the migration from the legacy asset structure to the modern `placedAssets` Map structure in Flexport.

## Background

### Legacy Structure (Deprecated)
```typescript
assets: {
  ships: Record<string, Ship>;
  planes: Record<string, Plane>;
  warehouses: Record<string, Warehouse>;
  specialists: Record<string, Specialist>;
}
```

### Modern Structure
```typescript
placedAssets: Map<string, PlacedAsset>;
assetDefinitions: Map<string, AssetDefinition>;
```

## Migration Process

### 1. Automatic Migration

The system includes automatic migration functionality that:
- Detects legacy assets on startup
- Converts them to the new format
- Preserves all data and relationships
- Clears the legacy structure after successful migration

### 2. Manual Migration

Users can trigger migration manually:

```typescript
// Check if migration is needed
const needsMigration = useEmpireStore.getState().isLegacyDataPresent();

// Perform migration
if (needsMigration) {
  useEmpireStore.getState().migrateLegacyAssets();
}
```

### 3. UI Migration

Add the `AssetMigrationNotice` component to your app:

```tsx
import { AssetMigrationNotice } from '@/components/AssetMigrationNotice';

function App() {
  return (
    <>
      {/* Your app content */}
      <AssetMigrationNotice />
    </>
  );
}
```

## Migration Details

### Asset Type Mapping

| Legacy Type | Condition | New Definition ID |
|------------|-----------|-------------------|
| Ship | capacity ≤ 1000 | ship-cargo-small |
| Ship | capacity ≤ 5000 | ship-cargo-medium |
| Ship | capacity > 5000 | ship-cargo-large |
| Plane | range ≤ 500 | plane-cargo-small |
| Plane | range ≤ 2000 | plane-cargo-medium |
| Plane | range > 2000 | plane-cargo-large |
| Warehouse | capacity ≤ 10000 | warehouse-small |
| Warehouse | capacity ≤ 50000 | warehouse-medium |
| Warehouse | capacity > 50000 | warehouse-large |
| Specialist | specialty = NEGOTIATOR | specialist-negotiator |
| Specialist | specialty = LOGISTICS | specialist-logistics |
| Specialist | specialty = ENGINEER | specialist-engineer |
| Specialist | specialty = FINANCE | specialist-finance |

### Status Mapping

| Legacy Status | New Status |
|--------------|------------|
| ACTIVE | active |
| INACTIVE | inactive |
| MAINTENANCE | maintenance |
| (has route) | transit |

### Data Preservation

The migration preserves:
- Asset IDs
- Owner information
- Position data
- Custom names
- Route assignments
- Health/condition
- Purchase timestamps

## Code Updates Required

### 1. Update Hooks

Replace legacy asset access:

```typescript
// Old
const ships = Object.values(state.assets.ships);

// New
const ships = useShips(); // Uses placedAssets internally
```

### 2. Update Components

Components should use the new hooks:

```typescript
import { useShips, usePlanes, useWarehouses } from '@/store/hooks/useEmpireSelectors';

function FleetOverview() {
  const ships = useShips();
  const planes = usePlanes();
  
  // Component logic...
}
```

### 3. Update Actions

Use the new asset management actions:

```typescript
// Old
store.addAsset(shipData);

// New
store.placeAsset(); // After preview setup
```

## Database Migration

For production environments, run the SQL migration:

```sql
-- Run migration script
\i src/database/migrations/002_migrate_legacy_assets.sql
```

## Validation

After migration, validate:

```typescript
import { validateMigration } from '@/utils/assetMigration';

const legacyAssets = store.getState().assets;
const placedAssets = store.getState().placedAssets;

const { success, errors } = validateMigration(legacyAssets, placedAssets);
if (!success) {
  console.error('Migration validation failed:', errors);
}
```

## Rollback

If needed, legacy data is preserved in the database:

```sql
-- Access legacy data
SELECT stats->'legacy' as legacy_data 
FROM assets 
WHERE stats->>'migrated' = 'true';
```

## Timeline

1. **Phase 1** (Current): Both structures supported, automatic migration available
2. **Phase 2**: Legacy structure deprecated, warnings shown
3. **Phase 3**: Legacy structure removed, only placedAssets supported

## Support

For migration issues:
1. Check browser console for errors
2. Verify asset definitions are loaded
3. Ensure player ID is set
4. Contact support with migration logs
# Map Architecture Proposal: Geographic Truth System

## Problem Statement
The current map system has no real geographic awareness - it's just colors on a grid with manually placed ports. This causes:
- Ports appearing in wrong locations
- No accurate land/ocean detection
- Multiple conflicting coordinate systems
- No way to add new real-world ports accurately

## Proposed Solution: Geographic Truth System

### 1. **Use Real Geographic Data**
```typescript
// Store all locations in lat/lon (the universal truth)
interface GeographicLocation {
  latitude: number;
  longitude: number;
}

// Convert to game coordinates when needed
class GeographicMapper {
  // Map dimensions in tiles
  private mapWidth = 400;
  private mapHeight = 200;
  
  // Convert lat/lon to tile coordinates
  latLonToTile(lat: number, lon: number): {x: number, y: number} {
    // Simple equirectangular projection
    const x = ((lon + 180) / 360) * this.mapWidth;
    const y = ((90 - lat) / 180) * this.mapHeight;
    return { x: Math.floor(x), y: Math.floor(y) };
  }
  
  // Convert tile to lat/lon for reverse lookup
  tileToLatLon(x: number, y: number): GeographicLocation {
    const lon = (x / this.mapWidth) * 360 - 180;
    const lat = 90 - (y / this.mapHeight) * 180;
    return { latitude: lat, longitude: lon };
  }
}
```

### 2. **Geographic Data Layers**
Instead of processing pixels, use actual geographic data:

```typescript
interface GeographicTile {
  x: number;
  y: number;
  latitude: number;
  longitude: number;
  terrain: 'ocean' | 'land' | 'coastal';
  country?: string;
  elevation: number;
  navigable: boolean;
}

// Load from a proper geographic dataset
class WorldGeography {
  private tiles: GeographicTile[][] = [];
  
  async loadFromGeoJSON() {
    // Load actual coastline data, country boundaries, etc.
    const worldData = await fetch('world-geography.geojson');
    // Process into tile grid
  }
  
  isLand(lat: number, lon: number): boolean {
    const tile = this.getTileAt(lat, lon);
    return tile.terrain === 'land';
  }
  
  findCoastalTiles(): GeographicTile[] {
    // Return all tiles that border ocean and land
  }
}
```

### 3. **Accurate Port Placement**
```typescript
// Update ports.json to use real coordinates
{
  "ports": [
    {
      "id": "port-shanghai",
      "name": "Port of Shanghai",
      "location": { "lat": 31.2304, "lon": 121.4737 }, // Real coordinates
      "country": "China",
      // ... rest of data
    }
  ]
}

// System automatically converts to game coordinates
class PortManager {
  loadPorts(portData: any[]) {
    return portData.map(port => ({
      ...port,
      tilePosition: this.geoMapper.latLonToTile(port.location.lat, port.location.lon),
      worldPosition: this.tileToWorldCoords(tilePosition)
    }));
  }
}
```

### 4. **Visual Representation Options**

#### Option A: Wrapped 2D Map (Easiest)
- Keep current Phaser setup
- Map wraps at edges (cross Pacific from US to Asia)
- Minimap shows full world

#### Option B: Multiple Projections
- Zoomed out: Show curved projection (like Google Maps)
- Zoomed in: Switch to flat regional view
- Medium zoom: Mercator projection

#### Option C: Hybrid 2D/3D (Most Impressive)
```typescript
// Zoomed out: Three.js globe
class GlobeView {
  private globe: THREE.Mesh;
  
  showPort(lat: number, lon: number) {
    // Convert to 3D sphere coordinates
    const pos = this.latLonToSphere(lat, lon);
    // Add marker on globe
  }
  
  rotateTo(lat: number, lon: number) {
    // Smooth rotation animation
  }
}

// Zoomed in: Phaser 2D view
class RegionalView {
  // Current Phaser implementation
}
```

### 5. **Implementation Steps**

1. **Create Geographic Mapper**
   - Build lat/lon ↔ tile conversion
   - Test with known port locations

2. **Generate Accurate Tile Data**
   - Use real coastline data (Natural Earth, OpenStreetMap)
   - Mark each tile as ocean/land/coastal
   - Store country information per tile

3. **Update Port System**
   - Convert all ports to lat/lon
   - Auto-calculate tile positions
   - Validate ports are actually on coasts

4. **Enhance Visualization**
   - Add country borders
   - Show shipping lanes
   - Proper ocean currents

## Benefits

1. **Accuracy**: Ports appear where they actually are
2. **Scalability**: Easy to add any real-world port
3. **Flexibility**: Can switch between projections
4. **Realism**: Shipping routes follow real geography
5. **Future-Proof**: Can add weather, currents, etc. based on real data

## Example: How Shanghai Would Work

```typescript
const shanghaiPort = {
  id: "port-shanghai",
  location: { lat: 31.2304, lon: 121.4737 },
  // ... other data
};

// System automatically:
// 1. Converts to tile coords: {x: 280, y: 75}
// 2. Verifies it's on a coast: ✓
// 3. Links to China country data
// 4. Places on map accurately
// 5. Enables realistic shipping routes
```

This approach gives you a solid foundation for a geographically accurate game while keeping the technical implementation manageable.
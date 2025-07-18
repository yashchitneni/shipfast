# Hybrid Globe/Map Implementation Plan

## Vision
A shipping game that shows a realistic 3D globe when zoomed out, with proper countries and coastlines, that seamlessly transitions to your existing 2D Phaser map when zooming into regions.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Three.js      │     │   Transition     │     │    Phaser       │
│   Globe View    │ <-> │     Layer        │ <-> │   2D Map View   │
│ (Zoomed Out)    │     │  (Medium Zoom)   │     │  (Zoomed In)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         ↓                       ↓                        ↓
    ┌────────────────────────────────────────────────────────┐
    │            Geographic Truth Layer (Single Source)       │
    │    • Real coastline data (GeoJSON)                     │
    │    • Country boundaries                                │
    │    • Port locations (lat/lon)                          │
    │    • Ocean/land classification                          │
    └────────────────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Geographic Data Foundation

```typescript
// Geographic truth system that both views use
class GeographicData {
  private coastlines: GeoJSON.FeatureCollection;
  private countries: Map<string, GeoJSON.Feature>;
  private oceanTiles: Set<string>;
  
  async loadGeographicData() {
    // Natural Earth provides free, accurate geographic data
    this.coastlines = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_coastline.geojson');
    this.countries = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson');
    
    // Process into your tile system
    this.processIntoTiles();
  }
  
  isOcean(lat: number, lon: number): boolean {
    // Use point-in-polygon tests against coastlines
    return !this.isInsideLand(lat, lon);
  }
  
  getCountryAt(lat: number, lon: number): string | null {
    // Return country code at coordinates
  }
}
```

### 2. Three.js Globe View (Zoomed Out)

```typescript
class GlobeView {
  private scene: THREE.Scene;
  private globe: THREE.Mesh;
  private ports: THREE.Group;
  private camera: THREE.PerspectiveCamera;
  
  async initialize() {
    // Create sphere with Earth texture
    const geometry = new THREE.SphereGeometry(100, 64, 64);
    const texture = new THREE.TextureLoader().load('/textures/earth-realistic.jpg');
    const material = new THREE.MeshPhongMaterial({ map: texture });
    this.globe = new THREE.Mesh(geometry, material);
    
    // Add country borders
    await this.addCountryBorders();
    
    // Add port markers
    await this.addPortMarkers();
    
    // Enable rotation
    this.enableGlobeControls();
  }
  
  addPortMarkers() {
    // Convert lat/lon to 3D sphere coordinates
    ports.forEach(port => {
      const position = this.latLonToVector3(port.lat, port.lon, 101); // Slightly above surface
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.5),
        new THREE.MeshBasicMaterial({ color: 0xFFD700 })
      );
      marker.position.copy(position);
      this.ports.add(marker);
    });
  }
  
  latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    
    return new THREE.Vector3(x, y, z);
  }
  
  handleClick(event: MouseEvent) {
    // Raycast to find clicked port
    const port = this.getClickedPort(event);
    if (port) {
      // Trigger zoom to port region
      this.zoomToPort(port);
    }
  }
}
```

### 3. Transition System

```typescript
class MapTransitionController {
  private globeView: GlobeView;
  private phaserView: Phaser.Scene;
  private currentZoom: number = 1;
  private currentView: 'globe' | 'transition' | 'flat' = 'globe';
  
  handleZoom(delta: number) {
    this.currentZoom += delta;
    
    if (this.currentZoom < 3 && this.currentView !== 'globe') {
      // Switch to globe
      this.transitionToGlobe();
    } else if (this.currentZoom > 5 && this.currentView !== 'flat') {
      // Switch to Phaser
      this.transitionToPhaser();
    } else if (this.currentZoom >= 3 && this.currentZoom <= 5) {
      // Hybrid view
      this.showTransitionView();
    }
  }
  
  transitionToPhaser(centerLat: number, centerLon: number) {
    // 1. Calculate which region of flat map to show
    const tileCoords = this.geoData.latLonToTile(centerLat, centerLon);
    
    // 2. Fade out globe
    gsap.to(this.globeContainer, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        // 3. Show Phaser view centered on location
        this.phaserView.cameras.main.centerOn(tileCoords.x, tileCoords.y);
        this.phaserContainer.style.display = 'block';
        gsap.to(this.phaserContainer, { opacity: 1, duration: 0.5 });
      }
    });
  }
}
```

### 4. Updated Phaser Integration

```typescript
class WorldMapScene extends Phaser.Scene {
  private geoData: GeographicData;
  private transitionController: MapTransitionController;
  
  create() {
    // Create map using geographic truth data
    this.createMapFromGeoData();
    
    // Add zoom limits
    this.cameras.main.on('zoom', (cam, zoom) => {
      if (zoom < 0.5) {
        // Trigger transition to globe
        this.transitionController.requestGlobeView();
      }
    });
  }
  
  createMapFromGeoData() {
    // Instead of pixel processing, use real data
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const { lat, lon } = this.tileToLatLon(x, y);
        const isOcean = this.geoData.isOcean(lat, lon);
        const country = this.geoData.getCountryAt(lat, lon);
        
        // Create appropriate tile
        if (isOcean) {
          this.createOceanTile(x, y);
        } else {
          this.createLandTile(x, y, country);
        }
      }
    }
    
    // Add ports from geographic data
    this.geoData.getPorts().forEach(port => {
      const tilePos = this.latLonToTile(port.lat, port.lon);
      this.createPortMarker(tilePos.x, tilePos.y, port);
    });
  }
}
```

### 5. Data Sources to Use

1. **Natural Earth** (Free, Public Domain)
   - Coastlines: `ne_50m_coastline.geojson`
   - Countries: `ne_50m_admin_0_countries.geojson`
   - Ocean polygons: `ne_50m_ocean.geojson`

2. **OpenStreetMap** (For detailed coastlines)
   - Can extract more detailed regional data

3. **Your Existing Assets**
   - Pixel art for 2D view
   - Port data with real coordinates

### 6. User Experience Flow

1. **Start**: See beautiful 3D globe, can rotate it
2. **Click Port**: Globe rotates to center on port
3. **Zoom In**: Globe fades to flat regional map
4. **Play**: Your existing game mechanics
5. **Zoom Out**: Transition back to globe
6. **Navigate**: Click different region on globe

## Benefits of This Approach

1. **Geographic Accuracy**: Ports appear exactly where they should
2. **Visual Impact**: 3D globe is impressive and intuitive
3. **Scalability**: Easy to add any real-world port
4. **Reuses Your Work**: Phaser game stays the same
5. **Educational**: Players learn real geography

## Technical Considerations

- **Performance**: Globe only renders when zoomed out
- **Loading**: Geographic data can be cached
- **Mobile**: Touch controls for globe rotation
- **Fallback**: If WebGL not supported, stay in 2D

This gives you the best of both worlds - an impressive globe view that accurately shows the world, transitioning seamlessly to your detailed 2D game!
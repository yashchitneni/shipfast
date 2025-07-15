## **Achieving Tycoon Aesthetic in Phaser.js**

### **Art Direction Philosophy**

**Core Concept**: Blend *RollerCoaster Tycoon*'s charming isometric style with modern logistics visuals.

**Visual Goals**:

* **Strategic Clarity**: Readable map, clear icons.  
* **Dynamic World**: Animated assets, pulsing markets.  
* **Immersive Economy**: Visual cues for data.  
* **Polished UI**: Clean dashboards.

### **Color Palette Strategy**

#### **Primary Colors**

* **Ocean Blue**: \#0077BE (sea routes, water).  
* **Cargo Green**: \#228B22 (profits, assets).  
* **Alert Red**: \#DC143C (disasters, losses).  
* **Gold Yellow**: \#FFD700 (cash, auctions).  
* **Neutral Gray**: \#808080 (map base).

#### **Secondary Colors**

* **Port Orange**: \#FF4500 (ports, destinations).  
* **Sky Blue**: \#87CEEB (air routes).  
* **Earth Brown**: \#A0522D (warehouses).

#### **UI Colors**

* **Dashboard Blue**: \#1E90FF.  
* **Highlight Green**: \#32CD32.  
* **Warning Yellow**: \#FFFF00.  
* **Night Mode**: Darken by 50%.

### **Sprite & Asset Guidelines**

#### **Map Architecture**

text  
CollapseWrap  
Copy  
`Proportions:`

`- Isometric scale (2:1 ratio).`

`- Clear node silhouettes.`

`- Detailed ports with icons.`

`Style Elements:`

`- Soft edges.`

`- Color-coded routes.`

`- Animated movements.`

#### **Asset Structures**

text  
CollapseWrap  
Copy  
`Design Principles:`

`- Iconic shapes (ships as boats).`

`- Visible stats (tooltips).`

`- Dynamic colors.`

`- Clear flows.`

#### **Effect Elements**

text  
CollapseWrap  
Copy  
`Detail Philosophy:`

`- High-res for heroes (ships).`

`- Simple for backgrounds.`

`- Consistent scaling.`

### **Textures & Materials**

#### **Asset Categories**

**1\. Transport Assets**

* Ships: Metallic textures.  
* Planes: Sleek, shiny.  
* Routes: Dashed lines.

**2\. Natural Elements**

* Oceans: Wavy patterns.  
* Ports: Industrial docks.  
* Disasters: Overlay storms.

**3\. UI Elements**

* Buttons: Rounded, shadowed.  
* Graphs: Clean lines.

#### **Texture Resolution Strategy**

text  
CollapseWrap  
Copy  
`Hero Assets:`

`- Ships: 512x512.`

`- Ports: 256x256.`

`Background:`

`- Map: Tiling 1024x1024.`

`- Effects: 128x128 particles.`

### **Effects Design**

#### **Time Cycle Implementation**

javascript  
CollapseWrapRun  
Copy  
*`// Example cycle`*

`const cycleColors = {`

 `day: '#FFFFFF',`

 `night: '#00008B',`

`};`

#### **Atmospheric Effects**

* Ambient: Soft glows.  
* Route: Animated dashes.  
* Disaster: Red overlays.

#### **Special Effects**

* Auctions: Flashing bids.  
* Crises: Timers with pulses.  
* AI: Speech bubbles.

### **Performance Optimization**

#### **LOD System**

text  
CollapseWrap  
Copy  
`Close: Full animation.`

`Distant: Static sprites.`

#### **Texture Streaming**

* Atlases for sprites.  
* Compression in Phaser.

#### **Effects Optimization**

* Particle limits.  
* Batch rendering.

### **Atmospheric Effects**

#### **Event System**

text  
CollapseWrap  
Copy  
`Types:`

`- Clear: Bright.`

`- Storm: Dark, particles.`

`- Crisis: Flashing.`

#### **Particle Effects**

* Cargo: Loading sparks.  
* Disasters: Wind/swirls.  
* Profits: Coin bursts.

#### **Animation**

* Ships: Sailing motion.  
* Markets: Pulsing icons.

### **UI Visual Integration**

#### **Interface Design**

* Harmony with map colors.  
* Sans-serif fonts.  
* Icons: Logistics-themed.  
* Responsive.

#### **HUD Elements**

* Cash: Gold coins.  
* Toolbar: Tabbed.  
* Panels: Semi-transparent.

### **Audio-Visual Sync**

#### **Sound Integration**

* Ambient: Waves, engines.  
* Events: Alarms.  
* UI: Clicks.

#### **Performance**

* Occlusion: N/A (2D).  
* Falloff: Volume by zoom.

### **Quality Assurance**

#### **Visual Checklist**

* Consistent lighting.  
* Readable UI.  
* Smooth FPS.  
* Style unity.

#### **Benchmarks**

* FPS: 60 on desktop.  
* Load: \<3s.  
* Sync: \<200ms.

### **Implementation Timeline**

#### **Phase 1: Foundation**

* Basic sprites.  
* Core effects.

#### **Phase 2: Enhancement**

* Detailed textures.  
* Animations.

#### **Phase 3: Polish**

* Final effects.  
* Optimization.  
* Integration.

### **Asset Creation Tools**

#### **Workflow**

* Sprites: Aseprite.  
* Textures: GIMP.  
* Concepts: Krita.

#### **Phaser Considerations**

* Sprite sheets.  
* Import opts.  
* Scene org.


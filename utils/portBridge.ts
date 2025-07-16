import { PortNode } from '../app/lib/types/assets';
import { useEmpireStore } from '../src/store/empireStore';

// Bridge for rendering ports on the Phaser scene
export class PortBridge {
  private scene: Phaser.Scene | null = null;
  private portSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  
  constructor() {
    // Subscribe to port changes if needed
  }

  // Set the active Phaser scene
  setScene(scene: Phaser.Scene) {
    this.scene = scene;
    this.renderPorts();
  }

  // Render all ports
  private renderPorts() {
    if (!this.scene) return;
    
    const empireStore = useEmpireStore.getState();
    const portNodes = empireStore.portNodes;
    
    // Clear existing ports
    this.portSprites.forEach(container => container.destroy(true));
    this.portSprites.clear();
    
    // Render each port
    portNodes.forEach(port => {
      this.createPortSprite(port);
    });
  }

  // Create a sprite for a port
  private createPortSprite(port: PortNode) {
    if (!this.scene) return;
    
    // Create container for port graphics
    const container = this.scene.add.container(port.position.x, port.position.y);
    container.setDepth(8);
    
    // Port circle
    const graphics = this.scene.add.graphics();
    const size = port.size === 'large' ? 30 : port.size === 'medium' ? 20 : 15;
    
    // Port background
    graphics.fillStyle(0x444444, 1);
    graphics.fillCircle(0, 0, size + 2);
    
    // Port color based on type
    const color = this.getPortColor(port);
    graphics.fillStyle(color, 1);
    graphics.fillCircle(0, 0, size);
    
    // Port icon
    const icon = this.scene.add.text(0, 0, this.getPortIcon(port), {
      fontSize: `${size}px`,
      color: '#ffffff'
    });
    icon.setOrigin(0.5);
    
    // Port name
    const nameText = this.scene.add.text(0, size + 10, port.name, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 4, y: 2 }
    });
    nameText.setOrigin(0.5);
    
    // Add to container
    container.add([graphics, icon, nameText]);
    
    // Make interactive
    container.setSize(size * 2, size * 2);
    container.setInteractive();
    
    // Store port data
    container.setData('type', 'port');
    container.setData('id', port.id);
    container.setData('port', port);
    
    // Add hover effects
    container.on('pointerover', () => {
      container.setScale(1.1);
      this.showPortTooltip(port);
    });
    
    container.on('pointerout', () => {
      container.setScale(1);
      this.hidePortTooltip();
    });
    
    // Store reference
    this.portSprites.set(port.id, container);
  }

  // Get port color based on type
  private getPortColor(port: PortNode): number {
    const colors = {
      hub: 0xff6b6b,      // Red for major hubs
      export: 0x4ecdc4,   // Teal for export ports
      import: 0xffe66d,   // Yellow for import ports
      industrial: 0x95e1d3, // Light teal for industrial
      consumer: 0xf38181    // Light red for consumer
    };
    
    return colors[port.type] || 0x808080;
  }

  // Get port icon based on type
  private getPortIcon(port: PortNode): string {
    const icons = {
      hub: '🏛️',
      export: '📦',
      import: '📥',
      industrial: '🏭',
      consumer: '🏪'
    };
    
    return icons[port.type] || '⚓';
  }

  // Show port tooltip
  private tooltip: Phaser.GameObjects.Container | null = null;
  
  private showPortTooltip(port: PortNode) {
    if (!this.scene) return;
    
    this.hidePortTooltip();
    
    const bg = this.scene.add.rectangle(0, 0, 200, 80, 0x000000, 0.8);
    const title = this.scene.add.text(0, -20, port.name, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    
    const info = this.scene.add.text(0, 0, `Type: ${port.type}\nSize: ${port.size}\nRegion: ${port.region}`, {
      fontSize: '12px',
      color: '#cccccc',
      align: 'center'
    });
    info.setOrigin(0.5);
    
    this.tooltip = this.scene.add.container(port.position.x, port.position.y - 60);
    this.tooltip.add([bg, title, info]);
    this.tooltip.setDepth(100);
  }

  // Hide port tooltip
  private hidePortTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy(true);
      this.tooltip = null;
    }
  }

  // Clean up
  destroy() {
    this.portSprites.forEach(container => container.destroy(true));
    this.portSprites.clear();
    this.hidePortTooltip();
    this.scene = null;
  }
}

// Singleton instance
export const portBridge = new PortBridge();
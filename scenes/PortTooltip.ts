import * as Phaser from 'phaser';

export interface PortTooltipData {
  name: string;
  country: string;
  capacity: number;
  efficiency: number;
  majorExports: string[];
  majorImports: string[];
  economicData?: {
    utilization: number;
    topGoods: Array<{
      name: string;
      price: number;
      trend: 'rising' | 'falling' | 'stable';
    }>;
    tradeOpportunities: number;
  };
}

export class PortTooltip extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private titleText: Phaser.GameObjects.Text;
  private contentTexts: Phaser.GameObjects.Text[] = [];
  private isVisible: boolean = false;
  
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    
    // Create background
    this.background = scene.add.graphics();
    this.add(this.background);
    
    // Create title text
    this.titleText = scene.add.text(0, 0, '', {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FFD700',
      padding: { x: 10, y: 5 }
    });
    this.add(this.titleText);
    
    // Set depth and initial visibility
    this.setDepth(1000);
    this.setVisible(false);
    
    scene.add.existing(this);
  }
  
  /**
   * Show tooltip with port data
   */
  public show(x: number, y: number, data: PortTooltipData): void {
    // Clear previous content
    this.contentTexts.forEach(text => text.destroy());
    this.contentTexts = [];
    
    // Set position
    this.setPosition(x, y - 100);
    
    // Update title
    this.titleText.setText(data.name);
    this.titleText.setPosition(10, 10);
    
    // Create content lines
    const lines = [
      `Country: ${data.country}`,
      `Capacity: ${data.capacity.toLocaleString()} TEU`,
      `Efficiency: ${Math.round(data.efficiency * 100)}%`,
    ];
    
    // Add economic data if available
    if (data.economicData) {
      lines.push(
        `Utilization: ${Math.round(data.economicData.utilization * 100)}%`,
        `Trade Opportunities: ${data.economicData.tradeOpportunities}`,
        ''
      );
      
      if (data.economicData.topGoods.length > 0) {
        lines.push('Top Goods:');
        data.economicData.topGoods.slice(0, 3).forEach(good => {
          const trendIcon = good.trend === 'rising' ? '↗' : good.trend === 'falling' ? '↘' : '→';
          lines.push(`  • ${good.name}: $${good.price.toFixed(2)} ${trendIcon}`);
        });
        lines.push('');
      }
    }
    
    lines.push(
      'Major Exports:',
      ...data.majorExports.slice(0, 3).map(e => `  • ${e}`),
      '',
      'Major Imports:',
      ...data.majorImports.slice(0, 3).map(i => `  • ${i}`)
    );
    
    let yOffset = 35;
    lines.forEach(line => {
      let color = '#FFFFFF'; // Default white
      
      if (line.startsWith('  •')) {
        // Items in lists
        if (line.includes('↗')) {
          color = '#00FF00'; // Green for rising
        } else if (line.includes('↘')) {
          color = '#FF6B6B'; // Red for falling
        } else {
          color = '#00D9FF'; // Cyan for stable/default
        }
      } else if (line.includes('Utilization:') || line.includes('Trade Opportunities:') || line.includes('Top Goods:')) {
        color = '#FFD700'; // Gold for economic headers
      }
      
      const text = this.scene.add.text(10, yOffset, line, {
        fontSize: '12px',
        color: color
      });
      this.add(text);
      this.contentTexts.push(text);
      yOffset += 18;
    });
    
    // Draw background
    const width = 280;
    const height = yOffset + 10;
    
    this.background.clear();
    this.background.fillStyle(0x000000, 0.9);
    this.background.fillRoundedRect(0, 0, width, height, 8);
    this.background.lineStyle(2, 0xFFD700, 1);
    this.background.strokeRoundedRect(0, 0, width, height, 8);
    
    // Add arrow pointing down
    this.background.fillStyle(0x000000, 0.9);
    this.background.fillTriangle(
      width / 2 - 10, height,
      width / 2 + 10, height,
      width / 2, height + 10
    );
    
    // Adjust position to center horizontally
    this.x -= width / 2;
    
    // Ensure tooltip stays within screen bounds
    const bounds = this.scene.cameras.main.getBounds();
    if (this.x < bounds.x + 10) {
      this.x = bounds.x + 10;
    } else if (this.x + width > bounds.x + bounds.width - 10) {
      this.x = bounds.x + bounds.width - width - 10;
    }
    
    // Show with fade in
    this.setAlpha(0);
    this.setVisible(true);
    this.isVisible = true;
    
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });
  }
  
  /**
   * Hide tooltip
   */
  public hide(): void {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        this.setVisible(false);
      }
    });
  }
  
  /**
   * Check if tooltip is currently visible
   */
  public getIsVisible(): boolean {
    return this.isVisible;
  }
}
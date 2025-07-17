import * as Phaser from 'phaser';

/**
 * QuadTree implementation for efficient spatial querying of ports
 * Helps optimize LOD updates by only checking ports within view
 */
export class LODQuadTree {
  private bounds: Phaser.Geom.Rectangle;
  private maxObjects: number = 10;
  private maxLevels: number = 5;
  private level: number;
  private objects: Array<{ id: string; bounds: Phaser.Geom.Rectangle }> = [];
  private nodes: LODQuadTree[] = [];
  
  constructor(bounds: Phaser.Geom.Rectangle, level: number = 0) {
    this.bounds = bounds;
    this.level = level;
  }
  
  /**
   * Clear the quadtree
   */
  public clear(): void {
    this.objects = [];
    this.nodes.forEach(node => node.clear());
    this.nodes = [];
  }
  
  /**
   * Split the node into 4 subnodes
   */
  private split(): void {
    const subWidth = this.bounds.width / 2;
    const subHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;
    
    // Top right
    this.nodes[0] = new LODQuadTree(
      new Phaser.Geom.Rectangle(x + subWidth, y, subWidth, subHeight),
      this.level + 1
    );
    
    // Top left
    this.nodes[1] = new LODQuadTree(
      new Phaser.Geom.Rectangle(x, y, subWidth, subHeight),
      this.level + 1
    );
    
    // Bottom left
    this.nodes[2] = new LODQuadTree(
      new Phaser.Geom.Rectangle(x, y + subHeight, subWidth, subHeight),
      this.level + 1
    );
    
    // Bottom right
    this.nodes[3] = new LODQuadTree(
      new Phaser.Geom.Rectangle(x + subWidth, y + subHeight, subWidth, subHeight),
      this.level + 1
    );
  }
  
  /**
   * Get the index of the subnode that contains the bounds
   */
  private getIndex(bounds: Phaser.Geom.Rectangle): number {
    let index = -1;
    const verticalMidpoint = this.bounds.x + this.bounds.width / 2;
    const horizontalMidpoint = this.bounds.y + this.bounds.height / 2;
    
    // Object can completely fit within the top quadrants
    const topQuadrant = bounds.y < horizontalMidpoint && 
                       bounds.y + bounds.height < horizontalMidpoint;
    
    // Object can completely fit within the bottom quadrants
    const bottomQuadrant = bounds.y > horizontalMidpoint;
    
    // Object can completely fit within the left quadrants
    if (bounds.x < verticalMidpoint && bounds.x + bounds.width < verticalMidpoint) {
      if (topQuadrant) {
        index = 1;
      } else if (bottomQuadrant) {
        index = 2;
      }
    }
    // Object can completely fit within the right quadrants
    else if (bounds.x > verticalMidpoint) {
      if (topQuadrant) {
        index = 0;
      } else if (bottomQuadrant) {
        index = 3;
      }
    }
    
    return index;
  }
  
  /**
   * Insert an object into the quadtree
   */
  public insert(object: { id: string; bounds: Phaser.Geom.Rectangle }): void {
    if (this.nodes.length > 0) {
      const index = this.getIndex(object.bounds);
      
      if (index !== -1) {
        this.nodes[index].insert(object);
        return;
      }
    }
    
    this.objects.push(object);
    
    if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
      if (this.nodes.length === 0) {
        this.split();
      }
      
      let i = 0;
      while (i < this.objects.length) {
        const index = this.getIndex(this.objects[i].bounds);
        if (index !== -1) {
          const removed = this.objects.splice(i, 1)[0];
          this.nodes[index].insert(removed);
        } else {
          i++;
        }
      }
    }
  }
  
  /**
   * Retrieve all objects that could collide with the given bounds
   */
  public retrieve(bounds: Phaser.Geom.Rectangle): Array<{ id: string; bounds: Phaser.Geom.Rectangle }> {
    const returnObjects: Array<{ id: string; bounds: Phaser.Geom.Rectangle }> = [];
    const index = this.getIndex(bounds);
    
    if (index !== -1 && this.nodes.length > 0) {
      returnObjects.push(...this.nodes[index].retrieve(bounds));
    }
    
    // If object doesn't fit into a subnode, check all subnodes
    if (index === -1 && this.nodes.length > 0) {
      for (const node of this.nodes) {
        returnObjects.push(...node.retrieve(bounds));
      }
    }
    
    returnObjects.push(...this.objects);
    
    return returnObjects;
  }
  
  /**
   * Get total object count in the tree
   */
  public getObjectCount(): number {
    let count = this.objects.length;
    this.nodes.forEach(node => {
      count += node.getObjectCount();
    });
    return count;
  }
}
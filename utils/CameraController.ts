import * as Phaser from 'phaser';

// Camera configuration constants
const CAMERA_CONFIG = {
  zoomMin: 0.5,
  zoomMax: 2.0,
  zoomStep: 0.1,
  panSpeed: 5,
  smoothFactor: 0.95
};

export class CameraController {
  private camera: Phaser.Cameras.Scene2D.Camera;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private velocity: { x: number; y: number } = { x: 0, y: 0 };
  
  constructor(camera: Phaser.Cameras.Scene2D.Camera) {
    this.camera = camera;
  }

  setCursors(cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
    this.cursors = cursors;
  }

  update(delta: number): void {
    if (!this.cursors) return;
    
    // Calculate target velocity based on input
    const targetVelocity = { x: 0, y: 0 };
    const speed = CAMERA_CONFIG.panSpeed * (delta / 16.67); // Normalize to 60fps
    
    if (this.cursors.left.isDown) {
      targetVelocity.x = -speed;
    } else if (this.cursors.right.isDown) {
      targetVelocity.x = speed;
    }
    
    if (this.cursors.up.isDown) {
      targetVelocity.y = -speed;
    } else if (this.cursors.down.isDown) {
      targetVelocity.y = speed;
    }
    
    // Apply smoothing
    this.velocity.x = this.lerp(this.velocity.x, targetVelocity.x, 1 - CAMERA_CONFIG.smoothFactor);
    this.velocity.y = this.lerp(this.velocity.y, targetVelocity.y, 1 - CAMERA_CONFIG.smoothFactor);
    
    // Apply velocity to camera
    if (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.y) > 0.01) {
      this.camera.scrollX += this.velocity.x;
      this.camera.scrollY += this.velocity.y;
    } else {
      this.velocity.x = 0;
      this.velocity.y = 0;
    }
  }

  private lerp(start: number, end: number, amount: number): number {
    return start + (end - start) * amount;
  }

  panTo(x: number, y: number, duration: number = 1000): void {
    const scene = this.camera.scene;
    
    scene.tweens.add({
      targets: this.camera,
      scrollX: x - this.camera.width / 2,
      scrollY: y - this.camera.height / 2,
      duration: duration,
      ease: 'Power2'
    });
  }

  zoomTo(zoom: number, duration: number = 500): void {
    const scene = this.camera.scene;
    
    scene.tweens.add({
      targets: this.camera,
      zoom: Phaser.Math.Clamp(zoom, CAMERA_CONFIG.zoomMin, CAMERA_CONFIG.zoomMax),
      duration: duration,
      ease: 'Power2'
    });
  }

  shake(duration: number = 500, intensity: number = 0.01): void {
    this.camera.shake(duration, intensity);
  }

  flash(duration: number = 500, red: number = 255, green: number = 255, blue: number = 255): void {
    this.camera.flash(duration, red, green, blue);
  }

  fade(fadeOut: boolean = true, duration: number = 500, red: number = 0, green: number = 0, blue: number = 0): void {
    if (fadeOut) {
      this.camera.fadeOut(duration, red, green, blue);
    } else {
      this.camera.fadeIn(duration, red, green, blue);
    }
  }
} 
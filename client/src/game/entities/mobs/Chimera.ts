import { BaseEntity } from '../BaseEntity';

class ChimeraMob extends BaseEntity {
  static stateFields = [...BaseEntity.stateFields, 'angle', 'isFlying', 'health', 'maxHealth'];
  static basicAngle = -Math.PI / 2;

  body!: Phaser.GameObjects.Sprite;
  healthBar!: Phaser.GameObjects.Graphics;
  healthHidden = true;

  get baseScale() {
    return (this.shape.radius * 6) / this.body.height;
  }

  get flyingScale() {
    return this.baseScale * 1.5;
  }

  createSprite() {
    this.body = this.game.add.sprite(0, 0, 'chimera').setOrigin(0.5, 0.5);
    this.body.setScale(this.isFlying ? this.flyingScale : this.baseScale);

    this.healthBar = this.game.add.graphics();
    this.healthBar.x = -this.shape.radius;
    this.healthBar.y = -this.shape.radius - 150;
    this.updateHealth();

    this.container = this.game.add.container(this.shape.x, this.shape.y, [this.body, this.healthBar]);
    return this.container;
  }

  afterStateUpdate(data: any): void {
    if (data.health !== undefined || data.maxHealth !== undefined) {
      this.updateHealth();
    }
    if (data.isFlying !== undefined) {
      this.updateScale();
    }
  }

  updateScale() {
    if (!this.body) return;

    this.game.tweens.add({
      targets: this.body,
      scale: this.isFlying ? this.flyingScale : this.baseScale,
      duration: 2500,
    });
  }

  updateHealth() {
    if (!this.healthBar) return;

    const barWidth = this.shape.radius * 2;
    const healthPercent = this.health / this.maxHealth;

    const isHidden = healthPercent === 1;
    if (isHidden !== this.healthHidden) {
      this.game.tweens.add({
        targets: this.healthBar,
        alpha: isHidden ? 0 : 1,
        duration: 500,
      });
      this.healthHidden = isHidden;
    }
    if (this.healthHidden) return;

    let healthColor = 65280;
    if (healthPercent < 0.3) {
      healthColor = 16711680;
    } else if (healthPercent < 0.5) {
      healthColor = 16776960;
    }

    this.healthBar.clear();
    this.healthBar.lineStyle(4, 0x000000);
    this.healthBar.strokeRect(0, 0, barWidth, 20);
    this.healthBar.fillStyle(healthColor);
    this.healthBar.fillRect(0, 0, barWidth * healthPercent, 20);
  }

  update(delta: number, time: number): void {
    super.update(delta, time);

    const startAngle = Phaser.Math.Angle.Wrap(this.body.rotation);
    const endAngle = Phaser.Math.Angle.Wrap(ChimeraMob.basicAngle + this.angle);
    this.body.setRotation(Phaser.Math.Angle.RotateTo(startAngle, endAngle));
  }
}

export default ChimeraMob;

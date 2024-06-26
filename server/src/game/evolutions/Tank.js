const Evolution = require('./BasicEvolution');
const Types = require('../Types');

module.exports = class Tank extends Evolution {
  static type = Types.Evolution.Tank;
  static level = 14;
  static abilityDuration = 6;
  static abilityCooldown = 90;

  applyAbilityEffects() {
    this.player.sword.damage.multiplier *= 1.5;
    this.player.sword.knockback.multiplier['ability'] = 2.5;
    this.player.knockbackResistance.multiplier *= 1.5;
    this.player.shape.setScale(1.75);
    this.player.health.regen.multiplier *= 8;

    this.player.health.regenWait.multiplier = 0;
    this.player.sword.swingDuration.multiplier['ability'] = 0.5;
  }

  update(dt) {
    super.update(dt);
    this.player.speed.multiplier *= 0.7;
    this.player.shape.setScale(1.15);
    this.player.sword.damage.multiplier *= 1.15;
    this.player.sword.knockback.multiplier['ability'] = 1.15;
    this.player.knockbackResistance.multiplier *= 1.15;
    this.player.health.max.multiplier *= 1.15;
    this.player.health.regen.multiplier *= 1.15;
    this.player.health.regenWait.multiplier *= 1;
    //TODO: Damagecooldown: 1.1
  }
}

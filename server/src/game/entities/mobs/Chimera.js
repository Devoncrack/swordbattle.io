const SAT = require('sat');
const Entity = require('../Entity');
const Circle = require('../../shapes/Circle');
const Timer = require('../../components/Timer');
const Health = require('../../components/Health');
const Property = require('../../components/Property');
const Types = require('../../Types');
const helpers = require('../../../helpers');

class ChimeraMob extends Entity {
  constructor(game, objectData) {
    objectData = Object.assign({ size: 70 }, objectData);
    super(game, Types.Entity.Chimera, objectData);

    this.shape = Circle.create(0, 0, this.size);
    this.velocity = new SAT.Vector(5, 5);
    this.angle = helpers.random(-Math.PI, Math.PI);
    
    this.jumpTimer = new Timer(0, 4, 5);
    this.angryTimer = new Timer(0, 15, 20);
    this.maneuverSpeed = helpers.random(1000, 2000);

    this.health = new Health(100, 2);
    this.speed = new Property(20);
    this.damage = new Property(1);
    this.isFlying = false;
    this.target = null;
    this.targets.push(Types.Entity.Player);

    this.spawn();
  }

  update(dt) {
    if (this.angryTimer.finished || !this.target || this.target.removed) {
      this.isFlying = false;
      this.target = null;
    }
    
    this.health.update(dt);
    this.jumpTimer.update(dt);

    if (this.isFlying) {
      const distance = helpers.distance(this.shape.x, this.shape.y, this.target.shape.x, this.target.shape.y);
      const progress = performance.now() / this.maneuverSpeed;
      const targetX = this.target.shape.x + distance * Math.cos(progress);
      const targetY = this.target.shape.y + distance * Math.sin(2 * progress) / 2;
      
      this.angle = Math.atan2(targetY - this.shape.y, targetX - this.shape.x);
      this.speed.multiplier *= 3;
    
      this.velocity.x += this.speed.value * Math.cos(this.angle) * dt;
      this.velocity.y += this.speed.value * Math.sin(this.angle) * dt;
    } else if (this.jumpTimer.finished) {
      this.jumpTimer.renew();
      this.angle += helpers.random(-Math.PI, Math.PI) / 2;

      this.velocity.x += this.speed.value * Math.cos(this.angle);
      this.velocity.y += this.speed.value * Math.sin(this.angle);
    }

    this.velocity.scale(0.95);
    this.shape.x += this.velocity.x;
    this.shape.y += this.velocity.y;
  }

  processTargetsCollision(entity, response) {
    if (this.isFlying) {
      entity.damaged(this.damage.value, this);
      
      const angle = helpers.angle(this.shape.x, this.shape.y, entity.shape.x, entity.shape.y);
      entity.velocity.x -= 2 * Math.cos(angle);
      entity.velocity.y -= 2 * Math.sin(angle);
    } else {
      const selfWeight = this.weight;
      const targetWeight = entity.weight;
      const totalWeight = selfWeight + targetWeight;
  
      const mtv = this.shape.getCollisionOverlap(response);
      const selfMtv = mtv.clone().scale(targetWeight / totalWeight);
      const targetMtv = mtv.clone().scale(selfWeight / totalWeight * -1);
      entity.shape.applyCollision(targetMtv);
      this.shape.applyCollision(selfMtv);
    }
  }

  damaged(damage, entity) {
    this.health.damaged(damage);
    this.isFlying = true;
    this.target = entity;
    this.angryTimer.renew();

    if (this.health.isDead) {
      this.remove();
    }
  }

  createState() {
    const state = super.createState();
    state.angle = this.angle;
    state.isFlying = this.isFlying;
    state.health = this.health.value.value;
    state.maxHealth = this.health.max.value;
    return state;
  }

  remove() {
    super.remove();
  
    this.createInstance();
  }

  cleanup() {
    super.cleanup();

    this.health.cleanup();
    this.speed.reset();
    this.damage.reset();
  }
}

module.exports = ChimeraMob;
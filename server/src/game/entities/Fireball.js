const Property = require('../components/Property');
const Timer = require('../components/Timer');
const Circle = require('../shapes/Circle');
const Entity = require('./Entity');
const Types = require('../Types');

class Fireball extends Entity {
  static defaultDefinition = {
    size: 50,
    angle: 0,
    speed: 40,
    damage: 2,
    duration: [5, 10],
    position: [0, 0],
  };

  constructor(game, definition) {
    definition = Object.assign({ size: 50, position: [0, 0] }, definition);
    super(game, Types.Entity.Fireball, definition);

    this.shape = Circle.create(0, 0, this.size);
    this.speed = new Property(this.definition.speed);
    this.damage = new Property(this.definition.damage);
    this.duration = new Timer(0, this.definition.duration[0], this.definition.duration[1]);
    this.angle = this.definition.angle;
    this.targets.push(Types.Entity.Player);

    this.spawn();
    this.duration.renew();
  }

  update(dt) {
    this.shape.x += this.speed.value * Math.cos(this.angle);
    this.shape.y += this.speed.value * Math.sin(this.angle);

    this.duration.update(dt);
    if (this.duration.finished) {
      this.remove();
    }
  }

  processTargetsCollision(entity, response) {
    const mtv = this.shape.getCollisionOverlap(response);
    entity.velocity.sub(mtv.scale(0.1));
    entity.damaged(this.damage.value, this);
  }

  createState() {
    const state = super.createState();
    state.angle = this.angle;
    return state;
  }
}

module.exports = Fireball;

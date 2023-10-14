const SAT = require('sat');
const Polygon = require('./shapes/Polygon');
const Biome = require('./biomes/Biome');
const EarthBiome = require('./biomes/EarthBiome');
const FireBiome = require('./biomes/FireBiome');
const IceBiome = require('./biomes/IceBiome');
const River = require('./biomes/River');
const Safezone = require('./biomes/Safezone');
const House1 = require('./entities/mapObjects/House1');
const MossyRock = require('./entities/mapObjects/MossyRock');
const Pond = require('./entities/mapObjects/Pond');
const Bush = require('./entities/mapObjects/Bush');
const IceMound = require('./entities/mapObjects/IceMound');
const IcePond = require('./entities/mapObjects/IcePond');
const IceSpike = require('./entities/mapObjects/IceSpike');
const Rock = require('./entities/mapObjects/Rock');
const LavaRock = require('./entities/mapObjects/LavaRock');
const LavaPool = require('./entities/mapObjects/LavaPool');
const Chest = require('./entities/Chest');
const Coin = require('./entities/Coin');
const PlayerAI = require('./entities/PlayerBot');
const WolfMob = require('./entities/mobs/Wolf');
const BunnyMob = require('./entities/mobs/Bunny');
const MooseMob = require('./entities/mobs/Moose');
const ChimeraMob = require('./entities/mobs/Chimera');
const YetiMob = require('./entities/mobs/Yeti');
const RokuMob = require('./entities/mobs/Roku');
const Fireball = require('./entities/Fireball');
const Types = require('./Types');
const map = require('./maps/main');
const helpers = require('../helpers');

class GameMap {
  constructor(game) {
    this.game = game;
    this.biomes = [];
    this.staticObjects = [];
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.safezone = null;
    this.shape = null;

    this.coinsCount = map.coinsCount !== undefined ? map.coinsCount : 100;
    this.chestsCount = map.chestCount !== undefined ? map.chestsCount : 50;
    this.aiPlayersCount = map.aiPlayersCount !== undefined ? map.aiPlayersCount : 10;
  }

  initialize() {
    for (const biomeData of map.biomes) {
      this.addBiome(biomeData);
    }
    this.biomes.forEach(biome => biome.initialize()); // Initialize biomes after they're added to map.biomes
    this.calculateMapBounds();

    for (let i = 0; i < this.chestsCount; i++) {
      this.addEntity({
        type: Types.Entity.Chest,
        respawnable: true,
        spawnZone: this.shape,
      });
    }
    for (let i = 0; i < this.coinsCount; i++) {
      this.addEntity({
        type: Types.Entity.Coin,
        respawnable: true,
        spawnZone: this.shape,
      });
    }
    for (let i = 0; i < this.aiPlayersCount; i++) {
      this.spawnPlayerBot();
    }
  }

  spawnPlayerBot() {
    this.addAI({
      type: Types.Entity.Player,
      name: `${helpers.randomNickname()}Bot`,
      isPlayer: true,
    });
  }

  addAI(objectData) {
    let ObjectClass;
    switch (objectData.type) {
      case Types.Entity.Player: ObjectClass = PlayerAI; break;
    }

    if (!ObjectClass) return console.warn('Unknown entity type: ', objectData);

    const entity = new ObjectClass(this.game, objectData);
    if (objectData.isPlayer) {
      this.game.players.add(entity);
    }
    this.game.addEntity(entity);
    return entity;
  }

  addEntity(objectData) {
    let ObjectClass;
    switch (objectData.type) {
      case Types.Entity.MossyRock: ObjectClass = MossyRock; break;
      case Types.Entity.Pond: ObjectClass = Pond; break;
      case Types.Entity.Bush: ObjectClass = Bush; break;
      case Types.Entity.IceMound: ObjectClass = IceMound; break;
      case Types.Entity.IcePond: ObjectClass = IcePond; break;
      case Types.Entity.IceSpike: ObjectClass = IceSpike; break;
      case Types.Entity.Rock: ObjectClass = Rock; break;
      case Types.Entity.LavaRock: ObjectClass = LavaRock; break;
      case Types.Entity.LavaPool: ObjectClass = LavaPool; break;
      case Types.Entity.Chest: ObjectClass = Chest; break;
      case Types.Entity.Coin: ObjectClass = Coin; break;
      case Types.Entity.Wolf: ObjectClass = WolfMob; break;
      case Types.Entity.Bunny: ObjectClass = BunnyMob; break;
      case Types.Entity.Moose: ObjectClass = MooseMob; break;
      case Types.Entity.Chimera: ObjectClass = ChimeraMob; break;
      case Types.Entity.Yeti: ObjectClass = YetiMob; break;
      case Types.Entity.Fireball: ObjectClass = Fireball; break;
      case Types.Entity.Roku: ObjectClass = RokuMob; break;
    }

    if (!ObjectClass) return console.warn('Unknown entity type: ', objectData);

    const entity = new ObjectClass(this.game, objectData);
    if (entity.isStatic) {
      this.staticObjects.push(entity);
    }
    this.game.addEntity(entity);
    return entity;
  }

  addBiome(biomeData) {
    let BiomeClass = Biome;
    switch (biomeData.type) {
      case Types.Biome.Safezone: BiomeClass = Safezone; break;
      case Types.Biome.River: BiomeClass = River; break;
      case Types.Biome.Earth: BiomeClass = EarthBiome; break;
      case Types.Biome.Fire: BiomeClass = FireBiome; break;
      case Types.Biome.Ice: BiomeClass = IceBiome; break;
    }

    const biome = new BiomeClass(this.game, biomeData);
    this.biomes.push(biome);
    if (biome.type === Types.Biome.Safezone) {
      this.safezone = biome;
    }
    return biome;
  }

  spawnPlayer(player) {
    this.safezone.shape.randomSpawnInside(player.shape);
  }

  calculateMapBounds() {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    for (const biome of this.biomes) {
      const bounds = biome.shape.boundary;
      if (minX > bounds.x) minX = bounds.x;
      if (minY > bounds.y) minY = bounds.y;
      if (maxX < bounds.x + bounds.width) maxX = bounds.x + bounds.width;
      if (maxY < bounds.y + bounds.height) maxY = bounds.y + bounds.height;
    }

    this.x = minX;
    this.y = minY;
    this.width = maxX - minX;
    this.height = maxY - minY;
    this.shape = Polygon.createFromRectangle(this.x, this.y, this.width, this.height);
  }

  processBorderCollision(entity, dt) {
    const bounds = entity.shape.boundary;

    if (entity.forbiddenBiomes.length > 0) {
      const response = new SAT.Response();
      for (const biome of entity.forbiddenBiomes) {
        if (biome.shape.collides(entity.shape, response)) {
          const mtv = entity.shape.getCollisionOverlap(response);
          entity.velocity.add(mtv.scale(dt));
          entity.angle = Math.atan2(mtv.y, mtv.x);
          entity.target = null; // if the entity is targeting someone reset the target, coz he reached forbidden zone
          break;
        }
      }
    }

    if (bounds.x < this.x) {
      entity.shape.x = this.x + bounds.width * (0.5 - entity.shape.centerOffset.x);
    } else if (bounds.x + bounds.width >= this.x + this.width) {
      entity.shape.x = this.x + this.width - bounds.width * (0.5 + entity.shape.centerOffset.x);
    }
    if (bounds.y < this.y) {
      entity.shape.y = this.y + bounds.height * (0.5 - entity.shape.centerOffset.y);
    } else if (bounds.y + bounds.height >= this.y + this.height) {
      entity.shape.y = this.y + this.height - bounds.height * (0.5 + entity.shape.centerOffset.y);
    }
  }

  getData() {
    const biomesData = this.biomes.map((biome) => biome.getData());
    return {
      biomes: biomesData,
      staticObjects: this.staticObjects.map((obj) => obj.createState()),
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}

module.exports = GameMap;

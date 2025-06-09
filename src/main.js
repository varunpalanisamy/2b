"use strict";

const config = {
  type: Phaser.AUTO,
  width:  800,
  height: 600,
  parent: "phaser-game",
  scene: [GameScene],
  physics: {
    default: "arcade",
    arcade: { debug: false }
  }
};

new Phaser.Game(config);

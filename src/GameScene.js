// src/GameScene.js
class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");

        // tuning constants
        this.PLAYER_SPEED = 250;
        this.FIRE_RATE    = 400;  // ms between shots

        // game state
        this.lastFired = 0;
        this.health    = 3;
        this.score     = 0;
    }

    preload() {
        this.load.setPath("assets/");

        // background
        this.load.image("bg1", "bg_layer1.png");

        // player
        this.load.image("player", "oshawott-removebg-preview.png");

        // projectiles
        this.load.image("bubble", "soap-bubble-free-vector.png");
        this.load.image("enemyBullet", "flame.png");

        // enemies
        this.load.image("enemy1", "tepig-removebg-preview.png");
        this.load.image("enemy2", "charmander-removebg-preview.png");

        // UI
        this.load.image("heart", "pokeheart.png");
        this.load.image("text_score", "text_score.png");
        for (let i = 0; i <= 9; i++) {
            this.load.image(`text_${i}`, `text_${i}.png`);
        }

        // game-over & ready
        this.load.image("gameover", "text_gameover.png");
        this.load.image("btn_ready", "text_ready.png");

        // sounds
        this.load.audio("hit",   "impactGlass_medium_003.ogg");
        this.load.audio("shoot", "impactPlank_medium_003.ogg");
    }

    create() {
        // 1) world
        this.add.image(400, 300, "bg1");

        // 2) player
        this.player = this.physics.add
            .sprite(400, 550, "player")
            .setCollideWorldBounds(true)
            .setScale(0.5);

        // 3) input
        this.cursors  = this.input.keyboard.createCursorKeys();
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // 4) groups
        this.bullets      = this.physics.add.group();
        this.enemies      = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();

        // 5) sounds
        this.hitSound   = this.sound.add("hit");
        this.shootSound = this.sound.add("shoot");

        // 6) UI — hearts
        this.lives = [];
        for (let i = 0; i < 3; i++) {
            let heart = this.add.image(700 + i * 30, 25, "heart")
                                .setScale(0.05)
                                .setDepth(10);
            this.lives.push(heart);
        }

        // 7) UI — score
        this.add.image(20, 25, "text_score")
            .setScale(0.4)
            .setOrigin(0, 0.5)
            .setDepth(10);

        this.scoreDigits = [];
        for (let i = 0; i < 5; i++) {
            let d = this.add.image(100 + i * 18, 25, "text_0")
                        .setScale(0.4)
                        .setOrigin(0, 0.5)
                        .setDepth(10);
            this.scoreDigits.push(d);
        }

        // 8) collisions
        this.physics.add.overlap(this.bullets,      this.enemies,      this.handleBulletEnemyCollision, null, this);
        this.physics.add.overlap(this.enemyBullets, this.player,       this.handlePlayerHit,          null, this);

        // 9) wave timer
        this.time.addEvent({
            delay:    2000,
            callback: this.spawnWave,
            callbackScope: this,
            loop: true
        });

        // 10) game-over UI (hidden)
        this.isGameOver = false;
        this.gameOverGroup = this.add.group();

        const goText = this.add.image(400, 200, "gameover")
                             .setOrigin(0.5)
                             .setDepth(20)
                             .setScale(0.5);

        const btn = this.add.image(400, 300, "btn_ready")
                         .setInteractive({ useHandCursor: true })
                         .setOrigin(0.5)
                         .setDepth(20)
                         .setScale(0.5);

        btn.on("pointerup", () => this.scene.restart());

        this.gameOverGroup.addMultiple([goText, btn]);
        this.gameOverGroup.setVisible(false);
    }

    update(time) {
        if (this.isGameOver) return;

        // player movement
        if (this.cursors.left.isDown)        this.player.setVelocityX(-this.PLAYER_SPEED);
        else if (this.cursors.right.isDown)  this.player.setVelocityX( this.PLAYER_SPEED);
        else                                  this.player.setVelocityX( 0);

        // shooting
        if (this.spacebar.isDown && time > this.lastFired + this.FIRE_RATE) {
            let b = this.bullets.create(this.player.x, this.player.y - 20, "bubble");
            b.setVelocityY(-300)
             .setScale(0.05);
            this.shootSound.play();
            this.lastFired = time;
        }

        // clean off-screen enemy bullets
        this.enemyBullets.getChildren().forEach(b => {
            if (b.y > 600) b.destroy();
        });

        // enemies fire randomly
        this.enemies.getChildren().forEach(enemy => {
            if (Phaser.Math.Between(0, 1000) > 995) {
                let b = this.enemyBullets.create(enemy.x, enemy.y + 10, "enemyBullet");
                b.setVelocityY(150)
                 .setScale(0.25);
            }
        });
    }

    spawnWave() {
        let count = Phaser.Math.Between(2, 4);
        for (let i = 0; i < count; i++) {
            let type = Phaser.Utils.Array.GetRandom(["enemy1", "enemy2"]);
            let x    = Phaser.Math.Between(50, 750);
            let y    = Phaser.Math.Between(-50, -10);
            this.enemies.create(x, y, type)
                        .setVelocityY(Phaser.Math.Between(20, 60))
                        .setScale(0.35);
        }
    }

    handleBulletEnemyCollision(b, e) {
        b.destroy();
        e.destroy();
        this.hitSound.play();
        this.score += 10;
        this.updateScore();
    }

    handlePlayerHit(p, b) {
        b.destroy();
        this.hitSound.play();
        this.health--;
        if (this.health >= 0) this.lives[this.health].setVisible(false);

        if (this.health <= 0) {
            this.isGameOver = true;
            this.gameOverGroup.setVisible(true);
        }
    }

    updateScore() {
        let s = this.score.toString().padStart(5, "0");
        for (let i = 0; i < this.scoreDigits.length; i++) {
            this.scoreDigits[i].setTexture(`text_${s[i]}`);
        }
    }
}

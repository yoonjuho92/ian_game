import { useEffect } from 'react';
import Phaser from 'phaser';

const GameComponent = () => {
  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game-container',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 300 },
          debug: false
        }
      },
      scene: {
        preload: preload,
        create: create,
        update: update
      }
    };

    let player;
    let stars;
    let bombs;
    let platforms;
    let cursors;
    let score = 0;
    let gameOver = false;
    let scoreText;
    let gameOverText;
    let restartButton;

    function preload() {
      this.load.image('sky', 'assets/sky.png');
      this.load.image('ground', 'assets/platform.png');
      this.load.image('star', 'assets/star.png');
      this.load.image('bomb', 'assets/bomb.png');
      this.load.image('player', 'assets/dude.png');
    }

    function create() {
      // Background
      this.add.image(400, 300, 'sky');

      // Platforms
      platforms = this.physics.add.staticGroup();
      platforms.create(400, 568, 'ground').setScale(2).refreshBody();
      platforms.create(600, 400, 'ground');
      platforms.create(50, 250, 'ground');
      platforms.create(750, 220, 'ground');

      // Player - simplified to use single image
      player = this.physics.add.sprite(100, 450, 'player');
      player.setBounce(0.2);
      player.setCollideWorldBounds(true);
      player.setFlipX(true);

      // Input
      cursors = this.input.keyboard.createCursorKeys();

      // Stars
      stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
      });

      stars.children.iterate((child) => {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
      });

      // Bombs
      bombs = this.physics.add.group();
      const initialBomb = bombs.create(400, 16, 'bomb');
      initialBomb.setScale(2);
      initialBomb.setBounce(1);
      initialBomb.setCollideWorldBounds(true);
      initialBomb.setVelocity(Phaser.Math.Between(-100, 100), 10);
      initialBomb.allowGravity = false;

      // Score
      scoreText = this.add.text(16, 16, 'Score: 0', { 
        fontSize: '32px', 
        fill: '#FFF' 
      });

      // Game Over Text (hidden initially)
      gameOverText = this.add.text(400, 250, '게임 오버', {
        fontSize: '64px',
        fill: '#000',
        fontWeight: 'bold'
      });
      gameOverText.setOrigin(0.5);
      gameOverText.setVisible(false);

      // Restart Button (hidden initially)
      restartButton = this.add.text(400, 350, '다시 해볼까요?', {
        fontSize: '32px',
        fill: '#000',
        padding: { y: 10 }
      });
      restartButton.setOrigin(0.5);
      restartButton.setInteractive({ useHandCursor: true });
      restartButton.on('pointerdown', restartGame, this);
      restartButton.setVisible(false);

      // Collisions
      this.physics.add.collider(player, platforms);
      this.physics.add.collider(stars, platforms);
      this.physics.add.collider(bombs, platforms);
      this.physics.add.overlap(player, stars, collectStar, null, this);
      this.physics.add.collider(player, bombs, hitBomb, null, this);
    }

    function update() {
      if (gameOver) {
        return;
      }

      if (cursors.left.isDown) {
        player.setVelocityX(-180);
        player.setFlipX(false);
      } else if (cursors.right.isDown) {
        player.setVelocityX(180);
        player.setFlipX(true);
      } else {
        player.setVelocityX(0);
      }

      if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-340);
      }
    }

    function collectStar(player, star) {
      star.disableBody(true, true);
      score += 10;
      scoreText.setText('Score: ' + score);

      if (stars.countActive(true) === 0) {
        stars.children.iterate((child) => {
          child.enableBody(true, child.x, 0, true, true);
        });

        const x = (player.x < 400) 
          ? Phaser.Math.Between(400, 800) 
          : Phaser.Math.Between(0, 400);

        const bomb = bombs.create(x, 16, 'bomb');
        bomb.setScale(2);
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-100, 100), 10);
        bomb.allowGravity = false;
      }
    }

    function hitBomb(player, bomb) {
      this.physics.pause();
      player.setTint(0xff0000);
      gameOver = true;
      gameOverText.setText('최종 점수: ' + score);
      
      // Show game over text and restart button
      gameOverText.setVisible(true);
      restartButton.setVisible(true);
    }

    function restartGame() {
      // Reset game state
      gameOver = false;
      score = 0;
      
      // Hide game over text and restart button
      gameOverText.setVisible(false);
      restartButton.setVisible(false);
      
      // Reset player
      player.setTint(0xffffff);
      player.setX(100);
      player.setY(450);
      
      // Clear existing bombs
      bombs.clear(true, true);
      
      // Create initial bomb
      const bomb = bombs.create(400, 16, 'bomb');
      bomb.setScale(2);
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-100, 100), 10);
      bomb.allowGravity = false;
      
      // Reset stars
      stars.children.iterate((child) => {
        child.enableBody(true, child.x, 0, true, true);
      });
      
      // Reset score
      scoreText.setText('Score: 0');
      
      // Resume physics
      this.physics.resume();
    }

    // Create game instance
    const game = new Phaser.Game(config);

    // Cleanup on unmount
    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div id="game-container" className="w-full h-full" />
  );
};

export default GameComponent;
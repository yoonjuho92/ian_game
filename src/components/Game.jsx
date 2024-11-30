import { useEffect } from 'react';
import Phaser from 'phaser';

const GameComponent = () => {
  useEffect(() => {
    class BaseLevel extends Phaser.Scene {
      constructor(config) {
        super(config);
        this.score = 0;
        this.gameOver = false;
        this.canProgress = false;
      }
    
      init(data) {
        this.score = data.score || 0;
      }
    
      preload() {
        // 공통 에셋 (모든 레벨에서 동일)
        this.load.image('platform', 'assets/platform.png');
        this.load.image('player', 'assets/dude.png');
        this.load.image('arrow', 'assets/arrow.png');
        
        // 레벨별로 다른 에셋
        this.loadLevelAssets();
      }
    
      loadLevelAssets() {}
    
      create() {
        // 배경 생성
        this.add.image(400, 300, this.backgroundKey);
        
        // 커서 생성
        this.cursors = this.input.keyboard.createCursorKeys();
        
        this.createPlatforms();
        this.createPlayer();
        this.createStars();
        this.createBombs();
        this.createUI();
        this.setupCollisions();
      }

      createPlatforms() {
        this.platforms = this.physics.add.staticGroup();
        // platform은 공통 이미지를 사용
        this.platforms.create(400, 568, 'platform').setScale(2).refreshBody();
        this.platforms.create(600, 400, 'platform');
        this.platforms.create(50, 250, 'platform');
        this.platforms.create(750, 220, 'platform');
      }

      createPlayer() {
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.player.setFlipX(true);
      }

      createStars() {
        this.stars = this.physics.add.group({
          key: 'star',
          repeat: 11,
          setXY: { x: 12, y: 0, stepX: 70 }
        });

        this.stars.children.iterate((child) => {
          child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });
      }

      createBombs() {
        this.bombs = this.physics.add.group();
        this.createNewBomb();
      }

      createUI() {
        this.scoreText = this.add.text(16, 16, 'Score: ' + this.score, { 
          fontSize: '32px', 
          fill: '#FFF' 
        });

        this.gameOverText = this.add.text(400, 250, '게임 오버', {
          fontSize: '64px',
          fill: '#FFF',
          fontWeight: 'bold'
        });
        this.gameOverText.setOrigin(0.5);
        this.gameOverText.setVisible(false);

        this.restartButton = this.add.text(400, 350, '다시 해볼까요?', {
          fontSize: '32px',
          fill: '#FFF',
          padding: { y: 10 }
        });
        this.restartButton.setOrigin(0.5);
        this.restartButton.setInteractive({ useHandCursor: true });
        this.restartButton.on('pointerdown', this.restartGame, this);
        this.restartButton.setVisible(false);
        this.nextLevelArrow = this.physics.add.staticImage(750, 300, 'arrow');
        this.nextLevelArrow.setVisible(false);
      }

      setupCollisions() {
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.bombs, this.platforms);
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);
        this.physics.add.overlap(this.player, this.nextLevelArrow, this.goToNextLevel, null, this);
      }

      update() {
        if (this.gameOver) {
          return;
        }

        if (this.cursors.left.isDown) {
          this.player.setVelocityX(-180);
          this.player.setFlipX(false);
        } else if (this.cursors.right.isDown) {
          this.player.setVelocityX(180);
          this.player.setFlipX(true);
        } else {
          this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.player.body.touching.down) {
          this.player.setVelocityY(-340);
        }

        if (this.canProgress && this.nextLevelArrow.visible) {
          this.nextLevelArrow.alpha = 0.5 + Math.sin(this.time.now / 200) * 0.5;
        }
      }

      createNewBomb() {
        const x = (this.player.x < 400) 
          ? Phaser.Math.Between(400, 800) 
          : Phaser.Math.Between(0, 400);

        const bomb = this.bombs.create(x, 16, this.bombKey);
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-100, 100), 10);
        bomb.allowGravity = false;
      }

      collectStar(player, star) {
        star.disableBody(true, true);
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);

        if (this.score >= this.targetScore && !this.canProgress) {
          this.canProgress = true;
          this.nextLevelArrow.setVisible(true);
          
          const successText = this.add.text(400, 200, '축하합니다!\n다음 레벨로 이동하세요', {
            fontSize: '32px',
            fill: '#FFF',
            align: 'center'
          });
          successText.setOrigin(0.5);
          
          this.time.delayedCall(3000, () => {
            successText.destroy();
          });
        }

        if (this.stars.countActive(true) === 0) {
          this.stars.children.iterate((child) => {
            child.enableBody(true, child.x, 0, true, true);
          });
          this.createNewBomb();
        }
      }

      hitBomb(player, bomb) {
        this.physics.pause();
        player.setTint(0xff0000);
        this.gameOver = true;
        this.gameOverText.setText('최종 점수: ' + this.score);
        
        this.gameOverText.setVisible(true);
        this.restartButton.setVisible(true);
        this.nextLevelArrow.setVisible(false);
      }

      restartGame() {
        this.scene.restart({ score: 0 });
      }

      goToNextLevel() {
        if (this.canProgress) {
          this.scene.start(this.nextLevel, { score: this.score });
        }
      }
    }

    class Level1 extends BaseLevel {
      constructor() {
        super({ key: 'Level1' });
        this.backgroundKey = 'sky1';
        this.bombKey = 'bomb1';
        this.targetScore = 240;
        this.nextLevel = 'Level2';
      }
    
      loadLevelAssets() {
        this.load.image('sky1', 'assets/sky.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('bomb1', 'assets/bomb1.png');
      }
    }

    class Level2 extends BaseLevel {
      constructor() {
        super({ key: 'Level2' });
        this.backgroundKey = 'sky2';
        this.bombKey = 'bomb2'; 
        this.targetScore = 480;
        this.nextLevel = 'Level3';
      }
    
      loadLevelAssets() {
        this.load.image('sky2', 'assets/sky2.png');
        this.load.image('star', 'assets/star2.png');
        this.load.image('bomb2', 'assets/bomb2.png');
      }
    }

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
      scene: [Level1, Level2]
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div id="game-container" style={{ width: '800px', height: '600px' }} />
  );
};

export default GameComponent;
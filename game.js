/* A game where you are a hot balloon and you move upwards and you avoid obstacles and collect balloons to gain points */
/* The obstacles are the clouds and the balloons are the points */
/* The balloons are randomly generated and they move downwards */
/* The player can move left and right to avoid the obstacles */
/* The player can collect the balloons to gain points */
/* The player can lose if they hit an obstacle */
/* The points are displayed on the screen */

// Phaser 3 Game Configuration
// Reference: https://photonstorm.github.io/phaser3-docs/Phaser.Types.Core.html#.GameConfig
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    backgroundColor: '#87CEEB'
};

const game = new Phaser.Game(config);

// Game variables
let player;
let cursors;
let clouds;
let balloons;
let score = 0;
let scoreText;
let gameOver = false;
let difficultyMultiplier = 1;
let gameTime = 0;

// Phaser Scene Functions
// Reference: https://photonstorm.github.io/phaser3-docs/Phaser.Scene.html

function preload() {
    // No assets to preload - using simple shapes
}

function create() {
    // Create player hot air balloon
    // Using Phaser.GameObjects.Graphics for simple shapes
    // Reference: https://photonstorm.github.io/phaser3-docs/Phaser.GameObjects.Graphics.html
    this.sceneStartTime = this.time.now;
    // Create a graphics object for the balloon
    const balloonGraphics = this.add.graphics();
    balloonGraphics.fillStyle(0xFF6347, 1); // Tomato red color
    balloonGraphics.fillCircle(0, 0, 20); // Balloon circle
    balloonGraphics.fillStyle(0x8B4513, 1); // Brown color for basket
    balloonGraphics.fillRect(-10, 20, 20, 15); // Basket rectangle
    
    // Generate texture from graphics
    balloonGraphics.generateTexture('playerBalloon', 40, 50);
    balloonGraphics.destroy();
    
    // Create player sprite at bottom center
    // Reference: https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.Sprite.html
    player = this.physics.add.sprite(400, 550, 'playerBalloon');
    player.setCollideWorldBounds(true);
    
    // Adjust player collision body to absolute minimum - zero margin
    // Reference: https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.Body.html#setSize
    player.body.setSize(16, 20); // Extremely small core only
    player.body.setOffset(12, 15); // Centered precisely
    
    // Set up keyboard controls (arrow keys)
    // Reference: https://photonstorm.github.io/phaser3-docs/Phaser.Input.Keyboard.html
    cursors = this.input.keyboard.createCursorKeys();
    
    // Create cloud texture (obstacle)
    const cloudGraphics = this.add.graphics();
    cloudGraphics.fillStyle(0xFFFFFF, 0.8); // White with slight transparency
    cloudGraphics.fillCircle(0, 0, 15);
    cloudGraphics.fillCircle(20, 0, 18);
    cloudGraphics.fillCircle(40, 0, 15);
    cloudGraphics.fillCircle(10, -5, 12);
    cloudGraphics.fillCircle(30, -5, 12);
    cloudGraphics.generateTexture('cloud', 60, 40);
    cloudGraphics.destroy();
    
    // Create group for clouds
    // Reference: https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.Group.html
    clouds = this.physics.add.group();
    
    // Timer to spawn clouds periodically
    // Reference: https://photonstorm.github.io/phaser3-docs/Phaser.Time.TimerEvent.html
    this.time.addEvent({
        delay: 750, // Spawn every 0.75 seconds (twice as many)
        callback: spawnCloud,
        callbackScope: this,
        loop: true
    });
   // Create collectible balloon texture (oval) - replacement block
const collectibleGraphics = this.add.graphics();

// Make sure texture canvas is tall enough so the top isn't clipped
const texW = 36;
const texH = 56;

// Draw the oval balloon centered in the texture
collectibleGraphics.fillStyle(0xFFD700, 1); // Gold color
// centerX, centerY, width, height
collectibleGraphics.fillEllipse(texW / 2, texH / 2 - 6, 24, 34);

// Optional: little "tie" at bottom of balloon
collectibleGraphics.fillStyle(0xCC9A00, 1);
collectibleGraphics.beginPath();
collectibleGraphics.moveTo(texW / 2 - 4, texH / 2 + 11);
collectibleGraphics.lineTo(texW / 2 + 4, texH / 2 + 11);
collectibleGraphics.lineTo(texW / 2, texH / 2 + 16);
collectibleGraphics.closePath();
collectibleGraphics.fillPath();

// Draw the string (from tie downwards)
collectibleGraphics.lineStyle(2, 0x000000, 1);
collectibleGraphics.beginPath();
collectibleGraphics.moveTo(texW / 2, texH / 2 + 16);
collectibleGraphics.lineTo(texW / 2, texH - 6);
collectibleGraphics.strokePath();

// Generate a texture slightly larger vertically so nothing clips
collectibleGraphics.generateTexture('collectible', texW, texH);
collectibleGraphics.destroy();
    
    // Create group for collectible balloons
    balloons = this.physics.add.group();
    
    // Timer to spawn collectible balloons periodically
    this.time.addEvent({
        delay: 667, // Spawn every 0.667 seconds (3x more frequent)
        callback: spawnBalloon,
        callbackScope: this,
        loop: true
    });
    
    // Set up collision detection
    // Reference: https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.World.html#addCollider
    
    // Collision between player and clouds (game over)
    this.physics.add.overlap(player, clouds, hitCloud, null, this);
    
    // Collision between player and collectible balloons (gain points)
    this.physics.add.overlap(player, balloons, collectBalloon, null, this);
    
    // Create score text
    // Reference: https://photonstorm.github.io/phaser3-docs/Phaser.GameObjects.Text.html
    scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    });
    scoreText.setScrollFactor(0);
    scoreText.setDepth(100);
}

function update(time, delta) {
    if (gameOver) {
        return;
    }
    
    // Player controls - move left and right
    // Reference: https://photonstorm.github.io/phaser3-docs/Phaser.Input.Keyboard.Key.html
    if (cursors.left.isDown) {
        player.x -= 5;
    } else if (cursors.right.isDown) {
        player.x += 5;
    }
    
    // Track game time for progressive difficulty
    gameTime = time;
    
    // Calculate difficulty multiplier based on time (increases every 10 seconds)
    const elapsed = this.time.now - this.sceneStartTime;
    difficultyMultiplier = 1 + (elapsed / 10000) * 0.5;
    
    // Remove clouds that go off screen (recycling)
    clouds.children.entries.forEach(cloud => {
        if (cloud.y > 650) {
            cloud.destroy();
        }
    });
    
    // Remove balloons that go off screen (recycling)
    if (balloons) {
        balloons.children.entries.forEach(balloon => {
            if (balloon.y > 650) {
                balloon.destroy();
            }
        });
    }
}

// Helper function to spawn clouds (obstacles)
function spawnCloud() {
    if (gameOver) {
        return;
    }
    
    // Random X position
    const x = Phaser.Math.Between(30, 770);
    
    // Create cloud sprite
    const cloud = clouds.create(x, -20, 'cloud');
    
    // Randomly select width: 3x, 2x, or 1x larger
    // Reference: https://photonstorm.github.io/phaser3-docs/Phaser.Utils.Array.html#.GetRandom
    const sizeOptions = [3, 2, 1];
    const scaleX = Phaser.Utils.Array.GetRandom(sizeOptions);
    cloud.setScale(scaleX, 1); // Scale width only, keep height at 1x
    
    // Adjust collision body to absolute minimum - fixed offset to avoid scaling issues on 3x
    // Reference: https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.Body.html#setSize
    cloud.body.setSize(15 * scaleX, 15); // Extremely small core
    cloud.body.setOffset(12, 12); // Fixed offset (not scaled) to keep consistent across all sizes
    
    // Set velocity with difficulty multiplier
    const baseSpeed = 100;
    cloud.setVelocityY(baseSpeed * difficultyMultiplier);
}

// Helper function to spawn collectible balloons
function spawnBalloon() {
    if (gameOver) {
        return;
    }
    
    // Random X position
    const x = Phaser.Math.Between(30, 770);
    
    // Create balloon sprite
    const balloon = balloons.create(x, -20, 'collectible');
    
    // Adjust collision body to absolute minimum - zero margin
    balloon.body.setSize(12, 12); // Extremely small core only
    balloon.body.setOffset(9, 9); // Precise centering on the balloon
    
    // Set velocity with difficulty multiplier
    const baseSpeed = 120;
    balloon.setVelocityY(baseSpeed * difficultyMultiplier);
}

// Collision handler for hitting a cloud (game over)
function hitCloud(player, cloud) {
    // Trigger game over
    gameOver = true;
    
    // Stop physics
    this.physics.pause();
    
    // Tint the player red
    player.setTint(0xff0000);
    
    // Display game over text
    const gameOverText = this.add.text(400, 250, 'GAME OVER', {
        fontSize: '64px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6
    });
    gameOverText.setOrigin(0.5);
    
    const finalScoreText = this.add.text(400, 320, 'Final Score: ' + score, {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    });
    finalScoreText.setOrigin(0.5);
    
    const restartText = this.add.text(400, 380, 'Press SPACE to Restart', {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 3
    });
    restartText.setOrigin(0.5);
    
    // Set up restart functionality
    this.input.keyboard.once('keydown-SPACE', () => {
        this.scene.restart();
        gameOver = false;
        score = 0;
        difficultyMultiplier = 1;
        
    });
}

// Collision handler for collecting a balloon (gain points)
function collectBalloon(player, balloon) {
    // Remove the balloon
    balloon.destroy();
    
    // Increase score
    score += 10;
    
    // Update score text
    scoreText.setText('Score: ' + score);
}

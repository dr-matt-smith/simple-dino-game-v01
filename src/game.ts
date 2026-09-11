console.log("Simple Dino Game (no web server needed)");

type GameState = "waiting" | "playing" | "gameOver";
type ObstacleType = "cactus-small" | "cactus-medium" | "cactus-wide";

interface Dino {
  x: number;
  y: number; 
  width: number;
  height: number;
  velocityY: number;
  isJumping: boolean;
  groundY: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
}

interface ObstacleTemplate {
  width: number;
  height: number;
  type: ObstacleType;
}

class DinoGame {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly scoreElement: HTMLElement;
  private readonly statusElement: HTMLElement;
  private readonly highScoreElement: HTMLElement | null;

  private readonly initialGameSpeed = 3;
  private frameCount = 0;
  private highScore: number;

  private gameState: GameState = "waiting";
  private score = 0;
  private gameSpeed = 2;

  private readonly dino: Dino;

  // Physics
  private readonly gravity = 0.6;
  private readonly jumpStrength = -12;

  // Ground
  private readonly groundY = 180;

  // Obstacles
  private obstacles: Obstacle[] = [];
  private obstacleSpawnTimer = 0;
  private obstacleSpawnRate = 120;
  private readonly minObstacleSpawnRate = 60;

  constructor() {
    this.highScore = this.loadHighScore();

    this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;
    this.scoreElement = document.getElementById("score")!;
    this.statusElement = document.getElementById("gameStatus")!;
    this.highScoreElement = document.getElementById("highScore");

    this.dino = {
      x: 50,
      y: 150,
      width: 40,
      height: 40,
      velocityY: 0,
      isJumping: false,
      groundY: 150,
    };

    this.init();
  }

  private init() {
    this.setupEventListeners();
    this.gameLoop();
    this.updateStatus("Press SPACE to Start!");
    this.updateHighScore();
  }

  private setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        this.handleJump(); 
      }   
    });
  }

  private handleJump() {
    if (this.gameState === "waiting") {
      this.startGame();
    } else if (this.gameState === "playing" && !this.dino.isJumping) {
      this.jump();
    } else if (this.gameState === "gameOver") {
      this.resetGame();
    }
  }

  private startGame() {
    this.gameState = "playing";
    this.score = 0;
    this.gameSpeed = this.initialGameSpeed;
    this.obstacles = [];
    this.obstacleSpawnTimer = 0;
    this.frameCount = 0;
    this.updateScore();
    this.updateStatus("");
  }

  private jump() {
    if (!this.dino.isJumping) {
      this.dino.velocityY = this.jumpStrength;
      this.dino.isJumping = true;
      console.log("Dino jumped!");
    }
  }

  private spawnObstacle() {
    const obstacleTypes: ObstacleTemplate[] = [
      { width: 20, height: 40, type: "cactus-small" },
      { width: 25, height: 50, type: "cactus-medium" },
      { width: 30, height: 35, type: "cactus-wide" },
    ];

    const obstacle =
      obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

    this.obstacles.push({
      x: this.canvas.width,
      y: this.groundY - obstacle.height,
      width: obstacle.width,
      height: obstacle.height,
      type: obstacle.type,
    });
  }

  private updateObstacles() {
    if (this.gameState !== "playing") return;

    this.obstacleSpawnTimer++;
    if (this.obstacleSpawnTimer >= this.obstacleSpawnRate) {
      this.spawnObstacle();
      this.obstacleSpawnTimer = 0;
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      this.obstacles[i].x -= this.gameSpeed;

      if (this.obstacles[i].x + this.obstacles[i].width < 0) {
        this.obstacles.splice(i, 1);
        this.score += 10;
      }
    }
  }

  private checkCollisions() {
    if (this.gameState !== "playing") return;

    for (const obstacle of this.obstacles) {
      const isOverlapping = this.dino.x < obstacle.x + obstacle.width &&
        this.dino.x + this.dino.width > obstacle.x &&
        this.dino.y < obstacle.y + obstacle.height &&
        this.dino.y + this.dino.height > obstacle.y;

      if (isOverlapping) {
        this.gameOver();
        return;
      }
    }
  }

  private updateGameDifficulty() {
    if (this.gameState !== "playing") return;

    const difficultyLevel = Math.floor(this.score / 200);
    this.gameSpeed = this.initialGameSpeed + difficultyLevel * 0.5;
    this.obstacleSpawnRate = Math.max(
      this.minObstacleSpawnRate,
      120 - difficultyLevel * 10,
    );
  }

  private updatePhysics() {
    if (this.gameState !== "playing") return;

    this.frameCount++;

    // Apply gravity
    this.dino.velocityY += this.gravity;
    this.dino.y += this.dino.velocityY;

    // Ground collision
    if (this.dino.y >= this.dino.groundY) {
      this.dino.y = this.dino.groundY;
      this.dino.velocityY = 0;
      this.dino.isJumping = false;
    }

    // Update score (continuous scoring)
    this.score += 0.1;
    this.updateScore();

    // Update obstacles
    this.updateObstacles();

    // Check collisions
    this.checkCollisions();

    // Update difficulty
    this.updateGameDifficulty();
  }

  private render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw obstacles
    this.drawObstacles();

    // Draw dino
    this.drawDino();

    // Draw instructions if waiting
    if (this.gameState === "waiting") {
      this.drawInstructions();
    }

    // Draw game over screen
    if (this.gameState === "gameOver") {
      this.drawGameOver();
    }
  }

  private drawDino() {
    const legOffset = this.gameState === "playing" && !this.dino.isJumping
      ? (Math.floor(this.frameCount / 10) % 2) * 2
      : 0;

    this.ctx.fillStyle = "green";
    this.ctx.fillRect(
      this.dino.x,
      this.dino.y,
      this.dino.width,
      this.dino.height,
    );

    this.ctx.fillStyle = "darkgreen";
    this.ctx.fillRect(this.dino.x + 25, this.dino.y + 8, 4, 4);
    this.ctx.fillRect(this.dino.x + 30, this.dino.y + 20, 8, 2);

    if (!this.dino.isJumping) {
      this.ctx.fillStyle = "green";
      this.ctx.fillRect(
        this.dino.x + 10,
        this.dino.y + 40 + legOffset,
        6,
        8 - legOffset,
      );
      this.ctx.fillRect(
        this.dino.x + 24,
        this.dino.y + 40 - legOffset,
        6,
        8 + legOffset,
      );
    }
  }

  private drawObstacles() {
    this.ctx.fillStyle = "olive";

    for (const obstacle of this.obstacles) {
      this.ctx.fillRect(
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height,
      );

      this.ctx.fillStyle = "darkolivegreen";
      if (obstacle.type === "cactus-small") {
        this.ctx.fillRect(obstacle.x - 3, obstacle.y + 10, 6, 4);
        this.ctx.fillRect(
          obstacle.x + obstacle.width - 3,
          obstacle.y + 20,
          6,
          4,
        );
      } else if (obstacle.type === "cactus-medium") {
        this.ctx.fillRect(obstacle.x - 4, obstacle.y + 8, 8, 6);
        this.ctx.fillRect(
          obstacle.x + obstacle.width - 4,
          obstacle.y + 15,
          8,
          6,
        );
        this.ctx.fillRect(
          obstacle.x + obstacle.width / 2 - 2,
          obstacle.y + 25,
          4,
          8,
        );
      } else if (obstacle.type === "cactus-wide") {
        this.ctx.fillRect(obstacle.x - 5, obstacle.y + 5, 10, 8);
        this.ctx.fillRect(
          obstacle.x + obstacle.width - 5,
          obstacle.y + 10,
          10,
          8,
        );
        this.ctx.fillRect(
          obstacle.x + obstacle.width / 2 - 3,
          obstacle.y + 20,
          6,
          6,
        );
      }

      this.ctx.fillStyle = "olive";
    }
  }

  private drawInstructions() {
    this.ctx.fillStyle = "black";
    this.ctx.font = "24px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Press SPACE to jump!",
      this.canvas.width / 2,
      this.canvas.height / 2 - 20,
    );
  }

  private updateScore() {
    this.scoreElement.textContent = String(Math.floor(this.score));
  }

  private updateStatus(message: string) {
    this.statusElement.textContent = message;
    this.statusElement.style.display = message ? "block" : "none";
  }

  private resetGame() {
    this.gameState = "waiting";
    this.score = 0;
    this.gameSpeed = this.initialGameSpeed;
    this.obstacles = [];
    this.obstacleSpawnTimer = 0;
    this.frameCount = 0;
    this.dino.y = this.dino.groundY;
    this.dino.velocityY = 0;
    this.dino.isJumping = false;
    this.updateScore();
    this.updateStatus("Press SPACE to Start!");
    console.log("Game reset!");
  }

  private gameLoop() {
    this.updatePhysics();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }

  private gameOver() {
    this.gameState = "gameOver";
    this.saveHighScore();
    this.updateHighScore();
    this.updateStatus("Game Over! Press SPACE to restart");
    console.log(`Game Over! Final Score: ${Math.floor(this.score)}`);
  }

  private loadHighScore(): number {
    return parseInt(localStorage.getItem("dinoHighScore") ?? "0") || 0;
  }

  private saveHighScore() {
    if (Math.floor(this.score) > this.highScore) {
      this.highScore = Math.floor(this.score);
      localStorage.setItem("dinoHighScore", String(this.highScore));
      console.log(`New High Score: ${this.highScore}!`);
    }
  }

  private updateHighScore() {
    if (this.highScoreElement) {
      this.highScoreElement.textContent = String(this.highScore);
    }
  }

  private drawGameOver() {
    // Semi-transparent overlay
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Game Over text
    this.ctx.fillStyle = "white";
    this.ctx.font = "36px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "GAME OVER",
      this.canvas.width / 2,
      this.canvas.height / 2 - 40,
    );

    // Final score
    this.ctx.font = "20px Arial";
    this.ctx.fillText(
      `Final Score: ${Math.floor(this.score)}`,
      this.canvas.width / 2,
      this.canvas.height / 2 - 5,
    );

    // High score
    if (Math.floor(this.score) === this.highScore && this.highScore > 0) {
      this.ctx.fillStyle = "gold";
      this.ctx.fillText(
        "🏆 NEW HIGH SCORE! 🏆",
        this.canvas.width / 2,
        this.canvas.height / 2 + 25,
      );
    } else if (this.highScore > 0) {
      this.ctx.fillStyle = "#CCCCCC";
      this.ctx.fillText(
        `High Score: ${this.highScore}`,
        this.canvas.width / 2,
        this.canvas.height / 2 + 25,
      );
    }

    // Restart instruction
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "16px Arial";
    this.ctx.fillText(
      "Press SPACE to restart",
      this.canvas.width / 2,
      this.canvas.height / 2 + 55,
    );
  }
}

addEventListener("load", () => {
  new DinoGame();
});

class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.velocityY = 0;
        this.gravity = 0.2;
        this.trail = [];
        this.maxTrailLength = 10;
    }

    update() {
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    flipGravity() {
        this.gravity = -this.gravity;
        this.velocityY = 0;
    }

    draw(ctx) {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        this.trail.forEach((pos, i) => {
            const alpha = i / this.trail.length;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.radius * alpha, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
            ctx.fill();
        });

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
}

class Tile {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    update(speed) {
        this.x -= speed;
    }

    draw(ctx) {
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#003300'; // darker green for reduced intensity
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.collected = false;
    }

    update(speed) {
        this.x -= speed;
    }

    draw(ctx) {
        if (this.collected) return;

        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
    }
}

class Enemy {
    constructor(x, y, radius = 12) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.angle = 0;
    }

    update(speed) {
        this.x -= speed;
        this.angle += 0.05;
        this.y += Math.sin(this.angle) * 2; // oscillation
    }

    draw(ctx) {
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff3333';
        ctx.fill();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 600;
        this.canvas.height = 400;

        this.reset();
        this.setupListeners();
    }

    reset() {
        this.ball = new Ball(100, this.canvas.height - 50);
        this.tiles = [];
        this.coins = [];
        this.enemies = [];
        this.score = 0;
        this.coinCount = 0;
        this.speed = 2;
        this.running = false;
        this.gameOver = false;
        this.generateInitialTiles();
    }

    setupListeners() {
        window.addEventListener('click', () => this.ball.flipGravity());
        window.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.ball.flipGravity();
        });
        document.getElementById('restartButton').addEventListener('click', () => this.restart());
        document.getElementById('startButton').addEventListener('click', () => {
            document.getElementById('startScreen').classList.add('hidden');
            this.running = true;
        });
    }

    generateInitialTiles() {
        for (let i = 0; i < 5; i++) {
            this.generateTilePair(this.canvas.width + i * 220);
        }
    }

    generateTilePair(x) {
        const tileHeight = 20;
        const tileWidth = 100 + Math.random() * 40;
        const spacing = 150 + Math.random() * 100;

        // Bottom tile
        this.tiles.push(new Tile(x, this.canvas.height - tileHeight, tileWidth, tileHeight));
        // Top tile
        this.tiles.push(new Tile(x, 0, tileWidth, tileHeight));

        // Coin
        if (Math.random() < 0.5) {
            this.coins.push(new Coin(x + tileWidth / 2, tileHeight + 25));
            this.coins.push(new Coin(x + tileWidth / 2, this.canvas.height - tileHeight - 25));
        }

        // Enemy
        if (Math.random() < 0.4) {
            const side = Math.random() < 0.5 ? tileHeight + 40 : this.canvas.height - tileHeight - 40;
            this.enemies.push(new Enemy(x + tileWidth / 2, side));
        }
    }

    update() {
        if (!this.running || this.gameOver) return;

        this.ball.update();
        this.score++;

        this.tiles.forEach(tile => tile.update(this.speed));
        this.coins.forEach(coin => coin.update(this.speed));
        this.enemies.forEach(enemy => enemy.update(this.speed));

        if (this.tiles[0].x + this.tiles[0].width < 0) {
            this.tiles.splice(0, 2);
            this.generateTilePair(this.canvas.width);
        }

        this.checkCollisions();
    }

    checkCollisions() {
        let onTile = false;

        for (const tile of this.tiles) {
            if (
                this.ball.y + this.ball.radius > tile.y &&
                this.ball.y - this.ball.radius < tile.y + tile.height &&
                this.ball.x + this.ball.radius > tile.x &&
                this.ball.x - this.ball.radius < tile.x + tile.width
            ) {
                onTile = true;
                this.ball.velocityY = 0;
                this.ball.y = this.ball.gravity > 0 ? tile.y - this.ball.radius : tile.y + tile.height + this.ball.radius;
            }
        }

        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            const dx = this.ball.x - coin.x;
            const dy = this.ball.y - coin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.ball.radius + coin.radius) {
                coin.collected = true;
                this.coinCount++;
                this.coins.splice(i, 1);
            }
        }

        for (const enemy of this.enemies) {
            const dx = this.ball.x - enemy.x;
            const dy = this.ball.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.ball.radius + enemy.radius) {
                this.endGame();
                return;
            }
        }

        if (!onTile && (this.ball.y < 0 || this.ball.y > this.canvas.height)) {
            this.endGame();
        }
    }

    endGame() {
        this.gameOver = true;
        this.running = false;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalCoins').textContent = this.coinCount;
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        this.ctx.lineWidth = 1;

        for (let x = 0; x < this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.tiles.forEach(tile => tile.draw(this.ctx));
        this.coins.forEach(coin => coin.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.ball.draw(this.ctx);

        document.getElementById('score').textContent = this.score;
        document.getElementById('coins').textContent = this.coinCount;
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    restart() {
        this.reset();
        document.getElementById('gameOver').classList.add('hidden');
        this.running = true;
    }
}

window.addEventListener('load', () => {
    const game = new Game();
    game.loop();
});

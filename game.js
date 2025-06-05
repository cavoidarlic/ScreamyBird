class ScreamyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.finalScoreElement = document.getElementById('finalScore');
        this.volumeLevelElement = document.getElementById('volumeLevel');
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.gameOverElement = document.getElementById('gameOver');
        
        this.gameRunning = false;
        this.score = 0;
        this.gameSpeed = 2;
        
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.volume = 0;
        this.volumeThreshold = 50;
        
        this.bird = {
            x: 100,
            y: 300,
            width: 40,
            height: 30,
            velocity: 0,
            lift: -8,
            gravity: 0.4,
            image: new Image()
        };
        
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 150;
        this.pipeFrequency = 150;
        this.frameCount = 0;
        
        // Frame rate limiting
        this.lastTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        
        this.init();
    }
    
    init() {
        this.bird.image.src = 'berd.png';
        this.setupEventListeners();
        this.setupMicrophone();
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
    }
    
    async setupMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            
            this.analyser.fftSize = 256;
            this.microphone.connect(this.analyser);
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            console.log('Microphone setup successful!');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Please allow microphone access to play the game!');
        }
    }
    
    getVolume() {
        if (!this.analyser || !this.dataArray) return 0;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        
        return sum / this.dataArray.length;
    }
    
    startGame() {
        this.gameRunning = true;
        this.score = 0;
        this.bird.y = 300;
        this.bird.velocity = 0;
        this.pipes = [];
        this.frameCount = 0;
        
        this.startBtn.style.display = 'none';
        this.gameOverElement.classList.add('hidden');
        
        this.gameLoop();
    }
    
    restartGame() {
        this.startGame();
    }
    
    update() {
        if (!this.gameRunning) return;
        
        this.volume = this.getVolume();
        this.updateVolumeIndicator();
        
        if (this.volume > this.volumeThreshold) {
            this.bird.velocity = this.bird.lift * (this.volume / 100);
        }
        
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        this.frameCount++;
        if (this.frameCount % this.pipeFrequency === 0) {
            this.createPipe();
        }
        
        this.pipes.forEach(pipe => {
            pipe.x -= this.gameSpeed;
            
            if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
                pipe.passed = true;
                if (pipe.y === 0) {
                    this.score++;
                }
            }
        });
        
        this.pipes = this.pipes.filter(pipe => pipe.x + this.pipeWidth > -50);
        
        this.checkCollisions();
        
        this.scoreElement.textContent = this.score;
    }
    
    createPipe() {
        const minHeight = 50;
        const maxHeight = this.canvas.height - this.pipeGap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        this.pipes.push({
            x: this.canvas.width,
            y: 0,
            width: this.pipeWidth,
            height: topHeight,
            passed: false
        });
        
        this.pipes.push({
            x: this.canvas.width,
            y: topHeight + this.pipeGap,
            width: this.pipeWidth,
            height: this.canvas.height - topHeight - this.pipeGap,
            passed: false
        });
    }
    
    checkCollisions() {
        if (this.bird.y <= 0 || this.bird.y + this.bird.height >= this.canvas.height) {
            this.gameOver();
            return;
        }
        
        this.pipes.forEach(pipe => {
            if (this.bird.x < pipe.x + pipe.width &&
                this.bird.x + this.bird.width > pipe.x &&
                this.bird.y < pipe.y + pipe.height &&
                this.bird.y + this.bird.height > pipe.y) {
                this.gameOver();
            }
        });
    }
    
    updateVolumeIndicator() {
        const percentage = Math.min((this.volume / 150) * 100, 100);
        this.volumeLevelElement.style.height = percentage + '%';
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawClouds();
        
        this.ctx.fillStyle = '#4CAF50';
        this.pipes.forEach(pipe => {
            this.ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
            
            this.ctx.strokeStyle = '#2E7D32';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);
        });
        
        if (this.bird.image.complete) {
            this.ctx.drawImage(this.bird.image, this.bird.x, this.bird.y, this.bird.width, this.bird.height);
        } else {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(this.bird.x, this.bird.y, this.bird.width, this.bird.height);
        }
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        
        const clouds = [
            { x: 100, y: 100, size: 30 },
            { x: 300, y: 150, size: 25 },
            { x: 500, y: 80, size: 35 },
            { x: 650, y: 120, size: 20 }
        ];
        
        clouds.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + 20, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + 35, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    gameOver() {
        this.gameRunning = false;
        this.finalScoreElement.textContent = Math.floor(this.score);
        this.gameOverElement.classList.remove('hidden');
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        
        if (deltaTime >= this.frameInterval) {
            this.update();
            this.render();
            this.lastTime = currentTime - (deltaTime % this.frameInterval);
        }
        
        if (this.gameRunning) {
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }
}

window.addEventListener('load', () => {
    new ScreamyBird();
});

'use strict';

// 1. FIXED: The color palette now provides three shades (dark, medium, light) for each color.
const colorPalette = [
    // Cyan
    ['rgba(0, 200, 200, 0.3)', 'rgba(50, 255, 255, 0.3)', 'rgba(170, 255, 255, 0.3)'],
    // Yellow
    ['rgba(200, 200, 0, 0.3)', 'rgba(255, 255, 80, 0.3)', 'rgba(255, 255, 170, 0.3)'],
    // Purple
    ['rgba(120, 0, 120, 0.3)', 'rgba(170, 0, 170, 0.3)', 'rgba(220, 80, 220, 0.3)'],
    // Blue
    ['rgba(0, 0, 220, 0.3)', 'rgba(80, 80, 255, 0.3)', 'rgba(170, 170, 255, 0.3)'],
    // Orange
    ['rgba(220, 140, 0, 0.3)', 'rgba(255, 180, 80, 0.3)', 'rgba(255, 220, 160, 0.3)'],
    // Green
    ['rgba(0, 210, 0, 0.3)', 'rgba(80, 255, 80, 0.3)', 'rgba(170, 255, 170, 0.3)'],
    // Red
    ['rgba(220, 0, 0, 0.3)', 'rgba(255, 80, 80, 0.3)', 'rgba(255, 170, 170, 0.3)'],
    // Magenta
    ['rgba(220, 0, 220, 0.3)', 'rgba(255, 80, 255, 0.3)', 'rgba(255, 170, 255, 0.3)'],
    // Lime Green
    ['rgba(80, 190, 80, 0.3)', 'rgba(100, 255, 100, 0.3)', 'rgba(190, 255, 190, 0.3)'],
    // Hot Pink
    ['rgba(220, 90, 150, 0.3)', 'rgba(255, 130, 200, 0.3)', 'rgba(255, 190, 225, 0.3)'],
    // Teal
    ['rgba(0, 130, 130, 0.3)', 'rgba(80, 190, 190, 0.3)', 'rgba(140, 230, 230, 0.3)'],
    // Gold
    ['rgba(220, 180, 0, 0.3)', 'rgba(255, 225, 80, 0.3)', 'rgba(255, 240, 160, 0.3)'],
    // Indigo
    ['rgba(90, 40, 150, 0.3)', 'rgba(130, 90, 210, 0.3)', 'rgba(180, 150, 255, 0.3)'],
    // Light Coral
    ['rgba(200, 110, 110, 0.3)', 'rgba(255, 150, 150, 0.3)', 'rgba(255, 190, 190, 0.3)']
];




// This array only defines the shapes.
const tetrominoShapes = [
    { data: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] }, // I
    { data: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]] }, // O
    { data: [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]] }, // T
    { data: [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]] }, // J
    { data: [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]] }, // L
    { data: [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]] }, // S
    { data: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]] }  // Z
];

var Tetris = function(width, height){
    this.width  = width || window.innerWidth;
    this.height = height || window.innerHeight;
    this.bgCanvas = document.createElement('canvas');
    this.fgCanvas = document.createElement('canvas');
    this.bgCanvas.width = this.fgCanvas.width = this.width;
    this.bgCanvas.height = this.fgCanvas.height = this.height;
    this.bgCtx = this.bgCanvas.getContext('2d');
    this.fgCtx = this.fgCanvas.getContext('2d');
    document.body.appendChild(this.bgCanvas);
    document.body.appendChild(this.fgCanvas);
    this.init();
};

Tetris.prototype.init = function(){
    this.activePieces = [];
    this.maxPieces = 15;
    this.playerPiece = null;
    this.unitSize = 20;
    this.board = [];
    this.boardWidth =  Math.floor(this.width / this.unitSize);
    this.boardHeight = Math.floor(this.height / this.unitSize);

    for (let x = 0; x <= this.boardWidth; x++) {
        this.board[x] = [];
        for (let y = 0; y <= this.boardHeight; y++) {
            this.board[x][y] = { data: 0, colors: ['rgba(0,0,0,0)'] };
        }
    }
    
    var self = this;
    window.addEventListener('keydown', function (e) {
        if (!self.playerPiece) return;
        if ([37, 38, 39, 40].indexOf(e.keyCode) > -1) { e.preventDefault(); }
        switch (e.keyCode) {
            case 37: if (self.checkMovement(self.playerPiece, -1, 0)) { self.playerPiece.x--; } break;
            case 39: if (self.checkMovement(self.playerPiece, 1, 0)) { self.playerPiece.x++; } break;
            case 40: if (self.checkMovement(self.playerPiece, 0, 1)) { self.playerPiece.y++; } break;
            case 38: self.playerPiece.data = self.rotateTetrimono(self.playerPiece); break;
        }
    });

    this.renderBoard();
    this.update();
};

Tetris.prototype.update = function() {
    for (let i = this.activePieces.length - 1; i >= 0; i--) {
        let piece = this.activePieces[i];
        if (Date.now() > piece.lastMove) {
            piece.lastMove = Date.now() + piece.speed;
            if (this.checkMovement(piece, 0, 1)) {
                piece.y++;
            } else {
                if (piece.y < 0) { this.init(); return; }
                this.fillBoard(piece);
                this.activePieces.splice(i, 1);
            }
        }
    }

    if (this.activePieces.length < this.maxPieces && Math.random() > 0.985) {
        this.activePieces.push(this.spawnPiece());
    }
    this.render();
    requestAnimationFrame(() => this.update());
};

Tetris.prototype.spawnPiece = function() {
    const shapeNum = Math.floor(Math.random() * tetrominoShapes.length);
    let pieceData = tetrominoShapes[shapeNum].data;
    const colorNum = Math.floor(Math.random() * colorPalette.length);
    const pieceColors = colorPalette[colorNum];
    const rotations = Math.floor(Math.random() * 4);
    for (let i = 0; i < rotations; i++) {
        pieceData = this.rotateTetrimono({ data: pieceData });
    }
    const newPiece = { data: pieceData, colors: pieceColors, x: Math.floor(Math.random() * (this.boardWidth - 3)), y: -4, speed: 50 + Math.random() * 50, lastMove: Date.now() };
    this.playerPiece = newPiece;
    return newPiece;
};

Tetris.prototype.renderBoard = function(){
    this.bgCtx.clearRect(0, 0, this.width, this.height);
    for (let x = 0; x < this.boardWidth; x++) {
        for (let y = 0; y < this.boardHeight; y++) {
            if (this.board[x][y].data !== 0) {
                this.drawBlock(this.bgCtx, x, y, this.board[x][y].colors);
            }
        }
    }
};

Tetris.prototype.render = function() {
    this.fgCtx.clearRect(0, 0, this.width, this.height);
    for (const piece of this.activePieces) {
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (piece.data[x][y] === 1) {
                    this.drawBlock(this.fgCtx, piece.x + x, piece.y + y, piece.colors);
                }
            }
        }
    }
};

// 2. FIXED: This drawing function now creates the beveled "pixel block" texture.
Tetris.prototype.drawBlock = function(ctx, x, y, colors) {
    const xPos = x * this.unitSize;
    const yPos = y * this.unitSize;
    if (yPos < -this.unitSize) return;

    // Draw dark outer border
    ctx.fillStyle = colors[0];
    ctx.fillRect(xPos, yPos, this.unitSize, this.unitSize);

    // Draw lighter main color
    ctx.fillStyle = colors[1];
    ctx.fillRect(xPos + 2, yPos + 2, this.unitSize - 4, this.unitSize - 4);

    // Draw bright inner highlight
    ctx.fillStyle = colors[2];
    ctx.fillRect(xPos + 4, yPos + 4, this.unitSize - 8, this.unitSize - 8);
};

Tetris.prototype.fillBoard = function(piece) {
    if (piece === this.playerPiece) {
        this.playerPiece = null;
    }
    for (let x = 0; x < 4; x++) {
        for (let y = 0; y < 4; y++) {
            if (piece.data[x][y] === 1) {
                if (this.board[piece.x + x] && this.board[piece.x + x][piece.y + y]) {
                    this.board[piece.x + x][piece.y + y].data = 1;
                    this.board[piece.x + x][piece.y + y].colors = piece.colors;
                }
            }
        }
    }
    this.renderBoard();
};

Tetris.prototype.checkMovement = function(piece, newX, newY) {
    for (let x = 0; x < 4; x++) {
        for (let y = 0; y < 4; y++) {
            if (piece.data[x][y] === 1) {
                const checkX = piece.x + x + newX;
                const checkY = piece.y + y + newY;
                if (checkX >= this.boardWidth || checkX < 0 || checkY >= this.boardHeight) { return false; }
                if (this.board[checkX] && this.board[checkX][checkY] && this.board[checkX][checkY].data === 1) { return false; }
            }
        }
    }
    return true;
};

Tetris.prototype.rotateTetrimono = function(piece) {
    const rotated = [];
    for (let x = 0; x < 4; x++) {
        rotated[x] = [];
        for (let y = 0; y < 4; y++) {
            rotated[x][y] = piece.data[3 - y][x];
        }
    }
    return rotated;
};

new Tetris();

import { getSquareElement } from './board.js';
import { boardState } from './board.js';
import { movePiece } from './pieces.js';
import { showValidMoves, getValidMoves } from './moves.js';
import { executeSpecialMove } from './specialMoves.js';

// --- Drag-n-drop state (module scoped) ---
let dragState = {
    dragging: false,
    piece: null,
    originRow: null,
    originCol: null,
    dragImage: null,
    validMoves: [],
    gameState: null,
};

// Setup all event handlers
export function setupEventHandlers(board, gameState) {
    // Add click event listeners for regular selection
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        square.addEventListener('click', (e) => handleSquareClick(e, gameState));
    });

    // Setup drag listeners for chess pieces
    document.addEventListener('mousedown', e => onMouseDownPiece(e, gameState));
    document.addEventListener('mousemove', onMouseMovePiece);
    document.addEventListener('mouseup', e => onMouseUpPiece(e, gameState));
}

// --- Dragging Handlers ---

function onMouseDownPiece(event, gameState) {
    // Only left button and on a piece
    if (event.button !== 0) return;
    let piece = event.target.closest('.piece');
    if (!piece) return;
    if (gameState.gameOver) return;

    // Only allow dragging of player's own pieces
    if (piece.dataset.color !== gameState.currentPlayer) return;

    const square = piece.parentElement;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    // Get valid moves and highlight them (as for clicking)
    clearHighlights();
    let validMoves = getValidMoves(row, col, piece.dataset.type, piece.dataset.color, gameState);
    showValidMoves(row, col, piece.dataset.type, piece.dataset.color, gameState);

    dragState.dragging = true;
    dragState.piece = piece;
    dragState.originRow = row;
    dragState.originCol = col;
    dragState.validMoves = validMoves;
    dragState.gameState = gameState;

    // Create a floating drag image of the piece for visual feedback
    dragState.dragImage = createDragImage(piece);
    positionDragImage(event);

    // Add a class for visual cue
    piece.classList.add('dragging');
    document.body.style.userSelect = "none";
}

function onMouseMovePiece(event) {
    if (!dragState.dragging) return;
    positionDragImage(event);

    // Highlight hovered square, if needed
    document.querySelectorAll('.square.drag-hover').forEach(sq => sq.classList.remove('drag-hover'));
    const square = getSquareFromMouse(event);
    if (square) {
        square.classList.add('drag-hover');
    }
}
function onMouseUpPiece(event, gameState) {
    if (!dragState.dragging) return;

    const piece = dragState.piece;
    const originRow = dragState.originRow;
    const originCol = dragState.originCol;
    const validMoves = dragState.validMoves;

    // Final square
    const square = getSquareFromMouse(event);

    if (square) {
        const targetRow = parseInt(square.dataset.row);
        const targetCol = parseInt(square.dataset.col);

        // Is it a valid move/capture/special?
        const moveInfo = validMoves.find(move => move.row === targetRow && move.col === targetCol);

        if (moveInfo) {
            // Handle move
            if (moveInfo.special) {
                executeSpecialMove(moveInfo, originRow, originCol, targetRow, targetCol, dragState.gameState);
            } else {
                const pieceType = piece.dataset.type;
                const pieceColor = piece.dataset.color;
                const targetPiece = square.querySelector('.piece');
                
                if (targetPiece && targetPiece.dataset.type === 'king') {
                    dragState.gameState.setWinner(pieceColor);
                }
                if (targetPiece) {
                    square.removeChild(targetPiece);
                }

                // Track castling/en passant
                updateGameStateAfterMove(pieceType, pieceColor, originRow, originCol, targetRow, targetCol, dragState.gameState);
                movePiece(piece, square);

                // Promotion?
                if (pieceType === 'pawn' && (targetRow === 0 || targetRow === 7)) {
                    promotePawn(targetRow, targetCol, dragState.gameState);
                } else if (!dragState.gameState.gameOver) {
                    dragState.gameState.switchPlayer();
                    dragState.gameState.checkForStalemate();
                }
            }
        }
    }
    // Clean up
    cleanupDrag();
}

function createDragImage(piece) {
    // Copy the piece's innerHTML SVG as a floating image
    const imgDiv = document.createElement('div');
    imgDiv.className = 'piece-drag-image';
    imgDiv.innerHTML = piece.innerHTML;
    document.body.appendChild(imgDiv);

    imgDiv.style.position = 'fixed';
    imgDiv.style.pointerEvents = 'none';
    imgDiv.style.zIndex = 1000;
    imgDiv.style.width = piece.offsetWidth + "px";
    imgDiv.style.height = piece.offsetHeight + "px";
    imgDiv.style.opacity = 0.92;
    return imgDiv;
}
function positionDragImage(event) {
    if (!dragState.dragImage) return;
    // Center drag image under cursor
    dragState.dragImage.style.left = (event.clientX - dragState.dragImage.offsetWidth / 2) + "px";
    dragState.dragImage.style.top = (event.clientY - dragState.dragImage.offsetHeight / 2) + "px";
}

function getSquareFromMouse(event) {
    const elem = document.elementFromPoint(event.clientX, event.clientY);
    if (!elem) return null;
    const square = elem.closest('.square');
    return square;
}
function cleanupDrag() {
    if (dragState.piece) {
        dragState.piece.classList.remove('dragging');
    }
    if (dragState.dragImage) {
        dragState.dragImage.remove();
    }
    document.body.style.userSelect = "";
    document.querySelectorAll('.square.drag-hover').forEach(sq => sq.classList.remove('drag-hover'));
    clearHighlights();
    dragState.dragging = false;
    dragState.piece = null;
    dragState.originRow = null;
    dragState.originCol = null;
    dragState.validMoves = [];
    dragState.dragImage = null;
    dragState.gameState = null;
}

// --- Existing Click-to-move handlers below ---

export function handleSquareClick(event, gameState) {
    // Prevent click if drag is in progress
    if (dragState.dragging) return;

    if (gameState.gameOver) return;
    const square = event.currentTarget;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    clearHighlights();

    // If a piece is already selected, try to move it
    if (gameState.selectedPiece) {
        const selectedRow = parseInt(gameState.selectedPiece.parentElement.dataset.row);
        const selectedCol = parseInt(gameState.selectedPiece.parentElement.dataset.col);
        const pieceType = gameState.selectedPiece.dataset.type;
        const pieceColor = gameState.selectedPiece.dataset.color;

        if (row !== selectedRow || col !== selectedCol) {
            const validMoves = showValidMoves(selectedRow, selectedCol, pieceType, pieceColor, gameState);
            const moveInfo = validMoves.find(move => move.row === row && move.col === col);

            if (moveInfo) {
                if (moveInfo.special) {
                    executeSpecialMove(moveInfo, selectedRow, selectedCol, row, col, gameState);
                } else {
                    const targetPiece = square.querySelector('.piece');
                    if (targetPiece && targetPiece.dataset.type === 'king') {
                        gameState.setWinner(pieceColor);
                    }
                    if (targetPiece) {
                        square.removeChild(targetPiece);
                    }
                    updateGameStateAfterMove(pieceType, pieceColor, selectedRow, selectedCol, row, col, gameState);
                    movePiece(gameState.selectedPiece, square);

                    if (pieceType === 'pawn' && (row === 0 || row === 7)) {
                        promotePawn(row, col, gameState);
                    } else if (!gameState.gameOver) {
                        gameState.switchPlayer();
                        gameState.checkForStalemate();
                    }
                }
            }
        }
        gameState.selectedPiece = null;
        return;
    }

    // Select a piece
    const piece = square.querySelector('.piece');
    if (piece && piece.dataset.color === gameState.currentPlayer) {
        gameState.selectedPiece = piece;
        square.classList.add('highlight');
        showValidMoves(row, col, piece.dataset.type, piece.dataset.color, gameState);
    }
}

function updateGameStateAfterMove(pieceType, pieceColor, startRow, startCol, endRow, endCol, gameState) {
    if (pieceType === 'king') {
        if (pieceColor === 'white') gameState.whiteKingMoved = true;
        else gameState.blackKingMoved = true;
    } else if (pieceType === 'rook') {
        if (pieceColor === 'white') {
            if (startCol === 0) gameState.whiteRooksMoved.queenside = true;
            else if (startCol === 7) gameState.whiteRooksMoved.kingside = true;
        } else {
            if (startCol === 0) gameState.blackRooksMoved.queenside = true;
            else if (startCol === 7) gameState.blackRooksMoved.kingside = true;
        }
    }

    // Pawn double-move
    if (pieceType === 'pawn' && Math.abs(startRow - endRow) === 2) {
        gameState.lastPawnDoubleMove = {
            row: endRow,
            col: endCol,
            turn: gameState.turnCount
        };
    } else {
        gameState.lastPawnDoubleMove = null;
    }
}

export function clearHighlights() {
    document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
    document.querySelectorAll('.valid-move').forEach(el => el.remove());
    document.querySelectorAll('.capture-move').forEach(el => el.remove());
}

export function markValidMove(row, col) {
    const square = getSquareElement(row, col);
    const marker = document.createElement('div');
    marker.classList.add('valid-move');
    square.appendChild(marker);
}

export function markCaptureMove(row, col) {
    const square = getSquareElement(row, col);
    const marker = document.createElement('div');
    marker.classList.add('capture-move');
    square.appendChild(marker);
}

function promotePawn(row, col, gameState) {
    const promotionOverlay = document.createElement('div');
    promotionOverlay.classList.add('promotion-overlay');

    const promotionDialog = document.createElement('div');
    promotionDialog.classList.add('promotion-dialog');

    const pieceColor = gameState.currentPlayer;
    const promotionPieces = ['queen', 'rook', 'bishop', 'knight'];

    promotionPieces.forEach(pieceType => {
        const pieceOption = document.createElement('div');
        pieceOption.classList.add('promotion-option');
        pieceOption.innerHTML = getPieceSVG(pieceType, pieceColor);
        pieceOption.addEventListener('click', () => {
            // Get the pawn square
            const square = getSquareElement(row, col);
            const pawn = square.querySelector('.piece');

            // Remove the pawn
            square.removeChild(pawn);

            // Place the new piece
            placePiece(pieceType, pieceColor, row, col);

            // Remove the promotion dialog
            document.body.removeChild(promotionOverlay);

            // Continue game
            gameState.switchPlayer();
            gameState.checkForStalemate();
        });

        promotionDialog.appendChild(pieceOption);
    });

    promotionOverlay.appendChild(promotionDialog);
    document.body.appendChild(promotionOverlay);
}

function getPieceSVG(type, color) {
    // Uses the same SVG as in pieces.js for rendering
    const fillColor = color === 'white' ? '#fff' : '#000';
    const strokeColor = color === 'white' ? '#000' : '#fff';

    const svgs = {
        pawn: `<svg viewBox="0 0 45 45"><path d="M22.5,9c-2.21,0-4,1.79-4,4c0,0.89,0.29,1.71,0.78,2.38C16.83,16.5,15,18.59,15,21c0,2.03,0.94,3.84,2.41,5.03c-3,1.06-7.41,5.55-7.41,13.47h23c0-7.92-4.41-12.41-7.41-13.47c1.47-1.19,2.41-3,2.41-5.03c0-2.41-1.83-4.5-4.28-5.62c0.49-0.67,0.78-1.49,0.78-2.38C26.5,10.79,24.71,9,22.5,9z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
        knight: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22,10c10.5,1,16.5,8,16,29H15c0-9,10-6.5,8-21" fill="${fillColor}"/><path d="M24,18c0.38,2.91-5.55,7.37-8,9c-3,2-2.82,4.34-5,4c-1.042-0.94,1.41-3.04,0-3c-1,0.05-1.0,1.97-3,2c-1,0-3.001,0-3-3c0-2,6-12,6-12c0,0,1.89-1.9,2-3.5c-0.73-0.994-0.5-2-0.5-3c1-1,3,2.5,3,2.5h2c0,0,0.78-1.992,2.5-3c1,0,1,3,1,3" fill="${fillColor}"/><path d="M9.5,25.5a0.5,0.5,0,1,1-1,0a0.5,0.5,0,1,1,1,0z" fill="${strokeColor}" stroke="none"/><path d="M14.933,15.75a0.5,1.5,30,1,1-0.866,-0.5a0.5,1.5,30,1,1,0.866,0.5z" fill="${strokeColor}" stroke="none"/></g></svg>`,
        bishop: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="${fillColor}" stroke-linecap="butt"><path d="M9,36c3.39-0.97,10.11,0.43,13.5-2c3.39,2.43,10.11,1.03,13.5,2c0,0,1.65,0.54,3,2c-0.68,0.97-1.65,0.99-3,0.5c-3.39-0.97-10.11,0.46-13.5-1c-3.39,1.46-10.11,0.03-13.5,1c-1.354,0.49-2.323,0.47-3-0.5c1.354-1.94,3-2,3-2z"/><path d="M15,32c2.5,2.5,12.5,2.5,15,0c0.5-1.5,0-2,0-2c0-2.5-2.5-4-2.5-4c5.5-1.5,6-11.5-5-15.5c-11,4-10.5,14-5,15.5c0,0-2.5,1.5-2.5,4c0,0-0.5,0.5,0,2z"/><path d="M25,8a2.5,2.5,0,1,1-5,0a2.5,2.5,0,1,1,5,0z"/></g><path d="M17.5,26h10M15,30h15m-7.5-14.5v5M20,18h5" stroke="${strokeColor}" stroke-linejoin="miter"/></g></svg>`,
        rook: `<svg viewBox="0 0 45 45"><g fill="${fillColor}" fill-rule="evenodd" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9,39h27v-3H9v3zM12,36v-4h21v4H12zM11,14V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/><path d="M34,14l-3,3H14l-3-3"/><path d="M31,17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M31,29.5l1.5,2.5h-20l1.5-2.5"/><path d="M11,14h23" fill="none" stroke-linejoin="miter"/></g></svg>`,
        // Redesigned neater queen:
        queen: `<svg viewBox="0 0 45 45">
    <g>
        <ellipse cx="22.5" cy="34" rx="11" ry="4.5" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5"/>
        <ellipse cx="22.5" cy="19" rx="9.5" ry="9" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5"/>
        <circle cx="22.5" cy="10" r="2.3" fill="${strokeColor}" />
        <circle cx="12.8" cy="19.5" r="1.6" fill="${strokeColor}" />
        <circle cx="32.2" cy="19.5" r="1.6" fill="${strokeColor}" />
        <circle cx="18.2" cy="13.5" r="1.1" fill="${strokeColor}" />
        <circle cx="26.8" cy="13.5" r="1.1" fill="${strokeColor}" />
        <ellipse cx="22.5" cy="19.5" rx="6" ry="7" fill="none" stroke="${strokeColor}" stroke-width="1" />
        <path d="M13.5,27 Q20,25 22.5,29 Q25,25 32,27" fill="none" stroke="${strokeColor}" stroke-width="1.3" />
    </g>
</svg>`,
        king: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5,11.63V6M20,8h5" stroke-linejoin="miter"/><path d="M22.5,25c0,0,4.5-7.5,3-10.5c0,0-1-2.5-3-2.5s-3,2.5-3,2.5c-1.5,3,3,10.5,3,10.5" fill="${fillColor}" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M11.5,37c5.5,3.5,15.5,3.5,21,0v-7c0,0,9,-4.5,6,-10.5c-4,-6.5,-13.5,-3.5,-16,4V27v-3.5c-3.5,-7.5,-13,-10.5,-16,-4c-3,6,5,10,5,10V37z" fill="${fillColor}"/><path d="M11.5,30c5.5-3,15.5-3,21,0m-21,3.5c5.5-3,15.5-3,21,0m-21,3.5c5.5-3,15.5-3,21,0"/></g></svg>`
    };
    return svgs[type] || '';
}

function placePiece(type, color, row, col) {
    const square = getSquareElement(row, col);
    const piece = document.createElement('div');
    piece.classList.add('piece');
    piece.dataset.type = type;
    piece.dataset.color = color;

    piece.innerHTML = getPieceSVG(type, color);
    square.appendChild(piece);
    boardState[row][col] = { type, color };
}
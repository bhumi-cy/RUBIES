/* =========================================================
   rubies
   game engine
   ========================================================= */


/* =========================================================
   ELEMENTS
   ========================================================= */

const board =
    document.getElementById("board");

const pieceTray =
    document.getElementById("piece-tray");

const scoreDisplay =
    document.getElementById("score");

const bestDisplay =
    document.getElementById("best");

const holdSlot =
    document.getElementById("hold-slot");


/* =========================================================
   OPTIONAL SCREEN ELEMENTS
   ========================================================= */

const homeScreen =
    document.getElementById("home-screen");

const howToScreen =
    document.getElementById("how-to-screen");

const gameScreen =
    document.getElementById("game-screen");


/* =========================================================
   GAME SETTINGS
   ========================================================= */

const boardSize = 8;

const activePieceCount = 3;


/* =========================================================
   GAME STATE
   ========================================================= */

let cells = [];

let score = 0;

let bestScore =
    Number(
        localStorage.getItem("rubiesBest") || 0
    );

let gameOver = false;

let gameOverOverlay = null;

let holdPiece = null;


/* =========================================================
   DRAG STATE
   ========================================================= */

let dragging = false;

let draggedPiece = null;

let draggedShape = null;

let draggedColor = null;

let draggedSource = null;

let previewCells = [];

let dragGhost = null;


/* =========================================================
   SMOOTH DRAG STATE
   ========================================================= */

/*
   IMPORTANT:
   Keep this value.

   This is the smoothness you already liked.
*/

const DRAG_SMOOTHNESS = 0.28;

let targetGhostX = 0;
let targetGhostY = 0;

let currentGhostX = 0;
let currentGhostY = 0;

let dragAnimationFrame = null;


/* =========================================================
   SAVE BUTTON STATE
   ========================================================= */

let lastPointerDownTime = 0;


/* =========================================================
   DISPLAY BEST SCORE
   ========================================================= */

if (bestDisplay) {
    bestDisplay.textContent =
        bestScore;
}


/* =========================================================
   PIECES
   ========================================================= */

const shapes = [

    /* single */
    [[0, 0]],

    /* 2 */
    [[0, 0], [0, 1]],
    [[0, 0], [1, 0]],

    /* 3 */
    [[0, 0], [0, 1], [0, 2]],
    [[0, 0], [1, 0], [2, 0]],

    /* 4 */
    [[0, 0], [0, 1], [0, 2], [0, 3]],
    [[0, 0], [1, 0], [2, 0], [3, 0]],

    /* square */
    [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1]
    ],

    /* small L */
    [
        [0, 0],
        [1, 0],
        [1, 1]
    ],

    [
        [0, 1],
        [1, 0],
        [1, 1]
    ],

    /* L */
    [
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 1]
    ],

    [
        [0, 1],
        [1, 1],
        [2, 0],
        [2, 1]
    ],

    /* T */
    [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 1]
    ],

    [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, 2]
    ],

    /* zigzag */
    [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 2]
    ],

    [
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1]
    ],

    /* 3x3 */
    [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 0],
        [2, 1],
        [2, 2]
    ]
];


/* =========================================================
   COLORS
   ========================================================= */

const colors = [

    "#F49AB8",
    "#C5A3E8",
    "#8FCDE3",
    "#91D5B3",
    "#F2D38A",
    "#E6A6D8"
];


/* =========================================================
   SCREEN NAVIGATION
   ========================================================= */

function showScreen(screen) {

    if (!screen) {
        return;
    }

    document
        .querySelectorAll(".screen")
        .forEach(
            element => {
                element.classList.remove(
                    "active-screen"
                );
            }
        );

    screen.classList.add(
        "active-screen"
    );
}


/* =========================================================
   HOME / HOW TO / GAME BUTTONS
   ========================================================= */

function setupNavigation() {

    const playButtons =
        document.querySelectorAll(
            "#play-button, #how-play-button, .play-button"
        );

    playButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    startNewGame();

                    showScreen(
                        gameScreen
                    );
                }
            );
        }
    );


    const howToButton =
        document.querySelector(
            "#how-to-button, .how-to-button"
        );

    if (howToButton) {

        howToButton.addEventListener(
            "click",
            () => {

                showScreen(
                    howToScreen
                );
            }
        );
    }


    const backButtons =
        document.querySelectorAll(
            "#back-home, #home-button, .back-home"
        );

    backButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (dragging) {
                        cancelDrag();
                    }

                    showScreen(
                        homeScreen
                    );
                }
            );
        }
    );


    const howBackButton =
        document.querySelector(
            "#how-back, .how-back"
        );

    if (howBackButton) {

        howBackButton.addEventListener(
            "click",
            () => {

                showScreen(
                    homeScreen
                );
            }
        );
    }
}


/* =========================================================
   CREATE BOARD
   ========================================================= */

function createBoard() {

    if (!board) {
        return;
    }

    board.innerHTML = "";

    cells = [];

    for (
        let i = 0;
        i < boardSize * boardSize;
        i++
    ) {

        const cell =
            document.createElement(
                "div"
            );

        cell.classList.add(
            "cell"
        );

        cells.push(
            cell
        );

        board.appendChild(
            cell
        );
    }
}


/* =========================================================
   GET BOARD POSITION
   ========================================================= */

function getBoardPosition(
    x,
    y
) {

    const rect =
        board.getBoundingClientRect();

    const styles =
        getComputedStyle(
            board
        );

    const padding =
        parseFloat(
            styles.padding
        ) || 0;

    const gap =
        parseFloat(
            styles.gap
        ) || 0;

    const innerWidth =
        rect.width -
        padding * 2;

    const innerHeight =
        rect.height -
        padding * 2;

    const cellWidth =
        (
            innerWidth -
            gap * (boardSize - 1)
        ) /
        boardSize;

    const cellHeight =
        (
            innerHeight -
            gap * (boardSize - 1)
        ) /
        boardSize;

    const relativeX =
        x -
        rect.left -
        padding;

    const relativeY =
        y -
        rect.top -
        padding;

    const column =
        Math.floor(
            relativeX /
            (cellWidth + gap)
        );

    const row =
        Math.floor(
            relativeY /
            (cellHeight + gap)
        );

    if (
        column < 0 ||
        column >= boardSize ||
        row < 0 ||
        row >= boardSize
    ) {

        return null;
    }

    return (
        row * boardSize +
        column
    );
}


/* =========================================================
   CHECK PLACEMENT
   ========================================================= */

function calculatePlacement(
    startIndex,
    shape
) {

    if (
        startIndex === null ||
        startIndex === undefined ||
        !shape
    ) {

        return null;
    }

    const startRow =
        Math.floor(
            startIndex /
            boardSize
        );

    const startColumn =
        startIndex %
        boardSize;

    const indexes = [];


    for (const block of shape) {

        const row =
            startRow +
            block[0];

        const column =
            startColumn +
            block[1];


        if (
            row < 0 ||
            row >= boardSize ||
            column < 0 ||
            column >= boardSize
        ) {

            return null;
        }


        const index =
            row * boardSize +
            column;


        if (
            cells[index]
                .classList
                .contains("filled")
        ) {

            return null;
        }


        indexes.push(
            index
        );
    }


    return indexes;
}


/* =========================================================
   SHOW PREVIEW
   ========================================================= */

function showPreview(
    startIndex
) {

    clearPreview();

    if (!draggedShape) {
        return;
    }


    const placement =
        calculatePlacement(
            startIndex,
            draggedShape
        );


    if (!placement) {
        return;
    }


    placement.forEach(
        index => {

            const cell =
                cells[index];

            cell.classList.add(
                "drag-preview"
            );

            cell.style.setProperty(
                "--preview-color",
                draggedColor
            );

            previewCells.push(
                cell
            );
        }
    );
}


/* =========================================================
   CLEAR PREVIEW
   ========================================================= */

function clearPreview() {

    previewCells.forEach(
        cell => {

            cell.classList.remove(
                "drag-preview"
            );

            cell.style.removeProperty(
                "--preview-color"
            );

            cell.classList.remove(
                "preview-valid"
            );

            cell.classList.remove(
                "preview-invalid"
            );
        }
    );

    previewCells = [];
}


/* =========================================================
   CREATE DRAG GHOST
   ========================================================= */

function createDragGhost(
    shape,
    color
) {

    const ghost =
        document.createElement(
            "div"
        );

    ghost.classList.add(
        "rubies-drag-ghost"
    );


    const maxRow =
        Math.max(
            ...shape.map(
                block => block[0]
            )
        );

    const maxColumn =
        Math.max(
            ...shape.map(
                block => block[1]
            )
        );


    const blockSize = 22;
    const blockGap = 4;


    ghost.style.display =
        "grid";

    ghost.style.gridTemplateColumns =
        `repeat(
            ${maxColumn + 1},
            ${blockSize}px
        )`;

    ghost.style.gridTemplateRows =
        `repeat(
            ${maxRow + 1},
            ${blockSize}px
        )`;

    ghost.style.gap =
        `${blockGap}px`;


    shape.forEach(
        block => {

            const blockElement =
                document.createElement(
                    "div"
                );


            blockElement.style.width =
                `${blockSize}px`;

            blockElement.style.height =
                `${blockSize}px`;

            blockElement.style.borderRadius =
                "6px";

            blockElement.style.background =
                color;

            blockElement.style.boxShadow =
                `0 5px 14px ${color}66`;

            blockElement.style.gridRow =
                block[0] + 1;

            blockElement.style.gridColumn =
                block[1] + 1;


            ghost.appendChild(
                blockElement
            );
        }
    );


    document.body.appendChild(
        ghost
    );


    return ghost;
}


/* =========================================================
   SMOOTH GHOST ANIMATION
   ========================================================= */

function animateDragGhost() {

    if (
        !dragging ||
        !dragGhost
    ) {

        dragAnimationFrame =
            null;

        return;
    }


    /*
       DO NOT CHANGE THIS.

       This is the smoothness
       from your previous version.
    */

    currentGhostX +=
        (
            targetGhostX -
            currentGhostX
        ) * DRAG_SMOOTHNESS;


    currentGhostY +=
        (
            targetGhostY -
            currentGhostY
        ) * DRAG_SMOOTHNESS;


    dragGhost.style.left =
        `${currentGhostX}px`;

    dragGhost.style.top =
        `${currentGhostY}px`;


    dragAnimationFrame =
        requestAnimationFrame(
            animateDragGhost
        );
}


/* =========================================================
   START GHOST ANIMATION
   ========================================================= */

function startGhostAnimation(
    x,
    y
) {

    targetGhostX = x;
    targetGhostY = y;

    currentGhostX = x;
    currentGhostY = y;


    if (
        dragAnimationFrame !== null
    ) {

        cancelAnimationFrame(
            dragAnimationFrame
        );
    }


    dragAnimationFrame =
        requestAnimationFrame(
            animateDragGhost
        );
}


/* =========================================================
   STOP GHOST ANIMATION
   ========================================================= */

function stopGhostAnimation() {

    if (
        dragAnimationFrame !== null
    ) {

        cancelAnimationFrame(
            dragAnimationFrame
        );

        dragAnimationFrame =
            null;
    }
}


/* =========================================================
   UPDATE DRAG GHOST
   ========================================================= */

function updateDragGhost(
    x,
    y
) {

    if (!dragGhost) {
        return;
    }

    targetGhostX = x;
    targetGhostY = y;
}


/* =========================================================
   START DRAG
   ========================================================= */

function startDrag(
    event,
    piece
) {

    event.preventDefault();


    if (
        dragging ||
        gameOver ||
        !piece
    ) {

        return;
    }


    /*
       A greyed-out piece cannot be dragged.
    */

    if (
        piece.element.classList.contains(
            "unusable"
        )
    ) {

        return;
    }


    dragging = true;

    draggedPiece = piece;

    draggedShape =
        piece.shape;

    draggedColor =
        piece.color;

    draggedSource =
        piece.source;


    piece.element.classList.add(
        "piece-dragging"
    );


    try {

        piece.element.setPointerCapture(
            event.pointerId
        );

    } catch (error) {
        /* Safe fallback. */
    }


    dragGhost =
        createDragGhost(
            draggedShape,
            draggedColor
        );


    startGhostAnimation(
        event.clientX,
        event.clientY
    );


    updateDragPosition(
        event
    );


    playPickupSound();
}


/* =========================================================
   DRAG MOVEMENT
   ========================================================= */

function updateDragPosition(
    event
) {

    if (!dragging) {
        return;
    }


    event.preventDefault();


    updateDragGhost(
        event.clientX,
        event.clientY
    );


    const index =
        getBoardPosition(
            event.clientX,
            event.clientY
        );


    if (index === null) {

        clearPreview();

        return;
    }


    showPreview(
        index
    );
}


/* =========================================================
   END DRAG
   ========================================================= */

function endDrag(
    event
) {

    if (!dragging) {
        return;
    }


    event.preventDefault();


    const index =
        getBoardPosition(
            event.clientX,
            event.clientY
        );


    let placed = false;


    if (
        index !== null &&
        draggedShape
    ) {

        const placement =
            calculatePlacement(
                index,
                draggedShape
            );


        if (placement) {

            placePiece(
                placement,
                draggedColor
            );

            placed = true;
        }
    }


    clearPreview();


    const currentPiece =
        draggedPiece;


    if (currentPiece) {

        currentPiece.element.classList.remove(
            "piece-dragging"
        );


        try {

            currentPiece.element.releasePointerCapture(
                event.pointerId
            );

        } catch (error) {
            /* Already released. */
        }
    }


    stopGhostAnimation();

    removeDragGhost();


    if (placed) {

        playPlaceSound();


        currentPiece.element.classList.add(
            "piece-used"
        );


        const source =
            currentPiece.source;


        const oldElement =
            currentPiece.element;


        /*
           Tray piece:
           remove it and generate
           exactly one new piece.

           Hold piece:
           consume it and leave
           the hold slot empty.
        */

        setTimeout(
            () => {

                oldElement.remove();


                if (
                    source === "tray"
                ) {

                    createSinglePiece(
                        "tray"
                    );
                }


                if (
                    source === "hold"
                ) {

                    holdPiece =
                        null;

                    renderHoldPiece();
                }


                updatePieceUsability();

            },
            150
        );


        /*
           Wait for placement /
           clear animation before
           checking game over.
        */

        setTimeout(
            () => {

                checkGameOver();

            },
            370
        );
    }


    dragging = false;

    draggedPiece = null;

    draggedShape = null;

    draggedColor = null;

    draggedSource = null;
}


/* =========================================================
   CANCEL DRAG
   ========================================================= */

function cancelDrag() {

    if (!dragging) {
        return;
    }


    clearPreview();


    if (draggedPiece) {

        draggedPiece.element.classList.remove(
            "piece-dragging"
        );
    }


    stopGhostAnimation();

    removeDragGhost();


    dragging = false;

    draggedPiece = null;

    draggedShape = null;

    draggedColor = null;

    draggedSource = null;
}


/* =========================================================
   REMOVE DRAG GHOST
   ========================================================= */

function removeDragGhost() {

    if (!dragGhost) {
        return;
    }

    dragGhost.remove();

    dragGhost = null;
}


/* =========================================================
   PLACE PIECE
   ========================================================= */

function placePiece(
    indexes,
    color
) {

    indexes.forEach(
        index => {

            const cell =
                cells[index];


            cell.classList.add(
                "filled"
            );


            cell.style.background =
                color;


            cell.style.boxShadow =
                `0 4px 12px ${color}55`;


            cell.classList.remove(
                "cell-pop"
            );


            void cell.offsetWidth;


            cell.classList.add(
                "cell-pop"
            );
        }
    );


    clearLines();
}


/* =========================================================
   REWARDING SCORE
   ========================================================= */

function calculateLineClearScore(
    lineCount
) {

    /*
       1 line  = 10
       2 lines = 30
       3 lines = 60
       4 lines = 100
       5 lines = 150

       n × (n + 1) × 5
    */

    return (
        lineCount *
        (lineCount + 1) *
        5
    );
}


/* =========================================================
   CLEAR LINES
   ========================================================= */

function clearLines() {

    const rows = [];
    const columns = [];


    /* =====================================================
       ROWS
       ===================================================== */

    for (
        let row = 0;
        row < boardSize;
        row++
    ) {

        let full = true;


        for (
            let column = 0;
            column < boardSize;
            column++
        ) {

            const index =
                row * boardSize +
                column;


            if (
                !cells[index]
                    .classList
                    .contains("filled")
            ) {

                full = false;

                break;
            }
        }


        if (full) {

            rows.push(
                row
            );
        }
    }


    /* =====================================================
       COLUMNS
       ===================================================== */

    for (
        let column = 0;
        column < boardSize;
        column++
    ) {

        let full = true;


        for (
            let row = 0;
            row < boardSize;
            row++
        ) {

            const index =
                row * boardSize +
                column;


            if (
                !cells[index]
                    .classList
                    .contains("filled")
            ) {

                full = false;

                break;
            }
        }


        if (full) {

            columns.push(
                column
            );
        }
    }


    const totalLines =
        rows.length +
        columns.length;


    if (
        totalLines === 0
    ) {

        return;
    }


    /* =====================================================
       CLEAR ANIMATION
       ===================================================== */

    rows.forEach(
        row => {

            for (
                let column = 0;
                column < boardSize;
                column++
            ) {

                cells[
                    row * boardSize +
                    column
                ].classList.add(
                    "cell-clear"
                );
            }
        }
    );


    columns.forEach(
        column => {

            for (
                let row = 0;
                row < boardSize;
                row++
            ) {

                cells[
                    row * boardSize +
                    column
                ].classList.add(
                    "cell-clear"
                );
            }
        }
    );


    /* =====================================================
       SCORE
       ===================================================== */

    const points =
        calculateLineClearScore(
            totalLines
        );


    score += points;


    if (scoreDisplay) {

        scoreDisplay.textContent =
            score;


        scoreDisplay.classList.remove(
            "score-reward"
        );


        void scoreDisplay.offsetWidth;


        scoreDisplay.classList.add(
            "score-reward"
        );
    }


    /* =====================================================
       BEST SCORE
       ===================================================== */

    if (
        score >
        bestScore
    ) {

        bestScore =
            score;


        localStorage.setItem(
            "rubiesBest",
            bestScore
        );


        if (bestDisplay) {

            bestDisplay.textContent =
                bestScore;
        }
    }


    /* =====================================================
       SOUND
       ===================================================== */

    playClearSound(
        totalLines
    );


    /* =====================================================
       VISUAL REWARD
       ===================================================== */

    showScorePopup(
        points
    );


    /* =====================================================
       REMOVE CLEARED CELLS
       ===================================================== */

    setTimeout(
        () => {

            const clearedIndexes =
                new Set();


            rows.forEach(
                row => {

                    for (
                        let column = 0;
                        column < boardSize;
                        column++
                    ) {

                        clearedIndexes.add(
                            row * boardSize +
                            column
                        );
                    }
                }
            );


            columns.forEach(
                column => {

                    for (
                        let row = 0;
                        row < boardSize;
                        row++
                    ) {

                        clearedIndexes.add(
                            row * boardSize +
                            column
                        );
                    }
                }
            );


            clearedIndexes.forEach(
                index => {

                    resetCell(
                        cells[index]
                    );
                }
            );


            updatePieceUsability();

        },
        320
    );
}


/* =========================================================
   RESET CELL
   ========================================================= */

function resetCell(
    cell
) {

    cell.classList.remove(
        "filled"
    );

    cell.classList.remove(
        "cell-clear"
    );

    cell.classList.remove(
        "cell-pop"
    );

    cell.style.background =
        "";

    cell.style.boxShadow =
        "";
}


/* =========================================================
   SCORE POPUP
   ========================================================= */

function showScorePopup(
    points
) {

    const popup =
        document.createElement(
            "div"
        );


    popup.classList.add(
        "score-popup"
    );


    popup.textContent =
        `+${points}`;


    document.body.appendChild(
        popup
    );


    const rect =
        board.getBoundingClientRect();


    const centerX =
        rect.left +
        rect.width / 2;


    const centerY =
        rect.top +
        rect.height / 2;


    popup.style.left =
        `${centerX}px`;

    popup.style.top =
        `${centerY}px`;


    const symbols = [

        "✦",
        "✧",
        "♡",
        "♥",
        "✿",
        "⋆",
        "✩",
        "˚"
    ];


    const particleCount =
        totalParticlesForScore(
            points
        );


    for (
        let i = 0;
        i < particleCount;
        i++
    ) {

        const particle =
            document.createElement(
                "span"
            );


        particle.classList.add(
            "score-particle"
        );


        particle.textContent =
            symbols[
                Math.floor(
                    Math.random() *
                    symbols.length
                )
            ];


        const angle =
            Math.random() *
            Math.PI *
            2;


        const distance =
            Math.max(
                window.innerWidth,
                window.innerHeight
            ) *
            (
                0.35 +
                Math.random() * 0.50
            );


        const x =
            Math.cos(angle) *
            distance;


        const y =
            Math.sin(angle) *
            distance;


        particle.style.left =
            `${centerX}px`;

        particle.style.top =
            `${centerY}px`;


        particle.style.setProperty(
            "--particle-x",
            `${x}px`
        );


        particle.style.setProperty(
            "--particle-y",
            `${y}px`
        );


        particle.style.animationDelay =
            `${Math.random() * 0.10}s`;


        particle.style.fontSize =
            `${12 + Math.random() * 12}px`;


        document.body.appendChild(
            particle
        );


        setTimeout(
            () => {

                particle.remove();

            },
            1300
        );
    }


    setTimeout(
        () => {

            popup.remove();

        },
        800
    );
}


/* =========================================================
   PARTICLE COUNT
   ========================================================= */

function totalParticlesForScore(
    points
) {

    if (points >= 30) {
        return 30;
    }

    if (points >= 20) {
        return 24;
    }

    return 18;
}


/* =========================================================
   AUDIO ENGINE
   ========================================================= */

let audioContext = null;


/* =========================================================
   GET AUDIO CONTEXT
   ========================================================= */

function getAudioContext() {

    if (!audioContext) {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContext) {
            return null;
        }


        audioContext =
            new AudioContext();
    }


    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();
    }


    return audioContext;
}


/* =========================================================
   BASIC TONE
   ========================================================= */

function playTone(
    frequency,
    duration,
    type = "sine",
    volume = 0.035
) {

    const context =
        getAudioContext();


    if (!context) {
        return;
    }


    const oscillator =
        context.createOscillator();


    const gain =
        context.createGain();


    oscillator.type =
        type;


    oscillator.frequency.setValueAtTime(
        frequency,
        context.currentTime
    );


    gain.gain.setValueAtTime(
        0,
        context.currentTime
    );


    gain.gain.linearRampToValueAtTime(
        volume,
        context.currentTime + 0.01
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime +
        duration
    );


    oscillator.connect(
        gain
    );


    gain.connect(
        context.destination
    );


    oscillator.start();


    oscillator.stop(
        context.currentTime +
        duration
    );
}


/* =========================================================
   PICKUP SOUND
   ========================================================= */

function playPickupSound() {

    playTone(
        520,
        0.09,
        "sine",
        0.025
    );


    setTimeout(
        () => {

            playTone(
                700,
                0.07,
                "sine",
                0.018
            );

        },
        35
    );
}


/* =========================================================
   PLACE SOUND
   ========================================================= */

function playPlaceSound() {

    playTone(
        420,
        0.10,
        "sine",
        0.025
    );


    setTimeout(
        () => {

            playTone(
                620,
                0.12,
                "sine",
                0.020
            );

        },
        35
    );
}


/* =========================================================
   CLEAR SOUND
   ========================================================= */

function playClearSound(
    lineCount
) {

    const notes = [
        660,
        784,
        988,
        1175
    ];


    for (
        let i = 0;
        i < Math.min(
            lineCount + 1,
            notes.length
        );
        i++
    ) {

        setTimeout(
            () => {

                playTone(
                    notes[i],
                    0.18,
                    "sine",
                    0.035
                );

            },
            i * 65
        );
    }
}


/* =========================================================
   GAME OVER SOUND
   ========================================================= */

function playGameOverSound() {

    playTone(
        420,
        0.18,
        "sine",
        0.025
    );


    setTimeout(
        () => {

            playTone(
                330,
                0.22,
                "sine",
                0.020
            );

        },
        120
    );
}


/* =========================================================
   CHECK IF A PIECE CAN FIT ANYWHERE
   ========================================================= */

function canPieceFitAnywhere(
    piece
) {

    if (
        !piece ||
        !piece.shape
    ) {

        return false;
    }


    for (
        let index = 0;
        index < cells.length;
        index++
    ) {

        if (
            calculatePlacement(
                index,
                piece.shape
            )
        ) {

            return true;
        }
    }


    return false;
}


/* =========================================================
   UPDATE PIECE USABILITY
   ========================================================= */

function updatePieceUsability() {

    if (!pieceTray) {
        return;
    }


    const trayPieces =
        Array.from(
            pieceTray.children
        );


    trayPieces.forEach(
        element => {

            const usable =
                canPieceFitAnywhere(
                    element
                );


            element.classList.toggle(
                "unusable",
                !usable
            );
        }
    );


    if (
        holdPiece &&
        holdPiece.element
    ) {

        const usable =
            canPieceFitAnywhere(
                holdPiece
            );


        holdPiece.element.classList.toggle(
            "unusable",
            !usable
        );
    }
}


/* =========================================================
   CHECK GAME OVER
   ========================================================= */

function checkGameOver() {

    if (gameOver) {
        return;
    }


    /*
       First check the three active
       tray pieces.
    */

    const pieces =
        Array.from(
            pieceTray.children
        );


    for (const piece of pieces) {

        if (
            canPieceFitAnywhere(
                piece
            )
        ) {

            updatePieceUsability();

            return;
        }
    }


    /*
       Then check the saved piece.

       This means a usable saved piece
       keeps the game alive.
    */

    if (
        holdPiece &&
        canPieceFitAnywhere(
            holdPiece
        )
    ) {

        updatePieceUsability();

        return;
    }


    showGameOver();
}


/* =========================================================
   SHOW GAME OVER
   ========================================================= */

function showGameOver() {

    if (gameOver) {
        return;
    }


    gameOver = true;


    clearPreview();

    stopGhostAnimation();

    removeDragGhost();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.classList.add(
        "game-over-overlay"
    );


    overlay.innerHTML = `

        <div class="game-over-card">

            <div class="game-over-title">
                no more moves
            </div>

            <div class="game-over-score-label">
                your score
            </div>

            <div class="game-over-score">
                ${score}
            </div>

            <div class="game-over-best">
                best score · ${bestScore}
            </div>

            <button
                class="game-over-button"
                id="play-again"
            >
                play again
            </button>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    gameOverOverlay =
        overlay;


    const playAgainButton =
        overlay.querySelector(
            "#play-again"
        );


    if (playAgainButton) {

        playAgainButton.addEventListener(
            "click",
            () => {

                startNewGame();
            }
        );
    }


    playGameOverSound();
}


/* =========================================================
   SAVE PIECE
   ========================================================= */

function savePiece(
    piece
) {

    if (
        !piece ||
        gameOver ||
        dragging
    ) {

        return;
    }


    /*
       If a piece is already saved,
       do nothing.

       This keeps one clean hold slot.
    */

    if (holdPiece) {
        return;
    }


    const element =
        piece.element;


    /*
       Remove from tray first.
    */

    element.remove();


    /*
       Save it.
    */

    holdPiece =
        piece;

    piece.source =
        "hold";


    /*
       Immediately generate a
       replacement.

       Therefore the main tray
       always stays at 3 pieces.
    */

    createSinglePiece(
        "tray"
    );


    renderHoldPiece();

    updatePieceUsability();


    playSaveSound();
}


/* =========================================================
   RENDER HOLD PIECE
   ========================================================= */

function renderHoldPiece() {

    if (!holdSlot) {
        return;
    }


    holdSlot.innerHTML = "";


    if (!holdPiece) {

        holdSlot.classList.remove(
            "has-piece"
        );


        const empty =
            document.createElement(
                "div"
            );


        empty.classList.add(
            "hold-empty"
        );


        empty.textContent =
            "♡";


        holdSlot.appendChild(
            empty
        );


        return;
    }


    holdSlot.classList.add(
        "has-piece"
    );


    holdSlot.appendChild(
        holdPiece.element
    );


    holdPiece.element.classList.remove(
        "piece-used"
    );


    holdPiece.element.classList.remove(
        "piece-dragging"
    );


    /*
       Re-enable dragging from hold.
    */

    holdPiece.element.style.cursor =
        "grab";
}


/* =========================================================
   SAVE BUTTON
   ========================================================= */

function createSaveButton(
    piece
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.classList.add(
        "piece-save-button"
    );


    button.textContent =
        "♡";


    /*
       Inline visual properties so
       this still works even if the
       CSS button styling changes.
    */

    button.style.position =
        "absolute";

    button.style.right =
        "4px";

    button.style.top =
        "3px";

    button.style.width =
        "21px";

    button.style.height =
        "21px";

    button.style.padding =
        "0";

    button.style.border =
        "none";

    button.style.background =
        "transparent";

    button.style.color =
        "rgba(255,255,255,0.62)";

    button.style.fontFamily =
        '"Delius", cursive';

    button.style.fontSize =
        "13px";

    button.style.lineHeight =
        "21px";

    button.style.cursor =
        "pointer";

    button.style.zIndex =
        "20";


    button.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            event.stopPropagation();
        }
    );


    button.addEventListener(
        "pointerup",
        event => {

            event.preventDefault();

            event.stopPropagation();


            savePiece(
                piece
            );
        }
    );


    piece.element.appendChild(
        button
    );
}


/* =========================================================
   SAVE SOUND
   ========================================================= */

function playSaveSound() {

    playTone(
        620,
        0.10,
        "sine",
        0.022
    );


    setTimeout(
        () => {

            playTone(
                820,
                0.12,
                "sine",
                0.018
            );

        },
        45
    );
}


/* =========================================================
   CREATE PIECE
   ========================================================= */

function createSinglePiece(
    source = "tray"
) {

    if (!pieceTray) {
        return null;
    }


    const element =
        document.createElement(
            "div"
        );


    element.classList.add(
        "piece"
    );


    /*
       Random shape
    */

    const shape =
        shapes[
            Math.floor(
                Math.random() *
                shapes.length
            )
        ];


    /*
       Random color
    */

    const color =
        colors[
            Math.floor(
                Math.random() *
                colors.length
            )
        ];


    const piece = {

        element:
            element,

        shape:
            shape,

        color:
            color,

        source:
            source
    };


    element.shape =
        shape;

    element.color =
        color;


    element.pieceData =
        piece;


    element.style.setProperty(
        "--piece-color",
        color
    );


    /*
       Shape dimensions
    */

    const maxRow =
        Math.max(
            ...shape.map(
                block => block[0]
            )
        );


    const maxColumn =
        Math.max(
            ...shape.map(
                block => block[1]
            )
        );


    element.style.gridTemplateColumns =
        `repeat(
            ${maxColumn + 1},
            18px
        )`;


    element.style.gridTemplateRows =
        `repeat(
            ${maxRow + 1},
            18px
        )`;


    /*
       Draw blocks
    */

    shape.forEach(
        block => {

            const blockElement =
                document.createElement(
                    "div"
                );


            blockElement.classList.add(
                "piece-cell"
            );


            blockElement.style.gridRow =
                block[0] + 1;


            blockElement.style.gridColumn =
                block[1] + 1;


            blockElement.style.background =
                color;


            blockElement.style.boxShadow =
                `0 3px 8px ${color}55`;


            blockElement.style.pointerEvents =
                "none";


            element.appendChild(
                blockElement
            );
        }
    );


    /*
       Only tray pieces get
       a save button.

       The hold piece is already
       saved.
    */

    if (
        source === "tray"
    ) {

        createSaveButton(
            piece
        );
    }


    /*
       Drag.
    */

    element.addEventListener(
        "pointerdown",
        event => {

            /*
               If the save button was
               touched, don't start drag.
            */

            if (
                event.target.closest(
                    ".piece-save-button"
                )
            ) {

                return;
            }


            startDrag(
                event,
                piece
            );
        }
    );


    if (
        source === "tray"
    ) {

        pieceTray.appendChild(
            element
        );
    }


    return piece;
}


/* =========================================================
   CREATE INITIAL PIECE TRAY
   ========================================================= */

function createPieceTray() {

    if (!pieceTray) {
        return;
    }


    pieceTray.innerHTML =
        "";


    for (
        let i = 0;
        i < activePieceCount;
        i++
    ) {

        createSinglePiece(
            "tray"
        );
    }
}


/* =========================================================
   START NEW GAME
   ========================================================= */

function startNewGame() {

    if (dragging) {
        cancelDrag();
    }


    clearPreview();

    stopGhostAnimation();

    removeDragGhost();


    if (gameOverOverlay) {

        gameOverOverlay.remove();

        gameOverOverlay =
            null;
    }


    gameOver = false;

    score = 0;

    holdPiece = null;


    if (scoreDisplay) {

        scoreDisplay.textContent =
            "0";
    }


    if (cells.length === 0) {

        createBoard();

    } else {

        cells.forEach(
            cell => {

                resetCell(
                    cell
                );
            }
        );
    }


    createPieceTray();

    renderHoldPiece();

    updatePieceUsability();
}


/* =========================================================
   POINTER MOVE
   ========================================================= */

document.addEventListener(
    "pointermove",
    event => {

        if (!dragging) {
            return;
        }


        updateDragPosition(
            event
        );
    },
    {
        passive: false
    }
);


/* =========================================================
   POINTER UP
   ========================================================= */

document.addEventListener(
    "pointerup",
    event => {

        if (!dragging) {
            return;
        }


        endDrag(
            event
        );
    },
    {
        passive: false
    }
);


/* =========================================================
   POINTER CANCEL
   ========================================================= */

document.addEventListener(
    "pointercancel",
    () => {

        cancelDrag();
    }
);


/* =========================================================
   SAFETY
   ========================================================= */

window.addEventListener(
    "blur",
    () => {

        if (dragging) {
            cancelDrag();
        }
    }
);


/* =========================================================
   INITIALISE
   ========================================================= */

createBoard();

setupNavigation();

renderHoldPiece();

updatePieceUsability();


/*
   Start on home screen.

   If the new landing page exists,
   don't immediately show the game.
*/

if (homeScreen) {

    showScreen(
        homeScreen
    );

} else {

    /*
       Fallback for the older HTML.
    */

    startNewGame();
}
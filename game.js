/* =========================================================
   rubies
   final game engine
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
   SCREEN ELEMENTS
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

let trayPieces = [];


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

const DRAG_SMOOTHNESS = 0.28;

let targetGhostX = 0;
let targetGhostY = 0;

let currentGhostX = 0;
let currentGhostY = 0;

let dragAnimationFrame = null;


/* =========================================================
   GAME OVER TIMER
   ========================================================= */

let gameOverCheckTimer = null;


/* =========================================================
   DISPLAY BEST SCORE
   ========================================================= */

if (bestDisplay) {
    bestDisplay.textContent = bestScore;
}


/* =========================================================
   PIECE SHAPES
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

    /* small L */
    [[0, 0], [1, 0], [1, 1]],

    /* small L mirrored */
    [[0, 1], [1, 0], [1, 1]],

    /* L */
    [[0, 0], [1, 0], [2, 0], [2, 1]],

    /* L mirrored */
    [[0, 1], [1, 1], [2, 0], [2, 1]],

    /* T */
    [[0, 0], [0, 1], [0, 2], [1, 1]],

    /* T rotated */
    [[0, 1], [1, 0], [1, 1], [1, 2]],

    /* zigzag */
    [[0, 0], [0, 1], [1, 1], [1, 2]],

    /* zigzag mirrored */
    [[0, 1], [0, 2], [1, 0], [1, 1]],

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
        .forEach(element => {

            element.classList.remove(
                "active-screen"
            );

        });

    screen.classList.add(
        "active-screen"
    );
}


/* =========================================================
   HOW TO PLAY CUTE LINE
   ========================================================= */

function addHowToCuteLine() {

    if (!howToScreen) {
        return;
    }

    if (
        howToScreen.querySelector(
            ".how-to-cute-line"
        )
    ) {
        return;
    }

    const line =
        document.createElement("p");

    line.className =
        "how-to-cute-line";

    line.textContent =
        "come on, cutie ♡ just play — you'll figure it out.";

    const card =
        howToScreen.querySelector(
            ".how-card"
        );

    if (!card) {
        howToScreen.appendChild(line);
        return;
    }

    const heading =
        card.querySelector("h2");

    if (heading) {

        heading.insertAdjacentElement(
            "afterend",
            line
        );

    } else {

        card.prepend(line);
    }
}


/* =========================================================
   NAVIGATION SETUP
   ========================================================= */

function setupNavigation() {

    addHowToCuteLine();


    /* PLAY BUTTONS */

    const playButtons =
        document.querySelectorAll(
            "#play-button, #how-play-button, .play-button"
        );

    playButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                startNewGame();

                showScreen(
                    gameScreen
                );

            }
        );

    });


    /* HOW TO PLAY */

    const howToButton =
        document.querySelector(
            "#how-to-play-button, .how-to-button"
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


    /* HOME BUTTONS */

    const homeButtons =
        document.querySelectorAll(
            "#back-home, #home-button, .back-home"
        );

    homeButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                cancelDrag();

                closeGameOverOverlay();

                showScreen(
                    homeScreen
                );

            }
        );

    });


    /* HOW TO BACK BUTTON */

    const howBackButton =
        document.querySelector(
            "#how-back-button, #how-back, .how-back, .corner-button"
        );

    if (howBackButton) {

        howBackButton.addEventListener(
            "click",
            () => {

                cancelDrag();

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
            document.createElement("div");

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

function getBoardPosition(x, y) {

    if (!board) {
        return null;
    }

    const rect =
        board.getBoundingClientRect();

    const styles =
        getComputedStyle(board);

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
   GET PIECE DATA
   ========================================================= */

function getPieceData(piece) {

    if (!piece) {
        return null;
    }

    if (
        piece.shape &&
        piece.color
    ) {

        return piece;
    }

    if (
        piece.pieceData &&
        piece.pieceData.shape
    ) {

        return piece.pieceData;
    }

    return null;
}


/* =========================================================
   CHECK WHETHER PIECE FITS ANYWHERE
   ========================================================= */

function canPieceFitAnywhere(piece) {

    const data =
        getPieceData(piece);

    if (
        !data ||
        !data.shape ||
        !cells.length
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
                data.shape
            )
        ) {

            return true;
        }
    }

    return false;
}


/* =========================================================
   UPDATE SAVE BUTTON STATES
   ========================================================= */

function updateSaveButtonStates() {

    trayPieces.forEach(piece => {

        if (
            !piece ||
            !piece.element
        ) {

            return;
        }

        const button =
            piece.element.querySelector(
                ".piece-save-button"
            );

        if (!button) {
            return;
        }

        const holdIsFull =
            !!holdPiece;

        button.disabled =
            holdIsFull;

        button.setAttribute(
            "aria-disabled",
            holdIsFull
                ? "true"
                : "false"
        );

        button.title =
            holdIsFull
                ? "hold is full"
                : "save for later";
    });
}


/* =========================================================
   UPDATE PIECE USABILITY
   ========================================================= */

function updatePieceUsability() {

    /* -------------------------
       TRAY
       ------------------------- */

    trayPieces.forEach(piece => {

        if (!piece.element) {
            return;
        }

        const usable =
            canPieceFitAnywhere(
                piece
            );

        piece.element.classList.toggle(
            "unusable",
            !usable
        );

        /*
           IMPORTANT:
           Grey pieces stay interactive
           because their save-heart must work.
        */

        piece.element.style.pointerEvents =
            "auto";
    });


    /* -------------------------
       HOLD
       ------------------------- */

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

        holdSlot?.classList.toggle(
            "unusable",
            !usable
        );

        holdPiece.element.style.pointerEvents =
            "auto";

    } else {

        holdSlot?.classList.remove(
            "unusable"
        );
    }


    updateSaveButtonStates();
}


/* =========================================================
   PREVIEW
   ========================================================= */

function showPreview(startIndex) {

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

    placement.forEach(index => {

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
    });
}


/* =========================================================
   CLEAR PREVIEW
   ========================================================= */

function clearPreview() {

    previewCells.forEach(cell => {

        cell.classList.remove(
            "drag-preview"
        );

        cell.style.removeProperty(
            "--preview-color"
        );

    });

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
        document.createElement("div");

    ghost.classList.add(
        "rubies-drag-ghost"
    );

    ghost.style.pointerEvents =
        "none";

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
        `repeat(${maxColumn + 1}, ${blockSize}px)`;

    ghost.style.gridTemplateRows =
        `repeat(${maxRow + 1}, ${blockSize}px)`;

    ghost.style.gap =
        `${blockGap}px`;

    shape.forEach(block => {

        const blockElement =
            document.createElement("div");

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

        blockElement.style.pointerEvents =
            "none";

        ghost.appendChild(
            blockElement
        );
    });

    document.body.appendChild(
        ghost
    );

    return ghost;
}


/* =========================================================
   SMOOTH DRAG ANIMATION
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

    currentGhostX +=
        (
            targetGhostX -
            currentGhostX
        ) *
        DRAG_SMOOTHNESS;

    currentGhostY +=
        (
            targetGhostY -
            currentGhostY
        ) *
        DRAG_SMOOTHNESS;

    dragGhost.style.left =
        `${currentGhostX}px`;

    dragGhost.style.top =
        `${currentGhostY}px`;

    dragAnimationFrame =
        requestAnimationFrame(
            animateDragGhost
        );
}


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


function updateDragGhost(x, y) {

    if (!dragGhost) {
        return;
    }

    targetGhostX = x;
    targetGhostY = y;
}


function removeDragGhost() {

    if (!dragGhost) {
        return;
    }

    dragGhost.remove();

    dragGhost = null;
}


/* =========================================================
   START DRAG
   ========================================================= */

function startDrag(
    event,
    piece
) {

    if (
        dragging ||
        gameOver ||
        !piece
    ) {

        return;
    }

    /*
       Grey pieces cannot be played.
       Their save button still works.
    */

    if (
        !canPieceFitAnywhere(
            piece
        )
    ) {

        return;
    }

    event.preventDefault();

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
        /* safe fallback */
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

function updateDragPosition(event) {

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

function endDrag(event) {

    if (!dragging) {
        return;
    }

    event.preventDefault();

    const index =
        getBoardPosition(
            event.clientX,
            event.clientY
        );

    let placement = null;

    if (
        index !== null &&
        draggedShape
    ) {

        placement =
            calculatePlacement(
                index,
                draggedShape
            );
    }


    /* -------------------------
       VALID DROP
       ------------------------- */

    if (placement) {

        const usedPiece =
            draggedPiece;

        const source =
            draggedSource;

        const pieceElement =
            usedPiece.element;


        placePiece(
            placement,
            draggedColor
        );


        clearPreview();


        pieceElement.classList.remove(
            "piece-dragging"
        );

        pieceElement.classList.add(
            "piece-used"
        );


        try {

            pieceElement.releasePointerCapture(
                event.pointerId
            );

        } catch (error) {
            /* safe fallback */
        }


        stopGhostAnimation();

        removeDragGhost();


        dragging = false;

        draggedPiece = null;
        draggedShape = null;
        draggedColor = null;
        draggedSource = null;


        playPlaceSound();


        /* -------------------------
           TRAY PIECE USED
           ------------------------- */

        if (source === "tray") {

            removeTrayPiece(
                usedPiece
            );

            setTimeout(
                () => {

                    createSinglePiece();

                    updatePieceUsability();

                },
                150
            );
        }


        /* -------------------------
           HOLD PIECE USED
           ------------------------- */

        if (source === "hold") {

            holdPiece = null;

            setTimeout(
                () => {

                    renderHoldPiece();

                    updatePieceUsability();

                },
                150
            );
        }


        /*
           Wait until line-clear animation
           and board reset are complete.
        */

        scheduleGameOverCheck(
            500
        );

        return;
    }


    /* -------------------------
       INVALID DROP
       ------------------------- */

    cancelDrag();
}


/* =========================================================
   REMOVE TRAY PIECE
   ========================================================= */

function removeTrayPiece(piece) {

    const index =
        trayPieces.indexOf(
            piece
        );

    if (index !== -1) {

        trayPieces.splice(
            index,
            1
        );
    }

    if (piece.element) {
        piece.element.remove();
    }
}


/* =========================================================
   CANCEL DRAG
   ========================================================= */

function cancelDrag() {

    clearPreview();

    if (draggedPiece) {

        draggedPiece.element.classList.remove(
            "piece-dragging"
        );

        try {

            if (
                draggedPiece.element.hasPointerCapture &&
                draggedPiece.element.hasPointerCapture(
                    event?.pointerId
                )
            ) {

                draggedPiece.element.releasePointerCapture(
                    event.pointerId
                );
            }

        } catch (error) {
            /* safe fallback */
        }
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
   PLACE PIECE
   ========================================================= */

function placePiece(
    indexes,
    color
) {

    indexes.forEach(index => {

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
    });


    clearLines();
}


/* =========================================================
   SCORE
   ========================================================= */

function calculateLineClearScore(
    lineCount
) {

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


    /* -------------------------
       FIND FULL ROWS
       ------------------------- */

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
            rows.push(row);
        }
    }


    /* -------------------------
       FIND FULL COLUMNS
       ------------------------- */

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
            columns.push(column);
        }
    }


    const totalLines =
        rows.length +
        columns.length;


    /* -------------------------
       NO CLEAR
       ------------------------- */

    if (totalLines === 0) {

        updatePieceUsability();

        return;
    }


    /* -------------------------
       CLEAR ANIMATION
       ------------------------- */

    rows.forEach(row => {

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
    });


    columns.forEach(column => {

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
    });


    /* -------------------------
       SCORE
       ------------------------- */

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


    /* -------------------------
       BEST SCORE
       ------------------------- */

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


    /* -------------------------
       EFFECTS
       ------------------------- */

    playClearSound(
        totalLines
    );

    showScorePopup(
        points
    );


    /* -------------------------
       ACTUAL BOARD RESET
       ------------------------- */

    setTimeout(
        () => {

            const clearedIndexes =
                new Set();


            rows.forEach(row => {

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
            });


            columns.forEach(column => {

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
            });


            clearedIndexes.forEach(
                index => {

                    resetCell(
                        cells[index]
                    );

                }
            );


            /*
               IMPORTANT:

               Recalculate every tray piece
               and the saved HOLD piece
               after the board physically changes.
            */

            updatePieceUsability();

        },
        320
    );
}


/* =========================================================
   RESET CELL
   ========================================================= */

function resetCell(cell) {

    cell.classList.remove(
        "filled"
    );

    cell.classList.remove(
        "cell-clear"
    );

    cell.classList.remove(
        "cell-pop"
    );

    cell.classList.remove(
        "drag-preview"
    );

    cell.style.background =
        "";

    cell.style.boxShadow =
        "";

    cell.style.removeProperty(
        "--preview-color"
    );
}


/* =========================================================
   SCORE POPUP
   ========================================================= */

function showScorePopup(points) {

    if (!board) {
        return;
    }

    const popup =
        document.createElement("div");

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
            document.createElement("span");

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


        particle.style.left =
            `${centerX}px`;

        particle.style.top =
            `${centerY}px`;


        particle.style.setProperty(
            "--particle-x",
            `${Math.cos(angle) * distance}px`
        );

        particle.style.setProperty(
            "--particle-y",
            `${Math.sin(angle) * distance}px`
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

function totalParticlesForScore(points) {

    if (points >= 30) {
        return 30;
    }

    if (points >= 20) {
        return 24;
    }

    return 18;
}


/* =========================================================
   AUDIO
   ========================================================= */

let audioContext = null;


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
   CREATE PIECE DATA
   ========================================================= */

function createPieceData() {

    const shape =
        shapes[
            Math.floor(
                Math.random() *
                shapes.length
            )
        ];


    const color =
        colors[
            Math.floor(
                Math.random() *
                colors.length
            )
        ];


    return {

        shape:
            shape.map(
                block => [
                    block[0],
                    block[1]
                ]
            ),

        color,

        source:
            "tray",

        element:
            null
    };
}


/* =========================================================
   CREATE PIECE ELEMENT
   ========================================================= */

function createPieceElement(piece) {

    const element =
        document.createElement("div");

    element.classList.add(
        "piece"
    );

    element.style.position =
        "relative";

    element.style.pointerEvents =
        "auto";


    const maxRow =
        Math.max(
            ...piece.shape.map(
                block => block[0]
            )
        );


    const maxColumn =
        Math.max(
            ...piece.shape.map(
                block => block[1]
            )
        );


    element.style.gridTemplateColumns =
        `repeat(${maxColumn + 1}, 18px)`;

    element.style.gridTemplateRows =
        `repeat(${maxRow + 1}, 18px)`;


    piece.shape.forEach(
        block => {

            const miniCell =
                document.createElement("div");

            miniCell.classList.add(
                "piece-cell"
            );

            miniCell.style.gridRow =
                block[0] + 1;

            miniCell.style.gridColumn =
                block[1] + 1;

            miniCell.style.background =
                piece.color;

            miniCell.style.boxShadow =
                `0 3px 8px ${piece.color}55`;

            miniCell.style.pointerEvents =
                "none";

            element.appendChild(
                miniCell
            );
        }
    );


    piece.element =
        element;


    element.pieceData =
        piece;


    return element;
}


/* =========================================================
   SAVE HEART
   ========================================================= */

function addSaveButton(piece) {

    const button =
        document.createElement("button");

    button.type =
        "button";

    button.className =
        "piece-save-button";

    button.innerHTML =
        "♡";

    button.setAttribute(
        "aria-label",
        "save piece"
    );

    button.title =
        "save for later";


    button.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            event.stopPropagation();

        }
    );


    button.addEventListener(
        "click",
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
   ADD DRAG HANDLER
   ========================================================= */

function addPieceDragHandler(piece) {

    piece.element.addEventListener(
        "pointerdown",
        event => {

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
}


/* =========================================================
   CREATE SINGLE TRAY PIECE
   ========================================================= */

function createSinglePiece() {

    if (!pieceTray) {
        return null;
    }


    const piece =
        createPieceData();


    piece.source =
        "tray";


    createPieceElement(
        piece
    );


    addSaveButton(
        piece
    );


    addPieceDragHandler(
        piece
    );


    trayPieces.push(
        piece
    );


    pieceTray.appendChild(
        piece.element
    );


    updatePieceUsability();


    return piece;
}


/* =========================================================
   CREATE INITIAL TRAY
   ========================================================= */

function createPieceTray() {

    if (!pieceTray) {
        return;
    }


    pieceTray.innerHTML =
        "";

    trayPieces =
        [];


    for (
        let i = 0;
        i < activePieceCount;
        i++
    ) {

        createSinglePiece();
    }
}


/* =========================================================
   CHECK WHETHER PIECE CAN BE SAVED
   ========================================================= */

function canSaveUnusablePiece(piece) {

    if (!piece) {
        return false;
    }


    /*
       A playable piece can always
       be saved if HOLD is empty.
    */

    if (
        canPieceFitAnywhere(
            piece
        )
    ) {

        return true;
    }


    /*
       Grey piece:

       another tray piece must be
       playable right now.
    */

    const anotherPlayablePiece =
        trayPieces.some(
            otherPiece => {

                if (
                    otherPiece === piece
                ) {

                    return false;
                }

                return canPieceFitAnywhere(
                    otherPiece
                );
            }
        );


    return anotherPlayablePiece;
}


/* =========================================================
   SAVE PIECE
   ========================================================= */

function savePiece(piece) {

    if (
        !piece ||
        gameOver ||
        dragging
    ) {

        return;
    }


    /*
       HOLD can contain only one piece.
    */

    if (holdPiece) {
        return;
    }


    const index =
        trayPieces.indexOf(
            piece
        );


    if (index === -1) {
        return;
    }


    /*
       Grey pieces need another
       playable tray piece.
    */

    if (
        !canSaveUnusablePiece(
            piece
        )
    ) {

        updatePieceUsability();

        checkGameOver();

        return;
    }


    /*
       Remove from tray.
    */

    trayPieces.splice(
        index,
        1
    );


    if (piece.element) {
        piece.element.remove();
    }


    /*
       Move into HOLD.
    */

    piece.source =
        "hold";

    holdPiece =
        piece;


    /*
       Immediately refill tray
       back to exactly 3.
    */

    createSinglePiece();


    /*
       Render saved piece.
    */

    renderHoldPiece();


    /*
       Recalculate usability.
    */

    updatePieceUsability();


    playSaveSound();


    /*
       Saving may change whether
       the resulting set is game over.
    */

    scheduleGameOverCheck(
        100
    );
}


/* =========================================================
   RENDER HOLD PIECE
   ========================================================= */

function renderHoldPiece() {

    if (!holdSlot) {
        return;
    }


    holdSlot.innerHTML =
        "";


    if (!holdPiece) {

        holdSlot.classList.remove(
            "has-piece"
        );

        holdSlot.classList.remove(
            "unusable"
        );


        const empty =
            document.createElement("div");

        empty.className =
            "hold-empty";

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


    /*
       HOLD does not have a save button.
    */

    const saveButton =
        holdPiece.element.querySelector(
            ".piece-save-button"
        );

    if (saveButton) {
        saveButton.remove();
    }


    holdSlot.appendChild(
        holdPiece.element
    );


    holdPiece.source =
        "hold";


    holdPiece.element.classList.remove(
        "piece-dragging"
    );

    holdPiece.element.classList.remove(
        "piece-used"
    );


    holdPiece.element.style.cursor =
        "grab";

    holdPiece.element.style.pointerEvents =
        "auto";


    const usable =
        canPieceFitAnywhere(
            holdPiece
        );


    holdPiece.element.classList.toggle(
        "unusable",
        !usable
    );

    holdSlot.classList.toggle(
        "unusable",
        !usable
    );
}


/* =========================================================
   CHECK GAME OVER
   ========================================================= */

function checkGameOver() {

    if (gameOver) {
        return;
    }


    updatePieceUsability();


    /*
       ANY tray piece that fits
       means the game continues.
    */

    for (const piece of trayPieces) {

        if (
            canPieceFitAnywhere(
                piece
            )
        ) {

            return;
        }
    }


    /*
       HOLD can also keep the game alive.
    */

    if (
        holdPiece &&
        canPieceFitAnywhere(
            holdPiece
        )
    ) {

        return;
    }


    /*
       Nothing can move.
    */

    showGameOver();
}


/* =========================================================
   SCHEDULE GAME OVER CHECK
   ========================================================= */

function scheduleGameOverCheck(
    delay = 100
) {

    if (
        gameOverCheckTimer !== null
    ) {

        clearTimeout(
            gameOverCheckTimer
        );
    }


    gameOverCheckTimer =
        setTimeout(
            () => {

                gameOverCheckTimer =
                    null;

                if (!gameOver) {

                    updatePieceUsability();

                    checkGameOver();
                }

            },
            delay
        );
}


/* =========================================================
   CLOSE GAME OVER
   ========================================================= */

function closeGameOverOverlay() {

    if (
        gameOverCheckTimer !== null
    ) {

        clearTimeout(
            gameOverCheckTimer
        );

        gameOverCheckTimer =
            null;
    }


    if (gameOverOverlay) {

        gameOverOverlay.remove();

        gameOverOverlay =
            null;
    }
}


/* =========================================================
   SHOW GAME OVER
   ========================================================= */

function showGameOver() {

    if (gameOver) {
        return;
    }


    gameOver =
        true;


    cancelDrag();


    const overlay =
        document.createElement("div");

    overlay.className =
        "game-over-overlay";


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
                type="button"
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


    const playAgain =
        overlay.querySelector(
            "#play-again"
        );


    if (playAgain) {

        playAgain.addEventListener(
            "click",
            () => {

                startNewGame();

                showScreen(
                    gameScreen
                );

            }
        );
    }


    playGameOverSound();
}


/* =========================================================
   START NEW GAME
   ========================================================= */

function startNewGame() {

    cancelDrag();


    if (
        gameOverCheckTimer !== null
    ) {

        clearTimeout(
            gameOverCheckTimer
        );

        gameOverCheckTimer =
            null;
    }


    closeGameOverOverlay();


    gameOver =
        false;


    score =
        0;


    holdPiece =
        null;


    trayPieces =
        [];


    if (scoreDisplay) {

        scoreDisplay.textContent =
            "0";
    }


    createBoard();

    createPieceTray();

    renderHoldPiece();

    updatePieceUsability();


    /*
       Normally the initial tray has moves.
       Still check it properly instead of
       assuming.
    */

    scheduleGameOverCheck(
        100
    );
}


/* =========================================================
   GLOBAL POINTER MOVE
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
   GLOBAL POINTER UP
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
   WINDOW BLUR SAFETY
   ========================================================= */

window.addEventListener(
    "blur",
    () => {

        cancelDrag();

    }
);


/* =========================================================
   INITIALISE
   ========================================================= */

setupNavigation();


if (homeScreen) {

    /*
       Landing page first.
    */

    showScreen(
        homeScreen
    );

} else {

    /*
       Fallback for older HTML.
    */

    startNewGame();
}
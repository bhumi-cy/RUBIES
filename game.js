const board = document.getElementById("board");
const pieceTray = document.getElementById("piece-tray");
const scoreDisplay = document.getElementById("score");

const boardSize = 8;

let cells = [];
let score = 0;

let dragging = false;
let draggedPiece = null;
let draggedShape = null;
let draggedColor = null;
let previewCells = [];


/* =========================================================
   PIECES
   ========================================================= */

const shapes = [

    [[0, 0]],

    [[0, 0], [0, 1]],

    [[0, 0], [1, 0]],

    [[0, 0], [0, 1], [0, 2]],

    [[0, 0], [1, 0], [2, 0]],

    [[0, 0], [0, 1], [0, 2], [0, 3]],

    [[0, 0], [1, 0], [2, 0], [3, 0]],

    [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1]
    ],

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
   CREATE BOARD
   ========================================================= */

for (let i = 0; i < boardSize * boardSize; i++) {

    const cell = document.createElement("div");

    cell.classList.add("cell");

    cells.push(cell);

    board.appendChild(cell);
}


/* =========================================================
   FIND BOARD CELL
   ========================================================= */

function getCellFromPointer(x, y) {

    const element = document.elementFromPoint(x, y);

    if (!element) {
        return null;
    }

    if (!element.classList.contains("cell")) {
        return null;
    }

    return element;
}


/* =========================================================
   CHECK PLACEMENT
   ========================================================= */

function calculatePlacement(startIndex, shape) {

    const startRow =
        Math.floor(startIndex / boardSize);

    const startColumn =
        startIndex % boardSize;

    const indexes = [];

    for (const block of shape) {

        const row =
            startRow + block[0];

        const column =
            startColumn + block[1];

        if (
            row < 0 ||
            row >= boardSize ||
            column < 0 ||
            column >= boardSize
        ) {
            return null;
        }

        const index =
            row * boardSize + column;

        if (
            cells[index].classList.contains("filled")
        ) {
            return null;
        }

        indexes.push(index);
    }

    return indexes;
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

        const cell = cells[index];

        cell.classList.add("drag-preview");

        cell.style.setProperty(
            "--preview-color",
            draggedColor
        );

        previewCells.push(cell);
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
   START DRAG
   ========================================================= */

function startDrag(event, piece) {

    event.preventDefault();

    dragging = true;

    draggedPiece = piece;
    draggedShape = piece.shape;
    draggedColor = piece.color;

    const element = piece.element;

    /*
       IMPORTANT:
       Capture the pointer so the piece keeps
       receiving movement events even when the
       pointer moves over other elements.
    */

    try {
        element.setPointerCapture(event.pointerId);
    } catch (error) {
        console.log("Pointer capture unavailable");
    }

    element.classList.add(
        "piece-dragging"
    );

    updateDragPosition(event);
}


/* =========================================================
   DRAG MOVEMENT
   ========================================================= */

function updateDragPosition(event) {

    if (!dragging) {
        return;
    }

    const cell =
        getCellFromPointer(
            event.clientX,
            event.clientY
        );

    if (!cell) {

        clearPreview();

        return;
    }

    const index =
        cells.indexOf(cell);

    if (index === -1) {
        return;
    }

    showPreview(index);
}


/* =========================================================
   END DRAG
   ========================================================= */

function endDrag(event) {

    if (!dragging) {
        return;
    }

    const cell =
        getCellFromPointer(
            event.clientX,
            event.clientY
        );

    let placed = false;

    if (cell) {

        const index =
            cells.indexOf(cell);

        if (index !== -1) {

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
            // Pointer may already be released.
        }
    }

    if (placed) {

        currentPiece.element.classList.add(
            "piece-used"
        );

        const oldElement =
            currentPiece.element;

        setTimeout(() => {

            oldElement.remove();

            createSinglePiece();

        }, 150);
    }

    dragging = false;

    draggedPiece = null;
    draggedShape = null;
    draggedColor = null;
}


/* =========================================================
   PLACE PIECE
   ========================================================= */

function placePiece(indexes, color) {

    indexes.forEach(index => {

        const cell =
            cells[index];

        cell.classList.add("filled");

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
   CLEAR LINES
   ========================================================= */

function clearLines() {

    const rows = [];
    const columns = [];


    /* ROWS */

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
                row * boardSize + column;

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


    /* COLUMNS */

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
                row * boardSize + column;

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
        rows.length + columns.length;

    if (totalLines === 0) {
        return;
    }


    /* ANIMATE */

    rows.forEach(row => {

        for (
            let column = 0;
            column < boardSize;
            column++
        ) {

            cells[
                row * boardSize + column
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
                row * boardSize + column
            ].classList.add(
                "cell-clear"
            );
        }
    });


    /* SCORE */

    const points =
        totalLines * 10;

    score += points;

    scoreDisplay.textContent =
        score;

    showScorePopup(points);


    /* REMOVE */

    setTimeout(() => {

        rows.forEach(row => {

            for (
                let column = 0;
                column < boardSize;
                column++
            ) {

                resetCell(
                    cells[
                        row * boardSize + column
                    ]
                );
            }
        });


        columns.forEach(column => {

            for (
                let row = 0;
                row < boardSize;
                row++
            ) {

                resetCell(
                    cells[
                        row * boardSize + column
                    ]
                );
            }
        });

    }, 280);
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

    cell.style.background = "";

    cell.style.boxShadow = "";
}


/* =========================================================
   SCORE POPUP
   ========================================================= */

function showScorePopup(points) {

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

    popup.style.left =
        `${rect.left + rect.width / 2}px`;

    popup.style.top =
        `${rect.top + rect.height / 2}px`;

    setTimeout(() => {

        popup.remove();

    }, 800);
}


/* =========================================================
   CREATE PIECE
   ========================================================= */

function createSinglePiece() {

    const element =
        document.createElement("div");

    element.classList.add(
        "piece"
    );


    /* RANDOM SHAPE */

    const shape =
        shapes[
            Math.floor(
                Math.random() *
                shapes.length
            )
        ];


    /* RANDOM COLOR */

    const color =
        colors[
            Math.floor(
                Math.random() *
                colors.length
            )
        ];


    const piece = {

        element: element,

        shape: shape,

        color: color
    };


    /* STORE DATA */

    element.shape = shape;

    element.color = color;


    element.style.setProperty(
        "--piece-color",
        color
    );


    /* =====================================================
       CALCULATE PIECE SIZE
       ===================================================== */

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
        `repeat(${maxColumn + 1}, 18px)`;

    element.style.gridTemplateRows =
        `repeat(${maxRow + 1}, 18px)`;


    /* =====================================================
       DRAW BLOCKS
       ===================================================== */

    shape.forEach(block => {

        const blockElement =
            document.createElement("div");

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


        /*
           Prevent the child blocks from becoming
           separate pointer targets.
        */

        blockElement.style.pointerEvents =
            "none";


        element.appendChild(
            blockElement
        );
    });


    /* =====================================================
       DRAG EVENT
       ===================================================== */

    element.addEventListener(
        "pointerdown",
        event => {

            startDrag(
                event,
                piece
            );
        }
    );


    pieceTray.appendChild(
        element
    );
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

        updateDragPosition(event);
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

        endDrag(event);
    }
);


/* =========================================================
   POINTER CANCEL
   ========================================================= */

document.addEventListener(
    "pointercancel",
    event => {

        if (!dragging) {
            return;
        }

        clearPreview();

        if (draggedPiece) {

            draggedPiece.element.classList.remove(
                "piece-dragging"
            );
        }

        dragging = false;

        draggedPiece = null;
        draggedShape = null;
        draggedColor = null;
    }
);


/* =========================================================
   INITIAL TRAY
   ========================================================= */

function createPieceTray() {

    pieceTray.innerHTML = "";

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        createSinglePiece();
    }
}


/* =========================================================
   START
   ========================================================= */

createPieceTray();
const cells = [];
let difficulty = {
    'xtraEasy': 39,
    'easy': 36,
    'medium': 33,
    'hard': 30,
    'xtraHard': 27
};
let selectedCell = null;
let time = 0;
let timestamp = 0;
let timeInterval = 1000;
let timeIntervalId = null;
let board = getEmptyBoard();

const ui = {
    puzzleContainer: document.getElementById('puzzle-container'),
    timer: document.getElementById('timer'),
    purge: document.getElementById('purge'),
    correct: document.getElementById('correct'),
    pause: document.getElementById('pause'),
    difficulty: document.getElementById('difficulty'),
    highlight: document.getElementById('highlight'),
    help: document.getElementById('help'),
    btn1: document.getElementById('btn1'),
    btn2: document.getElementById('btn2'),
    btn3: document.getElementById('btn3'),
    btn4: document.getElementById('btn4'),
    btn5: document.getElementById('btn5'),
    btn6: document.getElementById('btn6'),
    btn7: document.getElementById('btn7'),
    btn8: document.getElementById('btn8'),
    btn9: document.getElementById('btn9'),
    btnX: document.getElementById('btnX'),
    overlay: document.getElementById('overlay'),
    closeOverlay: document.getElementById('closeOverlay'),
    playAgain: document.getElementById('playAgain')
}

function updateTimer() {
    if (timestamp === 0) {
        timestamp = Date.now();
    }
    else {
        time += (Date.now() - timestamp);
        timestamp = Date.now();
    }
}

function resetTimer() {
    timestamp = 0;
    time = 0;
}

function getMinutesFromMilli(milli) {
    let minutes = Math.floor(milli / 60000);
    return String(minutes).padStart(2, '0');
}

function getSecondsFromMilli(milli) {
    let seconds = ((milli % 60000) / 1000).toFixed(0);
    return String(seconds).padStart(2, '0');
}

function updateTimerUI() {
    ui.timer.innerHTML = getMinutesFromMilli(time) + ':' + getSecondsFromMilli(time);
}

function startTimer() {
    if (timeIntervalId === null) {
        timeIntervalId = setInterval(function () {
            updateTimer();
            updateTimerUI();
        }, timeInterval);
    }
}

function stopTimer() {
    clearInterval(timeIntervalId);
    timestamp = 0;
    timeIntervalId = null;
}

function getEmptyBoard() {
    return [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];
}

function getNumArray() {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9];
}

function getRandomNumber() {
    return Math.floor(Math.random() * 9);
}

function getCorrectCellsFromTo(arrayFrom, arrayTo, num) {
    let count = 0;
    while (count < num) {

        let row = getRandomNumber();
        let col = getRandomNumber();

        if (row < arrayFrom.length && col < arrayFrom[row].length) {
            if (row < arrayTo.length && col < arrayTo[row].length) {
                if (arrayTo[row][col] === 0) {
                    arrayTo[row][col] = arrayFrom[row][col];
                    count = ++count;
                }
            }
        }
    }
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var rand = Math.floor(Math.random() * (i + 1));
        [array[i], array[rand]] = [array[rand], array[i]]
    }
}

function emptyArray(array) {
    while (array.length > 0) {
        array.pop();
    }
}

function removeClassFromArray(array, name) {
    for (let i = 0; i < array.length; i++) {
        array[i].classList.remove(name);
    }
}

function removeIndexFromArray(array, index) {
    array.splice(index, 1)[0];
}

function isAlreadyInRow(row, num) {
    return board[row].includes(num);
}

function isAlreadyInColumn(col, num) {
    let inColumn = false;
    for (let i = 0; i < board.length; i++) {
        if (board[i][col] === num) {
            inColumn = true;
        }
    }
    return inColumn;
}

function showOrHideOverlay(show) {
    if (show) {
        ui.overlay.style.display = 'block';
    }
    else {
        ui.overlay.style.display = 'none';
    }
}

function getSection(rowIndex, colIndex) {
    let rowStart = 0;
    let rowStop = 2;

    let colStart = 0;
    let colStop = 2;

    if (rowIndex >= 3 && rowIndex <= 5) {
        rowStart = 3;
        rowStop = 5;
    } else if (rowIndex >= 6 && rowIndex <= 8) {
        rowStart = 6;
        rowStop = 8;
    }

    if (colIndex >= 3 && colIndex <= 5) {
        colStart = 3;
        colStop = 5;
    } else if (colIndex >= 6 && colIndex <= 8) {
        colStart = 6;
        colStop = 8;
    }

    return {
        rowStart: rowStart,
        rowStop: rowStop,
        colStart: colStart,
        colStop: colStop
    }
}

function isAlreadyInSection(rowIndex, colIndex, num) {
    let section = getSection(rowIndex, colIndex);
    return searchSection(section.rowStart, section.rowStop, section.colStart, section.colStop, num);
}

function searchSection(rowStart, rowStop, colStart, colStop, num) {
    let inSection = false;
    for (let i = rowStart; i <= rowStop; i++) {
        for (let j = colStart; j <= colStop; j++) {
            if (board[i][j] === num) {
                inSection = true;
            }
        }
    }
    return inSection;
}

function fillBoard(row = 0, col = 0) {
    if (row === 9) return true;

    let nextRow = col === 8 ? row + 1 : row;
    let nextCol = col === 8 ? 0 : col + 1;

    let numbers = getNumArray();
    shuffleArray(numbers);

    for (let n of numbers) {

        if (!isAlreadyInColumn(col, n) &&
            !isAlreadyInRow(row, n) &&
            !isAlreadyInSection(row, col, n)) {

            board[row][col] = n;

            if (fillBoard(nextRow, nextCol)) {
                return true;
            }
            board[row][col] = 0;
        }
    }
    return false;
}

function selectRowAndColCells(row, col) {
    for (let i = 0; i < cells.length; i++) {
        let cellRow = cells[i].getAttribute('data-row');
        let cellCol = cells[i].getAttribute('data-col');
        if (row + "" === cellRow || col + "" === cellCol) {
            cells[i].classList.add('selected');
        }
    }
}

function selectSectionCells(row, col) {
    let section = getSection(row, col);
    for (let i = 0; i < cells.length; i++) {
        let cellRow = cells[i].getAttribute('data-row');
        let cellCol = cells[i].getAttribute('data-col');
        if ((cellRow >= section.rowStart && cellRow <= section.rowStop)
            && (cellCol >= section.colStart && cellCol <= section.colStop)) {
            cells[i].classList.add('selected');
        }
    }
}

function resetPuzzleContainer() {
    ui.puzzleContainer.innerHTML = '';
}

function getSelectedDifficulty() {
    let selectedDifficulty = difficulty[ui.difficulty.value];
    if (!selectedDifficulty || selectedDifficulty === NaN) {
        selectedDifficulty = 36;
    }
    return selectedDifficulty;
}

function createCell() {
    let cell = document.createElement('div');
    cell.classList.add('cell');
    return cell;
}

function shouldCellBePrefilled(row, col, game, cell) {
    let isPrefilled = false;
    if (game[row][col] !== 0) {
        cell.innerHTML = game[row][col];
    }
    return isPrefilled;
}

function isCellPartOfHighlightedSection(row, col) {
    let partOfHighlightedSection = false;
    if ((row < 3 || row > 5) && (col < 3 || col > 5)) {
        partOfHighlightedSection = true;
    }
    else if ((row > 2 && row < 6) && (col > 2 && col < 6)) {
        partOfHighlightedSection = true;
    }
    return partOfHighlightedSection;
}

function createNewGameBoardUi() {
    resetPuzzleContainer();
    fillBoard(0, 0);
    let game = getEmptyBoard();
    let selectedDifficulty = getSelectedDifficulty();
    getCorrectCellsFromTo(board, game, selectedDifficulty);
    emptyArray(cells);

    for (let i = 0; i < game.length; i++) {
        for (let j = 0; j < game[i].length; j++) {

            let cell = createCell();
            cells.push(cell);
            if (shouldCellBePrefilled(i, j, game, cell)) {
                cell.classList.add('freeze');
            }
            ui.puzzleContainer.appendChild(cell)
            if (isCellPartOfHighlightedSection(i, j)) {
                cell.classList.add('sectionHighlight');
            }

            cell.setAttribute('data-row', i);
            cell.setAttribute('data-col', j);
            cell.addEventListener('click', function (e) {
                removeClassFromArray(cells, 'selected');
                if (!cell.classList.contains('freeze')
                    && !cell.classList.contains('helped')) {
                    cell.classList.add('selected');
                    selectedCell = cell;
                    if (ui.highlight.value === 'rowcolumn') {
                        selectRowAndColCells(i, j);
                    }
                    else if (ui.highlight.value === 'section') {
                        selectSectionCells(i, j);
                    }
                    else if (ui.highlight.value === 'rowcolumnsection') {
                        selectRowAndColCells(i, j);
                        selectSectionCells(i, j);
                    }
                }
            });
        }
    }
}

function init() {
    createNewGameBoardUi();
    startTimer();
    console.log(board);
}

ui.purge.addEventListener('click', function (e) {
    for (let i = 0; i < cells.length; i++) {
        if (!cells[i].classList.contains('freeze')
            && !cells[i].classList.contains('helped')) {
            cells[i].innerHTML = '';
        }
    }
});

ui.correct.addEventListener('click', function (e) {
    let allCorrect = true;
    removeClassFromArray(cells, 'wrong');
    for (let i = 0; i < cells.length; i++) {
        let row = cells[i].getAttribute('data-row');
        let col = cells[i].getAttribute('data-col');
        if (cells[i].innerHTML !== '' + board[row][col]) {
            cells[i].classList.add('wrong');
            allCorrect = false;
        }
    }
    showOrHideOverlay(allCorrect);
    if(allCorrect) {
        stopTimer();
    }
});

ui.pause.addEventListener('click', function (e) {
    if (timestamp === 0) {
        startTimer();
        ui.pause.innerHTML = 'Pausa';
    }
    else {
        stopTimer();
        ui.pause.innerHTML = 'Starta';
    }
});

ui.help.addEventListener('click', function (e) {
    if (selectedCell) {
        let row = selectedCell.getAttribute('data-row');
        let col = selectedCell.getAttribute('data-col');
        selectedCell.innerHTML = board[row][col];
        selectedCell.classList.add('helped');
    }
});

function setUICellValue(value) {
    if (selectedCell
        && !selectedCell.classList.contains('freeze')
        && !selectedCell.classList.contains('helped')
    ) {
        selectedCell.innerHTML = value;
    }
}

ui.difficulty.addEventListener('change', function (e) {
    init();
});

ui.btn1.addEventListener('click', function (e) {
    setUICellValue('1');
});

ui.btn2.addEventListener('click', function (e) {
    setUICellValue('2');
});

ui.btn3.addEventListener('click', function (e) {
    setUICellValue('3');
});

ui.btn4.addEventListener('click', function (e) {
    setUICellValue('4');
});

ui.btn5.addEventListener('click', function (e) {
    setUICellValue('5');
});

ui.btn6.addEventListener('click', function (e) {
    setUICellValue('6');
});

ui.btn7.addEventListener('click', function (e) {
    setUICellValue('7');
});

ui.btn8.addEventListener('click', function (e) {
    setUICellValue('8');
});

ui.btn9.addEventListener('click', function (e) {
    setUICellValue('9');
});

ui.btnX.addEventListener('click', function (e) {
    setUICellValue('');
});

ui.closeOverlay.addEventListener('click', function (e) {
    showOrHideOverlay(false);
});

ui.playAgain.addEventListener('click', function (e) {
    showOrHideOverlay(false);
    resetTimer();
    init();
});

document.addEventListener('keyup', (e) => {
    const key = e.key;
    let num = parseInt(key, 10);
    if (num != NaN) {
        if (num >= 1 && num <= 9) {
            setUICellValue(key);
        }
    }
});

init();
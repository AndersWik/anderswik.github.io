/*
 * A simple calculator.
 *
 * The calculator remembers three things (its "state"):
 *
 *   firstNumber   the number typed before the operator    e.g. "200"
 *   operator      one of "+", "-", "X", "/"                e.g. "+"
 *   secondNumber  the number typed after the operator     e.g. "20"
 *
 * Every button press changes the state, and then we redraw the display
 * from the state. The numbers are kept as text while typing, so that
 * "0." or "12.50" look right, and are turned into real numbers only
 * when we calculate.
 */

// --- State ---------------------------------------------------------------

let firstNumber = "";
let operator = "";
let secondNumber = "";

// --- Elements on the page ------------------------------------------------

const display = document.getElementById("output");
const buttons = document.querySelectorAll(".calc-button");

// --- Helpers -------------------------------------------------------------

// Show the current state in the display, e.g. "200+20".
function updateDisplay() {
    display.value = firstNumber + operator + secondNumber;
}

// Computers can't store all decimals exactly, so 0.1 + 0.2 gives
// 0.30000000000000004. Rounding to 10 decimals hides that.
function round(number) {
    return Math.round(number * 1e10) / 1e10;
}

// Do the actual maths on two numbers.
function calculate(a, op, b) {
    if (op === "+") return a + b;
    if (op === "-") return a - b;
    if (op === "X") return a * b;
    if (op === "/") return a / b;
}

// Percentage maths. "b" is the percentage, e.g. 20 means 20%.
//   200 X 20%  ->  40    (20% of 200)
//   200 + 20%  ->  240   (200 plus 20% of 200)
//   200 - 20%  ->  160   (200 minus 20% of 200)
//   200 / 20%  ->  1000  (200 divided by 0.2)
function calculatePercent(a, op, b) {
    const percentOfA = a * (b / 100);

    if (op === "+") return a + percentOfA;
    if (op === "-") return a - percentOfA;
    if (op === "X") return percentOfA;
    if (op === "/") return a / (b / 100);
}

// Put a result back into the state so the user can keep calculating with it.
function showResult(result) {
    if (!isFinite(result)) {
        // Dividing by zero gives Infinity, and broken input like "-" gives
        // NaN ("not a number"). Show an error and start over.
        clearAll();
        display.value = "Error";
        return;
    }

    firstNumber = String(round(result));
    operator = "";
    secondNumber = "";
    updateDisplay();
}

// --- What each kind of button does ---------------------------------------

function clearAll() {
    firstNumber = "";
    operator = "";
    secondNumber = "";
    updateDisplay();
}

// Remove the last thing typed: a digit of the second number,
// then the operator, then digits of the first number.
function backspace() {
    if (secondNumber !== "") {
        secondNumber = secondNumber.slice(0, -1);
    } else if (operator !== "") {
        operator = "";
    } else {
        firstNumber = firstNumber.slice(0, -1);
    }
    updateDisplay();
}

// A digit or the decimal point. Add it to the number we are typing.
function typeDigit(digit) {
    // Before an operator is chosen we are typing the first number.
    let current = operator === "" ? firstNumber : secondNumber;

    // A number can only have one decimal point.
    if (digit === "." && current.includes(".")) {
        return;
    }
    // Write "0.5" instead of ".5".
    if (digit === "." && current === "") {
        digit = "0.";
    }

    current = current + digit;

    if (operator === "") {
        firstNumber = current;
    } else {
        secondNumber = current;
    }
    updateDisplay();
}

function chooseOperator(newOperator) {
    // We need a number before an operator.
    if (firstNumber === "") {
        return;
    }
    // "200+20" and then "X": calculate 200+20 first, then continue with X.
    if (secondNumber !== "") {
        pressEquals();
    }
    operator = newOperator;
    updateDisplay();
}

function pressEquals() {
    // Nothing to calculate unless we have "number operator number".
    if (secondNumber === "") {
        return;
    }
    const result = calculate(Number(firstNumber), operator, Number(secondNumber));
    showResult(result);
}

function pressPercent() {
    if (secondNumber === "") {
        return;
    }
    const result = calculatePercent(Number(firstNumber), operator, Number(secondNumber));
    showResult(result);
}

// --- Connect the buttons -------------------------------------------------

// Every button has a data-val attribute that says what it is.
function onButtonClick(event) {
    const value = event.currentTarget.dataset.val;

    if (value === "ac") {
        clearAll();
    } else if (value === "<") {
        backspace();
    } else if (value === "=") {
        pressEquals();
    } else if (value === "%") {
        pressPercent();
    } else if (["+", "-", "X", "/"].includes(value)) {
        chooseOperator(value);
    } else {
        typeDigit(value); // 0-9 or "."
    }
}

buttons.forEach(function (button) {
    button.addEventListener("click", onButtonClick);
});

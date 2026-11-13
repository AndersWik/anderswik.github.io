/*
 * MySQL Playground: log in to a pretend MySQL server and try SQL.
 *
 * There are two places to type commands, like on a real server:
 *
 *   the shell   user@playground:~$   ls, cat, mysql, mysqldump, sudo ...
 *   mysql       mysql>               SQL like SELECT, INSERT, CREATE TABLE
 *
 * The shell has one folder, /home/user, where dumps are exported to and
 * imported from. Its files are kept in state.files, by name.
 *
 * The databases are plain objects:
 *
 *   state.databases.shop.tables.products = {
 *       name: "products",
 *       columns: [{ name: "id", type: "int", unsigned: true, notNull: true, autoIncrement: true, ... }, ...],
 *       primaryKey: ["id"],
 *       uniqueKeys: [],
 *       rows: [[1, "Lamp", 1, 199.9, "2026-11-07"], ...],
 *       autoIncrement: 6
 *   }
 *
 * SQL is read in three steps:
 *   1. sqlTokens()   splits the text into words, strings, numbers and symbols
 *   2. Parser        reads the tokens of one statement into a small tree
 *   3. run...()      does what the statement says and returns a result
 *
 * The example database is made by running ordinary SQL (SETUP_SQL) through
 * the same code, so everything in it could also be typed by hand.
 */

// --- Elements on the page ------------------------------------------------

const terminal = document.getElementById("terminal");
const output = document.getElementById("output");
const form = document.getElementById("command-form");
const promptLabel = document.getElementById("prompt");
const input = document.getElementById("command");
const exampleButtons = document.querySelectorAll("[data-command]");

// --- Settings ------------------------------------------------------------

const STORAGE_KEY = "mysql-playground";
const LOGIN = "user";
const HOSTNAME = "playground";
const HOME = "/home/user";
const SERVER_VERSION = "8.0.40";
const DEFAULT_PASSWORD = "root";
const SYSTEM_DATABASES = ["information_schema", "mysql", "performance_schema", "sys"];
const MAX_LINES = 1500;
const MAX_HISTORY = 100;

const SETUP_SQL = `
CREATE DATABASE shop;
USE shop;

CREATE TABLE products (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    price DECIMAL(10,2),
    added DATE
);
INSERT INTO products (name, in_stock, price, added) VALUES
    ('Lamp', TRUE, 199.90, '2026-11-07'),
    ('Chair', TRUE, 499.00, '2026-10-21'),
    ('Desk', FALSE, 1495.00, '2026-09-30'),
    ('Mug', TRUE, 49.50, '2026-11-01'),
    ('Poster', TRUE, NULL, NULL);

CREATE TABLE users (id INTEGER PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, active BOOLEAN);
INSERT INTO users (name, active) VALUES ('Anna', TRUE), ('Erik', FALSE), ('Maja', TRUE);

CREATE TABLE links (id INT PRIMARY KEY AUTO_INCREMENT, url VARCHAR(255));
INSERT INTO links (url) VALUES ('https://anderswik.se'), ('//example.com'), ('blog/first-post'), ('/about');
`;

const BOOKS_SQL = `-- Books for a library database.
-- Make the database first (in mysql):  create database library;
-- Then import this file (in the shell): mysql -u root -p library < books.sql

CREATE TABLE books (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100),
    year INT
);

INSERT INTO books (title, author, year) VALUES
    ('The Hobbit', 'J.R.R. Tolkien', 1937),
    ('Pippi Longstocking', 'Astrid Lindgren', 1945),
    ('Dune', 'Frank Herbert', 1965),
    ('The Pragmatic Programmer', 'Andrew Hunt', 1999);
`;

// --- State ---------------------------------------------------------------

let state = null;        // { databases, files, rootPassword, running } - saved
let mode = "shell";      // "shell", "mysql" or "password"
let session = null;      // { user, database } while logged in to mysql
let sqlBuffer = "";      // lines of a statement that has no ; yet
let passwordWait = null; // what to do with the password when it is typed
let history = [];
let historyIndex = 0;

// =========================================================================
// The screen
// =========================================================================

// Print text parts, each with an optional color class. "\n" starts a new line.
// textContent, never innerHTML: a value like "<img onerror=...>" stays text.
function print(parts) {
    let line = document.createElement("div");
    line.className = "line";
    let used = false;

    parts.forEach(function (part) {
        part.text.split("\n").forEach(function (piece, index) {
            if (index > 0) {
                output.appendChild(line);
                line = document.createElement("div");
                line.className = "line";
                used = false;
            }
            if (piece) {
                const span = document.createElement("span");
                span.textContent = piece;
                if (part.cls) {
                    span.className = part.cls;
                }
                line.appendChild(span);
                used = true;
            }
        });
    });
    if (used) {
        output.appendChild(line);
    }
    while (output.children.length > MAX_LINES) {
        output.firstElementChild.remove();
    }
}

function say(text, cls) {
    print([{ text: text, cls: cls }]);
}

function promptParts() {
    if (mode === "password") {
        return [{ text: "Enter password: " }];
    }
    if (mode === "mysql") {
        if (!sqlBuffer) {
            return [{ text: "mysql> " }];
        }
        const open = sqlTokens(sqlBuffer).open;
        return [{ text: open ? "    " + open + "> " : "    -> " }];
    }
    return [
        { text: LOGIN + "@" + HOSTNAME, cls: "user" },
        { text: ":" },
        { text: "~", cls: "path" },
        { text: "$ " }
    ];
}

function showPrompt() {
    promptLabel.replaceChildren();
    promptParts().forEach(function (part) {
        const span = document.createElement("span");
        span.textContent = part.text;
        if (part.cls) {
            span.className = part.cls;
        }
        promptLabel.appendChild(span);
    });
    // A password is typed without showing it.
    input.type = mode === "password" ? "password" : "text";
}

function scrollDown() {
    terminal.scrollTop = terminal.scrollHeight;
}

// =========================================================================
// SQL: tokens
// =========================================================================

// "SELECT name FROM `my table` WHERE id = 1;" ->
// words, identifiers (in backticks), strings, numbers and symbols, each with
// where it starts and ends in the text. open tells if a quote or comment is
// still open at the end, so the prompt can ask for more.
function sqlTokens(text) {
    const tokens = [];
    let i = 0;
    let open = null;

    while (i < text.length) {
        const c = text[i];
        const start = i;

        if (/\s/.test(c)) {
            i++;
        } else if ((c === "-" && text[i + 1] === "-" && (i + 2 >= text.length || /\s/.test(text[i + 2]))) || c === "#") {
            while (i < text.length && text[i] !== "\n") {
                i++;
            }
        } else if (c === "/" && text[i + 1] === "*") {
            const end = text.indexOf("*/", i + 2);
            if (end === -1) {
                open = "/*";
                break;
            }
            i = end + 2;
        } else if (c === "'" || c === "\"") {
            let value = "";
            let j = i + 1;
            let closed = false;
            while (j < text.length) {
                if (text[j] === "\\" && j + 1 < text.length) {
                    const escapes = { n: "\n", t: "\t", r: "\r", "0": "\0" };
                    value += Object.hasOwn(escapes, text[j + 1]) ? escapes[text[j + 1]] : text[j + 1];
                    j += 2;
                } else if (text[j] === c && text[j + 1] === c) {
                    value += c;                 // '' inside '...' is one '
                    j += 2;
                } else if (text[j] === c) {
                    closed = true;
                    j++;
                    break;
                } else {
                    value += text[j];
                    j++;
                }
            }
            if (!closed) {
                open = c;
                break;
            }
            tokens.push({ type: "string", value: value, start: start, end: j });
            i = j;
        } else if (c === "`") {
            const end = text.indexOf("`", i + 1);
            if (end === -1) {
                open = "`";
                break;
            }
            tokens.push({ type: "ident", value: text.slice(i + 1, end), start: start, end: end + 1 });
            i = end + 1;
        } else if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(text[i + 1] || ""))) {
            const match = /^(\d*\.\d+|\d+(\.\d*)?)([eE][-+]?\d+)?/.exec(text.slice(i));
            tokens.push({ type: "number", value: Number(match[0]), start: start, end: i + match[0].length });
            i += match[0].length;
        } else if (/[A-Za-z_$]/.test(c)) {
            const match = /^[A-Za-z_$][\w$]*/.exec(text.slice(i));
            tokens.push({ type: "word", value: match[0], upper: match[0].toUpperCase(), start: start, end: i + match[0].length });
            i += match[0].length;
        } else {
            const two = text.slice(i, i + 2);
            const symbol = ["<=", ">=", "<>", "!=", "||", "&&"].includes(two) ? two : c;
            tokens.push({ type: "op", value: symbol, start: start, end: i + symbol.length });
            i += symbol.length;
        }
    }
    return { tokens: tokens, open: open };
}

// Split a script into statements at each ;. Each statement keeps its text,
// so errors can quote it, and the line it starts on, for "at line 3".
function splitStatements(text) {
    const result = sqlTokens(text);
    const statements = [];
    let current = [];

    function finish(endToken) {
        if (current.length) {
            const start = current[0].start;
            const end = current[current.length - 1].end;
            const shifted = current.map(function (token) {
                return Object.assign({}, token, { start: token.start - start, end: token.end - start });
            });
            statements.push({
                tokens: shifted,
                text: text.slice(start, end),
                line: text.slice(0, start).split("\n").length,
                complete: Boolean(endToken)
            });
        }
        current = [];
    }

    result.tokens.forEach(function (token) {
        if (token.type === "op" && token.value === ";") {
            finish(token);
        } else {
            current.push(token);
        }
    });
    finish(null);
    return { statements: statements, open: result.open };
}

// =========================================================================
// SQL: errors
// =========================================================================

function SqlError(code, sqlState, message) {
    this.code = code;
    this.sqlState = sqlState;
    this.message = message;
}

function sqlError(code, sqlState, message) {
    return new SqlError(code, sqlState, message);
}

function notSupported(what) {
    return sqlError(1235, "42000", "This playground doesn't support '" + what + "' yet");
}

function noDatabase() {
    return sqlError(1046, "3D000", "No database selected");
}

function noTable(database, name) {
    return sqlError(1146, "42S02", "Table '" + database + "." + name + "' doesn't exist");
}

// =========================================================================
// SQL: reading a statement
// =========================================================================

const AGGREGATES = ["COUNT", "MIN", "MAX", "SUM", "AVG"];
const FUNCTIONS = AGGREGATES.concat([
    "CONCAT", "UPPER", "UCASE", "LOWER", "LCASE", "LENGTH", "CHAR_LENGTH", "TRIM", "LTRIM", "RTRIM",
    "REPLACE", "SUBSTRING", "SUBSTR", "LEFT", "RIGHT", "ROUND", "FLOOR", "CEIL", "CEILING", "ABS",
    "NOW", "CURDATE", "CURRENT_DATE", "CURRENT_TIMESTAMP", "DATABASE", "VERSION", "USER",
    "CURRENT_USER", "IFNULL", "COALESCE", "IF"
]);
// Words that end an expression, so they are not read as an alias.
const CLAUSE_WORDS = ["FROM", "WHERE", "ORDER", "GROUP", "HAVING", "LIMIT", "AS", "JOIN", "LEFT",
    "RIGHT", "INNER", "ON", "UNION", "INTO", "VALUES", "SET", "ASC", "DESC", "AND", "OR", "NOT"];

function Parser(statement) {
    this.tokens = statement.tokens;
    this.text = statement.text;
    this.pos = 0;
}

Parser.prototype.peek = function (ahead) {
    return this.tokens[this.pos + (ahead || 0)] || { type: "end", value: "", upper: "", start: this.text.length, end: this.text.length };
};

Parser.prototype.next = function () {
    const token = this.peek();
    this.pos++;
    return token;
};

Parser.prototype.isWord = function () {
    const token = this.peek();
    return token.type === "word" && Array.from(arguments).includes(token.upper);
};

Parser.prototype.acceptWord = function (word) {
    if (this.isWord(word)) {
        this.pos++;
        return true;
    }
    return false;
};

Parser.prototype.expectWord = function (word) {
    if (!this.acceptWord(word)) {
        throw this.syntaxError();
    }
};

Parser.prototype.isOp = function () {
    const token = this.peek();
    return token.type === "op" && Array.from(arguments).includes(token.value);
};

Parser.prototype.acceptOp = function (op) {
    if (this.isOp(op)) {
        this.pos++;
        return true;
    }
    return false;
};

Parser.prototype.expectOp = function (op) {
    if (!this.acceptOp(op)) {
        throw this.syntaxError();
    }
};

// A name of a database, table or column: a word or `a backtick name`.
Parser.prototype.name = function () {
    const token = this.peek();
    if (token.type === "word" || token.type === "ident") {
        this.pos++;
        return token.value;
    }
    throw this.syntaxError();
};

// "products" or "shop.products"
Parser.prototype.tableName = function () {
    const first = this.name();
    if (this.acceptOp(".")) {
        return { database: first, table: this.name() };
    }
    return { database: null, table: first };
};

Parser.prototype.end = function () {
    if (this.peek().type !== "end") {
        throw this.syntaxError();
    }
};

// MySQL quotes the text from where it got confused.
Parser.prototype.syntaxError = function () {
    const token = this.peek();
    const near = this.text.slice(token.start, token.start + 80);
    const line = this.text.slice(0, token.start).split("\n").length;
    return sqlError(1064, "42000", "You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '" + near + "' at line " + line);
};

// The text of tokens from..to, for column headers like "MIN(id)".
Parser.prototype.textBetween = function (from, to) {
    if (to <= from) {
        return "";
    }
    return this.text.slice(this.tokens[from].start, this.tokens[to - 1].end);
};

// --- Expressions, from the loosest binding to the tightest ---------------

Parser.prototype.expression = function () {
    return this.orExpression();
};

Parser.prototype.orExpression = function () {
    let left = this.andExpression();
    while (this.acceptWord("OR") || this.acceptOp("||")) {
        left = { k: "or", a: left, b: this.andExpression() };
    }
    return left;
};

Parser.prototype.andExpression = function () {
    let left = this.notExpression();
    while (this.acceptWord("AND") || this.acceptOp("&&")) {
        left = { k: "and", a: left, b: this.notExpression() };
    }
    return left;
};

Parser.prototype.notExpression = function () {
    if (this.acceptWord("NOT") || this.acceptOp("!")) {
        return { k: "not", a: this.notExpression() };
    }
    return this.comparison();
};

Parser.prototype.comparison = function () {
    let left = this.additive();
    for (;;) {
        if (this.isOp("=", "<", ">", "<=", ">=", "<>", "!=")) {
            const op = this.next().value;
            left = { k: "cmp", op: op, a: left, b: this.additive() };
        } else if (this.acceptWord("IS")) {
            const negate = this.acceptWord("NOT");
            if (this.acceptWord("NULL")) {
                left = { k: "isnull", a: left, negate: negate };
            } else if (this.isWord("TRUE", "FALSE")) {
                left = { k: "istrue", a: left, value: this.next().upper === "TRUE", negate: negate };
            } else {
                throw this.syntaxError();
            }
        } else if (this.isWord("LIKE", "IN", "BETWEEN") || (this.isWord("NOT") && ["LIKE", "IN", "BETWEEN"].includes(this.peek(1).upper))) {
            const negate = this.acceptWord("NOT");
            const word = this.next().upper;
            if (word === "LIKE") {
                left = { k: "like", a: left, b: this.additive(), negate: negate };
            } else if (word === "IN") {
                this.expectOp("(");
                if (this.isWord("SELECT")) {
                    throw notSupported("subqueries");
                }
                const list = [this.expression()];
                while (this.acceptOp(",")) {
                    list.push(this.expression());
                }
                this.expectOp(")");
                left = { k: "in", a: left, list: list, negate: negate };
            } else {
                const low = this.additive();
                this.expectWord("AND");
                left = { k: "between", a: left, low: low, high: this.additive(), negate: negate };
            }
        } else {
            return left;
        }
    }
};

Parser.prototype.additive = function () {
    let left = this.multiplicative();
    while (this.isOp("+", "-")) {
        const op = this.next().value;
        left = { k: "math", op: op, a: left, b: this.multiplicative() };
    }
    return left;
};

Parser.prototype.multiplicative = function () {
    let left = this.unary();
    while (this.isOp("*", "/", "%") || this.isWord("DIV", "MOD")) {
        const token = this.next();
        const op = token.type === "word" ? (token.upper === "MOD" ? "%" : "DIV") : token.value;
        left = { k: "math", op: op, a: left, b: this.unary() };
    }
    return left;
};

Parser.prototype.unary = function () {
    if (this.acceptOp("-")) {
        return { k: "neg", a: this.unary() };
    }
    if (this.acceptOp("+")) {
        return this.unary();
    }
    return this.primary();
};

Parser.prototype.primary = function () {
    const token = this.peek();

    if (token.type === "number" || token.type === "string") {
        this.pos++;
        return { k: "lit", v: token.value };
    }
    if (token.type === "op" && token.value === "(") {
        this.pos++;
        if (this.isWord("SELECT")) {
            throw notSupported("subqueries");
        }
        const inner = this.expression();
        this.expectOp(")");
        return inner;
    }
    if (token.type === "word") {
        if (token.upper === "NULL") {
            this.pos++;
            return { k: "lit", v: null };
        }
        if (token.upper === "TRUE" || token.upper === "FALSE") {
            this.pos++;
            return { k: "lit", v: token.upper === "TRUE" ? 1 : 0 };
        }
        if (["CURRENT_DATE", "CURRENT_TIMESTAMP"].includes(token.upper) && !(this.peek(1).type === "op" && this.peek(1).value === "(")) {
            this.pos++;
            return { k: "fn", name: token.upper, args: [] };
        }
        if (this.peek(1).type === "op" && this.peek(1).value === "(") {
            return this.functionCall();
        }
    }
    if (token.type === "word" || token.type === "ident") {
        this.pos++;
        let name = token.value;
        if (this.acceptOp(".")) {
            name = this.name();             // products.name -> name
        }
        return { k: "col", name: name };
    }
    throw this.syntaxError();
};

Parser.prototype.functionCall = function () {
    const name = this.next().upper;
    this.next();                            // (
    if (!FUNCTIONS.includes(name)) {
        throw sqlError(1305, "42000", "FUNCTION " + name.toLowerCase() + " does not exist");
    }

    // TRIM([BOTH | LEADING | TRAILING] [remove] FROM text) or TRIM(text)
    if (name === "TRIM") {
        let side = "BOTH";
        let remove = null;
        let text;
        if (this.isWord("BOTH", "LEADING", "TRAILING")) {
            side = this.next().upper;
            if (!this.isWord("FROM")) {
                remove = this.expression();
            }
            this.expectWord("FROM");
            text = this.expression();
        } else {
            text = this.expression();
            if (this.acceptWord("FROM")) {
                remove = text;
                text = this.expression();
            }
        }
        this.expectOp(")");
        return { k: "fn", name: "TRIM", side: side, args: remove ? [text, remove] : [text] };
    }

    const node = { k: "fn", name: name, args: [] };
    if (AGGREGATES.includes(name)) {
        node.distinct = this.acceptWord("DISTINCT");
        if (name === "COUNT" && this.acceptOp("*")) {
            node.star = true;
        }
    }
    if (!node.star && !this.isOp(")")) {
        node.args.push(this.expression());
        while (this.acceptOp(",")) {
            node.args.push(this.expression());
        }
    }
    this.expectOp(")");
    return node;
};

// =========================================================================
// SQL: values and evaluation
// =========================================================================

const INT_TYPES = ["tinyint", "smallint", "mediumint", "int", "bigint"];
const INT_RANGES = {
    tinyint: [-128, 127], smallint: [-32768, 32767], mediumint: [-8388608, 8388607],
    int: [-2147483648, 2147483647], bigint: [-9223372036854775808, 9223372036854775807]
};
const TEXT_TYPES = ["varchar", "char", "text", "tinytext", "mediumtext", "longtext"];

function isNumericType(column) {
    return INT_TYPES.includes(column.type) || ["decimal", "float", "double"].includes(column.type);
}

function findColumn(table, name) {
    const lower = String(name).toLowerCase();
    return table.columns.findIndex(function (column) { return column.name.toLowerCase() === lower; });
}

function toNumber(value) {
    if (value === null) {
        return null;
    }
    if (typeof value === "number") {
        return value;
    }
    const number = parseFloat(value);
    return Number.isNaN(number) ? 0 : number;
}

// -1, 0 or 1, or null if either side is NULL. A number on either side makes
// it a number comparison. Text is compared without caring about case, like
// MySQL's default collation.
function compare(a, b) {
    if (a === null || b === null) {
        return null;
    }
    if (typeof a === "number" || typeof b === "number") {
        const x = toNumber(a);
        const y = toNumber(b);
        return x < y ? -1 : x > y ? 1 : 0;
    }
    const x = String(a).toLowerCase();
    const y = String(b).toLowerCase();
    return x < y ? -1 : x > y ? 1 : 0;
}

// SQL has three answers: true (1), false (0) and unknown (NULL).
function truth(value) {
    if (value === null) {
        return null;
    }
    return toNumber(value) !== 0;
}

function bool(value) {
    return value === null ? null : (value ? 1 : 0);
}

// LIKE 'a%' -> /^a.*$/i. % is any text, _ is one character.
function likeToRegExp(pattern) {
    let source = "";
    for (let i = 0; i < pattern.length; i++) {
        const c = pattern[i];
        if (c === "\\" && i + 1 < pattern.length) {
            source += pattern[i + 1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            i++;
        } else if (c === "%") {
            source += ".*";
        } else if (c === "_") {
            source += ".";
        } else {
            source += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
    }
    return new RegExp("^" + source + "$", "is");
}

function pad(n) {
    return String(n).padStart(2, "0");
}

function today() {
    const d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function now() {
    const d = new Date();
    return today() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
}

function isAggregate(node) {
    if (!node || typeof node !== "object") {
        return false;
    }
    if (node.k === "fn" && AGGREGATES.includes(node.name)) {
        return true;
    }
    return ["a", "b", "low", "high"].some(function (key) { return isAggregate(node[key]); }) ||
        (node.args || []).some(isAggregate) || (node.list || []).some(isAggregate);
}

// Check that every column the expression uses exists in the table.
function checkColumns(node, table, place) {
    if (!node || typeof node !== "object") {
        return;
    }
    if (node.k === "col" && (!table || findColumn(table, node.name) === -1)) {
        throw sqlError(1054, "42S22", "Unknown column '" + node.name + "' in '" + place + "'");
    }
    ["a", "b", "low", "high"].forEach(function (key) { checkColumns(node[key], table, place); });
    (node.args || []).concat(node.list || []).forEach(function (child) { checkColumns(child, table, place); });
}

// The value of an expression for one row.
// context: { table, row, rows (for COUNT, MIN ...), place }
function evaluate(node, context) {
    switch (node.k) {
    case "lit":
        return node.v;
    case "col": {
        const index = context.table ? findColumn(context.table, node.name) : -1;
        if (index === -1) {
            throw sqlError(1054, "42S22", "Unknown column '" + node.name + "' in '" + (context.place || "field list") + "'");
        }
        return context.row ? context.row[index] : null;
    }
    case "neg": {
        const value = evaluate(node.a, context);
        return value === null ? null : -toNumber(value);
    }
    case "math": {
        const a = evaluate(node.a, context);
        const b = evaluate(node.b, context);
        if (a === null || b === null) {
            return null;
        }
        const x = toNumber(a);
        const y = toNumber(b);
        switch (node.op) {
        case "+": return x + y;
        case "-": return x - y;
        case "*": return x * y;
        case "/": return y === 0 ? null : x / y;
        case "%": return y === 0 ? null : x % y;
        default: return y === 0 ? null : Math.trunc(x / y);
        }
    }
    case "cmp": {
        const result = compare(evaluate(node.a, context), evaluate(node.b, context));
        if (result === null) {
            return null;
        }
        const tests = {
            "=": result === 0, "<>": result !== 0, "!=": result !== 0,
            "<": result < 0, ">": result > 0, "<=": result <= 0, ">=": result >= 0
        };
        return bool(tests[node.op]);
    }
    case "and": {
        const a = truth(evaluate(node.a, context));
        const b = truth(evaluate(node.b, context));
        if (a === false || b === false) {
            return 0;
        }
        return a === null || b === null ? null : 1;
    }
    case "or": {
        const a = truth(evaluate(node.a, context));
        const b = truth(evaluate(node.b, context));
        if (a === true || b === true) {
            return 1;
        }
        return a === null || b === null ? null : 0;
    }
    case "not": {
        const value = truth(evaluate(node.a, context));
        return value === null ? null : bool(!value);
    }
    case "isnull":
        return bool((evaluate(node.a, context) === null) !== node.negate);
    case "istrue": {
        const value = truth(evaluate(node.a, context));
        return bool((value === node.value) !== node.negate);
    }
    case "like": {
        const value = evaluate(node.a, context);
        const pattern = evaluate(node.b, context);
        if (value === null || pattern === null) {
            return null;
        }
        return bool(likeToRegExp(String(pattern)).test(String(value)) !== node.negate);
    }
    case "in": {
        const value = evaluate(node.a, context);
        if (value === null) {
            return null;
        }
        let sawNull = false;
        for (const item of node.list) {
            const result = compare(value, evaluate(item, context));
            if (result === 0) {
                return bool(!node.negate);
            }
            sawNull = sawNull || result === null;
        }
        return sawNull ? null : bool(node.negate);
    }
    case "between": {
        const value = evaluate(node.a, context);
        const low = compare(value, evaluate(node.low, context));
        const high = compare(value, evaluate(node.high, context));
        if (low === null || high === null) {
            return null;
        }
        return bool((low >= 0 && high <= 0) !== node.negate);
    }
    case "fn":
        return callFunction(node, context);
    }
    throw sqlError(1064, "42000", "Unknown expression");
}

function callFunction(node, context) {
    if (AGGREGATES.includes(node.name)) {
        return aggregate(node, context);
    }
    const args = node.args.map(function (arg) { return evaluate(arg, context); });
    const first = args[0];
    const anyNull = args.some(function (arg) { return arg === null; });

    switch (node.name) {
    case "CONCAT":
        return anyNull ? null : args.map(String).join("");
    case "UPPER": case "UCASE":
        return first === null ? null : String(first).toUpperCase();
    case "LOWER": case "LCASE":
        return first === null ? null : String(first).toLowerCase();
    case "LENGTH":
        return first === null ? null : new TextEncoder().encode(String(first)).length;
    case "CHAR_LENGTH":
        return first === null ? null : Array.from(String(first)).length;
    case "LTRIM":
        return first === null ? null : String(first).replace(/^ +/, "");
    case "RTRIM":
        return first === null ? null : String(first).replace(/ +$/, "");
    case "TRIM": {
        if (anyNull) {
            return null;
        }
        let text = String(first);
        const remove = args.length > 1 ? String(args[1]) : " ";
        if (remove === "") {
            return text;
        }
        // MySQL removes the text again and again: TRIM(LEADING 'x' FROM 'xxa') = 'a'.
        if (node.side !== "TRAILING") {
            while (text.startsWith(remove)) {
                text = text.slice(remove.length);
            }
        }
        if (node.side !== "LEADING") {
            while (text.endsWith(remove)) {
                text = text.slice(0, -remove.length);
            }
        }
        return text;
    }
    case "REPLACE":
        return anyNull ? null : String(first).split(String(args[1])).join(String(args[2]));
    case "SUBSTRING": case "SUBSTR": {
        if (anyNull) {
            return null;
        }
        const chars = Array.from(String(first));
        let start = toNumber(args[1]);
        start = start > 0 ? start - 1 : chars.length + start;
        const length = args.length > 2 ? toNumber(args[2]) : chars.length;
        return chars.slice(start, start + length).join("");
    }
    case "LEFT":
        return anyNull ? null : Array.from(String(first)).slice(0, toNumber(args[1])).join("");
    case "RIGHT": {
        if (anyNull) {
            return null;
        }
        const n = toNumber(args[1]);
        return n <= 0 ? "" : Array.from(String(first)).slice(-n).join("");
    }
    case "ROUND": {
        if (anyNull) {
            return null;
        }
        const places = args.length > 1 ? toNumber(args[1]) : 0;
        return Number(toNumber(first).toFixed(Math.max(0, places)));
    }
    case "FLOOR":
        return first === null ? null : Math.floor(toNumber(first));
    case "CEIL": case "CEILING":
        return first === null ? null : Math.ceil(toNumber(first));
    case "ABS":
        return first === null ? null : Math.abs(toNumber(first));
    case "NOW": case "CURRENT_TIMESTAMP":
        return now();
    case "CURDATE": case "CURRENT_DATE":
        return today();
    case "DATABASE":
        return session && session.database ? session.database : null;
    case "VERSION":
        return SERVER_VERSION;
    case "USER": case "CURRENT_USER":
        return (session ? session.user : "root") + "@localhost";
    case "IFNULL":
        return first !== null ? first : args[1];
    case "COALESCE":
        return args.find(function (arg) { return arg !== null; }) ?? null;
    case "IF":
        return truth(first) ? args[1] : args[2];
    }
    throw sqlError(1305, "42000", "FUNCTION " + node.name.toLowerCase() + " does not exist");
}

// COUNT, MIN, MAX, SUM and AVG work on all rows at once.
function aggregate(node, context) {
    const rows = context.rows || [];
    if (node.star) {
        return rows.length;
    }
    let values = rows
        .map(function (row) { return evaluate(node.args[0], Object.assign({}, context, { row: row })); })
        .filter(function (value) { return value !== null; });
    if (node.distinct) {
        const seen = new Set();
        values = values.filter(function (value) {
            const key = valueKey(value);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    switch (node.name) {
    case "COUNT":
        return values.length;
    case "MIN":
    case "MAX":
        if (!values.length) {
            return null;
        }
        return values.reduce(function (best, value) {
            const result = compare(value, best);
            return (node.name === "MIN" ? result < 0 : result > 0) ? value : best;
        });
    case "SUM":
        return values.length ? values.reduce(function (sum, value) { return sum + toNumber(value); }, 0) : null;
    default:
        return values.length ? values.reduce(function (sum, value) { return sum + toNumber(value); }, 0) / values.length : null;
    }
}

// For DISTINCT and keys: 'Lamp' and 'lamp' count as the same.
function valueKey(value) {
    if (value === null) {
        return "null";
    }
    return typeof value === "number" ? "n:" + value : "s:" + String(value).toLowerCase();
}

// --- Fitting a value into a column ----------------------------------------

// Turn a value into what the column stores, or throw the error MySQL gives.
function coerce(value, column, rowNumber) {
    if (value === null) {
        return null;
    }
    const where = " for column '" + column.name + "' at row " + rowNumber;
    const looksNumeric = typeof value === "number" || /^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/.test(String(value));

    if (INT_TYPES.includes(column.type)) {
        if (!looksNumeric) {
            throw sqlError(1366, "HY000", "Incorrect integer value: '" + value + "'" + where);
        }
        const number = Math.round(Number(value));
        const range = INT_RANGES[column.type];
        const low = column.unsigned ? 0 : range[0];
        const high = column.unsigned ? range[1] * 2 + 1 : range[1];
        if (number < low || number > high) {
            throw sqlError(1264, "22003", "Out of range value for column '" + column.name + "' at row " + rowNumber);
        }
        return number;
    }
    if (column.type === "decimal") {
        if (!looksNumeric) {
            throw sqlError(1366, "HY000", "Incorrect decimal value: '" + value + "'" + where);
        }
        const number = Number(Number(value).toFixed(column.scale));
        if (Math.abs(number) >= Math.pow(10, column.length - column.scale) || (column.unsigned && number < 0)) {
            throw sqlError(1264, "22003", "Out of range value for column '" + column.name + "' at row " + rowNumber);
        }
        return number;
    }
    if (column.type === "float" || column.type === "double") {
        if (!looksNumeric) {
            throw sqlError(1265, "01000", "Data truncated" + where);
        }
        return Number(value);
    }
    if (TEXT_TYPES.includes(column.type)) {
        const text = String(value);
        if (column.length && Array.from(text).length > column.length) {
            throw sqlError(1406, "22001", "Data too long for column '" + column.name + "' at row " + rowNumber);
        }
        return text;
    }
    if (column.type === "date") {
        const match = /^(\d{4})-(\d{1,2})-(\d{1,2})( .*)?$/.exec(String(value));
        if (!match || !validDate(match)) {
            throw sqlError(1292, "22007", "Incorrect date value: '" + value + "'" + where);
        }
        return match[1] + "-" + pad(match[2]) + "-" + pad(match[3]);
    }
    // datetime and timestamp
    const match = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(String(value));
    if (!match || !validDate(match)) {
        throw sqlError(1292, "22007", "Incorrect datetime value: '" + value + "'" + where);
    }
    return match[1] + "-" + pad(match[2]) + "-" + pad(match[3]) + " " +
        pad(match[4] || 0) + ":" + pad(match[5] || 0) + ":" + pad(match[6] || 0);
}

function validDate(match) {
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return date.getUTCMonth() === Number(match[2]) - 1 && date.getUTCDate() === Number(match[3]);
}

// The value MySQL fills in when a column is left out.
function defaultFor(column) {
    if (column.defaultValue === "CURRENT_TIMESTAMP") {
        return column.type === "date" ? today() : now();
    }
    return column.defaultValue === undefined ? null : column.defaultValue;
}

// Is there already a row with the same primary key or unique value?
// Returns the error to throw, or null.
function duplicateError(table, row, rows, skipIndex) {
    const keys = [{ name: "PRIMARY", columns: table.primaryKey }].concat(
        table.uniqueKeys.map(function (key) { return { name: key.name, columns: key.columns }; }));

    for (const key of keys) {
        if (!key.columns.length) {
            continue;
        }
        const indexes = key.columns.map(function (name) { return findColumn(table, name); });
        const values = indexes.map(function (index) { return row[index]; });
        if (values.includes(null)) {
            continue;                       // NULL is never equal to anything, even in a unique key
        }
        const clash = rows.some(function (other, otherIndex) {
            return otherIndex !== skipIndex && indexes.every(function (index, i) { return compare(other[index], values[i]) === 0; });
        });
        if (clash) {
            const entry = values.map(function (value, i) { return formatValue(value, table.columns[indexes[i]]); }).join("-");
            return sqlError(1062, "23000", "Duplicate entry '" + entry + "' for key '" + table.name + "." + key.name + "'");
        }
    }
    return null;
}

// --- Showing values -------------------------------------------------------

function formatValue(value, column) {
    if (value === null) {
        return "NULL";
    }
    if (column && column.type === "decimal" && typeof value === "number") {
        return value.toFixed(column.scale);
    }
    return String(value);
}

// "int unsigned", "varchar(100)", "decimal(10,2)", "tinyint(1)"
function typeName(column) {
    let name = column.type;
    if (["varchar", "char"].includes(column.type) || (column.type === "tinyint" && column.length === 1)) {
        name += "(" + column.length + ")";
    } else if (column.type === "decimal") {
        name += "(" + column.length + "," + column.scale + ")";
    }
    return name + (column.unsigned ? " unsigned" : "");
}

// =========================================================================
// SQL: statements
// =========================================================================

// Results:
//   { rows: [...], headers: [...], right: [...] }   a table, from SELECT and SHOW
//   { affected: n, info: "...", warnings: n }       "Query OK", from changes
//   { message: "Database changed" }

function currentDatabase(name) {
    const database = name || (session && session.database);
    if (!database) {
        throw noDatabase();
    }
    if (!Object.hasOwn(state.databases, database)) {
        throw sqlError(1049, "42000", "Unknown database '" + database + "'");
    }
    return database;
}

function getTable(ref) {
    const database = currentDatabase(ref.database);
    const tables = state.databases[database].tables;
    if (!Object.hasOwn(tables, ref.table)) {
        throw noTable(database, ref.table);
    }
    return tables[ref.table];
}

function runStatement(statement) {
    const p = new Parser(statement);
    const first = p.peek();
    if (first.type !== "word") {
        throw p.syntaxError();
    }

    switch (first.upper) {
    case "SELECT": return runSelect(p);
    case "INSERT": return runInsert(p);
    case "UPDATE": return runUpdate(p);
    case "DELETE": return runDelete(p);
    case "CREATE": return runCreate(p);
    case "DROP": return runDrop(p);
    case "USE": return runUse(p);
    case "SHOW": return runShow(p);
    case "DESCRIBE": case "DESC": case "EXPLAIN": return runDescribe(p);
    case "TRUNCATE": return runTruncate(p);
    case "ALTER": return runAlter(p);
    case "GRANT": case "REVOKE": case "RENAME": case "REPLACE": case "LOCK": case "UNLOCK":
    case "START": case "BEGIN": case "COMMIT": case "ROLLBACK": case "SET":
        throw notSupported(first.upper);
    }
    throw p.syntaxError();
}

// --- SELECT ---------------------------------------------------------------

function runSelect(p) {
    p.expectWord("SELECT");
    const distinct = p.acceptWord("DISTINCT");
    p.acceptWord("ALL");

    // The list of what to show, with the text of each one as its header.
    const items = [];
    do {
        if (p.acceptOp("*")) {
            items.push({ star: true });
            continue;
        }
        if ((p.peek().type === "word" || p.peek().type === "ident") && p.peek(1).value === "." && p.peek(2).value === "*") {
            p.pos += 3;                     // products.*
            items.push({ star: true });
            continue;
        }
        const from = p.pos;
        const node = p.expression();
        let header = p.textBetween(from, p.pos);
        let alias = null;
        if (p.acceptWord("AS")) {
            alias = p.name();
        } else if (p.peek().type === "ident" || p.peek().type === "string" ||
                   (p.peek().type === "word" && !CLAUSE_WORDS.includes(p.peek().upper))) {
            alias = p.peek().type === "string" ? p.next().value : p.name();
        }
        items.push({ node: node, header: alias || header, alias: alias });
    } while (p.acceptOp(","));

    let table = null;
    if (p.acceptWord("FROM")) {
        const ref = p.tableName();
        if (p.acceptWord("AS") || (p.peek().type === "word" && !CLAUSE_WORDS.includes(p.peek().upper))) {
            p.name();                       // a table alias, like "products p"
        }
        if (p.isOp(",") || p.isWord("JOIN", "LEFT", "RIGHT", "INNER", "CROSS")) {
            throw notSupported("JOIN");
        }
        table = getTable(ref);
    }
    let where = null;
    if (p.acceptWord("WHERE")) {
        where = p.expression();
    }
    if (p.isWord("GROUP", "HAVING")) {
        throw notSupported(p.peek().upper + " BY");
    }
    const order = [];
    if (p.acceptWord("ORDER")) {
        p.expectWord("BY");
        do {
            const node = p.expression();
            const descending = p.acceptWord("DESC");
            if (!descending) {
                p.acceptWord("ASC");
            }
            order.push({ node: node, descending: descending });
        } while (p.acceptOp(","));
    }
    const limit = readLimit(p);
    if (p.isWord("UNION")) {
        throw notSupported("UNION");
    }
    p.end();

    if (items.some(function (item) { return item.star; }) && !table) {
        throw sqlError(1096, "HY000", "No tables used");
    }
    // * becomes every column of the table.
    const columns = [];
    items.forEach(function (item) {
        if (item.star) {
            table.columns.forEach(function (column) {
                columns.push({ node: { k: "col", name: column.name }, header: column.name });
            });
        } else {
            columns.push(item);
        }
    });
    columns.forEach(function (column) { checkColumns(column.node, table, "field list"); });
    checkColumns(where, table, "where clause");
    if (where && isAggregate(where)) {
        throw sqlError(1111, "HY000", "Invalid use of group function");
    }

    // FROM picks the rows, WHERE keeps the ones where it is true.
    let rows = table ? table.rows : [null];
    if (where) {
        rows = rows.filter(function (row) {
            return truth(evaluate(where, { table: table, row: row, place: "where clause" })) === true;
        });
    }

    // With COUNT, MIN ... the answer is one row for all the rows.
    let results;
    if (columns.some(function (column) { return isAggregate(column.node); })) {
        const context = { table: table, row: rows[0] || null, rows: rows };
        results = [{ values: columns.map(function (column) { return evaluate(column.node, context); }), row: rows[0] || null }];
    } else {
        results = rows.map(function (row) {
            const context = { table: table, row: row };
            return { values: columns.map(function (column) { return evaluate(column.node, context); }), row: row };
        });
    }

    if (distinct) {
        const seen = new Set();
        results = results.filter(function (result) {
            const key = result.values.map(valueKey).join("|");
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    if (order.length) {
        // ORDER BY can name a column, an alias from the list, or its number: ORDER BY 2.
        const keys = order.map(function (entry) {
            const node = entry.node;
            if (node.k === "lit" && typeof node.v === "number") {
                if (node.v < 1 || node.v > columns.length) {
                    throw sqlError(1054, "42S22", "Unknown column '" + node.v + "' in 'order clause'");
                }
                return { index: node.v - 1, descending: entry.descending };
            }
            if (node.k === "col") {
                const index = columns.findIndex(function (column) {
                    return column.alias && column.alias.toLowerCase() === String(node.name).toLowerCase();
                });
                if (index !== -1) {
                    return { index: index, descending: entry.descending };
                }
            }
            checkColumns(node, table, "order clause");
            return { node: node, descending: entry.descending };
        });
        results = results.slice().sort(function (x, y) {
            for (const key of keys) {
                const a = key.node ? evaluate(key.node, { table: table, row: x.row, rows: rows }) : x.values[key.index];
                const b = key.node ? evaluate(key.node, { table: table, row: y.row, rows: rows }) : y.values[key.index];
                let result = a === null && b === null ? 0 : a === null ? -1 : b === null ? 1 : compare(a, b);
                if (key.descending) {
                    result = -result;
                }
                if (result !== 0) {
                    return result;
                }
            }
            return 0;
        });
    }
    if (limit) {
        results = results.slice(limit.offset, limit.offset + limit.count);
    }

    return {
        headers: columns.map(function (column) { return column.header; }),
        right: columns.map(function (column) { return isNumericNode(column.node, table); }),
        rows: results.map(function (result) {
            return result.values.map(function (value, i) { return formatValue(value, columnOf(columns[i].node, table)); });
        })
    };
}

function readLimit(p) {
    if (!p.acceptWord("LIMIT")) {
        return null;
    }
    const number = function () {
        const token = p.next();
        if (token.type !== "number" || !Number.isInteger(token.value)) {
            p.pos--;
            throw p.syntaxError();
        }
        return token.value;
    };
    let count = number();
    let offset = 0;
    if (p.acceptOp(",")) {
        offset = count;
        count = number();
    } else if (p.acceptWord("OFFSET")) {
        offset = number();
    }
    return { count: count, offset: offset };
}

// The column an expression shows, so decimals keep their places:
// price, MIN(price) and SUM(price) all show 199.90, not 199.9.
function columnOf(node, table) {
    if (!table) {
        return null;
    }
    if (node.k === "col") {
        return table.columns[findColumn(table, node.name)];
    }
    if (node.k === "fn" && ["MIN", "MAX", "SUM"].includes(node.name) && node.args[0] && node.args[0].k === "col") {
        return table.columns[findColumn(table, node.args[0].name)];
    }
    return null;
}

// Numbers are lined up to the right in the result table.
function isNumericNode(node, table) {
    switch (node.k) {
    case "lit":
        return typeof node.v === "number";
    case "col":
        return isNumericType(table.columns[findColumn(table, node.name)]);
    case "fn":
        if (["COUNT", "SUM", "AVG", "ROUND", "FLOOR", "CEIL", "CEILING", "ABS", "LENGTH", "CHAR_LENGTH"].includes(node.name)) {
            return true;
        }
        if (["MIN", "MAX", "IFNULL", "COALESCE"].includes(node.name)) {
            return node.args.length > 0 && isNumericNode(node.args[0], table);
        }
        return false;
    default:
        return true;                        // math, comparisons and logic give numbers
    }
}

// --- INSERT ---------------------------------------------------------------

function runInsert(p) {
    p.expectWord("INSERT");
    const ignore = p.acceptWord("IGNORE");
    p.acceptWord("INTO");
    const ref = p.tableName();

    let names = null;
    if (p.acceptOp("(")) {
        names = [p.name()];
        while (p.acceptOp(",")) {
            names.push(p.name());
        }
        p.expectOp(")");
    }
    if (p.isWord("SELECT")) {
        throw notSupported("INSERT ... SELECT");
    }
    if (!p.acceptWord("VALUES")) {
        p.expectWord("VALUE");
    }
    const tuples = [];
    do {
        p.expectOp("(");
        const values = [];
        if (!p.isOp(")")) {
            values.push(p.expression());
            while (p.acceptOp(",")) {
                values.push(p.expression());
            }
        }
        p.expectOp(")");
        tuples.push(values);
    } while (p.acceptOp(","));
    p.end();

    const table = getTable(ref);
    const indexes = (names || table.columns.map(function (column) { return column.name; })).map(function (name) {
        const index = findColumn(table, name);
        if (index === -1) {
            throw sqlError(1054, "42S22", "Unknown column '" + name + "' in 'field list'");
        }
        return index;
    });

    // Work on a copy, so a failing row leaves the table as it was.
    const rows = table.rows.slice();
    let autoIncrement = table.autoIncrement;
    let skipped = 0;

    tuples.forEach(function (values, t) {
        const rowNumber = t + 1;
        if (values.length !== indexes.length) {
            throw sqlError(1136, "21S01", "Column count doesn't match value count at row " + rowNumber);
        }
        const row = table.columns.map(function (column, c) {
            const position = indexes.indexOf(c);
            let value = position === -1 ? undefined : evaluate(values[position], { table: null, row: null, place: "field list" });
            if (column.autoIncrement && (value === undefined || value === null || value === 0)) {
                return autoIncrement;
            }
            if (value === undefined) {
                if (column.notNull && column.defaultValue === undefined) {
                    throw sqlError(1364, "HY000", "Field '" + column.name + "' doesn't have a default value");
                }
                value = defaultFor(column);
            }
            if (value === null && column.notNull) {
                throw sqlError(1048, "23000", "Column '" + column.name + "' cannot be null");
            }
            return coerce(value, column, rowNumber);
        });
        const error = duplicateError(table, row, rows, -1);
        if (error) {
            if (ignore) {
                skipped++;
                return;
            }
            throw error;
        }
        table.columns.forEach(function (column, c) {
            if (column.autoIncrement && row[c] >= autoIncrement) {
                autoIncrement = row[c] + 1;
            }
        });
        rows.push(row);
    });

    table.rows = rows;
    table.autoIncrement = autoIncrement;
    const added = tuples.length - skipped;
    return {
        affected: added,
        warnings: skipped,
        info: tuples.length > 1 ? "Records: " + tuples.length + "  Duplicates: " + skipped + "  Warnings: " + skipped : null
    };
}

// --- UPDATE and DELETE ----------------------------------------------------

function runUpdate(p) {
    p.expectWord("UPDATE");
    const ignore = p.acceptWord("IGNORE");
    const table = getTable(p.tableName());
    p.expectWord("SET");
    const changes = [];
    do {
        const name = p.name();
        p.expectOp("=");
        changes.push({ name: name, node: p.expression() });
    } while (p.acceptOp(","));
    const where = p.acceptWord("WHERE") ? p.expression() : null;
    const limit = readLimit(p);
    p.end();

    changes.forEach(function (change) {
        change.index = findColumn(table, change.name);
        if (change.index === -1) {
            throw sqlError(1054, "42S22", "Unknown column '" + change.name + "' in 'field list'");
        }
        checkColumns(change.node, table, "field list");
    });
    checkColumns(where, table, "where clause");

    const rows = table.rows.map(function (row) { return row.slice(); });
    let matched = 0;
    let changed = 0;
    let skipped = 0;

    table.rows.forEach(function (oldRow, r) {
        if (limit && matched >= limit.count) {
            return;
        }
        if (where && truth(evaluate(where, { table: table, row: oldRow, place: "where clause" })) !== true) {
            return;
        }
        matched++;
        const newRow = oldRow.slice();
        changes.forEach(function (change) {
            const column = table.columns[change.index];
            const value = evaluate(change.node, { table: table, row: oldRow });
            if (value === null && column.notNull) {
                throw sqlError(1048, "23000", "Column '" + column.name + "' cannot be null");
            }
            newRow[change.index] = coerce(value, column, r + 1);
        });
        const error = duplicateError(table, newRow, rows, r);
        if (error) {
            if (ignore) {
                skipped++;
                return;
            }
            throw error;
        }
        if (newRow.some(function (value, i) { return valueKey(value) !== valueKey(oldRow[i]) || value !== oldRow[i]; })) {
            changed++;
        }
        rows[r] = newRow;
    });

    table.rows = rows;
    return { affected: changed, warnings: skipped, info: "Rows matched: " + matched + "  Changed: " + changed + "  Warnings: " + skipped };
}

function runDelete(p) {
    p.expectWord("DELETE");
    p.expectWord("FROM");
    const table = getTable(p.tableName());
    const where = p.acceptWord("WHERE") ? p.expression() : null;
    const limit = readLimit(p);
    p.end();
    checkColumns(where, table, "where clause");

    let deleted = 0;
    table.rows = table.rows.filter(function (row) {
        if (limit && deleted >= limit.count) {
            return true;
        }
        if (where && truth(evaluate(where, { table: table, row: row, place: "where clause" })) !== true) {
            return true;
        }
        deleted++;
        return false;
    });
    return { affected: deleted };
}

function runTruncate(p) {
    p.expectWord("TRUNCATE");
    p.acceptWord("TABLE");
    const table = getTable(p.tableName());
    p.end();
    table.rows = [];
    table.autoIncrement = 1;
    return { affected: 0 };
}

// --- CREATE, DROP, USE ----------------------------------------------------

function runCreate(p) {
    p.expectWord("CREATE");
    if (p.acceptWord("DATABASE") || p.acceptWord("SCHEMA")) {
        const ifNotExists = readIfNotExists(p);
        const name = p.name();
        while (p.peek().type !== "end") {
            p.next();                       // CHARACTER SET ... is accepted and ignored
        }
        if (Object.hasOwn(state.databases, name)) {
            if (ifNotExists) {
                return { affected: 1, warnings: 1 };
            }
            throw sqlError(1007, "HY000", "Can't create database '" + name + "'; database exists");
        }
        Object.defineProperty(state.databases, name, { value: { tables: {} }, enumerable: true, writable: true, configurable: true });
        return { affected: 1 };
    }
    if (p.acceptWord("TABLE")) {
        return runCreateTable(p);
    }
    if (p.isWord("USER", "INDEX", "VIEW", "UNIQUE", "TRIGGER", "PROCEDURE", "FUNCTION")) {
        throw notSupported("CREATE " + p.peek().upper);
    }
    throw p.syntaxError();
}

function readIfNotExists(p) {
    if (p.acceptWord("IF")) {
        p.expectWord("NOT");
        p.expectWord("EXISTS");
        return true;
    }
    return false;
}

// Types MySQL knows, and what they become: BOOLEAN is really tinyint(1).
const TYPES = {
    INT: "int", INTEGER: "int", TINYINT: "tinyint", SMALLINT: "smallint", MEDIUMINT: "mediumint", BIGINT: "bigint",
    DECIMAL: "decimal", NUMERIC: "decimal", DEC: "decimal", FLOAT: "float", DOUBLE: "double", REAL: "double",
    BOOLEAN: "tinyint", BOOL: "tinyint",
    VARCHAR: "varchar", CHAR: "char", TEXT: "text", TINYTEXT: "tinytext", MEDIUMTEXT: "mediumtext", LONGTEXT: "longtext",
    DATE: "date", DATETIME: "datetime", TIMESTAMP: "timestamp"
};

function runCreateTable(p) {
    const ifNotExists = readIfNotExists(p);
    const ref = p.tableName();
    const database = currentDatabase(ref.database);
    p.expectOp("(");

    const table = { name: ref.table, columns: [], primaryKey: [], uniqueKeys: [], rows: [], autoIncrement: 1 };
    const keyColumns = function () {
        p.expectOp("(");
        const names = [p.name()];
        while (p.acceptOp(",")) {
            names.push(p.name());
        }
        p.expectOp(")");
        return names;
    };

    do {
        if (p.acceptWord("PRIMARY")) {
            p.expectWord("KEY");
            table.primaryKey = keyColumns();
        } else if (p.acceptWord("UNIQUE")) {
            if (!p.acceptWord("KEY")) {
                p.acceptWord("INDEX");
            }
            const keyName = p.isOp("(") ? null : p.name();
            const names = keyColumns();
            table.uniqueKeys.push({ name: keyName || names[0], columns: names });
        } else if (p.isWord("KEY", "INDEX")) {
            p.next();
            if (!p.isOp("(")) {
                p.name();
            }
            keyColumns();                   // a plain index makes lookups fast, nothing to do here
        } else if (p.isWord("CONSTRAINT", "FOREIGN", "CHECK")) {
            throw notSupported(p.peek().upper);
        } else {
            table.columns.push(readColumn(p, table));
        }
    } while (p.acceptOp(","));
    p.expectOp(")");
    while (p.peek().type !== "end") {
        p.next();                           // ENGINE=InnoDB DEFAULT CHARSET=... is accepted and ignored
    }

    // Check what MySQL checks.
    const seen = new Set();
    table.columns.forEach(function (column) {
        const lower = column.name.toLowerCase();
        if (seen.has(lower)) {
            throw sqlError(1060, "42S21", "Duplicate column name '" + column.name + "'");
        }
        seen.add(lower);
    });
    if (table.columns.filter(function (column) { return column.primary; }).length > 1 ||
        (table.primaryKey.length && table.columns.some(function (column) { return column.primary; }))) {
        throw sqlError(1068, "42000", "Multiple primary key defined");
    }
    table.columns.forEach(function (column) {
        if (column.primary) {
            table.primaryKey = [column.name];
        }
        if (column.unique) {
            table.uniqueKeys.push({ name: column.name, columns: [column.name] });
        }
    });
    const keyNames = table.primaryKey.concat.apply(table.primaryKey, table.uniqueKeys.map(function (key) { return key.columns; }));
    keyNames.forEach(function (name) {
        if (findColumn(table, name) === -1) {
            throw sqlError(1072, "42000", "Key column '" + name + "' doesn't exist in table");
        }
    });
    // A primary key can never be NULL.
    table.primaryKey.forEach(function (name) {
        table.columns[findColumn(table, name)].notNull = true;
    });
    const autoColumns = table.columns.filter(function (column) { return column.autoIncrement; });
    const isKey = function (column) {
        return table.primaryKey[0] === column.name || table.uniqueKeys.some(function (key) { return key.columns[0] === column.name; });
    };
    if (autoColumns.length > 1 || (autoColumns.length === 1 && !isKey(autoColumns[0]))) {
        throw sqlError(1075, "42000", "Incorrect table definition; there can be only one auto column and it must be defined as a key");
    }
    table.columns.forEach(function (column) { delete column.primary; delete column.unique; });

    const tables = state.databases[database].tables;
    if (Object.hasOwn(tables, ref.table)) {
        if (ifNotExists) {
            return { affected: 0, warnings: 1 };
        }
        throw sqlError(1050, "42S01", "Table '" + ref.table + "' already exists");
    }
    Object.defineProperty(tables, ref.table, { value: table, enumerable: true, writable: true, configurable: true });
    return { affected: 0 };
}

// name TYPE[(length[, scale])] [UNSIGNED] [NOT NULL] [DEFAULT x] [AUTO_INCREMENT] [PRIMARY KEY] [UNIQUE]
function readColumn(p, table) {
    const name = p.name();
    const typeToken = p.next();
    if (typeToken.type !== "word" || !Object.hasOwn(TYPES, typeToken.upper)) {
        p.pos--;
        throw p.syntaxError();
    }
    const column = { name: name, type: TYPES[typeToken.upper], length: null, scale: 0, unsigned: false, notNull: false };
    if (typeToken.upper === "BOOLEAN" || typeToken.upper === "BOOL") {
        column.length = 1;
    }
    if (p.acceptOp("(")) {
        const length = p.next();
        if (length.type !== "number") {
            p.pos--;
            throw p.syntaxError();
        }
        column.length = length.value;
        if (p.acceptOp(",")) {
            column.scale = p.next().value;
        }
        p.expectOp(")");
    }
    if (column.type === "decimal" && column.length === null) {
        column.length = 10;
    }
    if (["varchar"].includes(column.type) && column.length === null) {
        throw p.syntaxError();
    }
    if (column.type === "char" && column.length === null) {
        column.length = 1;
    }
    if (column.type === "tinyint" && column.length !== 1) {
        column.length = null;               // only tinyint(1) keeps its number, as BOOLEAN
    }

    for (;;) {
        if (p.acceptWord("UNSIGNED")) {
            column.unsigned = true;
        } else if (p.acceptWord("SIGNED")) {
            column.unsigned = false;
        } else if (p.acceptWord("NOT")) {
            p.expectWord("NULL");
            column.notNull = true;
        } else if (p.acceptWord("NULL")) {
            column.notNull = false;
        } else if (p.acceptWord("DEFAULT")) {
            if (p.isWord("CURRENT_TIMESTAMP", "NOW")) {
                p.next();
                if (p.acceptOp("(")) {
                    p.expectOp(")");
                }
                column.defaultValue = "CURRENT_TIMESTAMP";
            } else {
                const value = evaluate(p.unary(), { table: null, row: null });
                column.defaultValue = value === null ? null : coerceDefault(value, column);
            }
        } else if (p.acceptWord("AUTO_INCREMENT")) {
            column.autoIncrement = true;
        } else if (p.acceptWord("PRIMARY")) {
            p.expectWord("KEY");
            column.primary = true;
        } else if (p.acceptWord("UNIQUE")) {
            p.acceptWord("KEY");
            column.unique = true;
        } else if (p.acceptWord("COMMENT")) {
            p.next();
        } else if (p.acceptWord("ON")) {
            p.expectWord("UPDATE");         // ON UPDATE CURRENT_TIMESTAMP
            p.next();
            if (p.acceptOp("(")) {
                p.expectOp(")");
            }
        } else if (p.isWord("CHARACTER", "COLLATE", "CHARSET")) {
            p.next();
            p.acceptWord("SET");
            p.acceptOp("=");
            p.name();
        } else {
            return column;
        }
    }
}

function coerceDefault(value, column) {
    try {
        return coerce(value, column, 1);
    } catch (error) {
        throw sqlError(1067, "42000", "Invalid default value for '" + column.name + "'");
    }
}

function runDrop(p) {
    p.expectWord("DROP");
    if (p.acceptWord("DATABASE") || p.acceptWord("SCHEMA")) {
        const ifExists = p.acceptWord("IF") && (p.expectWord("EXISTS"), true);
        const name = p.name();
        p.end();
        if (SYSTEM_DATABASES.includes(name)) {
            throw sqlError(3552, "HY000", "Access to system schema '" + name + "' is rejected.");
        }
        if (!Object.hasOwn(state.databases, name)) {
            if (ifExists) {
                return { affected: 0, warnings: 1 };
            }
            throw sqlError(1008, "HY000", "Can't drop database '" + name + "'; database doesn't exist");
        }
        const count = Object.keys(state.databases[name].tables).length;
        delete state.databases[name];
        if (session && session.database === name) {
            session.database = null;
        }
        return { affected: count };
    }
    if (p.acceptWord("TABLE")) {
        const ifExists = p.acceptWord("IF") && (p.expectWord("EXISTS"), true);
        const refs = [p.tableName()];
        while (p.acceptOp(",")) {
            refs.push(p.tableName());
        }
        p.end();
        const missing = [];
        refs.forEach(function (ref) {
            const database = currentDatabase(ref.database);
            if (!Object.hasOwn(state.databases[database].tables, ref.table)) {
                missing.push(database + "." + ref.table);
            }
        });
        if (missing.length && !ifExists) {
            throw sqlError(1051, "42S02", "Unknown table '" + missing.join(",") + "'");
        }
        refs.forEach(function (ref) {
            delete state.databases[currentDatabase(ref.database)].tables[ref.table];
        });
        return { affected: 0, warnings: missing.length };
    }
    throw notSupported("DROP " + p.peek().upper);
}

function runUse(p) {
    p.expectWord("USE");
    const name = p.name();
    p.end();
    if (!Object.hasOwn(state.databases, name)) {
        throw sqlError(1049, "42000", "Unknown database '" + name + "'");
    }
    session.database = name;
    return { message: "Database changed" };
}

// --- SHOW and DESCRIBE ----------------------------------------------------

function runShow(p) {
    p.expectWord("SHOW");
    p.acceptWord("FULL");
    if (p.acceptWord("DATABASES") || p.acceptWord("SCHEMAS")) {
        p.end();
        const names = Object.keys(state.databases).sort();
        return { headers: ["Database"], right: [false], rows: names.map(function (name) { return [name]; }) };
    }
    if (p.acceptWord("TABLES")) {
        let name = null;
        if (p.acceptWord("FROM") || p.acceptWord("IN")) {
            name = p.name();
        }
        p.end();
        const database = currentDatabase(name);
        const names = Object.keys(state.databases[database].tables).sort();
        return { headers: ["Tables_in_" + database], right: [false], rows: names.map(function (table) { return [table]; }) };
    }
    if (p.acceptWord("COLUMNS") || p.acceptWord("FIELDS")) {
        if (!p.acceptWord("FROM")) {
            p.expectWord("IN");
        }
        const table = getTable(p.tableName());
        p.end();
        return describe(table);
    }
    if (p.acceptWord("CREATE")) {
        p.expectWord("TABLE");
        const table = getTable(p.tableName());
        p.end();
        return { headers: ["Table", "Create Table"], right: [false, false], rows: [[table.name, createTableSql(table)]] };
    }
    throw notSupported("SHOW " + p.peek().upper);
}

function runDescribe(p) {
    p.next();
    const table = getTable(p.tableName());
    p.end();
    return describe(table);
}

function describe(table) {
    return {
        headers: ["Field", "Type", "Null", "Key", "Default", "Extra"],
        right: [false, false, false, false, false, false],
        rows: table.columns.map(function (column) {
            let key = "";
            if (table.primaryKey.includes(column.name)) {
                key = "PRI";
            } else if (table.uniqueKeys.some(function (unique) { return unique.columns[0] === column.name; })) {
                key = "UNI";
            }
            const defaultText = column.defaultValue === undefined ? "NULL" : formatValue(column.defaultValue, column);
            return [column.name, typeName(column), column.notNull ? "NO" : "YES", key,
                    column.defaultValue === "CURRENT_TIMESTAMP" ? "CURRENT_TIMESTAMP" : defaultText,
                    column.autoIncrement ? "auto_increment" : ""];
        })
    };
}

// --- ALTER USER -------------------------------------------------------------

// ALTER USER 'root'@'localhost' IDENTIFIED [WITH plugin] BY 'password';
function runAlter(p) {
    p.expectWord("ALTER");
    if (p.isWord("TABLE")) {
        throw notSupported("ALTER TABLE");
    }
    p.expectWord("USER");
    p.acceptWord("IF") && p.expectWord("EXISTS");
    const userToken = p.next();
    if (!["string", "word", "ident"].includes(userToken.type)) {
        p.pos--;
        throw p.syntaxError();
    }
    let host = "%";
    if (p.acceptOp("@")) {
        host = p.next().value;
    }
    p.expectWord("IDENTIFIED");
    if (p.acceptWord("WITH")) {
        p.name();                           // mysql_native_password, caching_sha2_password ...
    }
    p.expectWord("BY");
    const password = p.next();
    if (password.type !== "string") {
        p.pos--;
        throw p.syntaxError();
    }
    p.end();
    if (userToken.value !== "root" || !["localhost", "%", "127.0.0.1"].includes(host)) {
        throw sqlError(1396, "HY000", "Operation ALTER USER failed for '" + userToken.value + "'@'" + host + "'");
    }
    state.rootPassword = password.value;
    return { affected: 0 };
}

// =========================================================================
// mysqldump
// =========================================================================

function quoteName(name) {
    return "`" + name.replace(/`/g, "``") + "`";
}

function sqlLiteral(value, column) {
    if (value === null) {
        return "NULL";
    }
    if (typeof value === "number") {
        return formatValue(value, column);
    }
    return "'" + String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n") + "'";
}

function createTableSql(table) {
    const lines = table.columns.map(function (column) {
        let line = "  " + quoteName(column.name) + " " + typeName(column);
        if (column.notNull) {
            line += " NOT NULL";
        }
        if (column.defaultValue === "CURRENT_TIMESTAMP") {
            line += " DEFAULT CURRENT_TIMESTAMP";
        } else if (column.defaultValue !== undefined && column.defaultValue !== null) {
            line += " DEFAULT '" + formatValue(column.defaultValue, column).replace(/'/g, "\\'") + "'";
        } else if (!column.notNull) {
            line += " DEFAULT NULL";
        }
        if (column.autoIncrement) {
            line += " AUTO_INCREMENT";
        }
        return line;
    });
    if (table.primaryKey.length) {
        lines.push("  PRIMARY KEY (" + table.primaryKey.map(quoteName).join(",") + ")");
    }
    table.uniqueKeys.forEach(function (key) {
        lines.push("  UNIQUE KEY " + quoteName(key.name) + " (" + key.columns.map(quoteName).join(",") + ")");
    });
    const auto = table.autoIncrement > 1 && table.columns.some(function (column) { return column.autoIncrement; })
        ? " AUTO_INCREMENT=" + table.autoIncrement : "";
    return "CREATE TABLE " + quoteName(table.name) + " (\n" + lines.join(",\n") + "\n) ENGINE=InnoDB" + auto + " DEFAULT CHARSET=utf8mb4;";
}

// A dump is SQL that builds the tables again: DROP, CREATE and INSERT.
function dumpDatabase(database, tableNames) {
    const tables = state.databases[database].tables;
    const lines = [
        "-- MySQL dump 10.13  Distrib " + SERVER_VERSION + ", for Linux (x86_64)",
        "--",
        "-- Host: localhost    Database: " + database,
        "-- ------------------------------------------------------",
        "-- Server version\t" + SERVER_VERSION + " (Playground)",
        ""
    ];
    tableNames.forEach(function (name) {
        const table = tables[name];
        lines.push("--", "-- Table structure for table " + quoteName(name), "--", "",
                   "DROP TABLE IF EXISTS " + quoteName(name) + ";", createTableSql(table), "");
        if (table.rows.length) {
            const values = table.rows.map(function (row) {
                return "(" + row.map(function (value, i) { return sqlLiteral(value, table.columns[i]); }).join(",") + ")";
            });
            lines.push("--", "-- Dumping data for table " + quoteName(name), "--", "",
                       "INSERT INTO " + quoteName(name) + " VALUES " + values.join(",") + ";", "");
        }
    });
    lines.push("-- Dump completed on " + now());
    return lines.join("\n") + "\n";
}

// =========================================================================
// Running SQL and showing results
// =========================================================================

function rowsWord(n) {
    return n === 1 ? "row" : "rows";
}

// The boxes around a result:
// +----+------+
// | id | name |
// +----+------+
function tableText(result) {
    const widths = result.headers.map(function (header, i) {
        return result.rows.reduce(function (width, row) {
            return Math.max(width, Array.from(row[i]).length);
        }, Array.from(header).length);
    });
    const border = "+" + widths.map(function (width) { return "-".repeat(width + 2); }).join("+") + "+";
    const line = function (cells, header) {
        return "| " + cells.map(function (cell, i) {
            const room = " ".repeat(widths[i] - Array.from(cell).length);
            return result.right[i] && !header ? room + cell : cell + room;
        }).join(" | ") + " |";
    };
    const lines = [border, line(result.headers, true), border];
    result.rows.forEach(function (row) { lines.push(line(row, false)); });
    lines.push(border);
    return lines.join("\n") + "\n";
}

// How results look depends on how mysql was started:
//   "interactive"  boxes, "N rows in set" and "Query OK", for a person typing
//   "execute"      mysql -e "...": only the boxes
//   "batch"        mysql < file: tabs between values and nothing else
function showResult(result, style, out) {
    if (result.headers) {
        if (style === "execute") {
            if (result.rows.length) {
                out(tableText(result));
            }
            return;
        }
        if (style === "batch") {
            out(result.headers.join("\t") + "\n");
            result.rows.forEach(function (row) { out(row.join("\t") + "\n"); });
            return;
        }
        if (!result.rows.length) {
            out("Empty set (0.00 sec)\n\n");
        } else {
            out(tableText(result) + result.rows.length + " " + rowsWord(result.rows.length) + " in set (0.00 sec)\n\n");
        }
        return;
    }
    if (style !== "interactive") {
        return;
    }
    if (result.message) {
        out(result.message + "\n");
        return;
    }
    const warnings = result.warnings ? ", " + result.warnings + " warning" + (result.warnings === 1 ? "" : "s") : "";
    out("Query OK, " + result.affected + " " + rowsWord(result.affected) + " affected" + warnings + " (0.01 sec)\n");
    if (result.info) {
        out(result.info + "\n");
    }
    out("\n");
}

function errorText(error, line) {
    return "ERROR " + error.code + " (" + error.sqlState + ")" + (line ? " at line " + line : "") + ": " + error.message;
}

// Run every statement in a text. "batch" stops at the first error and says
// on which line, like mysql < file. Returns false if something failed.
function runScript(text, style, out, err) {
    const batch = style === "batch";
    const split = splitStatements(text);
    for (const statement of split.statements) {
        try {
            showResult(runStatement(statement), style, out);
        } catch (error) {
            if (!(error instanceof SqlError)) {
                throw error;
            }
            err(errorText(error, batch ? statement.line : null));
            if (style !== "interactive") {
                return false;
            }
        }
    }
    return true;
}

// =========================================================================
// The mysql client
// =========================================================================

const MYSQL_HELP = `
You can type SQL that ends with ; over one or more lines. For example:

  show databases;                 create database name;
  use shop;                       drop database name;
  show tables;                    create table t (id int PRIMARY KEY AUTO_INCREMENT, name varchar(100) NOT NULL);
  describe products;              drop table t;
  select * from products where price > 100 order by price desc limit 3;
  select distinct name from users;          select count(*), min(price), max(price) from products;
  insert into users (name, active) values ('Olle', true), ('Lisa', false);
  update users set active = false where id = 1;
  delete from users where id = 2;
  update links set url = trim(leading '//' from url) where url like '//%';
  alter user 'root'@'localhost' identified by 'newpassword';

Commands without ;
  use name         change database             source file.sql   run a file from /home/user
  status   (\\s)    show where you are          \\c                clear the statement you are typing
  help     (\\h)    show this help              exit  (\\q)        go back to the shell

Not supported here: JOIN, GROUP BY, subqueries, ALTER TABLE, users and grants.
`;

function enterMysql(user, database) {
    session = { user: user, database: database || null };
    mode = "mysql";
    sqlBuffer = "";
    say("Welcome to the MySQL monitor.  Commands end with ; or \\g.\n" +
        "Your MySQL connection id is " + (8 + Math.floor(Math.random() * 40)) + "\n" +
        "Server version: " + SERVER_VERSION + " (Playground)\n\n" +
        "Type 'help;' or '\\h' for help. Type '\\c' to clear the current input statement.\n");
}

function leaveMysql() {
    say("Bye");
    session = null;
    mode = "shell";
    sqlBuffer = "";
}

// What mysql does itself, before anything goes to the server.
function clientCommand(line) {
    const text = line.trim().replace(/;$/, "").trim();
    const word = text.split(/\s+/)[0].toLowerCase();
    const rest = text.slice(word.length).trim();

    if (["exit", "quit", "\\q"].includes(word) && !rest) {
        leaveMysql();
        return true;
    }
    if (["help", "\\h", "?", "\\?"].includes(word) && !rest) {
        say(MYSQL_HELP);
        return true;
    }
    if (["status", "\\s"].includes(word) && !rest) {
        say("--------------\nmysql  Ver " + SERVER_VERSION + " for Linux on x86_64 (Playground)\n\n" +
            "Current database:\t" + (session.database || "") + "\n" +
            "Current user:\t\t" + session.user + "@localhost\n" +
            "Server version:\t\t" + SERVER_VERSION + " (Playground)\n" +
            "--------------\n");
        return true;
    }
    if (["source", "\\."].includes(word)) {
        sourceFile(rest);
        return true;
    }
    // use works without ; because mysql reads it itself.
    if (word === "use" && rest && !line.includes(";")) {
        const name = rest.replace(/^`|`$/g, "");
        if (!Object.hasOwn(state.databases, name)) {
            say(errorText(sqlError(1049, "42000", "Unknown database '" + name + "'")), "err");
        } else {
            session.database = name;
            say("Database changed");
        }
        return true;
    }
    return false;
}

function sourceFile(name) {
    const file = findFile(name);
    if (!name || !file) {
        say("ERROR: Failed to open file '" + name + "', error: 2", "err");
        return;
    }
    runScript(file.content, "interactive", function (text) { say(text); }, function (text) { say(text, "err"); });
}

function mysqlLine(line) {
    // \c anywhere throws away what has been typed so far.
    if (/\\c\s*$/.test(line)) {
        sqlBuffer = "";
        return;
    }
    if (!sqlBuffer && clientCommand(line)) {
        return;
    }
    sqlBuffer += line + "\n";
    const split = splitStatements(sqlBuffer);
    if (split.open) {
        return;                             // a quote is still open, keep reading
    }
    // Run every statement that has its ;, keep the rest for the next line.
    const done = split.statements.filter(function (statement) { return statement.complete; });
    const rest = split.statements.find(function (statement) { return !statement.complete; });
    sqlBuffer = rest ? rest.text + "\n" : "";
    if (!done.length && !rest) {
        sqlBuffer = "";
    }
    done.forEach(function (statement) {
        try {
            showResult(runStatement(statement), "interactive", function (text) { say(text); });
        } catch (error) {
            if (!(error instanceof SqlError)) {
                throw error;
            }
            say(errorText(error), "err");
        }
    });
}

// =========================================================================
// The shell
// =========================================================================

// Only one folder: "books.sql", "./books.sql", "~/books.sql" and
// "/home/user/books.sql" are the same file.
function fileName(path) {
    let name = String(path);
    if (name.startsWith(HOME + "/")) {
        name = name.slice(HOME.length + 1);
    } else if (name.startsWith("~/")) {
        name = name.slice(2);
    } else if (name.startsWith("./")) {
        name = name.slice(2);
    }
    return name && !name.includes("/") ? name : null;
}

function findFile(path) {
    const name = fileName(path);
    return name && Object.hasOwn(state.files, name) ? state.files[name] : null;
}

function writeFile(path, content, append) {
    const name = fileName(path);
    if (!name) {
        return "Permission denied";
    }
    if (!Object.hasOwn(state.files, name)) {
        Object.defineProperty(state.files, name, { value: { content: "", mtime: Date.now() }, enumerable: true, writable: true, configurable: true });
    }
    const file = state.files[name];
    file.content = append ? file.content + content : content;
    file.mtime = Date.now();
    return null;
}

// echo "a b" > 'my file' < in.sql -> words and operators.
function shellTokens(line) {
    const tokens = [];
    let word = null;
    let i = 0;
    const endWord = function () {
        if (word !== null) {
            tokens.push({ word: word });
            word = null;
        }
    };
    while (i < line.length) {
        const c = line[i];
        if (c === " " || c === "\t") {
            endWord();
            i++;
        } else if (c === ">" || c === "<") {
            endWord();
            const op = c === ">" && line[i + 1] === ">" ? ">>" : c;
            tokens.push({ op: op });
            i += op.length;
        } else if (c === "'" || c === "\"") {
            const end = line.indexOf(c, i + 1);
            if (end === -1) {
                return { error: "unexpected end of line, a " + c + " is not closed" };
            }
            word = (word || "") + line.slice(i + 1, end);
            i = end + 1;
        } else if (c === "\\" && i + 1 < line.length) {
            word = (word || "") + line[i + 1];
            i += 2;
        } else {
            word = (word || "") + c;
            i++;
        }
    }
    endWord();
    return { tokens: tokens };
}

// -u root, -uroot, --user=root, -p, -proot, --password=root, -h host, -P 3306,
// -D db, -e "sql", and a database name.
function readMysqlOptions(args, program) {
    const options = { program: program, user: null, password: undefined, host: "localhost", port: 3306, database: null, execute: null, tables: [] };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const value = function (short, long) {
            if (arg === short || arg === long) {
                i++;
                return args[i];
            }
            if (long && arg.startsWith(long + "=")) {
                return arg.slice(long.length + 1);
            }
            return arg.slice(short.length);
        };
        if (arg === "-p" || arg === "--password") {
            options.password = true;        // ask for it
        } else if (arg.startsWith("-p") || arg.startsWith("--password=")) {
            options.password = arg.startsWith("-p") ? arg.slice(2) : arg.slice(11);
        } else if (arg.startsWith("-u") || arg.startsWith("--user")) {
            options.user = value("-u", "--user");
        } else if (arg.startsWith("-h") || arg.startsWith("--host")) {
            options.host = value("-h", "--host");
        } else if (arg.startsWith("-P") || arg.startsWith("--port")) {
            options.port = value("-P", "--port");
        } else if (arg.startsWith("-D") || arg.startsWith("--database")) {
            options.database = value("-D", "--database");
        } else if (program === "mysql" && (arg.startsWith("-e") || arg.startsWith("--execute"))) {
            options.execute = value("-e", "--execute");
        } else if (["--single-transaction", "--quick", "--no-tablespaces", "--routines", "--skip-lock-tables"].includes(arg)) {
            // accepted and not needed here
        } else if (arg.startsWith("-")) {
            return { error: program + ": [ERROR] unknown option '" + arg + "'." };
        } else if (options.database === null) {
            options.database = arg;
        } else if (program === "mysqldump") {
            options.tables.push(arg);
        } else {
            return { error: program + ": [ERROR] unknown argument '" + arg + "'." };
        }
    }
    return options;
}

// Check the user and password, maybe after asking for it, then call done.
function logIn(options, sudo, err, done) {
    if (!state.running) {
        err("ERROR 2002 (HY000): Can't connect to local MySQL server through socket '/var/run/mysqld/mysqld.sock' (2)");
        return;
    }
    if (!["localhost", "127.0.0.1", "::1"].includes(options.host)) {
        err("ERROR 2003 (HY000): Can't connect to MySQL server on '" + options.host + ":" + options.port + "' (110)");
        err("(The playground only has a server on localhost.)");
        return;
    }
    const user = options.user || (sudo ? "root" : LOGIN);
    // On Ubuntu, root may log in without a password when the Linux user is root.
    if (sudo && user === "root") {
        done(user);
        return;
    }
    const check = function (password, typed) {
        if (user === "root" && password === state.rootPassword) {
            done(user);
        } else {
            err("ERROR 1045 (28000): Access denied for user '" + user + "'@'localhost' (using password: " + (typed ? "YES" : "NO") + ")");
        }
    };
    if (options.password === true) {
        mode = "password";
        passwordWait = function (password) {
            mode = "shell";
            check(password, password !== "");
        };
        return;
    }
    if (typeof options.password === "string") {
        // A warning, not an error: it still logs in. Others can see the
        // password in the list of running programs and in the history.
        say((options.program || "mysql") + ": [Warning] Using a password on the command line interface can be insecure.", "info");
        check(options.password, true);
        return;
    }
    check("", false);
}

const SHELL_HELP = [
    ["ls [-l]", "list the files in this folder"],
    ["cat file", "print a file"],
    ["rm file", "remove a file"],
    ["echo text > file", "write text to a file (>> adds to the end)"],
    ["mysql -u root -p [db]", "log in to mysql (the password is root)"],
    ["mysql -u root -p db < file.sql", "import a file into a database"],
    ["mysql -u root -p -e \"sql\"", "run SQL and come back"],
    ["mysqldump -u root -p db > file.sql", "export a database to a file"],
    ["sudo mysql", "log in as root without a password"],
    ["sudo service mysql stop|start|restart|status", "control the server"],
    ["clear, history, reset", "clear the screen, earlier commands, start over"]
];

const SHELL_COMMANDS = {
    help: function (job) {
        job.out("Commands you can use:\n");
        SHELL_HELP.forEach(function (row) { job.out("  " + row[0].padEnd(48) + row[1] + "\n"); });
        job.out("Everything happens in one folder, " + HOME + ".\n");
    },

    pwd: function (job) {
        job.out(HOME + "\n");
    },

    whoami: function (job) {
        job.out((job.sudo ? "root" : LOGIN) + "\n");
    },

    clear: function () {
        output.replaceChildren();
    },

    history: function (job) {
        history.forEach(function (line, index) { job.out(String(index + 1).padStart(5) + "  " + line + "\n"); });
    },

    reset: function (job) {
        state = newState();
        job.out("Every database and file is back as it was.\n", "info");
    },

    ls: function (job) {
        const long = job.args.includes("-l") || job.args.includes("-la") || job.args.includes("-al");
        const names = Object.keys(state.files).sort();
        if (!long) {
            if (names.length) {
                job.out(names.join("  ") + "\n");
            }
            return;
        }
        const sizes = names.map(function (name) { return String(new TextEncoder().encode(state.files[name].content).length); });
        const width = Math.max(0, ...sizes.map(function (size) { return size.length; }));
        names.forEach(function (name, i) {
            const date = new Date(state.files[name].mtime);
            const when = date.toLocaleString("en-US", { month: "short" }) + " " + String(date.getDate()).padStart(2) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
            job.out("-rw-r--r-- 1 user user " + sizes[i].padStart(width) + " " + when + " " + name + "\n");
        });
    },

    cat: function (job) {
        if (!job.args.length) {
            job.err("cat: no file given");
        }
        job.args.forEach(function (path) {
            const file = findFile(path);
            if (file) {
                job.out(file.content);
            } else {
                job.err("cat: " + path + ": No such file or directory");
            }
        });
    },

    rm: function (job) {
        const paths = job.args.filter(function (arg) { return !arg.startsWith("-"); });
        if (!paths.length) {
            job.err("rm: missing operand");
        }
        paths.forEach(function (path) {
            const name = fileName(path);
            if (name && Object.hasOwn(state.files, name)) {
                delete state.files[name];
            } else if (!job.args.includes("-f")) {
                job.err("rm: cannot remove '" + path + "': No such file or directory");
            }
        });
    },

    echo: function (job) {
        job.out(job.args.join(" ") + "\n");
    },

    mysql: function (job) {
        const options = readMysqlOptions(job.args, "mysql");
        if (options.error) {
            job.err(options.error);
            return;
        }
        logIn(options, job.sudo, job.err, function (user) {
            if (options.database && !Object.hasOwn(state.databases, options.database)) {
                job.err("ERROR 1049 (42000): Unknown database '" + options.database + "'");
                return;
            }
            // mysql < file.sql or mysql -e "sql": run it and come back to the shell.
            if (job.stdin !== null || options.execute !== null) {
                session = { user: user, database: options.database };
                runScript(job.stdin !== null ? job.stdin : options.execute, job.stdin !== null ? "batch" : "execute", job.out, job.err);
                session = null;
                save();
                return;
            }
            enterMysql(user, options.database);
        });
    },

    mysqldump: function (job) {
        const options = readMysqlOptions(job.args, "mysqldump");
        if (options.error) {
            job.err(options.error);
            return;
        }
        if (!options.database) {
            job.err("Usage: mysqldump [OPTIONS] database [tables]");
            return;
        }
        logIn(options, job.sudo, function (text) { job.err(text.replace(/^ERROR (\d+) \(\w+\): /, "mysqldump: Got error: $1: ")); }, function () {
            if (!Object.hasOwn(state.databases, options.database)) {
                job.err("mysqldump: Got error: 1049: Unknown database '" + options.database + "' when selecting the database");
                return;
            }
            const tables = state.databases[options.database].tables;
            const names = options.tables.length ? options.tables : Object.keys(tables).sort();
            const missing = names.find(function (name) { return !Object.hasOwn(tables, name); });
            if (missing) {
                job.err("mysqldump: Couldn't find table: \"" + missing + "\"");
                return;
            }
            job.out(dumpDatabase(options.database, names));
            save();
        });
    },

    sudo: function (job) {
        if (!job.args.length) {
            job.err("usage: sudo command");
            return;
        }
        runShellWords(job.args, Object.assign({}, job, { sudo: true }));
    },

    service: function (job) {
        const name = job.args[0];
        const action = job.args[1];
        if (name !== "mysql") {
            job.err(name ? name + ": unrecognized service" : "Usage: service < option > | --status-all | [ service_name [ command | --full-restart ] ]");
            return;
        }
        if (action === "status") {
            job.out("● mysql.service - MySQL Community Server\n     Loaded: loaded (/lib/systemd/system/mysql.service; enabled)\n     Active: " +
                (state.running ? "active (running)" : "inactive (dead)") + "\n");
            return;
        }
        if (!["start", "stop", "restart"].includes(action)) {
            job.err("Usage: /etc/init.d/mysql start|stop|restart|status");
            return;
        }
        if (!job.sudo) {
            job.err("Failed to " + action + " mysql.service: Interactive authentication required.");
            return;
        }
        state.running = action !== "stop";
    },

    apt: function (job) {
        if (job.args[0] !== "install") {
            job.err("The playground's apt can only install, like: sudo apt install mysql-server");
            return;
        }
        if (!job.sudo) {
            job.err("E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)");
            job.err("E: Unable to acquire the dpkg frontend lock, are you root?");
            return;
        }
        job.args.slice(1).filter(function (name) { return !name.startsWith("-"); }).forEach(function (name) {
            if (["mysql-server", "mysql-client"].includes(name)) {
                job.out(name + " is already the newest version (" + SERVER_VERSION + "-0ubuntu0.24.04.1).\n");
            } else {
                job.err("E: Unable to locate package " + name);
            }
        });
        job.out("0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n");
    }
};
SHELL_COMMANDS["apt-get"] = SHELL_COMMANDS.apt;

function runShellWords(words, job) {
    const name = words[0];
    if (!Object.hasOwn(SHELL_COMMANDS, name)) {
        job.err("bash: " + name + ": command not found");
        return;
    }
    SHELL_COMMANDS[name](Object.assign({}, job, { args: words.slice(1) }));
}

function shellLine(line) {
    const result = shellTokens(line);
    if (result.error) {
        say("bash: " + result.error, "err");
        return;
    }
    const words = [];
    let target = null;
    let source = null;
    for (let i = 0; i < result.tokens.length; i++) {
        const token = result.tokens[i];
        if (!token.op) {
            words.push(token.word);
            continue;
        }
        const next = result.tokens[i + 1];
        if (!next || next.op) {
            say("bash: syntax error near unexpected token `" + (next ? next.op : "newline") + "'", "err");
            return;
        }
        if (token.op === "<") {
            source = next.word;
        } else {
            target = { path: next.word, append: token.op === ">>" };
        }
        i++;
    }

    // The shell opens the files before the command starts.
    let stdin = null;
    if (source !== null) {
        const file = findFile(source);
        if (!file) {
            say("bash: " + source + ": No such file or directory", "err");
            return;
        }
        stdin = file.content;
    }
    if (target) {
        const error = writeFile(target.path, "", target.append);
        if (error) {
            say("bash: " + target.path + ": " + error, "err");
            return;
        }
    }
    const job = {
        sudo: false,
        stdin: stdin,
        out: function (text, cls) {
            if (target) {
                writeFile(target.path, text, true);
            } else {
                say(text, cls);
            }
        },
        err: function (text) { say(text, "err"); }
    };
    if (words.length) {
        runShellWords(words, job);
    }
}

// =========================================================================
// Typing
// =========================================================================

function run(line) {
    if (mode === "password") {
        print(promptParts().concat([{ text: "\n" }]));
        const wait = passwordWait;
        passwordWait = null;
        wait(line);
        save();
        return;
    }
    print(promptParts().concat([{ text: line + "\n" }]));
    if (line.trim()) {
        history.push(line);
        history = history.slice(-MAX_HISTORY);
    }
    historyIndex = history.length;

    if (mode === "mysql") {
        mysqlLine(line);
    } else {
        shellLine(line);
    }
    save();
}

function commonStart(words) {
    let start = words[0] || "";
    words.forEach(function (word) {
        while (!word.toLowerCase().startsWith(start.toLowerCase())) {
            start = start.slice(0, -1);
        }
    });
    return start;
}

const SQL_WORDS = ["select", "from", "where", "order", "by", "limit", "insert", "into", "values", "update", "set",
    "delete", "create", "database", "table", "drop", "show", "databases", "tables", "describe", "use",
    "distinct", "count", "and", "or", "not", "null", "like", "primary", "key", "auto_increment",
    "varchar", "integer", "boolean", "decimal", "date", "text", "exit", "source", "help", "status"];

function complete() {
    const before = input.value.slice(0, input.selectionStart);
    const after = input.value.slice(input.selectionStart);
    const match = /[^\s(,=]*$/.exec(before);
    const word = match[0];
    const wordStart = before.length - word.length;
    let candidates;

    if (mode === "mysql") {
        const names = SQL_WORDS.concat(Object.keys(state.databases));
        if (session && session.database && Object.hasOwn(state.databases, session.database)) {
            const tables = state.databases[session.database].tables;
            Object.keys(tables).forEach(function (name) {
                names.push(name);
                tables[name].columns.forEach(function (column) { names.push(column.name); });
            });
        }
        candidates = Array.from(new Set(names)).filter(function (name) {
            return word && name.toLowerCase().startsWith(word.toLowerCase());
        });
        // Keep the case the user types in: SEL -> SELECT, sel -> select.
        if (word && word === word.toUpperCase() && /[A-Z]/.test(word)) {
            candidates = candidates.map(function (name) { return SQL_WORDS.includes(name) ? name.toUpperCase() : name; });
        }
    } else if (wordStart === 0) {
        candidates = Object.keys(SHELL_COMMANDS).filter(function (name) { return name.startsWith(word); });
    } else {
        candidates = Object.keys(state.files).filter(function (name) { return name.startsWith(word); });
    }

    if (candidates.length === 1) {
        input.value = before.slice(0, wordStart) + candidates[0] + " " + after;
    } else if (candidates.length > 1) {
        const start = commonStart(candidates);
        if (start.length > word.length) {
            input.value = before.slice(0, wordStart) + start + after;
        } else {
            print(promptParts().concat([{ text: input.value + "\n" }, { text: candidates.sort().join("  ") + "\n" }]));
            scrollDown();
        }
    }
    const cursor = input.value.length - after.length;
    input.setSelectionRange(cursor, cursor);
}

function handleKeys(event) {
    if (event.key === "Tab") {
        event.preventDefault();
        if (mode !== "password") {
            complete();
        }
    } else if (event.key === "ArrowUp" && mode !== "password") {
        event.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            input.value = history[historyIndex];
        }
    } else if (event.key === "ArrowDown" && mode !== "password") {
        event.preventDefault();
        if (historyIndex < history.length) {
            historyIndex++;
            input.value = historyIndex < history.length ? history[historyIndex] : "";
        }
    } else if (event.ctrlKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        output.replaceChildren();
    } else if (event.ctrlKey && event.key.toLowerCase() === "c" && input.selectionStart === input.selectionEnd) {
        // Ctrl+C drops the line. In mysql it also drops a half typed statement.
        event.preventDefault();
        print(promptParts().concat([{ text: (mode === "password" ? "" : input.value) + "^C\n" }]));
        if (mode === "password") {
            mode = "shell";
            passwordWait = null;
        }
        sqlBuffer = "";
        input.value = "";
        historyIndex = history.length;
        showPrompt();
        scrollDown();
    }
}

function submit(event) {
    event.preventDefault();
    const line = input.value;
    input.value = "";
    run(line);
    showPrompt();
    scrollDown();
}

// =========================================================================
// Saving and starting
// =========================================================================

function newState() {
    state = {
        databases: {},
        files: {},
        rootPassword: DEFAULT_PASSWORD,
        running: true
    };
    SYSTEM_DATABASES.forEach(function (name) { state.databases[name] = { tables: {} }; });
    writeFile("books.sql", BOOKS_SQL, false);

    // Build the example database with the same SQL a person could type.
    session = { user: "root", database: null };
    runScript(SETUP_SQL, "batch", function () {}, function (text) { console.error("Setup failed:", text); });
    session = null;
    return state;
}

// localStorage keeps text in the browser, also after a reload. It can be
// turned off (private windows), so every use is inside try/catch.
function save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: state, history: history }));
    } catch (error) {
        // Not saved, but the playground still works until the page is closed.
    }
}

function load() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && saved.state && saved.state.databases && saved.state.files) {
            state = saved.state;
            history = Array.isArray(saved.history) ? saved.history : [];
            return;
        }
    } catch (error) {
        // Fall through and start fresh.
    }
    newState();
}

form.addEventListener("submit", submit);
input.addEventListener("keydown", handleKeys);

// Clicking anywhere in the terminal types in it, unless text is being selected.
terminal.addEventListener("click", function () {
    if (!window.getSelection().toString()) {
        input.focus();
    }
});

exampleButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        input.value = button.dataset.command;
        input.focus();
    });
});

load();
historyIndex = history.length;
say("Welcome to the MySQL playground!\nLog in with: mysql -u root -p   (the password is root)\nType help to see the commands you can use.\n", "info");
showPrompt();

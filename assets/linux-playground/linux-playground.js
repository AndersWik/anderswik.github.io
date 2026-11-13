/*
 * Linux Playground: try Linux commands in a pretend file system.
 *
 * The file system is a tree of plain objects. A folder is
 *
 *   { type: "dir", owner: "root", group: "root", mode: 0o755, mtime: ..., children: { name: node, ... } }
 *
 * and a file is the same with type: "file" and content: "text" instead of
 * children. owner, group and mode are what make "Permission denied" and
 * sudo work like on a real Linux machine.
 *
 * A command line is read in three steps:
 *   1. tokenize()  splits it into words, handles quotes, $HOME and ~
 *   2. run()       takes out "> file" and ">> file"
 *   3. execute()   finds the command in COMMANDS and runs it
 *
 * Commands write what they print to `out` (it can go to a file with >) and
 * errors to `err` (always shown on the screen), like stdout and stderr.
 *
 * Everything is saved in localStorage, so the files are still there after a
 * reload. The command reset builds a fresh file system.
 */

// --- Elements on the page ------------------------------------------------

const terminal = document.getElementById("terminal");
const output = document.getElementById("output");
const form = document.getElementById("command-form");
const promptLabel = document.getElementById("prompt");
const input = document.getElementById("command");
const exampleButtons = document.querySelectorAll("[data-command]");

// --- Settings ------------------------------------------------------------

const STORAGE_KEY = "linux-playground";
const LOGIN = "user";
const HOME = "/home/user";
const HOSTNAME = "playground";
const MAX_LINES = 1000;          // lines kept on the screen
const MAX_HISTORY = 100;

// Which groups each user is in. Membership of a file's group gives the
// middle three permission bits.
const GROUPS = {
    user: ["user", "sudo"],
    root: ["root"]
};

const ERRORS = {
    ENOENT: "No such file or directory",
    EACCES: "Permission denied",
    ENOTDIR: "Not a directory",
    EISDIR: "Is a directory",
    ENOTEMPTY: "Directory not empty",
    EEXIST: "File exists",
    EPERM: "Operation not permitted",
    EBUSY: "you are in that folder, cd out of it first"
};

// --- State ---------------------------------------------------------------

let fs = null;           // the root folder "/"
let cwd = HOME;          // current working directory
let user = LOGIN;        // "root" while a sudo command runs
let history = [];
let historyIndex = 0;    // where ↑ and ↓ are in history

// --- Making files and folders --------------------------------------------

function makeDir(owner, mode, children, group) {
    return { type: "dir", owner: owner, group: group || owner, mode: mode, mtime: Date.now(), children: children || {} };
}

function makeFile(owner, mode, content, group) {
    return { type: "file", owner: owner, group: group || owner, mode: mode, mtime: Date.now(), content: content };
}

// A small but typical Linux installation.
function newFileSystem() {
    const program = function () { return makeFile("root", 0o755, "(a program)\n"); };

    return makeDir("root", 0o755, {
        bin: makeDir("root", 0o755, {
            bash: program(), cat: program(), chmod: program(), echo: program(), ls: program(),
            mkdir: program(), pwd: program(), rm: program(), rmdir: program(), touch: program()
        }),
        boot: makeDir("root", 0o755, {
            vmlinuz: makeFile("root", 0o600, "(the Linux kernel)\n")
        }),
        dev: makeDir("root", 0o755, {
            null: makeFile("root", 0o666, "")
        }),
        etc: makeDir("root", 0o755, {
            hostname: makeFile("root", 0o644, "playground\n"),
            hosts: makeFile("root", 0o644, "127.0.0.1\tlocalhost\n127.0.1.1\tplayground\n"),
            motd: makeFile("root", 0o644, "Welcome to the Linux playground!\nType help to see the commands you can use.\n"),
            "os-release": makeFile("root", 0o644, "NAME=\"Playground Linux\"\nVERSION=\"1.0\"\nID=playground\nPRETTY_NAME=\"Playground Linux 1.0\"\n"),
            passwd: makeFile("root", 0o644, "root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:User:/home/user:/bin/bash\n"),
            shadow: makeFile("root", 0o640, "root:*:20000:0:99999:7:::\nuser:$y$j9T$notarealhash:20000:0:99999:7:::\n", "shadow")
        }),
        home: makeDir("root", 0o755, {
            user: makeDir("user", 0o755, {
                ".bashrc": makeFile("user", 0o644, "# Runs every time you open a terminal.\nalias ll='ls -l'\n"),
                "hello.txt": makeFile("user", 0o644, "Hello, world!\n"),
                Documents: makeDir("user", 0o755, {
                    "notes.txt": makeFile("user", 0o644, "Things to learn:\n- cd and ls\n- touch and rm\n- chmod and sudo\n")
                }),
                Downloads: makeDir("user", 0o755, {
                    "photo.jpg": makeFile("user", 0o644, "(a picture)\n")
                }),
                Pictures: makeDir("user", 0o755)
            })
        }),
        root: makeDir("root", 0o700, {
            "secret.txt": makeFile("root", 0o600, "Only root can read this.\n")
        }),
        tmp: makeDir("root", 0o1777),
        usr: makeDir("root", 0o755, {
            bin: makeDir("root", 0o755, { nano: program(), python3: program() }),
            share: makeDir("root", 0o755, { doc: makeDir("root", 0o755) })
        }),
        var: makeDir("root", 0o755, {
            log: makeDir("root", 0o755, {
                syslog: makeFile("root", 0o640, "Nov 13 08:00:01 playground systemd[1]: Started the playground.\n", "adm")
            }),
            www: makeDir("root", 0o755, {
                html: makeDir("root", 0o755, { "index.html": makeFile("root", 0o644, "<h1>It works!</h1>\n") })
            })
        })
    });
}

// Children are kept in a plain object. hasOwn() and defineProperty() keep
// names like "constructor" or "__proto__" from mixing with what every
// object already has.
function getChild(folder, name) {
    return Object.hasOwn(folder.children, name) ? folder.children[name] : null;
}

function setChild(folder, name, node) {
    Object.defineProperty(folder.children, name, { value: node, enumerable: true, writable: true, configurable: true });
    folder.mtime = Date.now();
}

function deleteChild(folder, name) {
    delete folder.children[name];
    folder.mtime = Date.now();
}

// --- Permissions ---------------------------------------------------------

// Can the current user read (r), write (w) or execute (x) this node?
// mode holds three groups of rwx bits: owner, group and everyone else.
// 0o754 = rwx for the owner, r-x for the group, r-- for others.
function can(node, permission) {
    const bit = { r: 4, w: 2, x: 1 }[permission];

    // root may do anything, except run a file nobody may run.
    if (user === "root") {
        return permission !== "x" || node.type === "dir" || (node.mode & 0o111) !== 0;
    }

    let shift = 0;                                    // others
    if (node.owner === user) {
        shift = 6;                                    // owner
    } else if (GROUPS[user].includes(node.group)) {
        shift = 3;                                    // group
    }
    return ((node.mode >> shift) & bit) !== 0;
}

// --- Paths ---------------------------------------------------------------

// "../tmp" in /home/user -> ["home", "tmp"]
function splitPath(path) {
    const full = path.startsWith("/") ? path : cwd + "/" + path;
    const parts = [];
    full.split("/").forEach(function (part) {
        if (part === "" || part === ".") {
            return;
        }
        if (part === "..") {
            parts.pop();
        } else {
            parts.push(part);
        }
    });
    return parts;
}

function joinPath(parts) {
    return "/" + parts.join("/");
}

// Find the node a path points to. Every folder on the way needs x
// (the right to go through it). Returns
//   { node, parent, name, parts }                  when it exists
//   { error: "ENOENT", parent, name, parts }       when only the last part is missing
//   { error: "EACCES" / "ENOTDIR" / "ENOENT" }     otherwise
function lookup(path) {
    const parts = splitPath(path);
    let node = fs;
    let parent = null;

    for (let i = 0; i < parts.length; i++) {
        if (node.type !== "dir") {
            return { error: "ENOTDIR" };
        }
        if (!can(node, "x")) {
            return { error: "EACCES" };
        }
        parent = node;
        node = getChild(node, parts[i]);
        if (!node) {
            const isLast = i === parts.length - 1;
            return { error: "ENOENT", parent: isLast ? parent : null, name: parts[i], parts: parts };
        }
    }
    if (path.endsWith("/") && node.type !== "dir") {
        return { error: "ENOTDIR" };
    }
    return { node: node, parent: parent, name: parts[parts.length - 1] || "/", parts: parts };
}

// Make a new file or folder at path. Returns an error code, or null.
function create(path, node) {
    const found = lookup(path);
    if (found.node) {
        return "EEXIST";
    }
    if (found.error !== "ENOENT" || !found.parent) {
        return found.error;
    }
    if (!can(found.parent, "w") || !can(found.parent, "x")) {
        return "EACCES";
    }
    node.owner = user;
    node.group = user;
    setChild(found.parent, found.name, node);
    return null;
}

// Is path the current folder, or a folder above it?
function holdsCwd(parts) {
    const path = joinPath(parts);
    return cwd === path || cwd.startsWith(path === "/" ? "/" : path + "/");
}

// "/home/user/Documents" -> "~/Documents"
function shortPath(path) {
    if (path === HOME) {
        return "~";
    }
    return path.startsWith(HOME + "/") ? "~" + path.slice(HOME.length) : path;
}

// --- Reading a command line ----------------------------------------------

function variable(name) {
    const values = { HOME: HOME, USER: LOGIN, PWD: cwd, HOSTNAME: HOSTNAME, SHELL: "/bin/bash" };
    return Object.hasOwn(values, name) ? values[name] : "";
}

// echo "hi there" > 'my file'  ->  words and operators:
// [{ word: "echo" }, { word: "hi there" }, { op: ">" }, { word: "my file" }]
// Inside '...' nothing is changed. Inside "..." $NAME is replaced.
// Outside quotes $NAME is replaced, and ~ at the start means $HOME.
function tokenize(line) {
    const tokens = [];
    let word = null;
    let i = 0;

    function endWord() {
        if (word !== null) {
            tokens.push({ word: word });
            word = null;
        }
    }

    while (i < line.length) {
        const c = line[i];

        if (c === " " || c === "\t") {
            endWord();
            i++;
            continue;
        }
        if (c === ">") {
            endWord();
            const append = line[i + 1] === ">";
            tokens.push({ op: append ? ">>" : ">" });
            i += append ? 2 : 1;
            continue;
        }
        if (word === null) {
            word = "";
            if (c === "~" && (i + 1 === line.length || line[i + 1] === "/" || line[i + 1] === " ")) {
                word = HOME;
                i++;
                continue;
            }
        }
        if (c === "'") {
            const end = line.indexOf("'", i + 1);
            if (end === -1) {
                return { error: "unexpected end of line, a ' is not closed" };
            }
            word += line.slice(i + 1, end);
            i = end + 1;
            continue;
        }
        if (c === "\"") {
            let j = i + 1;
            while (j < line.length && line[j] !== "\"") {
                if (line[j] === "\\" && "\"\\$".includes(line[j + 1])) {
                    word += line[j + 1];
                    j += 2;
                    continue;
                }
                const name = /^\$(\w+)/.exec(line.slice(j));
                if (name) {
                    word += variable(name[1]);
                    j += name[0].length;
                    continue;
                }
                word += line[j];
                j++;
            }
            if (j >= line.length) {
                return { error: "unexpected end of line, a \" is not closed" };
            }
            i = j + 1;
            continue;
        }
        if (c === "\\") {
            word += line[i + 1] || "";
            i += 2;
            continue;
        }
        const name = /^\$(\w+)/.exec(line.slice(i));
        if (name) {
            word += variable(name[1]);
            i += name[0].length;
            continue;
        }
        word += c;
        i++;
    }
    endWord();
    return { tokens: tokens };
}

// "-la" and "-l -a" -> flags l and a. Returns null after printing an error
// if a flag is not one of `allowed`.
function parseFlags(command, args, allowed, err) {
    const flags = new Set();
    const rest = [];
    let flagsDone = false;

    for (const arg of args) {
        if (!flagsDone && arg === "--") {
            flagsDone = true;
        } else if (!flagsDone && arg.length > 1 && arg.startsWith("-")) {
            for (const flag of arg.slice(1)) {
                if (!allowed.includes(flag)) {
                    err(command + ": invalid option -- '" + flag + "'");
                    return null;
                }
                flags.add(flag);
            }
        } else {
            rest.push(arg);
        }
    }
    return { flags: flags, rest: rest };
}

// --- ls helpers ----------------------------------------------------------

// 0o755 on a folder -> "drwxr-xr-x"
function modeString(node) {
    const letters = ["r", "w", "x"];
    let text = node.type === "dir" ? "d" : "-";
    for (let i = 8; i >= 0; i--) {
        text += (node.mode >> i) & 1 ? letters[(8 - i) % 3] : "-";
    }
    // The sticky bit (on /tmp): only the owner of a file may remove it.
    if (node.mode & 0o1000) {
        text = text.slice(0, 9) + (node.mode & 1 ? "t" : "T");
    }
    return text;
}

function sizeOf(node) {
    return node.type === "dir" ? 4096 : new TextEncoder().encode(node.content).length;
}

function linksOf(node) {
    if (node.type !== "dir") {
        return 1;
    }
    return 2 + Object.values(node.children).filter(function (child) { return child.type === "dir"; }).length;
}

// "Nov 13 09:05"
function dateString(time) {
    const date = new Date(time);
    const month = date.toLocaleString("en-US", { month: "short" });
    const two = function (n) { return String(n).padStart(2, "0"); };
    return month + " " + String(date.getDate()).padStart(2, " ") + " " + two(date.getHours()) + ":" + two(date.getMinutes());
}

function colorOf(node) {
    if (node.type === "dir") {
        return "dir";
    }
    return node.mode & 0o111 ? "exe" : null;
}

// Sort like ls: ignore case and a leading dot.
function byName(a, b) {
    const clean = function (name) { return name.replace(/^\./, "").toLowerCase(); };
    return clean(a.name).localeCompare(clean(b.name)) || a.name.localeCompare(b.name);
}

function printList(entries, long, out) {
    if (!long) {
        entries.forEach(function (entry, index) {
            out(entry.name, colorOf(entry.node));
            out(index < entries.length - 1 ? "  " : "\n");
        });
        return;
    }
    const rows = entries.map(function (entry) {
        return {
            entry: entry,
            columns: [modeString(entry.node), String(linksOf(entry.node)), entry.node.owner,
                      entry.node.group, String(sizeOf(entry.node)), dateString(entry.node.mtime)]
        };
    });
    // Line the columns up: numbers to the right, names to the left.
    const widths = [0, 0, 0, 0, 0, 0];
    rows.forEach(function (row) {
        row.columns.forEach(function (text, i) { widths[i] = Math.max(widths[i], text.length); });
    });
    rows.forEach(function (row) {
        const c = row.columns;
        out([c[0], c[1].padStart(widths[1]), c[2].padEnd(widths[2]), c[3].padEnd(widths[3]),
             c[4].padStart(widths[4]), c[5]].join(" ") + " ");
        out(row.entry.name, colorOf(row.entry.node));
        out("\n");
    });
}

// --- chmod helper --------------------------------------------------------

// "755", "u+x", "go-w", "a=r" -> the new mode, or null if not valid.
function newMode(oldMode, spec) {
    if (/^[0-7]{1,4}$/.test(spec)) {
        const value = parseInt(spec, 8);
        return spec.length === 4 ? value : (oldMode & 0o7000) | value;
    }
    let mode = oldMode;
    for (const clause of spec.split(",")) {
        const match = /^([ugoa]*)([+=-])([rwx]*)$/.exec(clause);
        if (!match) {
            return null;
        }
        const who = match[1] === "" || match[1].includes("a") ? "ugo" : match[1];
        const value = (match[3].includes("r") ? 4 : 0) + (match[3].includes("w") ? 2 : 0) + (match[3].includes("x") ? 1 : 0);
        for (const person of who) {
            const shift = { u: 6, g: 3, o: 0 }[person];
            if (match[2] === "+") {
                mode |= value << shift;
            } else if (match[2] === "-") {
                mode &= ~(value << shift);
            } else {
                mode = (mode & ~(7 << shift)) | (value << shift);
            }
        }
    }
    return mode;
}

// In a folder with the sticky bit, like /tmp, everyone may make files but
// only the owner of a file (or of the folder) may remove it.
function stickyBlocks(folder, node) {
    return (folder.mode & 0o1000) !== 0 && user !== "root" && node.owner !== user && folder.owner !== user;
}

// A folder can only be emptied if we may write in it and in every folder below.
function canEmpty(folder) {
    const children = Object.values(folder.children);
    if (children.length > 0 && !(can(folder, "w") && can(folder, "x"))) {
        return false;
    }
    return children.every(function (child) { return child.type !== "dir" || canEmpty(child); });
}

// --- The commands --------------------------------------------------------

const HELP = [
    ["pwd", "print the folder you are in"],
    ["ls [-l] [-a] [path]", "list files (-l long list, -a also hidden files)"],
    ["cd [path]", "change folder (cd .. goes up, cd alone goes home)"],
    ["cat file", "print a file"],
    ["echo text", "print text, echo text > file writes it to a file"],
    ["touch file", "make an empty file, or update its time"],
    ["mkdir [-p] folder", "make a folder (-p also the folders above it)"],
    ["rmdir folder", "remove an empty folder"],
    ["rm [-r] [-f] path", "remove files (-r folders too, -f no errors)"],
    ["chmod mode file", "change permissions, like chmod 644 or chmod u+x"],
    ["sudo command", "run a command as root"],
    ["whoami", "print your user name"],
    ["history", "list earlier commands"],
    ["clear", "clear the screen"],
    ["reset", "put every file back as it was"]
];

const COMMANDS = {
    help: function (args, out) {
        out("Commands you can use:\n");
        HELP.forEach(function (row) {
            out("  " + row[0].padEnd(20) + row[1] + "\n");
        });
        out("A file can also be the target of > (write) and >> (add to the end).\n");
    },

    pwd: function (args, out) {
        out(cwd + "\n");
    },

    whoami: function (args, out) {
        out(user + "\n");
    },

    clear: function () {
        output.replaceChildren();
    },

    history: function (args, out) {
        history.forEach(function (line, index) {
            out(String(index + 1).padStart(5) + "  " + line + "\n");
        });
    },

    reset: function (args, out) {
        fs = newFileSystem();
        cwd = HOME;
        out("Every file is back as it was.\n", "info");
    },

    cd: function (args, out, err) {
        if (args.length > 1) {
            err("bash: cd: too many arguments");
            return;
        }
        const target = args.length ? args[0] : HOME;
        const found = lookup(target);
        let error = found.error;
        if (!error && found.node.type !== "dir") {
            error = "ENOTDIR";
        } else if (!error && !can(found.node, "x")) {
            error = "EACCES";
        }
        if (error) {
            err("bash: cd: " + target + ": " + ERRORS[error]);
            return;
        }
        cwd = joinPath(found.parts);
    },

    ls: function (args, out, err) {
        const parsed = parseFlags("ls", args, ["l", "a"], err);
        if (!parsed) {
            return;
        }
        const long = parsed.flags.has("l");
        const all = parsed.flags.has("a");
        const paths = parsed.rest.length ? parsed.rest : ["."];
        const files = [];
        const folders = [];

        paths.forEach(function (path) {
            const found = lookup(path);
            if (found.error) {
                err("ls: cannot access '" + path + "': " + ERRORS[found.error]);
            } else if (found.node.type === "dir") {
                folders.push({ path: path, found: found });
            } else {
                files.push({ name: path, node: found.node });
            }
        });

        if (files.length) {
            printList(files, long, out);
        }
        folders.forEach(function (folder, index) {
            if (paths.length > 1) {
                out((files.length || index > 0 ? "\n" : "") + folder.path + ":\n");
            }
            const node = folder.found.node;
            if (!can(node, "r")) {
                err("ls: cannot open directory '" + folder.path + "': Permission denied");
                return;
            }
            let entries = Object.keys(node.children)
                .filter(function (name) { return all || !name.startsWith("."); })
                .map(function (name) { return { name: name, node: node.children[name] }; });
            if (all) {
                const up = folder.found.parent || node;   // ".." of "/" is "/"
                entries.push({ name: ".", node: node }, { name: "..", node: up });
            }
            entries.sort(byName);
            printList(entries, long, out);
        });
    },

    cat: function (args, out, err) {
        if (!args.length) {
            err("cat: no file given (reading from the keyboard is not supported here)");
            return;
        }
        args.forEach(function (path) {
            const found = lookup(path);
            let error = found.error;
            if (!error && found.node.type === "dir") {
                error = "EISDIR";
            } else if (!error && !can(found.node, "r")) {
                error = "EACCES";
            }
            if (error) {
                err("cat: " + path + ": " + ERRORS[error]);
            } else {
                out(found.node.content);
            }
        });
    },

    echo: function (args, out) {
        const noNewline = args[0] === "-n";
        const words = noNewline ? args.slice(1) : args;
        out(words.join(" ") + (noNewline ? "" : "\n"));
    },

    touch: function (args, out, err) {
        if (!args.length) {
            err("touch: missing file operand");
            return;
        }
        args.forEach(function (path) {
            const found = lookup(path);
            let error = null;
            if (found.node) {
                // Only someone who may write to the file, or owns it, may change its time.
                if (can(found.node, "w") || found.node.owner === user) {
                    found.node.mtime = Date.now();
                } else {
                    error = "EACCES";
                }
            } else {
                error = create(path, makeFile(user, 0o644, ""));
            }
            if (error) {
                err("touch: cannot touch '" + path + "': " + ERRORS[error]);
            }
        });
    },

    mkdir: function (args, out, err) {
        const parsed = parseFlags("mkdir", args, ["p"], err);
        if (!parsed) {
            return;
        }
        if (!parsed.rest.length) {
            err("mkdir: missing operand");
            return;
        }
        parsed.rest.forEach(function (path) {
            let error = null;
            if (parsed.flags.has("p")) {
                // Make each missing folder on the way, and don't mind ones that exist.
                const parts = splitPath(path);
                for (let i = 1; i <= parts.length && !error; i++) {
                    const step = joinPath(parts.slice(0, i));
                    const found = lookup(step);
                    if (found.node) {
                        error = found.node.type === "dir" ? null : "EEXIST";
                    } else {
                        error = create(step, makeDir(user, 0o755));
                    }
                }
            } else {
                error = create(path, makeDir(user, 0o755));
            }
            if (error) {
                err("mkdir: cannot create directory '" + path + "': " + ERRORS[error]);
            }
        });
    },

    rmdir: function (args, out, err) {
        if (!args.length) {
            err("rmdir: missing operand");
            return;
        }
        args.forEach(function (path) {
            const found = lookup(path);
            let error = found.error;
            if (!error && found.node.type !== "dir") {
                error = "ENOTDIR";
            } else if (!error && Object.keys(found.node.children).length) {
                error = "ENOTEMPTY";
            } else if (!error && (!found.parent || holdsCwd(found.parts))) {
                error = "EBUSY";
            } else if (!error && !(can(found.parent, "w") && can(found.parent, "x"))) {
                error = "EACCES";
            } else if (!error && stickyBlocks(found.parent, found.node)) {
                error = "EPERM";
            }
            if (error) {
                err("rmdir: failed to remove '" + path + "': " + ERRORS[error]);
            } else {
                deleteChild(found.parent, found.name);
            }
        });
    },

    rm: function (args, out, err) {
        const parsed = parseFlags("rm", args, ["r", "R", "f"], err);
        if (!parsed) {
            return;
        }
        const recursive = parsed.flags.has("r") || parsed.flags.has("R");
        const force = parsed.flags.has("f");
        if (!parsed.rest.length) {
            if (!force) {
                err("rm: missing operand");
            }
            return;
        }
        parsed.rest.forEach(function (path) {
            const last = path.replace(/\/+$/, "").split("/").pop();
            if (last === "." || last === "..") {
                err("rm: refusing to remove '.' or '..' directory: skipping '" + path + "'");
                return;
            }
            const found = lookup(path);
            if (found.error) {
                if (!(force && found.error === "ENOENT")) {
                    err("rm: cannot remove '" + path + "': " + ERRORS[found.error]);
                }
                return;
            }
            if (!found.parent) {
                err("rm: it is dangerous to operate recursively on '/'");
                err("rm: use --no-preserve-root to override this failsafe");
                return;
            }
            let error = null;
            if (found.node.type === "dir" && !recursive) {
                error = "EISDIR";
            } else if (found.node.type === "dir" && holdsCwd(found.parts)) {
                error = "EBUSY";
            } else if (!(can(found.parent, "w") && can(found.parent, "x"))) {
                error = "EACCES";
            } else if (stickyBlocks(found.parent, found.node)) {
                error = "EPERM";
            } else if (found.node.type === "dir" && !canEmpty(found.node)) {
                error = "EACCES";
            }
            if (error) {
                err("rm: cannot remove '" + path + "': " + ERRORS[error]);
            } else {
                deleteChild(found.parent, found.name);
            }
        });
    },

    chmod: function (args, out, err) {
        if (args.length < 2) {
            err(args.length ? "chmod: missing operand after '" + args[0] + "'" : "chmod: missing operand");
            return;
        }
        const spec = args[0];
        args.slice(1).forEach(function (path) {
            const found = lookup(path);
            if (found.error) {
                err("chmod: cannot access '" + path + "': " + ERRORS[found.error]);
                return;
            }
            const mode = newMode(found.node.mode, spec);
            if (mode === null) {
                err("chmod: invalid mode: '" + spec + "'");
                return;
            }
            if (user !== "root" && found.node.owner !== user) {
                err("chmod: changing permissions of '" + path + "': Operation not permitted");
                return;
            }
            found.node.mode = mode;
        });
    },

    // Run the rest of the line as root. A real sudo asks for your password
    // first; here everyone may.
    sudo: function (args, out, err) {
        if (!args.length) {
            err("usage: sudo command");
            return;
        }
        const before = user;
        user = "root";
        try {
            execute(args, out, err);
        } finally {
            user = before;
        }
    }
};

// --- Running a command line ----------------------------------------------

function execute(words, out, err) {
    const name = words[0];
    if (!Object.hasOwn(COMMANDS, name)) {
        err("bash: " + name + ": command not found");
        return;
    }
    COMMANDS[name](words.slice(1), out, err);
}

// "> file" empties or makes the file, ">> file" adds to the end. The shell
// does this before the command starts, as the user who typed it, so
// "sudo echo hi > /etc/x" still fails: sudo only covers echo.
function openTarget(target, append) {
    const found = lookup(target);
    if (found.node) {
        if (found.node.type === "dir") {
            return { error: "EISDIR" };
        }
        if (!can(found.node, "w")) {
            return { error: "EACCES" };
        }
        if (!append) {
            found.node.content = "";
        }
        return { file: found.node };
    }
    const file = makeFile(user, 0o644, "");
    const error = create(target, file);
    return error ? { error: error } : { file: file };
}

function run(line) {
    print(promptParts().concat([{ text: line + "\n" }]));
    if (line.trim()) {
        history.push(line);
        history = history.slice(-MAX_HISTORY);
    }
    historyIndex = history.length;

    const result = tokenize(line);
    if (result.error) {
        print([{ text: "bash: " + result.error + "\n", cls: "err" }]);
        return;
    }

    // Take out the redirection, the rest are the words of the command.
    const words = [];
    let redirect = null;
    for (let i = 0; i < result.tokens.length; i++) {
        const token = result.tokens[i];
        if (token.op) {
            const next = result.tokens[i + 1];
            if (!next || next.op) {
                print([{ text: "bash: syntax error near unexpected token `" + (next ? next.op : "newline") + "'\n", cls: "err" }]);
                return;
            }
            redirect = { append: token.op === ">>", target: next.word };
            i++;
        } else {
            words.push(token.word);
        }
    }

    const stdout = [];
    const out = function (text, cls) { stdout.push({ text: text, cls: cls }); };
    const err = function (text) { print([{ text: text + "\n", cls: "err" }]); };

    let file = null;
    if (redirect) {
        const opened = openTarget(redirect.target, redirect.append);
        if (opened.error) {
            err("bash: " + redirect.target + ": " + ERRORS[opened.error]);
            return;
        }
        file = opened.file;
    }
    if (words.length) {
        execute(words, out, err);
    }

    if (file) {
        file.content += stdout.map(function (part) { return part.text; }).join("");
        file.mtime = Date.now();
    } else {
        print(stdout);
    }
    save();
}

// --- The screen ----------------------------------------------------------

function promptParts() {
    return [
        { text: LOGIN + "@" + HOSTNAME, cls: "user" },
        { text: ":" },
        { text: shortPath(cwd), cls: "path" },
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
}

// Print text parts, each with an optional color class. "\n" starts a new line.
// textContent, never innerHTML: a file named "<img onerror=...>" stays text.
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

function scrollDown() {
    terminal.scrollTop = terminal.scrollHeight;
}

// --- Tab completion ------------------------------------------------------

function commonStart(words) {
    let start = words[0] || "";
    words.forEach(function (word) {
        while (!word.startsWith(start)) {
            start = start.slice(0, -1);
        }
    });
    return start;
}

function complete() {
    const before = input.value.slice(0, input.selectionStart);
    const after = input.value.slice(input.selectionStart);
    const wordStart = before.lastIndexOf(" ") + 1;
    const word = before.slice(wordStart);
    let candidates = [];
    let folderPart = "";

    if (wordStart === 0) {
        candidates = Object.keys(COMMANDS).filter(function (name) { return name.startsWith(word); })
            .map(function (name) { return { name: name, suffix: " " }; });
    } else {
        const slash = word.lastIndexOf("/");
        folderPart = word.slice(0, slash + 1);
        const namePart = word.slice(slash + 1);
        let folderPath = folderPart || ".";
        if (folderPath.startsWith("~")) {
            folderPath = HOME + folderPath.slice(1);
        }
        const found = lookup(folderPath);
        if (found.node && found.node.type === "dir" && can(found.node, "r")) {
            candidates = Object.keys(found.node.children)
                .filter(function (name) {
                    return name.startsWith(namePart) && (namePart.startsWith(".") || !name.startsWith("."));
                })
                .map(function (name) {
                    return { name: name, suffix: found.node.children[name].type === "dir" ? "/" : " " };
                });
        }
    }

    if (candidates.length === 1) {
        const done = folderPart + candidates[0].name + candidates[0].suffix;
        input.value = before.slice(0, wordStart) + done + after;
    } else if (candidates.length > 1) {
        const names = candidates.map(function (candidate) { return candidate.name; }).sort();
        const start = commonStart(names);
        if (folderPart + start !== word) {
            input.value = before.slice(0, wordStart) + folderPart + start + after;
        } else {
            print(promptParts().concat([{ text: input.value + "\n" }, { text: names.join("  ") + "\n" }]));
            scrollDown();
        }
    }
    const cursor = input.value.length - after.length;
    input.setSelectionRange(cursor, cursor);
}

// --- Saving --------------------------------------------------------------

// localStorage keeps text in the browser, also after a reload. It can be
// turned off (private windows), so every use is inside try/catch.
function save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ fs: fs, cwd: cwd, history: history }));
    } catch (error) {
        // Not saved, but the playground still works until the page is closed.
    }
}

function load() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && saved.fs && saved.fs.type === "dir" && typeof saved.cwd === "string") {
            fs = saved.fs;
            cwd = saved.cwd;
            history = Array.isArray(saved.history) ? saved.history : [];
            if (lookup(cwd).node) {
                return;
            }
            cwd = HOME;
            return;
        }
    } catch (error) {
        // Fall through and start fresh.
    }
    fs = newFileSystem();
    cwd = HOME;
}

// --- Keys ----------------------------------------------------------------

function handleKeys(event) {
    if (event.key === "Tab") {
        event.preventDefault();
        complete();
    } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            input.value = history[historyIndex];
        }
    } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (historyIndex < history.length) {
            historyIndex++;
            input.value = historyIndex < history.length ? history[historyIndex] : "";
        }
    } else if (event.ctrlKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        output.replaceChildren();
    } else if (event.ctrlKey && event.key.toLowerCase() === "c" && input.selectionStart === input.selectionEnd) {
        // Ctrl+C without a selection drops the line, like in a terminal.
        event.preventDefault();
        print(promptParts().concat([{ text: input.value + "^C\n" }]));
        input.value = "";
        historyIndex = history.length;
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

// --- Connect the page ----------------------------------------------------

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

// --- Start ---------------------------------------------------------------

load();
historyIndex = history.length;
const motd = lookup("/etc/motd");
if (motd.node && motd.node.type === "file") {
    print([{ text: motd.node.content, cls: "info" }]);
}
showPrompt();

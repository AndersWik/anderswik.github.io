/*
 * Linux Playground: the core.
 *
 * The playground is split into small files, loaded in this order by the page:
 *
 *   core.js              this file: the terminal, the shell, the file system
 *                        tools and the list of commands
 *   data/filesystem.js   the files and folders the playground starts with
 *   data/system.js       the made-up server: host name, users, processes,
 *                        memory and disks. Commands may change it (kill
 *                        removes a process), and it is saved like the files.
 *   commands/*.js        one file per command
 *
 * A command file only calls Playground.register():
 *
 *   Playground.register({
 *       name: "whoami",
 *       usage: "whoami",
 *       summary: "print your user name",
 *       run: function (args, env) {
 *           env.out(env.user + "\n");
 *       }
 *   });
 *
 * run() gets the words after the command name, and env: everything a command
 * may use. See makeEnv() below for the full list. To add a command, add a
 * file and a line for it in the page's front matter. help and Tab
 * completion find it by themselves.
 *
 * What the shell does itself, before a command runs, stays here: quotes,
 * $HOME and ~, and sending output to a file with > and >>.
 */

const Playground = (function () {

    // --- Settings ------------------------------------------------------------

    const STORAGE_KEY = "linux-playground";
    const MAX_LINES = 1000;          // lines kept on the screen
    const MAX_HISTORY = 100;

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

    const commands = {};             // name -> { name, usage, summary, run }
    const commandOrder = [];         // names, in the order they were registered
    let fileSystemData = [];         // from data/filesystem.js
    let systemData = null;           // from data/system.js, as it starts
    let system = null;               // the server as it is now: a copy of systemData that commands change

    let fs = null;                   // the root folder "/"
    let cwd = "/";                   // current working directory
    let history = [];
    let historyIndex = 0;            // where ↑ and ↓ are in history

    let elements = null;             // the terminal on the page

    // =========================================================================
    // Registering commands and data
    // =========================================================================

    function register(command) {
        if (!command || !command.name || typeof command.run !== "function") {
            console.error("Playground.register needs a name and a run function", command);
            return;
        }
        if (!Object.hasOwn(commands, command.name)) {
            commandOrder.push(command.name);
        }
        commands[command.name] = command;
    }

    function defineFileSystem(entries) {
        fileSystemData = entries;
    }

    function defineSystem(facts) {
        systemData = facts;
    }

    // A fresh copy, so killing a process never changes the data it started from.
    function freshSystem() {
        return JSON.parse(JSON.stringify(systemData));
    }

    // =========================================================================
    // The file system
    // =========================================================================
    //
    // A folder is { type: "dir", owner, group, mode, mtime, children: { name: node } }
    // and a file is the same with type: "file" and content instead of children.
    // mode holds the permission bits, like 0o755.

    function makeNode(type, owner, group, mode, content) {
        const node = { type: type, owner: owner, group: group || owner, mode: mode, mtime: Date.now() };
        if (type === "dir") {
            node.children = {};
        } else {
            node.content = content || "";
        }
        return node;
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

    // Build the tree from the list in data/filesystem.js:
    //   { path: "/etc/hostname", owner: "root", mode: "644", content: "playground\n" }
    //   { path: "/root", type: "dir", owner: "root", mode: "700" }
    // A folder must come before what is in it.
    function buildFileSystem() {
        const root = makeNode("dir", "root", "root", 0o755);
        fileSystemData.forEach(function (entry) {
            const parts = entry.path.split("/").filter(Boolean);
            const name = parts.pop();
            let folder = root;
            for (const part of parts) {
                folder = folder && folder.type === "dir" ? getChild(folder, part) : null;
            }
            if (!folder || folder.type !== "dir") {
                console.error("filesystem.js: the folder for " + entry.path + " must come first");
                return;
            }
            const type = entry.type === "dir" ? "dir" : "file";
            const mode = typeof entry.mode === "string" ? parseInt(entry.mode, 8) : entry.mode;
            setChild(folder, name, makeNode(type, entry.owner || "root", entry.group, mode, entry.content));
        });
        return root;
    }

    // Can this user read (r), write (w) or execute (x) this node?
    // mode holds three groups of rwx bits: owner, group and everyone else.
    // 0o754 = rwx for the owner, r-x for the group, r-- for others.
    function can(user, node, permission) {
        const bit = { r: 4, w: 2, x: 1 }[permission];

        // root may do anything, except run a file nobody may run.
        if (user === "root") {
            return permission !== "x" || node.type === "dir" || (node.mode & 0o111) !== 0;
        }

        let shift = 0;                                  // others
        if (node.owner === user) {
            shift = 6;                                  // owner
        } else if (groupsOf(user).includes(node.group)) {
            shift = 3;                                  // group
        }
        return ((node.mode >> shift) & bit) !== 0;
    }

    function groupsOf(user) {
        return system.users[user] ? system.users[user].groups : [];
    }

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
    function lookup(user, path) {
        const parts = splitPath(path);
        let node = fs;
        let parent = null;

        for (let i = 0; i < parts.length; i++) {
            if (node.type !== "dir") {
                return { error: "ENOTDIR" };
            }
            if (!can(user, node, "x")) {
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

    // Put a new node at path, owned by user. Returns an error code, or null.
    function create(user, path, node) {
        const found = lookup(user, path);
        if (found.node) {
            return "EEXIST";
        }
        if (found.error !== "ENOENT" || !found.parent) {
            return found.error;
        }
        if (!can(user, found.parent, "w") || !can(user, found.parent, "x")) {
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

    // In a folder with the sticky bit, like /tmp, everyone may make files but
    // only the owner of a file (or of the folder) may remove it.
    function stickyBlocks(user, folder, node) {
        return (folder.mode & 0o1000) !== 0 && user !== "root" && node.owner !== user && folder.owner !== user;
    }

    // A folder can only be emptied if we may write in it and in every folder below.
    function canEmpty(user, folder) {
        const children = Object.values(folder.children);
        if (children.length > 0 && !(can(user, folder, "w") && can(user, folder, "x"))) {
            return false;
        }
        return children.every(function (child) { return child.type !== "dir" || canEmpty(user, child); });
    }

    // "/home/user/Documents" -> "~/Documents"
    function shortPath(path) {
        const home = system.users[system.login].home;
        if (path === home) {
            return "~";
        }
        return path.startsWith(home + "/") ? "~" + path.slice(home.length) : path;
    }

    // The file system tools a command gets as env.fs. They check permissions
    // for the user the command runs as, so sudo only has to change the user.
    function fsFor(user) {
        return {
            lookup: function (path) { return lookup(user, path); },
            can: function (node, permission) { return can(user, node, permission); },
            create: function (path, node) { return create(user, path, node); },
            newFile: function (content, mode) { return makeNode("file", user, user, mode === undefined ? 0o644 : mode, content); },
            newDir: function (mode) { return makeNode("dir", user, user, mode === undefined ? 0o755 : mode); },
            remove: deleteChild,
            child: getChild,
            names: function (folder) { return Object.keys(folder.children); },
            split: splitPath,
            join: joinPath,
            holdsCwd: holdsCwd,
            stickyBlocks: function (folder, node) { return stickyBlocks(user, folder, node); },
            canEmpty: function (folder) { return canEmpty(user, folder); },
            message: function (code) { return ERRORS[code] || code; }
        };
    }

    // =========================================================================
    // The environment a command runs in
    // =========================================================================

    // io: { out(text, color), err(text) } - where the command's output goes.
    function makeEnv(user, io) {
        const login = system.login;
        return {
            user: user,                         // "root" under sudo
            login: login,                       // who is logged in
            home: system.users[login].home,
            hostname: system.hostname,
            system: system,                     // the server: processes, memory, disks ... (may be changed)
            cwd: cwd,
            fs: fsFor(user),

            // Print. Text goes to the screen, or to a file after > or >>.
            // color is an optional class from the stylesheet, like "dir" or "info".
            out: io.out,
            // Errors always go to the screen, like stderr.
            err: io.err,
            // false when the output goes to a file with > or >>. Programs like
            // man then print plain text instead of opening a pager.
            toTerminal: io.toTerminal !== false,
            // Show a long text to scroll through, like less. Returns a Promise
            // that is done when the reader presses q. title is shown at the bottom.
            pager: function (text, title) { return openPager(text, title); },

            cd: function (parts) { cwd = joinPath(parts); },
            // Run another command. Return what it returns, so a command that
            // waits (like man) is waited for: return env.execute(...).
            execute: function (words, asUser) { return execute(words, asUser || user, io); },
            flags: function (name, args, allowed) { return parseFlags(name, args, allowed, io.err); },
            commands: function () { return commandOrder.map(function (key) { return commands[key]; }); },
            history: function () { return history.slice(); },
            clearScreen: function () { elements.output.replaceChildren(); },
            // Put every file and the whole server back as they started.
            reset: function () {
                system = freshSystem();
                fs = buildFileSystem();
                cwd = system.users[system.login].home;
            }
        };
    }

    // "-la" and "-l -a" -> flags l and a. Prints an error and returns null if
    // a flag is not one of `allowed`.
    function parseFlags(name, args, allowed, err) {
        const flags = new Set();
        const rest = [];
        let flagsDone = false;

        for (const arg of args) {
            if (!flagsDone && arg === "--") {
                flagsDone = true;
            } else if (!flagsDone && arg.length > 1 && arg.startsWith("-")) {
                for (const flag of arg.slice(1)) {
                    if (!allowed.includes(flag)) {
                        err(name + ": invalid option -- '" + flag + "'");
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

    function execute(words, user, io) {
        const name = words[0];
        if (!Object.hasOwn(commands, name)) {
            io.err("bash: " + name + ": command not found");
            return;
        }
        try {
            // A command may return a Promise if it has to wait, like man
            // waiting for the page to download. The shell waits for it.
            return commands[name].run(words.slice(1), makeEnv(user, io));
        } catch (error) {
            // A broken command file should not break the whole terminal.
            console.error(error);
            io.err(name + ": the command failed (" + error.message + ")");
        }
    }

    // =========================================================================
    // The shell: reading a command line
    // =========================================================================

    function variable(name) {
        const home = system.users[system.login].home;
        const values = { HOME: home, USER: system.login, PWD: cwd, HOSTNAME: system.hostname, SHELL: "/bin/bash" };
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
                    word = variable("HOME");
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

    // "> file" empties or makes the file, ">> file" adds to the end. The shell
    // does this before the command starts, as the user who typed it, so
    // "sudo echo hi > /etc/x" still fails: sudo only covers echo.
    function openTarget(target, append) {
        const user = system.login;
        const found = lookup(user, target);
        if (found.node && joinPath(found.parts) === "/dev/null") {
            return { file: { type: "null" } };
        }
        if (found.node) {
            if (found.node.type === "dir") {
                return { error: "EISDIR" };
            }
            if (!can(user, found.node, "w")) {
                return { error: "EACCES" };
            }
            if (!append) {
                found.node.content = "";
            }
            return { file: found.node };
        }
        const file = makeNode("file", user, user, 0o644, "");
        const error = create(user, target, file);
        return error ? { error: error } : { file: file };
    }

    async function run(line) {
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
        const io = {
            out: function (text, cls) { stdout.push({ text: text, cls: cls }); },
            err: function (text) { print([{ text: text + "\n", cls: "err" }]); },
            toTerminal: !redirect
        };

        let file = null;
        if (redirect) {
            const opened = openTarget(redirect.target, redirect.append);
            if (opened.error) {
                io.err("bash: " + redirect.target + ": " + ERRORS[opened.error]);
                return;
            }
            file = opened.file;
        }
        if (words.length) {
            try {
                await execute(words, system.login, io);
            } catch (error) {
                console.error(error);
                io.err(words[0] + ": the command failed (" + error.message + ")");
            }
        }

        if (file) {
            // /dev/null throws away everything written to it.
            if (file.type !== "null") {
                file.content += stdout.map(function (part) { return part.text; }).join("");
                file.mtime = Date.now();
            }
        } else {
            print(stdout);
        }
        save();
    }

    // =========================================================================
    // The screen
    // =========================================================================

    function promptParts() {
        return [
            { text: system.login + "@" + system.hostname, cls: "user" },
            { text: ":" },
            { text: shortPath(cwd), cls: "path" },
            { text: "$ " }
        ];
    }

    function showPrompt() {
        elements.prompt.replaceChildren();
        promptParts().forEach(function (part) {
            const span = document.createElement("span");
            span.textContent = part.text;
            if (part.cls) {
                span.className = part.cls;
            }
            elements.prompt.appendChild(span);
        });
    }

    // Print text parts, each with an optional color class. "\n" starts a new line.
    // textContent, never innerHTML: a file named "<img onerror=...>" stays text.
    function print(parts) {
        const output = elements.output;
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
        elements.terminal.scrollTop = elements.terminal.scrollHeight;
    }

    // --- The pager -------------------------------------------------------------

    // Show a long text in the whole terminal, to scroll through like less
    // (which is what man uses). The keys are the same as in less:
    //   ↓ j Enter    one line down          ↑ k y       one line up
    //   Space f PgDn one screen down        b PgUp      one screen up
    //   g Home       to the top             G End       to the end
    //   ← →          sideways, for long lines           q           quit
    function openPager(text, title) {
        return new Promise(function (resolve) {
            const terminal = elements.terminal;
            const pager = document.createElement("div");
            pager.className = "pager";
            pager.tabIndex = 0;
            pager.setAttribute("aria-label", title + ". Use the arrow keys to scroll, q to quit.");

            const body = document.createElement("div");
            body.className = "pager-text";
            text.replace(/\n$/, "").split("\n").forEach(function (line) {
                const row = document.createElement("div");
                row.className = "pager-line";
                // Headings like NAME and DESCRIPTION are bold, like in a real man page.
                if (/^[A-Z][A-Z0-9 ,()/_-]*$/.test(line)) {
                    row.classList.add("pager-heading");
                }
                row.textContent = line;
                body.appendChild(row);
            });

            const status = document.createElement("div");
            status.className = "pager-status";
            const statusText = document.createElement("span");
            const quit = document.createElement("button");
            quit.type = "button";
            quit.textContent = "q quit";
            status.append(statusText, quit);
            pager.append(body, status);

            const lineHeight = function () {
                return body.firstElementChild ? body.firstElementChild.offsetHeight || 20 : 20;
            };
            function update() {
                const line = Math.floor(body.scrollTop / lineHeight()) + 1;
                const atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 2;
                statusText.textContent = " " + title + " line " + line + "/" + body.children.length + (atEnd ? " (END)" : "") + " ";
            }
            function close() {
                pager.remove();
                terminal.classList.remove("paging");
                elements.output.hidden = false;
                resolve();
            }

            const page = function () { return Math.max(lineHeight(), body.clientHeight - lineHeight()); };
            const moves = {
                ArrowDown: function () { body.scrollTop += lineHeight(); },
                j: function () { body.scrollTop += lineHeight(); },
                Enter: function () { body.scrollTop += lineHeight(); },
                ArrowUp: function () { body.scrollTop -= lineHeight(); },
                k: function () { body.scrollTop -= lineHeight(); },
                y: function () { body.scrollTop -= lineHeight(); },
                " ": function () { body.scrollTop += page(); },
                f: function () { body.scrollTop += page(); },
                PageDown: function () { body.scrollTop += page(); },
                b: function () { body.scrollTop -= page(); },
                PageUp: function () { body.scrollTop -= page(); },
                g: function () { body.scrollTop = 0; },
                Home: function () { body.scrollTop = 0; },
                G: function () { body.scrollTop = body.scrollHeight; },
                End: function () { body.scrollTop = body.scrollHeight; },
                ArrowRight: function () { body.scrollLeft += 8 * lineHeight(); },
                ArrowLeft: function () { body.scrollLeft -= 8 * lineHeight(); }
            };
            pager.addEventListener("keydown", function (event) {
                if (event.ctrlKey || event.altKey || event.metaKey) {
                    return;
                }
                if (event.key === "q" || event.key === "Q" || event.key === "Escape") {
                    event.preventDefault();
                    close();
                } else if (Object.hasOwn(moves, event.key)) {
                    event.preventDefault();
                    moves[event.key]();
                    update();
                }
            });
            body.addEventListener("scroll", update);
            // On a phone there is no q key, so the status line has a button.
            quit.addEventListener("click", function (event) {
                event.stopPropagation();
                close();
            });

            elements.output.hidden = true;
            terminal.classList.add("paging");
            terminal.appendChild(pager);
            update();
            pager.focus();
        });
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
        const input = elements.input;
        const before = input.value.slice(0, input.selectionStart);
        const after = input.value.slice(input.selectionStart);
        const wordStart = before.lastIndexOf(" ") + 1;
        const word = before.slice(wordStart);
        let candidates = [];
        let folderPart = "";

        if (wordStart === 0) {
            candidates = commandOrder.filter(function (name) { return name.startsWith(word); })
                .map(function (name) { return { name: name, suffix: " " }; });
        } else {
            const slash = word.lastIndexOf("/");
            folderPart = word.slice(0, slash + 1);
            const namePart = word.slice(slash + 1);
            let folderPath = folderPart || ".";
            if (folderPath.startsWith("~")) {
                folderPath = variable("HOME") + folderPath.slice(1);
            }
            const found = lookup(system.login, folderPath);
            if (found.node && found.node.type === "dir" && can(system.login, found.node, "r")) {
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

    // --- Keys ----------------------------------------------------------------

    function handleKeys(event) {
        const input = elements.input;
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
            elements.output.replaceChildren();
        } else if (event.ctrlKey && event.key.toLowerCase() === "c" && input.selectionStart === input.selectionEnd) {
            // Ctrl+C without a selection drops the line, like in a terminal.
            event.preventDefault();
            print(promptParts().concat([{ text: input.value + "^C\n" }]));
            input.value = "";
            historyIndex = history.length;
            scrollDown();
        }
    }

    // While a command runs (man downloading a page, or the pager open),
    // the prompt is hidden and nothing new can be typed.
    let busy = false;

    async function runAndPrompt(line) {
        busy = true;
        elements.form.hidden = true;
        try {
            await run(line);
        } finally {
            busy = false;
            elements.form.hidden = false;
            showPrompt();
            scrollDown();
            elements.input.focus();
        }
    }

    function submit(event) {
        event.preventDefault();
        if (busy) {
            return;
        }
        const line = elements.input.value;
        elements.input.value = "";
        runAndPrompt(line);
    }

    // =========================================================================
    // Saving and starting
    // =========================================================================

    // localStorage keeps text in the browser, also after a reload. It can be
    // turned off (private windows), so every use is inside try/catch.
    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ fs: fs, cwd: cwd, history: history, system: system }));
        } catch (error) {
            // Not saved, but the playground still works until the page is closed.
        }
    }

    function load() {
        system = freshSystem();
        const home = system.users[system.login].home;
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved && saved.fs && saved.fs.type === "dir" && typeof saved.cwd === "string") {
                // A saved server from an older data/system.js is left behind,
                // so new processes or disks in the data show up.
                if (saved.system && saved.system.version === systemData.version) {
                    system = saved.system;
                }
                fs = saved.fs;
                cwd = saved.cwd;
                history = Array.isArray(saved.history) ? saved.history : [];
                if (!lookup(system.login, cwd).node) {
                    cwd = home;
                }
                return;
            }
        } catch (error) {
            // Fall through and start fresh.
        }
        fs = buildFileSystem();
        cwd = home;
    }

    function start() {
        elements = {
            terminal: document.getElementById("terminal"),
            output: document.getElementById("output"),
            form: document.getElementById("command-form"),
            prompt: document.getElementById("prompt"),
            input: document.getElementById("command")
        };
        if (!elements.terminal || !systemData) {
            return;
        }

        elements.form.addEventListener("submit", submit);
        elements.input.addEventListener("keydown", handleKeys);

        // Clicking anywhere in the terminal types in it, unless text is being selected.
        elements.terminal.addEventListener("click", function () {
            if (!window.getSelection().toString()) {
                const pager = elements.terminal.querySelector(".pager");
                (pager || elements.input).focus();
            }
        });

        document.querySelectorAll("[data-command]").forEach(function (button) {
            button.addEventListener("click", function () {
                elements.input.value = button.dataset.command;
                elements.input.focus();
            });
        });

        load();
        historyIndex = history.length;
        const motd = lookup(system.login, "/etc/motd");
        if (motd.node && motd.node.type === "file") {
            print([{ text: motd.node.content, cls: "info" }]);
        }
        showPrompt();
    }

    // The command files load after this one, so wait until the page has
    // run every script before starting.
    document.addEventListener("DOMContentLoaded", start);

    return {
        register: register,
        defineFileSystem: defineFileSystem,
        defineSystem: defineSystem,
        // For trying things from the console or a test page. Returns a
        // Promise that is done when the command is.
        run: function (line) { return runAndPrompt(line); },
        complete: complete
    };
})();

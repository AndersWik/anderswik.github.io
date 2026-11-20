// ls: list the files in a folder.
//   ls -l   long list: permissions, owner, size and time
//   ls -a   also hidden files, the ones whose name starts with a dot

(function () {
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

    // A folder's link count is 2 (its name and its own ".") plus one ".."
    // for each folder inside it.
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

    // Folders blue, programs green, like an Ubuntu terminal.
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

    Playground.register({
        name: "ls",
        usage: "ls [-l] [-a] [path]",
        summary: "list files (-l long list, -a also hidden files)",
        run: function (args, env) {
            const parsed = env.flags("ls", args, ["l", "a"]);
            if (!parsed) {
                return;
            }
            const long = parsed.flags.has("l");
            const all = parsed.flags.has("a");
            const paths = parsed.rest.length ? parsed.rest : ["."];
            const files = [];
            const folders = [];

            paths.forEach(function (path) {
                const found = env.fs.lookup(path);
                if (found.error) {
                    env.err("ls: cannot access '" + path + "': " + env.fs.message(found.error));
                } else if (found.node.type === "dir") {
                    folders.push({ path: path, found: found });
                } else {
                    files.push({ name: path, node: found.node });
                }
            });

            if (files.length) {
                printList(files, long, env.out);
            }
            folders.forEach(function (folder, index) {
                if (paths.length > 1) {
                    env.out((files.length || index > 0 ? "\n" : "") + folder.path + ":\n");
                }
                const node = folder.found.node;
                if (!env.fs.can(node, "r")) {
                    env.err("ls: cannot open directory '" + folder.path + "': Permission denied");
                    return;
                }
                const entries = env.fs.names(node)
                    .filter(function (name) { return all || !name.startsWith("."); })
                    .map(function (name) { return { name: name, node: env.fs.child(node, name) }; });
                if (all) {
                    const up = folder.found.parent || node;     // ".." of "/" is "/"
                    entries.push({ name: ".", node: node }, { name: "..", node: up });
                }
                entries.sort(byName);
                printList(entries, long, env.out);
            });
        }
    });
})();

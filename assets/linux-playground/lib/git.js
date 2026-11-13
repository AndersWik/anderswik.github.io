/*
 * Linux Playground: a pretend Git, the model under commands/git.js.
 *
 * Where things are kept, like in real Git:
 *
 *   <repo>/.git            a folder in the file system. Its node has a
 *                          property "repo" with the state below, and a few
 *                          real files: HEAD, config, description, hooks/.
 *   ~/.gitconfig           the global config, a text file (git config --global)
 *   <repo>/.git/config     the repository's config, a text file
 *
 *   repo = {
 *       head: "ref: refs/heads/main",       or a commit id when detached
 *       refs: { "refs/heads/main": id, "refs/tags/v1.0": id, "refs/remotes/origin/main": id },
 *       index: { "notes.txt": blobId },     the staging area: what the next commit holds
 *       stash: [ { commit, index, untracked, message } ],
 *       reflog: [ { id, message } ],         newest first
 *       merge / cherryPick / rebase: the state of an unfinished one, or null
 *   }
 *
 * Objects (blobs, commits, tags) are stored by id in env.system.gitObjects,
 * shared by every repository on the machine, and by the pretend servers in
 * env.system.gitServers (GitHub). A blob's id is the SHA-1 real Git would
 * give the same file. A commit keeps its files as { path: blobId } instead
 * of tree objects, which is simpler and shows the same.
 *
 * Errors are thrown as GitError, and commands/git.js prints them.
 */

Playground.git = (function () {

    const VERSION = "2.43.0";

    function GitError(message) {
        this.message = message;
    }

    function fail(message) {
        return new GitError(message);
    }

    // =========================================================================
    // SHA-1, the id of every object
    // =========================================================================

    function sha1(text) {
        const bytes = Array.from(new TextEncoder().encode(text));
        const bitLength = bytes.length * 8;
        bytes.push(0x80);
        while (bytes.length % 64 !== 56) {
            bytes.push(0);
        }
        for (let i = 7; i >= 0; i--) {
            bytes.push(i > 3 ? 0 : (bitLength >>> (i * 8)) & 0xff);
        }
        let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
        const w = new Array(80);
        for (let chunk = 0; chunk < bytes.length; chunk += 64) {
            for (let i = 0; i < 16; i++) {
                w[i] = (bytes[chunk + i * 4] << 24) | (bytes[chunk + i * 4 + 1] << 16) | (bytes[chunk + i * 4 + 2] << 8) | bytes[chunk + i * 4 + 3];
            }
            for (let i = 16; i < 80; i++) {
                const x = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
                w[i] = (x << 1) | (x >>> 31);
            }
            let a = h0, b = h1, c = h2, d = h3, e = h4;
            for (let i = 0; i < 80; i++) {
                let f, k;
                if (i < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
                else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
                else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
                else { f = b ^ c ^ d; k = 0xca62c1d6; }
                const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[i]) | 0;
                e = d; d = c; c = (b << 30) | (b >>> 2); b = a; a = temp;
            }
            h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
        }
        return [h0, h1, h2, h3, h4].map(function (h) { return (h >>> 0).toString(16).padStart(8, "0"); }).join("");
    }

    // =========================================================================
    // Time. Setup steps use a fixed clock, so the example commits always get
    // the same ids.
    // =========================================================================

    let clock = null;

    function setClock(isoText) {
        clock = isoText === null ? null : Math.floor(new Date(isoText).getTime() / 1000);
    }

    function nowSeconds() {
        if (clock !== null) {
            clock += 60;                    // a minute between steps
            return clock;
        }
        return Math.floor(Date.now() / 1000);
    }

    function timezone(seconds) {
        const offset = -new Date(seconds * 1000).getTimezoneOffset();
        const sign = offset >= 0 ? "+" : "-";
        const abs = Math.abs(offset);
        return sign + String(Math.floor(abs / 60)).padStart(2, "0") + String(abs % 60).padStart(2, "0");
    }

    // "Mon Nov 2 10:15:00 2026 +0100", like git log
    function dateText(seconds) {
        const d = new Date(seconds * 1000);
        const day = d.toLocaleString("en-US", { weekday: "short" });
        const month = d.toLocaleString("en-US", { month: "short" });
        const two = function (n) { return String(n).padStart(2, "0"); };
        return day + " " + month + " " + d.getDate() + " " + two(d.getHours()) + ":" + two(d.getMinutes()) + ":" +
            two(d.getSeconds()) + " " + d.getFullYear() + " " + timezone(seconds);
    }

    // "3 days ago", for git stash list and the like
    function shortId(id) {
        return id ? id.slice(0, 7) : "";
    }

    // =========================================================================
    // Objects
    // =========================================================================

    function objects(system) {
        if (!system.gitObjects) {
            system.gitObjects = {};
        }
        return system.gitObjects;
    }

    function byteLength(text) {
        return new TextEncoder().encode(text).length;
    }

    function storeBlob(system, content) {
        // The same text real Git hashes, so the id is the same as real Git's.
        const id = sha1("blob " + byteLength(content) + "\0" + content);
        objects(system)[id] = { type: "blob", content: content };
        return id;
    }

    function storeObject(system, object) {
        const id = sha1(object.type + "\n" + JSON.stringify(object));
        objects(system)[id] = object;
        return id;
    }

    function getObject(system, id) {
        return id && Object.hasOwn(objects(system), id) ? objects(system)[id] : null;
    }

    function blobText(system, id) {
        const object = getObject(system, id);
        return object && object.type === "blob" ? object.content : "";
    }

    function commitOf(system, id) {
        const object = getObject(system, id);
        return object && object.type === "commit" ? object : null;
    }

    function treeOf(system, id) {
        const commit = commitOf(system, id);
        return commit ? commit.tree : {};
    }

    // An annotated tag points at a tag object; follow it to the commit.
    function peel(system, id) {
        let object = getObject(system, id);
        while (object && object.type === "tag") {
            id = object.object;
            object = getObject(system, id);
        }
        return object && object.type === "commit" ? id : null;
    }

    // =========================================================================
    // Config files: ~/.gitconfig and .git/config
    // =========================================================================

    // [user]
    //     name = Anna
    // [remote "origin"]
    //     url = git@github.com:anna/project.git
    // -> { "user.name": "Anna", "remote.origin.url": "git@..." }
    function parseConfig(text) {
        const values = {};
        let section = null;
        (text || "").split("\n").forEach(function (line) {
            const header = /^\s*\[([A-Za-z0-9.-]+)(?:\s+"(.*)")?\]\s*$/.exec(line);
            if (header) {
                section = header[1].toLowerCase() + (header[2] !== undefined ? "." + header[2] : "");
                return;
            }
            const pair = /^\s*([A-Za-z][A-Za-z0-9-]*)\s*=\s*(.*?)\s*$/.exec(line);
            if (pair && section) {
                let value = pair[2];
                if (/^".*"$/.test(value)) {
                    value = value.slice(1, -1).replace(/\\"/g, "\"").replace(/\\\\/g, "\\");
                }
                values[section + "." + pair[1].toLowerCase()] = value;
            }
        });
        return values;
    }

    function splitKey(key) {
        const parts = key.split(".");
        return { section: parts[0], sub: parts.length > 2 ? parts.slice(1, -1).join(".") : null, name: parts[parts.length - 1] };
    }

    function writeConfigText(values) {
        const groups = [];
        Object.keys(values).forEach(function (key) {
            const k = splitKey(key);
            const header = k.sub === null ? "[" + k.section + "]" : "[" + k.section + " \"" + k.sub + "\"]";
            let group = groups.find(function (g) { return g.header === header; });
            if (!group) {
                group = { header: header, lines: [] };
                groups.push(group);
            }
            const value = values[key];
            const quoted = /^\s|\s$|[;#"\\]/.test(value) ? "\"" + value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\"" : value;
            group.lines.push("\t" + k.name + " = " + quoted);
        });
        return groups.map(function (g) { return g.header + "\n" + g.lines.join("\n") + "\n"; }).join("");
    }

    function readFile(env, path) {
        const found = env.fs.lookup(path);
        return found.node && found.node.type === "file" && env.fs.can(found.node, "r") ? found.node.content : null;
    }

    // Write a file, making it if needed. Throws if not allowed.
    function writeFile(env, path, content) {
        const found = env.fs.lookup(path);
        if (found.node) {
            if (found.node.type !== "file" || !env.fs.can(found.node, "w")) {
                throw fail("error: could not write '" + path + "': Permission denied");
            }
            found.node.content = content;
            found.node.mtime = Date.now();
            return;
        }
        const error = env.fs.create(path, env.fs.newFile(content));
        if (error) {
            throw fail("error: could not write '" + path + "': " + env.fs.message(error));
        }
    }

    function globalConfigPath(env) {
        return env.home + "/.gitconfig";
    }

    // Both files merged: the repository's own settings win.
    function config(env, repo) {
        const values = parseConfig(readFile(env, globalConfigPath(env)));
        if (repo) {
            Object.assign(values, parseConfig(readFile(env, repo.gitPath + "/config")));
        }
        return values;
    }

    function setConfig(env, path, key, value) {
        const values = parseConfig(readFile(env, path));
        if (value === undefined) {
            delete values[key];
        } else {
            values[key] = value;
        }
        writeFile(env, path, writeConfigText(values));
    }

    // =========================================================================
    // The repository
    // =========================================================================

    // Find the repository the current folder is in, looking upward like Git.
    function findRepo(env) {
        let parts = env.fs.split(env.cwd);
        for (;;) {
            const gitPath = env.fs.join(parts.concat(".git"));
            const found = env.fs.lookup(gitPath);
            if (found.node && found.node.type === "dir" && found.node.repo) {
                return { root: env.fs.join(parts), rootParts: parts, gitPath: gitPath, gitNode: found.node, state: found.node.repo };
            }
            if (!parts.length) {
                return null;
            }
            parts = parts.slice(0, -1);
        }
    }

    function needRepo(env) {
        const repo = findRepo(env);
        if (!repo) {
            throw fail("fatal: not a git repository (or any of the parent directories): .git");
        }
        return repo;
    }

    function headRef(repo) {
        return repo.state.head.startsWith("ref: ") ? repo.state.head.slice(5) : null;
    }

    function headId(repo) {
        const ref = headRef(repo);
        return ref ? repo.state.refs[ref] || null : repo.state.head;
    }

    function currentBranch(repo) {
        const ref = headRef(repo);
        return ref && ref.startsWith("refs/heads/") ? ref.slice(11) : null;
    }

    // Keep the real .git/HEAD file the same as the state, so cat .git/HEAD works.
    function setHead(env, repo, value) {
        repo.state.head = value;
        const file = env.fs.child(repo.gitNode, "HEAD");
        if (file) {
            file.content = value + "\n";
        }
    }

    // Move HEAD's branch (or a detached HEAD) to id, and write it in the reflog.
    function moveHead(repo, id, message) {
        const ref = headRef(repo);
        if (ref) {
            repo.state.refs[ref] = id;
        } else {
            repo.state.head = id;
        }
        logHead(repo, id, message);
    }

    function logHead(repo, id, message) {
        repo.state.reflog.unshift({ id: id, message: message });
        repo.state.reflog = repo.state.reflog.slice(0, 200);
    }

    function branchExists(repo, name) {
        return Object.hasOwn(repo.state.refs, "refs/heads/" + name);
    }

    function isValidRefName(name) {
        return /^[A-Za-z0-9._\/-]+$/.test(name) && !/(^[.\/-]|\.\.|\/$|\.lock$|\/\.|@\{|^HEAD$)/.test(name);
    }

    // HEAD, main, v1.0, origin/main, a1b2c3d, HEAD~2, main^, HEAD^2 -> a commit id, or null.
    function resolve(env, repo, revision) {
        const system = env.system;
        const suffix = /^(.*?)((?:[~^]\d*)*)$/.exec(revision);
        const base = suffix[1] || "HEAD";
        let id = null;

        const reflogEntry = /^(?:HEAD)?@\{(\d+)\}$/.exec(base);
        if (base === "HEAD" || base === "@") {
            id = headId(repo);
        } else if (reflogEntry) {
            // HEAD@{2}: where HEAD was two steps ago, see git reflog.
            const entry = repo.state.reflog[Number(reflogEntry[1])];
            id = entry ? entry.id : null;
        } else if (base === "ORIG_HEAD") {
            id = repo.state.origHead || null;
        } else {
            for (const ref of [base, "refs/heads/" + base, "refs/tags/" + base, "refs/remotes/" + base]) {
                if (Object.hasOwn(repo.state.refs, ref)) {
                    id = peel(system, repo.state.refs[ref]);
                    break;
                }
            }
            if (!id && /^[0-9a-f]{4,40}$/.test(base)) {
                const matches = Object.keys(objects(system)).filter(function (key) {
                    return key.startsWith(base) && ["commit", "tag"].includes(objects(system)[key].type);
                });
                if (matches.length > 1) {
                    throw fail("error: short object ID " + base + " is ambiguous");
                }
                id = matches.length ? peel(system, matches[0]) : null;
            }
        }
        // ~n: n first parents back. ^n: the n:th parent.
        const steps = suffix[2].match(/[~^]\d*/g) || [];
        for (const step of steps) {
            if (!id) {
                return null;
            }
            const n = step.length > 1 ? Number(step.slice(1)) : 1;
            if (step[0] === "~") {
                for (let i = 0; i < n && id; i++) {
                    id = (commitOf(system, id).parents || [])[0] || null;
                }
            } else {
                id = n === 0 ? id : (commitOf(system, id).parents || [])[n - 1] || null;
            }
        }
        return id;
    }

    function needCommit(env, repo, revision) {
        const id = resolve(env, repo, revision);
        if (!id) {
            throw fail("fatal: ambiguous argument '" + revision + "': unknown revision or path not in the working tree.\nUse '--' to separate paths from revisions, like this:\n'git <command> [<revision>...] -- [<file>...]'");
        }
        return id;
    }

    // Every commit reachable from id, id itself too.
    function ancestors(system, id) {
        const seen = new Set();
        const todo = id ? [id] : [];
        while (todo.length) {
            const next = todo.pop();
            if (seen.has(next)) {
                continue;
            }
            seen.add(next);
            const commit = commitOf(system, next);
            if (commit) {
                todo.push.apply(todo, commit.parents);
            }
        }
        return seen;
    }

    function isAncestor(system, older, newer) {
        return Boolean(older) && ancestors(system, newer).has(older);
    }

    // The newest commit both have in their history.
    function mergeBase(system, a, b) {
        const fromA = ancestors(system, a);
        let best = null;
        ancestors(system, b).forEach(function (id) {
            if (fromA.has(id) && (!best || commitOf(system, id).date > commitOf(system, best).date)) {
                best = id;
            }
        });
        return best;
    }

    // Commits in from's history but not in exclude's, oldest first.
    function commitsBetween(system, exclude, from) {
        const skip = ancestors(system, exclude);
        return Array.from(ancestors(system, from))
            .filter(function (id) { return !skip.has(id); })
            .sort(function (x, y) { return commitOf(system, x).date - commitOf(system, y).date; });
    }

    // =========================================================================
    // Paths and the working tree
    // =========================================================================

    // A path typed by the user -> a path in the repository, like "src/app.js".
    function repoPath(env, repo, path) {
        const parts = env.fs.split(path);
        const inside = repo.rootParts.every(function (part, i) { return parts[i] === part; }) && parts.length >= repo.rootParts.length;
        if (!inside) {
            throw fail("fatal: " + path + ": '" + path + "' is outside repository at '" + repo.root + "'");
        }
        return parts.slice(repo.rootParts.length).join("/");
    }

    // A path in the repository -> how Git shows it from the current folder.
    function showPath(env, repo, path) {
        const here = env.fs.split(env.cwd).slice(repo.rootParts.length);
        const target = path.split("/");
        let common = 0;
        while (common < here.length && common < target.length - 1 && here[common] === target[common]) {
            common++;
        }
        return "../".repeat(here.length - common) + target.slice(common).join("/");
    }

    function inSpec(path, spec) {
        return spec === "" || path === spec || path.startsWith(spec + "/");
    }

    // Simple .gitignore: names, *.log and folders like node_modules/.
    function ignoreRules(env, repo) {
        const text = readFile(env, repo.root + "/.gitignore") || "";
        return text.split("\n").map(function (line) { return line.trim(); }).filter(function (line) {
            return line && !line.startsWith("#");
        }).map(function (pattern) {
            const folder = pattern.endsWith("/");
            const clean = pattern.replace(/^\//, "").replace(/\/$/, "");
            const regex = new RegExp("^" + clean.split("*").map(function (part) {
                return part.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
            }).join("[^/]*") + "$");
            return { folder: folder, regex: regex, anchored: clean.includes("/") };
        });
    }

    function isIgnored(path, rules) {
        const parts = path.split("/");
        return rules.some(function (rule) {
            // A rule with a / in it matches from the top: build/out, docs/*.tmp
            if (rule.anchored) {
                return parts.some(function (part, i) {
                    const isLast = i === parts.length - 1;
                    return rule.regex.test(parts.slice(0, i + 1).join("/")) && (!rule.folder || !isLast);
                });
            }
            // A name matches in any folder; a folder rule matches the folders on the way.
            return parts.some(function (part, i) {
                const isLast = i === parts.length - 1;
                return rule.regex.test(part) && (!rule.folder || !isLast);
            });
        });
    }

    // Every file in the working tree: { "src/app.js": "content" }, without .git.
    function workingFiles(env, repo) {
        const files = {};
        const rootNode = env.fs.lookup(repo.root).node;
        (function walk(node, prefix) {
            if (!env.fs.can(node, "r") || !env.fs.can(node, "x")) {
                return;
            }
            env.fs.names(node).forEach(function (name) {
                if (!prefix && name === ".git") {
                    return;
                }
                const child = env.fs.child(node, name);
                const path = prefix ? prefix + "/" + name : name;
                if (child.type === "dir") {
                    walk(child, path);
                } else if (env.fs.can(child, "r")) {
                    files[path] = child.content;
                }
            });
        })(rootNode, "");
        return files;
    }

    function writeWorkFile(env, repo, path, content) {
        const parts = path.split("/");
        for (let i = 1; i < parts.length; i++) {
            const folder = repo.root + "/" + parts.slice(0, i).join("/");
            const found = env.fs.lookup(folder);
            if (!found.node) {
                const error = env.fs.create(folder, env.fs.newDir());
                if (error) {
                    throw fail("error: unable to create directory '" + parts.slice(0, i).join("/") + "': " + env.fs.message(error));
                }
            } else if (found.node.type !== "dir") {
                throw fail("error: '" + parts.slice(0, i).join("/") + "' is a file, not a folder");
            }
        }
        writeFile(env, repo.root + "/" + path, content);
    }

    // Remove a file, and folders that become empty, like Git does.
    function deleteWorkFile(env, repo, path) {
        let parts = path.split("/");
        const found = env.fs.lookup(repo.root + "/" + path);
        if (found.node && found.parent) {
            env.fs.remove(found.parent, found.name);
        }
        while (parts.length > 1) {
            parts = parts.slice(0, -1);
            const folder = env.fs.lookup(repo.root + "/" + parts.join("/"));
            if (folder.node && folder.node.type === "dir" && env.fs.names(folder.node).length === 0 && folder.parent) {
                env.fs.remove(folder.parent, folder.name);
            } else {
                break;
            }
        }
    }

    function blobIdsOf(env, files) {
        const ids = {};
        Object.keys(files).forEach(function (path) { ids[path] = storeBlob(env.system, files[path]); });
        return ids;
    }

    // What changed where: HEAD -> index (staged), index -> files (not staged), untracked.
    function status(env, repo) {
        const head = treeOf(env.system, headId(repo));
        const index = repo.state.index;
        const work = blobIdsOf(env, workingFiles(env, repo));
        const unmerged = (repo.state.merge && repo.state.merge.conflicts) ||
            (repo.state.cherryPick && repo.state.cherryPick.conflicts) || (repo.state.rebase && repo.state.rebase.conflicts) || [];
        const result = { staged: [], unstaged: [], untracked: [], unmerged: unmerged.slice() };
        const all = Array.from(new Set(Object.keys(head).concat(Object.keys(index)))).sort();
        all.forEach(function (path) {
            if (unmerged.includes(path)) {
                return;
            }
            if (!Object.hasOwn(index, path)) {
                result.staged.push({ path: path, kind: "deleted" });
            } else if (!Object.hasOwn(head, path)) {
                result.staged.push({ path: path, kind: "new file" });
            } else if (head[path] !== index[path]) {
                result.staged.push({ path: path, kind: "modified" });
            }
        });
        Object.keys(index).sort().forEach(function (path) {
            if (unmerged.includes(path)) {
                return;
            }
            if (!Object.hasOwn(work, path)) {
                result.unstaged.push({ path: path, kind: "deleted" });
            } else if (work[path] !== index[path]) {
                result.unstaged.push({ path: path, kind: "modified" });
            }
        });
        const rules = ignoreRules(env, repo);
        result.untracked = Object.keys(work).filter(function (path) {
            return !Object.hasOwn(index, path) && !unmerged.includes(path) && !isIgnored(path, rules);
        }).sort();
        result.work = work;
        return result;
    }

    // Make the working tree and index look like a commit's files. Files that
    // aren't in Git are left alone.
    function checkoutTree(env, repo, fromTree, toTree) {
        const work = workingFiles(env, repo);
        Object.keys(fromTree).forEach(function (path) {
            if (!Object.hasOwn(toTree, path)) {
                deleteWorkFile(env, repo, path);
            }
        });
        Object.keys(toTree).forEach(function (path) {
            const content = blobText(env.system, toTree[path]);
            if (work[path] !== content) {
                writeWorkFile(env, repo, path, content);
            }
        });
        repo.state.index = Object.assign({}, toTree);
    }

    // Would going from one tree to another overwrite changes not committed?
    function overwrittenBy(env, repo, fromTree, toTree) {
        const work = blobIdsOf(env, workingFiles(env, repo));
        const index = repo.state.index;
        const changed = [];
        const untracked = [];
        Array.from(new Set(Object.keys(fromTree).concat(Object.keys(toTree)))).forEach(function (path) {
            if (fromTree[path] === toTree[path]) {
                return;
            }
            if (Object.hasOwn(fromTree, path)) {
                if (index[path] !== fromTree[path] || work[path] !== index[path]) {
                    changed.push(path);
                }
            } else if (Object.hasOwn(work, path) && work[path] !== toTree[path]) {
                untracked.push(path);
            }
        });
        return { changed: changed.sort(), untracked: untracked.sort() };
    }

    function hasChanges(env, repo) {
        const s = status(env, repo);
        return s.staged.length > 0 || s.unstaged.length > 0;
    }

    // =========================================================================
    // Diff
    // =========================================================================

    function lines(text) {
        if (!text) {
            return [];
        }
        const all = text.split("\n");
        if (all[all.length - 1] === "") {
            all.pop();
        }
        return all;
    }

    // The shortest list of kept (" "), removed ("-") and added ("+") lines.
    function lineDiff(a, b) {
        let start = 0;
        while (start < a.length && start < b.length && a[start] === b[start]) {
            start++;
        }
        let endA = a.length;
        let endB = b.length;
        while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
            endA--;
            endB--;
        }
        const midA = a.slice(start, endA);
        const midB = b.slice(start, endB);
        // Longest common subsequence of what is left in the middle.
        const table = [];
        for (let i = 0; i <= midA.length; i++) {
            table.push(new Array(midB.length + 1).fill(0));
        }
        for (let i = midA.length - 1; i >= 0; i--) {
            for (let j = midB.length - 1; j >= 0; j--) {
                table[i][j] = midA[i] === midB[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
            }
        }
        const ops = [];
        for (let i = 0; i < start; i++) {
            ops.push({ op: " ", text: a[i] });
        }
        let i = 0;
        let j = 0;
        while (i < midA.length || j < midB.length) {
            if (i < midA.length && j < midB.length && midA[i] === midB[j]) {
                ops.push({ op: " ", text: midA[i] });
                i++;
                j++;
            } else if (j < midB.length && (i === midA.length || table[i][j + 1] >= table[i + 1][j])) {
                ops.push({ op: "+", text: midB[j] });
                j++;
            } else {
                ops.push({ op: "-", text: midA[i] });
                i++;
            }
        }
        for (let k = endA; k < a.length; k++) {
            ops.push({ op: " ", text: a[k] });
        }
        return ops;
    }

    // Unified diff hunks with 3 lines around each change.
    function hunks(ops) {
        const result = [];
        const changed = [];
        ops.forEach(function (op, index) {
            if (op.op !== " ") {
                changed.push(index);
            }
        });
        let k = 0;
        while (k < changed.length) {
            let from = Math.max(0, changed[k] - 3);
            let to = Math.min(ops.length, changed[k] + 4);
            while (k + 1 < changed.length && changed[k + 1] - 3 <= to) {
                k++;
                to = Math.min(ops.length, changed[k] + 4);
            }
            k++;
            let oldLine = 1;
            let newLine = 1;
            for (let i = 0; i < from; i++) {
                if (ops[i].op !== "+") { oldLine++; }
                if (ops[i].op !== "-") { newLine++; }
            }
            const part = ops.slice(from, to);
            const oldCount = part.filter(function (op) { return op.op !== "+"; }).length;
            const newCount = part.filter(function (op) { return op.op !== "-"; }).length;
            const range = function (start, count) { return (count === 0 ? start - 1 : start) + (count === 1 ? "" : "," + count); };
            result.push({ header: "@@ -" + range(oldLine, oldCount) + " +" + range(newLine, newCount) + " @@", ops: part });
        }
        return result;
    }

    function countChanges(oldText, newText) {
        const ops = lineDiff(lines(oldText), lines(newText));
        return {
            insertions: ops.filter(function (op) { return op.op === "+"; }).length,
            deletions: ops.filter(function (op) { return op.op === "-"; }).length
        };
    }

    // diff --git a/f b/f ... as text parts with colors, for out().
    function fileDiff(path, oldId, newId, oldText, newText, displayPath) {
        const shown = displayPath || path;
        const parts = [];
        const add = function (text, cls) { parts.push({ text: text, cls: cls }); };
        add("diff --git a/" + shown + " b/" + shown + "\n", "bold");
        if (!oldId) {
            add("new file mode 100644\n", "bold");
        } else if (!newId) {
            add("deleted file mode 100644\n", "bold");
        }
        add("index " + (oldId ? shortId(oldId) : "0000000") + ".." + (newId ? shortId(newId) : "0000000") + (oldId && newId ? " 100644" : "") + "\n", "bold");
        add("--- " + (oldId ? "a/" + shown : "/dev/null") + "\n", "bold");
        add("+++ " + (newId ? "b/" + shown : "/dev/null") + "\n", "bold");
        hunks(lineDiff(lines(oldText), lines(newText))).forEach(function (hunk) {
            add(hunk.header + "\n", "path");
            hunk.ops.forEach(function (op) {
                add(op.op + op.text + "\n", op.op === "+" ? "exe" : op.op === "-" ? "err" : null);
            });
        });
        return parts;
    }

    // Differences between two { path: blobId } maps, as diff text parts.
    function treeDiff(env, repo, oldTree, newTree, onlyPaths) {
        const parts = [];
        Array.from(new Set(Object.keys(oldTree).concat(Object.keys(newTree)))).sort().forEach(function (path) {
            if (oldTree[path] === newTree[path] || (onlyPaths && !onlyPaths.some(function (spec) { return inSpec(path, spec); }))) {
                return;
            }
            parts.push.apply(parts, fileDiff(path, oldTree[path], newTree[path],
                blobText(env.system, oldTree[path]), blobText(env.system, newTree[path]), repo ? showPath(env, repo, path) : path));
        });
        return parts;
    }

    //  notes.txt | 3 ++-
    //  1 file changed, 2 insertions(+), 1 deletion(-)
    function diffStat(env, oldTree, newTree, summaryOnly) {
        const rows = [];
        Array.from(new Set(Object.keys(oldTree).concat(Object.keys(newTree)))).sort().forEach(function (path) {
            if (oldTree[path] !== newTree[path]) {
                const counts = countChanges(blobText(env.system, oldTree[path]), blobText(env.system, newTree[path]));
                rows.push({ path: path, insertions: counts.insertions, deletions: counts.deletions, created: !oldTree[path], removed: !newTree[path] });
            }
        });
        const width = Math.max(0, ...rows.map(function (row) { return row.path.length; }));
        const numberWidth = Math.max(1, ...rows.map(function (row) { return String(row.insertions + row.deletions).length; }));
        const parts = [];
        if (!summaryOnly) {
            rows.forEach(function (row) {
                parts.push({ text: " " + row.path.padEnd(width) + " | " + String(row.insertions + row.deletions).padStart(numberWidth) + " " });
                parts.push({ text: "+".repeat(Math.min(row.insertions, 40)), cls: "exe" });
                parts.push({ text: "-".repeat(Math.min(row.deletions, 40)) + "\n", cls: "err" });
            });
        }
        const insertions = rows.reduce(function (sum, row) { return sum + row.insertions; }, 0);
        const deletions = rows.reduce(function (sum, row) { return sum + row.deletions; }, 0);
        let summary = " " + rows.length + " file" + (rows.length === 1 ? "" : "s") + " changed";
        if (insertions || !deletions) {
            summary += ", " + insertions + " insertion" + (insertions === 1 ? "" : "s") + "(+)";
        }
        if (deletions) {
            summary += ", " + deletions + " deletion" + (deletions === 1 ? "" : "s") + "(-)";
        }
        parts.push({ text: summary + "\n" });
        return { parts: parts, rows: rows };
    }

    // =========================================================================
    // Merging two versions of the files
    // =========================================================================

    // Changes from base to other, as { start, end, lines } in base's lines.
    function changesFrom(base, other) {
        const changes = [];
        let index = 0;
        let current = null;
        lineDiff(base, other).forEach(function (op) {
            if (op.op === " ") {
                if (current) {
                    changes.push(current);
                    current = null;
                }
                index++;
                return;
            }
            if (!current) {
                current = { start: index, end: index, lines: [] };
            }
            if (op.op === "-") {
                index++;
                current.end = index;
            } else {
                current.lines.push(op.text);
            }
        });
        if (current) {
            changes.push(current);
        }
        return changes;
    }

    // Merge text: both sides changed the file. Clean if they changed different
    // lines, otherwise <<<<<<< markers around the part they disagree on.
    function mergeText(baseText, oursText, theirsText, theirsLabel) {
        const base = lines(baseText);
        const ours = changesFrom(base, lines(oursText));
        const theirs = changesFrom(base, lines(theirsText));
        const overlaps = function (a, b) {
            return a.start < b.end && b.start < a.end || a.start === b.start || (a.start === a.end && a.start > b.start && a.start < b.end) || (b.start === b.end && b.start > a.start && b.start < a.end);
        };
        const same = function (a, b) { return a.start === b.start && a.end === b.end && a.lines.join("\n") === b.lines.join("\n"); };
        const clash = ours.some(function (a) { return theirs.some(function (b) { return overlaps(a, b) && !same(a, b); }); });
        if (!clash) {
            const all = ours.concat(theirs.filter(function (b) { return !ours.some(function (a) { return same(a, b); }); }));
            all.sort(function (a, b) { return b.start - a.start; });
            const result = base.slice();
            all.forEach(function (change) { result.splice(change.start, change.end - change.start, ...change.lines); });
            return { clean: true, text: result.length ? result.join("\n") + "\n" : "" };
        }
        const a = lines(oursText);
        const b = lines(theirsText);
        let start = 0;
        while (start < a.length && start < b.length && a[start] === b[start]) {
            start++;
        }
        let endA = a.length;
        let endB = b.length;
        while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
            endA--;
            endB--;
        }
        const text = a.slice(0, start)
            .concat(["<<<<<<< HEAD"], a.slice(start, endA), ["======="], b.slice(start, endB), [">>>>>>> " + theirsLabel])
            .concat(a.slice(endA));
        return { clean: false, text: text.join("\n") + "\n" };
    }

    // Three trees -> the merged tree, and which paths have conflicts.
    function mergeTrees(env, baseTree, oursTree, theirsTree, theirsLabel) {
        const tree = {};
        const conflicts = [];
        const contents = {};
        Array.from(new Set(Object.keys(baseTree).concat(Object.keys(oursTree), Object.keys(theirsTree)))).sort().forEach(function (path) {
            const b = baseTree[path];
            const o = oursTree[path];
            const t = theirsTree[path];
            let result;
            if (o === t) {
                result = o;
            } else if (o === b) {
                result = t;
            } else if (t === b) {
                result = o;
            } else if (o && t) {
                const merged = mergeText(blobText(env.system, b), blobText(env.system, o), blobText(env.system, t), theirsLabel);
                result = storeBlob(env.system, merged.text);
                if (!merged.clean) {
                    conflicts.push(path);
                    contents[path] = merged.text;
                }
            } else {
                // One side changed it, the other deleted it.
                result = o || t;
                conflicts.push(path);
                contents[path] = blobText(env.system, result);
            }
            if (result) {
                tree[path] = result;
            }
        });
        return { tree: tree, conflicts: conflicts, contents: contents };
    }

    // =========================================================================
    // Commits
    // =========================================================================

    function identity(env, repo) {
        const values = config(env, repo);
        const name = values["user.name"];
        const email = values["user.email"];
        if (!name || !email) {
            throw fail("Author identity unknown\n\n*** Please tell me who you are.\n\nRun\n\n  git config --global user.email \"you@example.com\"\n  git config --global user.name \"Your Name\"\n\nto set your account's default identity.\nOmit --global to set the identity only in this repository.\n\nfatal: unable to auto-detect email address (got '" + env.login + "@" + env.hostname + ".(none)')");
        }
        return name + " <" + email + ">";
    }

    function makeCommit(env, repo, tree, parents, message, author) {
        const date = nowSeconds();
        const who = identity(env, repo);
        return storeObject(env.system, {
            type: "commit",
            tree: Object.assign({}, tree),
            parents: parents.filter(Boolean),
            author: author || who,
            committer: who,
            date: date,
            timezone: timezone(date),
            message: message.replace(/\s+$/, "") + "\n"
        });
    }

    function subject(commit) {
        return commit.message.split("\n")[0];
    }

    // =========================================================================
    // Pretend servers (GitHub)
    // =========================================================================

    const remoteBuilders = {};

    // "git@github.com:anna/project.git" and "https://github.com/anna/project.git"
    // are the same repository: "github.com/anna/project".
    function serverKey(url) {
        return String(url).replace(/^[a-z+]+:\/\//, "").replace(/^[^@\/]+@/, "").replace(":", "/").replace(/\.git$/, "").replace(/\/+$/, "");
    }

    // data/git-remotes.js describes repositories on the pretend GitHub.
    function defineRemote(url, build) {
        remoteBuilders[serverKey(url)] = build;
    }

    // A server repository: { refs: { "refs/heads/main": id, ... }, head: "main" }.
    // create: make an empty one, like a new repository made on GitHub.
    function server(system, url, create) {
        if (!system.gitServers) {
            system.gitServers = {};
        }
        const key = serverKey(url);
        if (Object.hasOwn(system.gitServers, key)) {
            return system.gitServers[key];
        }
        if (Object.hasOwn(remoteBuilders, key)) {
            const built = { refs: {}, head: "main" };
            remoteBuilders[key](builderFor(system, built));
            system.gitServers[key] = built;
            return built;
        }
        if (create && /github/.test(key)) {
            system.gitServers[key] = { refs: {}, head: "main" };
            return system.gitServers[key];
        }
        return null;
    }

    // What data/git-remotes.js uses to make history with fixed dates.
    function builderFor(system, built) {
        return {
            commit: function (options) {
                const parent = options.parent || null;
                const tree = Object.assign({}, treeOf(system, parent));
                Object.keys(options.files || {}).forEach(function (path) {
                    if (options.files[path] === null) {
                        delete tree[path];
                    } else {
                        tree[path] = storeBlob(system, options.files[path]);
                    }
                });
                const date = Math.floor(new Date(options.date).getTime() / 1000);
                return storeObject(system, {
                    type: "commit",
                    tree: tree,
                    parents: options.parents || (parent ? [parent] : []),
                    author: options.author,
                    committer: options.author,
                    date: date,
                    timezone: timezone(date),
                    message: options.message + "\n"
                });
            },
            branch: function (name, id) {
                built.refs["refs/heads/" + name] = id;
            },
            tag: function (name, id, options) {
                if (!options) {
                    built.refs["refs/tags/" + name] = id;
                    return;
                }
                const date = Math.floor(new Date(options.date).getTime() / 1000);
                built.refs["refs/tags/" + name] = storeObject(system, {
                    type: "tag", object: id, tag: name, tagger: options.tagger, date: date, timezone: timezone(date), message: options.message + "\n"
                });
            }
        };
    }

    return {
        version: VERSION,
        GitError: GitError,
        fail: fail,
        sha1: sha1,
        setClock: setClock,
        nowSeconds: nowSeconds,
        timezone: timezone,
        dateText: dateText,
        shortId: shortId,
        storeBlob: storeBlob,
        storeObject: storeObject,
        getObject: getObject,
        blobText: blobText,
        commitOf: commitOf,
        treeOf: treeOf,
        peel: peel,
        parseConfig: parseConfig,
        writeConfigText: writeConfigText,
        readFile: readFile,
        writeFile: writeFile,
        globalConfigPath: globalConfigPath,
        config: config,
        setConfig: setConfig,
        findRepo: findRepo,
        needRepo: needRepo,
        headRef: headRef,
        headId: headId,
        currentBranch: currentBranch,
        setHead: setHead,
        moveHead: moveHead,
        logHead: logHead,
        branchExists: branchExists,
        isValidRefName: isValidRefName,
        resolve: resolve,
        needCommit: needCommit,
        ancestors: ancestors,
        isAncestor: isAncestor,
        mergeBase: mergeBase,
        commitsBetween: commitsBetween,
        repoPath: repoPath,
        showPath: showPath,
        inSpec: inSpec,
        ignoreRules: ignoreRules,
        isIgnored: isIgnored,
        workingFiles: workingFiles,
        writeWorkFile: writeWorkFile,
        deleteWorkFile: deleteWorkFile,
        blobIdsOf: blobIdsOf,
        status: status,
        checkoutTree: checkoutTree,
        overwrittenBy: overwrittenBy,
        hasChanges: hasChanges,
        lines: lines,
        lineDiff: lineDiff,
        fileDiff: fileDiff,
        treeDiff: treeDiff,
        diffStat: diffStat,
        mergeTrees: mergeTrees,
        mergeText: mergeText,
        identity: identity,
        makeCommit: makeCommit,
        subject: subject,
        serverKey: serverKey,
        defineRemote: defineRemote,
        server: server
    };
})();

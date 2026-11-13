// git: version control. The model (objects, branches, diff, merge) is in
// lib/git.js; this file is the commands: git status, git commit ...
//
// Everything happens in the pretend file system: git init makes a .git
// folder, git commit stores the files, git switch changes them. There is
// no editor, so commit messages are given with -m. A pretend GitHub (see
// data/git-remotes.js) is there for clone, fetch, pull and push.

(function () {
    const G = Playground.git;

    // git <command> -h prints these.
    const USAGE = {
        init: "git init [-b <branch-name>] [<directory>]",
        config: "git config [--global] <name> [<value>]\n   or: git config [--global] --list [--show-origin]\n   or: git config [--global] --unset <name>\n   or: git config [--global] --get-regexp <pattern>",
        clone: "git clone [--branch <name>] [--depth <depth>] <repo> [<dir>]",
        status: "git status [-s]",
        add: "git add [-A] [--] <pathspec>...",
        rm: "git rm [--cached] [-r] <file>...",
        restore: "git restore [--staged] [--worktree] <pathspec>...",
        diff: "git diff [--staged] [<commit> [<commit>]] [--stat] [-- <path>...]",
        commit: "git commit [-a] [-m <msg>] [--amend] [--no-edit] [--author=<author>]",
        log: "git log [-<n>] [--oneline] [--graph] [--all] [--stat] [--name-only] [--author=<a>] [--grep=<text>] [<revision>] [-- <path>]",
        show: "git show [<object>]",
        branch: "git branch [-a] [-v]\n   or: git branch <branchname> [<start-point>]\n   or: git branch -m [<oldbranch>] <newbranch>\n   or: git branch (-d | -D) <branchname>...",
        switch: "git switch [-c <new-branch>] <branch>\n   or: git switch -",
        checkout: "git checkout [-b <new-branch>] <branch>\n   or: git checkout <commit>\n   or: git checkout -- <file>...",
        merge: "git merge [--no-ff] [-m <msg>] <branch>\n   or: git merge --abort",
        reset: "git reset [--soft | --mixed | --hard] [<commit>]\n   or: git reset [<commit>] -- <pathspec>...",
        reflog: "git reflog",
        stash: "git stash [push [-m <message>] [-u]]\n   or: git stash list\n   or: git stash (pop | apply | drop | show [-p]) [<stash>]",
        tag: "git tag [-a] [-m <msg>] <tagname> [<commit>]\n   or: git tag -d <tagname>...\n   or: git tag [-l [<pattern>]]",
        remote: "git remote [-v]\n   or: git remote add <name> <url>\n   or: git remote set-url <name> <newurl>\n   or: git remote remove <name>",
        fetch: "git fetch [<remote>]",
        pull: "git pull [<remote> [<branch>]]",
        push: "git push [-u] [--force-with-lease] [--tags] [<remote> [<branch>...]]\n   or: git push <remote> --delete <branch>",
        "cherry-pick": "git cherry-pick [-x] <commit>...\n   or: git cherry-pick (--continue | --abort)",
        rebase: "git rebase <upstream>\n   or: git rebase (--continue | --abort)"
    };

    const SUMMARY = [
        ["start a working area", [["clone", "Clone a repository into a new directory"], ["init", "Create an empty Git repository"]]],
        ["work on the current change", [["add", "Add file contents to the index"], ["rm", "Remove files from the working tree and from the index"], ["restore", "Restore working tree files"]]],
        ["examine the history and state", [["diff", "Show changes between commits, commit and working tree, etc"], ["log", "Show commit logs"], ["show", "Show various types of objects"], ["status", "Show the working tree status"]]],
        ["grow, mark and tweak your common history", [["branch", "List, create, or delete branches"], ["commit", "Record changes to the repository"], ["merge", "Join two or more development histories together"], ["rebase", "Reapply commits on top of another base tip"], ["reset", "Reset current HEAD to the specified state"], ["switch", "Switch branches"], ["tag", "Create, list, delete tags"]]],
        ["collaborate", [["fetch", "Download objects and refs from another repository"], ["pull", "Fetch from and integrate with another repository or a local branch"], ["push", "Update remote refs along with associated objects"]]]
    ];

    // --- Small helpers --------------------------------------------------------

    function print(env, parts) {
        parts.forEach(function (part) { env.out(part.text, part.cls); });
    }

    function plural(n, word) {
        return n + " " + word + (n === 1 ? "" : "s");
    }

    // "-m text", "-mtext", "--message=text" and "--message text"
    function takeValue(args, i, short, long) {
        const arg = args[i];
        if (arg === short || arg === long) {
            if (i + 1 >= args.length) {
                throw G.fail("error: switch `" + (short || long).replace(/^-+/, "") + "' requires a value");
            }
            return { value: args[i + 1], next: i + 1 };
        }
        if (long && arg.startsWith(long + "=")) {
            return { value: arg.slice(long.length + 1), next: i };
        }
        if (short && arg.startsWith(short) && arg.length > short.length) {
            return { value: arg.slice(short.length), next: i };
        }
        return null;
    }

    // Split words like the shell: "commit -am" -> ["commit", "-am"].
    function words(text) {
        const result = [];
        const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
        let match;
        while ((match = regex.exec(text))) {
            result.push(match[1] !== undefined ? match[1] : match[2] !== undefined ? match[2] : match[3]);
        }
        return result;
    }

    // Update the working tree and index for paths that differ between two
    // trees, and keep other local changes, like switching branches does.
    function carry(env, repo, fromTree, toTree) {
        Array.from(new Set(Object.keys(fromTree).concat(Object.keys(toTree)))).forEach(function (path) {
            if (fromTree[path] === toTree[path]) {
                return;
            }
            if (toTree[path]) {
                G.writeWorkFile(env, repo, path, G.blobText(env.system, toTree[path]));
                repo.state.index[path] = toTree[path];
            } else {
                G.deleteWorkFile(env, repo, path);
                delete repo.state.index[path];
            }
        });
    }

    function overwriteError(list, verb) {
        let text = "";
        if (list.changed.length) {
            text += "error: Your local changes to the following files would be overwritten by " + verb + ":\n" +
                list.changed.map(function (path) { return "\t" + path + "\n"; }).join("") +
                "Please commit your changes or stash them before you " + (verb === "checkout" ? "switch branches" : verb) + ".\n";
        }
        if (list.untracked.length) {
            text += "error: The following untracked working tree files would be overwritten by " + verb + ":\n" +
                list.untracked.map(function (path) { return "\t" + path + "\n"; }).join("") +
                "Please move or remove them before you " + (verb === "checkout" ? "switch branches" : verb) + ".\n";
        }
        return G.fail(text + "Aborting");
    }

    // Names pointing at each commit, for log: (HEAD -> main, tag: v1.0, origin/main)
    function decorations(env, repo) {
        const map = {};
        const add = function (id, part) {
            if (!map[id]) {
                map[id] = [];
            }
            map[id].push(part);
        };
        const branch = G.currentBranch(repo);
        const head = G.headId(repo);
        if (head) {
            add(head, branch ? { text: "HEAD -> ", cls: "path", then: { text: branch, cls: "exe" } } : { text: "HEAD", cls: "path" });
        }
        const refs = Object.keys(repo.state.refs).sort();
        refs.filter(function (ref) { return ref.startsWith("refs/tags/"); }).forEach(function (ref) {
            add(G.peel(env.system, repo.state.refs[ref]), { text: "tag: " + ref.slice(10), cls: "info" });
        });
        refs.filter(function (ref) { return ref.startsWith("refs/remotes/"); }).forEach(function (ref) {
            add(repo.state.refs[ref], { text: ref.slice(13), cls: "err" });
        });
        refs.filter(function (ref) { return ref.startsWith("refs/heads/") && ref.slice(11) !== branch; }).forEach(function (ref) {
            add(repo.state.refs[ref], { text: ref.slice(11), cls: "exe" });
        });
        return map;
    }

    function decorationParts(list, withParens) {
        if (!list || !list.length) {
            return [];
        }
        const parts = [{ text: withParens ? " (" : "", cls: "info" }];
        list.forEach(function (item, i) {
            if (i > 0) {
                parts.push({ text: ", ", cls: "info" });
            }
            parts.push({ text: item.text, cls: item.cls });
            if (item.then) {
                parts.push({ text: item.then.text, cls: item.then.cls });
            }
        });
        if (withParens) {
            parts.push({ text: ")", cls: "info" });
        }
        return parts;
    }

    function partsText(parts) {
        return parts.map(function (part) { return part.text; }).join("");
    }

    // The branch a branch follows, from .git/config: { name: "origin/main", ref, id }
    function upstreamOf(env, repo, branch) {
        const values = G.config(env, repo);
        const remote = values["branch." + branch + ".remote"];
        const merge = values["branch." + branch + ".merge"];
        if (!remote || !merge) {
            return null;
        }
        const ref = "refs/remotes/" + remote + "/" + merge.replace(/^refs\/heads\//, "");
        return { name: remote + "/" + merge.replace(/^refs\/heads\//, ""), ref: ref, id: repo.state.refs[ref] || null, remote: remote };
    }

    function setUpstream(env, repo, branch, remote) {
        const path = repo.gitPath + "/config";
        G.setConfig(env, path, "branch." + branch + ".remote", remote);
        G.setConfig(env, path, "branch." + branch + ".merge", "refs/heads/" + branch);
    }

    // "Your branch is ahead of 'origin/main' by 1 commit."
    function trackingText(env, repo, branch) {
        const upstream = upstreamOf(env, repo, branch);
        if (!upstream) {
            return "";
        }
        if (!upstream.id) {
            return "Your branch is based on '" + upstream.name + "', but the upstream is gone.\n  (use \"git branch --unset-upstream\" to fixup)\n";
        }
        const head = G.headId(repo);
        const ahead = G.commitsBetween(env.system, upstream.id, head).length;
        const behind = G.commitsBetween(env.system, head, upstream.id).length;
        if (!ahead && !behind) {
            return "Your branch is up to date with '" + upstream.name + "'.\n";
        }
        if (ahead && !behind) {
            return "Your branch is ahead of '" + upstream.name + "' by " + plural(ahead, "commit") + ".\n  (use \"git push\" to publish your local commits)\n";
        }
        if (behind && !ahead) {
            return "Your branch is behind '" + upstream.name + "' by " + plural(behind, "commit") + ", and can be fast-forwarded.\n  (use \"git pull\" to update your local branch)\n";
        }
        return "Your branch and '" + upstream.name + "' have diverged,\nand have " + ahead + " and " + behind + " different commits each, respectively.\n  (use \"git pull\" if you want to integrate the remote branch with yours)\n";
    }

    function remoteUrl(env, repo, name) {
        return G.config(env, repo)["remote." + name + ".url"] || null;
    }

    function remoteNames(env, repo) {
        const names = [];
        Object.keys(G.parseConfig(G.readFile(env, repo.gitPath + "/config"))).forEach(function (key) {
            const match = /^remote\.(.+)\.url$/.exec(key);
            if (match) {
                names.push(match[1]);
            }
        });
        return names;
    }

    function shownUrl(url) {
        return url.replace(/\.git$/, "");
    }

    // =========================================================================
    // init and config
    // =========================================================================

    // Make the .git folder: the state, and real files to look at.
    function initRepo(env, path, branch) {
        const gitPath = (path === "/" ? "" : path) + "/.git";
        const error = env.fs.create(gitPath, env.fs.newDir());
        if (error) {
            throw G.fail("fatal: cannot mkdir " + gitPath + ": " + env.fs.message(error));
        }
        const gitNode = env.fs.lookup(gitPath).node;
        gitNode.repo = { head: "ref: refs/heads/" + branch, refs: {}, index: {}, stash: [], reflog: [], merge: null, cherryPick: null, rebase: null };
        G.writeFile(env, gitPath + "/HEAD", "ref: refs/heads/" + branch + "\n");
        G.writeFile(env, gitPath + "/config", "[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n\tlogallrefupdates = true\n");
        G.writeFile(env, gitPath + "/description", "Unnamed repository; edit this file 'description' to name the repository.\n");
        ["hooks", "objects", "refs", "refs/heads", "refs/tags", "info"].forEach(function (folder) {
            env.fs.create(gitPath + "/" + folder, env.fs.newDir());
        });
        G.writeFile(env, gitPath + "/info/exclude", "# git ls-files --others --exclude-from=.git/info/exclude\n");
        G.writeFile(env, gitPath + "/hooks/pre-commit.sample", "#!/bin/sh\n# An example hook script to verify what is about to be committed.\n# To enable this hook, rename this file to \"pre-commit\".\n");
        G.writeFile(env, gitPath + "/hooks/commit-msg.sample", "#!/bin/sh\n# An example hook script to check the commit log message.\n# To enable this hook, rename this file to \"commit-msg\".\n");
        G.writeFile(env, gitPath + "/hooks/pre-push.sample", "#!/bin/sh\n# An example hook script to verify what is about to be pushed.\n# To enable this hook, rename this file to \"pre-push\".\n");
        return gitNode;
    }

    function cmdInit(args, env) {
        let branch = null;
        let folder = ".";
        let quiet = false;
        for (let i = 0; i < args.length; i++) {
            const value = takeValue(args, i, "-b", "--initial-branch");
            if (value) {
                branch = value.value;
                i = value.next;
            } else if (args[i] === "-q" || args[i] === "--quiet") {
                quiet = true;
            } else if (args[i].startsWith("-")) {
                throw G.fail("error: unknown option `" + args[i].replace(/^-+/, "") + "'\nusage: " + USAGE.init);
            } else {
                folder = args[i];
            }
        }
        const parts = env.fs.split(folder);
        for (let i = 1; i <= parts.length; i++) {
            const step = env.fs.join(parts.slice(0, i));
            if (!env.fs.lookup(step).node) {
                const error = env.fs.create(step, env.fs.newDir());
                if (error) {
                    throw G.fail("fatal: cannot mkdir " + folder + ": " + env.fs.message(error));
                }
            }
        }
        const path = env.fs.join(parts);
        const existing = env.fs.lookup(path + "/.git").node;
        if (existing && existing.repo) {
            if (!quiet) {
                env.out("Reinitialized existing Git repository in " + (path === "/" ? "" : path) + "/.git/\n");
            }
            return;
        }
        if (!branch) {
            branch = G.config(env, null)["init.defaultbranch"];
            if (!branch) {
                branch = "master";
                env.note("hint: Using 'master' as the name for the initial branch. This default branch name\n" +
                    "hint: is subject to change. To configure the initial branch name to use in all\n" +
                    "hint: of your new repositories, which will suppress this warning, call:\nhint:\n" +
                    "hint: \tgit config --global init.defaultBranch <name>\nhint:\n" +
                    "hint: Names commonly chosen instead of 'master' are 'main', 'trunk' and\n" +
                    "hint: 'development'. The just-created branch can be renamed via this command:\nhint:\n" +
                    "hint: \tgit branch -m <name>");
            }
        }
        if (!G.isValidRefName(branch)) {
            throw G.fail("fatal: invalid initial branch name: '" + branch + "'");
        }
        initRepo(env, path, branch);
        if (!quiet) {
            env.out("Initialized empty Git repository in " + (path === "/" ? "" : path) + "/.git/\n");
        }
    }

    function cmdConfig(args, env) {
        let scope = null;
        let action = "set";
        let showOrigin = false;
        const rest = [];
        args.forEach(function (arg) {
            if (arg === "--global" || arg === "--local") {
                scope = arg.slice(2);
            } else if (arg === "--list" || arg === "-l") {
                action = "list";
            } else if (arg === "--show-origin") {
                showOrigin = true;
            } else if (arg === "--unset") {
                action = "unset";
            } else if (arg === "--get") {
                action = "get";
            } else if (arg === "--get-regexp") {
                action = "regexp";
            } else if (arg.startsWith("-")) {
                throw G.fail("error: unknown option `" + arg.replace(/^-+/, "") + "'\nusage: " + USAGE.config);
            } else {
                rest.push(arg);
            }
        });
        const repo = G.findRepo(env);
        const globalPath = G.globalConfigPath(env);
        const files = [];
        if (scope !== "local") {
            files.push({ path: globalPath, values: G.parseConfig(G.readFile(env, globalPath)) });
        }
        if (repo && scope !== "global") {
            files.push({ path: repo.gitPath + "/config", values: G.parseConfig(G.readFile(env, repo.gitPath + "/config")) });
        }
        // Writing goes to one file: --global, or the repository's.
        const target = scope === "global" ? globalPath : repo ? repo.gitPath + "/config" : null;
        // Section and name are not case sensitive; the middle part is.
        const normal = function (key) {
            const parts = key.split(".");
            if (parts.length < 2 || !parts[parts.length - 1]) {
                throw G.fail("error: key does not contain a section: " + key);
            }
            parts[0] = parts[0].toLowerCase();
            parts[parts.length - 1] = parts[parts.length - 1].toLowerCase();
            return parts.join(".");
        };

        if (action === "list" || action === "regexp") {
            const pattern = action === "regexp" ? new RegExp(rest[0] || "") : null;
            files.forEach(function (file) {
                Object.keys(file.values).forEach(function (key) {
                    if (pattern && !pattern.test(key)) {
                        return;
                    }
                    const origin = showOrigin ? "file:" + file.path.replace(env.home, "~").replace(/^~/, env.home) + "\t" : "";
                    env.out(origin + key + (pattern ? " " : "=") + file.values[key] + "\n");
                });
            });
            return;
        }
        if (!rest.length) {
            throw G.fail("usage: " + USAGE.config);
        }
        const key = normal(rest[0]);
        if (action === "unset") {
            if (!target) {
                throw G.fail("fatal: not in a git directory");
            }
            G.setConfig(env, target, key, undefined);
            return;
        }
        if (rest.length === 1 || action === "get") {
            let value;
            files.forEach(function (file) {
                if (Object.hasOwn(file.values, key)) {
                    value = file.values[key];
                }
            });
            if (value !== undefined) {
                env.out(value + "\n");
            }
            return;
        }
        if (!target) {
            throw G.fail("fatal: not in a git directory");
        }
        G.setConfig(env, target, key, rest.slice(1).join(" "));
    }

    // =========================================================================
    // status, add, rm, restore
    // =========================================================================

    function printStatus(env, repo, short) {
        const s = G.status(env, repo);
        const branch = G.currentBranch(repo);
        const head = G.headId(repo);

        if (short) {
            const lines = {};
            s.unmerged.forEach(function (path) { lines[path] = ["U", "U"]; });
            s.staged.forEach(function (item) { lines[item.path] = [item.kind === "new file" ? "A" : item.kind === "deleted" ? "D" : "M", " "]; });
            s.unstaged.forEach(function (item) {
                const line = lines[item.path] || [" ", " "];
                line[1] = item.kind === "deleted" ? "D" : "M";
                lines[item.path] = line;
            });
            Object.keys(lines).sort().forEach(function (path) {
                env.out(lines[path][0], "exe");
                env.out(lines[path][1], "err");
                env.out(" " + G.showPath(env, repo, path) + "\n");
            });
            s.untracked.forEach(function (path) {
                env.out("??", "err");
                env.out(" " + G.showPath(env, repo, path) + "\n");
            });
            return s;
        }

        const state = repo.state;
        if (state.rebase) {
            env.out("rebase in progress; onto " + G.shortId(state.rebase.onto) + "\n");
            env.out("You are currently rebasing branch '" + state.rebase.branch + "' on '" + G.shortId(state.rebase.onto) + "'.\n");
            env.out(s.unmerged.length ? "  (fix conflicts and then run \"git rebase --continue\")\n  (use \"git rebase --skip\" to skip this patch)\n  (use \"git rebase --abort\" to check out the original branch)\n\n"
                : "  (all conflicts fixed: run \"git rebase --continue\")\n\n");
        } else if (branch) {
            env.out("On branch " + branch + "\n");
        } else {
            env.out("HEAD detached at ", "err");
            env.out(G.shortId(head) + "\n", "err");
        }
        if (branch && head && !state.rebase) {
            env.out(trackingText(env, repo, branch));
        }
        if (!head) {
            env.out("\nNo commits yet\n");
        }
        if (state.merge) {
            env.out(s.unmerged.length ? "\nYou have unmerged paths.\n  (fix conflicts and run \"git commit\")\n  (use \"git merge --abort\" to abort the merge)\n"
                : "\nAll conflicts fixed but you are still merging.\n  (use \"git commit\" to conclude merge)\n");
        }
        if (state.cherryPick) {
            env.out("\nYou are currently cherry-picking commit " + G.shortId(state.cherryPick.commit) + ".\n" +
                (s.unmerged.length ? "  (fix conflicts and run \"git cherry-pick --continue\")\n" : "  (all conflicts fixed: run \"git cherry-pick --continue\")\n") +
                "  (use \"git cherry-pick --skip\" to skip this patch)\n  (use \"git cherry-pick --abort\" to cancel the cherry-pick operation)\n");
        }
        const section = function (title, hints, items, cls) {
            env.out("\n" + title + ":\n" + hints.map(function (hint) { return "  (" + hint + ")\n"; }).join(""));
            items.forEach(function (item) {
                env.out("\t" + item + "\n", cls);
            });
        };
        if (s.staged.length) {
            section("Changes to be committed", [head ? "use \"git restore --staged <file>...\" to unstage" : "use \"git rm --cached <file>...\" to unstage"],
                s.staged.map(function (item) { return (item.kind + ":").padEnd(12) + G.showPath(env, repo, item.path); }), "exe");
        }
        if (s.unmerged.length) {
            section("Unmerged paths", ["use \"git add <file>...\" to mark resolution"],
                s.unmerged.map(function (path) { return "both modified:   " + G.showPath(env, repo, path); }), "err");
        }
        if (s.unstaged.length) {
            section("Changes not staged for commit", ["use \"git add" + (s.unstaged.some(function (item) { return item.kind === "deleted"; }) ? "/rm" : "") + " <file>...\" to update what will be committed", "use \"git restore <file>...\" to discard changes in working directory"],
                s.unstaged.map(function (item) { return (item.kind + ":").padEnd(12) + G.showPath(env, repo, item.path); }), "err");
        }
        if (s.untracked.length) {
            // A folder with nothing tracked in it is shown as the folder.
            const shown = [];
            s.untracked.forEach(function (path) {
                const parts = path.split("/");
                let name = path;
                for (let i = 1; i < parts.length; i++) {
                    const folder = parts.slice(0, i).join("/");
                    if (!Object.keys(state.index).some(function (p) { return p.startsWith(folder + "/"); })) {
                        name = folder + "/";
                        break;
                    }
                }
                const display = name.endsWith("/") ? G.showPath(env, repo, name.slice(0, -1)) + "/" : G.showPath(env, repo, name);
                if (!shown.includes(display)) {
                    shown.push(display);
                }
            });
            section("Untracked files", ["use \"git add <file>...\" to include in what will be committed"], shown, "err");
        }
        env.out("\n");
        if (!s.staged.length && !s.unmerged.length) {
            if (s.unstaged.length) {
                env.out("no changes added to commit (use \"git add\" and/or \"git commit -a\")\n");
            } else if (s.untracked.length) {
                env.out("nothing added to commit but untracked files present (use \"git add\" to track)\n");
            } else if (!head) {
                env.out("nothing to commit (create/copy files and use \"git add\" to track)\n");
            } else {
                env.out("nothing to commit, working tree clean\n");
            }
        }
        return s;
    }

    function cmdStatus(args, env) {
        printStatus(env, G.needRepo(env), args.includes("-s") || args.includes("--short"));
    }

    function cmdAdd(args, env) {
        const repo = G.needRepo(env);
        let all = false;
        let force = false;
        const paths = [];
        args.forEach(function (arg) {
            if (arg === "-A" || arg === "--all") {
                all = true;
            } else if (arg === "-f" || arg === "--force") {
                force = true;
            } else if (arg === "--") {
                // only paths follow
            } else if (arg.startsWith("-")) {
                throw G.fail("error: unknown option `" + arg.replace(/^-+/, "") + "'\nusage: " + USAGE.add);
            } else {
                paths.push(arg);
            }
        });
        if (!all && !paths.length) {
            env.out("Nothing specified, nothing added.\n");
            env.note("hint: Maybe you wanted to say 'git add .'?\nhint: Turn this message off by running\nhint: \"git config advice.addEmptyPathspec false\"");
            return;
        }
        const specs = all ? [""] : paths.map(function (path) { return G.repoPath(env, repo, path); });
        const files = G.workingFiles(env, repo);
        const index = repo.state.index;
        const rules = G.ignoreRules(env, repo);
        const ignored = [];
        specs.forEach(function (spec, i) {
            const matching = Object.keys(files).filter(function (path) { return G.inSpec(path, spec); });
            const inIndex = Object.keys(index).filter(function (path) { return G.inSpec(path, spec); });
            if (!matching.length && !inIndex.length) {
                throw G.fail("fatal: pathspec '" + paths[i] + "' did not match any files");
            }
            matching.forEach(function (path) {
                if (!Object.hasOwn(index, path) && G.isIgnored(path, rules) && !force) {
                    if (path === spec) {
                        ignored.push(paths[i]);
                    }
                    return;
                }
                index[path] = G.storeBlob(env.system, files[path]);
            });
            // A file that is gone from the working tree: stage that it is deleted.
            inIndex.forEach(function (path) {
                if (!Object.hasOwn(files, path)) {
                    delete index[path];
                }
            });
            ["merge", "cherryPick", "rebase"].forEach(function (name) {
                if (repo.state[name] && repo.state[name].conflicts) {
                    repo.state[name].conflicts = repo.state[name].conflicts.filter(function (path) { return !G.inSpec(path, spec); });
                }
            });
        });
        if (ignored.length) {
            throw G.fail("The following paths are ignored by one of your .gitignore files:\n" + ignored.join("\n") +
                "\nhint: Use -f if you really want to add them.");
        }
    }

    function cmdRm(args, env) {
        const repo = G.needRepo(env);
        const cached = args.includes("--cached");
        const recursive = args.includes("-r");
        const paths = args.filter(function (arg) { return !arg.startsWith("-"); });
        if (!paths.length) {
            throw G.fail("usage: " + USAGE.rm);
        }
        paths.forEach(function (path) {
            const spec = G.repoPath(env, repo, path);
            const matching = Object.keys(repo.state.index).filter(function (p) { return G.inSpec(p, spec); });
            if (!matching.length) {
                throw G.fail("fatal: pathspec '" + path + "' did not match any files");
            }
            if (matching.some(function (p) { return p !== spec; }) && !recursive) {
                throw G.fail("fatal: not removing '" + path + "' recursively without -r");
            }
            matching.forEach(function (p) {
                delete repo.state.index[p];
                if (!cached) {
                    G.deleteWorkFile(env, repo, p);
                }
                env.out("rm '" + p + "'\n");
            });
        });
    }

    function cmdRestore(args, env) {
        const repo = G.needRepo(env);
        let staged = false;
        let worktree = false;
        let source = null;
        const paths = [];
        for (let i = 0; i < args.length; i++) {
            const value = takeValue(args, i, "-s", "--source");
            if (value) {
                source = value.value;
                i = value.next;
            } else if (args[i] === "--staged" || args[i] === "-S") {
                staged = true;
            } else if (args[i] === "--worktree" || args[i] === "-W") {
                worktree = true;
            } else if (args[i] !== "--") {
                paths.push(args[i]);
            }
        }
        if (!staged) {
            worktree = true;
        }
        if (!paths.length) {
            throw G.fail("fatal: you must specify path(s) to restore");
        }
        const sourceTree = source ? G.treeOf(env.system, G.needCommit(env, repo, source)) : G.treeOf(env.system, G.headId(repo));
        paths.forEach(function (path) {
            const spec = G.repoPath(env, repo, path);
            const index = repo.state.index;
            const known = Array.from(new Set(Object.keys(index).concat(Object.keys(sourceTree)))).filter(function (p) { return G.inSpec(p, spec); });
            if (!known.length) {
                throw G.fail("error: pathspec '" + path + "' did not match any file(s) known to git");
            }
            known.forEach(function (p) {
                if (staged) {
                    if (sourceTree[p]) {
                        index[p] = sourceTree[p];
                    } else {
                        delete index[p];
                    }
                }
                if (worktree) {
                    const id = staged || source ? sourceTree[p] : index[p];
                    if (id) {
                        G.writeWorkFile(env, repo, p, G.blobText(env.system, id));
                    } else if (!staged) {
                        G.deleteWorkFile(env, repo, p);
                    }
                }
            });
        });
    }

    // =========================================================================
    // diff, commit
    // =========================================================================

    function cmdDiff(args, env) {
        const repo = G.needRepo(env);
        let staged = false;
        let stat = false;
        let nameOnly = false;
        const revisions = [];
        let paths = null;
        args.forEach(function (arg, i) {
            if (paths) {
                paths.push(G.repoPath(env, repo, arg));
            } else if (arg === "--") {
                paths = [];
            } else if (arg === "--staged" || arg === "--cached") {
                staged = true;
            } else if (arg === "--stat") {
                stat = true;
            } else if (arg === "--name-only") {
                nameOnly = true;
            } else if (arg.startsWith("-")) {
                throw G.fail("error: invalid option: " + arg);
            } else if (arg.includes("..")) {
                revisions.push.apply(revisions, arg.split(/\.\.\.?/).map(function (r) { return r || "HEAD"; }));
            } else if (G.resolve(env, repo, arg)) {
                revisions.push(arg);
            } else {
                paths = (paths || []).concat([G.repoPath(env, repo, arg)]);
            }
        });
        const work = G.blobIdsOf(env, G.workingFiles(env, repo));
        const index = repo.state.index;
        let oldTree;
        let newTree;
        if (revisions.length === 2) {
            oldTree = G.treeOf(env.system, G.needCommit(env, repo, revisions[0]));
            newTree = G.treeOf(env.system, G.needCommit(env, repo, revisions[1]));
        } else if (revisions.length === 1) {
            oldTree = G.treeOf(env.system, G.needCommit(env, repo, revisions[0]));
            newTree = staged ? index : trackedWork(work, Object.assign({}, index, oldTree));
        } else if (staged) {
            oldTree = G.treeOf(env.system, G.headId(repo));
            newTree = index;
        } else {
            oldTree = index;
            newTree = trackedWork(work, index);
        }
        if (stat) {
            print(env, G.diffStat(env, filterTree(oldTree, paths), filterTree(newTree, paths)).parts);
        } else if (nameOnly) {
            Object.keys(Object.assign({}, oldTree, newTree)).sort().forEach(function (path) {
                if (oldTree[path] !== newTree[path] && (!paths || paths.some(function (spec) { return G.inSpec(path, spec); }))) {
                    env.out(G.showPath(env, repo, path) + "\n");
                }
            });
        } else {
            print(env, G.treeDiff(env, repo, oldTree, newTree, paths));
        }
    }

    // Only the files Git knows about: untracked files are not in a diff.
    function trackedWork(work, known) {
        const result = {};
        Object.keys(known).forEach(function (path) {
            if (Object.hasOwn(work, path)) {
                result[path] = work[path];
            }
        });
        return result;
    }

    function filterTree(tree, paths) {
        if (!paths) {
            return tree;
        }
        const result = {};
        Object.keys(tree).forEach(function (path) {
            if (paths.some(function (spec) { return G.inSpec(path, spec); })) {
                result[path] = tree[path];
            }
        });
        return result;
    }

    // [main 1a2b3c4] Add notes
    //  1 file changed, 2 insertions(+)
    //  create mode 100644 notes.txt
    function printCommitDone(env, repo, id, oldTree, extra) {
        const commit = G.commitOf(env.system, id);
        const branch = G.currentBranch(repo);
        const root = !commit.parents.length ? " (root-commit)" : "";
        env.out("[" + (branch || "detached HEAD") + root + " " + G.shortId(id) + "] " + G.subject(commit) + "\n");
        if (extra) {
            env.out(extra);
        }
        print(env, G.diffStat(env, oldTree, commit.tree, true).parts);
        Object.keys(commit.tree).sort().forEach(function (path) {
            if (!oldTree[path]) {
                env.out(" create mode 100644 " + path + "\n");
            }
        });
        Object.keys(oldTree).sort().forEach(function (path) {
            if (!commit.tree[path]) {
                env.out(" delete mode 100644 " + path + "\n");
            }
        });
    }

    function cmdCommit(args, env) {
        const repo = G.needRepo(env);
        const state = repo.state;
        const messages = [];
        let all = false;
        let amend = false;
        let noEdit = false;
        let allowEmpty = false;
        let author = null;
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            const message = takeValue(args, i, "-m", "--message");
            const who = takeValue(args, i, null, "--author");
            if (message) {
                messages.push(message.value);
                i = message.next;
            } else if (who) {
                const match = /^(.+?)\s*<(.+)>$/.exec(who.value);
                if (!match) {
                    throw G.fail("fatal: --author '" + who.value + "' is not 'Name <email>' and matches no existing author");
                }
                author = match[1] + " <" + match[2] + ">";
                i = who.next;
            } else if (arg === "-a" || arg === "--all") {
                all = true;
            } else if (/^-a+m$/.test(arg) || arg === "-am") {
                all = true;
                if (i + 1 >= args.length) {
                    throw G.fail("error: switch `m' requires a value");
                }
                messages.push(args[++i]);
            } else if (arg === "--amend") {
                amend = true;
            } else if (arg === "--no-edit") {
                noEdit = true;
            } else if (arg === "--allow-empty") {
                allowEmpty = true;
            } else if (arg === "-v" || arg === "-q") {
                // nothing to do here
            } else {
                throw G.fail("error: unknown option `" + arg.replace(/^-+/, "") + "'\nusage: " + USAGE.commit);
            }
        }
        const conflicts = (state.merge && state.merge.conflicts) || (state.cherryPick && state.cherryPick.conflicts) || (state.rebase && state.rebase.conflicts) || [];
        if (conflicts.length) {
            throw G.fail("error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use 'git add/rm <file>'\nhint: as appropriate to mark resolution and make a commit.\nfatal: Exiting because of an unresolved conflict.");
        }
        if (all) {
            const files = G.workingFiles(env, repo);
            Object.keys(state.index).forEach(function (path) {
                if (Object.hasOwn(files, path)) {
                    state.index[path] = G.storeBlob(env.system, files[path]);
                } else {
                    delete state.index[path];
                }
            });
        }
        const head = G.headId(repo);
        const headCommit = G.commitOf(env.system, head);
        if (amend && !headCommit) {
            throw G.fail("fatal: You have nothing to amend.");
        }
        let message = messages.join("\n\n");
        if (!message && amend && noEdit) {
            message = headCommit.message;
        } else if (!message && state.merge) {
            message = state.merge.message;
        } else if (!message && state.cherryPick) {
            message = G.commitOf(env.system, state.cherryPick.commit).message;
        }
        if (!message.trim()) {
            env.err("Aborting commit due to empty commit message.");
            env.note("(The playground has no editor. Give the message with -m: git commit -m \"Your message\")");
            return;
        }
        const parents = amend ? headCommit.parents : state.merge ? [head, state.merge.head] : [head];
        const parentTree = G.treeOf(env.system, parents[0]);
        const same = JSON.stringify(sortKeys(state.index)) === JSON.stringify(sortKeys(amend ? parentTree : G.treeOf(env.system, head)));
        if (same && !amend && !allowEmpty && !state.merge) {
            printStatus(env, repo, false);
            return;
        }
        // A continued cherry-pick keeps the original author.
        const original = state.cherryPick ? G.commitOf(env.system, state.cherryPick.commit).author : null;
        const id = G.makeCommit(env, repo, state.index, parents, message, author || original || (amend ? headCommit.author : null));
        const kind = amend ? "commit (amend)" : state.merge ? "commit (merge)" : !head ? "commit (initial)" : "commit";
        G.moveHead(repo, id, kind + ": " + message.split("\n")[0]);
        state.merge = null;
        printCommitDone(env, repo, id, parentTree, amend ? " Date: " + G.dateText(headCommit.date) + "\n" : "");
        // A cherry-pick of several commits goes on with the rest.
        if (state.cherryPick) {
            const remaining = state.cherryPick.remaining;
            const options = state.cherryPick.options;
            state.cherryPick = null;
            if (remaining.length) {
                pickAll(env, repo, remaining, options);
            }
        }
    }

    function sortKeys(tree) {
        const sorted = {};
        Object.keys(tree).sort().forEach(function (key) { sorted[key] = tree[key]; });
        return sorted;
    }

    // =========================================================================
    // log, show, reflog
    // =========================================================================

    function cmdLog(args, env) {
        const repo = G.needRepo(env);
        const options = { oneline: false, graph: false, all: false, stat: false, nameOnly: false, limit: Infinity, author: null, grep: null, format: null };
        const revisions = [];
        let paths = null;
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            const author = takeValue(args, i, null, "--author");
            const grep = takeValue(args, i, null, "--grep");
            const format = takeValue(args, i, null, "--pretty") || takeValue(args, i, null, "--format");
            const count = takeValue(args, i, "-n", "--max-count");
            if (paths) {
                paths.push(G.repoPath(env, repo, arg));
            } else if (arg === "--") {
                paths = [];
            } else if (/^-\d+$/.test(arg)) {
                options.limit = Number(arg.slice(1));
            } else if (count) {
                options.limit = Number(count.value);
                i = count.next;
            } else if (arg === "--oneline") {
                options.oneline = true;
            } else if (arg === "--graph") {
                options.graph = true;
            } else if (arg === "--all") {
                options.all = true;
            } else if (arg === "--stat") {
                options.stat = true;
            } else if (arg === "--name-only") {
                options.nameOnly = true;
            } else if (arg === "--decorate" || arg === "--no-merges" || arg === "--abbrev-commit") {
                options[arg === "--no-merges" ? "noMerges" : "ignored"] = true;
            } else if (author) {
                options.author = author.value;
                i = author.next;
            } else if (grep) {
                options.grep = grep.value;
                i = grep.next;
            } else if (format) {
                options.format = format.value.replace(/^(format|tformat):/, "");
                if (format.value === "oneline") {
                    options.oneline = true;
                    options.format = null;
                }
                i = format.next;
            } else if (arg.startsWith("-")) {
                throw G.fail("fatal: unrecognized argument: " + arg);
            } else if (arg.includes("..") || G.resolve(env, repo, arg)) {
                revisions.push(arg);
            } else if (Object.hasOwn(G.workingFiles(env, repo), G.repoPath(env, repo, arg)) || Object.hasOwn(repo.state.index, G.repoPath(env, repo, arg))) {
                paths = [G.repoPath(env, repo, arg)];
            } else {
                throw G.fail("fatal: ambiguous argument '" + arg + "': unknown revision or path not in the working tree.\nUse '--' to separate paths from revisions, like this:\n'git <command> [<revision>...] -- [<file>...]'");
            }
        }

        const head = G.headId(repo);
        if (!head && !options.all && !revisions.length) {
            throw G.fail("fatal: your current branch '" + (G.currentBranch(repo) || "HEAD") + "' does not have any commits yet");
        }
        // Where to start, and what to leave out (a..b leaves out a's history).
        let starts = [];
        let exclude = new Set();
        if (options.all) {
            starts = Object.values(repo.state.refs).map(function (id) { return G.peel(env.system, id); }).concat([head]);
        }
        revisions.forEach(function (revision) {
            if (revision.includes("..")) {
                const sides = revision.split(/\.\.\.?/);
                G.ancestors(env.system, G.needCommit(env, repo, sides[0] || "HEAD")).forEach(function (id) { exclude.add(id); });
                starts.push(G.needCommit(env, repo, sides[1] || "HEAD"));
            } else {
                starts.push(G.needCommit(env, repo, revision));
            }
        });
        if (!starts.length) {
            starts = [head];
        }
        const reachable = new Set();
        starts.filter(Boolean).forEach(function (id) {
            G.ancestors(env.system, id).forEach(function (a) {
                if (!exclude.has(a)) {
                    reachable.add(a);
                }
            });
        });
        let list = Array.from(reachable).sort(function (a, b) {
            return G.commitOf(env.system, b).date - G.commitOf(env.system, a).date || (a < b ? -1 : 1);
        });
        list = list.filter(function (id) {
            const commit = G.commitOf(env.system, id);
            if (options.author && !commit.author.includes(options.author)) {
                return false;
            }
            if (options.grep && !commit.message.includes(options.grep)) {
                return false;
            }
            if (options.noMerges && commit.parents.length > 1) {
                return false;
            }
            if (paths) {
                const before = G.treeOf(env.system, commit.parents[0]);
                return Object.keys(Object.assign({}, before, commit.tree)).some(function (path) {
                    return before[path] !== commit.tree[path] && paths.some(function (spec) { return G.inSpec(path, spec); });
                });
            }
            return true;
        }).slice(0, options.limit);

        const decor = decorations(env, repo);
        const graph = options.graph ? graphRows(env, list) : null;
        list.forEach(function (id, index) {
            const commit = G.commitOf(env.system, id);
            const lines = commitLines(env, repo, id, commit, decor, options);
            const prefix = graph ? graph[index] : null;
            if (prefix) {
                prefix.before.forEach(function (row) { env.out(row + "\n", "info"); });
            }
            lines.forEach(function (lineParts, lineIndex) {
                if (prefix) {
                    env.out((lineIndex === 0 ? prefix.commit : prefix.rest) + " ", "info");
                }
                print(env, lineParts);
                env.out("\n");
            });
            if (prefix) {
                prefix.after.forEach(function (row) { env.out(row + "\n", "info"); });
            }
        });
    }

    // One commit as lines of text parts, in the format log was asked for.
    function commitLines(env, repo, id, commit, decor, options) {
        const result = [];
        if (options.format !== null && options.format !== undefined) {
            result.push([{ text: formatCommit(env, id, commit, decor, options.format) }]);
            return result;
        }
        if (options.oneline) {
            result.push([{ text: G.shortId(id), cls: "info" }].concat(decorationParts(decor[id], true), [{ text: " " + G.subject(commit) }]));
        } else {
            result.push([{ text: "commit " + id, cls: "info" }].concat(decorationParts(decor[id], true)));
            if (commit.parents.length > 1) {
                result.push([{ text: "Merge: " + commit.parents.map(G.shortId).join(" ") }]);
            }
            result.push([{ text: "Author: " + commit.author }]);
            result.push([{ text: "Date:   " + G.dateText(commit.date) }]);
            result.push([{ text: "" }]);
            commit.message.replace(/\n$/, "").split("\n").forEach(function (line) {
                result.push([{ text: "    " + line }]);
            });
        }
        if (options.stat || options.nameOnly) {
            const before = G.treeOf(env.system, commit.parents[0]);
            if (!options.oneline) {
                result.push([{ text: "" }]);
            }
            if (options.nameOnly) {
                Object.keys(Object.assign({}, before, commit.tree)).sort().forEach(function (path) {
                    if (before[path] !== commit.tree[path]) {
                        result.push([{ text: path }]);
                    }
                });
            } else {
                const parts = G.diffStat(env, before, commit.tree).parts;
                let line = [];
                parts.forEach(function (part) {
                    const pieces = part.text.split("\n");
                    pieces.forEach(function (piece, i) {
                        if (piece) {
                            line.push({ text: piece, cls: part.cls });
                        }
                        if (i < pieces.length - 1) {
                            result.push(line);
                            line = [];
                        }
                    });
                });
            }
        }
        if (!options.oneline) {
            result.push([{ text: "" }]);
        }
        return result;
    }

    // --pretty=format:"%h %d %s (%an)". Colors like %C(red) are left out.
    function formatCommit(env, id, commit, decor, format) {
        const names = partsText(decorationParts(decor[id], false));
        const authorName = commit.author.replace(/\s*<.*$/, "");
        const authorEmail = (/<(.*)>/.exec(commit.author) || ["", ""])[1];
        return format
            .replace(/%C\([^)]*\)|%C(reset|red|green|blue|yellow)/g, "")
            .replace(/%(H|h|d|D|s|an|ae|ad|n|b|%)/g, function (match, key) {
                switch (key) {
                case "H": return id;
                case "h": return G.shortId(id);
                case "d": return names ? " (" + names + ")" : "";
                case "D": return names;
                case "s": return G.subject(commit);
                case "an": return authorName;
                case "ae": return authorEmail;
                case "ad": return G.dateText(commit.date);
                case "b": return commit.message.split("\n").slice(2).join("\n");
                case "n": return "\n";
                default: return "%";
                }
            });
    }

    // A simple version of git log --graph: one column per line of history.
    //   *   the commit             |\  a merge brings in a second parent
    //   |   a line going on        |/  a line joins one to its left
    function graphRows(env, list) {
        let columns = [];
        const rows = [];
        // Characters at even places are columns, odd places are between them.
        const draw = function (count, marks) {
            const chars = Array.from({ length: Math.max(0, count * 2 - 1) }, function (_, i) { return i % 2 === 0 ? "|" : " "; });
            Object.keys(marks).forEach(function (place) { chars[place] = marks[place]; });
            return chars.join("").replace(/\s+$/, "");
        };
        list.forEach(function (id) {
            let index = columns.indexOf(id);
            if (index === -1) {
                columns.push(id);
                index = columns.length - 1;
            }
            const marks = {};
            marks[index * 2] = "*";
            const commitRow = draw(columns.length, marks);
            const commit = G.commitOf(env.system, id);
            const after = [];
            if (!commit.parents.length) {
                columns.splice(index, 1);
            } else {
                columns[index] = commit.parents[0];
                commit.parents.slice(1).forEach(function (parent) {
                    if (!columns.includes(parent)) {
                        columns.splice(index + 1, 0, parent);
                        const split = {};
                        split[index * 2 + 1] = "\\";
                        split[index * 2 + 2] = " ";
                        after.push(draw(columns.length, split).replace(/ $/, ""));
                    }
                });
            }
            // A line whose next commit is already in a column to its left joins it.
            for (let k = columns.length - 1; k > 0; k--) {
                const target = columns.indexOf(columns[k]);
                if (target < k) {
                    const join = {};
                    join[k * 2] = " ";
                    join[k * 2 - 1] = "/";
                    // Further left than the next column: |_|/ like real Git.
                    for (let gap = target * 2 + 1; gap < k * 2 - 1; gap += 2) {
                        join[gap] = "_";
                    }
                    after.push(draw(columns.length, join));
                    columns.splice(k, 1);
                }
            }
            const merge = commit.parents.length > 1;
            rows.push({ before: [], commit: commitRow + (merge ? "  " : ""), rest: draw(columns.length + (after.length ? 0 : 0), {}).padEnd(commitRow.length), after: after });
        });
        return rows;
    }

    function cmdShow(args, env) {
        const repo = G.needRepo(env);
        const flags = args.filter(function (arg) { return arg.startsWith("-"); });
        const target = args.find(function (arg) { return !arg.startsWith("-"); }) || "HEAD";
        // git show HEAD:notes.txt prints the file as it was then.
        if (target.includes(":")) {
            const sides = target.split(":");
            const tree = G.treeOf(env.system, G.needCommit(env, repo, sides[0] || "HEAD"));
            if (!tree[sides[1]]) {
                throw G.fail("fatal: path '" + sides[1] + "' does not exist in '" + (sides[0] || "HEAD") + "'");
            }
            env.out(G.blobText(env.system, tree[sides[1]]));
            return;
        }
        let tagObject = null;
        if (Object.hasOwn(repo.state.refs, "refs/tags/" + target)) {
            const object = G.getObject(env.system, repo.state.refs["refs/tags/" + target]);
            if (object && object.type === "tag") {
                tagObject = object;
            }
        }
        const id = G.needCommit(env, repo, target);
        const commit = G.commitOf(env.system, id);
        if (tagObject) {
            env.out("tag " + tagObject.tag + "\n", "info");
            env.out("Tagger: " + tagObject.tagger + "\nDate:   " + G.dateText(tagObject.date) + "\n\n" + tagObject.message + "\n");
        }
        const decor = decorations(env, repo);
        commitLines(env, repo, id, commit, decor, { stat: flags.includes("--stat"), nameOnly: flags.includes("--name-only") }).forEach(function (line) {
            print(env, line);
            env.out("\n");
        });
        if (!flags.includes("--stat") && !flags.includes("--name-only") && commit.parents.length < 2) {
            print(env, G.treeDiff(env, repo, G.treeOf(env.system, commit.parents[0]), commit.tree));
        }
    }

    function cmdReflog(args, env) {
        const repo = G.needRepo(env);
        const decor = decorations(env, repo);
        repo.state.reflog.forEach(function (entry, i) {
            env.out(G.shortId(entry.id), "info");
            print(env, decorationParts(i === 0 ? decor[entry.id] : null, true));
            env.out(" HEAD@{" + i + "}: " + entry.message + "\n");
        });
    }

    // =========================================================================
    // branch, switch, checkout
    // =========================================================================

    function cmdBranch(args, env) {
        const repo = G.needRepo(env);
        const state = repo.state;
        const flags = args.filter(function (arg) { return arg.startsWith("-"); });
        const names = args.filter(function (arg) { return !arg.startsWith("-"); });
        const has = function (flag) { return flags.includes(flag); };
        const upstreamFlag = flags.find(function (f) { return f.startsWith("--set-upstream-to=") || f === "-u"; });

        if (upstreamFlag) {
            const target = upstreamFlag === "-u" ? names.shift() : upstreamFlag.slice(18);
            const branch = names[0] || G.currentBranch(repo);
            const match = /^([^/]+)\/(.+)$/.exec(target || "");
            if (!match || !Object.hasOwn(state.refs, "refs/remotes/" + target)) {
                throw G.fail("fatal: the requested upstream branch '" + target + "' does not exist");
            }
            G.setConfig(env, repo.gitPath + "/config", "branch." + branch + ".remote", match[1]);
            G.setConfig(env, repo.gitPath + "/config", "branch." + branch + ".merge", "refs/heads/" + match[2]);
            env.out("branch '" + branch + "' set up to track '" + target + "'.\n");
            return;
        }
        if (has("-m") || has("-M")) {
            const oldName = names.length > 1 ? names[0] : G.currentBranch(repo);
            const newName = names[names.length - 1];
            if (!newName) {
                throw G.fail("fatal: branch name required");
            }
            if (!branchExistsOrUnborn(repo, oldName)) {
                throw G.fail("error: refname refs/heads/" + oldName + " not found\nfatal: Branch rename failed");
            }
            if (!G.isValidRefName(newName)) {
                throw G.fail("fatal: '" + newName + "' is not a valid branch name");
            }
            if (G.branchExists(repo, newName) && !has("-M")) {
                throw G.fail("fatal: a branch named '" + newName + "' already exists");
            }
            if (Object.hasOwn(state.refs, "refs/heads/" + oldName)) {
                state.refs["refs/heads/" + newName] = state.refs["refs/heads/" + oldName];
                delete state.refs["refs/heads/" + oldName];
            }
            if (G.currentBranch(repo) === oldName) {
                G.setHead(env, repo, "ref: refs/heads/" + newName);
            }
            const path = repo.gitPath + "/config";
            const values = G.parseConfig(G.readFile(env, path));
            ["remote", "merge"].forEach(function (key) {
                if (values["branch." + oldName + "." + key]) {
                    G.setConfig(env, path, "branch." + newName + "." + key, values["branch." + oldName + "." + key]);
                    G.setConfig(env, path, "branch." + oldName + "." + key, undefined);
                }
            });
            return;
        }
        if (has("-d") || has("-D") || has("--delete")) {
            if (!names.length) {
                throw G.fail("fatal: branch name required");
            }
            names.forEach(function (name) {
                const ref = "refs/heads/" + name;
                if (!Object.hasOwn(state.refs, ref)) {
                    throw G.fail("error: branch '" + name + "' not found");
                }
                if (G.currentBranch(repo) === name) {
                    throw G.fail("error: cannot delete branch '" + name + "' used by worktree at '" + repo.root + "'");
                }
                const id = state.refs[ref];
                const upstream = upstreamOf(env, repo, name);
                const merged = G.isAncestor(env.system, id, G.headId(repo)) || (upstream && upstream.id && G.isAncestor(env.system, id, upstream.id));
                if (!merged && !has("-D")) {
                    throw G.fail("error: the branch '" + name + "' is not fully merged.\nIf you are sure you want to delete it, run 'git branch -D " + name + "'");
                }
                delete state.refs[ref];
                env.out("Deleted branch " + name + " (was " + G.shortId(id) + ").\n");
            });
            return;
        }
        if (names.length && !has("--list") && !has("-l")) {
            const name = names[0];
            if (!G.isValidRefName(name)) {
                throw G.fail("fatal: '" + name + "' is not a valid branch name");
            }
            if (G.branchExists(repo, name)) {
                throw G.fail("fatal: a branch named '" + name + "' already exists");
            }
            const start = names[1] || "HEAD";
            const id = G.resolve(env, repo, start);
            if (!id) {
                throw G.fail("fatal: not a valid object name: '" + (names[1] || G.currentBranch(repo) || "HEAD") + "'");
            }
            state.refs["refs/heads/" + name] = id;
            return;
        }

        // List the branches.
        const current = G.currentBranch(repo);
        const verbose = has("-v") || has("-vv");
        const listed = [];
        if (!G.headRef(repo) && G.headId(repo)) {
            listed.push({ name: "(HEAD detached at " + G.shortId(G.headId(repo)) + ")", id: G.headId(repo), current: true, cls: "err" });
        }
        Object.keys(state.refs).filter(function (ref) { return ref.startsWith("refs/heads/"); }).sort().forEach(function (ref) {
            listed.push({ name: ref.slice(11), id: state.refs[ref], current: ref.slice(11) === current, cls: ref.slice(11) === current ? "exe" : null });
        });
        if (has("-a") || has("-r")) {
            if (has("-r")) {
                listed.length = 0;
            }
            Object.keys(state.refs).filter(function (ref) { return ref.startsWith("refs/remotes/"); }).sort().forEach(function (ref) {
                listed.push({ name: (has("-r") ? "" : "remotes/") + ref.slice(13), id: state.refs[ref], current: false, cls: "err" });
            });
        }
        const width = Math.max(0, ...listed.map(function (item) { return item.name.length; }));
        listed.forEach(function (item) {
            env.out(item.current ? "* " : "  ");
            env.out(verbose ? item.name.padEnd(width) : item.name, item.cls);
            if (verbose) {
                const commit = G.commitOf(env.system, item.id);
                env.out(" " + G.shortId(item.id) + " " + (commit ? G.subject(commit) : ""));
            }
            env.out("\n");
        });
    }

    function branchExistsOrUnborn(repo, name) {
        return G.branchExists(repo, name) || (G.currentBranch(repo) === name && !G.headId(repo));
    }

    // Move HEAD to a branch or commit, carrying local changes along.
    function switchTo(env, repo, targetId, headValue, label) {
        const fromTree = G.treeOf(env.system, G.headId(repo));
        const toTree = G.treeOf(env.system, targetId);
        const problems = G.overwrittenBy(env, repo, fromTree, toTree);
        if (problems.changed.length || problems.untracked.length) {
            throw overwriteError(problems, "checkout");
        }
        const fromName = G.currentBranch(repo) || G.shortId(G.headId(repo));
        carry(env, repo, fromTree, toTree);
        if (G.currentBranch(repo)) {
            repo.state.previous = G.currentBranch(repo);
        }
        G.setHead(env, repo, headValue);
        G.logHead(repo, targetId, "checkout: moving from " + fromName + " to " + label);
    }

    function printSwitched(env, repo, name, created) {
        env.out((created ? "Switched to a new branch '" : "Switched to branch '") + name + "'\n");
        env.out(trackingText(env, repo, name));
    }

    // switch to a branch; a name that only exists on the remote makes a
    // local branch that follows it, like real Git does.
    function switchBranch(env, repo, name, newBranch, start) {
        if (newBranch) {
            if (!G.isValidRefName(name)) {
                throw G.fail("fatal: '" + name + "' is not a valid branch name");
            }
            if (G.branchExists(repo, name)) {
                throw G.fail("fatal: a branch named '" + name + "' already exists");
            }
            const id = start ? G.needCommit(env, repo, start) : G.headId(repo);
            if (!id) {
                // A new branch in a repository without commits: only HEAD moves.
                G.setHead(env, repo, "ref: refs/heads/" + name);
                env.out("Switched to a new branch '" + name + "'\n");
                return;
            }
            switchTo(env, repo, id, "ref: refs/heads/" + name, name);
            repo.state.refs["refs/heads/" + name] = id;
            if (start && /^[^/]+\//.test(start) && Object.hasOwn(repo.state.refs, "refs/remotes/" + start)) {
                setUpstream(env, repo, name, start.split("/")[0]);
                env.out("branch '" + name + "' set up to track '" + start + "'.\n");
            }
            printSwitched(env, repo, name, true);
            return;
        }
        if (G.currentBranch(repo) === name) {
            env.out("Already on '" + name + "'\n");
            env.out(trackingText(env, repo, name));
            return;
        }
        if (!G.branchExists(repo, name)) {
            const remoteRef = Object.keys(repo.state.refs).find(function (ref) { return /^refs\/remotes\/[^/]+\//.test(ref) && ref.replace(/^refs\/remotes\/[^/]+\//, "") === name; });
            if (!remoteRef) {
                throw G.fail("fatal: invalid reference: " + name);
            }
            const id = repo.state.refs[remoteRef];
            switchTo(env, repo, id, "ref: refs/heads/" + name, name);
            repo.state.refs["refs/heads/" + name] = id;
            setUpstream(env, repo, name, remoteRef.split("/")[2]);
            env.out("branch '" + name + "' set up to track '" + remoteRef.slice(13) + "'.\n");
            printSwitched(env, repo, name, true);
            return;
        }
        switchTo(env, repo, repo.state.refs["refs/heads/" + name], "ref: refs/heads/" + name, name);
        printSwitched(env, repo, name, false);
    }

    function detach(env, repo, revision) {
        const id = G.needCommit(env, repo, revision);
        switchTo(env, repo, id, id, revision);
        env.note("Note: switching to '" + revision + "'.\n\nYou are in 'detached HEAD' state. You can look around, make experimental\n" +
            "changes and commit them, and you can discard any commits you make in this\nstate without impacting any branches by switching back to a branch.\n\n" +
            "If you want to create a new branch to retain commits you create, you may\ndo so (now or later) by using -c with the switch command. Example:\n\n" +
            "  git switch -c <new-branch-name>\n\nOr undo this operation with:\n\n  git switch -\n");
        env.out("HEAD is now at " + G.shortId(id) + " " + G.subject(G.commitOf(env.system, id)) + "\n");
    }

    function cmdSwitch(args, env) {
        const repo = G.needRepo(env);
        const names = args.filter(function (arg) { return !arg.startsWith("-") || arg === "-"; });
        if (args.includes("-c") || args.includes("-C") || args.includes("--create")) {
            if (!names.length) {
                throw G.fail("fatal: missing branch name; try -c");
            }
            switchBranch(env, repo, names[0], true, names[1]);
        } else if (args.includes("--detach") || args.includes("-d")) {
            detach(env, repo, names[0] || "HEAD");
        } else if (names[0] === "-") {
            if (!repo.state.previous) {
                throw G.fail("fatal: invalid reference: @{-1}");
            }
            switchBranch(env, repo, repo.state.previous, false);
        } else if (names.length) {
            if (!G.branchExists(repo, names[0]) && G.resolve(env, repo, names[0]) && !Object.keys(repo.state.refs).some(function (ref) { return ref.startsWith("refs/remotes/") && ref.endsWith("/" + names[0]); })) {
                throw G.fail("fatal: a branch is expected, got '" + names[0] + "'\nhint: If you want to detach HEAD at the commit, try again with the --detach option.");
            }
            switchBranch(env, repo, names[0], false);
        } else {
            throw G.fail("fatal: missing branch or commit argument\nusage: " + USAGE.switch);
        }
    }

    function cmdCheckout(args, env) {
        const repo = G.needRepo(env);
        const dash = args.indexOf("--");
        if (dash !== -1) {
            const source = dash > 0 ? args[0] : null;
            restoreFiles(env, repo, args.slice(dash + 1), source);
            return;
        }
        if (args[0] === "-b" || args[0] === "-B") {
            if (!args[1]) {
                throw G.fail("error: switch `b' requires a value");
            }
            switchBranch(env, repo, args[1], true, args[2]);
            return;
        }
        const target = args.find(function (arg) { return !arg.startsWith("-") || arg === "-"; });
        if (!target) {
            throw G.fail("usage: " + USAGE.checkout);
        }
        if (target === "-") {
            return cmdSwitch(["-"], env);
        }
        const isRemoteName = Object.keys(repo.state.refs).some(function (ref) { return ref.startsWith("refs/remotes/") && ref.endsWith("/" + target); });
        if (G.branchExists(repo, target) || (isRemoteName && !G.resolve(env, repo, target))) {
            switchBranch(env, repo, target, false);
        } else if (G.resolve(env, repo, target)) {
            detach(env, repo, target);
        } else {
            restoreFiles(env, repo, args.filter(function (arg) { return !arg.startsWith("-"); }), null);
        }
    }

    // git checkout -- file: the file as it is in the index (or in a commit).
    function restoreFiles(env, repo, paths, source) {
        const tree = source ? G.treeOf(env.system, G.needCommit(env, repo, source)) : repo.state.index;
        paths.forEach(function (path) {
            const spec = G.repoPath(env, repo, path);
            const matching = Object.keys(tree).filter(function (p) { return G.inSpec(p, spec); });
            if (!matching.length) {
                throw G.fail("error: pathspec '" + path + "' did not match any file(s) known to git");
            }
            matching.forEach(function (p) {
                G.writeWorkFile(env, repo, p, G.blobText(env.system, tree[p]));
                if (source) {
                    repo.state.index[p] = tree[p];
                }
            });
        });
    }

    // =========================================================================
    // merge, cherry-pick, rebase
    // =========================================================================

    // Write a merge result with conflicts: clean files are staged, files with
    // conflicts get their <<<<<<< markers. Returns the paths it changed.
    function writeConflicted(env, repo, headTree, result) {
        const touched = [];
        Object.keys(Object.assign({}, headTree, result.tree)).forEach(function (path) {
            if (result.conflicts.includes(path)) {
                G.writeWorkFile(env, repo, path, result.contents[path]);
                touched.push(path);
            } else if (result.tree[path] !== headTree[path]) {
                if (result.tree[path]) {
                    G.writeWorkFile(env, repo, path, G.blobText(env.system, result.tree[path]));
                    repo.state.index[path] = result.tree[path];
                } else {
                    G.deleteWorkFile(env, repo, path);
                    delete repo.state.index[path];
                }
                touched.push(path);
            }
        });
        return touched;
    }

    // --abort: put back the files the merge changed, and HEAD where it was.
    // Other local changes stay, like git merge --abort does.
    function abortTo(env, repo, origHead, touched) {
        const headTree = G.treeOf(env.system, G.headId(repo));
        touched.forEach(function (path) {
            if (headTree[path]) {
                G.writeWorkFile(env, repo, path, G.blobText(env.system, headTree[path]));
                repo.state.index[path] = headTree[path];
            } else {
                G.deleteWorkFile(env, repo, path);
                delete repo.state.index[path];
            }
        });
        if (G.headId(repo) !== origHead) {
            carry(env, repo, headTree, G.treeOf(env.system, origHead));
            G.moveHead(repo, origHead, "reset: moving to " + G.shortId(origHead));
        }
    }

    // Merge theirs into HEAD. Prints what happened, returns false on conflict.
    function mergeInto(env, repo, theirs, label, options) {
        const system = env.system;
        const head = G.headId(repo);
        if (G.isAncestor(system, theirs, head)) {
            env.out("Already up to date.\n");
            return true;
        }
        const headTree = G.treeOf(system, head);
        if (G.isAncestor(system, head, theirs) && !options.noFF) {
            const problems = G.overwrittenBy(env, repo, headTree, G.treeOf(system, theirs));
            if (problems.changed.length || problems.untracked.length) {
                throw overwriteError(problems, "merge");
            }
            env.out("Updating " + G.shortId(head) + ".." + G.shortId(theirs) + "\nFast-forward\n");
            carry(env, repo, headTree, G.treeOf(system, theirs));
            G.moveHead(repo, theirs, options.reflog + ": Fast-forward");
            print(env, G.diffStat(env, headTree, G.treeOf(system, theirs)).parts);
            return true;
        }
        if (options.ffOnly) {
            throw G.fail("fatal: Not possible to fast-forward, aborting.");
        }
        const base = G.mergeBase(system, head, theirs);
        const result = G.mergeTrees(env, G.treeOf(system, base), headTree, G.treeOf(system, theirs), label);
        const problems = G.overwrittenBy(env, repo, headTree, result.tree);
        if (problems.changed.length || problems.untracked.length) {
            throw overwriteError(problems, "merge");
        }
        const theirsTree = G.treeOf(system, theirs);
        const baseTree = G.treeOf(system, base);
        Object.keys(result.tree).forEach(function (path) {
            if (headTree[path] !== baseTree[path] && theirsTree[path] !== baseTree[path] && headTree[path] !== theirsTree[path]) {
                env.out("Auto-merging " + path + "\n");
            }
        });
        if (result.conflicts.length) {
            // Write the files, and leave the conflicts for the user to fix.
            const touched = writeConflicted(env, repo, headTree, result);
            result.conflicts.forEach(function (path) {
                env.out("CONFLICT (content): Merge conflict in " + path + "\n");
            });
            repo.state.merge = { head: theirs, message: options.message, conflicts: result.conflicts.slice(), touched: touched, origHead: head };
            repo.state.origHead = head;
            if (options.conflictText !== false) {
                env.out("Automatic merge failed; fix conflicts and then commit the result.\n");
            }
            return false;
        }
        carry(env, repo, headTree, result.tree);
        const id = G.makeCommit(env, repo, result.tree, [head, theirs], options.message);
        G.moveHead(repo, id, options.reflog + ": Merge made by the 'ort' strategy.");
        env.out("Merge made by the 'ort' strategy.\n");
        print(env, G.diffStat(env, headTree, result.tree).parts);
        return true;
    }

    function cmdMerge(args, env) {
        const repo = G.needRepo(env);
        const state = repo.state;
        if (args.includes("--abort")) {
            if (!state.merge) {
                throw G.fail("fatal: There is no merge to abort (MERGE_HEAD missing).");
            }
            abortTo(env, repo, state.merge.origHead || G.headId(repo), state.merge.touched || []);
            state.merge = null;
            return;
        }
        if (args.includes("--continue")) {
            if (!state.merge) {
                throw G.fail("fatal: There is no merge in progress (MERGE_HEAD missing).");
            }
            return cmdCommit([], env);
        }
        if (state.merge) {
            throw G.fail("error: Merging is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use 'git add/rm <file>'\nhint: as appropriate to mark resolution and make a commit.\nfatal: Exiting because of an unresolved conflict.");
        }
        let message = null;
        const names = [];
        for (let i = 0; i < args.length; i++) {
            const value = takeValue(args, i, "-m", "--message");
            if (value) {
                message = value.value;
                i = value.next;
            } else if (!args[i].startsWith("-")) {
                names.push(args[i]);
            }
        }
        if (!names.length) {
            throw G.fail("fatal: No remote for the current branch.");
        }
        const name = names[0];
        const theirs = G.resolve(env, repo, name);
        if (!theirs) {
            throw G.fail("merge: " + name + " - not something we can merge");
        }
        if (!G.headId(repo)) {
            throw G.fail("fatal: Can merge only exactly one commit into empty head");
        }
        const current = G.currentBranch(repo);
        const isRemote = Object.hasOwn(state.refs, "refs/remotes/" + name);
        const into = current && !["main", "master"].includes(current) ? " into " + current : "";
        mergeInto(env, repo, theirs, name, {
            noFF: args.includes("--no-ff"),
            ffOnly: args.includes("--ff-only"),
            message: message || (isRemote ? "Merge remote-tracking branch '" + name + "'" : "Merge branch '" + name + "'") + into,
            reflog: "merge " + name
        });
    }

    // Apply one commit's change on top of HEAD (for cherry-pick and rebase).
    function pickOne(env, repo, id, options) {
        const system = env.system;
        const commit = G.commitOf(system, id);
        if (commit.parents.length > 1) {
            throw G.fail("error: commit " + id + " is a merge but no -m option was given.\nfatal: cherry-pick failed");
        }
        const head = G.headId(repo);
        const headTree = G.treeOf(system, head);
        const label = G.shortId(id) + " (" + G.subject(commit) + ")";
        const result = G.mergeTrees(env, G.treeOf(system, commit.parents[0]), headTree, commit.tree, label);
        const problems = G.overwrittenBy(env, repo, headTree, result.tree);
        if (problems.changed.length || problems.untracked.length) {
            throw G.fail("error: your local changes would be overwritten by " + options.verb + ".\nhint: commit your changes or stash them to proceed.\nfatal: " + options.verb + " failed");
        }
        if (result.conflicts.length) {
            const touched = writeConflicted(env, repo, headTree, result);
            result.conflicts.forEach(function (path) {
                env.out("Auto-merging " + path + "\n");
                env.out("CONFLICT (content): Merge conflict in " + path + "\n");
            });
            return { conflicts: result.conflicts, touched: touched };
        }
        if (JSON.stringify(sortKeys(result.tree)) === JSON.stringify(sortKeys(headTree))) {
            return { empty: true };
        }
        carry(env, repo, headTree, result.tree);
        const message = commit.message.replace(/\n$/, "") + (options.x ? "\n\n(cherry picked from commit " + id + ")" : "");
        const newId = G.makeCommit(env, repo, result.tree, [head], message, commit.author);
        G.moveHead(repo, newId, options.reflog + ": " + G.subject(commit));
        return { id: newId, oldTree: headTree };
    }

    // cherry-pick the commits in ids, one at a time; stop at a conflict.
    function pickAll(env, repo, ids, options) {
        for (let i = 0; i < ids.length; i++) {
            const result = pickOne(env, repo, ids[i], { verb: "cherry-pick", x: options.x, reflog: "cherry-pick" });
            const commit = G.commitOf(env.system, ids[i]);
            if (result.conflicts) {
                repo.state.cherryPick = { commit: ids[i], remaining: ids.slice(i + 1), conflicts: result.conflicts, touched: result.touched, options: options, origHead: options.origHead };
                env.err("error: could not apply " + G.shortId(ids[i]) + "... " + G.subject(commit));
                env.note("hint: After resolving the conflicts, mark them with\nhint: \"git add/rm <pathspec>\", then run\nhint: \"git cherry-pick --continue\".\n" +
                    "hint: You can instead skip this commit with \"git cherry-pick --skip\".\nhint: To abort and get back to the state before \"git cherry-pick\",\nhint: run \"git cherry-pick --abort\".");
                return false;
            }
            if (result.empty) {
                env.out("On branch " + (G.currentBranch(repo) || "HEAD") + "\nYou are currently cherry-picking commit " + G.shortId(ids[i]) + ".\n\nnothing to commit, working tree clean\n");
                env.err("The previous cherry-pick is now empty, possibly due to conflict resolution.");
                return false;
            }
            printCommitDone(env, repo, result.id, result.oldTree, " Date: " + G.dateText(commit.date) + "\n");
        }
        return true;
    }

    function cmdCherryPick(args, env) {
        const repo = G.needRepo(env);
        const state = repo.state;
        if (args.includes("--abort")) {
            if (!state.cherryPick) {
                throw G.fail("error: no cherry-pick or revert in progress\nfatal: cherry-pick failed");
            }
            abortTo(env, repo, state.cherryPick.origHead, state.cherryPick.touched || []);
            state.cherryPick = null;
            return;
        }
        if (args.includes("--continue") || args.includes("--skip")) {
            if (!state.cherryPick) {
                throw G.fail("error: no cherry-pick or revert in progress\nfatal: cherry-pick failed");
            }
            if (args.includes("--skip")) {
                abortTo(env, repo, G.headId(repo), state.cherryPick.touched || []);
                const pick = state.cherryPick;
                state.cherryPick = null;
                if (pick.remaining.length) {
                    pickAll(env, repo, pick.remaining, pick.options);
                }
                return;
            }
            return cmdCommit([], env);
        }
        if (state.cherryPick || state.merge) {
            throw G.fail("error: cherry-pick is already in progress\nhint: try \"git cherry-pick (--continue | --abort | --quit)\"\nfatal: cherry-pick failed");
        }
        const x = args.includes("-x");
        const names = args.filter(function (arg) { return !arg.startsWith("-"); });
        if (!names.length) {
            throw G.fail("usage: " + USAGE["cherry-pick"]);
        }
        const ids = names.map(function (name) {
            const id = G.resolve(env, repo, name);
            if (!id) {
                throw G.fail("fatal: bad revision '" + name + "'");
            }
            return id;
        });
        pickAll(env, repo, ids, { x: x, origHead: G.headId(repo) });
    }

    function cmdRebase(args, env) {
        const repo = G.needRepo(env);
        const state = repo.state;
        if (args.includes("-i") || args.includes("--interactive")) {
            throw G.fail("error: the playground has no editor, so interactive rebase (-i) is not supported.\nhint: git rebase <branch> works, and git commit --amend changes the last commit.");
        }
        if (args.includes("--abort")) {
            if (!state.rebase) {
                throw G.fail("fatal: No rebase in progress?");
            }
            const rebase = state.rebase;
            state.rebase = null;
            state.refs["refs/heads/" + rebase.branch] = rebase.origHead;
            hardReset(env, repo, rebase.origHead, true);
            G.setHead(env, repo, "ref: refs/heads/" + rebase.branch);
            return;
        }
        if (args.includes("--continue") || args.includes("--skip")) {
            if (!state.rebase) {
                throw G.fail("fatal: No rebase in progress?");
            }
            const rebase = state.rebase;
            if (args.includes("--skip")) {
                hardReset(env, repo, G.headId(repo), true);
            } else {
                if (rebase.conflicts.length) {
                    throw G.fail("error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use 'git add/rm <file>'\nhint: as appropriate to mark resolution and make a commit.\nfatal: Exiting because of an unresolved conflict.");
                }
                const commit = G.commitOf(env.system, rebase.current);
                const headTree = G.treeOf(env.system, G.headId(repo));
                if (JSON.stringify(sortKeys(state.index)) !== JSON.stringify(sortKeys(headTree))) {
                    const id = G.makeCommit(env, repo, state.index, [G.headId(repo)], commit.message, commit.author);
                    G.moveHead(repo, id, "rebase (continue): " + G.subject(commit));
                    printCommitDone(env, repo, id, headTree);
                }
            }
            return replay(env, repo, rebase.remaining);
        }
        if (state.rebase || state.merge || state.cherryPick) {
            throw G.fail("fatal: It seems that there is already a rebase-merge directory, and\nI wonder if you are in the middle of another rebase.");
        }
        const upstreamName = args.find(function (arg) { return !arg.startsWith("-"); }) ||
            (upstreamOf(env, repo, G.currentBranch(repo) || "") || {}).name;
        if (!upstreamName) {
            throw G.fail("There is no tracking information for the current branch.\nPlease specify which branch you want to rebase against.");
        }
        const branch = G.currentBranch(repo);
        if (!branch) {
            throw G.fail("fatal: the playground can only rebase a branch, not a detached HEAD");
        }
        const onto = G.resolve(env, repo, upstreamName);
        if (!onto) {
            throw G.fail("fatal: invalid upstream '" + upstreamName + "'");
        }
        const s = G.status(env, repo);
        if (s.staged.length || s.unstaged.length) {
            throw G.fail("error: cannot rebase: You have " + (s.unstaged.length ? "unstaged" : "uncommitted") + " changes.\nerror: Please commit or stash them.");
        }
        const head = G.headId(repo);
        if (G.isAncestor(env.system, onto, head)) {
            env.out("Current branch " + branch + " is up to date.\n");
            return;
        }
        const todo = G.commitsBetween(env.system, onto, head).filter(function (id) { return G.commitOf(env.system, id).parents.length < 2; });
        // Start from upstream, with HEAD detached, then apply each commit.
        state.rebase = { branch: branch, onto: onto, origHead: head, remaining: [], current: null, conflicts: [] };
        const fromTree = G.treeOf(env.system, head);
        carry(env, repo, fromTree, G.treeOf(env.system, onto));
        G.setHead(env, repo, onto);
        G.logHead(repo, onto, "rebase (start): checkout " + upstreamName);
        replay(env, repo, todo);
    }

    function replay(env, repo, todo) {
        const rebase = repo.state.rebase;
        for (let i = 0; i < todo.length; i++) {
            const result = pickOne(env, repo, todo[i], { verb: "rebase", reflog: "rebase (pick)" });
            if (result.conflicts) {
                rebase.current = todo[i];
                rebase.remaining = todo.slice(i + 1);
                rebase.conflicts = result.conflicts;
                const subject = G.subject(G.commitOf(env.system, todo[i]));
                env.err("error: could not apply " + G.shortId(todo[i]) + "... " + subject);
                env.note("hint: Resolve all conflicts manually, mark them as resolved with\nhint: \"git add/rm <conflicted_files>\", then run \"git rebase --continue\".\n" +
                    "hint: You can instead skip this commit: run \"git rebase --skip\".\nhint: To abort and get back to the state before \"git rebase\", run \"git rebase --abort\".");
                env.out("Could not apply " + G.shortId(todo[i]) + "... " + subject + "\n");
                return;
            }
        }
        // Done: the branch now points at the new commits.
        const id = G.headId(repo);
        repo.state.refs["refs/heads/" + rebase.branch] = id;
        G.setHead(env, repo, "ref: refs/heads/" + rebase.branch);
        G.logHead(repo, id, "rebase (finish): returning to refs/heads/" + rebase.branch);
        repo.state.rebase = null;
        env.out("Successfully rebased and updated refs/heads/" + rebase.branch + ".\n");
    }

    // =========================================================================
    // reset and stash
    // =========================================================================

    // Index and working tree exactly like a commit (files Git doesn't track stay).
    function hardReset(env, repo, id, keepHead) {
        const from = Object.assign({}, G.treeOf(env.system, G.headId(repo)), repo.state.index);
        G.checkoutTree(env, repo, from, G.treeOf(env.system, id));
        if (!keepHead && G.headId(repo) !== id) {
            G.moveHead(repo, id, "reset: moving to " + G.shortId(id));
        }
        repo.state.merge = null;
    }

    function cmdReset(args, env) {
        const repo = G.needRepo(env);
        let mode = "mixed";
        const rest = [];
        let paths = null;
        args.forEach(function (arg) {
            if (paths) {
                paths.push(arg);
            } else if (arg === "--") {
                paths = [];
            } else if (["--soft", "--mixed", "--hard"].includes(arg)) {
                mode = arg.slice(2);
            } else if (arg.startsWith("-")) {
                throw G.fail("error: unknown option `" + arg.replace(/^-+/, "") + "'\nusage: " + USAGE.reset);
            } else {
                rest.push(arg);
            }
        });
        // git reset file: take the file out of the staging area.
        if (!paths && rest.length && !G.resolve(env, repo, rest[0])) {
            paths = rest.splice(0);
        } else if (!paths && rest.length > 1) {
            paths = rest.splice(1);
        }
        const target = rest[0] || "HEAD";
        const id = G.headId(repo) || target !== "HEAD" ? G.needCommit(env, repo, target) : null;
        if (paths) {
            const tree = G.treeOf(env.system, id);
            paths.forEach(function (path) {
                const spec = G.repoPath(env, repo, path);
                Object.keys(Object.assign({}, repo.state.index, tree)).forEach(function (p) {
                    if (G.inSpec(p, spec)) {
                        if (tree[p]) {
                            repo.state.index[p] = tree[p];
                        } else {
                            delete repo.state.index[p];
                        }
                    }
                });
            });
            return printUnstaged(env, repo);
        }
        repo.state.origHead = G.headId(repo);
        if (mode === "hard") {
            hardReset(env, repo, id, true);
            G.moveHead(repo, id, "reset: moving to " + target);
            env.out("HEAD is now at " + G.shortId(id) + " " + G.subject(G.commitOf(env.system, id)) + "\n");
            return;
        }
        G.moveHead(repo, id, "reset: moving to " + target);
        repo.state.merge = null;
        if (mode === "mixed") {
            repo.state.index = Object.assign({}, G.treeOf(env.system, id));
            printUnstaged(env, repo);
        }
    }

    function printUnstaged(env, repo) {
        const s = G.status(env, repo);
        if (s.unstaged.length) {
            env.out("Unstaged changes after reset:\n");
            s.unstaged.forEach(function (item) { env.out((item.kind === "deleted" ? "D" : "M") + "\t" + G.showPath(env, repo, item.path) + "\n"); });
        }
    }

    function stashIndex(repo, text) {
        const match = /^(?:stash@\{(\d+)\}|(\d+))$/.exec(text || "stash@{0}");
        const index = match ? Number(match[1] !== undefined ? match[1] : match[2]) : -1;
        if (index < 0 || index >= repo.state.stash.length) {
            throw G.fail(repo.state.stash.length ? "error: " + text + " is not a valid reference" : "No stash entries found.");
        }
        return index;
    }

    function cmdStash(args, env) {
        const repo = G.needRepo(env);
        const state = repo.state;
        const sub = ["push", "save", "list", "pop", "apply", "drop", "show", "clear"].includes(args[0]) ? args[0] : "push";
        const rest = sub === "push" && args[0] !== "push" ? args : args.slice(1);
        const head = G.headId(repo);

        if (sub === "list") {
            state.stash.forEach(function (entry, i) { env.out("stash@{" + i + "}: " + entry.message + "\n"); });
            return;
        }
        if (sub === "clear") {
            state.stash = [];
            return;
        }
        if (sub === "push" || sub === "save") {
            if (!head) {
                throw G.fail("You do not have the initial commit yet");
            }
            let message = null;
            let untracked = false;
            for (let i = 0; i < rest.length; i++) {
                const value = takeValue(rest, i, "-m", "--message");
                if (value) {
                    message = value.value;
                    i = value.next;
                } else if (rest[i] === "-u" || rest[i] === "--include-untracked") {
                    untracked = true;
                } else if (sub === "save" && !rest[i].startsWith("-")) {
                    message = rest.slice(i).join(" ");
                    break;
                }
            }
            const s = G.status(env, repo);
            if (!s.staged.length && !s.unstaged.length && !(untracked && s.untracked.length)) {
                env.out("No local changes to save\n");
                return;
            }
            // Keep every changed file as it is now, then go back to HEAD.
            const work = {};
            const changed = new Set(s.staged.concat(s.unstaged).map(function (item) { return item.path; }));
            changed.forEach(function (path) { work[path] = s.work[path] || null; });
            if (untracked) {
                s.untracked.forEach(function (path) { work[path] = s.work[path]; });
            }
            const commit = G.commitOf(env.system, head);
            const branch = G.currentBranch(repo) || "(no branch)";
            const description = message ? "On " + branch + ": " + message : "WIP on " + branch + ": " + G.shortId(head) + " " + G.subject(commit);
            const entry = { base: head, index: Object.assign({}, state.index), work: work, untracked: untracked ? s.untracked.slice() : [], message: description };
            entry.id = G.storeObject(env.system, { type: "stash", entry: entry, date: G.nowSeconds() });
            state.stash.unshift(entry);
            hardReset(env, repo, head, true);
            entry.untracked.forEach(function (path) { G.deleteWorkFile(env, repo, path); });
            env.out("Saved working directory and index state " + description + "\n");
            return;
        }
        const ref = rest.find(function (arg) { return !arg.startsWith("-"); });
        const index = stashIndex(repo, ref);
        const entry = state.stash[index];
        if (sub === "show") {
            const baseTree = G.treeOf(env.system, entry.base);
            const after = Object.assign({}, baseTree);
            Object.keys(entry.work).forEach(function (path) {
                if (entry.untracked.includes(path)) {
                    return;
                }
                if (entry.work[path]) {
                    after[path] = entry.work[path];
                } else {
                    delete after[path];
                }
            });
            print(env, rest.includes("-p") || rest.includes("--patch") ? G.treeDiff(env, repo, baseTree, after) : G.diffStat(env, baseTree, after).parts);
            return;
        }
        if (sub === "apply" || sub === "pop") {
            const s = G.status(env, repo);
            const touched = new Set(s.staged.concat(s.unstaged).map(function (item) { return item.path; }));
            const clash = Object.keys(entry.work).filter(function (path) {
                return touched.has(path) || (entry.untracked.includes(path) && Object.hasOwn(s.work, path));
            });
            if (clash.length) {
                throw G.fail("error: Your local changes to the following files would be overwritten by merge:\n" +
                    clash.map(function (path) { return "\t" + path + "\n"; }).join("") + "Please commit your changes or stash them before you merge.\nAborting");
            }
            // Put the stashed changes on top of what the files are now. If a file
            // changed since (like after git pull), both changes are kept.
            const baseTree = G.treeOf(env.system, entry.base);
            const conflicts = [];
            Object.keys(entry.work).forEach(function (path) {
                if (!entry.work[path]) {
                    G.deleteWorkFile(env, repo, path);
                    delete state.index[path];
                    return;
                }
                const stashed = G.blobText(env.system, entry.work[path]);
                const now = s.work[path] ? G.blobText(env.system, s.work[path]) : null;
                const base = baseTree[path] ? G.blobText(env.system, baseTree[path]) : null;
                if (now === null || now === base || entry.untracked.includes(path)) {
                    G.writeWorkFile(env, repo, path, stashed);
                    return;
                }
                const merged = G.mergeText(base, now, stashed, "Stashed changes");
                G.writeWorkFile(env, repo, path, merged.text.replace("<<<<<<< HEAD", "<<<<<<< Updated upstream"));
                env.out("Auto-merging " + path + "\n");
                if (!merged.clean) {
                    env.out("CONFLICT (content): Merge conflict in " + path + "\n");
                    conflicts.push(path);
                }
            });
            if (conflicts.length) {
                env.out("The stash entry is kept in case you need it again.\n");
                return;
            }
            printStatus(env, repo, false);
        }
        if (sub === "pop" || sub === "drop") {
            state.stash.splice(index, 1);
            env.out("Dropped " + (ref || "refs/stash@{0}").replace(/^(\d+)$/, "stash@{$1}") + " (" + entry.id + ")\n");
        }
    }

    // =========================================================================
    // tag
    // =========================================================================

    function cmdTag(args, env) {
        const repo = G.needRepo(env);
        const state = repo.state;
        let message = null;
        let annotate = false;
        let remove = false;
        let list = false;
        const names = [];
        for (let i = 0; i < args.length; i++) {
            const value = takeValue(args, i, "-m", "--message");
            if (value) {
                message = value.value;
                annotate = true;
                i = value.next;
            } else if (args[i] === "-a" || args[i] === "--annotate") {
                annotate = true;
            } else if (args[i] === "-d" || args[i] === "--delete") {
                remove = true;
            } else if (args[i] === "-l" || args[i] === "--list") {
                list = true;
            } else if (args[i].startsWith("-")) {
                throw G.fail("error: unknown option `" + args[i].replace(/^-+/, "") + "'\nusage: " + USAGE.tag);
            } else {
                names.push(args[i]);
            }
        }
        if (remove) {
            names.forEach(function (name) {
                const ref = "refs/tags/" + name;
                if (!Object.hasOwn(state.refs, ref)) {
                    throw G.fail("error: tag '" + name + "' not found.");
                }
                env.out("Deleted tag '" + name + "' (was " + G.shortId(state.refs[ref]) + ")\n");
                delete state.refs[ref];
            });
            return;
        }
        if (list || !names.length) {
            const pattern = names[0] ? new RegExp("^" + names[0].split("*").map(function (p) { return p.replace(/[.+?^${}()|[\]\\]/g, "\\$&"); }).join(".*") + "$") : null;
            Object.keys(state.refs).filter(function (ref) { return ref.startsWith("refs/tags/"); }).map(function (ref) { return ref.slice(10); }).sort().forEach(function (name) {
                if (!pattern || pattern.test(name)) {
                    env.out(name + "\n");
                }
            });
            return;
        }
        const name = names[0];
        if (!G.isValidRefName(name)) {
            throw G.fail("fatal: '" + name + "' is not a valid tag name.");
        }
        if (Object.hasOwn(state.refs, "refs/tags/" + name)) {
            throw G.fail("fatal: tag '" + name + "' already exists");
        }
        const id = G.needCommit(env, repo, names[1] || "HEAD");
        if (annotate && !message) {
            throw G.fail("error: the playground has no editor, give the message with -m: git tag -a " + name + " -m \"message\"");
        }
        if (!annotate) {
            state.refs["refs/tags/" + name] = id;
            return;
        }
        const date = G.nowSeconds();
        state.refs["refs/tags/" + name] = G.storeObject(env.system, {
            type: "tag", object: id, tag: name, tagger: G.identity(env, repo), date: date, timezone: G.timezone(date), message: message + "\n"
        });
    }

    // =========================================================================
    // remote, fetch, pull, push, clone
    // =========================================================================

    function cmdRemote(args, env) {
        const repo = G.needRepo(env);
        const path = repo.gitPath + "/config";
        const sub = args[0];
        if (!sub || sub === "-v" || sub === "--verbose") {
            remoteNames(env, repo).forEach(function (name) {
                if (sub) {
                    const url = remoteUrl(env, repo, name);
                    env.out(name + "\t" + url + " (fetch)\n" + name + "\t" + url + " (push)\n");
                } else {
                    env.out(name + "\n");
                }
            });
            return;
        }
        const name = args[1];
        if (sub === "add") {
            if (!name || !args[2]) {
                throw G.fail("usage: git remote add <name> <url>");
            }
            if (remoteUrl(env, repo, name)) {
                throw G.fail("error: remote " + name + " already exists.");
            }
            G.setConfig(env, path, "remote." + name + ".url", args[2]);
            G.setConfig(env, path, "remote." + name + ".fetch", "+refs/heads/*:refs/remotes/" + name + "/*");
            return;
        }
        if (sub === "set-url") {
            if (!remoteUrl(env, repo, name)) {
                throw G.fail("error: No such remote '" + name + "'");
            }
            G.setConfig(env, path, "remote." + name + ".url", args[2]);
            return;
        }
        if (sub === "remove" || sub === "rm") {
            if (!remoteUrl(env, repo, name)) {
                throw G.fail("error: No such remote: '" + name + "'");
            }
            G.setConfig(env, path, "remote." + name + ".url", undefined);
            G.setConfig(env, path, "remote." + name + ".fetch", undefined);
            Object.keys(repo.state.refs).forEach(function (ref) {
                if (ref.startsWith("refs/remotes/" + name + "/")) {
                    delete repo.state.refs[ref];
                }
            });
            return;
        }
        if (sub === "show" || sub === "get-url") {
            if (!remoteUrl(env, repo, name)) {
                throw G.fail("error: No such remote '" + name + "'");
            }
            env.out(sub === "get-url" ? remoteUrl(env, repo, name) + "\n" : "* remote " + name + "\n  Fetch URL: " + remoteUrl(env, repo, name) + "\n  Push  URL: " + remoteUrl(env, repo, name) + "\n");
            return;
        }
        throw G.fail("error: unknown subcommand: `" + sub + "'\nusage: " + USAGE.remote);
    }

    function noRemoteError(name) {
        return G.fail("fatal: '" + name + "' does not appear to be a git repository\nfatal: Could not read from remote repository.\n\nPlease make sure you have the correct access rights\nand the repository exists.");
    }

    function serverFor(env, url, create) {
        const found = G.server(env.system, url, create);
        if (!found) {
            if (/^https?:/.test(url)) {
                throw G.fail("remote: Repository not found.\nfatal: repository '" + url + "/' not found");
            }
            throw G.fail("ERROR: Repository not found.\nfatal: Could not read from remote repository.\n\nPlease make sure you have the correct access rights\nand the repository exists.");
        }
        return found;
    }

    // Copy the server's branches to refs/remotes/<name>/ and its tags. Returns the lines to print.
    function fetchFrom(env, repo, name) {
        const url = remoteUrl(env, repo, name);
        if (!url) {
            throw noRemoteError(name);
        }
        const server = serverFor(env, url, false);
        const lines = [];
        Object.keys(server.refs).sort().forEach(function (ref) {
            const id = server.refs[ref];
            if (ref.startsWith("refs/heads/")) {
                const branch = ref.slice(11);
                const local = "refs/remotes/" + name + "/" + branch;
                const old = repo.state.refs[local];
                if (old === id) {
                    return;
                }
                repo.state.refs[local] = id;
                if (!old) {
                    lines.push(" * [new branch]      " + branch.padEnd(10) + " -> " + name + "/" + branch);
                } else if (G.isAncestor(env.system, old, id)) {
                    lines.push("   " + G.shortId(old) + ".." + G.shortId(id) + "  " + branch.padEnd(10) + " -> " + name + "/" + branch);
                } else {
                    lines.push(" + " + G.shortId(old) + "..." + G.shortId(id) + " " + branch.padEnd(10) + " -> " + name + "/" + branch + "  (forced update)");
                }
            } else if (ref.startsWith("refs/tags/") && !Object.hasOwn(repo.state.refs, ref)) {
                repo.state.refs[ref] = id;
                lines.push(" * [new tag]         " + ref.slice(10).padEnd(10) + " -> " + ref.slice(10));
            }
        });
        if (lines.length) {
            env.out("From " + shownUrl(url) + "\n" + lines.join("\n") + "\n");
        }
        return url;
    }

    function defaultRemote(env, repo) {
        const branch = G.currentBranch(repo);
        const upstream = branch ? upstreamOf(env, repo, branch) : null;
        return upstream ? upstream.remote : "origin";
    }

    function cmdFetch(args, env) {
        const repo = G.needRepo(env);
        const names = args.filter(function (arg) { return !arg.startsWith("-"); });
        if (args.includes("--all")) {
            remoteNames(env, repo).forEach(function (name) { fetchFrom(env, repo, name); });
            return;
        }
        fetchFrom(env, repo, names[0] || defaultRemote(env, repo));
    }

    function cmdPull(args, env) {
        const repo = G.needRepo(env);
        const names = args.filter(function (arg) { return !arg.startsWith("-"); });
        const branch = G.currentBranch(repo);
        if (!branch) {
            throw G.fail("You are not currently on a branch.\nPlease specify which branch you want to merge with.");
        }
        const upstream = upstreamOf(env, repo, branch);
        const remote = names[0] || (upstream ? upstream.remote : "origin");
        if (!names.length && !upstream) {
            throw G.fail("There is no tracking information for the current branch.\nPlease specify which branch you want to merge with.\n\n    git pull <remote> <branch>\n\n" +
                "If you wish to set tracking information for this branch you can do so with:\n\n    git branch --set-upstream-to=origin/<branch> " + branch + "\n");
        }
        const url = fetchFrom(env, repo, remote);
        const remoteBranch = names[1] || (upstream ? upstream.name.slice(upstream.remote.length + 1) : branch);
        const theirs = repo.state.refs["refs/remotes/" + remote + "/" + remoteBranch];
        if (!theirs) {
            throw G.fail("fatal: couldn't find remote ref " + remoteBranch);
        }
        const head = G.headId(repo);
        const diverged = head && !G.isAncestor(env.system, theirs, head) && !G.isAncestor(env.system, head, theirs);
        const values = G.config(env, repo);
        const rebase = args.includes("--rebase") ? "true" : args.includes("--no-rebase") ? "false" : values["pull.rebase"];
        if (diverged && rebase === undefined && values["pull.ff"] === undefined) {
            env.note("hint: You have divergent branches and need to specify how to reconcile them.\nhint: You can do so by running one of the following commands sometime before\nhint: your next pull:\nhint:\n" +
                "hint:   git config pull.rebase false  # merge\nhint:   git config pull.rebase true   # rebase\nhint:   git config pull.ff only       # fast-forward only\nhint:\n" +
                "hint: You can replace \"git config\" with \"git config --global\" to set a default\nhint: preference for all repositories. You can also pass --rebase, --no-rebase,\nhint: or --ff-only on the command line to override the configured default per\nhint: invocation.");
            throw G.fail("fatal: Need to specify how to reconcile divergent branches.");
        }
        if (diverged && rebase === "true") {
            return cmdRebase([remote + "/" + remoteBranch], env);
        }
        mergeInto(env, repo, theirs, remote + "/" + remoteBranch, {
            message: "Merge branch '" + remoteBranch + "' of " + shownUrl(url),
            reflog: "pull",
            ffOnly: values["pull.ff"] === "only"
        });
    }

    function cmdPush(args, env) {
        const repo = G.needRepo(env);
        const state = repo.state;
        const flags = args.filter(function (arg) { return arg.startsWith("-"); });
        const names = args.filter(function (arg) { return !arg.startsWith("-"); });
        const setUp = flags.includes("-u") || flags.includes("--set-upstream");
        const force = flags.includes("-f") || flags.includes("--force");
        const lease = flags.includes("--force-with-lease");
        const remove = flags.includes("--delete") || flags.includes("-d");
        const allRemotes = remoteNames(env, repo);
        if (!allRemotes.length) {
            throw G.fail("fatal: No configured push destination.\nEither specify the URL from the command-line or configure a remote repository using\n\n    git remote add <name> <url>\n\nand then push using the remote name\n\n    git push <name>\n");
        }
        const named = names.length && allRemotes.includes(names[0]);
        const remote = named ? names.shift() : defaultRemote(env, repo);
        const url = remoteUrl(env, repo, remote);
        if (!url) {
            throw noRemoteError(remote);
        }
        const branch = G.currentBranch(repo);
        let refs = names.slice();
        if (flags.includes("--tags")) {
            refs = Object.keys(state.refs).filter(function (ref) { return ref.startsWith("refs/tags/"); }).map(function (ref) { return ref.slice(10); });
        } else if (!refs.length) {
            if (!branch) {
                throw G.fail("fatal: You are not currently on a branch.\nTo push the history leading to the current (detached HEAD)\nstate now, use\n\n    git push " + remote + " HEAD:<name-of-remote-branch>\n");
            }
            const upstream = upstreamOf(env, repo, branch);
            if (named && upstream && upstream.remote !== remote && !setUp) {
                throw G.fail("fatal: You are pushing to remote '" + remote + "', which is not the upstream of\nyour current branch '" + branch + "', without telling me what to push\nto update which remote branch.");
            }
            if (!setUp && !upstream) {
                throw G.fail("fatal: The current branch " + branch + " has no upstream branch.\nTo push the current branch and set the remote as upstream, use\n\n    git push --set-upstream " + remote + " " + branch + "\n\n" +
                    "To have this happen automatically for branches without a tracking\nupstream, see 'push.autoSetupRemote' in 'git help config'.\n");
            }
            refs = [branch];
        }
        const server = serverFor(env, url, true);
        const lines = [];
        let rejected = false;
        refs.forEach(function (name) {
            const isTag = Object.hasOwn(state.refs, "refs/tags/" + name) && !Object.hasOwn(state.refs, "refs/heads/" + name);
            const ref = (isTag ? "refs/tags/" : "refs/heads/") + name;
            if (remove) {
                const existing = server.refs["refs/heads/" + name] ? "refs/heads/" + name : server.refs["refs/tags/" + name] ? "refs/tags/" + name : null;
                if (!existing) {
                    lines.push({ text: "error: unable to delete '" + name + "': remote ref does not exist", error: true });
                    rejected = true;
                    return;
                }
                delete server.refs[existing];
                delete state.refs["refs/remotes/" + remote + "/" + name];
                lines.push({ text: " - [deleted]         " + name });
                return;
            }
            const local = state.refs[ref];
            if (!local) {
                lines.push({ text: "error: src refspec " + name + " does not match any", error: true });
                rejected = true;
                return;
            }
            const old = server.refs[ref];
            const tracking = state.refs["refs/remotes/" + remote + "/" + name];
            if (old === local) {
                lines.push({ up: true });
                return;
            }
            const fastForward = !old || G.isAncestor(env.system, old, G.peel(env.system, local) || local);
            if (!fastForward && !force && !(lease && old === tracking)) {
                const why = lease ? "stale info" : tracking === old ? "non-fast-forward" : "fetch first";
                lines.push({ text: " ! [rejected]        " + name + " -> " + name + " (" + why + ")", error: true, why: why });
                rejected = true;
                return;
            }
            server.refs[ref] = local;
            if (!isTag) {
                state.refs["refs/remotes/" + remote + "/" + name] = local;
            }
            if (!old) {
                lines.push({ text: " * [new " + (isTag ? "tag" : "branch") + "]" + (isTag ? "         " : "      ") + name + " -> " + name });
            } else if (fastForward) {
                lines.push({ text: "   " + G.shortId(old) + ".." + G.shortId(local) + "  " + name + " -> " + name });
            } else {
                lines.push({ text: " + " + G.shortId(old) + "..." + G.shortId(local) + " " + name + " -> " + name + " (forced update)" });
            }
            if (setUp && !isTag) {
                setUpstream(env, repo, name, remote);
            }
        });
        const shown = lines.filter(function (line) { return !line.up; });
        if (!shown.length) {
            env.out("Everything up-to-date\n");
            return;
        }
        env.out("To " + url + "\n");
        shown.forEach(function (line) {
            if (line.error) {
                env.err(line.text);
            } else {
                env.out(line.text + "\n");
            }
        });
        if (setUp && !rejected) {
            refs.forEach(function (name) {
                if (Object.hasOwn(state.refs, "refs/heads/" + name)) {
                    env.out("branch '" + name + "' set up to track '" + remote + "/" + name + "'.\n");
                }
            });
        }
        if (rejected) {
            const fetchFirst = shown.some(function (line) { return line.why === "fetch first"; });
            env.err("error: failed to push some refs to '" + url + "'");
            if (fetchFirst) {
                env.note("hint: Updates were rejected because the remote contains work that you do not\nhint: have locally. This is usually caused by another repository pushing to\n" +
                    "hint: the same ref. If you want to integrate the remote changes, use\nhint: 'git pull' before pushing again.\nhint: See the 'Note about fast-forwards' in 'git push --help' for details.");
            } else if (shown.some(function (line) { return line.why === "non-fast-forward"; })) {
                env.note("hint: Updates were rejected because the tip of your current branch is behind\nhint: its remote counterpart. If you want to integrate the remote changes,\n" +
                    "hint: use 'git pull' before pushing again.\nhint: See the 'Note about fast-forwards' in 'git push --help' for details.");
            }
        }
    }

    function cmdClone(args, env) {
        let branch = null;
        const rest = [];
        for (let i = 0; i < args.length; i++) {
            const value = takeValue(args, i, "-b", "--branch");
            const depth = takeValue(args, i, null, "--depth");
            if (value) {
                branch = value.value;
                i = value.next;
            } else if (depth) {
                i = depth.next;             // every commit is here anyway
            } else if (args[i] !== "-q" && args[i] !== "--quiet") {
                if (args[i].startsWith("-")) {
                    throw G.fail("error: unknown option `" + args[i].replace(/^-+/, "") + "'\nusage: " + USAGE.clone);
                }
                rest.push(args[i]);
            }
        }
        const url = rest[0];
        if (!url) {
            throw G.fail("fatal: You must specify a repository to clone.\n\nusage: " + USAGE.clone);
        }
        const folder = rest[1] || G.serverKey(url).split("/").pop();
        const path = env.fs.join(env.fs.split(folder));
        const existing = env.fs.lookup(path);
        if (existing.node && (existing.node.type !== "dir" || env.fs.names(existing.node).length)) {
            throw G.fail("fatal: destination path '" + folder + "' already exists and is not an empty directory.");
        }
        env.out("Cloning into '" + folder + "'...\n");
        const server = serverFor(env, url, false);
        if (!existing.node) {
            const error = env.fs.create(path, env.fs.newDir());
            if (error) {
                throw G.fail("fatal: could not create work tree dir '" + folder + "': " + env.fs.message(error));
            }
        }
        const wanted = branch || server.head;
        initRepo(env, path, wanted);
        const gitNode = env.fs.lookup(path + "/.git").node;
        const repo = { root: path, rootParts: env.fs.split(path), gitPath: path + "/.git", gitNode: gitNode, state: gitNode.repo };
        G.setConfig(env, repo.gitPath + "/config", "remote.origin.url", url);
        G.setConfig(env, repo.gitPath + "/config", "remote.origin.fetch", "+refs/heads/*:refs/remotes/origin/*");
        if (!Object.keys(server.refs).length) {
            env.err("warning: You appear to have cloned an empty repository.");
            return;
        }
        Object.keys(server.refs).forEach(function (ref) {
            if (ref.startsWith("refs/heads/")) {
                repo.state.refs["refs/remotes/origin/" + ref.slice(11)] = server.refs[ref];
            } else {
                repo.state.refs[ref] = server.refs[ref];
            }
        });
        if (!server.refs["refs/heads/" + wanted]) {
            throw G.fail("warning: Could not find remote branch " + wanted + " to clone.\nfatal: Remote branch " + wanted + " not found in upstream origin");
        }
        const id = server.refs["refs/heads/" + wanted];
        const count = G.ancestors(env.system, id).size;
        env.out("remote: Enumerating objects: " + count * 3 + ", done.\nremote: Counting objects: 100% (" + count * 3 + "/" + count * 3 + "), done.\n" +
            "Receiving objects: 100% (" + count * 3 + "/" + count * 3 + "), done.\nResolving deltas: 100% (" + count + "/" + count + "), done.\n");
        repo.state.refs["refs/heads/" + wanted] = id;
        setUpstream(env, repo, wanted, "origin");
        G.checkoutTree(env, repo, {}, G.treeOf(env.system, id));
        G.logHead(repo, id, "clone: from " + url);
    }

    // =========================================================================
    // Help and the command itself
    // =========================================================================

    function printSummary(env) {
        env.out("usage: git [--version] [--help] <command> [<args>]\n\nThese are common Git commands used in various situations:\n");
        SUMMARY.forEach(function (group) {
            env.out("\n" + group[0] + "\n");
            group[1].forEach(function (row) { env.out("   " + row[0].padEnd(11) + row[1] + "\n"); });
        });
        env.out("\nThe playground also has: config, remote, stash, reflog, cherry-pick, checkout.\n");
        env.out("'git help <command>' or 'git <command> -h' shows how to use a command.\n");
    }

    const COMMANDS = {
        init: cmdInit, config: cmdConfig, clone: cmdClone, status: cmdStatus, add: cmdAdd, rm: cmdRm,
        restore: cmdRestore, diff: cmdDiff, commit: cmdCommit, log: cmdLog, show: cmdShow, reflog: cmdReflog,
        branch: cmdBranch, switch: cmdSwitch, checkout: cmdCheckout, merge: cmdMerge, "cherry-pick": cmdCherryPick,
        rebase: cmdRebase, reset: cmdReset, stash: cmdStash, tag: cmdTag, remote: cmdRemote, fetch: cmdFetch,
        pull: cmdPull, push: cmdPush
    };

    function runGit(args, env, depth) {
        if (!args.length || args[0] === "--help" || args[0] === "-h") {
            printSummary(env);
            return;
        }
        if (args[0] === "--version" || args[0] === "version") {
            env.out("git version " + G.version + "\n");
            return;
        }
        const name = args[0];
        const rest = args.slice(1);
        if (name === "help") {
            if (!rest[0]) {
                printSummary(env);
            } else if (USAGE[rest[0]]) {
                env.out("usage: " + USAGE[rest[0]] + "\n\n(The full manual is in the Git notes on this site, and in man git.)\n");
            } else {
                throw G.fail("No manual entry for git-" + rest[0]);
            }
            return;
        }
        if (Object.hasOwn(COMMANDS, name) && (rest.includes("-h") && name !== "branch" || rest.includes("--help"))) {
            env.out("usage: " + USAGE[name] + "\n");
            return;
        }
        if (!Object.hasOwn(COMMANDS, name)) {
            // An alias from git config, like alias.st = status.
            const alias = G.config(env, G.findRepo(env))["alias." + name];
            if (alias && depth < 5) {
                if (alias.startsWith("!")) {
                    throw G.fail("error: aliases that run shell commands (!) are not supported in the playground");
                }
                return runGit(words(alias).concat(rest), env, depth + 1);
            }
            throw G.fail("git: '" + name + "' is not a git command. See 'git --help'.");
        }
        COMMANDS[name](rest, env);
    }

    Playground.register({
        name: "git",
        usage: "git command",
        summary: "version control, try git status or git log",
        run: function (args, env) {
            try {
                runGit(args, env, 0);
            } catch (error) {
                if (error instanceof G.GitError) {
                    env.err(error.message);
                    return;
                }
                throw error;
            } finally {
                G.setClock(null);
            }
        }
    });

    // For data files that make example repositories.
    Playground.git.run = function (args, env) { runGit(args, env, 0); };
    Playground.git.initRepo = initRepo;
})();

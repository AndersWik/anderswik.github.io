// ps: list running processes.
//   ps                   only your own, in this terminal
//   ps aux               every process, with user, CPU and memory (BSD style, no dash)
//   ps -ef               every process, with the parent's id PPID (System V style)
//   ps -ef --forest      as a tree: who started whom
//   ps aux --sort=-%mem  biggest memory users first (also %cpu, pid, rss, vsz)

(function () {
    const VERSION = "ps from procps-ng 4.0.4";

    // "1:12" (minutes:seconds) -> "00:01:12"
    function clock(time) {
        const parts = time.split(":").map(Number);
        const seconds = parts[0] * 60 + parts[1];
        return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
            .map(function (n) { return String(n).padStart(2, "0"); }).join(":");
    }

    function hoursMinutes() {
        const now = new Date();
        return String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    }

    // "/usr/sbin/cron -f" -> "cron", "-bash" -> "bash"
    function shortName(command) {
        const first = command.split(" ")[0].replace(/^-/, "");
        return first.startsWith("[") ? command : first.split("/").pop().replace(/:$/, "");
    }

    const SORT_KEYS = {
        "%mem": function (p) { return p.rss; },
        "%cpu": function (p) { return p.cpu; },
        pid: function (p) { return p.pid; },
        rss: function (p) { return p.rss; },
        vsz: function (p) { return p.vsz; },
        user: function (p) { return p.user; }
    };

    // Put children right after their parent, and give each a depth.
    function asTree(list) {
        const pids = new Set(list.map(function (p) { return p.pid; }));
        const result = [];
        function add(process, depth) {
            result.push({ process: process, depth: depth });
            list.filter(function (child) { return child.ppid === process.pid; })
                .forEach(function (child) { add(child, depth + 1); });
        }
        list.filter(function (p) { return !pids.has(p.ppid); }).forEach(function (root) { add(root, 0); });
        return result;
    }

    Playground.register({
        name: "ps",
        usage: "ps [aux] [-ef]",
        summary: "list running processes (try ps aux)",
        run: function (args, env) {
            let all = false;
            let format = "default";
            let forest = false;
            let sort = null;

            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                if (arg === "--help") {
                    env.out("Usage:\n ps [options]\n\n ps            your processes in this terminal\n ps aux        every process, BSD style\n ps -ef        every process, with parent ids\n ps -ef --forest   as a tree\n ps aux --sort=-%mem   sorted, - means biggest first\n");
                    return;
                }
                if (arg === "--version" || arg === "-V") {
                    env.out(VERSION + "\n");
                    return;
                }
                if (arg === "--forest") {
                    forest = true;
                } else if (arg === "--sort" || arg.startsWith("--sort=")) {
                    sort = arg === "--sort" ? args[++i] : arg.slice(7);
                } else if (arg.startsWith("-")) {
                    for (const letter of arg.slice(1)) {
                        if (letter === "e" || letter === "A") {
                            all = true;
                        } else if (letter === "f") {
                            format = "full";
                        } else {
                            env.err("error: unsupported SysV option -- '" + letter + "'\n\nUsage:\n ps [options]\n\n Try 'ps --help'.");
                            return;
                        }
                    }
                } else {
                    // BSD style, without a dash: a and x mean all, u the user format.
                    for (const letter of arg) {
                        if (letter === "a" || letter === "x") {
                            all = true;
                            if (format === "default") {
                                format = "bsd";
                            }
                        } else if (letter === "u") {
                            format = "user";
                        } else {
                            env.err("error: unsupported option (BSD syntax)\n\nUsage:\n ps [options]\n\n Try 'ps --help'.");
                            return;
                        }
                    }
                }
            }

            const system = env.system;
            // ps itself is running too (and sudo, if it started ps).
            const shell = system.processes.find(function (p) { return p.shell; });
            let parent = shell ? shell.pid : 1;
            const extra = [];
            const started = hoursMinutes();
            const words = args.length ? " " + args.join(" ") : "";
            if (env.user !== env.login) {
                extra.push({ pid: system.nextPid++, ppid: parent, user: "root", cpu: 0, vsz: 11624, rss: 5632, tty: "pts/0", stat: "S+", start: started, time: "0:00", command: "sudo ps" + words });
                parent = extra[0].pid;
            }
            extra.push({ pid: system.nextPid++, ppid: parent, user: env.user, cpu: 0, vsz: 11440, rss: 4480, tty: "pts/0", stat: "R+", start: started, time: "0:00", command: "ps" + words });

            let list = system.processes.concat(extra);
            if (!all) {
                list = list.filter(function (p) { return p.tty === "pts/0" && p.user === env.user; });
            }
            list.sort(function (a, b) { return a.pid - b.pid; });
            if (sort) {
                const descending = sort.startsWith("-");
                const key = sort.replace(/^[-+]/, "");
                if (!Object.hasOwn(SORT_KEYS, key)) {
                    env.err("error: unknown sort specifier");
                    return;
                }
                list.sort(function (a, b) {
                    const x = SORT_KEYS[key](a);
                    const y = SORT_KEYS[key](b);
                    const result = x < y ? -1 : x > y ? 1 : 0;
                    return descending ? -result : result;
                });
            }
            const rows = forest ? asTree(list) : list.map(function (p) { return { process: p, depth: 0 }; });
            const memPercent = function (p) { return (p.rss / system.memory.total * 100).toFixed(1); };
            // In a tree, children's commands are moved in under their parent.
            const command = function (row) {
                if (!row.depth) {
                    return row.process.command;
                }
                return " ".repeat(4 * (row.depth - 1)) + " \\_ " + row.process.command;
            };

            if (format === "user") {
                env.out("USER".padEnd(8) + "PID".padStart(8) + " %CPU %MEM " + "VSZ".padStart(6) + " " + "RSS".padStart(5) + " TTY      STAT START   TIME COMMAND\n");
                rows.forEach(function (row) {
                    const p = row.process;
                    env.out(p.user.padEnd(8) + String(p.pid).padStart(8) + " " + p.cpu.toFixed(1).padStart(4) + " " +
                        memPercent(p).padStart(4) + " " + String(p.vsz).padStart(6) + " " + String(p.rss).padStart(5) + " " +
                        p.tty.padEnd(8) + " " + p.stat.padEnd(4) + " " + p.start.padStart(5) + " " + p.time.padStart(6) + " " + command(row) + "\n");
                });
            } else if (format === "full") {
                env.out("UID".padEnd(8) + "PID".padStart(8) + "PPID".padStart(8) + "  C STIME TTY          TIME CMD\n");
                rows.forEach(function (row) {
                    const p = row.process;
                    env.out(p.user.padEnd(8) + String(p.pid).padStart(8) + String(p.ppid).padStart(8) + " " +
                        String(Math.floor(p.cpu)).padStart(2) + " " + p.start.padEnd(5) + " " + p.tty.padEnd(8) + " " +
                        clock(p.time) + " " + command(row) + "\n");
                });
            } else if (format === "bsd") {
                env.out("PID".padStart(7) + " TTY      STAT   TIME COMMAND\n");
                rows.forEach(function (row) {
                    const p = row.process;
                    env.out(String(p.pid).padStart(7) + " " + p.tty.padEnd(8) + " " + p.stat.padEnd(4) + " " + p.time.padStart(6) + " " + command(row) + "\n");
                });
            } else {
                env.out("PID".padStart(7) + " TTY          TIME CMD\n");
                rows.forEach(function (row) {
                    const p = row.process;
                    env.out(String(p.pid).padStart(7) + " " + p.tty.padEnd(8) + " " + clock(p.time) + " " + shortName(p.command) + "\n");
                });
            }
        }
    });
})();

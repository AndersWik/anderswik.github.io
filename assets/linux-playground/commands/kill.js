// kill: send a signal to a process. The signal asks the process to do
// something, most often to stop.
//   kill 4321        TERM (15): please stop. The process may clean up first.
//   kill -9 4321     KILL (9): stop now. The process gets no say.
//   kill -HUP 745    HUP (1): many services read their settings again
//   kill -STOP / -CONT   pause and go on again
//   kill -l          list the signals
// You may only signal your own processes, unless you use sudo.

(function () {
    // Signal numbers 1-31 on Linux. kill -l lists them.
    const SIGNALS = ["HUP", "INT", "QUIT", "ILL", "TRAP", "ABRT", "BUS", "FPE", "KILL", "USR1", "SEGV",
        "USR2", "PIPE", "ALRM", "TERM", "STKFLT", "CHLD", "CONT", "STOP", "TSTP", "TTIN", "TTOU", "URG",
        "XCPU", "XFSZ", "VTALRM", "PROF", "WINCH", "IO", "PWR", "SYS"];

    // "9", "KILL", "SIGKILL", "kill" -> 9, or null
    function signalNumber(text) {
        if (/^\d+$/.test(text)) {
            const number = Number(text);
            return number >= 0 && number <= SIGNALS.length ? number : null;
        }
        const name = text.toUpperCase().replace(/^SIG/, "");
        const index = SIGNALS.indexOf(name);
        return index === -1 ? null : index + 1;
    }

    function listSignals(out) {
        let line = [];
        SIGNALS.forEach(function (name, i) {
            line.push(String(i + 1).padStart(2) + ") SIG" + name);
            if (line.length === 5 || i === SIGNALS.length - 1) {
                out(line.join("\t") + "\n");
                line = [];
            }
        });
    }

    // The process stops: it goes, and its children get pid 1 as parent.
    // A service that cleans up (nginx) stops its own children first, but
    // KILL gives it no time to do that.
    function stop(system, process, signal) {
        system.processes = system.processes.filter(function (p) { return p !== process; });
        system.processes.filter(function (p) { return p.ppid === process.pid; }).forEach(function (child) {
            if (process.stopsChildren && signal !== 9) {
                stop(system, child, signal);
            } else {
                child.ppid = 1;
            }
        });
    }

    Playground.register({
        name: "kill",
        usage: "kill [-9] pid",
        summary: "stop a process (find its pid with ps aux)",
        run: function (args, env) {
            const prefix = "bash: kill: ";
            if (!args.length || args[0] === "--help") {
                env.out("kill: usage: kill [-s sigspec | -n signum | -sigspec] pid ... or kill -l [sigspec]\n");
                return;
            }
            if (args[0] === "-l" || args[0] === "-L") {
                if (args[1]) {
                    const number = signalNumber(args[1]);
                    if (number === null) {
                        env.err(prefix + args[1] + ": invalid signal specification");
                    } else {
                        env.out(/^\d+$/.test(args[1]) ? SIGNALS[number - 1] + "\n" : number + "\n");
                    }
                    return;
                }
                listSignals(env.out);
                return;
            }

            let signal = 15;                    // TERM, when no signal is given
            let rest = args;
            if (args[0] === "-s" || args[0] === "-n") {
                signal = signalNumber(args[1] || "");
                rest = args.slice(2);
                if (signal === null) {
                    env.err(prefix + (args[1] || "") + ": invalid signal specification");
                    return;
                }
            } else if (args[0].startsWith("-") && args[0] !== "--") {
                signal = signalNumber(args[0].slice(1));
                rest = args.slice(1);
                if (signal === null) {
                    env.err(prefix + args[0].slice(1) + ": invalid signal specification");
                    return;
                }
            } else if (args[0] === "--") {
                rest = args.slice(1);
            }
            if (!rest.length) {
                env.out("kill: usage: kill [-s sigspec | -n signum | -sigspec] pid ... or kill -l [sigspec]\n");
                return;
            }

            const system = env.system;
            rest.forEach(function (text) {
                if (!/^\d+$/.test(text)) {
                    env.err(prefix + text + ": arguments must be process or job IDs");
                    return;
                }
                const pid = Number(text);
                const process = system.processes.find(function (p) { return p.pid === pid; });
                if (!process) {
                    env.err(prefix + "(" + pid + ") - No such process");
                    return;
                }
                if (env.user !== "root" && process.user !== env.user) {
                    env.err(prefix + "(" + pid + ") - Operation not permitted");
                    return;
                }
                if (signal === 0 || process.kernel || process.init) {
                    return;                     // 0 only checks; the kernel protects its threads and pid 1
                }
                if (process.shell && [2, 3, 15].includes(signal)) {
                    return;                     // an interactive bash ignores INT, QUIT and TERM
                }
                if (process.session) {
                    env.out("(" + pid + " is part of your own login. On a real server this would log you out and close the terminal, so the playground keeps it running.)\n", "info");
                    return;
                }
                if (signal === 19 || signal === 20) {
                    // STOP and TSTP pause it: T in ps.
                    if (!process.stat.startsWith("T")) {
                        process.statBefore = process.stat;
                        process.stat = "T" + process.stat.replace(/^[A-Z]/, "").replace("+", "");
                    }
                    return;
                }
                if (signal === 18) {
                    if (process.statBefore) {
                        process.stat = process.statBefore;
                        delete process.statBefore;
                    }
                    return;
                }
                if ([17, 23, 28].includes(signal)) {
                    return;                     // CHLD, URG and WINCH are ignored unless a program asks for them
                }
                if (process.reload && [1, 10, 12].includes(signal)) {
                    return;                     // services catch HUP (reload) and USR1/USR2
                }
                stop(system, process, signal);
            });
        }
    });
})();

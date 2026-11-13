// uname: facts about the system and its kernel.
//   uname      the kernel's name: Linux
//   uname -a   everything
//   uname -r   kernel release, uname -m machine (CPU type), uname -n host name

(function () {
    const VERSION = "uname (GNU coreutils) 9.4";

    // In the order uname -a prints them.
    const FIELDS = [
        { flag: "s", long: "--kernel-name", value: function (env) { return env.system.kernel.name; } },
        { flag: "n", long: "--nodename", value: function (env) { return env.hostname; } },
        { flag: "r", long: "--kernel-release", value: function (env) { return env.system.kernel.release; } },
        { flag: "v", long: "--kernel-version", value: function (env) { return env.system.kernel.version; } },
        { flag: "m", long: "--machine", value: function (env) { return env.system.kernel.machine; } },
        { flag: "p", long: "--processor", value: function (env) { return env.system.kernel.machine; } },
        { flag: "i", long: "--hardware-platform", value: function (env) { return env.system.kernel.machine; } },
        { flag: "o", long: "--operating-system", value: function (env) { return env.system.kernel.os; } }
    ];

    Playground.register({
        name: "uname",
        usage: "uname [-a]",
        summary: "show the system name and kernel (-a everything)",
        run: function (args, env) {
            if (args.includes("--help")) {
                env.out("Usage: uname [OPTION]...\n\n  -a   all information\n  -s   kernel name\n  -n   host name\n  -r   kernel release\n  -v   kernel version\n  -m   machine hardware name\n  -o   operating system\n");
                return;
            }
            if (args.includes("--version")) {
                env.out(VERSION + "\n");
                return;
            }
            // Long names like --kernel-release become their letter.
            const letters = args.map(function (arg) {
                if (arg === "--all") {
                    return "-a";
                }
                const field = FIELDS.find(function (f) { return f.long === arg; });
                return field ? "-" + field.flag : arg;
            });
            const parsed = env.flags("uname", letters, ["a"].concat(FIELDS.map(function (f) { return f.flag; })));
            if (!parsed) {
                return;
            }
            if (parsed.rest.length) {
                env.err("uname: extra operand '" + parsed.rest[0] + "'");
                return;
            }
            let wanted = FIELDS.filter(function (f) { return parsed.flags.has(f.flag) || parsed.flags.has("a"); });
            if (!wanted.length) {
                wanted = [FIELDS[0]];
            }
            env.out(wanted.map(function (f) { return f.value(env); }).join(" ") + "\n");
        }
    });
})();

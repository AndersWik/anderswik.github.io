// free: how much memory is used and free.
//   free       in KiB (1 KiB = 1024 bytes)
//   free -h    easy to read: Ki, Mi, Gi
//   free -m    in MiB, free -g in GiB
// "available" is what programs can still get: free memory plus the cache
// (buff/cache) that Linux gives back when it is needed. Unused memory is
// wasted memory, so Linux fills it with cache.

(function () {
    const VERSION = "free from procps-ng 4.0.4";

    function human(kib) {
        const units = ["B", "Ki", "Mi", "Gi", "Ti"];
        let value = kib * 1024;
        let unit = 0;
        while (value >= 1024 && unit < units.length - 1) {
            value /= 1024;
            unit++;
        }
        if (unit === 0) {
            return Math.round(value) + "B";
        }
        return (value < 10 ? value.toFixed(1) : String(Math.round(value))) + units[unit];
    }

    Playground.register({
        name: "free",
        usage: "free [-h]",
        summary: "show memory use (-h easy to read)",
        run: function (args, env) {
            if (args.includes("--help")) {
                env.out("Usage:\n free [options]\n\n -b, -k, -m, -g   show in bytes, KiB, MiB or GiB\n -h               show in easy to read units\n -t               add a line with the totals\n");
                return;
            }
            if (args.includes("--version") || args.includes("-V")) {
                env.out(VERSION + "\n");
                return;
            }
            if (args.some(function (arg) { return /^-[a-z]*[sc]/.test(arg); })) {
                env.err("free: repeating every few seconds (-s, -c) is not supported in the playground");
                return;
            }
            const parsed = env.flags("free", args, ["b", "k", "m", "g", "h", "t"]);
            if (!parsed) {
                return;
            }
            let unit = "k";
            ["b", "m", "g", "h"].forEach(function (flag) {
                if (parsed.flags.has(flag)) {
                    unit = flag;
                }
            });
            const show = function (kib) {
                if (unit === "h") {
                    return human(kib);
                }
                if (unit === "b") {
                    return String(kib * 1024);
                }
                return String(Math.floor(kib / { k: 1, m: 1024, g: 1048576 }[unit]));
            };

            const memory = env.system.memory;
            const processes = env.system.processes.reduce(function (sum, p) { return sum + p.rss; }, 0);
            const used = memory.kernelUsed + processes;
            const free = Math.max(0, memory.total - used - memory.buffCache);
            const available = free + memory.buffCache - memory.shared;
            const swapFree = memory.swapTotal - memory.swapUsed;

            // The first number ends 20 characters in, the rest are 12 wide.
            const row = function (label, values) {
                return label + values.map(function (value, i) {
                    return i === 0 ? value.padStart(20 - label.length) : value.padStart(12);
                }).join("") + "\n";
            };
            env.out(" ".repeat(15) + "total" + ["used", "free", "shared", "buff/cache", "available"].map(function (h) { return h.padStart(12); }).join("") + "\n");
            env.out(row("Mem:", [memory.total, used, free, memory.shared, memory.buffCache, available].map(show)));
            env.out(row("Swap:", [memory.swapTotal, memory.swapUsed, swapFree].map(show)));
            if (parsed.flags.has("t")) {
                env.out(row("Total:", [memory.total + memory.swapTotal, used + memory.swapUsed, free + swapFree].map(show)));
            }
        }
    });
})();

// df: disk free, how full each mounted file system is.
//   df -h          easy to read sizes: K, M, G
//   df -h /home    only the disk that holds /home
//   df -T          also the file system type, like ext4
//   df -i          inodes: a disk is also full when it runs out of these
//                  (one per file), even with space left

(function () {
    const VERSION = "df (GNU coreutils) 9.4";

    // KiB -> "4.0K", "1.2G", "49G". df rounds up, so it never shows less than is used.
    function human(kib, isCount) {
        const units = isCount ? ["", "K", "M", "G", "T"] : ["K", "M", "G", "T", "P"];
        let value = kib;
        let unit = 0;
        while (value >= 1024 && unit < units.length - 1) {
            value /= 1024;
            unit++;
        }
        if (value === 0) {
            return "0";
        }
        if (isCount && unit === 0) {
            return String(value);
        }
        return (value < 10 ? (Math.ceil(value * 10) / 10).toFixed(1) : String(Math.ceil(value))) + units[unit];
    }

    // On ext4 about 5% is kept for root, so that is not available to others.
    function available(disk) {
        return disk.reserved ? Math.max(0, Math.floor(disk.size * 0.95) - disk.used) : disk.size - disk.used;
    }

    function percent(used, free) {
        return used + free === 0 ? "-" : Math.ceil(used * 100 / (used + free)) + "%";
    }

    // The disk a path is on: the one with the longest mount point that starts the path.
    function diskFor(disks, path) {
        let best = null;
        disks.forEach(function (disk) {
            const prefix = disk.mount === "/" ? "/" : disk.mount + "/";
            if ((path === disk.mount || path.startsWith(prefix)) && (!best || disk.mount.length > best.mount.length)) {
                best = disk;
            }
        });
        return best;
    }

    Playground.register({
        name: "df",
        usage: "df [-h] [-T] [path]",
        summary: "show how full the disks are (-h easy to read)",
        run: function (args, env) {
            if (args.includes("--help")) {
                env.out("Usage: df [OPTION]... [FILE]...\n\n  -h   sizes in powers of 1024 (e.g., 1023M)\n  -i   list inode information instead of block usage\n  -T   print file system type\n");
                return;
            }
            if (args.includes("--version")) {
                env.out(VERSION + "\n");
                return;
            }
            const parsed = env.flags("df", args, ["h", "T", "i"]);
            if (!parsed) {
                return;
            }
            const easy = parsed.flags.has("h");
            const inodes = parsed.flags.has("i");
            const disks = env.system.disks;

            let chosen = disks;
            if (parsed.rest.length) {
                chosen = [];
                parsed.rest.forEach(function (path) {
                    const found = env.fs.lookup(path);
                    if (found.error) {
                        env.err("df: " + path + ": " + env.fs.message(found.error));
                        return;
                    }
                    chosen.push(diskFor(disks, env.fs.join(found.parts)));
                });
                if (!chosen.length) {
                    return;
                }
            }

            const headers = ["Filesystem"];
            const right = [false];
            if (parsed.flags.has("T")) {
                headers.push("Type");
                right.push(false);
            }
            if (inodes) {
                headers.push("Inodes", "IUsed", "IFree", "IUse%");
            } else {
                headers.push(easy ? "Size" : "1K-blocks", "Used", easy ? "Avail" : "Available", "Use%");
            }
            right.push(true, true, true, true);
            headers.push("Mounted on");
            right.push(false);

            const rows = chosen.map(function (disk) {
                const row = [disk.filesystem];
                if (parsed.flags.has("T")) {
                    row.push(disk.type);
                }
                if (inodes) {
                    const free = disk.inodes - disk.inodesUsed;
                    const count = function (n) { return easy ? human(n, true) : String(n); };
                    row.push(count(disk.inodes), count(disk.inodesUsed), count(free), percent(disk.inodesUsed, free));
                } else {
                    const avail = available(disk);
                    const size = function (n) { return easy ? human(n) : String(n); };
                    row.push(size(disk.size), size(disk.used), size(avail), percent(disk.used, avail));
                }
                row.push(disk.mount);
                return row;
            });

            // Line the columns up: text to the left, numbers to the right.
            const widths = headers.map(function (header, i) {
                return rows.reduce(function (width, row) { return Math.max(width, row[i].length); }, header.length);
            });
            [headers].concat(rows).forEach(function (row) {
                env.out(row.map(function (cell, i) {
                    if (i === row.length - 1) {
                        return cell;
                    }
                    return right[i] ? cell.padStart(widths[i]) : cell.padEnd(widths[i]);
                }).join(" ") + "\n");
            });
        }
    });
})();

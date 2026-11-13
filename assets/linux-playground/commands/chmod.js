// chmod: change who may read, write and run a file.
//   chmod 644 file    owner rw-, group r--, others r--  (4 read + 2 write + 1 run)
//   chmod u+x file    give the owner (u) the right to run it
//   chmod go-w file   take write away from group (g) and others (o)

(function () {
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

    Playground.register({
        name: "chmod",
        usage: "chmod mode file",
        summary: "change permissions, like chmod 644 or chmod u+x",
        run: function (args, env) {
            if (args.length < 2) {
                env.err(args.length ? "chmod: missing operand after '" + args[0] + "'" : "chmod: missing operand");
                return;
            }
            const spec = args[0];
            args.slice(1).forEach(function (path) {
                const found = env.fs.lookup(path);
                if (found.error) {
                    env.err("chmod: cannot access '" + path + "': " + env.fs.message(found.error));
                    return;
                }
                const mode = newMode(found.node.mode, spec);
                if (mode === null) {
                    env.err("chmod: invalid mode: '" + spec + "'");
                    return;
                }
                // Only the owner, or root, may change a file's permissions.
                if (env.user !== "root" && found.node.owner !== env.user) {
                    env.err("chmod: changing permissions of '" + path + "': Operation not permitted");
                    return;
                }
                found.node.mode = mode;
            });
        }
    });
})();

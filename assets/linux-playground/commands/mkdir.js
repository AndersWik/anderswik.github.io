// mkdir: make folders. -p also makes the folders above, and doesn't
// mind folders that are already there.
Playground.register({
    name: "mkdir",
    usage: "mkdir [-p] folder",
    summary: "make a folder (-p also the folders above it)",
    run: function (args, env) {
        const parsed = env.flags("mkdir", args, ["p"]);
        if (!parsed) {
            return;
        }
        if (!parsed.rest.length) {
            env.err("mkdir: missing operand");
            return;
        }
        parsed.rest.forEach(function (path) {
            let error = null;
            if (parsed.flags.has("p")) {
                const parts = env.fs.split(path);
                for (let i = 1; i <= parts.length && !error; i++) {
                    const step = env.fs.join(parts.slice(0, i));
                    const found = env.fs.lookup(step);
                    if (found.node) {
                        error = found.node.type === "dir" ? null : "EEXIST";
                    } else {
                        error = env.fs.create(step, env.fs.newDir());
                    }
                }
            } else {
                error = env.fs.create(path, env.fs.newDir());
            }
            if (error) {
                env.err("mkdir: cannot create directory '" + path + "': " + env.fs.message(error));
            }
        });
    }
});

// rm: remove files. -r also removes folders and everything in them,
// -f doesn't complain about files that aren't there.
//
// Removing a file changes the folder it is in, so it needs write
// permission on the folder, not on the file.
Playground.register({
    name: "rm",
    usage: "rm [-r] [-f] path",
    summary: "remove files (-r folders too, -f no errors)",
    run: function (args, env) {
        const parsed = env.flags("rm", args, ["r", "R", "f"]);
        if (!parsed) {
            return;
        }
        const recursive = parsed.flags.has("r") || parsed.flags.has("R");
        const force = parsed.flags.has("f");
        if (!parsed.rest.length) {
            if (!force) {
                env.err("rm: missing operand");
            }
            return;
        }
        parsed.rest.forEach(function (path) {
            const last = path.replace(/\/+$/, "").split("/").pop();
            if (last === "." || last === "..") {
                env.err("rm: refusing to remove '.' or '..' directory: skipping '" + path + "'");
                return;
            }
            const found = env.fs.lookup(path);
            if (found.error) {
                if (!(force && found.error === "ENOENT")) {
                    env.err("rm: cannot remove '" + path + "': " + env.fs.message(found.error));
                }
                return;
            }
            if (!found.parent) {
                env.err("rm: it is dangerous to operate recursively on '/'");
                env.err("rm: use --no-preserve-root to override this failsafe");
                return;
            }
            let error = null;
            if (found.node.type === "dir" && !recursive) {
                error = "EISDIR";
            } else if (found.node.type === "dir" && env.fs.holdsCwd(found.parts)) {
                error = "EBUSY";
            } else if (!(env.fs.can(found.parent, "w") && env.fs.can(found.parent, "x"))) {
                error = "EACCES";
            } else if (env.fs.stickyBlocks(found.parent, found.node)) {
                error = "EPERM";
            } else if (found.node.type === "dir" && !env.fs.canEmpty(found.node)) {
                error = "EACCES";
            }
            if (error) {
                env.err("rm: cannot remove '" + path + "': " + env.fs.message(error));
            } else {
                env.fs.remove(found.parent, found.name);
            }
        });
    }
});

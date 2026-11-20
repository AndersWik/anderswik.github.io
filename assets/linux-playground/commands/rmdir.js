// rmdir: remove empty folders. For folders with files in them, see rm -r.
Playground.register({
    name: "rmdir",
    usage: "rmdir folder",
    summary: "remove an empty folder",
    run: function (args, env) {
        if (!args.length) {
            env.err("rmdir: missing operand");
            return;
        }
        args.forEach(function (path) {
            const found = env.fs.lookup(path);
            let error = found.error;
            if (!error && found.node.type !== "dir") {
                error = "ENOTDIR";
            } else if (!error && env.fs.names(found.node).length) {
                error = "ENOTEMPTY";
            } else if (!error && (!found.parent || env.fs.holdsCwd(found.parts))) {
                error = "EBUSY";
            } else if (!error && !(env.fs.can(found.parent, "w") && env.fs.can(found.parent, "x"))) {
                error = "EACCES";
            } else if (!error && env.fs.stickyBlocks(found.parent, found.node)) {
                error = "EPERM";
            }
            if (error) {
                env.err("rmdir: failed to remove '" + path + "': " + env.fs.message(error));
            } else {
                env.fs.remove(found.parent, found.name);
            }
        });
    }
});

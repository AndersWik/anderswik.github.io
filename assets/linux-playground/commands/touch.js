// touch: make an empty file, or set an existing file's time to now.
Playground.register({
    name: "touch",
    usage: "touch file",
    summary: "make an empty file, or update its time",
    run: function (args, env) {
        if (!args.length) {
            env.err("touch: missing file operand");
            return;
        }
        args.forEach(function (path) {
            const found = env.fs.lookup(path);
            let error = null;
            if (found.node) {
                // Only someone who may write to the file, or owns it, may change its time.
                if (env.fs.can(found.node, "w") || found.node.owner === env.user) {
                    found.node.mtime = Date.now();
                } else {
                    error = "EACCES";
                }
            } else {
                error = env.fs.create(path, env.fs.newFile(""));
            }
            if (error) {
                env.err("touch: cannot touch '" + path + "': " + env.fs.message(error));
            }
        });
    }
});

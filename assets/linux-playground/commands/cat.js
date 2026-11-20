// cat: print files, one after the other (it is short for concatenate).
Playground.register({
    name: "cat",
    usage: "cat file",
    summary: "print a file",
    run: function (args, env) {
        if (!args.length) {
            env.err("cat: no file given (reading from the keyboard is not supported here)");
            return;
        }
        args.forEach(function (path) {
            const found = env.fs.lookup(path);
            let error = found.error;
            if (!error && found.node.type === "dir") {
                error = "EISDIR";
            } else if (!error && !env.fs.can(found.node, "r")) {
                error = "EACCES";
            }
            if (error) {
                env.err("cat: " + path + ": " + env.fs.message(error));
            } else {
                env.out(found.node.content);
            }
        });
    }
});

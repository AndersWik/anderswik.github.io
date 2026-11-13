// cd: change directory. cd alone goes home, cd .. goes up one folder.
Playground.register({
    name: "cd",
    usage: "cd [path]",
    summary: "change folder (cd .. goes up, cd alone goes home)",
    run: function (args, env) {
        if (args.length > 1) {
            env.err("bash: cd: too many arguments");
            return;
        }
        const target = args.length ? args[0] : env.home;
        const found = env.fs.lookup(target);
        let error = found.error;
        if (!error && found.node.type !== "dir") {
            error = "ENOTDIR";
        } else if (!error && !env.fs.can(found.node, "x")) {
            error = "EACCES";             // going into a folder needs x
        }
        if (error) {
            env.err("bash: cd: " + target + ": " + env.fs.message(error));
            return;
        }
        env.cd(found.parts);
    }
});

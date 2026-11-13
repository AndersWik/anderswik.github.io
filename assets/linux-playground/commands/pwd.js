// pwd: print working directory.
Playground.register({
    name: "pwd",
    usage: "pwd",
    summary: "print the folder you are in",
    run: function (args, env) {
        env.out(env.cwd + "\n");
    }
});

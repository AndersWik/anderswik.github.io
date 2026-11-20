// sudo: run the rest of the line as root. A real sudo asks for your
// password first, and checks that you are in the group sudo.
Playground.register({
    name: "sudo",
    usage: "sudo command",
    summary: "run a command as root",
    run: function (args, env) {
        if (!args.length) {
            env.err("usage: sudo command");
            return;
        }
        return env.execute(args, "root");
    }
});

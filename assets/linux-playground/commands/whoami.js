// whoami: print the user the command runs as. Try sudo whoami.
Playground.register({
    name: "whoami",
    usage: "whoami",
    summary: "print your user name",
    run: function (args, env) {
        env.out(env.user + "\n");
    }
});

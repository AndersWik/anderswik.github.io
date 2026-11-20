// history: list the commands typed so far, with numbers.
Playground.register({
    name: "history",
    usage: "history",
    summary: "list earlier commands",
    run: function (args, env) {
        env.history().forEach(function (line, index) {
            env.out(String(index + 1).padStart(5) + "  " + line + "\n");
        });
    }
});

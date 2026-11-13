// help: list every command, from what each command file registered.
Playground.register({
    name: "help",
    usage: "help",
    summary: "show this list",
    run: function (args, env) {
        env.out("Commands you can use:\n");
        env.commands().forEach(function (command) {
            if (command.name !== "help") {
                env.out("  " + command.usage.padEnd(20) + command.summary + "\n");
            }
        });
        env.out("A file can also be the target of > (write) and >> (add to the end).\n");
    }
});

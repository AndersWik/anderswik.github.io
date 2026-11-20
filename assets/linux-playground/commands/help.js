// help: list every command, from what each command file registered.
Playground.register({
    name: "help",
    usage: "help",
    summary: "show this list",
    run: function (args, env) {
        const commands = env.commands().filter(function (command) { return command.name !== "help"; });
        // The first column is as wide as the longest usage.
        const width = Math.max.apply(null, commands.map(function (command) { return command.usage.length; })) + 2;
        env.out("Commands you can use:\n");
        commands.forEach(function (command) {
            env.out("  " + command.usage.padEnd(width) + command.summary + "\n");
        });
        env.out("A file can also be the target of > (write) and >> (add to the end).\n");
    }
});

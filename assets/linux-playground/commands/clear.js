// clear: empty the screen. Ctrl+L does the same.
Playground.register({
    name: "clear",
    usage: "clear",
    summary: "clear the screen",
    run: function (args, env) {
        env.clearScreen();
    }
});

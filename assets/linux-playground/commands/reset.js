// reset: not a real Linux command. It puts every file and process back as
// they were when the playground started, from the files in data/.
Playground.register({
    name: "reset",
    usage: "reset",
    summary: "put every file and process back as it was",
    run: function (args, env) {
        env.reset();
        env.out("Every file and process is back as it was.\n", "info");
    }
});

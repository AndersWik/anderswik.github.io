// echo: print its words. With > file it writes them to a file instead,
// but that is the shell's work, not echo's.
Playground.register({
    name: "echo",
    usage: "echo text",
    summary: "print text, echo text > file writes it to a file",
    run: function (args, env) {
        const noNewline = args[0] === "-n";
        const words = noNewline ? args.slice(1) : args;
        env.out(words.join(" ") + (noNewline ? "" : "\n"));
    }
});

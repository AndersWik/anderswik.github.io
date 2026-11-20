// man: read the manual of a command, like man ls. The pages are the text
// files in pages/man/ on this site, so any command with a file there has
// a manual here, also commands the playground can't run yet.
//
// The page opens in a pager: scroll with the arrow keys, Space and b,
// and press q to go back to the terminal. With man ls > file the text is
// written to the file instead.

(function () {
    // Where Jekyll publishes pages/man/*.txt.
    const MAN_PATH = "/pages/man/";

    Playground.register({
        name: "man",
        usage: "man command",
        summary: "read the manual of a command (q to quit)",
        run: function (args, env) {
            // man 1 ls: the section number is allowed and not needed here.
            const names = args.filter(function (arg) { return !/^\d+$/.test(arg) && !arg.startsWith("-"); });
            if (!names.length) {
                env.err("What manual page do you want?\nFor example, try 'man man'.");
                return;
            }
            const name = names[0];
            // Only plain names, so man ../../something can't reach other files.
            if (!/^[A-Za-z0-9_.+-]+$/.test(name) || name.startsWith(".")) {
                env.err("No manual entry for " + name);
                return;
            }

            // Downloading takes a moment, so return the Promise: the shell
            // waits for it before it shows the prompt again.
            return fetch(MAN_PATH + name + ".txt")
                .then(function (response) { return response.ok ? response.text() : null; })
                .catch(function () { return null; })
                .then(function (text) {
                    if (text === null) {
                        env.err("No manual entry for " + name);
                        return;
                    }
                    if (!env.toTerminal) {
                        env.out(text);
                        return;
                    }
                    // The first line says the section, like "LS(1)  User Commands  LS(1)".
                    const section = /^\S+\((\w+)\)/.exec(text);
                    return env.pager(text, "Manual page " + name + "(" + (section ? section[1] : "1") + ")");
                });
        }
    });
})();

// apt (and apt-get): install software. The playground can't download
// anything, but it knows the packages in data/system.js, and what apt says.
//   sudo apt update                    get the list of what is new
//   sudo apt install mysql-server      install (here: it already is)

(function () {
    function run(args, env) {
        const action = args[0];
        const names = args.slice(1).filter(function (arg) { return !arg.startsWith("-"); });
        if (!["install", "update", "upgrade", "remove"].includes(action)) {
            env.err("The playground's apt can install, update and upgrade, like: sudo apt install mysql-server");
            return;
        }
        // Changing installed software needs root.
        if (env.user !== "root") {
            env.err("E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)");
            env.err("E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?");
            return;
        }
        const packages = env.system.packages;
        if (action === "update") {
            env.out("Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease\nHit:2 http://security.ubuntu.com/ubuntu noble-security InRelease\n" +
                "Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\nAll packages are up to date.\n");
            return;
        }
        if (action === "remove") {
            env.err("The playground doesn't remove packages.");
            return;
        }
        env.out("Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\n");
        for (const name of names) {
            if (!Object.hasOwn(packages, name)) {
                env.err("E: Unable to locate package " + name);
                return;
            }
            env.out(name + " is already the newest version (" + packages[name] + ").\n");
        }
        env.out("0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n");
    }

    Playground.register({ name: "apt", usage: "sudo apt install name", summary: "install software (needs sudo)", run: run });
    Playground.register({ name: "apt-get", usage: "sudo apt-get install name", summary: "the older name for apt", run: run });
})();

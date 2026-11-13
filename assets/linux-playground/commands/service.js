// service: start, stop and check the services in data/system.js.
//   service mysql status          is it running?
//   sudo service mysql stop       stop it: its processes go away (see ps aux)
//   sudo service mysql start      start it again, with new process ids
//   sudo service nginx reload     read the settings again, without stopping
//   service --status-all          + running, - stopped
// Only root may start and stop services, so they need sudo.

(function () {
    function hoursMinutes() {
        const now = new Date();
        return String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    }

    function running(system, name) {
        return system.processes.filter(function (p) { return p.service === name; });
    }

    // The first process is the main one, the others are its children.
    function start(system, name) {
        let mainPid = 1;
        system.services[name].processes.forEach(function (template, index) {
            const process = Object.assign({}, template, {
                pid: system.nextPid++,
                ppid: index === 0 ? 1 : mainPid,
                tty: "?",
                start: hoursMinutes(),
                time: "0:00",
                service: name
            });
            if (index === 0) {
                mainPid = process.pid;
            }
            system.processes.push(process);
        });
    }

    function stop(system, name) {
        system.processes = system.processes.filter(function (p) { return p.service !== name; });
    }

    Playground.register({
        name: "service",
        usage: "service name start|stop|status",
        summary: "start, stop or check a service, like mysql",
        run: function (args, env) {
            const system = env.system;
            const names = Object.keys(system.services).sort();

            if (args[0] === "--status-all") {
                names.forEach(function (name) {
                    env.out(" [ " + (running(system, name).length ? "+" : "-") + " ]  " + name + "\n");
                });
                return;
            }
            const name = args[0];
            const action = args[1];
            if (!name) {
                env.err("Usage: service < option > | --status-all | [ service_name [ command | --full-restart ] ]");
                return;
            }
            if (!Object.hasOwn(system.services, name)) {
                env.err(name + ": unrecognized service");
                return;
            }
            if (action === "status") {
                const processes = running(system, name);
                const main = processes[0];
                env.out((main ? "● " : "○ ") + name + ".service - " + system.services[name].description + "\n");
                env.out("     Loaded: loaded (/usr/lib/systemd/system/" + name + ".service; enabled; preset: enabled)\n");
                env.out("     Active: " + (main ? "active (running) since today " + main.start : "inactive (dead)") + "\n");
                if (main) {
                    env.out("   Main PID: " + main.pid + " (" + main.command.split(" ")[0].split("/").pop().replace(/:$/, "") + ")\n");
                }
                return;
            }
            if (!["start", "stop", "restart", "reload", "force-reload"].includes(action)) {
                env.err("Usage: service " + name + " {start|stop|restart|reload|status}");
                return;
            }
            if (env.user !== "root") {
                env.err("Failed to " + action + " " + name + ".service: Interactive authentication required.");
                env.err("See system logs and 'systemctl status " + name + ".service' for details.");
                return;
            }
            const isRunning = running(system, name).length > 0;
            if (action === "stop") {
                stop(system, name);
            } else if (action === "start") {
                if (!isRunning) {
                    start(system, name);
                }
            } else if (action === "restart") {
                stop(system, name);
                start(system, name);
            } else if (!isRunning) {
                env.err("Job for " + name + ".service failed because the service is not running.");
            }
            // reload on a running service: it reads its settings again, nothing to see.
        }
    });
})();

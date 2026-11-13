// mysql: the MySQL client. Logs in to the server in lib/mysql-server.js.
//   mysql -u root -p             log in, asks for the password (root)
//   mysql -u root -p shop        log in and use the database shop
//   sudo mysql                   log in as root without a password
//   mysql -u root -p db < f.sql  import a file, then come back
//   mysql -u root -p -e "sql"    run SQL, then come back
// Inside, it reads SQL until a ; and has a few commands of its own:
// exit, help, status, source file.sql, use db and \c.

(function () {
    function banner(server) {
        return "Welcome to the MySQL monitor.  Commands end with ; or \\g.\n" +
            "Your MySQL connection id is " + (8 + Math.floor(Math.random() * 40)) + "\n" +
            "Server version: " + server.version + " (Playground)\n\n" +
            "Type 'help;' or '\\h' for help. Type '\\c' to clear the current input statement.\n";
    }

    // source file.sql: run a file, read as the Linux user who started mysql.
    function source(env, server, mysql, session, path) {
        const found = env.fs.lookup(path || ".");
        if (!path || found.error || found.node.type !== "file" || !env.fs.can(found.node, "r")) {
            env.err("ERROR: Failed to open file '" + path + "', error: 2");
            return;
        }
        server.runScript(mysql, session, found.node.content, "interactive", env.out, env.err);
    }

    // What mysql does itself, before anything goes to the server.
    // Returns "exit", true if it was handled, or false.
    function clientCommand(env, server, mysql, session, line) {
        const text = line.trim().replace(/;$/, "").trim();
        const word = text.split(/\s+/)[0].toLowerCase();
        const rest = text.slice(word.length).trim();

        if (["exit", "quit", "\\q"].includes(word) && !rest) {
            env.out("Bye\n");
            return "exit";
        }
        if (["help", "\\h", "?", "\\?"].includes(word) && !rest) {
            env.out(server.help);
            return true;
        }
        if (["status", "\\s"].includes(word) && !rest) {
            env.out("--------------\nmysql  Ver " + server.version + " for Linux on x86_64 (Playground)\n\n" +
                "Current database:\t" + (session.database || "") + "\n" +
                "Current user:\t\t" + session.user + "@localhost\n" +
                "Server version:\t\t" + server.version + " (Playground)\n" +
                "--------------\n");
            return true;
        }
        if (["source", "\\."].includes(word)) {
            source(env, server, mysql, session, rest);
            return true;
        }
        // use works without ; because mysql reads it itself.
        if (word === "use" && rest && !line.includes(";")) {
            const name = rest.replace(/^`|`$/g, "");
            if (!server.hasDatabase(mysql, name)) {
                env.err("ERROR 1049 (42000): Unknown database '" + name + "'");
            } else {
                session.database = name;
                env.out("Database changed\n");
            }
            return true;
        }
        return false;
    }

    Playground.register({
        name: "mysql",
        usage: "mysql -u root -p [db]",
        summary: "log in to MySQL (the password is root)",
        run: async function (args, env) {
            const server = Playground.mysqlServer;
            const options = server.readOptions(args, "mysql");
            if (options.error) {
                env.err(options.error);
                return;
            }
            const user = await server.logIn(env, options);
            if (!user) {
                return;
            }
            const mysql = env.system.mysql;
            server.ensure(mysql);
            if (options.database && !server.hasDatabase(mysql, options.database)) {
                env.err("ERROR 1049 (42000): Unknown database '" + options.database + "'");
                return;
            }
            const session = { user: user, database: options.database || null };

            // mysql < file.sql or mysql -e "sql": run it and come back to the shell.
            if (env.stdin !== null || options.execute !== null) {
                const batch = env.stdin !== null;
                server.runScript(mysql, session, batch ? env.stdin : options.execute, batch ? "batch" : "execute", env.out, env.err);
                return;
            }

            env.out(banner(server));
            let buffer = "";                // lines of a statement that has no ; yet
            for (;;) {
                const open = buffer ? server.sqlTokens(buffer).open : null;
                const prompt = !buffer ? "mysql> " : "    " + (open || "-") + "> ";
                const line = await env.readLine({
                    prompt: prompt,
                    complete: function (word) { return server.completions(mysql, session, word); }
                });
                if (line === null) {
                    buffer = "";            // Ctrl+C drops the statement, mysql keeps running
                    continue;
                }
                // \c anywhere throws away what has been typed so far.
                if (/\\c\s*$/.test(line)) {
                    buffer = "";
                    continue;
                }
                if (!buffer) {
                    const handled = clientCommand(env, server, mysql, session, line);
                    if (handled === "exit") {
                        return;
                    }
                    if (handled) {
                        continue;
                    }
                }
                buffer += line + "\n";
                const split = server.splitStatements(buffer);
                if (split.open) {
                    continue;               // a quote is still open, keep reading
                }
                // Run every statement that has its ;, keep the rest for the next line.
                const done = split.statements.filter(function (statement) { return statement.complete; });
                const rest = split.statements.find(function (statement) { return !statement.complete; });
                buffer = rest ? rest.text + "\n" : "";
                done.forEach(function (statement) {
                    try {
                        server.runStatement(mysql, session, statement, "interactive", env.out);
                    } catch (error) {
                        if (!(error instanceof server.SqlError)) {
                            throw error;
                        }
                        env.err(server.errorText(error));
                    }
                });
            }
        }
    });
})();

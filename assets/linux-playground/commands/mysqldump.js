// mysqldump: export a database as SQL that builds it again.
//   mysqldump -u root -p shop > shop.sql          the whole database
//   mysqldump -u root -p shop users > users.sql   only some tables
// Import it again with: mysql -u root -p otherdb < shop.sql
Playground.register({
    name: "mysqldump",
    usage: "mysqldump -u root -p db > file.sql",
    summary: "export a database to a file",
    run: async function (args, env) {
        const server = Playground.mysqlServer;
        const options = server.readOptions(args, "mysqldump");
        if (options.error) {
            env.err(options.error);
            return;
        }
        if (!options.database) {
            env.err("Usage: mysqldump [OPTIONS] database [tables]");
            return;
        }
        const user = await server.logIn(env, options);
        if (!user) {
            return;
        }
        const mysql = env.system.mysql;
        server.ensure(mysql);
        if (!server.hasDatabase(mysql, options.database)) {
            env.err("mysqldump: Got error: 1049: Unknown database '" + options.database + "' when selecting the database");
            return;
        }
        const tables = server.tableNames(mysql, options.database);
        const names = options.tables.length ? options.tables : tables;
        const missing = names.find(function (name) { return !tables.includes(name); });
        if (missing) {
            env.err("mysqldump: Couldn't find table: \"" + missing + "\"");
            return;
        }
        env.out(server.dump(mysql, options.database, names));
    }
});

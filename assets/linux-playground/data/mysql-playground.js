/*
 * Extra files for the MySQL Playground page, on top of data/filesystem.js:
 * an example dump to import, and its own welcome message.
 */

Playground.addFiles([
    { path: "/etc/motd", owner: "root", mode: "644", content: "Welcome to the MySQL playground!\nLog in with: mysql -u root -p   (the password is root)\nType help to see the commands you can use.\n" },
    { path: "/home/user/books.sql", owner: "user", mode: "644", content: [
        "-- Books for a library database.",
        "-- Make the database first (in mysql):  create database library;",
        "-- Then import this file (in the shell): mysql -u root -p library < books.sql",
        "",
        "CREATE TABLE books (",
        "    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,",
        "    title VARCHAR(200) NOT NULL,",
        "    author VARCHAR(100),",
        "    year INT",
        ");",
        "",
        "INSERT INTO books (title, author, year) VALUES",
        "    ('The Hobbit', 'J.R.R. Tolkien', 1937),",
        "    ('Pippi Longstocking', 'Astrid Lindgren', 1945),",
        "    ('Dune', 'Frank Herbert', 1965),",
        "    ('The Pragmatic Programmer', 'Andrew Hunt', 1999);",
        ""
    ].join("\n") }
]);

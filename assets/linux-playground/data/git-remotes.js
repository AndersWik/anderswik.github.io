/*
 * Repositories on the playground's pretend GitHub, for git clone, fetch,
 * pull and push. Each is made the first time it is used, from commits with
 * fixed dates, so the commit ids are always the same.
 *
 * Any other github.com address works too: push to it and it is made, like
 * a new empty repository made on GitHub's web page.
 */

Playground.git.defineRemote("https://github.com/anderswik/playground.git", function (repo) {
    const anders = "Anders Wik <anders@example.com>";
    const anna = "Anna Berg <anna@example.com>";
    const erik = "Erik Lund <erik@example.com>";

    const first = repo.commit({
        message: "Initial commit", author: anders, date: "2026-10-01T09:00:00",
        files: { "README.md": "# Playground\n\nA small project to practise Git on.\n" }
    });
    const notes = repo.commit({
        parent: first, message: "Add notes about Git", author: anna, date: "2026-10-02T10:30:00",
        files: { "notes.txt": "Git notes\n\n1. git status shows what has changed\n2. git add puts changes in the staging area\n3. git commit saves them\n" }
    });
    const app = repo.commit({
        parent: notes, message: "Add the app", author: anders, date: "2026-10-05T14:00:00",
        files: {
            "src/app.js": "// The app starts here.\nfunction start() {\n    console.log(\"Hello from the playground!\");\n}\n\nstart();\n",
            ".gitignore": "*.log\nnode_modules/\n"
        }
    });
    repo.tag("v1.0", app, { message: "First release", tagger: anders, date: "2026-10-05T15:00:00" });

    // A branch someone else is working on.
    const login = repo.commit({
        parent: app, message: "Add login page", author: erik, date: "2026-10-08T11:00:00",
        files: { "src/login.js": "// The login page.\nfunction login(name) {\n    return \"Welcome, \" + name + \"!\";\n}\n" }
    });
    const useLogin = repo.commit({
        parent: login, message: "Show the login page from the app", author: erik, date: "2026-10-09T16:20:00",
        files: { "src/app.js": "// The app starts here.\nfunction start() {\n    console.log(\"Hello from the playground!\");\n    console.log(login(\"Anna\"));\n}\n\nstart();\n" }
    });
    repo.branch("new-feature", useLogin);

    // main moved on after the playground's copy was cloned: git fetch shows it.
    const typo = repo.commit({
        parent: app, message: "Fix typo in README", author: anna, date: "2026-10-12T09:45:00",
        files: { "README.md": "# Playground\n\nA small project to practise Git in.\n" }
    });
    repo.branch("main", typo);
});

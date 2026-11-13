/*
 * The Git Playground page: who you are in Git, and a repository in
 * ~/project to start in. It is made by running git commands, the same as a
 * person could type, when the page is first opened and after reset:
 *
 *   - cloned from the pretend GitHub (data/git-remotes.js) a while ago, so
 *     main is one commit behind GitHub: try git fetch and git status
 *   - one commit of your own that isn't pushed yet
 *   - a branch typo-fix that changes the same line: git merge typo-fix
 *     gives a conflict to fix
 *   - a change to README.md that isn't committed, and a new file todo.txt
 */

Playground.addFiles([
    { path: "/etc/motd", owner: "root", mode: "644", content: "Welcome to the Git playground!\nYou are in a Git repository, ~/project. Try git status and git log --oneline --graph --all\nType help to see the commands you can use.\n" },
    { path: "/home/user/.gitconfig", owner: "user", mode: "644", content: "[user]\n\tname = Playground User\n\temail = user@example.com\n[init]\n\tdefaultBranch = main\n[pull]\n\trebase = false\n" }
]);

Playground.setup(function (env) {
    const git = Playground.git;
    const write = function (path, content) { git.writeFile(env, path, content); };

    git.setClock("2026-10-10T08:00:00");
    git.run(["clone", "https://github.com/anderswik/playground.git", "project"], env);
    env.cd(env.fs.split("/home/user/project"));
    const project = git.findRepo(Object.assign({}, env, { cwd: "/home/user/project" }));
    const inProject = Object.assign({}, env, { cwd: "/home/user/project" });

    // Cloned before "Fix typo in README" was pushed: main and origin/main one step back.
    git.run(["reset", "--hard", "HEAD~1"], inProject);
    project.state.refs["refs/remotes/origin/main"] = project.state.refs["refs/heads/main"];
    project.state.reflog = project.state.reflog.slice(-1);

    // A branch that changes the same line as main is about to.
    git.setClock("2026-11-09T14:00:00");
    git.run(["switch", "-c", "typo-fix"], inProject);
    write("/home/user/project/notes.txt", "Git notes\n\n1. git status shows what has changed\n2. git add puts changes in the staging area\n3. git commit stores them\n");
    git.run(["commit", "-am", "Shorter text for git commit"], inProject);
    git.run(["switch", "main"], inProject);

    // A commit of your own, not pushed yet.
    git.setClock("2026-11-10T09:00:00");
    write("/home/user/project/notes.txt", "Git notes\n\n1. git status shows what has changed\n2. git add puts changes in the staging area\n3. git commit saves them in the history\n");
    git.run(["commit", "-am", "Explain git commit better"], inProject);

    // Work in progress.
    write("/home/user/project/README.md", "# Playground\n\nA small project to practise Git on.\n\nRun the app with: node src/app.js\n");
    write("/home/user/project/todo.txt", "- learn git stash\n- learn git rebase\n");
    git.setClock(null);
});

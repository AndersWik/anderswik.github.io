/*
 * The files and folders the Linux Playground starts with, and goes back to
 * with the command reset. A small but typical Linux installation.
 *
 * Each line is one file or folder:
 *   path     where it is. A folder must come before what is in it.
 *   type     "dir" for a folder, left out for a file
 *   owner    who owns it (group is the same, unless group is given)
 *   mode     permissions in octal, like "644" or "755" (see chmod)
 *   content  what a file holds
 */

// The programs in /bin are only there to look at, the commands themselves
// are in commands/*.js.
function playgroundProgram(path) {
    return { path: path, owner: "root", mode: "755", content: "(a program)\n" };
}

Playground.defineFileSystem([
    { path: "/bin", type: "dir", owner: "root", mode: "755" },
    ...["bash", "cat", "chmod", "echo", "ls", "mkdir", "pwd", "rm", "rmdir", "touch"].map(function (name) {
        return playgroundProgram("/bin/" + name);
    }),

    { path: "/boot", type: "dir", owner: "root", mode: "755" },
    { path: "/boot/vmlinuz", owner: "root", mode: "600", content: "(the Linux kernel)\n" },

    { path: "/dev", type: "dir", owner: "root", mode: "755" },
    { path: "/dev/null", owner: "root", mode: "666", content: "" },

    { path: "/etc", type: "dir", owner: "root", mode: "755" },
    { path: "/etc/hostname", owner: "root", mode: "644", content: "playground\n" },
    { path: "/etc/hosts", owner: "root", mode: "644", content: "127.0.0.1\tlocalhost\n127.0.1.1\tplayground\n" },
    { path: "/etc/motd", owner: "root", mode: "644", content: "Welcome to the Linux playground!\nType help to see the commands you can use.\n" },
    { path: "/etc/os-release", owner: "root", mode: "644", content: "NAME=\"Playground Linux\"\nVERSION=\"1.0\"\nID=playground\nPRETTY_NAME=\"Playground Linux 1.0\"\n" },
    { path: "/etc/passwd", owner: "root", mode: "644", content: "root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:User:/home/user:/bin/bash\n" },
    { path: "/etc/shadow", owner: "root", group: "shadow", mode: "640", content: "root:*:20000:0:99999:7:::\nuser:$y$j9T$notarealhash:20000:0:99999:7:::\n" },

    { path: "/home", type: "dir", owner: "root", mode: "755" },
    { path: "/home/user", type: "dir", owner: "user", mode: "755" },
    { path: "/home/user/.bashrc", owner: "user", mode: "644", content: "# Runs every time you open a terminal.\nalias ll='ls -l'\n" },
    { path: "/home/user/hello.txt", owner: "user", mode: "644", content: "Hello, world!\n" },
    { path: "/home/user/Documents", type: "dir", owner: "user", mode: "755" },
    { path: "/home/user/Documents/notes.txt", owner: "user", mode: "644", content: "Things to learn:\n- cd and ls\n- touch and rm\n- chmod and sudo\n" },
    { path: "/home/user/Downloads", type: "dir", owner: "user", mode: "755" },
    { path: "/home/user/Downloads/photo.jpg", owner: "user", mode: "644", content: "(a picture)\n" },
    { path: "/home/user/Pictures", type: "dir", owner: "user", mode: "755" },

    { path: "/root", type: "dir", owner: "root", mode: "700" },
    { path: "/root/secret.txt", owner: "root", mode: "600", content: "Only root can read this.\n" },

    // 1777: everyone may write, and the 1 (the sticky bit) means only the
    // owner of a file may remove it.
    { path: "/tmp", type: "dir", owner: "root", mode: "1777" },

    { path: "/usr", type: "dir", owner: "root", mode: "755" },
    { path: "/usr/bin", type: "dir", owner: "root", mode: "755" },
    ...["df", "free", "kill", "nano", "ps", "python3", "uname"].map(function (name) {
        return playgroundProgram("/usr/bin/" + name);
    }),
    { path: "/usr/share", type: "dir", owner: "root", mode: "755" },
    { path: "/usr/share/doc", type: "dir", owner: "root", mode: "755" },

    { path: "/var", type: "dir", owner: "root", mode: "755" },
    { path: "/var/log", type: "dir", owner: "root", mode: "755" },
    { path: "/var/log/syslog", owner: "root", group: "adm", mode: "640", content: "Nov 13 08:00:01 playground systemd[1]: Started the playground.\n" },
    { path: "/var/www", type: "dir", owner: "root", mode: "755" },
    { path: "/var/www/html", type: "dir", owner: "root", mode: "755" },
    { path: "/var/www/html/index.html", owner: "root", mode: "644", content: "<h1>It works!</h1>\n" }
]);

/*
 * The Linux Playground's made-up server. Commands read it from env.system,
 * and some change it: kill removes processes, and free then shows less
 * memory used. It is saved with the files, and reset puts it back as here.
 *
 * Raise version when this file changes, so browsers that saved the old
 * server get the new one.
 */

Playground.defineSystem({
    version: 2,

    hostname: "playground",
    login: "user",

    // Each user's home folder and groups. Being in a file's group gives the
    // middle three permission bits (see chmod). Being in the group sudo is
    // what lets a user run sudo.
    users: {
        root: { home: "/root", groups: ["root"] },
        user: { home: "/home/user", groups: ["user", "sudo"] }
    },

    // What uname prints.
    kernel: {
        name: "Linux",
        release: "6.8.0-45-generic",
        version: "#45-Ubuntu SMP PREEMPT_DYNAMIC Fri Aug 30 12:02:04 UTC 2024",
        machine: "x86_64",
        os: "GNU/Linux"
    },

    // Memory in KiB (1 KiB = 1024 bytes). "used" is not stored: it is
    // kernelUsed plus the memory (rss) of every process, so it goes down
    // when a process is killed.
    memory: {
        total: 8135468,
        kernelUsed: 1052400,
        shared: 45312,
        buffCache: 2412516,
        swapTotal: 2097148,
        swapUsed: 0
    },

    // Mounted file systems, sizes in KiB, for df. A disk keeps about 5% free
    // for root (on ext4), so Size - Used is more than Avail.
    disks: [
        { filesystem: "udev", type: "devtmpfs", size: 4033384, used: 0, mount: "/dev", inodes: 1008346, inodesUsed: 612 },
        { filesystem: "tmpfs", type: "tmpfs", size: 813548, used: 1180, mount: "/run", inodes: 1016933, inodesUsed: 1020 },
        { filesystem: "/dev/sda1", type: "ext4", size: 50620216, used: 14210004, mount: "/", inodes: 3227648, inodesUsed: 412873, reserved: true },
        { filesystem: "tmpfs", type: "tmpfs", size: 4067732, used: 0, mount: "/dev/shm", inodes: 1016933, inodesUsed: 1 },
        { filesystem: "tmpfs", type: "tmpfs", size: 5120, used: 4, mount: "/run/lock", inodes: 1016933, inodesUsed: 3 },
        { filesystem: "/dev/sda15", type: "vfat", size: 106832, used: 6182, mount: "/boot/efi", inodes: 0, inodesUsed: 0 },
        { filesystem: "/dev/sdb1", type: "ext4", size: 102626232, used: 23456780, mount: "/home", inodes: 6553600, inodesUsed: 18243, reserved: true },
        { filesystem: "tmpfs", type: "tmpfs", size: 813544, used: 16, mount: "/run/user/1000", inodes: 203386, inodesUsed: 25 }
    ],

    // Running processes, for ps and kill.
    //   pid / ppid  the process's id, and the id of the process that started it
    //   cpu         % of one CPU it uses
    //   vsz / rss   memory it has asked for / memory it really uses, in KiB
    //   tty         the terminal it belongs to, ? for none (services)
    //   stat        S sleeping, R running, I idle kernel thread, s session
    //               leader, l threads, < high priority, + in the foreground
    //   start/time  when it started, and how much CPU time it has used (m:ss)
    // And how it reacts to signals (see kill):
    //   init     pid 1: the kernel never lets it be killed
    //   kernel   a kernel thread: signals do nothing
    //   session  part of your login: killing it would close the terminal
    //   reload   HUP makes it read its settings again instead of stopping
    //   stopsChildren  when it is stopped politely (not with kill -9) it
    //            stops the processes it started. Other children live on,
    //            and pid 1 becomes their parent.
    processes: [
        { pid: 1, ppid: 0, user: "root", cpu: 0.0, vsz: 167732, rss: 13056, tty: "?", stat: "Ss", start: "08:00", time: "0:02", command: "/sbin/init splash", init: true },
        { pid: 2, ppid: 0, user: "root", cpu: 0.0, vsz: 0, rss: 0, tty: "?", stat: "S", start: "08:00", time: "0:00", command: "[kthreadd]", kernel: true },
        { pid: 3, ppid: 2, user: "root", cpu: 0.0, vsz: 0, rss: 0, tty: "?", stat: "I<", start: "08:00", time: "0:00", command: "[rcu_gp]", kernel: true },
        { pid: 14, ppid: 2, user: "root", cpu: 0.0, vsz: 0, rss: 0, tty: "?", stat: "I", start: "08:00", time: "0:01", command: "[rcu_sched]", kernel: true },
        { pid: 236, ppid: 1, user: "root", cpu: 0.0, vsz: 48128, rss: 16384, tty: "?", stat: "S<s", start: "08:00", time: "0:01", command: "/lib/systemd/systemd-journald" },
        { pid: 268, ppid: 1, user: "root", cpu: 0.0, vsz: 25812, rss: 6912, tty: "?", stat: "Ss", start: "08:00", time: "0:00", command: "/lib/systemd/systemd-udevd" },
        { pid: 512, ppid: 1, user: "syslog", cpu: 0.0, vsz: 222400, rss: 5888, tty: "?", stat: "Ssl", start: "08:00", time: "0:00", command: "/usr/sbin/rsyslogd -n -iNONE", reload: true },
        { pid: 530, ppid: 1, user: "root", cpu: 0.0, vsz: 7272, rss: 2816, tty: "?", stat: "Ss", start: "08:00", time: "0:00", command: "/usr/sbin/cron -f" },
        { pid: 611, ppid: 1, user: "root", cpu: 0.0, vsz: 15432, rss: 8960, tty: "?", stat: "Ss", start: "08:00", time: "0:00", command: "sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups", reload: true },
        { pid: 702, ppid: 1, user: "mysql", cpu: 0.8, vsz: 2443560, rss: 409600, tty: "?", stat: "Ssl", start: "08:00", time: "1:12", command: "/usr/sbin/mysqld" },
        { pid: 745, ppid: 1, user: "root", cpu: 0.0, vsz: 55228, rss: 2432, tty: "?", stat: "Ss", start: "08:00", time: "0:00", command: "nginx: master process /usr/sbin/nginx -g daemon on; master_process on;", reload: true, stopsChildren: true },
        { pid: 746, ppid: 745, user: "www-data", cpu: 0.0, vsz: 55860, rss: 5632, tty: "?", stat: "S", start: "08:00", time: "0:00", command: "nginx: worker process" },
        { pid: 747, ppid: 745, user: "www-data", cpu: 0.0, vsz: 55860, rss: 5632, tty: "?", stat: "S", start: "08:00", time: "0:00", command: "nginx: worker process" },
        { pid: 1201, ppid: 611, user: "root", cpu: 0.0, vsz: 17120, rss: 11008, tty: "?", stat: "Ss", start: "09:12", time: "0:00", command: "sshd: user [priv]", session: true },
        { pid: 1230, ppid: 1201, user: "user", cpu: 0.0, vsz: 17380, rss: 7040, tty: "?", stat: "S", start: "09:12", time: "0:00", command: "sshd: user@pts/0", session: true },
        { pid: 1231, ppid: 1230, user: "user", cpu: 0.0, vsz: 8784, rss: 5376, tty: "pts/0", stat: "Ss", start: "09:12", time: "0:00", command: "-bash", session: true, shell: true },
        { pid: 4321, ppid: 1231, user: "user", cpu: 2.3, vsz: 1021868, rss: 95232, tty: "pts/0", stat: "Sl", start: "09:30", time: "0:41", command: "node server.js" }
    ],

    // The next free process id. ps uses one each time it runs.
    nextPid: 5012
});

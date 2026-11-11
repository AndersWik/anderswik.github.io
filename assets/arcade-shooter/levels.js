/*
 * The levels of the arcade shooter.
 *
 * background  the picture behind everything
 * enemies     pictures of targets to shoot
 * civilians   pictures of targets NOT to shoot
 * spots       where targets can pop up. A target in a "door" is shown
 *             full size, in a "window" only the top half (the "half" picture).
 * targets     how many targets pop up during the level
 * interval    milliseconds between two targets
 */

const LEVELS = [
    {
        background: "snow_level.png",
        enemies: [
            { half: "enemy1_half.png", full: "enemy1_full.png" },
            { half: "enemy2_half.png", full: "enemy2_full.png" },
            { half: "enemy3_half.png", full: "enemy3_full.png" },
            { half: "enemy4_half.png", full: "enemy4_full.png" }
        ],
        civilians: [
            { half: "civilian1_half.png", full: "civilian1_full.png" },
            { half: "civilian2_half.png", full: "civilian2_full.png" }
        ],
        spots: [
            { x: 220, y: 120, place: "door" },
            { x: 480, y: 120, place: "door" },
            { x: 170, y: 250, place: "door" },
            { x: 500, y: 250, place: "door" },
            { x: 170, y: 400, place: "door" },
            { x: 520, y: 400, place: "door" }
        ],
        targets: 10,
        interval: 1000
    },
    {
        background: "pirate_level.png",
        enemies: [
            { half: "pirate_enemy1_full.png", full: "pirate_enemy1_full.png" },
            { half: "pirate_enemy2_full.png", full: "pirate_enemy2_full.png" },
            { half: "pirate_enemy3_full.png", full: "pirate_enemy3_full.png" },
            { half: "pirate_enemy4_full.png", full: "pirate_enemy4_full.png" }
        ],
        civilians: [
            { half: "civilian1_half.png", full: "civilian1_full.png" },
            { half: "civilian2_half.png", full: "civilian2_full.png" }
        ],
        spots: [
            { x: 150, y: 155, place: "door" },
            { x: 360, y: 230, place: "door" },
            { x: 560, y: 180, place: "door" },
            { x: 175, y: 345, place: "window" },
            { x: 320, y: 345, place: "window" },
            { x: 455, y: 345, place: "window" }
        ],
        targets: 10,
        interval: 1000
    },
    {
        background: "house_level.png",
        enemies: [
            { half: "enemy1_half.png", full: "enemy1_full.png" },
            { half: "enemy2_half.png", full: "enemy2_full.png" },
            { half: "enemy3_half.png", full: "enemy3_full.png" },
            { half: "enemy4_half.png", full: "enemy4_full.png" }
        ],
        civilians: [
            { half: "civilian1_half.png", full: "civilian1_full.png" },
            { half: "civilian2_half.png", full: "civilian2_full.png" }
        ],
        spots: [
            { x: 170, y: 155, place: "window" },
            { x: 360, y: 155, place: "window" },
            { x: 560, y: 155, place: "window" },
            { x: 170, y: 305, place: "window" },
            { x: 360, y: 305, place: "window" },
            { x: 550, y: 305, place: "window" },
            { x: 170, y: 460, place: "door" },
            { x: 550, y: 460, place: "door" }
        ],
        targets: 10,
        interval: 1000
    }
];

/*
 * The 20 holes of Mini Golf. The canvas is 800 x 400 pixels.
 *
 * Every rectangle is written as its corners: [left, top, right, bottom].
 *
 *   name     shown at the top of the screen
 *   par      how many strokes a good player needs
 *   start    where the ball starts, [x, y]
 *   hole     where the hole is, [x, y]
 *   course   the outline of the green, a list of corners [x, y].
 *            The last corner joins the first. box() makes a rectangle.
 *   blocks   solid rectangles the ball bounces off
 *   walls    thin walls from one point to another, [x1, y1, x2, y2]
 *   bumpers  round bumpers that bounce harder, [x, y, radius]
 *   sand     rectangles that slow the ball down a lot
 *   water    rectangles: one stroke penalty, and the ball goes back
 *   movers   blocks that slide to and fro:
 *              rect   where it is in the middle of its way
 *              axis   "x" (left and right) or "y" (up and down)
 *              range  how far it goes each way, in pixels
 *              speed  how fast, in radians each step (0.05 is a trip in 2 seconds)
 *              phase  where in its trip it starts (optional)
 *   windmills  blades that turn round a point:
 *              x, y   the middle
 *              radius how long each blade is
 *              blades how many blades go right through the middle (2 = a plus)
 *              speed  how fast it turns, in radians each step (minus = the other way)
 */

// A rectangle as a list of its four corners, for a course outline.
function box(left, top, right, bottom) {
    return [[left, top], [right, top], [right, bottom], [left, bottom]];
}

const LEVELS = [
    {
        name: "Straight ahead",
        par: 2,
        start: [170, 200],
        hole: [630, 200],
        course: box(100, 130, 700, 270)
    },
    {
        name: "Under the wall",
        par: 3,
        start: [150, 120],
        hole: [650, 120],
        course: box(60, 60, 740, 340),
        blocks: [[380, 60, 420, 250]]
    },
    {
        name: "Around the corner",
        par: 3,
        start: [200, 110],
        hole: [680, 300],
        course: [[60, 50], [340, 50], [340, 250], [740, 250], [740, 350], [60, 350]]
    },
    {
        name: "Bumper alley",
        par: 3,
        start: [120, 200],
        hole: [690, 200],
        course: box(60, 60, 740, 340),
        bumpers: [[300, 140, 22], [300, 260, 22], [450, 200, 28], [600, 120, 22], [600, 280, 22]]
    },
    {
        name: "Sand trap",
        par: 3,
        start: [120, 200],
        hole: [660, 200],
        course: box(60, 100, 740, 300),
        sand: [[300, 100, 480, 300]]
    },
    {
        name: "Water hazard",
        par: 3,
        start: [120, 290],
        hole: [670, 110],
        course: box(60, 60, 740, 340),
        water: [[250, 60, 370, 250], [430, 150, 550, 340]]
    },
    {
        name: "Zigzag",
        par: 4,
        start: [120, 100],
        hole: [670, 90],
        course: box(60, 40, 740, 360),
        blocks: [[200, 40, 230, 280], [380, 120, 410, 360], [560, 40, 590, 280]]
    },
    {
        name: "The funnel",
        par: 2,
        start: [120, 200],
        hole: [660, 200],
        course: box(60, 60, 740, 340),
        walls: [[300, 60, 500, 170], [300, 340, 500, 230]]
    },
    {
        name: "The gate",
        par: 2,
        start: [130, 200],
        hole: [670, 200],
        course: box(60, 100, 740, 300),
        blocks: [[390, 100, 410, 160], [390, 240, 410, 300]],
        movers: [{ rect: [388, 185, 412, 215], axis: "y", range: 30, speed: 0.04 }]
    },
    {
        name: "Island green",
        par: 2,
        start: [120, 200],
        hole: [570, 200],
        course: box(60, 60, 740, 340),
        water: [[450, 60, 740, 165], [450, 235, 740, 340], [660, 165, 740, 235]]
    },
    {
        name: "U-turn",
        par: 3,
        start: [120, 107],
        hole: [120, 293],
        course: box(60, 40, 740, 360),
        blocks: [[60, 175, 620, 225]]
    },
    {
        name: "Pinball",
        par: 3,
        start: [110, 200],
        hole: [690, 200],
        course: box(60, 40, 740, 360),
        bumpers: [
            [220, 110, 20], [220, 290, 20], [320, 200, 20], [420, 110, 20],
            [420, 290, 20], [520, 200, 20], [620, 110, 20], [620, 290, 20]
        ]
    },
    {
        name: "Sand and water",
        par: 3,
        start: [120, 200],
        hole: [640, 200],
        course: box(60, 40, 740, 360),
        water: [[300, 40, 380, 175], [300, 225, 380, 360]],
        sand: [[560, 120, 720, 280]]
    },
    {
        name: "The maze",
        par: 4,
        start: [110, 320],
        hole: [690, 320],
        course: box(60, 40, 740, 360),
        blocks: [[180, 40, 200, 270], [320, 130, 340, 360], [460, 40, 480, 270], [600, 130, 620, 360]]
    },
    {
        name: "Traffic",
        par: 2,
        start: [110, 200],
        hole: [690, 200],
        course: box(60, 140, 740, 260),
        movers: [
            { rect: [240, 180, 260, 220], axis: "y", range: 40, speed: 0.05 },
            { rect: [490, 180, 510, 220], axis: "y", range: 40, speed: 0.07, phase: 1.5 }
        ]
    },
    {
        name: "Diamond",
        par: 3,
        start: [110, 200],
        hole: [690, 200],
        course: box(60, 60, 740, 340),
        walls: [[330, 200, 400, 130], [400, 130, 470, 200], [470, 200, 400, 270], [400, 270, 330, 200]],
        bumpers: [[570, 130, 16], [570, 270, 16]]
    },
    {
        name: "Back door",
        par: 3,
        start: [120, 200],
        hole: [630, 200],
        course: box(60, 40, 740, 360),
        blocks: [[560, 110, 580, 290], [560, 110, 690, 130], [560, 270, 690, 290]]
    },
    {
        name: "The bridge",
        par: 3,
        start: [110, 200],
        hole: [680, 300],
        course: box(60, 40, 740, 360),
        water: [[330, 40, 470, 175], [330, 225, 470, 360]],
        bumpers: [[580, 200, 18]]
    },
    {
        name: "Windmill",
        par: 3,
        start: [120, 200],
        hole: [660, 200],
        course: box(60, 100, 740, 300),
        blocks: [[390, 100, 410, 170], [390, 230, 410, 300]],
        windmills: [{ x: 310, y: 200, radius: 55, blades: 2, speed: 0.03 }]
    },
    {
        name: "Grand finale",
        par: 4,
        start: [110, 120],
        hole: [580, 320],
        course: [[60, 40], [740, 40], [740, 360], [420, 360], [420, 200], [60, 200]],
        water: [[230, 40, 300, 110]],
        bumpers: [[330, 150, 16]],
        sand: [[500, 290, 660, 350]],
        windmills: [{ x: 580, y: 190, radius: 50, blades: 2, speed: -0.025 }]
    }
];

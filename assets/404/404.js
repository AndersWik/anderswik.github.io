/*
 * Show the address the visitor asked for, and the page with the most
 * similar address, in case of a typo or an old link.
 */

// Every page on the site. Jekyll writes them into the 404 page, one per line,
// because Liquid doesn't run in a .js file without front matter.
const PAGES = document.getElementById("site-pages").textContent
    .split("\n")
    .map(function (line) { return line.trim(); })
    .filter(function (line) { return line !== ""; });

// "/Games/MineSweeper.html/" -> "/games/minesweeper"
function clean(path) {
    return path.toLowerCase().replace(/\/index\.html$/, "/").replace(/\.html$/, "").replace(/\/+$/, "");
}

// The last part of a path: "/games/minesweeper" -> "minesweeper"
function lastPart(path) {
    return path.split("/").pop();
}

// How many letters to add, remove or change to turn one word into the other
// (the Levenshtein distance). "gmaes" -> "games" is 2.
function editDistance(a, b) {
    let previous = Array.from({ length: b.length + 1 }, function (_, i) { return i; });
    for (let i = 1; i <= a.length; i++) {
        const current = [i];
        for (let j = 1; j <= b.length; j++) {
            const change = a[i - 1] === b[j - 1] ? 0 : 1;
            current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + change);
        }
        previous = current;
    }
    return previous[b.length];
}

// How different two texts are, from 0 (the same) to 1 (nothing alike).
// 2 wrong letters in a long address matter less than in a short one.
function difference(a, b) {
    return editDistance(a, b) / Math.max(a.length, b.length, 1);
}

// The page whose address is most like the one asked for, or null.
// A page that was moved to another folder is found by its last part,
// "/minesweeper" -> "/games/minesweeper/".
function closestPage(wanted) {
    let best = null;
    let bestScore = Infinity;
    PAGES.forEach(function (url) {
        const candidate = clean(url);
        let score = difference(wanted, candidate);
        if (lastPart(wanted) && lastPart(candidate)) {
            // A little worse than a full match, so the right folder wins a tie.
            score = Math.min(score, difference(lastPart(wanted), lastPart(candidate)) + 0.05);
        }
        if (score < bestScore) {
            best = url;
            bestScore = score;
        }
    });
    // More than about a quarter wrong is no help.
    return bestScore <= 0.3 ? best : null;
}

// decodeURIComponent turns "%20" back into a space. textContent (not
// innerHTML) so nobody can put HTML into the page through a link.
let path = window.location.pathname;
try {
    path = decodeURIComponent(path);
} catch (error) {
    // A broken %-code: show it as it is.
}
document.getElementById("wanted-path").textContent = path;
document.getElementById("error-path").textContent = path;

const suggestion = closestPage(clean(path));
if (suggestion) {
    const link = document.getElementById("suggestion");
    link.href = suggestion;
    link.textContent = suggestion;
    document.getElementById("suggestion-row").hidden = false;
}

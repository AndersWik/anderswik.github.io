/*
 * What week is it?
 *
 * Sweden (and most of Europe) uses ISO week numbers:
 *   - weeks start on Monday
 *   - week 1 is the week that has the year's first Thursday in it
 *
 * So the easy way to find the week number of a date is:
 *   1. find the Thursday in the same week (Monday-Sunday)
 *   2. count which Thursday of its year that is
 */

// --- Elements on the page ------------------------------------------------

const weekNumber = document.getElementById("number");

// --- Helpers -------------------------------------------------------------

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getWeekNumber(date) {
    // Copy the date (at midnight) so we don't change the original.
    const thursday = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // getDay() gives Sunday = 0 ... Saturday = 6.
    // Change it to Monday = 0 ... Sunday = 6.
    const dayOfWeek = (thursday.getDay() + 6) % 7;

    // Step back to Monday, then forward 3 days to Thursday.
    thursday.setDate(thursday.getDate() - dayOfWeek + 3);

    // How many days after January 1st is that Thursday?
    // (Math.round smooths over summer/winter time changes.)
    const januaryFirst = new Date(thursday.getFullYear(), 0, 1);
    const daysIntoYear = Math.round((thursday - januaryFirst) / DAY_IN_MS);

    // Every 7 days is a new week, and we count from 1, not 0.
    return Math.floor(daysIntoYear / 7) + 1;
}

// --- Start ---------------------------------------------------------------

weekNumber.textContent = getWeekNumber(new Date());

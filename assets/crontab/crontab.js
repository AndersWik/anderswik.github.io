const minute = document.getElementById("minute");
const hour = document.getElementById("hour");
const dayMonth = document.getElementById("day-month");
const month = document.getElementById("month");
const dayWeek = document.getElementById("day-week");

const minuteHeader = document.getElementById("minute-header");
const hourHeader = document.getElementById("hour-header");
const dayMonthHeader = document.getElementById("day-month-header");
const monthHeader = document.getElementById("month-header");
const dayWeekHeader = document.getElementById("day-week-header");

const minuteTxt = document.getElementById("minute-txt");
const hourTxt = document.getElementById("hour-txt");
const dayMonthTxt = document.getElementById("day-month-txt");
const monthTxt = document.getElementById("month-txt");
const dayWeekTxt = document.getElementById("day-week-txt");

const rangeType = {
NUMBER: "NUMBER",
WEEKDAYNAME: "WEEKDAYNAME",
MONTHNAME: "MONTHNAME"
}

const rangeDivider = {
DASH: "-",
TILDE: "~"
}

const monthName = {
JAN: "JAN",
FEB: "FEB",
MAR: "MAR",
APR: "APR",
MAY: "MAY",
JUN: "JUN",
JUL: "JUL",
AUG: "AUG",
SEP: "SEP",
OCT: "OCT",
NOV: "NOV",
DEC: "DEC"
}

const weekDayName = {
MON: "MON",
TUE: "TUE",
WED: "WED",
THU: "THU",
FRI: "FRI",
SAT: "SAT",
SUN: "SUN"
}

const fieldName = {
MINUTE: "minute",
HOUR: "hour",
DAYMONTH: "day-month",
MONTH: "month",
DAYWEEK: "day-week"
}

const validationRegex = {
isWildcard: /^([\*])$/,
isWildcardWithStep: /^([\*][\/][0-9]+)$/,
isAny: /^([\?])$/,
isMinute: /^([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0])$/,
isMinuteRange: /^([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0])[\-]([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0])$/,
isMinuteRangeWithStep: /^([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0])([\-])([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0])([\/][0-9]+)$/,
isMinuteRandomized: /^([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0])[\~]([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0])$/,
isHour: /^([0-9]|1[0-9]|2[0-3])$/,
isHourRange: /^([0-9]|1[0-9]|2[0-3])[\-]([0-9]|1[0-9]|2[0-3])$/,
isHourRangeWithStep: /^([0-9]|1[0-9]|2[0-3])[\-]([0-9]|1[0-9]|2[0-3])[\/][0-9]+$/,
isHourRandomized: /^([0-9]|1[0-9]|2[0-3])[\~]([0-9]|1[0-9]|2[0-3])$/,
isMonthDayNumber: /^([1-9]|1[0-9]|2[0-3]|3[0-1])$/,
isMonthDayNumberLast: /^L$/,
isMonthDayNumberLastOffset: /^L[\-]([1-9]|1[0-9]|2[0-3]|3[0-1])$/,
isMonthDayNumberWeekday: /^([1-9]|1[0-9]|2[0-3]|3[0-1])W$/,
isMonthDayNumberNthDay: /^([0-7])#([0-9])$/,
isMonthDayNumberRange: /^([1-9]|1[0-9]|2[0-3]|3[0-1])[\-]([1-9]|1[0-9]|2[0-3]|3[0-1])$/,
isMonthDayNumberRangeWithStep: /^([1-9]|1[0-9]|2[0-3]|3[0-1])[\-]([1-9]|1[0-9]|2[0-3]|3[0-1])[\/][0-9]+$/,
isMonthDayNumberRandomized: /^([1-9]|1[0-9]|2[0-3]|3[0-1])[\~]([1-9]|1[0-9]|2[0-3]|3[0-1])$/,
isMonthNumber: /^([1-9]|1[0-2])$/,
isMonthNumberRange: /^([1-9]|1[0-2])[\-]([1-9]|1[0-2])$/,
isMonthNumberRangeWithStep: /^([1-9]|1[0-2])[\-]([1-9]|1[0-2])[\/][0-9]+$/,
isMonthNumberRandomized: /^([1-9]|1[0-2])[\~]([1-9]|1[0-2])$/,
isMonthName: /^(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/,
isMonthNameRange: /^(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[\-](?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/,
isMonthNameRangeWithStep: /^(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[\-](?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[\/][0-9]+$/,
isMonthNameRandomized: /^(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[\~](?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/,
isWeekDayNumber: /^([0-7])$/,
isWeekDayNumberLast: /^L$/,
isWeekDayNumberLastOffset: /^[0-7]L$/,
isWeekDayNumberRange: /^([0-7])[\-]([0-7])$/,
isWeekDayNumberRangeWithStep: /^([0-7])[\-]([0-7])[\/][0-9]+$/,
isWeekDayNumberRandomized: /^([0-7])[\~]([0-7])$/,
isWeekDayName: /^(?:MON|TUE|WED|THU|FRI|SAT|SUN)$/,
isWeekDayNameRange: /^(?:MON|TUE|WED|THU|FRI|SAT|SUN)[\-](?:MON|TUE|WED|THU|FRI|SAT|SUN)$/,
isWeekDayNameRangeWithStep: /^(?:MON|TUE|WED|THU|FRI|SAT|SUN)[\-](?:MON|TUE|WED|THU|FRI|SAT|SUN)[\/][0-9]+$/,
isWeekDayNameRandomized: /^(?:MON|TUE|WED|THU|FRI|SAT|SUN)[\~](?:MON|TUE|WED|THU|FRI|SAT|SUN)$/
}

let queValidateMinute = null;
let queValidateHour = null;
let queValidateDayMonth = null;
let queValidateMonth = null;
let queValidateDayWeek = null;

const hide = function () {

minuteHeader.style.display = "none";
hourHeader.style.display = "none";
dayMonthHeader.style.display = "none";
monthHeader.style.display = "none";
dayWeekHeader.style.display = "none";
minuteTxt.style.display = "none";
hourTxt.style.display = "none";
dayMonthTxt.style.display = "none";
monthTxt.style.display = "none";
dayWeekTxt.style.display = "none";
}

const show = function (option) {

switch (option) {
    case fieldName.MINUTE:
    minuteHeader.style.display = "block";
    minuteTxt.style.display = "block";
    break;
    case fieldName.HOUR:
    hourHeader.style.display = "block";
    hourTxt.style.display = "block";
    break;
    case fieldName.DAYMONTH:
    dayMonthHeader.style.display = "block";
    dayMonthTxt.style.display = "block";
    break;
    case fieldName.MONTH:
    monthHeader.style.display = "block";
    monthTxt.style.display = "block";
    break;
    case fieldName.DAYWEEK:
    dayWeekHeader.style.display = "block";
    dayWeekTxt.style.display = "block";
}
}

const translateMonthName = function (option) {

let monthNumber = 1;
switch (option) {
    case monthName.JAN:
    monthNumber = 1;
    break;
    case monthName.FEB:
    monthNumber = 2;
    break;
    case monthName.MAR:
    monthNumber = 3;
    break;
    case monthName.APR:
    monthNumber = 4;
    break;
    case monthName.MAY:
    monthNumber = 5;
    break;
    case monthName.JUN:
    monthNumber = 6;
    break;
    case monthName.JUL:
    monthNumber = 7;
    break;
    case monthName.AUG:
    monthNumber = 8;
    break;
    case monthName.SEP:
    monthNumber = 9;
    break;
    case monthName.OCT:
    monthNumber = 10;
    break;
    case monthName.NOV:
    monthNumber = 11;
    break;
    case monthName.DEC:
    monthNumber = 12;
    break;
}
return monthNumber;
}

const translateWeekName = function (option) {

let weekNumber = 1;
switch (option) {
    case weekDayName.MON:
    weekNumber = 1;
    break;
    case weekDayName.TUE:
    weekNumber = 2;
    break;
    case weekDayName.WED:
    weekNumber = 3;
    break;
    case weekDayName.THU:
    weekNumber = 4;
    break;
    case weekDayName.FRI:
    weekNumber = 5;
    break;
    case weekDayName.SAT:
    weekNumber = 6;
    break;
    case weekDayName.SUN:
    weekNumber = 0;
    break;
}
return weekNumber;
}

const testValueAgainstRegex = function (val, regex) {

let itemsMatchOneRegex = false;
if (Array.isArray(regex)) {
    for (let j = 0; j < regex.length; j++) {
    if (regex[j].test(val)) {
        itemsMatchOneRegex = true;
        break;
    }
    }
}
else
{
    itemsMatchOneRegex = regex.test(val);
}
return itemsMatchOneRegex;
}

// We need this incase of times where one regex wont match
// every item. If we have a list where one item is a range
// without step and one item a range with step. So we check
// all items against a list of regex. If all items matched
// with one but not necessairly the same regex. We return true
// Example 5-9,10-20/2
const isValueListOfDifferent = function (val, regex) {

let allItemsMatchOneRegex = false;
if (val.indexOf(',') > -1 && Array.isArray(regex)) {
    let tempArr = [];
    let list = val.split(',');
    for (let i = 0; i < list.length; i++) {
    let temp = false;
    for (let j = 0; j < regex.length; j++) {
        if (regex[j].test(list[i])) {
        temp = true;
        break;
        }
    }
    tempArr.push(temp);
    }
    const isAllTrue = (v) => v === true;
    allItemsMatchOneRegex = tempArr.every(isAllTrue);
}
return allItemsMatchOneRegex;
}

const splitRangeToObject = function (val, divider) {

let values = null;

if (val.indexOf(divider) > -1) {
    let rangeValues = {};
    let items = val.split(divider);

    if (items.length == 2) {
    rangeValues['first'] = items[0];
    rangeValues['last'] = items[1];

    let temp = rangeValues['first'].split("/");

    if (temp.length == 2) {
        rangeValues['first'] = temp[0];
        rangeValues['first-step'] = temp[1];
    }

    temp = rangeValues['last'].split("/");

    if (temp.length == 2) {
        rangeValues['last'] = temp[0];
        rangeValues['last-step'] = temp[1];
    }
    }

    if (rangeValues['first'] && rangeValues['last']) {
    values = rangeValues;
    }
}
return values;
}

const isRangeInAscendingOrder = function (val, divider, type = "NUMBER") {

let isAsc = false;

let rangeValues = splitRangeToObject(val, divider);

if (type == rangeType.MONTHNAME && rangeValues !== null) {
    rangeValues['first'] = translateMonthName(rangeValues['first']);
    rangeValues['last'] = translateMonthName(rangeValues['last']);
}

if (type == rangeType.WEEKDAYNAME && rangeValues !== null) {
    rangeValues['first'] = translateWeekName(rangeValues['first']);
    rangeValues['last'] = translateWeekName(rangeValues['last']);
}

if (rangeValues !== null) {
    rangeValues['first'] = parseInt(rangeValues['first']);
    rangeValues['last'] = parseInt(rangeValues['last']);

    if (rangeValues['first'] !== NaN && rangeValues['last'] !== NaN && rangeValues['first'] <= rangeValues['last']) {
    isAsc = true;
    }
}
return isAsc;
}

const isRangeListInAscendingOrder = function (val, divider, type = "NUMBER") {

let allItemsAreInAscOrder = false;

if (val.indexOf(',') > -1) {
    let temp = true;
    let list = val.split(',');
    for (let i = 0; i < list.length; i++) {
    if (!isRangeInAscendingOrder(list[i], divider, type)) {
        temp = false;
        break;
    }
    }
    allItemsAreInAscOrder = temp;
}
return allItemsAreInAscOrder;
}

const validateMinute = function () {

let isRegex = [validationRegex.isWildcard, validationRegex.isWildcardWithStep, validationRegex.isMinute];
let isValid = testValueAgainstRegex(minute.value, isRegex);

if (!isValid) {
    isValid = isValueListOfDifferent(minute.value, [validationRegex.isMinute]);
}

if (!isValid) {

    let isRegexTypeRange = [validationRegex.isMinuteRange, validationRegex.isMinuteRangeWithStep, validationRegex.isMinuteRandomized];
    isValid = testValueAgainstRegex(minute.value, isRegexTypeRange);

    if(!isValid) {
    isValid = isValueListOfDifferent(minute.value, [validationRegex.isMinuteRange, validationRegex.isMinuteRangeWithStep]);
    }

    if(!isValid) {
    isValid = isValueListOfDifferent(minute.value, [validationRegex.isMinuteRandomized]);
    }

    if (isValid) {
    // Incase the item is a range or a list of ranges we need to make additional checks to see if the items are in ASC order.
    isValid = isRangeInAscendingOrder(minute.value, rangeDivider.DASH) || isRangeListInAscendingOrder(minute.value, rangeDivider.DASH) || isRangeInAscendingOrder(minute.value, rangeDivider.TILDE) || isRangeListInAscendingOrder(minute.value, rangeDivider.TILDE);
    }
}

if (isValid) {
    minute.classList.remove("not-valid");
}
else {
    minute.classList.add("not-valid");
}
}

const validateHour = function () {

let isRegex = [validationRegex.isWildcard, validationRegex.isWildcardWithStep, validationRegex.isHour]
let isValid = testValueAgainstRegex(hour.value, isRegex);

if (!isValid) {
    isValid = isValueListOfDifferent(hour.value, [validationRegex.isHour]);
}

if (!isValid) {
    let isRegexTypeRange = [validationRegex.isHourRange, validationRegex.isHourRangeWithStep, validationRegex.isHourRandomized];
    isValid = testValueAgainstRegex(hour.value, isRegexTypeRange);

    if(!isValid) {
    isValid = isValueListOfDifferent(hour.value, [validationRegex.isHourRange, validationRegex.isHourRangeWithStep]);
    }

    if(!isValid) {
    isValid = isValueListOfDifferent(hour.value, [validationRegex.isHourRandomized]);
    }

    if (isValid) {
    // Incase the item is a range or a list of ranges we need to make additional checks to see if the items are in ASC order.
    isValid = isRangeInAscendingOrder(hour.value, rangeDivider.DASH) || isRangeListInAscendingOrder(hour.value, rangeDivider.DASH) ||  isRangeInAscendingOrder(hour.value, rangeDivider.TILDE) || isRangeListInAscendingOrder(hour.value, rangeDivider.TILDE);
    }
}

if (isValid) {
    hour.classList.remove("not-valid");
}
else {
    hour.classList.add("not-valid");
}
}

const validateDayMonth = function () {

let isRegex = [validationRegex.isWildcard, validationRegex.isWildcardWithStep, validationRegex.isAny, validationRegex.isMonthDayNumberLast, validationRegex.isMonthDayNumberLastOffset, validationRegex.isMonthDayNumberWeekday, validationRegex.isMonthDayNumberNthDay, validationRegex.isMonthDayNumber]
let isValid = testValueAgainstRegex(dayMonth.value, isRegex);

if (!isValid) {
    isValid = isValueListOfDifferent(dayMonth.value, [validationRegex.isMonthDayNumber]);
}

if (!isValid) {
    let isRegexTypeRange = [validationRegex.isMonthDayNumberRange, validationRegex.isMonthDayNumberRangeWithStep, validationRegex.isMonthDayNumberRandomized];
    isValid = testValueAgainstRegex(dayMonth.value, isRegexTypeRange);

    if(!isValid) {
    isValid = isValueListOfDifferent(dayMonth.value, [validationRegex.isMonthDayNumberRange, validationRegex.isMonthDayNumberRangeWithStep]);
    }

    if(!isValid) {
    isValid = isValueListOfDifferent(dayMonth.value, [validationRegex.isMonthDayNumberRandomized]);
    }

    if (isValid) {
    // Incase the item is a range or a list of ranges we need to make additional checks to see if the items are in ASC order.
    isValid = isRangeInAscendingOrder(dayMonth.value, rangeDivider.DASH) || isRangeListInAscendingOrder(dayMonth.value, rangeDivider.DASH) || isRangeInAscendingOrder(dayMonth.value, rangeDivider.TILDE) || isRangeListInAscendingOrder(dayMonth.value, rangeDivider.TILDE);
    }
}

if (isValid) {
    dayMonth.classList.remove("not-valid");
}
else {
    dayMonth.classList.add("not-valid");
}
}

const validateMonth = function () {

let isRegex = [validationRegex.isWildcard, validationRegex.isWildcardWithStep, validationRegex.isMonthNumber]
let isValid = testValueAgainstRegex(month.value, isRegex);

if (!isValid) {
    isValid = isValueListOfDifferent(month.value, [validationRegex.isMonthNumber]);
}

if (!isValid) {
    let isRegexTypeRange = [validationRegex.isMonthNumberRange, validationRegex.isMonthNumberRangeWithStep, validationRegex.isMonthDayNumberRandomized];
    isValid = testValueAgainstRegex(month.value, isRegexTypeRange);

    if(!isValid) {
    isValid = isValueListOfDifferent(month.value, [validationRegex.isMonthNumberRange, validationRegex.isMonthNumberRangeWithStep]);
    }

    if(!isValid) {
    isValid = isValueListOfDifferent(month.value, [validationRegex.isMonthDayNumberRandomized]);
    }

    if (isValid) {
    // Incase the item is a range or a list of ranges we need to make additional checks to see if the items are in ASC order.
    isValid = isRangeInAscendingOrder(month.value, rangeDivider.DASH) || isRangeListInAscendingOrder(month.value, rangeDivider.DASH) || isRangeInAscendingOrder(month.value, rangeDivider.TILDE) || isRangeListInAscendingOrder(month.value, rangeDivider.TILDE);
    }
}

if (!isValid) {
    isValid = testValueAgainstRegex(month.value, validationRegex.isMonthName);
}

if (!isValid) {
    isValid = isValueListOfDifferent(month.value, [validationRegex.isMonthName]);
}

if (!isValid) {
    let isRegexTypeRange = [validationRegex.isMonthNameRange, validationRegex.isMonthNameRangeWithStep, validationRegex.isMonthNameRandomized];
    isValid = testValueAgainstRegex(month.value, isRegexTypeRange);

    if(!isValid) {
    isValid = isValueListOfDifferent(month.value, [validationRegex.isMonthNameRange, validationRegex.isMonthNameRangeWithStep]);
    }

    if(!isValid) {
    isValid = isValueListOfDifferent(month.value, [validationRegex.isMonthNameRandomized]);
    }

    if (isValid) {
    isValid = isRangeInAscendingOrder(month.value, rangeDivider.DASH, rangeType.MONTHNAME) || isRangeListInAscendingOrder(month.value, rangeDivider.DASH, rangeType.MONTHNAME) || isRangeInAscendingOrder(month.value, rangeDivider.TILDE, rangeType.MONTHNAME) || isRangeListInAscendingOrder(month.value, rangeDivider.TILDE, rangeType.MONTHNAME);
    }
}

if (isValid) {
    month.classList.remove("not-valid");
}
else {
    month.classList.add("not-valid");
}
}

const validateDayWeek = function () {

let isRegex = [validationRegex.isWildcard, validationRegex.isWildcardWithStep, validationRegex.isAny, validationRegex.isWeekDayNumberLast, validationRegex.isWeekDayNumberLastOffset, validationRegex.isWeekDayNumber]
let isValid = testValueAgainstRegex(dayWeek.value, isRegex);

if (!isValid) {
    isValid = isValueListOfDifferent(dayWeek.value, [validationRegex.isWeekDayNumber]);
}

if (!isValid) {
    let isRegexTypeRange = [validationRegex.isWeekDayNumberRange, validationRegex.isWeekDayNumberRangeWithStep, validationRegex.isWeekDayNumberRandomized];
    isValid = testValueAgainstRegex(dayWeek.value, isRegexTypeRange);

    if(!isValid) {
    isValid = isValueListOfDifferent(dayWeek.value, [validationRegex.isWeekDayNumberRange, validationRegex.isWeekDayNumberRangeWithStep]);
    }

    if(!isValid) {
    isValid = isValueListOfDifferent(dayWeek.value, [validationRegex.isWeekDayNumberRandomized]);
    }

    if (isValid) {
    // Incase the item is a range or a list of ranges we need to make additional checks to see if the items are in ASC order.
    isValid = isRangeInAscendingOrder(dayWeek.value, rangeDivider.DASH) || isRangeListInAscendingOrder(dayWeek.value, rangeDivider.DASH) || isRangeInAscendingOrder(dayWeek.value, rangeDivider.TILDE) || isRangeListInAscendingOrder(dayWeek.value, rangeDivider.TILDE);
    }
}

if(!isValid) {
    isValid = testValueAgainstRegex(dayWeek.value, [validationRegex.isWeekDayName]);
}

if (!isValid) {
    isValid = isValueListOfDifferent(dayWeek.value, [validationRegex.isWeekDayName]);
}

if (!isValid) {

    let isRegexTypeRange = [validationRegex.isWeekDayNameRange, validationRegex.isWeekDayNameRangeWithStep, validationRegex.isWeekDayNameRandomized];
    isValid = testValueAgainstRegex(dayWeek.value, isRegexTypeRange);

    if(!isValid) {
    isValid = isValueListOfDifferent(dayWeek.value, [validationRegex.isWeekDayNameRange, validationRegex.isWeekDayNameRangeWithStep]);
    }

    if(!isValid) {
    isValid = isValueListOfDifferent(dayWeek.value, [validationRegex.isWeekDayNameRandomized]);
    }

    if (isValid) {
    // Incase the item is a range or a list of ranges we need to make additional checks to see if the items are in ASC order.
    isValid = isRangeInAscendingOrder(dayWeek.value, rangeDivider.DASH, rangeType.WEEKDAYNAME) || isRangeListInAscendingOrder(dayWeek.value, rangeDivider.DASH, rangeType.WEEKDAYNAME) || isRangeInAscendingOrder(dayWeek.value, rangeDivider.TILDE, rangeType.WEEKDAYNAME) || isRangeListInAscendingOrder(dayWeek.value, rangeDivider.TILDE, rangeType.WEEKDAYNAME);
    }
}

if (isValid) {
    dayWeek.classList.remove("not-valid");
}
else {
    dayWeek.classList.add("not-valid");
}
}

minute.addEventListener("focus", function () {
hide();
show(fieldName.MINUTE);
});

minute.addEventListener("keyup", function () {
hide();
show(fieldName.MINUTE);
clearTimeout(queValidateMinute);
queValidateMinute = setTimeout(validateMinute, 500);
});

hour.addEventListener("focus", function () {
hide();
show(fieldName.HOUR);
});

hour.addEventListener("keyup", function () {
hide();
show(fieldName.HOUR);
clearTimeout(queValidateHour);
queValidateHour = setTimeout(validateHour, 500);
});

dayMonth.addEventListener("focus", function () {
hide();
show(fieldName.DAYMONTH);
});

dayMonth.addEventListener("keyup", function () {
hide();
show(fieldName.DAYMONTH);
clearTimeout(queValidateDayMonth);
queValidateDayMonth = setTimeout(validateDayMonth, 500);
});

month.addEventListener("focus", function () {
hide();
show(fieldName.MONTH);
});

month.addEventListener("keyup", function () {
hide();
show(fieldName.MONTH);
clearTimeout(queValidateMonth);
queValidateMonth = setTimeout(validateMonth, 500);
});

dayWeek.addEventListener("focus", function () {
hide();
show(fieldName.DAYWEEK);
});

dayWeek.addEventListener("keyup", function () {
hide();
show(fieldName.DAYWEEK);
clearTimeout(queValidateDayWeek);
queValidateDayWeek = setTimeout(validateDayWeek, 500);
});
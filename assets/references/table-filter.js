/*
 * Search in a reference table.
 *
 *   <input type="search" id="table-filter" data-table="codes">
 *   <p id="table-filter-status"></p>
 *   <table id="codes"> ... <tbody> rows </tbody> </table>
 *
 * Every word typed must be found somewhere in a row for the row to be shown.
 * A word of two or three letters that is exactly a code in the row, like
 * "se" or "swe", puts that row first.
 */

(function () {
  var input = document.getElementById("table-filter");
  if (!input) return;
  var status = document.getElementById("table-filter-status");
  var tbody = document.getElementById(input.getAttribute("data-table")).tBodies[0];
  var rows = Array.prototype.slice.call(tbody.rows);

  // The text of each row and its codes, read once.
  var data = rows.map(function (row, index) {
    var codes = Array.prototype.map.call(row.querySelectorAll(".code"), function (cell) {
      return cell.textContent.trim().toLowerCase();
    });
    return { row: row, index: index, text: row.textContent.toLowerCase(), codes: codes };
  });

  function filter() {
    var words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    var shown = [];

    data.forEach(function (item) {
      var match = words.every(function (word) { return item.text.indexOf(word) !== -1; });
      item.row.hidden = !match;
      if (match) shown.push(item);
    });

    // Exact code matches first, the rest in the original order.
    shown.sort(function (a, b) {
      var exactA = words.some(function (w) { return a.codes.indexOf(w) !== -1; }) ? 0 : 1;
      var exactB = words.some(function (w) { return b.codes.indexOf(w) !== -1; }) ? 0 : 1;
      return exactA - exactB || a.index - b.index;
    });
    shown.forEach(function (item) { tbody.appendChild(item.row); });

    status.textContent = words.length
      ? shown.length + (shown.length === 1 ? " match" : " matches") + " of " + data.length
      : data.length + " in the list";
  }

  input.addEventListener("input", filter);
  filter();
})();

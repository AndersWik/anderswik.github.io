/*
 * PX to EM Converter: em = px / base, px = em * base.
 *
 * Typing in one field updates the other. The base font size is saved in
 * localStorage, since most people always use the same one (16px).
 */

(function () {
  var SIZES = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96];
  var STORAGE_KEY = "px-em-converter-base";

  var form = document.getElementById("converter");
  var baseInput = document.getElementById("base");
  var pxInput = document.getElementById("px");
  var emInput = document.getElementById("em");
  var cssLine = document.getElementById("css-line");
  var copyButton = document.getElementById("copy");
  var baseNote = document.getElementById("base-note");
  var sizesBody = document.getElementById("sizes");

  // Round and remove trailing zeros: 1.5000 -> "1.5", 0.0625 -> "0.0625".
  function format(number, decimals) {
    return String(Number(number.toFixed(decimals)));
  }

  function base() {
    var value = parseFloat(baseInput.value);
    return value > 0 ? value : 16;
  }

  function showCss() {
    var px = parseFloat(pxInput.value);
    var em = parseFloat(emInput.value);
    if (isNaN(px) || isNaN(em)) {
      cssLine.textContent = "–";
      copyButton.disabled = true;
      return;
    }
    cssLine.textContent = "font-size: " + format(em, 4) + "rem; /* " + format(px, 2) + "px */";
    copyButton.disabled = false;

    // Mark the row in the table with the same size.
    Array.prototype.forEach.call(sizesBody.rows, function (row) {
      row.classList.toggle("current", Number(row.getAttribute("data-px")) === Number(format(px, 2)));
    });
  }

  function fromPx() {
    var px = parseFloat(pxInput.value);
    emInput.value = isNaN(px) ? "" : format(px / base(), 4);
    showCss();
  }

  function fromEm() {
    var em = parseFloat(emInput.value);
    pxInput.value = isNaN(em) ? "" : format(em * base(), 2);
    showCss();
  }

  function fillTable() {
    sizesBody.textContent = "";
    SIZES.forEach(function (px) {
      var row = document.createElement("tr");
      row.setAttribute("data-px", px);
      [px + "px", format(px / base(), 4) + "em", format(px / base() * 100, 2) + "%"].forEach(function (text) {
        var cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      });
      sizesBody.append(row);
    });
  }

  function onBaseChange() {
    baseNote.textContent = "1em = " + format(base(), 2) + "px. " +
      (base() === 16 ? "16px is the default font size in browsers." : "Browsers start with 16px.");
    try {
      localStorage.setItem(STORAGE_KEY, baseInput.value);
    } catch (e) {
      // Storage is off, the base is only kept until the page is closed.
    }
    fillTable();
    fromPx();   // keep the pixels, recalculate the em
  }

  pxInput.addEventListener("input", fromPx);
  emInput.addEventListener("input", fromEm);
  baseInput.addEventListener("input", onBaseChange);
  form.addEventListener("submit", function (event) { event.preventDefault(); });

  sizesBody.addEventListener("click", function (event) {
    var row = event.target.closest("tr");
    if (!row) return;
    pxInput.value = row.getAttribute("data-px");
    fromPx();
    pxInput.focus();
  });

  copyButton.addEventListener("click", function () {
    navigator.clipboard.writeText(cssLine.textContent).then(function () {
      copyButton.textContent = "Copied";
      setTimeout(function () { copyButton.textContent = "Copy"; }, 1500);
    }, function () {
      copyButton.textContent = "Select and copy";
    });
  });

  // --- Start ---------------------------------------------------------------

  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && parseFloat(saved) > 0) baseInput.value = saved;
  } catch (e) {
    // No storage, use 16.
  }
  onBaseChange();
})();

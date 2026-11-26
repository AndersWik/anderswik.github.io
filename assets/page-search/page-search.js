/*
 * Page Search: search many web pages for a regular expression.
 *
 * The pages come from a list of URLs (#url-list), or from a sitemap
 * (#sitemap, loaded from #sitemap-url or pasted). The "Pages from" switch
 * picks which one. The rest, the search and the results, is the same.
 *
 * Pages can be loaded in two ways:
 *
 *   Download  fetch() the HTML. Fast. The browser's CORS rules apply: other
 *             sites can only be read if they allow it. In the Firefox add-on
 *             (all_urls in _data/extensions.yml) every site can be read.
 *   Frame     load the page in an <iframe> and read what it shows, after its
 *             JavaScript has run. A page can only look inside a frame with a
 *             page from its own site, so this only works for this site.
 *
 * The form is saved in localStorage, so it is still there after a reload.
 */

(function () {
  var MAX_MATCHES = 10000;      // stop counting on a page after this many
  var MAX_SHOWN = 50;           // different matches shown per page
  var FRAME_TIMEOUT = 30000;    // ms to wait for a page in the frame
  var MAX_SITEMAPS = 50;        // sitemaps to follow in a sitemap index

  function $(id) { return document.getElementById(id); }

  var form = $("search-form");
  var sourceList = $("source-list");    // the "Pages from" switch
  var sourceSitemap = $("source-sitemap");
  var listPanel = $("list-panel");
  var sitemapPanel = $("sitemap-panel");
  var urlList = $("url-list");
  var sitemapInput = $("sitemap");
  var sitemapUrl = $("sitemap-url");
  var loadSitemapButton = $("load-sitemap");
  var urlCount = $("url-count");
  var patternInput = $("pattern");
  var flagsInput = $("flags");
  var searchIn = $("search-in");
  var loadWith = $("load-with");
  var delaySelect = $("delay");
  var limitSelect = $("limit");
  var formError = $("form-error");
  var startButton = $("start");
  var corsNote = $("cors-note");

  var resultsSection = $("results-section");
  var resultsList = $("results");
  var onlyMatches = $("only-matches");
  var csvButton = $("download-csv");
  var progressBar = $("progress-bar");
  var summary = $("summary");
  var loader = $("loader");

  var STORAGE_KEY = "page-search-form";

  // The extension API, or null on a normal web page.
  var ext = null;
  if (typeof browser !== "undefined" && browser.runtime && browser.runtime.id) {
    ext = browser;
  } else if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
    ext = chrome;
  }

  var controller = null;   // the AbortController of the running search
  var results = [];        // for the CSV: { url, result, http, total, matches }

  // --- Saving the form ---------------------------------------------------

  var SAVED_FIELDS = [urlList, sitemapInput, sitemapUrl, patternInput, flagsInput, searchIn, loadWith, delaySelect, limitSelect];

  // true when the pages come from a sitemap.
  function isSitemap() {
    return sourceSitemap.checked;
  }

  function showSource() {
    listPanel.hidden = isSitemap();
    sitemapPanel.hidden = !isSitemap();
    updateCount();
  }

  function saveForm() {
    var data = { source: isSitemap() ? "sitemap" : "list" };
    SAVED_FIELDS.forEach(function (field) {
      data[field.id] = field.value;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // Storage is off, nothing to do.
    }
  }

  function loadForm() {
    var data = null;
    try {
      data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      data = null;
    }
    if (!data) return;
    if (data.source === "sitemap") sourceSitemap.checked = true;
    SAVED_FIELDS.forEach(function (field) {
      if (typeof data[field.id] !== "string") return;
      // A select only takes values it has an option for.
      if (field.tagName === "SELECT" && !field.querySelector('option[value="' + CSS.escape(data[field.id]) + '"]')) return;
      field.value = data[field.id];
    });
  }

  // --- Reading URLs ------------------------------------------------------

  // Text with URLs, one per line (spaces and commas work too) -> a list
  // without duplicates. Addresses like /tools/ are read from this page.
  function parseUrlList(text) {
    var urls = [];
    var bad = [];
    text.split(/[\s,]+/).forEach(function (part) {
      if (part === "") return;
      try {
        var url = new URL(part, location.href);
        if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
        if (urls.indexOf(url.href) === -1) urls.push(url.href);
      } catch (e) {
        bad.push(part);
      }
    });
    return { urls: urls, bad: bad };
  }

  // Sitemap XML -> { urls, sitemaps }. A normal sitemap is a <urlset> of
  // pages, a sitemap index is a <sitemapindex> of other sitemaps.
  function parseSitemap(xml) {
    var doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("This is not valid XML.");
    }
    var locs = Array.prototype.map.call(doc.getElementsByTagNameNS("*", "loc"), function (loc) {
      return loc.textContent.trim();
    }).filter(Boolean);
    var isIndex = doc.documentElement.localName === "sitemapindex";
    return { urls: isIndex ? [] : locs, sitemaps: isIndex ? locs : [] };
  }

  async function fetchText(url, signal) {
    var response = await fetch(url, { cache: "no-store", signal: signal });
    if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
    return response.text();
  }

  // All page URLs in a sitemap. The sitemaps in a sitemap index are
  // downloaded and read too. Problems go in notes, the rest still works.
  async function urlsFromSitemap(xml, signal, notes) {
    var parsed = parseSitemap(xml);
    var urls = parsed.urls.slice();
    for (var i = 0; i < parsed.sitemaps.length && i < MAX_SITEMAPS; i++) {
      var address = parsed.sitemaps[i];
      try {
        var inner = parseSitemap(await fetchText(address, signal));
        urls = urls.concat(inner.urls);
        if (inner.sitemaps.length) notes.push(address + " is a sitemap index inside an index, it was skipped.");
      } catch (e) {
        if (e.name === "AbortError") throw e;
        notes.push("Could not read " + address + ": " + readError(e));
      }
    }
    if (parsed.sitemaps.length > MAX_SITEMAPS) {
      notes.push("Only the first " + MAX_SITEMAPS + " sitemaps in the index were read.");
    }
    return parseUrlList(urls.join("\n")).urls;
  }

  // Show how many pages there are, while typing.
  function updateCount() {
    if (!isSitemap()) {
      var list = parseUrlList(urlList.value);
      urlCount.textContent = list.urls.length === 0 ? "" :
        list.urls.length + (list.urls.length === 1 ? " page" : " pages") +
        (list.bad.length ? ", not a URL: " + list.bad.slice(0, 3).join(" ") + (list.bad.length > 3 ? " …" : "") : "");
      return;
    }
    if (sitemapInput.value.trim() === "") {
      urlCount.textContent = "";
      return;
    }
    try {
      var parsed = parseSitemap(sitemapInput.value);
      urlCount.textContent = parsed.sitemaps.length
        ? "A sitemap index with " + parsed.sitemaps.length + " sitemaps. They are read when you search."
        : parsed.urls.length + (parsed.urls.length === 1 ? " page" : " pages");
    } catch (e) {
      urlCount.textContent = e.message;
    }
  }

  async function loadSitemap() {
    formError.hidden = true;
    var address = sitemapUrl.value.trim();
    if (address === "") {
      showFormError("Write the address of a sitemap, like https://example.com/sitemap.xml.");
      return;
    }
    loadSitemapButton.disabled = true;
    try {
      sitemapInput.value = await fetchText(new URL(address, location.href).href);
      updateCount();
      saveForm();
    } catch (e) {
      showFormError("Could not load the sitemap: " + readError(e));
    } finally {
      loadSitemapButton.disabled = false;
    }
  }

  // --- Errors ------------------------------------------------------------

  // fetch() gives the same vague TypeError for CORS, a wrong address and no
  // network. The browser console has the real reason.
  function readError(e) {
    if (e instanceof TypeError) {
      return ext
        ? "the server could not be reached."
        : "blocked by CORS, or the server could not be reached. Pages on this site always work.";
    }
    return e.message;
  }

  function showFormError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  // --- Searching ---------------------------------------------------------

  function buildRegex() {
    var flags = flagsInput.value.replace(/\s/g, "");
    if (!/^[imsuvdg]*$/.test(flags)) {
      throw new Error("Flags can only be i, m, s and u.");
    }
    // "g" finds every match, not only the first. Each flag only once.
    flags = Array.from(new Set((flags + "g").split(""))).join("");
    return new RegExp(patternInput.value, flags);
  }

  // Every match, counted: "Test" 3 times, "test" once.
  function findMatches(text, regex) {
    var counts = new Map();
    var total = 0;
    for (var match of text.matchAll(regex)) {
      total++;
      var key = match[0].slice(0, 200);
      counts.set(key, (counts.get(key) || 0) + 1);
      if (total >= MAX_MATCHES) break;
    }
    return { total: total, counts: counts };
  }

  // The words on a page, without the HTML tags, scripts and styles.
  function textOf(doc) {
    doc.querySelectorAll("script, style, noscript, template").forEach(function (el) { el.remove(); });
    return (doc.body ? doc.body.textContent : "").replace(/\s+/g, " ").trim();
  }

  async function loadWithFetch(url, signal) {
    var response = await fetch(url, { cache: "no-store", signal: signal });
    var html = await response.text();
    return {
      http: response.status,
      content: searchIn.value === "html" ? html : textOf(new DOMParser().parseFromString(html, "text/html"))
    };
  }

  function loadWithFrame(url, delay, signal) {
    // The browser never lets a page look inside a frame from another site,
    // so don't wait for those to load.
    if (new URL(url).origin !== location.origin) {
      return Promise.reject(new Error("a frame can only be read for pages on this site (" + location.host + "). Use Download instead."));
    }
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        finish(new Error("the page did not load in " + FRAME_TIMEOUT / 1000 + " seconds."));
      }, FRAME_TIMEOUT);

      function onAbort() {
        finish(new DOMException("Stopped", "AbortError"));
      }

      function finish(error, value) {
        clearTimeout(timer);
        loader.onload = null;
        signal.removeEventListener("abort", onAbort);
        if (error) reject(error); else resolve(value);
      }

      signal.addEventListener("abort", onAbort);

      loader.onload = function () {
        // Give the page's own JavaScript time to fill in the page.
        setTimeout(function () {
          if (signal.aborted) return;
          var doc = null;
          try {
            doc = loader.contentDocument;   // null for a page from another site
          } catch (e) {
            doc = null;
          }
          if (!doc || !doc.documentElement) {
            finish(new Error("a frame can only be read for pages on this site. Use Download instead."));
            return;
          }
          var content = searchIn.value === "html"
            ? doc.documentElement.outerHTML
            : textOf(doc.cloneNode(true));
          finish(null, { http: null, content: content });
        }, delay);
      };

      loader.hidden = false;
      loader.src = url;
    });
  }

  // --- Results -----------------------------------------------------------

  function makeResultRow(url) {
    var li = document.createElement("li");
    li.className = "pending";
    var head = document.createElement("div");
    head.className = "result-head";
    var link = document.createElement("a");
    link.className = "result-url";
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = url;
    var status = document.createElement("span");
    status.className = "result-status";
    status.textContent = "waiting";
    head.append(link, status);
    li.append(head);
    resultsList.append(li);
    return { li: li, status: status };
  }

  function showResult(row, found, http) {
    row.li.className = found.total > 0 ? "match" : "no-match";
    row.status.textContent = found.total === 0 ? "no match"
      : found.total + (found.total >= MAX_MATCHES ? "+" : "") + (found.total === 1 ? " match" : " matches");

    if (http && http >= 400) {
      var note = document.createElement("p");
      note.className = "result-detail";
      note.textContent = "The server answered HTTP " + http + ".";
      row.li.append(note);
    }

    if (found.total > 0) {
      var chips = document.createElement("ul");
      chips.className = "result-matches";
      var shown = 0;
      found.counts.forEach(function (count, text) {
        if (shown++ >= MAX_SHOWN) return;
        var chip = document.createElement("li");
        chip.textContent = text === "" ? "(empty match)" : text;
        if (count > 1) {
          var times = document.createElement("span");
          times.className = "times";
          times.textContent = " ×" + count;
          chip.append(times);
        }
        chips.append(chip);
      });
      if (found.counts.size > MAX_SHOWN) {
        var more = document.createElement("li");
        more.textContent = "… " + (found.counts.size - MAX_SHOWN) + " more";
        chips.append(more);
      }
      row.li.append(chips);
    }
  }

  function showFailed(row, message) {
    row.li.className = "failed";
    row.status.textContent = "failed";
    var note = document.createElement("p");
    note.className = "result-detail";
    note.textContent = message.charAt(0).toUpperCase() + message.slice(1);
    row.li.append(note);
  }

  function showNotes(notes) {
    notes.forEach(function (text) {
      var li = document.createElement("li");
      li.className = "failed";
      var note = document.createElement("p");
      note.className = "result-detail";
      note.textContent = text;
      li.append(note);
      resultsList.append(li);
    });
  }

  function updateSummary(done, total, counts, finished) {
    progressBar.style.width = (total ? Math.round(done / total * 100) : 100) + "%";
    var text = (finished ? "Searched " : "Searching… ") + done + " of " + total + (total === 1 ? " page" : " pages") +
      " · " + counts.pages + " with matches" +
      (counts.failed ? " · " + counts.failed + " failed" : "") +
      " · " + counts.matches + (counts.matches === 1 ? " match" : " matches") + " in all";
    summary.textContent = text;
  }

  // --- The search --------------------------------------------------------

  function setRunning(running) {
    startButton.textContent = running ? "Stop" : "Search";
    startButton.classList.toggle("btn-primary", !running);
    startButton.classList.toggle("btn-outline-danger", running);
  }

  async function search() {
    formError.hidden = true;

    if (patternInput.value === "") {
      showFormError("Write a regular expression to search for.");
      return;
    }
    var regex;
    try {
      regex = buildRegex();
    } catch (e) {
      showFormError("The regular expression is not valid: " + e.message);
      return;
    }

    saveForm();
    controller = new AbortController();
    var signal = controller.signal;
    setRunning(true);

    resultsList.textContent = "";
    results = [];
    resultsSection.hidden = false;
    var counts = { pages: 0, failed: 0, matches: 0 };
    var notes = [];
    var urls;

    try {
      if (isSitemap()) {
        summary.textContent = "Reading the sitemap…";
        if (sitemapInput.value.trim() === "" && sitemapUrl.value.trim() !== "") {
          sitemapInput.value = await fetchText(new URL(sitemapUrl.value.trim(), location.href).href, signal);
          updateCount();
        }
        if (sitemapInput.value.trim() === "") throw new Error("Load or paste a sitemap first.");
        urls = await urlsFromSitemap(sitemapInput.value, signal, notes);
      } else {
        urls = parseUrlList(urlList.value).urls;
      }
    } catch (e) {
      if (e.name !== "AbortError") showFormError(isSitemap() ? "Could not read the sitemap: " + readError(e) : e.message);
      resultsSection.hidden = true;
      controller = null;
      setRunning(false);
      return;
    }

    if (urls.length === 0) {
      showFormError(isSitemap() ? "There are no pages in the sitemap." : "Write at least one URL.");
      resultsSection.hidden = true;
      controller = null;
      setRunning(false);
      return;
    }

    if (limitSelect.value !== "all") urls = urls.slice(0, Number(limitSelect.value));

    var useFrame = loadWith.value === "frame";
    var delay = Number(delaySelect.value) * 1000;
    showNotes(notes);
    var rows = urls.map(makeResultRow);
    updateSummary(0, urls.length, counts, false);

    var done = 0;
    for (var i = 0; i < urls.length; i++) {
      if (signal.aborted) break;
      var row = rows[i];
      row.status.textContent = "searching…";
      try {
        var page = useFrame ? await loadWithFrame(urls[i], delay, signal) : await loadWithFetch(urls[i], signal);
        var found = findMatches(page.content, regex);
        showResult(row, found, page.http);
        if (found.total > 0) counts.pages++;
        counts.matches += found.total;
        results.push({ url: urls[i], result: found.total > 0 ? "match" : "no match", http: page.http, total: found.total,
          matches: Array.from(found.counts.keys()) });
      } catch (e) {
        if (e.name === "AbortError") break;
        counts.failed++;
        showFailed(row, readError(e));
        results.push({ url: urls[i], result: "failed", http: null, total: 0, matches: [], error: readError(e) });
      }
      done++;
      updateSummary(done, urls.length, counts, false);
    }

    // Pages that were never reached because of Stop.
    rows.slice(done).forEach(function (row) {
      row.li.className = "no-match";
      row.status.textContent = "not searched";
    });

    updateSummary(done, urls.length, counts, true);
    if (signal.aborted) summary.textContent += " · stopped";
    loader.hidden = true;
    loader.removeAttribute("src");
    controller = null;
    setRunning(false);
  }

  // --- CSV ---------------------------------------------------------------

  function csvCell(value) {
    var text = value === null || value === undefined ? "" : String(value);
    return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function downloadCsv() {
    var lines = [["url", "result", "http status", "matches", "different matches", "error"].join(",")];
    results.forEach(function (r) {
      lines.push([r.url, r.result, r.http, r.total, r.matches.join(" | "), r.error].map(csvCell).join(","));
    });
    var blob = new Blob([lines.join("\r\n") + "\r\n"], { type: "text/csv" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "page-search-results.csv";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
  }

  // --- Events ------------------------------------------------------------

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (controller) {
      controller.abort();
    } else {
      search();
    }
  });

  form.addEventListener("input", saveForm);
  form.addEventListener("change", saveForm);

  urlList.addEventListener("input", updateCount);
  sitemapInput.addEventListener("input", updateCount);
  sourceList.addEventListener("change", showSource);
  sourceSitemap.addEventListener("change", showSource);

  loadSitemapButton.addEventListener("click", loadSitemap);
  sitemapUrl.addEventListener("keydown", function (event) {
    // Enter in the address loads the sitemap instead of starting a search.
    if (event.key === "Enter") {
      event.preventDefault();
      loadSitemap();
    }
  });

  loadWith.addEventListener("change", function () {
    delaySelect.disabled = loadWith.value !== "frame";
  });

  onlyMatches.addEventListener("change", function () {
    resultsList.classList.toggle("only-matches", onlyMatches.checked);
  });

  csvButton.addEventListener("click", downloadCsv);

  // --- Start -------------------------------------------------------------

  if (ext) corsNote.hidden = true;
  loadForm();
  delaySelect.disabled = loadWith.value !== "frame";
  showSource();
})();

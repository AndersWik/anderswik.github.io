/*
 * Make Request: send an HTTP request and show the response, like a small Postman.
 *
 * The request is sent with fetch(). On a web page the browser's CORS rules
 * apply: the response can only be read if the server allows it with an
 * Access-Control-Allow-Origin header. Built as a Firefox add-on with
 * permission for all sites (see _data/extensions.yml), the same page can
 * call any URL.
 *
 * A request is a plain object:
 *
 *   { method: "POST", url: "https://...", headers: [{ name, value }],
 *     bodyType: "json", body: "{...}" }
 *
 * Three things are kept in localStorage:
 *
 *   make-request-last     the form as it was, so a reload keeps it
 *   make-request-history  every request sent, newest first, at most 50,
 *                         with the status and time it got
 *   make-request-library  requests saved with a name. A name is unique:
 *                         saving with a name that exists replaces it
 *
 * The library can be exported to and imported from a JSON file:
 *
 *   { "type": "make-request-library", "version": 1,
 *     "requests": [{ "name": "...", "method": "...", ... }] }
 */

(function () {
  var LAST_KEY = "make-request-last";
  var HISTORY_KEY = "make-request-history";
  var LIBRARY_KEY = "make-request-library";
  var HISTORY_MAX = 50;
  var EXPORT_TYPE = "make-request-library";

  var METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

  // Methods that can't have a body: fetch() throws if you give them one.
  var NO_BODY = ["GET", "HEAD"];

  // Headers the browser sets itself. fetch() quietly drops them.
  // https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header
  var FORBIDDEN = [
    "accept-charset", "accept-encoding", "access-control-request-headers",
    "access-control-request-method", "connection", "content-length", "cookie",
    "cookie2", "date", "dnt", "expect", "host", "keep-alive", "origin", "referer",
    "set-cookie", "te", "trailer", "transfer-encoding", "upgrade", "via"
  ];

  var CONTENT_TYPES = {
    json: "application/json",
    text: "text/plain; charset=utf-8",
    form: "application/x-www-form-urlencoded"
  };

  // The extension API, or null on a normal web page.
  var ext = null;
  if (typeof browser !== "undefined" && browser.runtime && browser.runtime.id) {
    ext = browser;
  } else if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
    ext = chrome;
  }
  var ALL_SITES = { origins: ["<all_urls>"] };

  // --- Elements ----------------------------------------------------------

  function $(id) { return document.getElementById(id); }

  var form = $("request-form");
  var methodSelect = $("method");
  var urlInput = $("url");
  var sendButton = $("send");
  var formError = $("form-error");
  var headersBox = $("headers");
  var noHeaders = $("no-headers");
  var addHeaderButton = $("add-header");
  var bodySection = $("body-section");
  var bodyType = $("body-type");
  var bodyInput = $("body");

  var saveButton = $("save");
  var saveRow = $("save-row");
  var saveName = $("save-name");
  var saveConfirm = $("save-confirm");
  var saveCancel = $("save-cancel");

  var corsNote = $("cors-note");
  var permissionNote = $("permission-note");
  var permissionButton = $("permission-button");

  var responseSection = $("response-section");
  var statusBadge = $("status");
  var timing = $("timing");
  var finalUrl = $("final-url");
  var showBodyButton = $("show-body");
  var showHeadersButton = $("show-headers");
  var headerCount = $("header-count");
  var responseBody = $("response-body");
  var responseHeadersPanel = $("response-headers-panel");
  var responseHeaders = $("response-headers");
  var exposedNote = $("exposed-note");
  var requestError = $("request-error");

  var showHistoryButton = $("show-history");
  var showLibraryButton = $("show-library");
  var historyPanel = $("history-panel");
  var libraryPanel = $("library-panel");
  var historyList = $("history-list");
  var libraryList = $("library-list");
  var historyEmpty = $("history-empty");
  var libraryEmpty = $("library-empty");
  var historyCount = $("history-count");
  var libraryCount = $("library-count");
  var clearHistoryButton = $("clear-history");
  var importButton = $("import");
  var exportButton = $("export");
  var importFile = $("import-file");
  var savedMessage = $("saved-message");

  var controller = null; // the AbortController of the request in flight

  // --- Storage -----------------------------------------------------------

  function readStored(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key));
      return value === null ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }

  function writeStored(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Storage is off or full. The page still works until a reload.
    }
  }

  // Check and tidy a request from storage or an imported file.
  // Returns null if it can't be used.
  function cleanRequest(r) {
    if (!r || typeof r !== "object") return null;
    var method = String(r.method || "GET").toUpperCase();
    if (METHODS.indexOf(method) === -1) return null;
    if (typeof r.url !== "string") return null;
    var headers = Array.isArray(r.headers) ? r.headers : [];
    return {
      method: method,
      url: r.url,
      headers: headers
        .filter(function (h) { return h && typeof h.name === "string"; })
        .map(function (h) { return { name: h.name, value: String(h.value == null ? "" : h.value) }; }),
      bodyType: CONTENT_TYPES[r.bodyType] ? r.bodyType : "json",
      body: typeof r.body === "string" ? r.body : ""
    };
  }

  // "GET api.github.com/users/octocat"
  function defaultName(request) {
    var where = request.url;
    try {
      var url = new URL(request.url);
      where = url.host + (url.pathname === "/" ? "" : url.pathname);
    } catch (e) {
      // Not a full URL, use it as it is.
    }
    return (request.method + " " + where).slice(0, 100);
  }

  var history = (readStored(HISTORY_KEY, []) || []).map(function (h) {
    var r = cleanRequest(h);
    if (!r) return null;
    r.status = h.status;
    r.ms = h.ms;
    r.at = h.at;
    return r;
  }).filter(Boolean);

  var library = (readStored(LIBRARY_KEY, []) || []).map(function (l) {
    var r = cleanRequest(l);
    if (!r) return null;
    r.name = typeof l.name === "string" && l.name.trim() ? l.name.trim() : defaultName(r);
    return r;
  }).filter(Boolean);

  // --- Header rows -------------------------------------------------------

  function addHeaderRow(name, value) {
    var row = document.createElement("div");
    row.className = "header-row";

    var nameInput = document.createElement("input");
    nameInput.className = "form-control header-name";
    nameInput.placeholder = "Name";
    nameInput.setAttribute("aria-label", "Header name");
    nameInput.spellcheck = false;
    nameInput.value = name || "";

    var valueInput = document.createElement("input");
    valueInput.className = "form-control header-value";
    valueInput.placeholder = "Value";
    valueInput.setAttribute("aria-label", "Header value");
    valueInput.spellcheck = false;
    valueInput.value = value || "";

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn-outline-danger remove-header";
    remove.setAttribute("aria-label", "Remove header");
    remove.textContent = "×";
    remove.addEventListener("click", function () {
      row.remove();
      updateHeaderList();
      saveDraft();
    });

    var note = document.createElement("p");
    note.className = "note text-danger";
    note.textContent = "The browser sets this header itself, it will not be sent.";

    nameInput.addEventListener("input", function () {
      note.hidden = !isForbidden(nameInput.value);
    });
    note.hidden = !isForbidden(nameInput.value);

    row.append(nameInput, valueInput, remove, note);
    headersBox.append(row);
    updateHeaderList();
    return nameInput;
  }

  function isForbidden(name) {
    name = name.trim().toLowerCase();
    return FORBIDDEN.indexOf(name) !== -1 || name.indexOf("proxy-") === 0 || name.indexOf("sec-") === 0;
  }

  // The header rows as [{ name, value }], without empty names.
  function readHeaders() {
    var list = [];
    headersBox.querySelectorAll(".header-row").forEach(function (row) {
      var name = row.querySelector(".header-name").value.trim();
      var value = row.querySelector(".header-value").value;
      if (name !== "") list.push({ name: name, value: value });
    });
    return list;
  }

  function updateHeaderList() {
    noHeaders.hidden = headersBox.children.length > 0;
  }

  function updateBodySection() {
    bodySection.hidden = NO_BODY.indexOf(methodSelect.value) !== -1;
  }

  // --- The form as a request, and back -----------------------------------

  function currentRequest() {
    return {
      method: methodSelect.value,
      url: urlInput.value.trim(),
      headers: readHeaders(),
      bodyType: bodyType.value,
      body: bodyInput.value
    };
  }

  function applyRequest(request) {
    methodSelect.value = request.method;
    urlInput.value = request.url;
    headersBox.textContent = "";
    request.headers.forEach(function (h) { addHeaderRow(h.name, h.value); });
    bodyType.value = request.bodyType;
    bodyInput.value = request.body;
    formError.hidden = true;
    closeSaveRow();
    updateBodySection();
    updateHeaderList();
    saveDraft();
  }

  function saveDraft() {
    writeStored(LAST_KEY, currentRequest());
  }

  // --- History -----------------------------------------------------------

  function addToHistory(request, status, ms) {
    var entry = cleanRequest(request);
    entry.status = status;   // a number, or "error" / "cancelled"
    entry.ms = ms;
    entry.at = Date.now();
    history.unshift(entry);
    history = history.slice(0, HISTORY_MAX);
    writeStored(HISTORY_KEY, history);
    renderHistory();
  }

  function statusClass(status) {
    if (typeof status !== "number") return "status-error";
    if (status >= 400) return "status-error";
    if (status >= 300) return "status-redirect";
    return "status-ok";
  }

  function formatWhen(at) {
    var date = new Date(at);
    var today = new Date().toDateString() === date.toDateString();
    return today
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // One row in the history or the library. textContent everywhere, since
  // imported files and URLs are text from somewhere else.
  function makeRow(request, title, meta, action, onLoad, onAction) {
    var li = document.createElement("li");

    var load = document.createElement("button");
    load.type = "button";
    load.className = "saved-load";
    load.title = request.method + " " + request.url;

    if (title) {
      var titleEl = document.createElement("span");
      titleEl.className = "saved-title";
      titleEl.textContent = title;
      load.append(titleEl);
    }

    var urlLine = document.createElement("span");
    urlLine.className = "saved-url";
    var method = document.createElement("span");
    method.className = "method method-" + request.method;
    method.textContent = request.method;
    urlLine.append(method, document.createTextNode(request.url));
    load.append(urlLine);

    if (meta) load.append(meta);
    load.addEventListener("click", onLoad);

    var button = document.createElement("button");
    button.type = "button";
    button.className = "saved-action";
    button.textContent = action.text;
    button.title = action.label;
    button.setAttribute("aria-label", action.label);
    button.addEventListener("click", onAction);

    li.append(load, button);
    return li;
  }

  function renderHistory() {
    historyList.textContent = "";
    history.forEach(function (entry) {
      var meta = document.createElement("span");
      meta.className = "saved-meta";
      var status = document.createElement("span");
      status.className = statusClass(entry.status);
      status.textContent = String(entry.status);
      meta.append(status, document.createTextNode(
        (typeof entry.ms === "number" ? " · " + entry.ms + " ms" : "") +
        (entry.at ? " · " + formatWhen(entry.at) : "")));

      historyList.append(makeRow(entry, null, meta,
        { text: "☆", label: "Save to library" },
        function () { loadFromList(entry); },
        function () { loadFromList(entry); openSaveRow(); }));
    });
    historyEmpty.hidden = history.length > 0;
    clearHistoryButton.hidden = history.length === 0;
    historyCount.textContent = history.length ? "(" + history.length + ")" : "";
  }

  // --- Library -----------------------------------------------------------

  function saveLibrary() {
    writeStored(LIBRARY_KEY, library);
    renderLibrary();
  }

  // Add a request with a name, or replace the one with the same name.
  // Returns true if it replaced one.
  function putInLibrary(name, request) {
    var entry = cleanRequest(request);
    entry.name = name;
    var index = library.findIndex(function (l) { return l.name.toLowerCase() === name.toLowerCase(); });
    if (index === -1) {
      library.push(entry);
    } else {
      library[index] = entry;
    }
    return index !== -1;
  }

  function renderLibrary() {
    library.sort(function (a, b) { return a.name.localeCompare(b.name); });
    libraryList.textContent = "";
    library.forEach(function (entry) {
      libraryList.append(makeRow(entry, entry.name, null,
        { text: "×", label: "Delete " + entry.name },
        function () { loadFromList(entry); },
        function () {
          library = library.filter(function (l) { return l !== entry; });
          saveLibrary();
          showMessage("Deleted “" + entry.name + "”.");
        }));
    });
    libraryEmpty.hidden = library.length > 0;
    exportButton.disabled = library.length === 0;
    libraryCount.textContent = library.length ? "(" + library.length + ")" : "";
  }

  function loadFromList(request) {
    applyRequest(cleanRequest(request));
    // On a phone the list is below the form, so show the form.
    if (window.matchMedia("(max-width: 991px)").matches) {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // --- Save row ----------------------------------------------------------

  function openSaveRow() {
    var request = currentRequest();
    var existing = library.find(function (l) {
      return l.method === request.method && l.url === request.url;
    });
    saveName.value = existing ? existing.name : defaultName(request);
    saveRow.hidden = false;
    saveName.focus();
    saveName.select();
  }

  function closeSaveRow() {
    saveRow.hidden = true;
  }

  function confirmSave() {
    var name = saveName.value.trim();
    if (name === "") {
      saveName.focus();
      return;
    }
    if (urlInput.value.trim() === "") {
      formError.textContent = "Write a URL before saving.";
      formError.hidden = false;
      return;
    }
    var replaced = putInLibrary(name, currentRequest());
    saveLibrary();
    closeSaveRow();
    showList("library");
    showMessage((replaced ? "Updated “" : "Saved “") + name + "”.");
  }

  // --- Import and export -------------------------------------------------

  function exportLibrary() {
    var data = {
      type: EXPORT_TYPE,
      version: 1,
      exported: new Date().toISOString(),
      requests: library.map(function (l) {
        return { name: l.name, method: l.method, url: l.url, headers: l.headers, bodyType: l.bodyType, body: l.body };
      })
    };
    var blob = new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "make-request-library.json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
    showMessage("Exported " + library.length + (library.length === 1 ? " request." : " requests."));
  }

  function importLibrary(file) {
    file.text().then(function (text) {
      var data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        showMessage("“" + file.name + "” is not a JSON file.", true);
        return;
      }
      // Our own format, or just a list of requests.
      var list = Array.isArray(data) ? data : data && Array.isArray(data.requests) ? data.requests : null;
      if (!list) {
        showMessage("“" + file.name + "” has no list of requests.", true);
        return;
      }
      var added = 0;
      var updated = 0;
      var skipped = 0;
      list.forEach(function (item) {
        var request = cleanRequest(item);
        if (!request) {
          skipped++;
          return;
        }
        var name = item && typeof item.name === "string" && item.name.trim()
          ? item.name.trim().slice(0, 100) : defaultName(request);
        if (putInLibrary(name, request)) updated++; else added++;
      });
      saveLibrary();
      showList("library");
      var parts = [added + " added"];
      if (updated) parts.push(updated + " updated");
      if (skipped) parts.push(skipped + " skipped (not valid)");
      showMessage("Imported: " + parts.join(", ") + ".", skipped > 0 && added + updated === 0);
    });
  }

  // --- History / library tabs --------------------------------------------

  function showList(which) {
    var isHistory = which === "history";
    historyPanel.hidden = !isHistory;
    libraryPanel.hidden = isHistory;
    showHistoryButton.classList.toggle("active", isHistory);
    showLibraryButton.classList.toggle("active", !isHistory);
    showHistoryButton.setAttribute("aria-pressed", String(isHistory));
    showLibraryButton.setAttribute("aria-pressed", String(!isHistory));
  }

  var messageTimer = null;
  function showMessage(text, isError) {
    savedMessage.textContent = text;
    savedMessage.className = "small mt-2 mb-0 " + (isError ? "text-danger" : "text-success");
    clearTimeout(messageTimer);
    messageTimer = setTimeout(function () { savedMessage.textContent = ""; }, 6000);
  }

  // --- Showing the response ----------------------------------------------

  function formatBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / 1024 / 1024).toFixed(1) + " MB";
  }

  function isText(contentType) {
    return contentType === "" ||
      /^text\/|json|xml|javascript|ecmascript|x-www-form-urlencoded|graphql|yaml|csv/i.test(contentType);
  }

  // Turn the body bytes into something to show. JSON is pretty-printed.
  function bodyText(bytes, contentType) {
    if (bytes.byteLength === 0) return "";
    if (!isText(contentType)) {
      return "(" + (contentType || "binary") + ", " + formatBytes(bytes.byteLength) + ", not shown)";
    }
    var text = new TextDecoder().decode(bytes);
    if (/json/i.test(contentType) || /^\s*[\[{]/.test(text)) {
      try {
        return JSON.stringify(JSON.parse(text), null, 2);
      } catch (e) {
        // Not JSON after all, show it as it is.
      }
    }
    return text;
  }

  function showStatus(response) {
    var kind = response.status >= 400 ? "danger" : response.status >= 300 ? "warning" : "success";
    statusBadge.className = "badge text-bg-" + kind;
    statusBadge.textContent = response.status + " " + (response.statusText || "");
  }

  function showResponseHeaders(response) {
    responseHeaders.textContent = "";
    var count = 0;
    response.headers.forEach(function (value, name) {
      var tr = document.createElement("tr");
      var nameCell = document.createElement("td");
      var valueCell = document.createElement("td");
      nameCell.textContent = name;
      valueCell.textContent = value;
      tr.append(nameCell, valueCell);
      responseHeaders.append(tr);
      count++;
    });
    headerCount.textContent = "(" + count + ")";
  }

  function showTab(which) {
    var body = which === "body";
    responseBody.hidden = !body;
    responseHeadersPanel.hidden = body;
    showBodyButton.classList.toggle("active", body);
    showHeadersButton.classList.toggle("active", !body);
    showBodyButton.setAttribute("aria-pressed", String(body));
    showHeadersButton.setAttribute("aria-pressed", String(!body));
  }

  function showError(message) {
    requestError.textContent = message;
    requestError.hidden = false;
  }

  // fetch() gives the same vague error for CORS, a wrong address and no
  // network, so we can only list the likely reasons.
  function explainNetworkError(url) {
    var lines = ["The request failed before a response could be read."];
    if (location.protocol === "https:" && url.protocol === "http:" && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname)) {
      lines.push("This page is https and the URL is http. Browsers block that (mixed content). Try https:// instead.");
    }
    if (!ext) {
      lines.push("Most likely the server does not allow CORS: it did not send an Access-Control-Allow-Origin header. " +
        "Requests with PUT, PATCH, DELETE, JSON bodies or custom headers also need the server to answer an OPTIONS preflight.");
    }
    lines.push("It can also be a typo in the address, a server that is down, or no network. The browser console (F12) has the exact reason.");
    return lines.join("\n\n");
  }

  // --- Sending -----------------------------------------------------------

  function setSending(sending) {
    sendButton.textContent = sending ? "Cancel" : "Send";
    sendButton.classList.toggle("btn-primary", !sending);
    sendButton.classList.toggle("btn-outline-danger", sending);
  }

  function buildOptions(request) {
    var headers = new Headers();
    request.headers.forEach(function (h) {
      if (isForbidden(h.name)) return;
      headers.append(h.name, h.value); // throws on invalid names, caught in send()
    });

    var options = { method: request.method, headers: headers, signal: controller.signal, cache: "no-store" };

    if (NO_BODY.indexOf(request.method) === -1 && request.body !== "") {
      if (request.bodyType === "json") {
        JSON.parse(request.body); // throws on invalid JSON, caught in send()
      }
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", CONTENT_TYPES[request.bodyType]);
      }
      options.body = request.body;
    }
    return options;
  }

  async function send() {
    formError.hidden = true;
    requestError.hidden = true;

    var request = currentRequest();
    var url;
    try {
      url = new URL(request.url);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    } catch (e) {
      formError.textContent = "Write a full address that starts with http:// or https://.";
      formError.hidden = false;
      return;
    }

    controller = new AbortController();
    var options;
    try {
      options = buildOptions(request);
    } catch (e) {
      formError.textContent = e instanceof SyntaxError
        ? "The body is not valid JSON: " + e.message
        : "A header is not valid: " + e.message;
      formError.hidden = false;
      controller = null;
      return;
    }

    saveDraft();
    setSending(true);
    var started = performance.now();

    try {
      var response = await fetch(url.href, options);
      var bytes = await response.arrayBuffer();
      var ms = Math.round(performance.now() - started);
      var contentType = response.headers.get("Content-Type") || "";

      showStatus(response);
      timing.textContent = ms + " ms · " + formatBytes(bytes.byteLength);
      finalUrl.hidden = !response.redirected;
      finalUrl.textContent = response.redirected ? "Redirected to " + response.url : "";
      responseBody.textContent = request.method === "HEAD" ? "(HEAD responses have no body)" : bodyText(bytes, contentType);
      showResponseHeaders(response);
      responseSection.hidden = false;
      addToHistory(request, response.status, ms);
    } catch (e) {
      responseSection.hidden = true;
      if (e.name === "AbortError") {
        showError("The request was cancelled.");
        addToHistory(request, "cancelled", null);
      } else {
        showError(explainNetworkError(url));
        addToHistory(request, "error", null);
      }
    } finally {
      controller = null;
      setSending(false);
    }
  }

  // --- Extension permission ----------------------------------------------

  function checkPermission() {
    if (!ext || !ext.permissions) return;
    ext.permissions.contains(ALL_SITES).then(function (granted) {
      permissionNote.hidden = granted;
    });
  }

  permissionButton.addEventListener("click", function () {
    // Must be called straight from a click, or the browser refuses.
    ext.permissions.request(ALL_SITES).then(function (granted) {
      permissionNote.hidden = granted;
    });
  });

  // --- Events ------------------------------------------------------------

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (controller) {
      controller.abort();
    } else {
      send();
    }
  });

  addHeaderButton.addEventListener("click", function () {
    addHeaderRow("", "").focus();
  });

  methodSelect.addEventListener("change", function () {
    updateBodySection();
    saveDraft();
  });

  // Save while typing, so a reload keeps what was written.
  form.addEventListener("input", function (event) {
    if (event.target !== saveName) saveDraft();
  });

  showBodyButton.addEventListener("click", function () { showTab("body"); });
  showHeadersButton.addEventListener("click", function () { showTab("headers"); });

  saveButton.addEventListener("click", function () {
    if (saveRow.hidden) openSaveRow(); else closeSaveRow();
  });
  saveConfirm.addEventListener("click", confirmSave);
  saveCancel.addEventListener("click", closeSaveRow);
  // The save row is inside the form: Enter there saves instead of sending.
  saveName.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmSave();
    } else if (event.key === "Escape") {
      closeSaveRow();
    }
  });

  showHistoryButton.addEventListener("click", function () { showList("history"); });
  showLibraryButton.addEventListener("click", function () { showList("library"); });

  // Two clicks to clear: the first one asks.
  clearHistoryButton.addEventListener("click", function () {
    if (clearHistoryButton.dataset.confirm !== "yes") {
      clearHistoryButton.dataset.confirm = "yes";
      clearHistoryButton.textContent = "Click again to clear";
      setTimeout(function () {
        clearHistoryButton.dataset.confirm = "";
        clearHistoryButton.textContent = "Clear history";
      }, 3000);
      return;
    }
    clearHistoryButton.dataset.confirm = "";
    clearHistoryButton.textContent = "Clear history";
    history = [];
    writeStored(HISTORY_KEY, history);
    renderHistory();
    showMessage("History cleared.");
  });

  exportButton.addEventListener("click", exportLibrary);
  importButton.addEventListener("click", function () { importFile.click(); });
  importFile.addEventListener("change", function () {
    if (importFile.files.length) importLibrary(importFile.files[0]);
    importFile.value = ""; // so the same file can be picked again
  });

  // --- Start -------------------------------------------------------------

  if (ext) {
    corsNote.hidden = true;
    exposedNote.hidden = true;
    checkPermission();
  }
  var last = cleanRequest(readStored(LAST_KEY, null));
  if (last) applyRequest(last);
  updateBodySection();
  updateHeaderList();
  renderHistory();
  renderLibrary();
})();

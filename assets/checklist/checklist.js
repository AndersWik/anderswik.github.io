/*
 * A checklist that remembers its items.
 *
 * The state is a list of items, each { text: "Buy milk", done: false }.
 * Every change saves the list to localStorage and redraws it, so the
 * list is still there after a reload.
 *
 * "Add an item" turns into a text field. Enter adds the item and keeps
 * the field open for the next one; Escape, or leaving an empty field,
 * closes it again.
 */

(function () {
  var STORAGE_KEY = "checklist-items";

  // --- State -------------------------------------------------------------

  var items = load();

  // --- Elements ----------------------------------------------------------

  var addBtn = document.getElementById("add");
  var form = document.getElementById("form");
  var input = document.getElementById("new-item");
  var list = document.getElementById("items");
  var empty = document.getElementById("empty");
  var footer = document.getElementById("footer");
  var count = document.getElementById("count");
  var clearBtn = document.getElementById("clear");

  // --- Saving ------------------------------------------------------------

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch (e) {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      // Storage is off or full, the list still works until a reload.
    }
  }

  // --- Drawing -----------------------------------------------------------

  function render() {
    list.textContent = "";

    items.forEach(function (item, index) {
      var li = document.createElement("li");
      li.classList.toggle("done", item.done);

      var label = document.createElement("label");
      var box = document.createElement("input");
      box.type = "checkbox";
      box.checked = item.done;
      box.addEventListener("change", function () { toggle(index); });

      var text = document.createElement("span");
      text.className = "item-text";
      text.textContent = item.text; // textContent, so typed HTML stays text

      label.append(box, text);

      var del = document.createElement("button");
      del.type = "button";
      del.className = "checklist-delete";
      del.setAttribute("aria-label", "Delete " + item.text);
      del.textContent = "×";
      del.addEventListener("click", function () { remove(index); });

      li.append(label, del);
      list.append(li);
    });

    var done = items.filter(function (item) { return item.done; }).length;
    showEmpty();
    footer.hidden = items.length === 0;
    count.textContent = done + " of " + items.length + " done";
    clearBtn.disabled = done === 0;
  }

  // The picture shows only when the list is empty and nobody is typing.
  function showEmpty() {
    empty.hidden = items.length > 0 || !form.hidden;
  }

  // --- Actions -----------------------------------------------------------

  // Opening and closing the field only touches the field and the picture,
  // not the list. Redrawing the list on blur would replace the checkbox
  // that is being clicked, and the click would be lost.
  function openForm() {
    addBtn.hidden = true;
    form.hidden = false;
    input.focus();
    showEmpty();
  }

  function closeForm() {
    input.value = "";
    form.hidden = true;
    addBtn.hidden = false;
    showEmpty();
  }

  function add(text) {
    items.push({ text: text, done: false });
    save();
    render();
  }

  function toggle(index) {
    items[index].done = !items[index].done;
    save();
    render();
  }

  function remove(index) {
    items.splice(index, 1);
    save();
    render();
  }

  function clearDone() {
    items = items.filter(function (item) { return !item.done; });
    save();
    render();
  }

  // --- Events ------------------------------------------------------------

  addBtn.addEventListener("click", openForm);

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // stay on the page
    var text = input.value.trim();
    if (text !== "") {
      add(text);
      input.value = "";
    }
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeForm();
  });

  input.addEventListener("blur", function () {
    if (input.value.trim() === "") closeForm();
  });

  clearBtn.addEventListener("click", clearDone);

  render();
})();

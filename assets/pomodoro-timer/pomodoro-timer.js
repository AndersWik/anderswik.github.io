/*
 * A Pomodoro timer.
 *
 * Two modes: "focus" (default 25 min) and "break" (default 5 min).
 * The play button in the middle of the ring starts and pauses the timer,
 * and the ring fills up as time passes. The - and + buttons change the
 * length of the current mode by one minute (only while not running).
 *
 * When a session ends we play a short beep and switch to the other mode,
 * so the next press on play starts the break (or the next focus).
 *
 * The time left is calculated from a fixed end time rather than by
 * counting ticks, so it stays correct even if the browser slows down
 * timers in a background tab.
 */

(function () {
  // --- State -------------------------------------------------------------

  var minutes = { focus: 25, break: 5 };
  var mode = "focus";
  var remainingMs = minutes.focus * 60 * 1000;
  var endTime = null; // set while running
  var tickId = null;

  // --- Elements ----------------------------------------------------------

  var root = document.querySelector(".pomodoro");
  var timeEl = document.getElementById("time");
  var playBtn = document.getElementById("play");
  var minusBtn = document.getElementById("minus");
  var plusBtn = document.getElementById("plus");
  var ring = document.getElementById("ring-progress");
  var modeBtns = document.querySelectorAll(".pomodoro-mode");

  var circumference = 2 * Math.PI * ring.r.baseVal.value;
  ring.style.strokeDasharray = circumference;

  // --- Helpers -----------------------------------------------------------

  function totalMs() {
    return minutes[mode] * 60 * 1000;
  }

  function isRunning() {
    return endTime !== null;
  }

  function format(ms) {
    var secs = Math.ceil(ms / 1000);
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  // Browsers only allow sound after a click, so the audio is made in start().
  var ctx = null;

  function beep() {
    if (!ctx) return;
    try {
      [0, 0.35, 0.7].forEach(function (offset) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.25);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.25);
      });
    } catch (e) {
      // No audio support, the timer still works silently.
    }
  }

  // --- Drawing -----------------------------------------------------------

  function render() {
    var text = format(remainingMs);
    timeEl.textContent = text;
    document.title = (isRunning() ? text + " · " : "") + "Pomodoro Timer";

    var done = 1 - remainingMs / totalMs();
    ring.style.strokeDashoffset = circumference * (1 - done);
    // Hide the round line cap when nothing has elapsed yet.
    ring.style.visibility = done > 0 ? "visible" : "hidden";

    root.classList.toggle("running", isRunning());
    playBtn.setAttribute("aria-label", isRunning() ? "Pause" : "Start");
    minusBtn.disabled = isRunning() || minutes[mode] <= 1;
    plusBtn.disabled = isRunning() || minutes[mode] >= 99;

    modeBtns.forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });
  }

  // --- Actions -----------------------------------------------------------

  function start() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        // No audio support, the timer still works silently.
      }
    }
    endTime = Date.now() + remainingMs;
    tickId = setInterval(tick, 250);
    render();
  }

  function pause() {
    remainingMs = Math.max(0, endTime - Date.now());
    endTime = null;
    clearInterval(tickId);
    render();
  }

  function tick() {
    remainingMs = Math.max(0, endTime - Date.now());
    if (remainingMs === 0) {
      endTime = null;
      clearInterval(tickId);
      beep();
      setMode(mode === "focus" ? "break" : "focus");
      return;
    }
    render();
  }

  function setMode(newMode) {
    if (isRunning()) pause();
    mode = newMode;
    remainingMs = totalMs();
    render();
  }

  function adjust(delta) {
    if (isRunning()) return;
    minutes[mode] = Math.min(99, Math.max(1, minutes[mode] + delta));
    remainingMs = totalMs();
    render();
  }

  // --- Events ------------------------------------------------------------

  playBtn.addEventListener("click", function () {
    isRunning() ? pause() : start();
  });
  minusBtn.addEventListener("click", function () { adjust(-1); });
  plusBtn.addEventListener("click", function () { adjust(1); });
  modeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () { setMode(btn.dataset.mode); });
  });

  render();
})();

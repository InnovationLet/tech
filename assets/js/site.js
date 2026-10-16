(function () {
  "use strict";

  /* ---------------------------------------------------------- Mobile nav */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (event) {
      if (event.target.tagName === "A" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* --------------------------------------------------- Navbar dropdowns */
  var dropdowns = document.querySelectorAll(".nav-dropdown");
  dropdowns.forEach(function (dd) {
    dd.addEventListener("toggle", function () {
      if (!dd.open) return;
      dropdowns.forEach(function (other) {
        if (other !== dd) other.open = false;
      });
    });
  });
  document.addEventListener("click", function (event) {
    dropdowns.forEach(function (dd) {
      if (dd.open && !dd.contains(event.target)) dd.open = false;
    });
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      dropdowns.forEach(function (dd) { dd.open = false; });
    }
  });

  /* -------------------------------------------------- Footer reveal */
  var footer = document.querySelector(".site-footer");
  function sizeFooter() {
    if (!footer) return;
    document.body.style.setProperty("--footer-h", footer.offsetHeight + "px");
  }
  if (footer) {
    document.body.classList.add("has-footer-reveal");
    sizeFooter();
    window.addEventListener("resize", sizeFooter);
    if ("ResizeObserver" in window) new ResizeObserver(sizeFooter).observe(footer);
  }

  var article = document.getElementById("article-body");
  if (!article) return;

  /* -------------------------------------------------- Text size control */
  var SIZES = [0.9, 1, 1.1, 1.2, 1.35, 1.5];
  var sizeIndex = 2;
  try {
    var stored = parseInt(localStorage.getItem("il-text-size"), 10);
    if (!isNaN(stored) && stored >= 0 && stored < SIZES.length) sizeIndex = stored;
  } catch (e) {}
  function applySize() {
    article.style.setProperty("--reading-scale", SIZES[sizeIndex]);
    try { localStorage.setItem("il-text-size", sizeIndex); } catch (e) {}
  }
  applySize();
  document.querySelectorAll("[data-fontsize]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var delta = btn.getAttribute("data-fontsize") === "up" ? 1 : -1;
      sizeIndex = Math.min(SIZES.length - 1, Math.max(0, sizeIndex + delta));
      applySize();
    });
  });

  /* -------------------------------------------------- Print */
  document.querySelectorAll("[data-print]").forEach(function (btn) {
    btn.addEventListener("click", function () { window.print(); });
  });

  /* -------------------------------------------------- Copy URL */
  function copyUrl(btn) {
    var url = window.location.href;
    var label = btn.querySelector("[data-copy-label]") || btn.querySelector(".tool__label");
    var original = label ? label.textContent : "";
    var done = function () {
      if (!label) return;
      label.textContent = "Copied";
      btn.classList.add("is-copied");
      window.setTimeout(function () {
        label.textContent = original;
        btn.classList.remove("is-copied");
      }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () {});
    } else {
      var ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  }
  document.querySelectorAll("[data-copy-url]").forEach(function (btn) {
    btn.addEventListener("click", function () { copyUrl(btn); });
  });

  /* -------------------------------------------------- Native share */
  var shareBtn = document.querySelector("[data-share]");
  if (shareBtn && navigator.share) {
    shareBtn.hidden = false;
    shareBtn.addEventListener("click", function () {
      navigator.share({
        title: document.title,
        url: window.location.href
      }).catch(function () {});
    });
  }

  /* -------------------------------------------------- Listen (TTS) */
  var listenBtn = document.querySelector("[data-listen]");
  if (listenBtn) {
    var synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      listenBtn.hidden = true;
    } else {
      var state = "idle";
      var utterance = null;
      var label = listenBtn.querySelector("[data-listen-label]");

      function setState(next) {
        state = next;
        listenBtn.setAttribute("data-state", next);
        listenBtn.setAttribute("aria-pressed", next === "playing" ? "true" : "false");
        if (label) label.textContent = next === "playing" ? "Pause" : (next === "paused" ? "Resume" : "Listen");
      }

      function buildText() {
        var clone = article.cloneNode(true);
        clone.querySelectorAll(".quick-summary, .sr-only").forEach(function (n) { n.remove(); });
        return clone.textContent.replace(/\s+/g, " ").trim();
      }

      function speak() {
        utterance = new SpeechSynthesisUtterance(buildText());
        utterance.lang = document.documentElement.lang || "en";
        utterance.rate = 1;
        utterance.onend = function () { setState("idle"); };
        utterance.onerror = function () { setState("idle"); };
        synth.speak(utterance);
        setState("playing");
      }

      listenBtn.addEventListener("click", function () {
        if (state === "playing") {
          synth.pause();
          setState("paused");
        } else if (state === "paused") {
          synth.resume();
          setState("playing");
        } else {
          synth.cancel();
          speak();
        }
      });

      window.addEventListener("beforeunload", function () { synth.cancel(); });
    }
  }
})();

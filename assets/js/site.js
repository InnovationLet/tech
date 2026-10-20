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

  /* -------------------------------------------------- Back to top */
  var toTop = document.querySelector("[data-back-to-top]");
  if (toTop) {
    var syncToTop = function () {
      toTop.hidden = window.scrollY < 500;
    };
    window.addEventListener("scroll", syncToTop, { passive: true });
    syncToTop();
    toTop.addEventListener("click", function () {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  var article = document.getElementById("article-body");

  /* ------------------------------------------ Hide-on-scroll header */
  var header = document.querySelector(".site-header");
  if (header) {
    var HIDE_AFTER = 160;
    var lastY = window.scrollY;
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY;
        var diff = y - lastY;
        if (diff > 4 && y > HIDE_AFTER) {
          header.classList.add("is-hidden");
          if (nav && nav.classList.contains("is-open")) {
            nav.classList.remove("is-open");
            if (toggle) toggle.setAttribute("aria-expanded", "false");
          }
          dropdowns.forEach(function (dd) { dd.open = false; });
        } else if (diff < -4 || y <= HIDE_AFTER) {
          header.classList.remove("is-hidden");
        }
        lastY = y;
        ticking = false;
      });
    }, { passive: true });
  }

  if (!article) return;

  if (article) {
    /* Read progress */
    var progressBar = document.querySelector(".read-progress__bar");
    if (progressBar) {
      var onScroll = function () {
        var h = document.documentElement;
        var scrollTop = h.scrollTop || document.body.scrollTop;
        var docHeight = h.scrollHeight - h.clientHeight;
        var pct = docHeight > 0 ? scrollTop / docHeight : 0;
        progressBar.style.transform = "scaleX(" + pct + ")";
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    /* Auto-link TOC for h2/h3 */
    var toc = document.querySelector("[data-toc]");
    var tocList = toc ? toc.querySelector("[data-toc-list]") : null;
    if (toc && tocList) {
      var headings = article.querySelectorAll("h2, h3");
      if (headings.length > 0) {
        toc.hidden = false;
        var used = {};
        headings.forEach(function (h) {
          if (!h.id) {
            var base = h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
            var id = base;
            var i = 1;
            while (document.getElementById(id) || used[id]) {
              id = base + "-" + i++;
            }
            h.id = id;
            used[id] = true;
          }
          var li = document.createElement("li");
          li.className = h.tagName === "H3" ? "toc__item toc__item--sub" : "toc__item";
          var a = document.createElement("a");
          a.href = "#" + h.id;
          a.textContent = h.textContent.trim();
          a.className = "toc__link";
          li.appendChild(a);
          tocList.appendChild(li);
        });
        var links = tocList.querySelectorAll(".toc__link");
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              links.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + entry.target.id); });
            }
          });
        }, { rootMargin: "-40% 0px -55% 0px" });
        headings.forEach(function (h) { obs.observe(h); });
      }
    }
  }

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

  /* -------------------------------------------------- Translate article */
  var translateWrap = document.querySelector("[data-translate]");
  if (translateWrap) {
    var tToggle = translateWrap.querySelector("[data-translate-toggle]");
    var tPanel = translateWrap.querySelector("[data-translate-panel]");
    var tLangs = translateWrap.querySelector("[data-translate-langs]");
    var LANGS = [
      ["en", "English"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"], ["pt", "Português"],
      ["it", "Italiano"], ["nl", "Nederlands"], ["pl", "Polski"], ["ru", "Русский"],
      ["tr", "Türkçe"], ["ar", "العربية"], ["hi", "हिन्दी"], ["bn", "বাংলা"],
      ["zh-CN", "中文 (简体)"], ["ja", "日本語"], ["ko", "한국어"], ["id", "Bahasa Indonesia"],
      ["vi", "Tiếng Việt"], ["th", "ไทย"], ["he", "עברית"], ["fa", "فارسی"]
    ];
    var gtLoading = false;

    function closeTranslatePanel() {
      if (!tPanel) return;
      tPanel.hidden = true;
      if (tToggle) tToggle.setAttribute("aria-expanded", "false");
    }

    function buildLangButtons() {
      if (!tLangs) return;
      tLangs.innerHTML = "";
      LANGS.forEach(function (pair) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = pair[1];
        b.setAttribute("data-lang", pair[0]);
        b.setAttribute("role", "menuitem");
        tLangs.appendChild(b);
      });
    }

    function applyGoogleLang(code) {
      var tries = 0;
      (function attempt() {
        var combo = document.querySelector("#google_translate_element select.goog-te-combo");
        if (combo) {
          combo.value = code || "";
          combo.dispatchEvent(new Event("change"));
          return;
        }
        if (tries++ < 60) window.setTimeout(attempt, 150);
      })();
    }

    function loadGoogleTranslate() {
      if (window.__ilGtLoaded) return;
      window.__ilGtLoaded = true;
      window.googleTranslateElementInit = function () {
        new window.google.translate.TranslateElement({
          pageLanguage: document.documentElement.lang || "en",
          includedLanguages: LANGS.map(function (p) { return p[0]; }).join(","),
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
        }, "google_translate_element");
      };
      var s = document.createElement("script");
      s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      s.async = true;
      document.head.appendChild(s);
    }

    if (tToggle && tPanel) {
      buildLangButtons();
      tToggle.addEventListener("click", function () {
        if (tPanel.hidden) {
          loadGoogleTranslate();
          tPanel.hidden = false;
          tToggle.setAttribute("aria-expanded", "true");
        } else {
          closeTranslatePanel();
        }
      });
      if (tLangs) {
        tLangs.addEventListener("click", function (event) {
          var el = event.target;
          if (!(el instanceof Element)) return;
          var btn = el.closest("button[data-lang]");
          if (!btn) return;
          applyGoogleLang(btn.getAttribute("data-lang"));
          closeTranslatePanel();
        });
      }
      document.addEventListener("click", function (event) {
        if (!translateWrap.contains(event.target)) closeTranslatePanel();
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeTranslatePanel();
      });
    }
  }
})();

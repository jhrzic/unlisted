/* Sodales-style component showcase — interactions only.
   Drives the Live Trace stepper + streaming terminal. Fully degrades
   without JS and respects prefers-reduced-motion. */
(function () {
  "use strict";

  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Live Trace: reasoning steps + terminal, kept in sync */
  var steps = Array.prototype.slice.call(document.querySelectorAll(".trace-step"));
  var termBody = document.getElementById("trace-term-body");

  var TERM_LINES = [
    "01 · intake      request received · queue depth 0",
    "02 · plan        decompose → 5 sub-goals",
    "03 · research    retrieve → 14 sources ranked",
    "04 · tools       invoke(search, db.query, http.get)",
    "05 · reason      synthesize · 3 conflicts resolved",
    "06 · compose     draft(format = executive_brief)",
    "07 · deliver     ship → result.md · done"
  ];

  function paintSteps(active) {
    steps.forEach(function (s, i) {
      s.classList.toggle("is-running", i === active);
      s.classList.toggle("is-done", i < active);
      s.classList.toggle("is-pending", i > active);
    });
  }

  if (steps.length && termBody) {
    if (reduce) {
      // static "completed" state
      steps.forEach(function (s) { s.classList.add("is-done"); });
      termBody.textContent = TERM_LINES.join("\n");
    } else {
      var active = 0;
      function renderTerm(upto) {
        termBody.innerHTML = "";
        for (var i = 0; i <= upto && i < TERM_LINES.length; i++) {
          var row = document.createElement("div");
          row.className = "term-line" + (i === upto ? " term-line--cur" : "");
          row.textContent = TERM_LINES[i];
          termBody.appendChild(row);
        }
      }
      function tick() {
        paintSteps(active);
        renderTerm(active);
        active++;
        if (active > steps.length) active = 0;
      }
      tick();
      setInterval(tick, 1500);
    }
  }

  /* Animated pull-quote: word-by-word fade-up on scroll (degrades to plain text) */
  var quote = document.querySelector("[data-quote]");
  if (quote) {
    var raw = quote.getAttribute("data-quote");
    if (!reduce) {
      quote.textContent = "";
      var words = raw.split(/(\s+)/);
      var wi = 0;
      words.forEach(function (w) {
        if (/^\s+$/.test(w)) {
          quote.appendChild(document.createTextNode(w));
          return;
        }
        var span = document.createElement("span");
        span.className = "q-word";
        span.textContent = w;
        span.style.transitionDelay = (wi * 55) + "ms";
        quote.appendChild(span);
        wi++;
      });
      if ("IntersectionObserver" in window) {
        var qio = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) { quote.classList.add("q-in"); qio.unobserve(e.target); }
          });
        }, { threshold: 0.35 });
        qio.observe(quote);
      } else {
        quote.classList.add("q-in");
      }
    } else {
      quote.textContent = raw;
    }
  }

  /* Mobile nav */
  var t = document.getElementById("cnav-toggle");
  var m = document.getElementById("cnav-menu");
  if (t && m) {
    t.addEventListener("click", function () {
      var open = m.classList.toggle("is-open");
      t.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* Reveal on scroll */
  var rev = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    rev.forEach(function (el) { io.observe(el); });
  } else {
    rev.forEach(function (el) { el.classList.add("is-in"); });
  }
})();

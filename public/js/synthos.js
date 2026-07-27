/* Synthos landing — progressive enhancement only.
   The page is fully readable without JS; this adds motion, counters,
   the streaming handoff log, and the pipeline sequencing. */
(function () {
  "use strict";

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- If the user prefers reduced motion, freeze all SVG (SMIL) flow ---- */
  if (reduceMotion) {
    document.querySelectorAll("svg").forEach(function (svg) {
      if (typeof svg.pauseAnimations === "function") {
        try {
          svg.pauseAnimations();
        } catch (e) {
          /* ignore */
        }
      }
    });
  }

  /* ---------------- Reveal on scroll ---------------- */
  var reveal = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    reveal.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveal.forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  /* ---------------- Animated counters ---------------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    if (reduceMotion) {
      el.textContent = prefix + target.toFixed(decimals) + suffix;
      return;
    }
    var start = null;
    var dur = 1400;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = prefix + val.toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(frame);
  }

  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) {
      cio.observe(el);
    });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------------- Pipeline sequencing ---------------- */
  var stages = Array.prototype.slice.call(
    document.querySelectorAll(".pipe-stage")
  );
  if (stages.length && !reduceMotion) {
    var active = 0;
    function tick() {
      stages.forEach(function (s, i) {
        s.classList.toggle("is-active", i === active);
        s.classList.toggle("is-done", i < active);
      });
      active = (active + 1) % (stages.length + 1);
    }
    tick();
    setInterval(tick, 1800);
  } else {
    stages.forEach(function (s) {
      s.classList.add("is-active");
    });
  }

  /* ---------------- Streaming handoff log ---------------- */
  var logEl = document.getElementById("handoff-log");
  if (logEl) {
    var lines = [
      { from: "orchestrator", to: "planner", msg: "Break down: “ship onboarding email flow”" },
      { from: "planner", to: "researcher", msg: "Delegate: gather Stripe + Resend API docs" },
      { from: "researcher", to: "coder", msg: "Handoff: 4 sources, schema + types attached" },
      { from: "coder", to: "reviewer", msg: "PR #482 ready — 6 files, tests green" },
      { from: "reviewer", to: "coder", msg: "Requested change: rate-limit the webhook" },
      { from: "coder", to: "reviewer", msg: "Patched. Re-requesting review" },
      { from: "reviewer", to: "deployer", msg: "Approved · 0 blocking issues" },
      { from: "deployer", to: "orchestrator", msg: "Shipped to production ✓ task closed" }
    ];
    var roleClass = {
      orchestrator: "r-orch",
      planner: "r-plan",
      researcher: "r-res",
      coder: "r-code",
      reviewer: "r-rev",
      deployer: "r-dep"
    };

    if (reduceMotion) {
      lines.forEach(function (l) {
        logEl.appendChild(buildLine(l, true));
      });
      return;
    }

    var idx = 0;
    function buildLine(l, full) {
      var row = document.createElement("div");
      row.className = "log-row";
      var tag = document.createElement("span");
      tag.className = "log-tag " + (roleClass[l.from] || "");
      tag.textContent = l.from + " → " + l.to;
      var body = document.createElement("span");
      body.className = "log-msg";
      body.textContent = full ? l.msg : "";
      row.appendChild(tag);
      row.appendChild(body);
      row._full = l.msg;
      row._body = body;
      return row;
    }

    function typeMsg(row, done) {
      var full = row._full;
      var body = row._body;
      var i = 0;
      (function type() {
        body.textContent = full.slice(0, i);
        i++;
        if (i <= full.length) {
          setTimeout(type, 14);
        } else if (done) {
          done();
        }
      })();
    }

    function nextLine() {
      var l = lines[idx % lines.length];
      var row = buildLine(l, false);
      logEl.appendChild(row);
      // keep the log from growing forever
      while (logEl.children.length > 6) {
        logEl.removeChild(logEl.firstChild);
      }
      typeMsg(row, function () {
        idx++;
        setTimeout(nextLine, 900);
      });
    }
    nextLine();
  }

  /* ---------------- Mobile nav ---------------- */
  var navBtn = document.getElementById("nav-toggle");
  var navMenu = document.getElementById("nav-menu");
  if (navBtn && navMenu) {
    navBtn.addEventListener("click", function () {
      var open = navMenu.classList.toggle("is-open");
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navMenu.classList.remove("is-open");
        navBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- Subtle pointer parallax on hero graph ---------------- */
  var orb = document.querySelector(".orb");
  if (orb && !reduceMotion && window.matchMedia("(pointer:fine)").matches) {
    var hero = document.querySelector(".hero");
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;
      var dy = (e.clientY - r.top) / r.height - 0.5;
      orb.style.transform =
        "translate3d(" + dx * 14 + "px," + dy * 14 + "px,0)";
    });
    hero.addEventListener("mouseleave", function () {
      orb.style.transform = "translate3d(0,0,0)";
    });
  }
})();

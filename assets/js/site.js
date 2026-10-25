/* ------------------------------------------------------------------
   1. Draws the contour map of San Francisco's hills that sits behind the
      page, from the landmarks in _config.yml plus a few background hills.
      On the first page of a visit the lines trace outward from the peaks
      once (about 1.4s), then stay still.
   2. Gives the top bar a hairline once the page scrolls.
   3. Turns "Write to me about this" on Tangents into an email about that
      tangent. The address is only assembled on click, so it never appears
      in the page in a form scrapers can read.
   4. Turns "Cite this idea" on Tangents into a BibTeX entry for that
      tangent, shown under its slip and copied to the clipboard.
   Nothing here is required to read the page.
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  // Background hills, as fractions of the window (x, y, height, spread).
  // Kept mostly toward the edges, where the map shows beside the letter.
  var BACKDROP = [
    [0.30, 0.10, 0.45, 0.07],
    [0.02, 0.52, 0.30, 0.06],
    [0.26, 0.90, 0.50, 0.09],
    [0.70, 0.12, 0.40, 0.07],
    [0.96, 0.22, 0.35, 0.06],
    [0.76, 0.84, 0.55, 0.09],
    [0.97, 0.78, 0.35, 0.07],
    [0.50, 0.55, 0.45, 0.14]
  ];
  var LEVELS = 16;
  var DURATION = 1400;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function hills(root) {
    var list = BACKDROP.slice();
    root.querySelectorAll(".landmark").forEach(function (el) {
      var x = parseFloat(el.dataset.x), y = parseFloat(el.dataset.y), h = parseFloat(el.dataset.h || "1");
      if (!isNaN(x) && !isNaN(y)) list.push([x, y, h, 0.034 + 0.014 * h]);
    });
    return list;
  }

  // Trace every contour level once; returns [{index, segs:[x1,y1,x2,y2,...]}], highest level first.
  function trace(root, w, h) {
    var H = hills(root);
    var wide = w / h;   // distances in units of the window's height, so hills stay round
    function field(u, v) {
      var s = 0;
      for (var i = 0; i < H.length; i++) {
        var p = H[i], dx = (u - p[0]) * wide, dy = v - p[1], sg = p[3] * 2.6;
        s += p[2] * Math.exp(-(dx * dx + dy * dy) / (2 * sg * sg));
      }
      return s + 0.02 * Math.sin(u * wide * 4.1 + v * 5) * Math.cos(v * 9 - u * wide * 1.3);
    }
    var nx = Math.min(260, Math.round(w / 6));
    var ny = Math.max(30, Math.round(nx * h / w));
    var g = [];
    for (var j = 0; j <= ny; j++) {
      g[j] = [];
      for (var i = 0; i <= nx; i++) g[j][i] = field(i / nx, j / ny);
    }
    // Space the levels across the terrain's actual range, so every summit
    // closes into its own small ring instead of a flat plateau.
    var lo = Infinity, hi = -Infinity;
    for (var jj = 0; jj <= ny; jj++) for (var ii = 0; ii <= nx; ii++) {
      if (g[jj][ii] < lo) lo = g[jj][ii];
      if (g[jj][ii] > hi) hi = g[jj][ii];
    }
    var sx = w / nx, sy = h / ny, out = [];
    for (var L = LEVELS; L >= 1; L--) {
      var lv = lo + (hi - lo) * (L / (LEVELS + 1)), segs = [];
      var t = function (p, q) { return (lv - p) / (q - p); };
      for (var y = 0; y < ny; y++) {
        for (var x = 0; x < nx; x++) {
          var a = g[y][x], b = g[y][x + 1], c = g[y + 1][x + 1], d = g[y + 1][x];
          var k = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (d > lv ? 1 : 0);
          if (k === 0 || k === 15) continue;
          var T = [(x + t(a, b)) * sx, y * sy];
          var R = [(x + 1) * sx, (y + t(b, c)) * sy];
          var B = [(x + t(d, c)) * sx, (y + 1) * sy];
          var Lf = [x * sx, (y + t(a, d)) * sy];
          var pts = {
            1: [Lf, B], 2: [B, R], 3: [Lf, R], 4: [T, R], 5: [Lf, T, B, R], 6: [T, B], 7: [Lf, T],
            8: [Lf, T], 9: [T, B], 10: [T, R, Lf, B], 11: [T, R], 12: [Lf, R], 13: [B, R], 14: [Lf, B]
          }[k];
          for (var s = 0; s < pts.length; s += 2) segs.push(pts[s][0], pts[s][1], pts[s + 1][0], pts[s + 1][1]);
        }
      }
      if (segs.length) out.push({ index: L % 4 === 0, segs: segs });
    }
    return out;
  }

  function setup(root) {
    var canvas = root.querySelector(".terrain-canvas");
    if (!canvas) return null;
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var css = getComputedStyle(document.documentElement);
    return {
      ctx: ctx, w: r.width, h: r.height,
      thin: css.getPropertyValue("--contour").trim() || "#ccc",
      thick: css.getPropertyValue("--contour-index").trim() || "#999",
      levels: trace(root, r.width, r.height)
    };
  }

  // Draw levels [0, upto) fully, and level `upto` at `alpha`.
  function paint(m, upto, alpha) {
    var ctx = m.ctx;
    ctx.clearRect(0, 0, m.w, m.h);
    for (var i = 0; i < m.levels.length && i <= upto; i++) {
      var lv = m.levels[i], s = lv.segs;
      ctx.globalAlpha = i < upto ? 1 : alpha;
      ctx.strokeStyle = lv.index ? m.thick : m.thin;
      ctx.lineWidth = lv.index ? 1.1 : 0.7;
      ctx.beginPath();
      for (var k = 0; k < s.length; k += 4) { ctx.moveTo(s[k], s[k + 1]); ctx.lineTo(s[k + 2], s[k + 3]); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function firstVisit() {
    try {
      if (sessionStorage.getItem("dd-map-drawn")) return false;
      sessionStorage.setItem("dd-map-drawn", "1");
    } catch (e) { /* storage blocked: animate anyway */ }
    return true;
  }

  function draw(animate) {
    var root = document.querySelector(".terrain");
    if (!root) return;
    var m = setup(root);
    if (!m) return;
    var n = m.levels.length;
    if (!animate) { paint(m, n, 1); return; }
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / DURATION);
      var f = (1 - Math.pow(1 - p, 3)) * n;
      paint(m, Math.floor(f), f - Math.floor(f));
      if (p < 1) requestAnimationFrame(frame);
      else paint(m, n, 1);
    }
    requestAnimationFrame(frame);
  }

  function init() {
    draw(!reduceMotion && firstVisit());
    // Redraw only when the window really changes size (not when a phone's
    // address bar slides in and out while scrolling).
    var lastW = window.innerWidth, lastH = window.innerHeight, timer;
    window.addEventListener("resize", function () {
      var w = window.innerWidth, h = window.innerHeight;
      if (w === lastW && Math.abs(h - lastH) < 120) return;
      lastW = w; lastH = h;
      clearTimeout(timer);
      timer = setTimeout(function () { draw(false); }, 120);
    });

    var bar = document.querySelector(".topbar");
    if (bar) {
      var onScroll = function () { bar.classList.toggle("is-stuck", window.scrollY > 4); };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    var email = document.querySelector("[data-email]");
    if (email) {
      document.addEventListener("click", function (e) {
        var a = e.target.closest && e.target.closest("a[data-subject]");
        if (!a) return;
        var addr = email.dataset.email.replace(/\s*\[dot\]\s*/g, ".").replace(/\s*\[at\]\s*/g, "@");
        a.href = "mailto:" + addr + "?subject=" + encodeURIComponent(a.dataset.subject);
      });
    }

    var cites = document.querySelectorAll(".slip-cite");
    if (cites.length) {
      cites.forEach(function (b) { b.hidden = false; });
      document.addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest(".slip-cite");
        if (b) toggleCite(b);
        var c = e.target.closest && e.target.closest(".slip-copy");
        if (c) copyCite(c);
      });
    }
  }

  // A @misc entry for one tangent. The year and month come from the
  // notebook's date ("October 2026"); the title is its number, since the
  // ideas themselves are only ever handwritten.
  function bibtex(b) {
    var nb = b.closest(".slips").dataset;
    var author = nb.citeAuthor || "";
    var d = /(?:([A-Za-z]{3})[A-Za-z]*\.?\s+)?(\d{4})/.exec(nb.citeDate || "");
    var year = d ? d[2] : "";
    var month = d && d[1] ? d[1].toLowerCase() : "";
    if ("jan feb mar apr may jun jul aug sep oct nov dec".indexOf(month) < 0) month = "";
    var key = (author.split(" ").pop() || "tangent").toLowerCase().replace(/[^a-z]/g, "") +
      year + "tangent-" + b.dataset.citeId;
    var fields = [
      ["author", "{" + author + "}"],
      ["title", "{Tangent {" + b.dataset.citeLabel + "}}"],
      ["howpublished", "{\\url{" + b.dataset.citeUrl + "}}"],
      ["note", "{Handwritten research idea" + (nb.citeNotebook ? ", " + nb.citeNotebook : "") + "}"],
      ["year", year && "{" + year + "}"],
      ["month", month]
    ].filter(function (f) { return f[1]; });
    return "@misc{" + key + ",\n" + fields.map(function (f) {
      return "  " + (f[0] + "            ").slice(0, 12) + " = " + f[1];
    }).join(",\n") + "\n}";
  }

  function toggleCite(b) {
    var box = document.getElementById(b.getAttribute("aria-controls"));
    if (!box) return;
    var open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(open));
    box.hidden = !open;
    if (!open) return;
    if (!box.firstChild) {
      var pre = document.createElement("pre");
      pre.textContent = bibtex(b);
      var copy = document.createElement("button");
      copy.type = "button";
      copy.className = "slip-copy";
      copy.textContent = "Copy";
      copy.setAttribute("aria-live", "polite");
      box.appendChild(pre);
      box.appendChild(copy);
    }
    copyCite(box.querySelector(".slip-copy"));
  }

  // Copy the entry; if the clipboard is unavailable, select it instead.
  function copyCite(c) {
    var pre = c.parentNode.querySelector("pre");
    function select() {
      var r = document.createRange();
      r.selectNodeContents(pre);
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    }
    if (!navigator.clipboard) { select(); return; }
    navigator.clipboard.writeText(pre.textContent).then(function () {
      c.textContent = "Copied";
      clearTimeout(c._t);
      c._t = setTimeout(function () { c.textContent = "Copy"; }, 1800);
    }, select);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

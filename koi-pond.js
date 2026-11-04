// =============================================================
//  Koi Pond  —  live canvas wallpaper for VS Code
//  Homage to the "Koi Pond" Claude Desktop theme (0toshigami).
//  Injected via "Custom CSS and JS Loader". Palette matches the
//  original; koi motion is reimplemented.
//  Tweak CONFIG, then run: "Reload Custom CSS and JS" + Restart.
// =============================================================
(function () {
  "use strict";

  const CONFIG = {
    cell: 20,            // grid cell size in px (smaller = finer, heavier)
    fps: 30,             // frame cap
    speed: 1.0,          // global motion multiplier
    editorOpacity: 0.60, // 0 = pond fully visible / text hard to read, 1 = solid
    uiOpacity: 0.50,     // tint for sidebar/panel/statusbar so pond shows UI-wide
    bg: "#0a2b29",       // pond water base
    grid: false,         // faint grid lines like the original
    debugOnTop: false    // set true to float koi ON TOP of code (diagnostic)
  };

  // ---- palette (verbatim from the Koi Pond theme) ----
  const WATER_DEEP = "#0d3a38", RIPPLE = "#d6f1e8", SPECK = "#cfeee6", TWINK = "#e8fbf6";
  const LILY = { pad: "#5c9a43", rim: "#3f7a31", vein: "#86c066", petal: "#f28bb8", inner: "#f9c3da", heart: "#f6d03f", shadow: "#0b3430" };
  const KOI = [
    { body: "#f3eee5", spot: "#de3a2a", spot2: null,      fin: "#e6e2d8", eye: "#120c0a" }, // white + red
    { body: "#f3eee5", spot: "#de3a2a", spot2: "#1f1c1b", fin: "#e6e2d8", eye: "#120c0a" }, // white + red + black
    { body: "#f2b52c", spot: "#f8d769", spot2: null,      fin: "#f5cc4f", eye: "#120c0a" }  // gold
  ];
  // elliptical loops: {cx,cy,rx,ry} as fractions, dir, speed
  const LOOPS = [
    { cx: .74, cy: .30, rx: .15, ry: .17, dir: 1,  spd: .20 },
    { cx: .26, cy: .42, rx: .13, ry: .24, dir: -1, spd: .17 },
    { cx: .56, cy: .66, rx: .20, ry: .12, dir: -1, spd: .14 }
  ];
  // body half-width profile head -> tail (in cells): rounded head, tapering body
  const PROFILE = [1.6, 2.0, 2.2, 2.2, 2.1, 1.9, 1.8, 1.6, 1.4, 1.2, 1.0, 0.8, 0.6];
  // koi colour patches per fish: [startSeg, endSeg, colour]
  const PATCH = [
    [[1, 2, "#de3a2a"], [6, 8, "#de3a2a"]],
    [[2, 3, "#de3a2a"], [7, 8, "#1f1c1b"]],
    [[3, 4, "#f8d769"], [8, 9, "#f8d769"]]
  ];
  // static lily pads: [fx, fy, radius(cells), hasLotus]
  const LILIES = [[.08, .10, 3.2, 1], [.95, .16, 2.4, 0], [.90, .55, 2.9, 1], [.05, .80, 2.6, 0], [.22, .96, 2.4, 0], [.70, .92, 3.0, 1]];

  function hash(x, y, s) { const h = Math.sin(x * 127.1 + y * 311.7 + (s || 0) * 74.7) * 43758.5; return h - Math.floor(h); }

  function start() {
    if (document.getElementById("koi-pond-canvas")) return;
    if (!document.querySelector(".monaco-workbench")) return setTimeout(start, 300);

    const style = document.createElement("style");
    style.id = "koi-pond-style";
    const EOP = CONFIG.editorOpacity, UOP = CONFIG.uiOpacity;
    style.textContent = `
      #koi-pond-canvas{position:fixed;inset:0;z-index:0;pointer-events:none;}
      .monaco-workbench{position:relative;z-index:1;background:transparent !important;}
      /* --- editor + every wrapper layer transparent so the pond shows through --- */
      .monaco-workbench .part.editor,
      .monaco-workbench .part.editor > .content,
      .monaco-workbench .monaco-grid-view,
      .monaco-workbench .grid-view-container,
      .monaco-workbench .split-view-view,
      .monaco-workbench .editor-group-container,
      .monaco-workbench .editor-group-container > .editor-container,
      .monaco-workbench .editor-container > .editor-instance,
      .monaco-editor, .monaco-editor .overflow-guard,
      .monaco-editor .monaco-scrollable-element,
      .monaco-editor .margin, .monaco-editor .margin-view-overlays,
      .monaco-editor .minimap, .monaco-editor .inputarea.ime-input,
      /* --- side bar / aux bar internals --- */
      .monaco-workbench .part.sidebar > .content,
      .monaco-workbench .part.sidebar .composite,
      .monaco-workbench .part.sidebar .monaco-pane-view,
      .monaco-workbench .part.sidebar .pane,
      .monaco-workbench .part.sidebar .pane-body,
      .monaco-workbench .part.sidebar .monaco-list,
      .monaco-workbench .part.sidebar .monaco-list-rows,
      .monaco-workbench .part.sidebar .monaco-list-row:not(.selected):not(.focused),
      .monaco-workbench .part.sidebar .monaco-tl-row,
      .monaco-workbench .part.sidebar .welcome-view,
      .monaco-workbench .part.sidebar .explorer-folders-view,
      .monaco-workbench .part.auxiliarybar > .content,
      .monaco-workbench .part.auxiliarybar .composite,
      .monaco-workbench .part.auxiliarybar .monaco-pane-view,
      .monaco-workbench .part.auxiliarybar .pane,
      .monaco-workbench .part.auxiliarybar .pane-body,
      .monaco-workbench .part.auxiliarybar .monaco-list,
      .monaco-workbench .part.auxiliarybar .monaco-list-rows,
      /* --- activity bar / panel / editor tabs internals --- */
      .monaco-workbench .part.activitybar .content,
      .monaco-workbench .part.panel > .content,
      .monaco-workbench .part.panel .composite,
      .monaco-workbench .editor-group-container > .title,
      .monaco-workbench .tabs-and-actions-container,
      .monaco-workbench .title.tabs,
      .monaco-workbench .tab{
        background: transparent !important;
      }
      /* --- one translucent tint per surface so text stays readable over the pond --- */
      .monaco-editor .monaco-editor-background{ background-color: rgba(10,43,41,${EOP}) !important; }
      .monaco-workbench .part.sidebar,
      .monaco-workbench .part.auxiliarybar,
      .monaco-workbench .part.activitybar,
      .monaco-workbench .part.panel,
      .monaco-workbench .part.titlebar,
      .monaco-workbench .part.statusbar{ background-color: rgba(10,43,41,${UOP}) !important; }
      /* id-based fallback: maximum specificity, beats any inline background */
      #workbench\\.parts\\.sidebar,
      #workbench\\.parts\\.auxiliarybar,
      #workbench\\.parts\\.panel,
      #workbench\\.parts\\.activitybar{ background-color: rgba(10,43,41,${UOP}) !important; }`;
    console.log("[koi-pond] initialising…");
    document.head.appendChild(style);

    const canvas = document.createElement("canvas");
    canvas.id = "koi-pond-canvas";
    document.body.insertBefore(canvas, document.body.firstChild);
    const ctx = canvas.getContext("2d");
    const C = CONFIG.cell;
    if (CONFIG.debugOnTop) canvas.style.zIndex = "2147483647"; // float above everything (test)

    let W, H, cols, rows;
    function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; cols = Math.ceil(W / C); rows = Math.ceil(H / C); }
    resize(); addEventListener("resize", resize);
    console.log("[koi-pond] canvas", W + "x" + H, "cols/rows", cols, rows, "debugOnTop", CONFIG.debugOnTop);

    function rr(px, py, w, h, r) { // rounded rect path
      ctx.beginPath();
      ctx.moveTo(px + r, py); ctx.arcTo(px + w, py, px + w, py + h, r);
      ctx.arcTo(px + w, py + h, px, py + h, r); ctx.arcTo(px, py + h, px, py, r);
      ctx.arcTo(px, py, px + w, py, r); ctx.closePath();
    }
    function put(cx, cy, color, a, glyph, gcolor) {
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return;
      const px = cx * C, py = cy * C;
      ctx.globalAlpha = a == null ? 1 : a;
      ctx.fillStyle = color;
      rr(px + 2, py + 2, C - 4, C - 4, 3); ctx.fill();
      if (glyph) { ctx.globalAlpha = Math.min(1, (a || 1) + .1); ctx.fillStyle = gcolor || color; ctx.fillText(glyph, px + C / 2, py + C / 2); }
      ctx.globalAlpha = 1;
    }

    function lily(cx, cy, t) {
      for (const [fx, fy, rad, lotus] of LILIES) {
        const lx = fx * cols, ly = fy * rows, dx = cx - lx, dy = cy - ly, d = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx), gap = Math.abs(((ang + Math.PI) % (Math.PI * 2)) - Math.PI); // notch
        if (d < rad && gap > .45) {
          if (lotus && d < rad * .42) { // lotus bloom
            const pulse = 1 + .08 * Math.sin(t * .8 + fx * 5);
            if (d < rad * .16 * pulse) return [LILY.heart, .95];
            return [(Math.floor((ang + t * .2) * 3) % 2) ? LILY.petal : LILY.inner, .92];
          }
          if (d > rad - 1) return [LILY.rim, .9];
          if (hash(cx, cy, 5) < .18) return [LILY.vein, .7];
          return [LILY.pad, .88];
        }
      }
      return null;
    }

    const hist = LOOPS.map(() => []);
    function drawKoi(t, i) {
      const L = LOOPS[i], cxp = L.cx * cols, cyp = L.cy * rows;
      const a = t * L.spd * L.dir;
      const hx = cxp + Math.cos(a) * L.rx * cols, hy = cyp + Math.sin(a) * L.ry * rows;
      const h = hist[i]; h.unshift([hx, hy]); if (h.length > 90) h.pop();
      if (h.length < 60) // seed the tail so the whole fish shows from the first frame
        for (let n = h.length; n < 90; n++) { const aa = (t - n * .05) * L.spd * L.dir; h.push([cxp + Math.cos(aa) * L.rx * cols, cyp + Math.sin(aa) * L.ry * rows]); }
      const k = KOI[i];
      // sample spine into ~1-cell-spaced points (head -> tail)
      const pts = []; let acc = 0, prev = h[0];
      for (let n = 1; n < h.length && pts.length < PROFILE.length; n++) {
        const p = h[n]; acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p;
        if (acc < 1) continue; acc = 0;
        const q = h[n - 1], tx = p[0] - q[0], ty = p[1] - q[1], len = Math.hypot(tx, ty) || 1;
        pts.push({ x: p[0], y: p[1], tx: tx / len, ty: ty / len, nx: -ty / len, ny: tx / len });
      }
      const N = pts.length; if (!N) return;

      // caudal fin: a swishing fan trailing the tail (drawn first, under the body)
      const tail = pts[N - 1], sw = Math.sin(t * 4 + i * 2) * 1.8;
      for (let j = 1; j <= 5; j++) {
        const bx = tail.x - tail.tx * j + tail.nx * (sw * j / 5), by = tail.y - tail.ty * j + tail.ny * (sw * j / 5);
        const spread = j * 0.9;
        for (let w = -spread; w <= spread; w++)
          put(Math.round(bx + tail.nx * w), Math.round(by + tail.ny * w), k.fin, .5 * (1 - j / 6));
      }

      for (let s = 0; s < N; s++) {
        const P = pts[s], r = PROFILE[s], wig = Math.sin(t * 5 + s * .5 + i * 2) * (s / N) * 1.0;
        const cx = Math.round(P.x + P.nx * wig), cy = Math.round(P.y + P.ny * wig), rc = Math.ceil(r);
        const patch = PATCH[i].find(z => s >= z[0] && s <= z[1]);
        for (let ox = -rc; ox <= rc; ox++) for (let oy = -rc; oy <= rc; oy++) {
          if (Math.hypot(ox, oy) > r) continue;
          put(cx + ox, cy + oy, patch ? patch[2] : k.body, .98);
        }
        if (s === Math.round(N * 0.32)) // pectoral fins, one each side
          for (let f = 1; f <= 3; f++) {
            const fx = Math.sin(t * 4 + i) * .6;
            put(Math.round(P.x + P.nx * (r + f - .5) + P.tx * fx), Math.round(P.y + P.ny * (r + f - .5) + P.ty * fx), k.fin, .6 * (1 - f / 4));
            put(Math.round(P.x - P.nx * (r + f - .5) + P.tx * fx), Math.round(P.y - P.ny * (r + f - .5) + P.ty * fx), k.fin, .6 * (1 - f / 4));
          }
        if (s === 1) { // two eyes on the head
          put(Math.round(P.x + P.nx * r * .5), Math.round(P.y + P.ny * r * .5), k.eye, 1);
          put(Math.round(P.x - P.nx * r * .5), Math.round(P.y - P.ny * r * .5), k.eye, 1);
        }
      }
    }

    let last = 0, t0 = performance.now(), fc = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (now - last < 1000 / CONFIG.fps) return; last = now;
      const t = (now - t0) / 1000 * CONFIG.speed;
      if ((fc++ % 90) === 0) console.log("[koi-pond] frame", fc, "t=", t.toFixed(1));

      ctx.clearRect(0, 0, W, H);
      if (!CONFIG.debugOnTop) { ctx.fillStyle = CONFIG.bg; ctx.fillRect(0, 0, W, H); }
      else { // test overlay: unmistakable border + label so we can SEE the canvas
        ctx.strokeStyle = "#ff00aa"; ctx.lineWidth = 6; ctx.strokeRect(3, 3, W - 6, H - 6);
        ctx.fillStyle = "#ff00aa"; ctx.font = "bold 28px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillText("KOI-POND CANVAS TEST — if you see this, rendering works", 20, 20);
      }
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `bold ${Math.round(C * 13 / 22)}px Consolas, 'Cascadia Code', monospace`;

      if (CONFIG.grid) { ctx.strokeStyle = "rgba(160,200,195,.04)"; for (let x = 0; x <= cols; x++) { ctx.beginPath(); ctx.moveTo(x * C, 0); ctx.lineTo(x * C, H); ctx.stroke(); } }

      // deep-water pool (darker center)
      const pcx = cols * .5, pcy = rows * .5, prx = cols * .42, pry = rows * .42;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const dd = Math.hypot((x - pcx) / prx, (y - pcy) / pry);
        if (dd < 1) put(x, y, WATER_DEEP, .4 * (1 - dd));
        else if (hash(x, y, 71) < .03) put(x, y, SPECK, .18); // speckle
        else if (hash(x - ((t * .3) | 0), y + ((t * .12) | 0), 9) < .006) put(x, y, TWINK, .5); // twinkle
      }

      // expanding ripple rings
      for (let r = 0; r < 5; r++) {
        const rr0 = (t * 1.6 + r * 3.7) % 10;
        const ax = (3 + hash(r, 61) * (cols - 6)), ay = hash(r, 62) * rows;
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const d = Math.hypot(x - ax, y - ay);
          if ((Math.abs(d - rr0) < .5 || Math.abs(d - rr0 + 2.2) < .5) && hash(x, y, 63) < .6)
            put(x, y, "transparent", .4 * (1 - rr0 / 10), "o", RIPPLE);
        }
      }

      // lily pads (under koi) + koi fish
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const l = lily(x, y, t); if (l) put(x, y, l[0], l[1]); }
      for (let i = 0; i < KOI.length; i++) drawKoi(t, i);
    }
    requestAnimationFrame(frame);
  }
  start();
})();

let data, data1; 

let img, icon, iconRed; 

// 🎛️ filtres
let filters;

// caméra
let scaleFactor;
let offsetX = 0;
let offsetY = 0;

// drag
let dragging = false;
let lastMouseX, lastMouseY;

// état
let selectedArr = null;
let zoomMode = "global"; // "global" ou "focus"

// surface
let minSurface = Infinity;
let maxSurface = -Infinity;

// geo bounds
const lonMin = 2.233143;
const lonMax = 2.452526;
const latMin = 48.803924;
const latMax = 48.909413;

// overlays
let overlays = {};
let globalFixX = 0;
let globalFixY = 0;
let isIntro = false;

// ⏱️ AJOUT EN HAUT
let currentTime;
let minTime = Infinity;
let maxTime = -Infinity;
let isDraggingTimeline = false;

let gif15;
let gifOverlays = {
  15: {
    scale: 0.8,
    rot: -1,
    ox: 60,
    oy: 25,
    opacity: 255
  }
};
function preload() {
  data = loadJSON("chantiers-a-paris.json");
  data1 = loadJSON("arrondissements.json");

  img = loadImage("test3.png");
  icon = loadImage("Pictogramme.png");
  iconRed = loadImage("Picto2.png");
  gif15 = loadImage("gif/15eme_evol.gif");

  let config = {
    1:{scale:0.5,rot:-1,ox:-30,oy:50},
    2:{scale:0.5,rot:0,ox:-125,oy:225},
    3:{scale:0.5,rot:-5,ox:-450,oy:100},
    4:{scale:0.5,rot:-1,ox:-400,oy:-175},
    5:{scale:0.5,rot:-1,ox:-325,oy:-425},
    6:{scale:0.5,rot:-2,ox:50,oy:-300},
    7:{scale:0.5,rot:-3,ox:425,oy:-140},
    8:{scale:0.5,rot:-1,ox:475,oy:375},
    9:{scale:0.5,rot:-1,ox:-50,oy:480},
    10:{scale:0.5,rot:-1,ox:-500,oy:475},
    11:{scale:0.5,rot:-1,ox:-850,oy:50},
    12:{scale:0.5,rot:1,ox:-1500,oy:-725},
    13:{scale:0.5,rot:0,ox:-600,oy:-900},
    14:{scale:0.5,rot:-1,ox:175,oy:-900},
    15:{scale:0.45,rot:-1,ox:700,oy:-490},
    16:{scale:0.5,rot:-1,ox:1350,oy:-75},
    17:{scale:0.5,rot:-1,ox:550,oy:825},
    18:{scale:0.5,rot:-1,ox:-250,oy:925},
    19:{scale:0.5,rot:-1,ox:-1000,oy:800},
    20:{scale:0.5,rot:-1,ox:-1200,oy:100}
  };

  for (let id in config) {
    overlays[id] = {
      ...config[id],
      img: loadImage(id + (id == 1 ? "er" : "eme") + ".png")
    };
  }


}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent("canvas-container");
  window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM READY");
});

  console.log("backBtn:", document.getElementById("backBtn"));
console.log("ui:", document.getElementById("ui"));
console.log("intro:", document.getElementById("intro"));

  // =========================
  // INTRO IMAGE HTML
  // =========================
 


  // =========================
  // DATA SAFE
  // =========================
  data = Object.values(data || {});
  data1 = Object.values(data1 || {});

  // =========================
  // TIME INIT
  // =========================
  minTime = Infinity;
  maxTime = -Infinity;

  data.forEach(d => {
    const start = Date.parse(d.date_debut);
    const end = Date.parse(d.date_fin);

    if (!isNaN(start)) {
      d.startTime = start;
      minTime = Math.min(minTime, start);
    }

    if (!isNaN(end)) {
      d.endTime = end;
      maxTime = Math.max(maxTime, end);
    }

    if (d.startTime && !d.endTime) {
      d.endTime = d.startTime + 1000 * 60 * 60 * 24 * 20;
      maxTime = Math.max(maxTime, d.endTime);
    }
  });

  if (!isFinite(minTime)) minTime = Date.now();
  if (!isFinite(maxTime)) maxTime = minTime + 1000 * 60 * 60 * 24 * 365;

  currentTime = minTime;

  // =========================
  // SURFACE RANGE
  // =========================
  data.forEach(d => {
    let s = getSurfaceValue(d);
    if (s > 0) {
      minSurface = min(minSurface, s);
      maxSurface = max(maxSurface, s);
    }
  });

  resetView();

  // =========================
  // FILTERS
  // =========================
  filters = {
    "Ville de Paris": false,
    "Tiers": false,
    "Réseaux": false
  };

  const bind = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", e => filters[key] = e.target.checked);
  };

  bind("paris", "Ville de Paris");
  bind("tiers", "Tiers");
  bind("reseaux", "Réseaux");

  // =========================
  // TIMELINE DOM
  // =========================
  // =========================
// TIMELINE DOM (FIXED)
// =========================
const bar = document.getElementById("timelineBar");

if (bar) {
  bar.addEventListener("mousedown", (e) => {
    isDraggingTimeline = true;
    updateTimeline(e);
  });
}

window.addEventListener("mouseup", () => {
  isDraggingTimeline = false;
});

window.addEventListener("mousemove", (e) => {
  if (!isDraggingTimeline) return;
  updateTimeline(e);
});

  // =========================
  // KEYBOARD
  // =========================
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") enterSite();
    if (e.key === "Escape") backToIntro();
  });

  // =========================
  // BUTTONS
  // =========================
  const btn = document.getElementById("enterBtn");
  if (btn) btn.onclick = enterSite;

  const resetBtn = document.getElementById("resetMapBtn");
  if (resetBtn) resetBtn.onclick = resetMap;
}

function draw() {
  
    background(255);
    resetMatrix();
  


  // =========================
  // SAFE TIME NORMALIZATION
  // =========================
  let t = 0;

  if (isFinite(minTime) && isFinite(maxTime) && maxTime !== minTime) {
    t = (currentTime - minTime) / (maxTime - minTime);
    t = constrain(t, 0, 1);
  }

  // =========================
  // TIMELINE UI SYNC (IMPORTANT)
  // =========================
  const cursor = document.getElementById("timelineCursor");
  const progress = document.getElementById("timelineProgress");

  if (cursor) cursor.style.left = (t * 100) + "%";
  if (progress) progress.style.width = (t * 100) + "%";

  function formatDate(ts) {
  let d = new Date(ts);
  return d.getFullYear();
}

document.getElementById("labelStart").innerText = formatDate(minTime);
document.getElementById("labelEnd").innerText = formatDate(maxTime);
document.getElementById("labelMiddle").innerText = formatDate(currentTime);

  // =========================
  // CAMERA LIMITS
  // =========================
  offsetX = constrain(offsetX, width - img.width * scaleFactor, 0);
  offsetY = constrain(offsetY, height - img.height * scaleFactor, 0);

  // =========================
  // MAP SPACE
  // =========================
  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);

  let mx = (mouseX - offsetX) / scaleFactor;
  let my = (mouseY - offsetY) / scaleFactor;

  // =========================
  // ACTIVE ARRONDISSEMENT
  // =========================
  let activeArr = null;

  for (let arr of data1) {
    if (pointInArrondissement(mx, my, arr)) {
      activeArr = arr;
      break;
    }
  }

  let idArr =
    selectedArr !== null
      ? selectedArr
      : activeArr
      ? Number(activeArr.c_ar)
      : null;

  // =========================
  // OVERLAY ARRONDISSEMENT
  // =========================
// =========================
// OVERLAY ARRONDISSEMENT
// =========================
if (idArr !== null && overlays[idArr]) {

  let o = overlays[idArr];
  let arr = data1.find(a => Number(a.c_ar) === idArr);

  if (arr) {

    let c = getArrCenter(arr);

    // =========================
    // FADE OUT SI GIF APPARAÎT
    // =========================

    let overlayAlpha = 255;

    // uniquement pour le 15e
    if (idArr === 15 && selectedArr === 15) {

      let revealZoom = 1.2;
      let fullZoom = 3;

      let gifAlpha = map(
        scaleFactor,
        revealZoom,
        fullZoom,
        0,
        255
      );

      gifAlpha = constrain(gifAlpha, 0, 255);

      // overlay disparaît à mesure que le gif apparaît
      overlayAlpha = 255 - gifAlpha;
    }

    // si totalement invisible → skip
    if (overlayAlpha > 1) {

      // masque l'overlay quand le gif est totalement visible
if (
  idArr === 15 &&
  selectedArr === 15 &&
  scaleFactor >= 3
) {
  return;
}
// masque l'overlay quand le gif est totalement visible
let hideOverlay =
  idArr === 15 &&
  selectedArr === 15 &&
  scaleFactor >= 2.5;

if (!hideOverlay) {

  push();

  translate(c.x + o.ox + globalFixX, c.y + o.oy + globalFixY);

  rotate(radians(o.rot));

  imageMode(CENTER);

  image(
    o.img,
    0,
    0,
    o.img.width * o.scale,
    o.img.height * o.scale
  );

  pop();
}
    }
  }
}
  // =========================
// GIF 15e
// =========================

// =========================
// GIF 15e progressif
// =========================

if (selectedArr === 15 && gif15) {

  let arr = data1.find(a => Number(a.c_ar) === 15);

  if (arr) {

    let c = getArrCenter(arr);
    let g = gifOverlays[15];

    // =========================
    // APPARITION PROGRESSIVE
    // =========================

    let revealZoom = 1.2;   // début apparition
    let fullZoom = 3;     // totalement visible

    let alpha = map(
      scaleFactor,
      revealZoom,
      fullZoom,
      0,
      255
    );

    alpha = constrain(alpha, 0, 255);

    // si invisible → skip
    if (alpha > 1) {

      push();

      translate(
        c.x + g.ox + globalFixX,
        c.y + g.oy + globalFixY
      );

      rotate(radians(g.rot));

      imageMode(CENTER);

      tint(255, alpha);

      image(
        gif15,
        0,
        0,
        gif15.width * g.scale,
        gif15.height * g.scale
      );

      noTint();

      pop();
    }
  }
}

  // =========================
  // POINTS
  // =========================
  for (let i = 0; i < data.length; i++) {
    let d = data[i];

   if (!d.geo_point_2d || !d.startTime) continue;

    // =========================
    // TIME FILTER
    // =========================
    let buffer = 1000 * 60 * 60 * 24 * 3;

    let start = d.startTime;
let end = d.endTime || d.startTime + 1000 * 60 * 60 * 24 * 30; // 30 jours par défaut

if (currentTime < start - buffer || currentTime > end + buffer) continue;

    // =========================
    // POSITION
    // =========================
    let x = map(d.geo_point_2d.lon, lonMin, lonMax, 0, img.width);
    let y = map(d.geo_point_2d.lat, latMax, latMin, 0, img.height);

    let n = noise(i * 0.1, frameCount * 0.01);
    let ox = map(n, 0, 1, -3, 3);
    let oy = map(n, 0, 1, -3, 3);

    // =========================
    // FILTER ARRONDISSEMENT
    // =========================
    if (selectedArr !== null) {
      let arrId = getArrFromPoint(x, y);
      if (arrId !== selectedArr) continue;
    }

    // =========================
    // SIZE
    // =========================
    let size = 20;

    if (selectedArr !== null) {
      let s = getSurfaceValue(d);

      let norm = map(
        log(s + 1),
        log(minSurface + 1),
        log(maxSurface + 1),
        0,
        1
      );

      norm = constrain(norm, 0, 1);
      norm = pow(norm, 1.6);

      size = map(norm, 0, 1, 6, 90);
    }

    // =========================
    // CATEGORY
    // =========================
    let r = (
      d.moa_principal ||
      d.responsable ||
      d.maitre_d_ouvrage ||
      ""
    ).toLowerCase();

    let category = "Tiers";

    if (
      r.includes("ville de paris") ||
      r.includes("dvd") ||
      r.includes("dpe") ||
      r.includes("deve")
    ) {
      category = "Ville de Paris";
    } else if (
      r.includes("enedis") ||
      r.includes("grdf") ||
      r.includes("orange") ||
      r.includes("ratp") ||
      r.includes("sncf")
    ) {
      category = "Réseaux";
    }

    let isActive = filters[category];
    let imgToUse = isActive ? iconRed : icon;

    // =========================
    // DRAW POINT
    // =========================
    imageMode(CENTER);
    image(imgToUse, x + ox, y + oy, size, size);
  }

  pop();

  // =========================
  // DEBUG TIME (OPTIONNEL)
  // =========================
  fill(0);
  noStroke();
  textSize(14);

  let debugDate = new Date(currentTime);
  text(debugDate.toLocaleDateString(), 20, height - 20);
}

// ===== INTERACTIONS =====

function resetGif() {
  const gif = document.getElementById("texteVideo");
  if (!gif) return;

  gif.src = gif.src.split("?")[0] + "?t=" + Date.now();
}

function mousePressed() {
  if (isDraggingTimeline) return;
dragging = true;
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

function mouseDragged() {
  if (!dragging || isDraggingTimeline) return;
  offsetX += mouseX - lastMouseX;
  offsetY += mouseY - lastMouseY;
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

function mouseReleased() {
  dragging = false;
}

function mouseWheel(event) {
  let old = scaleFactor;

  scaleFactor *= (event.delta < 0 ? 1.05 : 0.95);

  let minZoom = 0.3;
  let maxZoom;

  // 🔥 LIMITE DYNAMIQUE
  if (zoomMode === "global") {
    maxZoom = 0.65;   // vue globale = limitée
  } else {
    maxZoom = 10;  // focus = zoom libre
  }

  scaleFactor = constrain(scaleFactor, minZoom, maxZoom);

  offsetX = mouseX - (mouseX - offsetX) * (scaleFactor / old);
  offsetY = mouseY - (mouseY - offsetY) * (scaleFactor / old);

  return false;
}

function doubleClicked() {
  const x = (mouseX - offsetX) / scaleFactor;
  const y = (mouseY - offsetY) / scaleFactor;

  for (let arr of data1) {
    if (pointInArrondissement(x, y, arr)) {
      selectedArr = Number(arr.c_ar);
      zoomMode = "focus"; // 🔥 on débloque le zoom
      focus(arr);
      return;
    }
  }
}

function keyPressed() {
  // ESC désactivé volontairement pour debug
}
function resetView() {
  scaleFactor = min(width / img.width, height / img.height);
  offsetX = (width - img.width * scaleFactor) / 2;
  offsetY = (height - img.height * scaleFactor) / 2;
}
function resetMap() {
  selectedArr = null;
  zoomMode = "global";

  resetView();

  offsetX = (width - img.width * scaleFactor) / 2;
  offsetY = (height - img.height * scaleFactor) / 2;
}
function focus(arr) {
  let c = getArrCenter(arr);
  scaleFactor = 1;
  offsetX = width / 2 - c.x * scaleFactor;
  offsetY = height / 2 - c.y * scaleFactor;
}

// ===== HELPERS =====

function getSurfaceValue(d) {
  return d.surface || d.superficie || d.emprise || 1;
}

function getArrFromPoint(x, y) {
  for (let arr of data1) {
    if (pointInArrondissement(x, y, arr)) {
      return Number(arr.c_ar);
    }
  }
  return null;
}

function getArrCenter(arr) {
  let geom = arr.geom.geometry;

  let coords = geom.type === "Polygon"
    ? geom.coordinates[0]
    : geom.coordinates.flat(2);

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (let p of coords) {
    let x = map(p[0], lonMin, lonMax, 0, img.width);
    let y = map(p[1], latMax, latMin, 0, img.height);

    minX = min(minX, x);
    maxX = max(maxX, x);
    minY = min(minY, y);
    maxY = max(maxY, y);
  }

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2
  };
}

function pointInArrondissement(x, y, arr) {
  let geom = arr.geom.geometry;

  let polys = geom.type === "Polygon"
    ? [geom.coordinates[0]]
    : geom.coordinates.map(p => p[0]);

  return polys.some(poly => pointInPoly(x, y, poly));
}

function pointInPoly(x, y, poly) {
  let inside = false;

  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    let xi = map(poly[i][0], lonMin, lonMax, 0, img.width);
    let yi = map(poly[i][1], latMax, latMin, 0, img.height);
    let xj = map(poly[j][0], lonMin, lonMax, 0, img.width);
    let yj = map(poly[j][1], latMax, latMin, 0, img.height);

    let hit = ((yi > y) != (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (hit) inside = !inside;
  }

  return inside;
}

function updateTimeline(e) {
  const bar = document.getElementById("timelineBar");
  if (!bar) return;

  let rect = bar.getBoundingClientRect();
  let t = constrain((e.clientX - rect.left) / rect.width, 0, 1);

  currentTime = mapTimeNonLinear(t);
}

function mapTimeNonLinear(t) {
  let focusStart = new Date("2022-01-01").getTime();
  let focusEnd = new Date("2027-01-01").getTime();

  let total = maxTime - minTime;
  let focusSize = focusEnd - focusStart;

  // proportion visuelle
  let focusWeight = 0.7; // 🔥 70% de la timeline pour cette période

  let beforeWeight = (focusStart - minTime) / total;
  let afterWeight = (maxTime - focusEnd) / total;

  let totalWeight = beforeWeight + focusWeight + afterWeight;

  beforeWeight /= totalWeight;
  focusWeight /= totalWeight;
  afterWeight /= totalWeight;

  if (t < beforeWeight) {
    let localT = t / beforeWeight;
    return lerp(minTime, focusStart, localT);
  }

  if (t < beforeWeight + focusWeight) {
    let localT = (t - beforeWeight) / focusWeight;
    return lerp(focusStart, focusEnd, localT);
  }

  let localT = (t - beforeWeight - focusWeight) / afterWeight;
  return lerp(focusEnd, maxTime, localT);
}
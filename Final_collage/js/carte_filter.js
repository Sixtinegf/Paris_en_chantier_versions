const supabaseUrl = "https://tawfytfbhtmdoscdgpbu.supabase.co";
const supabaseKey = "sb_publishable_BlsdkUhS_7FKGN5uggt2uw_fccuiFDj";

const db = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

let data, data1; 

let img, icon, iconRed; 

// 🎛️ filtres
let filters;


let isDraggingImage = false;
let dragMode = null;
// "map" | "image" | null

let pg;
let uiDragging = false;
let studioPhotos = [];
let photosLoading = false;
let photosToLoad = 0;
let photosLoaded = 0;
let draggedImageData = null;
let draggedPhotoUrl = null;
let draggedPhotoArrId = null;

let collageMapMode = false;
let collageCache = {};
let collageCacheDirty = {};
let arrondissementMasks = {};
let arrondissementBounds = {};
let filteredPhotoCache = new Map();


let draggedFilterModesSnapshot = [];
let arrIdsWithPhotosCache = [];
let arrIdsWithPhotosDirty = true;
let collageRebuildQueue = [];
let isRebuildingCollage = false;
let isDraggingPlacedPhoto = false;
let liveCollagePhotos = [];
let collageRebuildDelayTimer = null;

let arrondissementCenters = {};
let isPanningMap = false;
let panStillTimer = null;

let worksitesByArr = {};
let allWorksitesPrepared = [];
let timelineCursorEl;
let timelineProgressEl;
let labelStartEl;
let labelEndEl;
let labelMiddleEl;

// "rgb" | "concrete" | "fracture" | "wild" | "none"


let collageIntensity = 1;
let collageFilterModes = [] ;



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



function preload() {
  data = loadJSON("chantiers-a-paris.json");
  data1 = loadJSON("arrondissements.json");

  img = loadImage("test3.png");
  icon = loadImage("Pictogramme.png");
  iconRed = loadImage("Picto2.png");


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
  frameRate(30);
  pg = createGraphics(img.width, img.height);
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent("canvas-container");
  window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM READY");
});

window.addEventListener("pointerup", () => {
  uiDragging = false;
});

  console.log("backBtn:", document.getElementById("backBtn"));
console.log("ui:", document.getElementById("ui"));
console.log("intro:", document.getElementById("intro"));

timelineCursorEl = document.getElementById("timelineCursor");
timelineProgressEl = document.getElementById("timelineProgress");
labelStartEl = document.getElementById("labelStart");
labelEndEl = document.getElementById("labelEnd");
labelMiddleEl = document.getElementById("labelMiddle");
  // =========================
  // DATA SAFE
  // =========================
  data = Object.values(data || {});
  data1 = Object.values(data1 || {});
  prepareArrondissementMasks();

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

  prepareWorksitePoints();

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

  const collageMapCheckbox = document.getElementById("collageMapMode");

if (collageMapCheckbox) {
  collageMapCheckbox.addEventListener("change", (e) => {
    collageMapMode = e.target.checked;

    // si on active le mode collage, on revient en vue globale
    if (collageMapMode) {
      resetMap();
    }
  });
}
 
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
setupCollageControls();

const resetCollageBtn = document.getElementById("resetCollageBtn");

if (resetCollageBtn) {
  resetCollageBtn.addEventListener("click", () => {
    resetCollages();
  });
}

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

timelineCursorEl.style.left = (t * 100) + "%";
timelineProgressEl.style.width = (t * 100) + "%";
labelStartEl.innerText = formatYear(minTime);
labelEndEl.innerText = formatYear(maxTime);
labelMiddleEl.innerText = formatYear(currentTime);
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




// =========================
// MOUSE POSITION (dans carte)
// =========================
let mx = (mouseX - offsetX) / scaleFactor;
let my = (mouseY - offsetY) / scaleFactor;

// =========================
// trouver arrondissement actif
// =========================
let activeArr = null;

if (!collageMapMode && selectedArr === null) {
  for (let arr of data1) {
    if (pointInArrondissement(mx, my, arr)) {
      activeArr = arr;
      break;
    }
  }
}

// =========================
// ID ARR PROPRE (IMPORTANT)
// =========================
let idArr = selectedArr !== null
  ? selectedArr
  : activeArr
    ? Number(activeArr.c_ar)
    : null;


// =========================
// OVERLAYS ARRONDISSEMENTS
// =========================

if (!collageMapMode) {
  if (selectedArr !== null) {
    drawOneOverlay(selectedArr);
  } else if (idArr !== null) {
    drawOneOverlay(idArr);
  }
}

// =========================
// PHOTOS COLLAGE
// =========================

if (!photosLoading) {
  if (collageMapMode) {
    const arrIdsWithPhotos = getArrIdsWithPhotos();

    for (let arrId of arrIdsWithPhotos) {
      drawCollageForArr(arrId);
    }
  } else if (selectedArr !== null) {
    drawCollageForArr(selectedArr);
  } else if (idArr !== null) {
    drawCollageForArr(idArr);
  }
}

// =========================
// POINTS
// =========================

if (!collageMapMode) {
  const pointsToDraw = selectedArr !== null
    ? (worksitesByArr[selectedArr] || [])
    : allWorksitesPrepared;

  for (let i = 0; i < pointsToDraw.length; i++) {
    let d = pointsToDraw[i];

    if (!d.startTime) continue;

    // =========================
    // TIME FILTER
    // =========================

    let buffer = 1000 * 60 * 60 * 24 * 3;

    let start = d.startTime;
    let end = d.endTime || d.startTime + 1000 * 60 * 60 * 24 * 30;

    if (currentTime < start - buffer || currentTime > end + buffer) continue;

    // =========================
    // POSITION PRÉ-CALCULÉE
    // =========================

    let x = d.mapX;
    let y = d.mapY;

    if (x === undefined || y === undefined) continue;

    // =========================
    // SIZE PRÉ-CALCULÉE
    // =========================

    let size = selectedArr !== null ? d.focusSize : 25;

    // =========================
    // CATEGORY PRÉ-CALCULÉE
    // =========================

    let category = d.category || "Tiers";
    let isActive = filters[category];
    let imgToUse = isActive ? iconRed : icon;

    // =========================
    // PETIT MOUVEMENT DES POINTS
    // désactivé pendant le déplacement de la carte
    // =========================

    let ox = 0;
    let oy = 0;

    if (!isPanningMap) {
      let n = noise(i * 0.1, frameCount * 0.01);
      ox = map(n, 0, 1, -3, 3);
      oy = map(n, 0, 1, -3, 3);
    }

    // =========================
    // DRAW POINT
    // =========================

    imageMode(CENTER);

    image(
      imgToUse,
      x + ox,
      y + oy,
      size,
      size
    );
  }


   }

  pop();
// aperçu de la photo pendant le drag depuis l'archive
if (draggedImageData) {
  push();
  resetMatrix();
  imageMode(CENTER);
  tint(255, 220);
  image(draggedImageData, mouseX, mouseY, 150, 150);
  noTint();
  pop();
}

}

// ===== INTERACTIONS =====

function resetGif() {
  const gif = document.getElementById("texteVideo");
  if (!gif) return;

  gif.src = gif.src.split("?")[0] + "?t=" + Date.now();
}

function mousePressed() {

  let mx = (mouseX - offsetX) / scaleFactor;
  let my = (mouseY - offsetY) / scaleFactor;

  for (let p of studioPhotos) {
    let d = dist(mx, my, p.x, p.y);

    if (d < 60 && p.arrId === selectedArr) {
      p.dragging = true;
      p.offsetX = mx - p.x;
      p.offsetY = my - p.y;
      return;
    }
  }
}

function formatYear(ts) {
  return new Date(ts).getFullYear();
}

function mouseDragged() {

  if (draggedPhotoUrl) {
    return;
  }

  let mx = (mouseX - offsetX) / scaleFactor;
  let my = (mouseY - offsetY) / scaleFactor;

  for (let p of studioPhotos) {
    if (p.dragging) {
      p.x = mx - p.offsetX;
      p.y = my - p.offsetY;
      isDraggingPlacedPhoto = true;
      return;
    }
  }

offsetX += movedX;
offsetY += movedY;

isPanningMap = true;

if (panStillTimer) clearTimeout(panStillTimer);

panStillTimer = setTimeout(() => {
  isPanningMap = false;
}, 120);
}
function resetCollages() {
  studioPhotos = [];
  collageCache = {};
  collageCacheDirty = {};
  arrIdsWithPhotosCache = [];
  arrIdsWithPhotosDirty = true;
  collageRebuildQueue = [];
  isRebuildingCollage = false;
  liveCollagePhotos = [];

  if (collageRebuildDelayTimer) {
    clearTimeout(collageRebuildDelayTimer);
    collageRebuildDelayTimer = null;
  }

  filteredPhotoCache.clear();

  console.log("Collages reset");
}


function mouseWheel(event) {
 if (uiDragging) return false;
  const panel = document.getElementById("photoPanel");

  if (
    panel &&
    panel.style.display !== "none" &&
    panel.matches(":hover")
  ) {
    return;
  }


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

      zoomMode = "focus";

      focus(arr);

      loadArrondissementPhotos(
        selectedArr
      );

      return;
    }
  }
}

function prepareWorksitePoints() {
  worksitesByArr = {};
  allWorksitesPrepared = [];

  for (let d of data) {
    if (!d.geo_point_2d) continue;

    d.mapX = map(d.geo_point_2d.lon, lonMin, lonMax, 0, img.width);
    d.mapY = map(d.geo_point_2d.lat, latMax, latMin, 0, img.height);

    d.arrId = getArrFromPoint(d.mapX, d.mapY);

    const r = (
      d.moa_principal ||
      d.responsable ||
      d.maitre_d_ouvrage ||
      ""
    ).toLowerCase();

    if (
      r.includes("ville de paris") ||
      r.includes("dvd") ||
      r.includes("dpe") ||
      r.includes("deve")
    ) {
      d.category = "Ville de Paris";
    } else if (
      r.includes("enedis") ||
      r.includes("grdf") ||
      r.includes("orange") ||
      r.includes("ratp") ||
      r.includes("sncf")
    ) {
      d.category = "Réseaux";
    } else {
      d.category = "Tiers";
    }

    let s = getSurfaceValue(d);

    if (
      selectedArr !== null ||
      isFinite(minSurface) &&
      isFinite(maxSurface) &&
      minSurface !== maxSurface
    ) {
      let norm = map(
        log(s + 1),
        log(minSurface + 1),
        log(maxSurface + 1),
        0,
        1
      );

      norm = constrain(norm, 0, 1);
      norm = pow(norm, 1.6);

      d.focusSize = map(norm, 0, 1, 6, 90);
    } else {
      d.focusSize = 20;
    }

    allWorksitesPrepared.push(d);

    if (d.arrId !== null && d.arrId !== undefined) {
      if (!worksitesByArr[d.arrId]) {
        worksitesByArr[d.arrId] = [];
      }

      worksitesByArr[d.arrId].push(d);
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

  document
    .getElementById("photoPanel")
    .style.display = "none";
}
function focus(arr) {
  let c = getArrCenter(arr);
  scaleFactor = 1.5;
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

async function loadArrondissementPhotos(arrId) {
  photosLoading = true;

  const gallery = document.getElementById("photoGallery");
  gallery.innerHTML = "";

  const { data, error } = await db
    .from("images")
    .select("*")
    .eq("arrondissement", arrId)
    .order("created_at", { ascending: false });

  photosLoading = false;

  if (error) {
    console.log(error);
    return;
  }

  if (!data) return;

  data.forEach((photo) => {

 const imgEl = document.createElement("img");
imgEl.src = photo.url;

imgEl.classList.add("archive-photo");
imgEl.draggable = false;

gallery.appendChild(imgEl);

imgEl.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();

  draggedPhotoUrl = photo.url;
  draggedPhotoArrId = Number(arrId);
  draggedImageData = null;
  draggedFilterModesSnapshot = [...collageFilterModes];

  uiDragging = true;

  loadImage(photo.url, (loadedImg) => {
    draggedImageData = loadedImg;
  });
});

});

  document.getElementById("photoPanel").style.display = "block";
  photosLoading = false;
}


function drawArrondissementMask(pg, idArr) {

  let arr = data1.find(a => Number(a.c_ar) === idArr);
  if (!arr) return;

  let geom = arr.geom.geometry;

  pg.noStroke();
  pg.fill(255);

  pg.beginShape();

  let coords = geom.type === "Polygon"
    ? geom.coordinates[0]
    : geom.coordinates.flat(2);

  for (let p of coords) {
    let x = map(p[0], lonMin, lonMax, 0, img.width);
    let y = map(p[1], latMax, latMin, 0, img.height);

    pg.vertex(x, y);
  }

  pg.endShape(CLOSE);
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

function getHoveredArrondissement(mx, my) {

  let x = (mx - offsetX) / scaleFactor;
  let y = (my - offsetY) / scaleFactor;

  for (let arr of data1) {
    if (pointInArrondissement(x, y, arr)) {
      return arr;
    }
  }

  return null;
}
function mouseReleased() {

  // 1. Arrêter le déplacement d'une photo déjà collée
  let movedArrId = null;

for (let p of studioPhotos) {
  if (p.dragging) {
    movedArrId = p.arrId;
  }
  p.dragging = false;
}

if (movedArrId !== null) {
  markCollageDirty(movedArrId);
}

  // 2. Si aucune photo de l'archive n'est en cours de drag
  if (!draggedPhotoUrl) {
    uiDragging = false;
    return;
  }

  // 3. Convertir la position souris écran vers la position carte
  let mx = (mouseX - offsetX) / scaleFactor;
  let my = (mouseY - offsetY) / scaleFactor;

  // 4. Trouver l'arrondissement sur lequel on dépose
  let targetArr = null;

  for (let arr of data1) {
    if (pointInArrondissement(mx, my, arr)) {
      targetArr = arr;
      break;
    }
  }

  // 5. Si on ne dépose pas sur un arrondissement, on annule
  if (!targetArr) {
    draggedPhotoUrl = null;
    draggedPhotoArrId = null;
    draggedImageData = null;
    uiDragging = false;
    return;
  }

  let targetArrId = Number(targetArr.c_ar);

  const releasedPhotoUrl = draggedPhotoUrl;
const releasedFilterModes = [...draggedFilterModesSnapshot];

  // 6. Fonction commune pour ajouter la photo au collage
 function addPhotoToCollage(sourceImg) {

 const filterKey = releasedPhotoUrl + "|" + releasedFilterModes.join("+");

let filteredImg = filteredPhotoCache.get(filterKey);

if (!filteredImg) {
  filteredImg = createFilteredPhotoGraphic(
    sourceImg,
    releasedFilterModes
  );

  filteredPhotoCache.set(filterKey, filteredImg);
}

  const mixPresets = {
    none: {
      blendMode: "source-over",
      blendOpacity: 240,
      baseOpacity: 245,
      edgeSoftness: 22
    },
    beton: {
      blendMode: "multiply",
      blendOpacity: 220,
      baseOpacity: 240,
      edgeSoftness: 24
    },
    chantier: {
      blendMode: "overlay",
      blendOpacity: 225,
      baseOpacity: 242,
      edgeSoftness: 22
    },
    fracture: {
      blendMode: "hard-light",
      blendOpacity: 215,
      baseOpacity: 235,
      edgeSoftness: 24
    }
  };

  const mainMode = getMainCollageMode(releasedFilterModes);
  const preset = mixPresets[mainMode] || mixPresets.none;

  const newPhoto = {
  id: crypto.randomUUID(),
  img: filteredImg,
  originalImg: sourceImg,

  arrId: targetArrId,
  x: mx,
  y: my,

  scale: random(1.3, 1.8),
  rot: random(-0.18, 0.18),

  opacity: preset.baseOpacity,
  blendMode: preset.blendMode,
  blendOpacity: preset.blendOpacity,
  edgeSoftness: preset.edgeSoftness,

  glitch: random(2, 6),
  filterMode: mainMode,
  filterModes: [...releasedFilterModes],

  dragging: false,
  pinned: true
};

studioPhotos.push(newPhoto);

// La photo est visible immédiatement, sans attendre le cache
liveCollagePhotos.push(newPhoto);

arrIdsWithPhotosDirty = true;

// On reconstruit le cache plus tard, pas instantanément
scheduleCollageRebuild(targetArrId);
}

  // 7. Ajouter l'image, soit depuis l'image déjà chargée, soit via loadImage
if (draggedImageData) {
  addPhotoToCollage(draggedImageData);
} else {
  loadImage(releasedPhotoUrl, (imgLoaded) => {
    addPhotoToCollage(imgLoaded);
  });
}

  // 8. Nettoyer l'état de drag
  draggedPhotoUrl = null;
  draggedPhotoArrId = null;
  draggedImageData = null;
  uiDragging = false;
 
draggedFilterModesSnapshot = [];
isDraggingPlacedPhoto = false;
}

function scheduleCollageRebuild(arrId) {
  arrId = Number(arrId);

  collageCacheDirty[arrId] = true;

  if (collageRebuildDelayTimer) {
    clearTimeout(collageRebuildDelayTimer);
  }

  collageRebuildDelayTimer = setTimeout(() => {
    rebuildCollageCacheForArr(arrId);
    collageCacheDirty[arrId] = false;

    // Une fois le cache reconstruit, les photos live sont déjà intégrées dedans
    liveCollagePhotos = liveCollagePhotos.filter(p => Number(p.arrId) !== arrId);

    collageRebuildDelayTimer = null;
  }, 200);
}
class PhotoLayerItem {
  constructor(img, x, y) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.scale = 1;
    this.rot = 0;
  }

  draw(pg) {
    pg.push();
    pg.imageMode(CENTER);
    pg.translate(this.x, this.y);
    pg.rotate(this.rot);

    pg.image(
      this.img,
      0,
      0,
      this.img.width * 0.25 * this.scale,
      this.img.height * 0.25 * this.scale
    );

    pg.pop();
  }
}

function getMainCollageMode(modes) {
  if (!modes || modes.length === 0) return "none";

  // fracture domine le comportement de dessin
  if (modes.includes("fracture")) return "fracture";

  // chantier garde la couleur et la signalétique
  if (modes.includes("chantier")) return "chantier";

  // béton seul ou béton + autre léger
  if (modes.includes("beton")) return "beton";

  return "none";
}

function applyPhotoStyle(pg, p) {

  let opacity = p.opacity || 220;

  if (p.tintMode === 0) {
    // rendu chaud : jaune / chantier
    pg.tint(255, 225, 170, opacity);
  } 
  else if (p.tintMode === 1) {
    // rendu froid / béton
    pg.tint(190, 210, 230, opacity);
  } 
  else {
    // rendu plus neutre mais contrasté
    pg.tint(255, 255, 255, opacity);
  }
}



function clamp(v) {
  return Math.max(0, Math.min(255, v));
}

function clamp255(v) {
  return Math.max(0, Math.min(255, v));
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function constructionBoost(ctx, canvas, params) {
  const intensity = params.intensity ?? 1;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const saturation = 1 + 1.1 * intensity;
  const contrast = 1 + 0.35 * intensity;
  const warmth = 18 * intensity;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // saturation plus forte
    r = lum + (r - lum) * saturation;
    g = lum + (g - lum) * saturation;
    b = lum + (b - lum) * saturation;

    // légère chauffe jaune/orange
    r += warmth;
    g += warmth * 0.45;
    b -= warmth * 0.25;

    // contraste
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  ctx.putImageData(imageData, 0, 0);
}

function clamp255(v) {
  return Math.max(0, Math.min(255, v));
}

function isPhotoTouchingAnother(p, idArr, photoSize) {
  const a = getPhotoBox(p, photoSize);

  for (let other of studioPhotos) {
    if (other === p) continue;
    if (other.arrId !== idArr) continue;

    const otherSize = 260 * (other.scale || 1);
    const b = getPhotoBox(other, otherSize);

    if (boxesOverlap(a, b)) {
      return true;
    }
  }

  return false;
}

function getPhotoBox(p, size) {
  return {
    left: p.x - size / 2,
    right: p.x + size / 2,
    top: p.y - size / 2,
    bottom: p.y + size / 2
  };
}

function boxesOverlap(a, b) {
  return (
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top
  );
}

function getPhotoBox(p, size) {
  return {
    left: p.x - size / 2,
    right: p.x + size / 2,
    top: p.y - size / 2,
    bottom: p.y + size / 2
  };
}

function getBoxIntersection(a, b) {
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.right, b.right);
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.bottom, b.bottom);

  if (right <= left || bottom <= top) {
    return null;
  }

  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top
  };
}

function getOverlappingPhotos(p, photoSize) {
  const overlaps = [];
  const a = getPhotoBox(p, photoSize);

  for (let other of studioPhotos) {
    if (other === p) continue;
    if (other.arrId !== p.arrId) continue;

    const otherSize = 260 * (other.scale || 1);
    const b = getPhotoBox(other, otherSize);

    const intersection = getBoxIntersection(a, b);

    if (intersection) {
      overlaps.push({
        photo: other,
        intersection
      });
    }
  }

  return overlaps;
}

function drawBlendOnlyOnOverlap(pg, p, photoSize, overlaps, alphaMin = 45, alphaMax = 85) {
  const ctx = pg.drawingContext;

  for (let item of overlaps) {
    const other = item.photo;
    const inter = item.intersection;

    if (!other || !other.img || !inter) continue;

    const localX = inter.left - p.x;
    const localY = inter.top - p.y;

    ctx.save();

    ctx.beginPath();
    ctx.rect(
      localX,
      localY,
      inter.width,
      inter.height
    );
    ctx.clip();

    // IMPORTANT :
    // on n'utilise plus multiply ici,
    // sinon les croisements deviennent trop noirs.
    ctx.globalCompositeOperation = "soft-light";

    pg.tint(255, random(alphaMin, alphaMax));

    const dx = other.x - p.x;
    const dy = other.y - p.y;
    const otherSize = 260 * (other.scale || 1);

    pg.push();
    pg.translate(dx, dy);
    pg.rotate((other.rot || 0) - (p.rot || 0));

    pg.image(
      other.img,
      0,
      0,
      otherSize,
      otherSize
    );

    pg.pop();

    pg.noTint();
    ctx.restore();
  }
}

function drawOverlapTexture(pg, p, overlaps, alphaMin = 50, alphaMax = 90) {
  const ctx = pg.drawingContext;

  for (let item of overlaps) {
    const inter = item.intersection;
    if (!inter) continue;

    const localX = inter.left - p.x;
    const localY = inter.top - p.y;

    ctx.save();

    ctx.beginPath();
    ctx.rect(localX, localY, inter.width, inter.height);
    ctx.clip();

    pg.noStroke();

    const dots = 18;

    for (let i = 0; i < dots; i++) {
      const x = localX + random(0, inter.width);
      const y = localY + random(0, inter.height);
      const s = random(1, 4);

      pg.fill(
        random() > 0.5 ? 255 : 0,
        random(alphaMin, alphaMax)
      );

      pg.rect(x, y, s, s);
    }

    ctx.restore();
  }
}

function prepareArrondissementMasks() {
  arrondissementMasks = {};

  for (let arr of data1) {
    const id = Number(arr.c_ar);
    arrondissementBounds[id] = getArrBounds(arr);
    arrondissementCenters[id] = getArrCenter(arr);
  }
}

function getArrBounds(arr) {
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

  return { minX, minY, maxX, maxY };
}

function markCollageDirty(arrId) {
  collageCacheDirty[Number(arrId)] = true;
}

function processCollageRebuildQueue() {
  if (isDraggingPlacedPhoto) return;
  if (isRebuildingCollage) return;
  if (collageRebuildQueue.length === 0) return;

  const arrId = collageRebuildQueue.shift();

  isRebuildingCollage = true;

  setTimeout(() => {
    rebuildCollageCacheForArr(arrId);
    collageCacheDirty[arrId] = false;
    isRebuildingCollage = false;
  }, 30);
}

function getNearbyPhotos(p, photoSize) {
  const neighbors = [];
  const a = getPhotoBox(p, photoSize);

  for (let other of studioPhotos) {
    if (other === p) continue;
    if (other.arrId !== p.arrId) continue;

    const otherSize = 260 * (other.scale || 1);
    const b = getPhotoBox(other, otherSize);

    if (boxesOverlap(a, b)) {
      neighbors.push(other);
    }
  }

  return neighbors;
}

function drawCheapOrganicFragments(pg, sourceImg, photoSize, count = 3, alphaMin = 35, alphaMax = 60) {
  if (!sourceImg) return;

  for (let i = 0; i < count; i++) {
    const sw = random(sourceImg.width * 0.18, sourceImg.width * 0.42);
    const sh = random(sourceImg.height * 0.18, sourceImg.height * 0.42);

    const sx = random(0, Math.max(1, sourceImg.width - sw));
    const sy = random(0, Math.max(1, sourceImg.height - sh));

    const dw = random(photoSize * 0.18, photoSize * 0.40);
    const dh = dw * (sh / sw);

    const dx = random(-photoSize * 0.22, photoSize * 0.22);
    const dy = random(-photoSize * 0.22, photoSize * 0.22);

    pg.push();
    pg.translate(dx, dy);
    pg.rotate(random(-0.12, 0.12));
    pg.tint(255, random(alphaMin, alphaMax));
    pg.image(sourceImg, 0, 0, dw, dh, sx, sy, sw, sh);
    pg.pop();
  }

  pg.noTint();
}

function drawCheapNeighborBlend(pg, neighbors, photoSize, count = 1, alphaMin = 70, alphaMax = 120) {
  if (!neighbors || !neighbors.length) return;

  const passes = Math.min(count, neighbors.length);

  for (let i = 0; i < passes; i++) {
    const other = random(neighbors);
    if (!other || !other.img) continue;

    const dx = random(-photoSize * 0.12, photoSize * 0.12);
    const dy = random(-photoSize * 0.12, photoSize * 0.12);
    const scale = random(0.88, 1.04);

    pg.tint(255, random(alphaMin, alphaMax));
    pg.image(other.img, dx, dy, photoSize * scale, photoSize * scale);
  }

  pg.noTint();
}
function drawMixedPhoto(pg, p, photoSize, touching) {
  const ctx = pg.drawingContext;
  ctx.save();

  const overlaps = getOverlappingPhotos(p, photoSize);
  const hasRealOverlap = overlaps.length > 0;

  // ---------------------
  // PAS DE VRAIE SUPERPOSITION
  // ---------------------
  if (!hasRealOverlap) {
    ctx.globalCompositeOperation = "source-over";

    if (p.filterMode === "fracture") {
      pg.tint(255, p.opacity || 240);
      drawGlitchPhoto(pg, p.img, photoSize, p);
    } else {
      pg.tint(255, 228);
      pg.image(p.img, 0, 0, photoSize, photoSize);
    }

    pg.noTint();
    ctx.restore();
    return;
  }

  // ---------------------
  // IMAGE DE BASE
  // ---------------------
  ctx.globalCompositeOperation = "source-over";
  pg.tint(255, 232);
  pg.image(p.img, 0, 0, photoSize, photoSize);
  pg.noTint();

  // ---------------------
  // MÉLANGE PLUS SUBTIL
  // ---------------------

  if (p.filterMode === "beton") {
    // Béton : mix doux + texture légère
    ctx.globalCompositeOperation = "soft-light";
    drawBlendOnlyOnOverlap(pg, p, photoSize, overlaps, 42, 78);

    ctx.globalCompositeOperation = "overlay";
    drawOverlapTexture(pg, p, overlaps, 24, 48);
  }

  else if (p.filterMode === "chantier") {
    // Chantier : garde de la couleur sans noircir
    ctx.globalCompositeOperation = "soft-light";
    drawBlendOnlyOnOverlap(pg, p, photoSize, overlaps, 50, 90);

    ctx.globalCompositeOperation = "screen";
    drawOverlapTexture(pg, p, overlaps, 20, 42);
  }

  else if (p.filterMode === "fracture") {
    // Fracture : un peu plus nerveux, mais moins dur qu'avant
    ctx.globalCompositeOperation = "overlay";
    drawBlendOnlyOnOverlap(pg, p, photoSize, overlaps, 48, 82);
  }

  else {
    // Mode neutre : très discret
    ctx.globalCompositeOperation = "soft-light";
    drawBlendOnlyOnOverlap(pg, p, photoSize, overlaps, 38, 70);
  }

  // Sécurité : on revient toujours en mode normal
  ctx.globalCompositeOperation = "source-over";
  pg.noTint();

  ctx.restore();
}
function softenPhotoEdges(ctx, canvas, params = {}) {
  const margin = params.margin ?? 26;

  ctx.save();
  ctx.globalCompositeOperation = "destination-in";

  const gradient = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width * 0.25,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width * 0.72
  );

  gradient.addColorStop(0, "rgba(0,0,0,1)");
  gradient.addColorStop(0.72, "rgba(0,0,0,1)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.restore();
}

function getArrIdsWithPhotos() {
  if (!arrIdsWithPhotosDirty) {
    return arrIdsWithPhotosCache;
  }

  const ids = new Set();

  for (let p of studioPhotos) {
    if (p && p.arrId !== null && p.arrId !== undefined) {
      ids.add(Number(p.arrId));
    }
  }

  arrIdsWithPhotosCache = Array.from(ids);
  arrIdsWithPhotosDirty = false;

  return arrIdsWithPhotosCache;
}
function erodeConcreteAlpha(ctx, canvas, strength = 1) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;

      // bruit simple sans helper supplémentaire
      const n =
        (
          Math.sin(x * 0.035 + y * 0.021) +
          Math.sin(x * 0.12 + y * 0.07) +
          Math.sin(x * 0.018 - y * 0.045)
        ) / 3;

      // on remet entre 0 et 1
      const noise = (n + 1) * 0.5;

      let alpha = data[i + 3];

      alpha -= noise * 45 * strength;

      if (noise > 0.72) alpha -= 35 * strength;
      if (noise > 0.84) alpha -= 25 * strength;

      data[i + 3] = clamp255(alpha);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
function fastColorBoost(ctx, canvas) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const saturation = 1.55;
  const contrast = 1.25;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // saturation
    r = lum + (r - lum) * saturation;
    g = lum + (g - lum) * saturation;
    b = lum + (b - lum) * saturation;

    // dominante chantier chaude
    r += 18;
    g += 8;
    b -= 6;

    // contraste
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    data[i] = clamp255(r);
    data[i + 1] = clamp255(g);
    data[i + 2] = clamp255(b);
  }

  ctx.putImageData(imageData, 0, 0);
}

function fastPrintTexture(ctx, canvas) {
  ctx.save();

  // trame horizontale claire
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#ffffff";

  for (let y = 0; y < canvas.height; y += 8) {
    ctx.fillRect(0, y, canvas.width, 1);
  }

  // trame verticale sombre
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#000000";

  for (let x = 0; x < canvas.width; x += 10) {
    ctx.fillRect(x, 0, 1, canvas.height);
  }

  ctx.restore();
}

function fastConcreteTexture(ctx, canvas) {
  ctx.save();

  const dots = 300;

  for (let i = 0; i < dots; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const s = 1 + Math.random() * 2;

    ctx.fillStyle =
      Math.random() > 0.5
        ? "rgba(255,255,255,0.09)"
        : "rgba(0,0,0,0.08)";

    ctx.fillRect(x, y, s, s);
  }

  ctx.restore();
}

function fastConstructionMarks(ctx, canvas) {
  ctx.save();

  // diagonales jaune chantier
  ctx.strokeStyle = "rgba(255, 195, 0, 0.22)";
  ctx.lineWidth = 5;

  for (let x = -canvas.height; x < canvas.width; x += 130) {
    ctx.beginPath();
    ctx.moveTo(x, canvas.height);
    ctx.lineTo(x + canvas.height, 0);
    ctx.stroke();
  }

  // blocs orange type affichage chantier
  ctx.fillStyle = "rgba(255, 90, 0, 0.16)";

  for (let i = 0; i < 4; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const w = 40 + Math.random() * 90;
    const h = 10 + Math.random() * 24;

    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

function overlayConstructionLines(ctx, canvas, params) {
  const intensity = params.intensity ?? 1;

  ctx.save();

  // lignes blanches fines
  ctx.strokeStyle = `rgba(255,255,255,${0.08 + 0.06 * intensity})`;
  ctx.lineWidth = 1;

  let spacing1 = 28;
  for (let x = 0; x < canvas.width; x += spacing1) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // diagonales jaune chantier
  ctx.strokeStyle = `rgba(255,190,0,${0.08 + 0.10 * intensity})`;
  ctx.lineWidth = 4;

  let spacing2 = 140;
  for (let x = -canvas.height; x < canvas.width; x += spacing2) {
    ctx.beginPath();
    ctx.moveTo(x, canvas.height);
    ctx.lineTo(x + canvas.height, 0);
    ctx.stroke();
  }

  ctx.restore();
}
function drawCollageForArr(arrId) {
  arrId = Number(arrId);

  if (!collageCache[arrId]) {
    const b = arrondissementBounds[arrId];
    if (!b) return;

    const margin = 260;

    const x = Math.max(0, Math.floor(b.minX - margin));
    const y = Math.max(0, Math.floor(b.minY - margin));
    const w = Math.ceil((b.maxX - b.minX) + margin * 2);
    const h = Math.ceil((b.maxY - b.minY) + margin * 2);

    collageCache[arrId] = {
      g: createGraphics(w, h),
      x,
      y,
      w,
      h
    };

    rebuildCollageCacheForArr(arrId);
    collageCacheDirty[arrId] = false;
  }

  const cache = collageCache[arrId];

  if (cache) {
    image(cache.g, cache.x, cache.y);
  }

  drawLiveCollagePhotosForArr(arrId);
}

function drawLiveCollagePhotosForArr(arrId) {
  arrId = Number(arrId);

  const livePhotos = liveCollagePhotos.filter(p => Number(p.arrId) === arrId);
  if (!livePhotos.length) return;

  for (let p of livePhotos) {
    if (!p.img) continue;

    push();

    imageMode(CENTER);
    translate(p.x, p.y);
    rotate(p.rot || 0);

    const photoSize = 260 * (p.scale || 1);

    if (p.filterMode === "fracture") {
      const glitch = p.glitch ?? 6;
      const opacity = p.opacity ?? 245;

      tint(255, 90, 20, 90);
      image(p.img, -glitch, 0, photoSize, photoSize);

      tint(20, 220, 255, 70);
      image(p.img, glitch, 0, photoSize, photoSize);

      tint(255, opacity);
      image(p.img, 0, 0, photoSize, photoSize);

      noTint();
    } else {
      tint(255, p.opacity || 235);
      image(p.img, 0, 0, photoSize, photoSize);
      noTint();
    }

    noFill();
    stroke(255, 120);
    strokeWeight(1.2);
    rectMode(CENTER);
    rect(0, 0, photoSize, photoSize);

    pop();
  }
}

function rebuildCollageCacheForArr(arrId) {
  const cache = collageCache[arrId];
  if (!cache) return;

  const target = cache.g;
  target.clear();

  const photos = studioPhotos.filter(p => p.arrId === arrId);

  for (let p of photos) {
    if (!p.img || p.img.width <= 0) continue;

    target.push();

    target.imageMode(CENTER);

    // On dessine dans un cache local, donc on retire l'offset du cache
    target.translate(p.x - cache.x, p.y - cache.y);
    target.rotate(p.rot || 0);

    const photoSize = 260 * (p.scale || 1);
    const touching = isPhotoTouchingAnother(p, arrId, photoSize);

    drawMixedPhoto(target, p, photoSize, touching);

    target.noTint();
    target.noFill();
    target.stroke(255, touching ? 45 : 130);
    target.strokeWeight(touching ? 0.8 : 1.4);
    target.rectMode(CENTER);
    target.rect(0, 0, photoSize, photoSize);

    target.pop();
  }

  // Masque arrondissement, mais dessiné avec le même décalage local
  target.drawingContext.save();
  target.drawingContext.globalCompositeOperation = "destination-in";

drawArrondissementMaskLocal(target, arrId, cache.x, cache.y);

  target.drawingContext.restore();
}

function drawArrondissementMaskLocal(pg, idArr, offsetLocalX, offsetLocalY) {
  let arr = data1.find(a => Number(a.c_ar) === Number(idArr));
  if (!arr) return;

  let geom = arr.geom.geometry;

  pg.noStroke();
  pg.fill(255);

  let polys = geom.type === "Polygon"
    ? [geom.coordinates[0]]
    : geom.coordinates.map(p => p[0]);

  for (let poly of polys) {
    pg.beginShape();

    for (let p of poly) {
      let x = map(p[0], lonMin, lonMax, 0, img.width) - offsetLocalX;
      let y = map(p[1], latMax, latMin, 0, img.height) - offsetLocalY;
      pg.vertex(x, y);
    }

    pg.endShape(CLOSE);
  }
}
function overlayPosterBlocks(ctx, canvas, params) {
  const intensity = params.intensity ?? 1;

  ctx.save();

  const blocks = Math.floor(3 + 6 * intensity);

  for (let i = 0; i < blocks; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const w = 20 + Math.random() * canvas.width * 0.22;
    const h = 8 + Math.random() * canvas.height * 0.08;

    const palette = [
      `rgba(255, 195, 0, ${0.12 + Math.random() * 0.12})`,
      `rgba(255, 90, 0, ${0.10 + Math.random() * 0.10})`,
      `rgba(0, 0, 0, ${0.05 + Math.random() * 0.08})`,
      `rgba(255, 255, 255, ${0.05 + Math.random() * 0.08})`
    ];

    ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)];
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

function drawGlitchPhoto(pg, imgToDraw, photoSize, p) {
  const glitch = p.glitch ?? 6;
  const opacity = p.opacity ?? 245;

  pg.push();

  // couche chaude décalée
  pg.tint(255, 90, 20, 90);
  pg.image(
    imgToDraw,
    -glitch,
    0,
    photoSize,
    photoSize
  );

  // couche froide décalée
  pg.tint(20, 220, 255, 70);
  pg.image(
    imgToDraw,
    glitch,
    0,
    photoSize,
    photoSize
  );

  // image principale
  pg.tint(255, opacity);
  pg.image(
    imgToDraw,
    0,
    0,
    photoSize,
    photoSize
  );

  pg.noTint();

  pg.pop();
}
function clamp255(v) {
  return Math.max(0, Math.min(255, v));
}


// =========================
// FILTRE 1 — CHANTIER BRUTAL
// jaune / orange / rouge / contraste fort
// =========================

function brutalChantierColor(ctx, canvas) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const saturation = 2.25;
  const contrast = 1.65;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Saturation très forte
    r = lum + (r - lum) * saturation;
    g = lum + (g - lum) * saturation;
    b = lum + (b - lum) * saturation;

    // Dominante chantier
    r += 42;
    g += 18;
    b -= 28;

    // Contraste dur
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    // Posterisation légère : effet affiche / photocopie
    r = Math.round(r / 24) * 24;
    g = Math.round(g / 24) * 24;
    b = Math.round(b / 24) * 24;

    data[i] = clamp255(r);
    data[i + 1] = clamp255(g);
    data[i + 2] = clamp255(b);
  }

  ctx.putImageData(imageData, 0, 0);
}


function addConstructionStripes(ctx, canvas) {
  ctx.save();

  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = "rgba(255, 180, 0, 0.55)";
  ctx.lineWidth = 14;

  for (let x = -canvas.height; x < canvas.width; x += 95) {
    ctx.beginPath();
    ctx.moveTo(x, canvas.height);
    ctx.lineTo(x + canvas.height, 0);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
  ctx.lineWidth = 3;

  for (let x = -canvas.height; x < canvas.width; x += 95) {
    ctx.beginPath();
    ctx.moveTo(x + 20, canvas.height);
    ctx.lineTo(x + canvas.height + 20, 0);
    ctx.stroke();
  }

  ctx.restore();
}


function addRedOrangeBlocks(ctx, canvas) {
  ctx.save();

  ctx.globalCompositeOperation = "multiply";

  const colors = [
    "rgba(255, 55, 0, 0.35)",
    "rgba(255, 120, 0, 0.30)",
    "rgba(255, 205, 0, 0.28)",
    "rgba(0, 0, 0, 0.18)"
  ];

  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];

    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const w = 35 + Math.random() * 150;
    const h = 12 + Math.random() * 45;

    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}


// =========================
// FILTRE 2 — BÉTON SALE
// gris, poussière, matière
// =========================

function concreteColorGrain(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const saturation = 0.92;   // garde la couleur, juste un peu calmée
  const contrast = 1.10;
  const grainAmount = 18 * intensity;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // on garde la couleur, on la désature juste un peu
    r = lum + (r - lum) * saturation;
    g = lum + (g - lum) * saturation;
    b = lum + (b - lum) * saturation;

    // légère tonalité minérale froide
    r += 2;
    g += 3;
    b += 6;

    // contraste léger
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    // grain béton
    const grain = (Math.random() - 0.5) * grainAmount;
    r += grain;
    g += grain;
    b += grain;

    data[i]     = clamp255(r);
    data[i + 1] = clamp255(g);
    data[i + 2] = clamp255(b);
  }

  ctx.putImageData(imageData, 0, 0);
}

function addConcreteGrainOverlay(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  ctx.save();

  const dots = Math.floor(220 + 180 * intensity);

  for (let i = 0; i < dots; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const s = 0.6 + Math.random() * 1.8;

    ctx.fillStyle =
      Math.random() > 0.5
        ? "rgba(255,255,255,0.07)"
        : "rgba(0,0,0,0.08)";

    ctx.fillRect(x, y, s, s);
  }

  ctx.restore();
}

function boostVividColors(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const vividBoost = 1.75 + 0.20 * intensity;
  const softBoost = 1.05;
  const contrast = 1.12;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // si la couleur est déjà vive, on l'accentue fortement
    if (chroma > 45 && lum > 25 && lum < 235) {
      r = lum + (r - lum) * vividBoost;
      g = lum + (g - lum) * vividBoost;
      b = lum + (b - lum) * vividBoost;

      r *= 1.03;
      g *= 1.03;
      b *= 1.03;
    } else {
      // le reste reste presque naturel
      r = lum + (r - lum) * softBoost;
      g = lum + (g - lum) * softBoost;
      b = lum + (b - lum) * softBoost;
    }

    // contraste léger
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    data[i]     = clamp255(r);
    data[i + 1] = clamp255(g);
    data[i + 2] = clamp255(b);
  }

  ctx.putImageData(imageData, 0, 0);
}


function addConcreteDustLite(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  ctx.save();

  // beaucoup plus de points
  const dots = Math.floor(1100 + 500 * intensity);

  for (let i = 0; i < dots; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const s = 0.5 + Math.random() * 2.6;

    ctx.fillStyle =
      Math.random() > 0.5
        ? "rgba(255,255,255,0.16)"
        : "rgba(0,0,0,0.17)";

    ctx.fillRect(x, y, s, s);
  }

  // poussières plus larges / taches béton
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const w = 12 + Math.random() * 90;
    const h = 6 + Math.random() * 32;

    ctx.fillStyle =
      Math.random() > 0.5
        ? "rgba(255,255,255,0.07)"
        : "rgba(0,0,0,0.08)";

    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}


function addScratches(ctx, canvas) {
  ctx.save();

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 32; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const len = 35 + Math.random() * 170;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + randomRange(-15, 15));
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(0,0,0,0.18)";

  for (let i = 0; i < 20; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const len = 30 + Math.random() * 140;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + randomRange(-10, 10));
    ctx.stroke();
  }

  ctx.restore();
}


function addDirtyVignette(ctx, canvas) {
  ctx.save();

  const gradient = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width * 0.15,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width * 0.72
  );

  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.42)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.restore();
}


// =========================
// FILTRE 3 — FRACTURE / GLITCH
// bandes cassées + lignes de faille
// =========================

function fractureSlices(ctx, canvas) {
  const copy = document.createElement("canvas");
  copy.width = canvas.width;
  copy.height = canvas.height;

  const copyCtx = copy.getContext("2d");
  copyCtx.drawImage(canvas, 0, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let y = 0;

  while (y < canvas.height) {
    const h = 8 + Math.random() * 36;
    const shift = randomRange(-38, 38);

    ctx.drawImage(
      copy,
      0,
      y,
      canvas.width,
      h,
      shift,
      y,
      canvas.width,
      h
    );

    // décalage couleur occasionnel
    if (Math.random() > 0.55) {
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(255,0,0,0.15)";
      ctx.fillRect(shift, y, canvas.width, h);
      ctx.globalCompositeOperation = "source-over";
    }

    y += h;
  }
}


function addCrackLines(ctx, canvas) {
  ctx.save();

  for (let i = 0; i < 7; i++) {
    let x = Math.random() * canvas.width;
    let y = Math.random() * canvas.height;

    ctx.beginPath();
    ctx.moveTo(x, y);

    const segments = 5 + Math.floor(Math.random() * 7);

    for (let j = 0; j < segments; j++) {
      x += randomRange(-55, 55);
      y += randomRange(25, 70);
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = "rgba(0,0,0,0.72)";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.50)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  ctx.restore();
}

function concreteBaseTone(ctx, canvas) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // base grise béton, légèrement froide
    r = lum * 0.92 + 20;
    g = lum * 0.96 + 22;
    b = lum * 1.05 + 28;

    // contraste sec
    r = (r - 128) * 1.28 + 128;
    g = (g - 128) * 1.28 + 128;
    b = (b - 128) * 1.28 + 128;

    data[i]     = clamp255(r);
    data[i + 1] = clamp255(g);
    data[i + 2] = clamp255(b);
  }

  ctx.putImageData(imageData, 0, 0);
}

// =========================
// BRUIT COMMUN
// =========================

function addHardPosterNoise(ctx, canvas) {
  ctx.save();

  // Trame horizontale dure
  ctx.globalCompositeOperation = "overlay";

  for (let y = 0; y < canvas.height; y += 6) {
    ctx.fillStyle =
      Math.random() > 0.5
        ? "rgba(255,255,255,0.12)"
        : "rgba(0,0,0,0.10)";

    ctx.fillRect(0, y, canvas.width, 2);
  }

  // Grain plus gros
  ctx.globalCompositeOperation = "source-over";

  for (let i = 0; i < 500; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const s = 1 + Math.random() * 3;

    ctx.fillStyle =
      Math.random() > 0.55
        ? "rgba(255,255,255,0.18)"
        : "rgba(0,0,0,0.16)";

    ctx.fillRect(x, y, s, s);
  }

  ctx.restore();
}

function textureConcrete(ctx, canvas, params) {
  const intensity = Math.pow(params.intensity ?? 1, 3);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 120 * intensity;

    let r = data[i] + grain;
    let g = data[i + 1] + grain;
    let b = data[i + 2] + grain;

    // cassure contraste extrême
    const avg = (r + g + b) / 3;
    const boost = avg > 120 ? 1.4 : 0.6;

    r *= boost;
    g *= boost;
    b *= boost;

    data[i]     = clamp255(r);
    data[i + 1] = clamp255(g);
    data[i + 2] = clamp255(b);
  }

  ctx.putImageData(imageData, 0, 0);
}

function addConcreteClouds(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  ctx.save();

  // zones claires poudrées
  for (let i = 0; i < 14 * intensity; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const w = 40 + Math.random() * 140;
    const h = 25 + Math.random() * 110;
    const a = 0.04 + Math.random() * 0.08;

    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, w, h);
  }

  // zones sombres sales
  for (let i = 0; i < 10 * intensity; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const w = 30 + Math.random() * 120;
    const h = 20 + Math.random() * 90;
    const a = 0.03 + Math.random() * 0.07;

    ctx.fillStyle = `rgba(0,0,0,${a})`;
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

function addScratches(ctx, canvas) {
  ctx.save();

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const len = 30 + Math.random() * 150;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + randomRange(-12, 12));
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(0,0,0,0.14)";
  ctx.lineWidth = 1.2;

  for (let i = 0; i < 24; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const len = 25 + Math.random() * 120;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + randomRange(-10, 10));
    ctx.stroke();
  }

  ctx.restore();
}

function addDirtyVignette(ctx, canvas) {
  ctx.save();

  const gradient = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width * 0.12,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width * 0.75
  );

  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.38)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.restore();
}

function selectiveConstructionBoost(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;

    // Détection simple des couleurs chantier
    const isYellow =
      r > 120 &&
      g > 95 &&
      b < 120 &&
      r >= g * 0.85 &&
      chroma > 35;

    const isOrange =
      r > 130 &&
      g > 55 &&
      g < 165 &&
      b < 100 &&
      chroma > 45;

    const isRed =
      r > 115 &&
      r > g * 1.25 &&
      r > b * 1.25 &&
      chroma > 45;

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (isYellow) {
      // jaune chantier plus dense, moins fluo
      r = lum + (r - lum) * (1.45 + 0.25 * intensity);
      g = lum + (g - lum) * (1.35 + 0.20 * intensity);
      b = lum + (b - lum) * 0.75;

      r += 18 * intensity;
      g += 10 * intensity;
      b -= 12 * intensity;
    }

    else if (isOrange) {
      // orange / signalétique
      r = lum + (r - lum) * (1.55 + 0.25 * intensity);
      g = lum + (g - lum) * (1.25 + 0.15 * intensity);
      b = lum + (b - lum) * 0.70;

      r += 22 * intensity;
      g += 6 * intensity;
      b -= 10 * intensity;
    }

    else if (isRed) {
      // rouge plus fort mais pas néon
      r = lum + (r - lum) * (1.65 + 0.30 * intensity);
      g = lum + (g - lum) * 0.85;
      b = lum + (b - lum) * 0.80;

      r += 18 * intensity;
      g -= 4 * intensity;
      b -= 6 * intensity;
    }

    else {
      // Le reste de l'image reste plus naturel,
      // légèrement désaturé / sali pour faire ressortir les couleurs chantier.
      r = lum + (r - lum) * 0.82;
      g = lum + (g - lum) * 0.82;
      b = lum + (b - lum) * 0.82;

      // très légère baisse de luminosité
      r *= 0.94;
      g *= 0.94;
      b *= 0.94;
    }

    // Contraste modéré, pas effet néon
    r = (r - 128) * 1.12 + 128;
    g = (g - 128) * 1.12 + 128;
    b = (b - 128) * 1.12 + 128;

    data[i]     = clamp255(r);
    data[i + 1] = clamp255(g);
    data[i + 2] = clamp255(b);
  }

  ctx.putImageData(imageData, 0, 0);
}

function addConstructionDirt(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  ctx.save();

  // voile sale beige/gris, très léger
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `rgba(155, 135, 95, ${0.08 * intensity})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // taches sombres irrégulières
  for (let i = 0; i < 18 * intensity; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const w = 20 + Math.random() * 110;
    const h = 8 + Math.random() * 55;

    ctx.fillStyle = `rgba(35, 30, 22, ${0.04 + Math.random() * 0.08})`;
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

function addLightDust(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  ctx.save();

  for (let i = 0; i < 700 * intensity; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const s = 0.5 + Math.random() * 2.2;

    ctx.fillStyle =
      Math.random() > 0.45
        ? "rgba(255,255,255,0.09)"
        : "rgba(0,0,0,0.07)";

    ctx.fillRect(x, y, s, s);
  }

  ctx.restore();
}
function addSmallWorksiteMarks(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  ctx.save();

  ctx.globalCompositeOperation = "multiply";

  // petits aplats jaune/orange, comme bouts d'affiche ou rubalise
  const colors = [
    `rgba(255, 190, 0, ${0.10 * intensity})`,
    `rgba(255, 95, 0, ${0.08 * intensity})`,
    `rgba(180, 0, 0, ${0.06 * intensity})`
  ];

  for (let i = 0; i < 5 * intensity; i++) {
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];

    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const w = 25 + Math.random() * 90;
    const h = 6 + Math.random() * 22;

    ctx.fillRect(x, y, w, h);
  }

  // quelques lignes type ruban / signalétique, mais rares
  ctx.strokeStyle = `rgba(255, 170, 0, ${0.16 * intensity})`;
  ctx.lineWidth = 3;

  for (let i = 0; i < 3 * intensity; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + randomRange(50, 160), y + randomRange(-20, 20));
    ctx.stroke();
  }

  ctx.restore();
}

function constructionColorPunch(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    const isYellow =
      r > 115 &&
      g > 90 &&
      b < 135 &&
      r > b * 1.25 &&
      g > b * 1.15 &&
      chroma > 30;

    const isOrange =
      r > 125 &&
      g > 45 &&
      g < 175 &&
      b < 125 &&
      r > g * 1.05 &&
      r > b * 1.4 &&
      chroma > 35;

    const isRed =
      r > 105 &&
      r > g * 1.18 &&
      r > b * 1.18 &&
      chroma > 35;

    if (isYellow) {
      r = lum + (r - lum) * (1.9 + 0.35 * intensity);
      g = lum + (g - lum) * (1.65 + 0.25 * intensity);
      b = lum + (b - lum) * 0.55;

      r += 30 * intensity;
      g += 22 * intensity;
      b -= 22 * intensity;
    }

    else if (isOrange) {
      r = lum + (r - lum) * (2.05 + 0.35 * intensity);
      g = lum + (g - lum) * (1.55 + 0.20 * intensity);
      b = lum + (b - lum) * 0.50;

      r += 36 * intensity;
      g += 12 * intensity;
      b -= 18 * intensity;
    }

    else if (isRed) {
      r = lum + (r - lum) * (2.15 + 0.40 * intensity);
      g = lum + (g - lum) * 0.65;
      b = lum + (b - lum) * 0.60;

      r += 34 * intensity;
      g -= 8 * intensity;
      b -= 8 * intensity;
    }

    else {
      // Le reste est matifié pour que les couleurs chantier ressortent mieux
      r = lum + (r - lum) * 0.68;
      g = lum + (g - lum) * 0.68;
      b = lum + (b - lum) * 0.68;

      r *= 0.88;
      g *= 0.88;
      b *= 0.86;
    }

    // Contraste global plus dur, mais pas néon
    r = (r - 128) * 1.22 + 128;
    g = (g - 128) * 1.22 + 128;
    b = (b - 128) * 1.22 + 128;

    data[i] = clamp255(r);
    data[i + 1] = clamp255(g);
    data[i + 2] = clamp255(b);
  }

  ctx.putImageData(imageData, 0, 0);
}

function drawOneOverlay(arrId) {
  if (!overlays[arrId]) return;

  const o = overlays[arrId];
  const c = arrondissementCenters[Number(arrId)];

  if (!c) return;

  push();

  translate(
    c.x + o.ox + globalFixX,
    c.y + o.oy + globalFixY
  );

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

function addConstructionMud(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  ctx.save();

  // voile terre / poussière
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `rgba(145, 118, 72, ${0.14 * intensity})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // taches sales
  for (let i = 0; i < 28 * intensity; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const w = 18 + Math.random() * 130;
    const h = 8 + Math.random() * 65;

    ctx.fillStyle = `rgba(45, 35, 20, ${0.05 + Math.random() * 0.09})`;
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

function addWarningTape(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  ctx.save();

  const tapeCount = Math.floor(2 + intensity * 2);

  for (let i = 0; i < tapeCount; i++) {
    const y = Math.random() * canvas.height;
    const h = randomRange(18, 34);
    const angle = randomRange(-0.22, 0.22);

    ctx.save();

    ctx.translate(canvas.width / 2, y);
    ctx.rotate(angle);

    // bande jaune
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(255, 190, 0, ${0.30 + 0.12 * intensity})`;
    ctx.fillRect(-canvas.width, -h / 2, canvas.width * 2, h);

    // bandes noires diagonales
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = `rgba(0, 0, 0, ${0.28 + 0.10 * intensity})`;

    for (let x = -canvas.width; x < canvas.width * 2; x += 34) {
      ctx.beginPath();
      ctx.moveTo(x, -h / 2);
      ctx.lineTo(x + 15, -h / 2);
      ctx.lineTo(x - 5, h / 2);
      ctx.lineTo(x - 20, h / 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  ctx.restore();
}

function addConstructionPaintBlocks(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  ctx.save();

  const colors = [
    `rgba(255, 190, 0, ${0.22 * intensity})`,
    `rgba(255, 105, 0, ${0.18 * intensity})`,
    `rgba(190, 0, 0, ${0.13 * intensity})`,
    `rgba(0, 0, 0, ${0.10 * intensity})`
  ];

  for (let i = 0; i < 10 * intensity; i++) {
    ctx.globalCompositeOperation = Math.random() > 0.5 ? "multiply" : "source-over";
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];

    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const w = 25 + Math.random() * 120;
    const h = 8 + Math.random() * 36;

    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

function addLightDust(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  ctx.save();

  for (let i = 0; i < 850 * intensity; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const s = 0.5 + Math.random() * 2.4;

    ctx.fillStyle =
      Math.random() > 0.45
        ? "rgba(255,255,255,0.10)"
        : "rgba(0,0,0,0.08)";

    ctx.fillRect(x, y, s, s);
  }

  ctx.restore();
}
function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function concreteColorGrainLite(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Béton coloré : on garde davantage la couleur qu'avant
  const saturation = 1.02;
  const contrast = 1.20;
  const grainAmount = 62 * intensity;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // garde la couleur, mais la minéralise légèrement
    r = lum + (r - lum) * saturation;
    g = lum + (g - lum) * saturation;
    b = lum + (b - lum) * saturation;

    // froideur béton, mais légère
    r += 1;
    g += 3;
    b += 7;

    // contraste béton plus net
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    // grain principal
    const grain = (Math.random() - 0.5) * grainAmount;
    r += grain;
    g += grain;
    b += grain;

    // micro-éclats : peu coûteux, mais visibles
    if (Math.random() > 0.88) {
      const burst = (Math.random() - 0.5) * 95 * intensity;
      r += burst;
      g += burst;
      b += burst;
    }

    data[i]     = clamp255(r);
    data[i + 1] = clamp255(g);
    data[i + 2] = clamp255(b);
  }

  ctx.putImageData(imageData, 0, 0);
}

function addConcreteSpeckle(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  ctx.save();

  // petites lignes / accrocs
  for (let i = 0; i < 180 * intensity; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const w = 1 + Math.random() * 4;
    const h = 1 + Math.random() * 3;

    ctx.fillStyle =
      Math.random() > 0.5
        ? "rgba(255,255,255,0.10)"
        : "rgba(0,0,0,0.11)";

    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

function addConcreteDustLite(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  ctx.save();

  // Beaucoup de points, mais dessinés une seule fois au dépôt de la photo
  const dots = Math.floor(760 + 320 * intensity);

  for (let i = 0; i < dots; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const s = 0.5 + Math.random() * 2.4;

    ctx.fillStyle =
      Math.random() > 0.5
        ? "rgba(255,255,255,0.16)"
        : "rgba(0,0,0,0.17)";

    ctx.fillRect(x, y, s, s);
  }

  // Plaques / poussières plus larges, très visibles mais peu nombreuses
  for (let i = 0; i < 24 * intensity; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const w = 16 + Math.random() * 95;
    const h = 7 + Math.random() * 34;

    ctx.fillStyle =
      Math.random() > 0.5
        ? "rgba(255,255,255,0.075)"
        : "rgba(0,0,0,0.085)";

    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

function boostVividColorsLite(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Plus fort qu'avant, mais pas délirant
  const vividBoost = 1.95 + 0.28 * intensity;
  const softBoost = 1.14;
  const contrast = 1.18 + 0.04 * intensity;
  const brightness = 4 * intensity;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Boost plus large : ça attrape aussi les bleus, verts, rouges, jaunes
    if (chroma > 28 && lum > 18 && lum < 240) {
      r = lum + (r - lum) * vividBoost;
      g = lum + (g - lum) * vividBoost;
      b = lum + (b - lum) * vividBoost;

      // petit côté affiche / encre
      r += brightness;
      g += brightness;
      b += brightness;
    } else {
      // les zones peu colorées restent lisibles
      r = lum + (r - lum) * softBoost;
      g = lum + (g - lum) * softBoost;
      b = lum + (b - lum) * softBoost;
    }

    // contraste final
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    data[i]     = clamp255(r);
    data[i + 1] = clamp255(g);
    data[i + 2] = clamp255(b);
  }

  ctx.putImageData(imageData, 0, 0);
}
function createFilteredPhotoGraphic(sourceImg, modes = []) {

  const targetSize = 420;

  const g = createGraphics(targetSize, targetSize);
  g.clear();
  g.imageMode(CENTER);

  const ratio = Math.max(
    targetSize / sourceImg.width,
    targetSize / sourceImg.height
  );

  const drawW = sourceImg.width * ratio;
  const drawH = sourceImg.height * ratio;

  g.image(
    sourceImg,
    targetSize / 2,
    targetSize / 2,
    drawW,
    drawH
  );

  // Sécurité : si jamais on reçoit encore une string
  if (!Array.isArray(modes)) {
    modes = modes === "none" ? [] : [modes];
  }

  if (modes.length === 0) {
    return g;
  }

  const hasChantier = modes.includes("chantier");
  const hasBeton = modes.includes("beton");
  const hasFracture = modes.includes("fracture");

  const canvas = g.elt;
  const ctx = canvas.getContext("2d", {
    willReadFrequently: true
  });

  // 1. Béton : garder la couleur + donner une matière minérale
if (hasBeton) {
  concreteColorGrainLite(ctx, canvas, {
    intensity: hasChantier ? 1.55 : 1.9
  });

  addConcreteDustLite(ctx, canvas, {
    intensity: hasChantier ? 1.45 : 1.9
  });

  addConcreteSpeckle(ctx, canvas, {
    intensity: hasChantier ? 1.1 : 1.45
  });

  addConcreteClouds(ctx, canvas, {
    intensity: hasChantier ? 0.75 : 1.1
  });

  addScratches(ctx, canvas);

  erodeConcreteAlpha(ctx, canvas, 0.06);
}

  // 2. Chantier : booster toutes les couleurs vives
if (hasChantier) {
  boostVividColorsLite(ctx, canvas, {
    intensity: hasBeton ? 1.15 : 1.55
  });

  addSmallWorksiteMarks(ctx, canvas, {
    intensity: hasBeton ? 0.5 : 0.75
  });

  addLightDust(ctx, canvas, {
    intensity: hasBeton ? 0.45 : 0.6
  });

  if (typeof applyChantierAlphaMask === "function") {
    applyChantierAlphaMask(ctx, canvas, { intensity: 0.08 });
  }
}

  // 3. Fracture à la fin
  if (hasFracture) {
    fractureSlices(ctx, canvas);
    addCrackLines(ctx, canvas);
    addHardPosterNoise(ctx, canvas);
  }

  softenPhotoEdges(ctx, canvas, {
    margin:
      hasBeton && hasChantier ? 22 :
      hasBeton ? 24 :
      hasChantier ? 22 :
      hasFracture ? 20 :
      18
  });

  return g;
}

function applyConcreteAlphaMask(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;

      const n1 = pseudoNoise(x * 0.035, y * 0.035);
      const n2 = pseudoNoise(x * 0.012 + 37, y * 0.012 + 91);
      const n3 = pseudoNoise(x * 0.09 + 11, y * 0.025 + 19);

      let alpha = 225;

      // matière nuageuse
      alpha -= n1 * 28 * intensity;
      alpha -= n2 * 55 * intensity;

      // petites cassures / manques
      if (n3 > 0.76) alpha -= 45 * intensity;
      if (n2 > 0.83) alpha -= 30 * intensity;

      data[i + 3] = clamp255(alpha);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyChantierAlphaMask(ctx, canvas, params = {}) {
  const intensity = params.intensity ?? 1;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;

      const n1 = pseudoNoise(x * 0.028, y * 0.028);
      const n2 = pseudoNoise(x * 0.14 + 17, y * 0.018 + 53);
      const n3 = pseudoNoise(x * 0.045 + 8, y * 0.19 + 101);

      let alpha = 210;

      // usure générale
      alpha -= n1 * 24 * intensity;

      // bandes / transfert un peu abîmés
      if (n2 > 0.78) alpha -= 38 * intensity;

      // quelques manques plus francs
      if (n3 > 0.84) alpha -= 52 * intensity;

      data[i + 3] = clamp255(alpha);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
function clamp255(v) {
  return Math.max(0, Math.min(255, v));
}

function fract(v) {
  return v - Math.floor(v);
}

function pseudoNoise(x, y) {
  return fract(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123);
}
function setupCollageControls() {
  const checks = document.querySelectorAll(".collage-filter-check");

  checks.forEach(check => {
    check.addEventListener("change", () => {
      collageFilterModes = Array.from(checks)
        .filter(c => c.checked)
        .map(c => c.value);

      console.log("Modes collage :", collageFilterModes);
    });
  });
}

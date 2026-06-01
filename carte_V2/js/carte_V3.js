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
    13:{scale:0.50,rot:0,ox:-600,oy:-900},
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
  createCanvas(windowWidth, windowHeight);

  data = Object.values(data);
  data1 = Object.values(data1);

  data.forEach(d => {
    let s = getSurfaceValue(d);
    if (s > 0) {
      minSurface = min(minSurface, s);
      maxSurface = max(maxSurface, s);
    }
  });

  resetView();

  // 🎛️ filtres OFF au départ
  filters = {
    "Ville de Paris": false,
    "Tiers": false,
    "Réseaux": false
  };

  document.getElementById("paris")?.addEventListener("change", e => {
    filters["Ville de Paris"] = e.target.checked;
  });

  document.getElementById("tiers")?.addEventListener("change", e => {
    filters["Tiers"] = e.target.checked;
  });

  document.getElementById("reseaux")?.addEventListener("change", e => {
    filters["Réseaux"] = e.target.checked;
  });
}

function draw() {
  background(255);

  offsetX = constrain(offsetX, width - img.width * scaleFactor, 0);
  offsetY = constrain(offsetY, height - img.height * scaleFactor, 0);

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);

  let mx = (mouseX - offsetX) / scaleFactor;
  let my = (mouseY - offsetY) / scaleFactor;

  // ===== ARRONDISSEMENT ACTIF =====
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

  // ===== OVERLAY =====
  if (idArr !== null && overlays[idArr]) {
    let o = overlays[idArr];
    let arr = data1.find(a => Number(a.c_ar) === idArr);

    if (arr) {
      let c = getArrCenter(arr);

      push();
      translate(c.x + o.ox + globalFixX, c.y + o.oy + globalFixY);
      rotate(radians(o.rot));
      imageMode(CENTER);
      image(o.img, 0, 0, o.img.width * o.scale, o.img.height * o.scale);
      pop();
    }
  }

  // ===== POINTS =====
  let maxPoints = min(data.length, frameCount * 2);

  for (let i = 0; i < maxPoints; i++) {
    let d = data[i];
    if (!d.geo_point_2d) continue;

    let x = map(d.geo_point_2d.lon, lonMin, lonMax, 0, img.width);
    let y = map(d.geo_point_2d.lat, latMax, latMin, 0, img.height);

    let n = noise(i * 0.1, frameCount * 0.01);
    let ox = map(n, 0, 1, -3, 3);
    let oy = map(n, 0, 1, -3, 3);

    // ===== FILTRE ARRONDISSEMENT =====
    if (selectedArr !== null) {
      let arrId = getArrFromPoint(x, y);
      if (arrId !== selectedArr) continue;
    }

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

    // ===== CATEGORISATION ROBUSTE =====
    let r = (
      d.moa_principal ||
      d.responsable ||
      d.maitre_d_ouvrage ||
      d.maitre_ouvrage ||
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
    } 
    else if (
      r.includes("enedis") ||
      r.includes("grdf") ||
      r.includes("orange") ||
      r.includes("ratp") ||
      r.includes("sncf")
    ) {
      category = "Réseaux";
    }

    // ===== FILTRE CORRECT =====
    let isActive = filters[category];

    let imgToUse = isActive ? iconRed : icon;

    imageMode(CENTER);
    image(imgToUse, x + ox, y + oy, size, size);
  }

  pop();
}

function getCategory(d) {
  let r = (d.moa_principal || "").toLowerCase();

  // VILLE DE PARIS
  if (
    r.includes("ville de paris") ||
    r.includes("dpe") ||
    r.includes("dvd") ||
    r.includes("deve")
  ) {
    return "Ville de Paris";
  }

  // RÉSEAUX
  if (
    r.includes("enedis") ||
    r.includes("grdf") ||
    r.includes("orange") ||
    r.includes("ratp")
  ) {
    return "Réseaux";
  }

  // sinon
  return "Tiers";
}
// ===== INTERACTIONS =====

function mousePressed() {
  dragging = true;
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

function mouseDragged() {
  if (!dragging) return;
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
  if (keyCode === ESCAPE) {
    selectedArr = null;
    zoomMode = "global"; // 🔥 on rebloque le zoom
    resetView();
  }
}

function resetView() {
  scaleFactor = min(width / img.width, height / img.height);
  offsetX = (width - img.width * scaleFactor) / 2;
  offsetY = (height - img.height * scaleFactor) / 2;
}

function focus(arr) {
  let c = getArrCenter(arr);
  scaleFactor = 2;
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
function enterSite() {
  let intro = document.getElementById("intro");
  intro.style.transition = "opacity 0.8s ease";
  intro.style.opacity = 0;

  setTimeout(() => {
    intro.style.display = "none";
  }, 800);
}
function enterSite() {
  let intro = document.getElementById("intro");
  let backBtn = document.getElementById("backBtn");

  intro.style.transition = "opacity 0.8s ease";
  intro.style.opacity = 0;

  setTimeout(() => {
    intro.style.display = "none";
    backBtn.style.display = "block"; // 🔥 afficher retour
  }, 800);
}

function backToIntro() {
  let intro = document.getElementById("intro");
  let backBtn = document.getElementById("backBtn");

  intro.style.display = "flex";
  intro.style.opacity = 1;

  backBtn.style.display = "none";
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
let data, data1;
let img, icon;

// caméra
let scaleFactor = 1;
let offsetX = 0;
let offsetY = 0;

// drag
let dragging = false;
let lastMouseX, lastMouseY;

// état
let selectedArr = null;

// surface
let minSurface = Infinity;
let maxSurface = -Infinity;

// coords
const lonMin = 2.233143;
const lonMax = 2.452526;
const latMin = 48.803924;
const latMax = 48.909413;

// overlays
let overlays = {};

function preload() {
  data = loadJSON("chantiers-a-paris.json");
  data1 = loadJSON("arrondissements.json");
  img = loadImage("test3.png");
  icon = loadImage("Pictogramme.png");

  let config = {
    1:{scale:0.5,rot:-1,ox:10,oy:80},
    2:{scale:0.5,rot:0,ox:-125,oy:225},
    3:{scale:0.5,rot:-5,ox:-500,oy:150},
    4:{scale:0.5,rot:-2,ox:-450,oy:-200},
    5:{scale:0.5,rot:0,ox:-300,oy:-425},
    6:{scale:0.5,rot:0,ox:50,oy:-325},
    7:{scale:0.5,rot:-3,ox:525,oy:-75},
    8:{scale:0.5,rot:-2,ox:525,oy:375},
    9:{scale:0.5,rot:0,ox:-50,oy:550},
    10:{scale:0.5,rot:0,ox:-600,oy:550},
    11:{scale:0.5,rot:0,ox:-850,oy:0},
    12:{scale:0.5,rot:-1,ox:-1700,oy:-750},
    13:{scale:0.5,rot:0,ox:-550,oy:-1000},
    14:{scale:0.5,rot:-1,ox:175,oy:-1000},
    15:{scale:0.5,rot:-1,ox:900,oy:-550},
    16:{scale:0.5,rot:-1,ox:1200,oy:75},
    17:{scale:0.5,rot:-1,ox:550,oy:825},
    18:{scale:0.5,rot:-1,ox:-250,oy:925},
    19:{scale:0.5,rot:0,ox:200,oy:-200},
    20:{scale:0.5,rot:-1,ox:-1300,oy:100}
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
}

function draw() {
  background(220);

  let minX = Math.min(0, width - img.width * scaleFactor);
  let minY = Math.min(0, height - img.height * scaleFactor);

  offsetX = constrain(offsetX, minX, 0);
  offsetY = constrain(offsetY, minY, 0);

  // carte
  push();
  translate(offsetX + img.width * scaleFactor / 2,
            offsetY + img.height * scaleFactor / 2);
  scale(scaleFactor);
  imageMode(CENTER);
  image(img, 0, 0);
  pop();

  const mx = (mouseX - offsetX) / scaleFactor;
  const my = (mouseY - offsetY) / scaleFactor;

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);

  // arrondissement actif
  let activeArr = null;

  for (let arr of data1) {
    if (pointInArrondissement(mx, my, arr)) {
      activeArr = arr;
    }
  }

  let idArr = selectedArr !== null
    ? selectedArr
    : (activeArr ? Number(activeArr.c_ar) : null);

  // overlay stable
  if (idArr !== null && overlays[idArr]) {
    let o = overlays[idArr];
    let arr = data1.find(a => Number(a.c_ar) === idArr);

    if (arr) {
      let c = getArrCenter(arr);

      push();
      translate(c.x + o.ox, c.y + o.oy);
      rotate(radians(o.rot));
      imageMode(CENTER);
      image(o.img, 0, 0, o.img.width * o.scale, o.img.height * o.scale);
      pop();
    }
  }

  // pictos
  let maxPoints = min(data.length, frameCount * 2);

  for (let i = 0; i < maxPoints; i++) {
    let d = data[i];
    if (!d.geo_point_2d) continue;

    let x = map(d.geo_point_2d.lon, lonMin, lonMax, 0, img.width);
    let y = map(d.geo_point_2d.lat, latMax, latMin, 0, img.height);

    // noise (léger)
    let noiseAmount = map(scaleFactor, 1, 3, 5, 0);
    noiseAmount = constrain(noiseAmount, 0, 5);

    let ox = map(noise(i * 0.1, frameCount * 0.01), 0, 1, -noiseAmount, noiseAmount);
    let oy = map(noise(i * 0.1 + 1000, frameCount * 0.01), 0, 1, -noiseAmount, noiseAmount);

    // filtre arrondissement
    if (selectedArr !== null) {
      let arrId = getArrFromPoint(x, y);
      if (arrId !== selectedArr) continue;
    }

    // taille (CORRIGÉE)
    let size = 30;

    if (selectedArr !== null) {
      let s = getSurfaceValue(d);

      let norm = map(Math.log(s + 1),
                     Math.log(minSurface + 1),
                     Math.log(maxSurface + 1),
                     0, 1);

      norm = constrain(norm, 0, 1);

      norm = pow(norm, 1.3); // moins extrême

      size = map(norm, 0, 1, 10, 70);
      size = constrain(size, 8, 90);
    }

    imageMode(CENTER);
    image(icon, x + ox, y + oy, size, size);
  }

  pop();
}

// =====================
// INTERACTION
// =====================

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
  let zoom = 0.05;
  let old = scaleFactor;

  scaleFactor += (event.delta < 0 ? zoom : -zoom);
  scaleFactor = constrain(scaleFactor, 0.3, 10);

  offsetX = mouseX - (mouseX - offsetX) * (scaleFactor / old);
  offsetY = mouseY - (mouseY - offsetY) * (scaleFactor / old);

  return false;
}

// =====================
// DOUBLE CLICK
// =====================

function doubleClicked() {
  const x = (mouseX - offsetX) / scaleFactor;
  const y = (mouseY - offsetY) / scaleFactor;

  for (let arr of data1) {
    if (pointInArrondissement(x, y, arr)) {
      selectedArr = Number(arr.c_ar);
      focus(arr);
    }
  }
}

// =====================
// ESC RESET (FIX)
// =====================

function keyPressed() {
  if (keyCode === ESCAPE) {
    selectedArr = null;
    resetView();
  }
}

function resetView() {
  scaleFactor = min(width / img.width, height / img.height);
  offsetX = (width - img.width * scaleFactor) / 2;
  offsetY = (height - img.height * scaleFactor) / 2;
}

// =====================
// HELPERS
// =====================

function focus(arr) {
  let c = getArrCenter(arr);

  scaleFactor = 3;
  offsetX = width / 2 - c.x * scaleFactor;
  offsetY = height / 2 - c.y * scaleFactor;
}

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

  let sx = 0, sy = 0, n = 0;

  for (let p of coords) {
    sx += map(p[0], lonMin, lonMax, 0, img.width);
    sy += map(p[1], latMax, latMin, 0, img.height);
    n++;
  }

  return { x: sx / n, y: sy / n };
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
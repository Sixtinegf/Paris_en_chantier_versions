let data, data1;
let img;
let icon;

// Paramètres de la carte
let scaleFactor = 1;
let offsetX = 20;
let offsetY = 200;
let startX, startY;
let dragging = false;

// Paramètres pictogrammes
let fixedSize = 30;

// Paramètres overlays
let overlays = {};
let selectedArr = null;
let currentOverlayOffset = { x: 0, y: 0 };

// Limites longitude/latitude de Paris
const lonMin = 2.233143;
const lonMax = 2.452526;
const latMin = 48.803924;
const latMax = 48.909413;

function preload() {
  data = loadJSON("chantiers-a-paris.json");
  data1 = loadJSON("arrondissements.json");
  img = loadImage("test3.png");
  icon = loadImage("Pictogramme.png");

  let config = {
    1: { scale: 0.5, rot: -1, ox: 10, oy: 80 },
    2: { scale: 0.5, rot: 0, ox: -125, oy: 225 },
    3: { scale: 0.5, rot: -5, ox: -500, oy: 150 },
    4: { scale: 0.5, rot: -2, ox: -450, oy: -200 },
    5: { scale: 0.5, rot: 0, ox: -300, oy: -425 },
    6: { scale: 0.5, rot: 0, ox: 50, oy: -325 },
    7: { scale: 0.5, rot: -3, ox: 525, oy: -75 },
    8: { scale: 0.5, rot: -2, ox: 525, oy: 375 },
    9: { scale: 0.5, rot: 0, ox: -50, oy: 550 },
    10:{ scale: 0.5, rot: 0, ox: -600, oy: 550 },
    11:{ scale: 0.5, rot: 0, ox: -850, oy: 0 },
    12:{ scale: 0.5, rot: -1, ox: -1700, oy: -750 },
    13:{ scale: 0.5, rot: 0, ox: -550, oy: -1000 },
    14:{ scale: 0.5, rot: -1, ox: 175, oy: -1000 },
    15:{ scale: 0.5, rot: -1, ox: 900, oy: -550 },
    16:{ scale: 0.5, rot: -1, ox: 1200, oy: 75 },
    17:{ scale: 0.5, rot: -1, ox: 550, oy: 825 },
    18:{ scale: 0.5, rot: -1, ox: -250, oy: 925 },
    19:{ scale: 0.5, rot: 0, ox: 0, oy: -200 },
    20:{ scale: 0.5, rot: -1, ox: -1300, oy: 100 }

    
  };

  for (let id in config) {
    overlays[id] = {
      ...config[id],
      img: loadImage(id + (id == 1 ? "er" : "eme") + ".png")
    };
  }
}

// Déplacement manuel à appliquer au double-clic pour centrer l'arrondissement
const doubleClickOffsets = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: 0 },
  3: { x: -200, y: 50 },
  4: { x: -180, y: -120 },
  5: { x: -100, y: -250 },
  6: { x: 30, y: -200 },
  7: { x: 400, y: -50 },
  8: { x: 400, y: 250 },
  9: { x: -20, y: 400 },
  10:{ x: -400, y: 400 },
  11:{ x: -600, y: 0 },
  12:{ x: -1200, y: -500 },
  13:{ x: -400, y: -700 },
  14:{ x: 120, y: -700 },
  15:{ x: 600, y: -400 },
  16:{ x: 800, y: 50 },
  17:{ x: 400, y: 600 },
  18:{ x: -150, y: 700 },
  19:{ x: 0, y: -150 },
  20:{ x: -1000, y: 100 }
}


function setup() {
  createCanvas(windowWidth, windowHeight);
  data = Object.values(data);
  data1 = Object.values(data1);

  scaleFactor = min(width / img.width, height / img.height);
  offsetX = (width - img.width * scaleFactor) / 2;
  offsetY = (height - img.height * scaleFactor) / 2;
}

function draw() {
  if (selectedArr !== null) {
    drawArrondissementView(selectedArr);
    return; // bloque le reste
  }

  background(220);

  let minX = Math.min(0, width - img.width * scaleFactor);
  let minY = Math.min(0, height - img.height * scaleFactor);
  offsetX = constrain(offsetX, minX, 0);
  offsetY = constrain(offsetY, minY, 0);

  // 🔹 dessiner la carte
  push();
  translate(offsetX + img.width * scaleFactor / 2, offsetY + img.height * scaleFactor / 2);
  scale(scaleFactor);
  imageMode(CENTER);
  image(img, 0, 0);
  pop();

  const mapMouseX = (mouseX - offsetX) / scaleFactor;
  const mapMouseY = (mouseY - offsetY) / scaleFactor;

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);

  // 🔹 détecter arrondissement survolé
  let hoverArr = null;
  data1.forEach(arr => {
    if (pointInArrondissement(mapMouseX, mapMouseY, arr)) hoverArr = arr;
  });

  // 🔹 overlay arrondissement
 if (hoverArr) {
  let id = Number(hoverArr.c_ar);
  let o = overlays[id];
  if (o && o.img) {
    const visualCenter = getOverlayVisualCenter(o, hoverArr);

    push();
    // On applique le décalage uniquement si l'arrondissement est sélectionné
    const dx = (selectedArr === id) ? currentOverlayOffset.x : 0;
    const dy = (selectedArr === id) ? currentOverlayOffset.y : 0;

    translate(visualCenter.x + dx, visualCenter.y + dy);
    rotate(radians(o.rot));
    imageMode(CENTER);
    image(o.img, 0, 0, o.img.width * o.scale, o.img.height * o.scale);
    pop();
  }
}

  // 🔹 pictogrammes chantiers
  for (let i = 0; i < frameCount % data.length; i++) {
    if (data[i].geo_point_2d) {
      const lat = data[i].geo_point_2d.lat;
      const lon = data[i].geo_point_2d.lon;

      let x = map(lon, lonMin, lonMax, 0, img.width);
      let y = map(lat, latMax, latMin, 0, img.height);

      let nx = noise(i * 0.1, frameCount * 0.01);
      let ny = noise(i * 0.1 + 1000, frameCount * 0.01);
      let offsetXNoise = map(nx, 0, 1, -5, 5);
      let offsetYNoise = map(ny, 0, 1, -5, 5);

      imageMode(CENTER);
      image(icon, x + offsetXNoise, y + offsetYNoise, fixedSize, fixedSize);
    }
  }

  pop();
}

function keyPressed() {
  if (keyCode === ESCAPE) {
    selectedArr = null;
    currentOverlayOffset = { x: 0, y: 0 }; // réinitialiser le décalage
  }
}

// 🔹 Drag
function mousePressed() {
  dragging = true;
  startX = mouseX;
  startY = mouseY;
}
function mouseDragged() {
  if (dragging) {
    offsetX += mouseX - startX;
    offsetY += mouseY - startY;
    startX = mouseX;
    startY = mouseY;
  }
}
function mouseReleased() {
  dragging = false;
}

// 🔹 Double-clic pour zoom sur arrondissement
function doubleClicked() {
  const mapMouseX = (mouseX - offsetX) / scaleFactor;
  const mapMouseY = (mouseY - offsetY) / scaleFactor;

  let clickedArr = null;
  data1.forEach(arr => {
    if (pointInArrondissement(mapMouseX, mapMouseY, arr)) {
      clickedArr = Number(arr.c_ar);
    }
  });

  if (clickedArr !== null) {
    selectedArr = clickedArr;

    // Appliquer le décalage manuel pour cet arrondissement
    const manualOffset = doubleClickOffsets[selectedArr] || { x: 0, y: 0 };
    currentOverlayOffset.x = manualOffset.x;
    currentOverlayOffset.y = manualOffset.y;

    console.log(`Arrondissement ${selectedArr} centré avec offset manuel`);
  }
}

function getOverlayVisualCenter(overlay, arrData) {
  const polygons = getAllPolygonCoords(arrData);
  const center = getPolygonCenter(polygons);

  // Centre de l'image en pixels, en tenant compte de l'offset
  const visualX = center.x + overlay.ox;
  const visualY = center.y + overlay.oy;

  return { x: visualX, y: visualY };
}

// 🔹 Fonction pour calculer le centre visuel réel d'un overlay

// 🔹 Sortir du zoom
function keyPressed() {
  if (keyCode === ESCAPE) {
    selectedArr = null;
  }
}

// 🔹 Zoom souris
function mouseWheel(event) {
  let zoom = 0.05;
  let oldScale = scaleFactor;
  scaleFactor += (event.delta < 0 ? zoom : -zoom);
  scaleFactor = constrain(scaleFactor, 0.3, 10);

  offsetX = mouseX - (mouseX - offsetX) * (scaleFactor / oldScale);
  offsetY = mouseY - (mouseY - offsetY) * (scaleFactor / oldScale);

  return false;
}

// 🔹 Fonctions auxiliaires
function getAllPolygonCoords(arr) {
  let geom = arr.geom.geometry;
  if (geom.type === "Polygon") return [geom.coordinates[0]];
  else if (geom.type === "MultiPolygon") return geom.coordinates.map(p => p[0]);
  else return [];
}

function pointInArrondissement(x, y, arr) {
  let polygons = getAllPolygonCoords(arr);
  return polygons.some(coords => pointInPolygon(x, y, coords));
}

function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length-1; i < polygon.length; j = i++) {
    let xi = map(polygon[i][0], lonMin, lonMax, 0, img.width);
    let yi = map(polygon[i][1], latMax, latMin, 0, img.height);
    let xj = map(polygon[j][0], lonMin, lonMax, 0, img.width);
    let yj = map(polygon[j][1], latMax, latMin, 0, img.height);
    let intersect = ((yi > y) != (yj > y)) &&
                    (x < (xj-xi)*(y-yi)/(yj-yi)+xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function getPolygonCenter(polygons) {
  let sumX=0, sumY=0, count=0;
  polygons.forEach(coords => {
    coords.forEach(pt => {
      let x = map(pt[0], lonMin, lonMax, 0, img.width);
      let y = map(pt[1], latMax, latMin, 0, img.height);
      sumX += x;
      sumY += y;
      count++;
    });
  });
  return { x: sumX/count, y: sumY/count };
}

// 🔹 Vue centrée arrondissement
function drawArrondissementView(id) {
  background(240);
  let o = overlays[id];
  if (!o || !o.img) return;

  // Calcul du scale pour que l'image rentre bien à l'écran
  let scaleX = (width * 5) / o.img.width;  // 80% largeur écran
  let scaleY = (height * 5) / o.img.height; // 80% hauteur écran
  let targetScale = min(scaleX, scaleY) * o.scale;

  push();
  translate(width / 2, height / 2);  // centrer
  rotate(radians(o.rot));
  imageMode(CENTER);
  image(o.img, 0, 0, o.img.width * targetScale, o.img.height * targetScale);
  pop();

  // Texte
  fill(0);
  textAlign(CENTER);
  textSize(24);
  text("Arrondissement " + id, width / 2, 50);
  textSize(14);
  text("ESC pour revenir", width / 2, height - 20);
}
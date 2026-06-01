let data, data1;
let img;
let overlay19, overlay1;
let heatGraphics;

// Carte et drag
let scaleFactor = 1;
let offsetX = 20;
let offsetY = 200;
let startX, startY;
let dragging = false;

// Overlays paramètres
let overlayScale19 = 0.6;
let overlayScale1 = 0.8;
let rotation19 = 0;
let rotation1 = 7;
let overlay1OffsetX = 10;
let overlay1OffsetY = -5;
let extraOffsetX = -15;
let extraOffsetY = 10;

// Limites Paris
const lonMin = 2.233143;
const lonMax = 2.452526;
const latMin = 48.803924;
const latMax = 48.909413;

function preload() {
  data = loadJSON("chantiers-a-paris.json");
  data1 = loadJSON("arrondissements.json");
  img = loadImage("test3.png");
  overlay19 = loadImage("19eme.png");
  overlay1 = loadImage("1er.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  data = Object.values(data);
  data1 = Object.values(data1);

  scaleFactor = min(width / img.width, height / img.height);
  offsetX = (width - img.width * scaleFactor) / 2;
  offsetY = (height - img.height * scaleFactor) / 2;

  // couche pour heatmap
  heatGraphics = createGraphics(img.width || 2000, img.height || 2000);
}

function draw() {
  background(220);

  // limites pour drag
  let minX = Math.min(0, width - img.width * scaleFactor);
  let minY = Math.min(0, height - img.height * scaleFactor);
  offsetX = constrain(offsetX, minX, 0);
  offsetY = constrain(offsetY, minY, 0);

  // 🔹 carte
  push();
  translate(offsetX + extraOffsetX + (img.width * scaleFactor) / 2,
            offsetY + extraOffsetY + (img.height * scaleFactor) / 2);
  scale(scaleFactor);
  rotate(radians(rotation19));
  imageMode(CENTER);
  image(img, 0, 0);
  pop();

  // position souris dans le repère de la carte
  const mapMouseX = (mouseX - offsetX - extraOffsetX) / scaleFactor;
  const mapMouseY = (mouseY - offsetY - extraOffsetY) / scaleFactor;

  // 🔹 mettre à jour heatmap
  heatGraphics.clear();
  for (let i = 0; i < data.length; i++) {
    if (data[i].geo_point_2d) {
      const lat = data[i].geo_point_2d.lat;
      const lon = data[i].geo_point_2d.lon;

      let x = map(lon, lonMin, lonMax, 0, img.width);
      let y = map(lat, latMax, latMin, 0, img.height);

      // bruit organique
      let nx = noise(i * 0.1, frameCount * 0.01);
      let ny = noise(i * 0.1 + 1000, frameCount * 0.01);
      let px = x + map(nx, 0, 1, -5, 5);
      let py = y + map(ny, 0, 1, -5, 5);

      // rayon animé
      let radius = 40 + sin(frameCount * 0.05 + i) * 10;

      for (let r = radius; r > 0; r -= 4) {
        let intensity = map(r, 0, radius, 1, 0);
        let col = lerpColor(color(0, 0, 255), color(255, 0, 0), intensity);
        let alpha = map(r, 0, radius, 0, 25);

        heatGraphics.noStroke();
        heatGraphics.fill(red(col), green(col), blue(col), alpha);
        heatGraphics.ellipse(px, py, r);
      }
    }
  }

  // 🔹 afficher heatmap sur la carte
  push();
  translate(offsetX + extraOffsetX, offsetY + extraOffsetY);
  scale(scaleFactor);
  imageMode(CORNER);
  image(heatGraphics, 0, 0);
  pop();

  // 🔹 overlay arrondissement au hover
  let hoverArr = null;
  data1.forEach(arr => {
    if (pointInArrondissement(mapMouseX, mapMouseY, arr)) hoverArr = arr;
  });

  if (hoverArr) {
    let allCoords = getAllPolygonCoords(hoverArr);
    let center = getPolygonCenter(allCoords);

    imageMode(CENTER);

    if (Number(hoverArr.c_ar) === 19) {
      push();
      translate(center.x, center.y);
      rotate(radians(rotation19));
      image(overlay19, 0, 0, overlay19.width * overlayScale19, overlay19.height * overlayScale19);
      pop();
    }

    if (Number(hoverArr.c_ar) === 1) {
      push();
      translate(center.x + overlay1OffsetX, center.y + overlay1OffsetY);
      rotate(radians(rotation1));
      image(overlay1, 0, 0, overlay1.width * overlayScale1, overlay1.height * overlayScale1);
      pop();
    }
  }
}

// 🖱️ drag
function mousePressed() {
  dragging = true;
  startX = mouseX - offsetX;
  startY = mouseY - offsetY;
}
function mouseReleased() { dragging = false; }
function mouseDragged() {
  if (dragging) {
    offsetX = mouseX - startX;
    offsetY = mouseY - startY;
  }
}

// 🔹 zoom
function mouseWheel(event) {
  let zoom = 0.05;
  let oldScale = scaleFactor;
  scaleFactor += (event.delta < 0 ? zoom : -zoom);
  scaleFactor = constrain(scaleFactor, 0.3, 10);
  let mx = mouseX, my = mouseY;
  offsetX = mx - (mx - offsetX) * (scaleFactor / oldScale);
  offsetY = my - (my - offsetY) * (scaleFactor / oldScale);
  return false;
}

// 🔹 fonctions auxiliaires
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
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = map(polygon[i][0], lonMin, lonMax, 0, img.width);
    let yi = map(polygon[i][1], latMax, latMin, 0, img.height);
    let xj = map(polygon[j][0], lonMin, lonMax, 0, img.width);
    let yj = map(polygon[j][1], latMax, latMin, 0, img.height);
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function getPolygonCenter(polygons) {
  let sumX = 0, sumY = 0, count = 0;
  polygons.forEach(coords => coords.forEach(pt => {
    let x = map(pt[0], lonMin, lonMax, 0, img.width);
    let y = map(pt[1], latMax, latMin, 0, img.height);
    sumX += x; sumY += y; count++;
  }));
  return { x: sumX / count, y: sumY / count };
}
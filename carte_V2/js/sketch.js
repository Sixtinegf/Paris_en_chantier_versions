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
let overlay19 ;
let overlayScale19 = 0.5;
let rotation19 = 0;       // rotation du 19ème en degrés
let overlay19OffsetX = 0; // décalage horizontal 1er
let overlay19OffsetY = 500; // décalage vertical 1er

let overlay1;
let overlayScale1 = 0.5;
let rotation1 = -1;      // rotation du 1er en degrés
let overlay1OffsetX = 10; // décalage horizontal 1er
let overlay1OffsetY = 80; // décalage vertical 1er

let overlay2;
let overlayScale2 = 0.5;   // adapte selon la taille de ton PNG
let rotation2 = 0;          // rotation si nécessaire
let overlay2OffsetX = -125;    // décalage horizontal si besoin
let overlay2OffsetY = 225;    // décalage vertical si besoin

let overlay3;
let overlayScale3 = 0.5;   // ajuste selon ton PNG
let rotation3 = -5;          // rotation si nécessaire
let overlay3OffsetX = -500;    // décalage horizontal
let overlay3OffsetY = 150;   // décalage vertical pour aligner

let overlay4;
let overlayScale4 = 0.5;   // ajuste selon ton PNG
let rotation4 = -2;          // rotation si nécessaire
let overlay4OffsetX = -450;    // décalage horizontal
let overlay4OffsetY = -200;   // décalage vertical pour aligner

let overlay5;
let overlayScale5 = 0.5;   // ajuste selon ton PNG
let rotation5 = 0;          // rotation si nécessaire
let overlay5OffsetX = -300;    // décalage horizontal
let overlay5OffsetY = -425;   // décalage vertical pour aligner

let overlay6;
let overlayScale6 = 0.5;   // ajuste selon ton PNG
let rotation6 = 0;          // rotation si nécessaire
let overlay6OffsetX = 50;    // décalage horizontal
let overlay6OffsetY = -325;   // décalage vertical pour aligner

let overlay7;
let overlayScale7 = 0.5;   // ajuste selon ton PNG
let rotation7 = -3;          // rotation si nécessaire
let overlay7OffsetX = 525;    // décalage horizontal
let overlay7OffsetY = -75;   // décalage vertical pour aligner

let overlay8;
let overlayScale8 = 0.5;   // ajuste selon ton PNG
let rotation8 = -2;          // rotation si nécessaire
let overlay8OffsetX = 525;    // décalage horizontal
let overlay8OffsetY = 375;   // décalage vertical pour aligner

let overlay9;
let overlayScale9 = 0.5;   // ajuste selon ton PNG
let rotation9 = 0;          // rotation si nécessaire
let overlay9OffsetX = -50;    // décalage horizontal
let overlay9OffsetY = 550;   // décalage vertical pour aligner

let overlay10;
let overlayScale10 = 0.5;   // ajuste selon ton PNG
let rotation10 = 0;          // rotation si nécessaire
let overlay10OffsetX = -600;    // décalage horizontal
let overlay10OffsetY = 550;   // décalage vertical pour aligner

let overlay11;
let overlayScale11 = 0.5;   // ajuste selon ton PNG
let rotation11 = 0;          // rotation si nécessaire
let overlay11OffsetX = -850;    // décalage horizontal
let overlay11OffsetY = 0;   // décalage vertical pour aligner

let overlay12;
let overlayScale12 = 0.5;   // ajuste selon ton PNG
let rotation12 = -1;          // rotation si nécessaire
let overlay12OffsetX = -1700;    // décalage horizontal
let overlay12OffsetY = -750;   // décalage vertical pour aligner

let overlay13;
let overlayScale13 = 0.5;   // ajuste selon ton PNG
let rotation13 = 0;          // rotation si nécessaire
let overlay13OffsetX = -550;    // décalage horizontal
let overlay13OffsetY = -1000;   // décalage vertical pour aligner

let overlay14;
let overlayScale14 = 0.5 ;   // ajuste selon ton PNG
let rotation14 = -1;          // rotation si nécessaire
let overlay14OffsetX = 175;    // décalage horizontal
let overlay14OffsetY = -1000;   // décalage vertical pour aligner

let overlay15;
let overlayScale15 = 0.5;   // ajuste selon ton PNG
let rotation15 = -1;          // rotation si nécessaire
let overlay15OffsetX = 900;    // décalage horizontal
let overlay15OffsetY = -550;   // décalage vertical pour aligner

let overlay16;
let overlayScale16 = 0.5;   // ajuste selon ton PNG
let rotation16 = -1;          // rotation si nécessaire
let overlay16OffsetX = 1200;    // décalage horizontal
let overlay16OffsetY = 75;   // décalage vertical pour aligner

let overlay17;
let overlayScale17 = 0.5;   // ajuste selon ton PNG
let rotation17 = -1;          // rotation si nécessaire
let overlay17OffsetX = 550;    // décalage horizontal
let overlay17OffsetY = 825;   // décalage vertical pour aligner

let overlay18;
let overlayScale18 = 0.5;   // ajuste selon ton PNG
let rotation18 = -1;          // rotation si nécessaire
let overlay18OffsetX = -250;    // décalage horizontal
let overlay18OffsetY = 925;   // décalage vertical pour aligner

let overlay20;
let overlayScale20 = 0.5;   // ajuste selon ton PNG
let rotation20 = -1;          // rotation si nécessaire
let overlay20OffsetX = -1300;    // décalage horizontal
let overlay20OffsetY = 100;   // décalage vertical pour aligner




let extraOffsetX = -15;   // décalage général carteb  
let extraOffsetY = 10;    // décalage général carte

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
  overlay19 = loadImage("19eme.png");
  overlay1 = loadImage("1er.png");
  overlay2 = loadImage("2eme.png");
  overlay3 = loadImage("3eme.png");
  overlay4 = loadImage("4eme.png");
  overlay5 = loadImage("5eme.png");
  overlay6 = loadImage("6eme.png");
  overlay7 = loadImage("7eme.png");
  overlay8 = loadImage("8eme.png");
  overlay9 = loadImage("9eme.png");
  overlay10 = loadImage("10eme.png");
  overlay11 = loadImage("11eme.png");
  overlay12 = loadImage("12eme.png");
  overlay13 = loadImage("13eme.png");
  overlay14 = loadImage("14eme.png");
  overlay15 = loadImage("15eme.png");
  overlay16 = loadImage("16eme.png");
  overlay17 = loadImage("17eme.png");
  overlay18 = loadImage("18eme.png");
   overlay20 = loadImage("20eme.png");
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
  background(220);

  let minX = Math.min(0, width - img.width * scaleFactor);
  let minY = Math.min(0, height - img.height * scaleFactor);
  offsetX = constrain(offsetX, minX, 0);
  offsetY = constrain(offsetY, minY, 0);

  // 🔹 dessiner la carte avec rotation et décalage
  push();
  translate(offsetX + extraOffsetX + img.width * scaleFactor / 2, 
            offsetY + extraOffsetY + img.height * scaleFactor / 2);
  scale(scaleFactor);
  rotate(radians(rotation19)); // rotation générale pour alignement carte
  imageMode(CENTER);
  image(img, 0, 0);
  pop();

  const mapMouseX = (mouseX - offsetX - extraOffsetX) / scaleFactor;
  const mapMouseY = (mouseY - offsetY - extraOffsetY) / scaleFactor;

  push();
  translate(offsetX + extraOffsetX, offsetY + extraOffsetY);
  scale(scaleFactor);

  // 🔹 détecter arrondissement survolé
  let hoverArr = null;
  data1.forEach(arr => {
    if (pointInArrondissement(mapMouseX, mapMouseY, arr)) hoverArr = arr;
  });

  // 🔹 overlay arrondissement
  if (hoverArr) {
    let allCoords = getAllPolygonCoords(hoverArr);
    let center = getPolygonCenter(allCoords);

    imageMode(CENTER);

    // 🔹 19ème
    if (Number(hoverArr.c_ar) === 19) {
      push();
      translate(center.x, center.y);
      rotate(radians(rotation19));
      let w = overlay19.width * overlayScale19;
      let h = overlay19.height * overlayScale19;
      image(overlay19, 0, 0, w, h);
      pop();
    }

    // 🔹 1er
    if (Number(hoverArr.c_ar) === 1) {
      push();
      translate(center.x + overlay1OffsetX, center.y + overlay1OffsetY);
      rotate(radians(rotation1));
      let w = overlay1.width * overlayScale1;
      let h = overlay1.height * overlayScale1;
      image(overlay1, 0, 0, w, h);
      pop();
    }

    // 🔹 2ème arrondissement
if (Number(hoverArr.c_ar) === 2) {
  push();
  translate(center.x + overlay2OffsetX, center.y + overlay2OffsetY);
  rotate(radians(rotation2));
  let w = overlay2.width * overlayScale2;
  let h = overlay2.height * overlayScale2;
  image(overlay2, 0, 0, w, h);
  pop();
}

// 🔹 3ème arrondissement
if (Number(hoverArr.c_ar) === 3) {
  push();
  translate(center.x + overlay3OffsetX, center.y + overlay3OffsetY);
  rotate(radians(rotation3));
  let w = overlay3.width * overlayScale3;
  let h = overlay3.height * overlayScale3;
  image(overlay3, 0, 0, w, h);
  pop();
}

// 🔹 4ème arrondissement
if (Number(hoverArr.c_ar) === 4) {
  push();
  translate(center.x + overlay4OffsetX, center.y + overlay4OffsetY);
  rotate(radians(rotation4));
  let w = overlay4.width * overlayScale4;
  let h = overlay4.height * overlayScale4;
  image(overlay4, 0, 0, w, h);
  pop();
}

if (Number(hoverArr.c_ar) === 5) {
  push();
  translate(center.x + overlay5OffsetX, center.y + overlay5OffsetY);
  rotate(radians(rotation5));
  let w = overlay5.width * overlayScale5;
  let h = overlay5.height * overlayScale5;
  image(overlay5, 0, 0, w, h);
  pop();
}

if (Number(hoverArr.c_ar) === 6) {
  push();
  translate(center.x + overlay6OffsetX, center.y + overlay6OffsetY);
  rotate(radians(rotation6));
  let w = overlay6.width * overlayScale6;
  let h = overlay6.height * overlayScale6;
  image(overlay6, 0, 0, w, h);
  pop();
}

if (Number(hoverArr.c_ar) === 7) {
  push();
  translate(center.x + overlay7OffsetX, center.y + overlay7OffsetY);
  rotate(radians(rotation7));
  let w = overlay7.width * overlayScale7;
  let h = overlay7.height * overlayScale7;
  image(overlay7, 0, 0, w, h);
  pop();
}

if (Number(hoverArr.c_ar) === 8) {
  push();
  translate(center.x + overlay8OffsetX, center.y + overlay8OffsetY);
  rotate(radians(rotation8));
  let w = overlay8.width * overlayScale8;
  let h = overlay8.height * overlayScale8;
  image(overlay8, 0, 0, w, h);
  pop();
}

if (Number(hoverArr.c_ar) === 9) {
  push();
  translate(center.x + overlay9OffsetX, center.y + overlay9OffsetY);
  rotate(radians(rotation9));
  let w = overlay9.width * overlayScale9;
  let h = overlay9.height * overlayScale9;
  image(overlay9, 0, 0, w, h);
  pop();
}

if (Number(hoverArr.c_ar) === 10) {
  push();
  translate(center.x + overlay10OffsetX, center.y + overlay10OffsetY);
  rotate(radians(rotation10));
  let w = overlay10.width * overlayScale10;
  let h = overlay10.height * overlayScale10;
  image(overlay10, 0, 0, w, h);
  pop();
}

if (Number(hoverArr.c_ar) === 11) {
  push();
  translate(center.x + overlay11OffsetX, center.y + overlay11OffsetY);
  rotate(radians(rotation11));
  let w = overlay11.width * overlayScale11;
  let h = overlay11.height * overlayScale11;
  image(overlay11, 0, 0, w, h);
  pop();
}

if (Number(hoverArr.c_ar) === 12) {
  push();
  translate(center.x + overlay12OffsetX, center.y + overlay12OffsetY);
  rotate(radians(rotation12));
  let w = overlay12.width * overlayScale12;
  let h = overlay12.height * overlayScale12;
  image(overlay12, 0, 0, w, h);
  pop();
}

if (Number(hoverArr.c_ar) === 13) {
  push();
  translate(center.x + overlay13OffsetX, center.y + overlay13OffsetY);
  rotate(radians(rotation13));
  let w = overlay13.width * overlayScale13;
  let h = overlay13.height * overlayScale13;
  image(overlay13, 0, 0, w, h);
  pop();
}

if (Number(hoverArr.c_ar) === 14) {
  push();
  translate(center.x + overlay14OffsetX, center.y + overlay14OffsetY);
  rotate(radians(rotation14));
  let w = overlay14.width * overlayScale14;
  let h = overlay14.height * overlayScale14;
  image(overlay14, 0, 0, w, h);
  pop();
}

if (Number(hoverArr.c_ar) === 15) {
  push();
  translate(center.x + overlay15OffsetX, center.y + overlay15OffsetY);
  rotate(radians(rotation15));
  let w = overlay15.width * overlayScale15;
  let h = overlay15.height * overlayScale15;
  image(overlay15, 0, 0, w, h);
  pop();
}

if (Number(hoverArr.c_ar) === 16) {
  push();
  translate(center.x + overlay16OffsetX, center.y + overlay16OffsetY);
  rotate(radians(rotation16));
  let w = overlay16.width * overlayScale16;
  let h = overlay16.height * overlayScale16;
  image(overlay16, 0, 0, w, h);
  pop();
}

if (Number(hoverArr.c_ar) === 17) {
  push();
  translate(center.x + overlay17OffsetX, center.y + overlay17OffsetY);
  rotate(radians(rotation17));
  let w = overlay17.width * overlayScale17;
  let h = overlay17.height * overlayScale17;
  image(overlay17, 0, 0, w, h);
  pop();
}

if (Number(hoverArr.c_ar) === 18) {
  push();
  translate(center.x + overlay18OffsetX, center.y + overlay18OffsetY);
  rotate(radians(rotation18));
  let w = overlay18.width * overlayScale18;
  let h = overlay18.height * overlayScale18;
  image(overlay18, 0, 0, w, h);
  pop();
}

if (Number(hoverArr.c_ar) === 20) {
  push();
  translate(center.x + overlay20OffsetX, center.y + overlay20OffsetY);
  rotate(radians(rotation20));
  let w = overlay20.width * overlayScale20;
  let h = overlay20.height * overlayScale20;
  image(overlay20, 0, 0, w, h);
  pop();
}
 

  }

  // 🔹 pictogrammes chantiers avec noise
  let max = frameCount % data.length;
  for (let i = 0; i < max; i++) {
    if (data[i].geo_point_2d) {
      const lat = data[i].geo_point_2d.lat;
      const lon = data[i].geo_point_2d.lon;

      let x = map(lon, lonMin, lonMax, 0, img.width);
      let y = map(lat, latMax, latMin, 0, img.height);

      // léger bruit organique
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

// 🔹 drag
function mousePressed() {
  dragging = true;
  startX = mouseX - offsetX;
  startY = mouseY - offsetY;
}

function mouseReleased() {
  dragging = false;
}

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

  let mx = mouseX;
  let my = mouseY;

  offsetX = mx - (mx - offsetX) * (scaleFactor / oldScale);
  offsetY = my - (my - offsetY) * (scaleFactor / oldScale);

  return false;
}

// 🔹 fonctions auxiliaires pour MultiPolygons
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
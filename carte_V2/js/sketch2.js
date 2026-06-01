let data;
let img;
let icon;       // moyenne
let iconSmall;  // petite
let iconLarge;  // grande

let scaleFactor = 1;
let offsetX = 0;
let offsetY = 0;

let startX, startY;
let dragging = false;

// Taille fixe pour tous les pictos (celle du petit)
let fixedSize = 40;

function preload() {
  data = loadJSON("chantiers-a-paris.json");
  img = loadImage("test1.png");
  icon = loadImage("Pictogramme.png");       // moyenne
  iconSmall = loadImage("Picto3.png");      // petite
  iconLarge = loadImage("Picto2.png");      // grande
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  data = Object.values(data);

  // 🔹 calcul du zoom pour que toute l’image rentre
  let scaleX = width / img.width;
  let scaleY = height / img.height;
  scaleFactor = min(scaleX, scaleY);

  // 🔹 centrage de l’image
  offsetX = (width - img.width * scaleFactor)/2 ;
  offsetY = (height - img.height * scaleFactor) / 2;
}

function draw() {
  background(220);

  // 🔒 contraintes AVANT le dessin
  let minX = width - img.width * scaleFactor;
  let minY = height - img.height * scaleFactor;

  offsetX = constrain(offsetX, minX, 0);
  offsetY = constrain(offsetY, minY, 0);

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);

  // image de fond
  image(img, 0, 0);

  // points
  for (let i = 0; i < data.length; i++) {
    if (data[i].geo_point_2d) {
      let lat = data[i].geo_point_2d.lat;
      let lon = data[i].geo_point_2d.lon;

      let x = map(lon, 2.233143, 2.452526, 0, img.width);
      let y = map(lat, 48.909413, 48.803924, 0, img.height);

      imageMode(CENTER);

      // Tous les pictos ont la même taille (celle du petit)
      if (data[i].surface < 100) {
        image(iconSmall, x, y, fixedSize, fixedSize);
      } else if (data[i].surface > 300) {
        image(iconLarge, x, y, fixedSize, fixedSize);
      } else {
        image(icon, x, y, fixedSize, fixedSize);
      }
    }
  }

  pop();
}

// 🖱️ drag
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

// 🔍 zoom
function mouseWheel(event) {
  let zoom = 0.05;

  if (event.delta > 0) {
    scaleFactor -= zoom;
  } else {
    scaleFactor += zoom;
  }

  scaleFactor = constrain(scaleFactor, 0.4, 5);

  return false;
}
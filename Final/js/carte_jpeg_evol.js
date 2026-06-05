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

let gifFrames15 = [];
let currentGifFrame15 = 0;
let gifFinished15 = false;
let overlay15Evol;
let gifOverlays = {

  7: {
    scale: 0.54,
    rot: 0,
    ox: 0,
    oy: 0,
    opacity: 255
  },

  12: {
  scale: 0.8,
  rot: -1,
  ox: -450,
  oy: -100,
  opacity: 255
},

14: {
  scale: 0.8,
  rot: -1,
  ox: 70,
  oy: -20,
  opacity: 255
},
  15: {
    scale: 1.6,
    rot: -1,
    ox: 60,
    oy: 25,
    opacity: 255
  },

   16: {
    scale: 1.2,
    rot: -1,
    ox: 350,
    oy: 0,
    opacity: 255
  }

};
let evol15Offset = { ox: 50, oy: -100 };


let evol7Offset = {
  ox: 0,
  oy: -50,
  scale: 2
};

let evol14Offset = {
  ox: -15,
  oy: -150,
  scale: 1
};

let evol16Offset = {
  ox: 0,
  oy: 0,
  scale: 2
};
// =========================
// 7e arrondissement
// =========================

let gifFrames7 = [];
let currentGifFrame7 = 0;
let gifFinished7 = false;

let overlay7Evol;
let overlayHideFrame15 = 200;
let overlayHideFrame7 = 250;

// =========================
// 14e arrondissement
// =========================

let gifFrames14 = [];
let currentGifFrame14 = 0;
let gifFinished14 = false;

let overlay14Evol;

// =========================
// 12e arrondissement
// =========================

let gifFrames12 = [];
let currentGifFrame12 = 0;
let gifFinished12 = false;
let overlayHideFrame12 = 170;

let overlay12Evol;

let gifFrames16 = [];
let currentGifFrame16 = 0;
let gifFinished16 = false;
let overlayHideFrame16 = 170;

let overlay16Evol;

let evol12Offset = {
  ox: 0,
  oy: -50,
  scale: 2
};

function preload() {
  data = loadJSON("chantiers-a-paris.json");
  data1 = loadJSON("arrondissements.json");

  img = loadImage("test3.png");
  icon = loadImage("Pictogramme.png");
  iconRed = loadImage("Picto2.png");
 
for (let i = 0; i < 359; i++) {

  let num = nf(i, 5);

 gifFrames15.push(
    loadImage("gif15/15eme_" + num + ".png")
  );
}

for (let i = 0; i < 293; i++) {

  let num = nf(i, 5);

 gifFrames16.push(
   loadImage("gif16/16_gif_" + num + ".png")
);
}

for (let i = 0; i < 359; i++) {

  let num = nf(i, 5);

  gifFrames7.push(
    loadImage("gif7/chantier_7eme_" + num + ".png")
  );
}

//for (let i = 0; i < 127; i++) {

  //let num = nf(i, 5);

 // gifFrames12.push(
   // loadImage("gif12/12gif/12gif_" + num + ".png")
 // );
//}

//for (let i = 0; i < 257; i++) {

  //let num = nf(i, 5);

  //gifFrames14.push(
    //loadImage("gif14/14eme_gif_" + num + ".png")
 // );
//}
  overlay15Evol = loadImage("arrondi_evo/15eme_evol.png");
  overlay16Evol = loadImage("arrondi_evo/16eme_evol.png");
  overlay7Evol = loadImage("arrondi_evo/7eme_evol.png");
  overlay12Evol = loadImage("arrondi_evo/12eme_evol.png");
  overlay14Evol = loadImage("arrondi_evo/14eme_evol.png");

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
if (idArr !== null && overlays[idArr]) {

  let o = overlays[idArr];

// remplacement permanent après animation
let isEvol15 = (idArr === 15 && currentGifFrame15 >= 240);
let isEvol7 = (
  idArr === 7 &&
  currentGifFrame7 >= 200
);

let isEvol12 = (
  idArr === 12 &&
  currentGifFrame12 >= 100
);

let isEvol14 = (
  idArr === 14 &&
  currentGifFrame14 >= 180
);

let isEvol16 = (
  idArr === 16 &&
  currentGifFrame16 >= 180
);


if (isEvol15) {

  o = {
    ...o,
    img: overlay15Evol,
    ox: o.ox + evol15Offset.ox,
    oy: o.oy + evol15Offset.oy
  };

} else if (isEvol7) {
  o = {
    ...o,
    img: overlay7Evol,
    ox: o.ox + evol7Offset.ox,
    oy: o.oy + evol7Offset.oy,
    scale: o.scale * evol7Offset.scale
  };

  

  } else if (isEvol14) {

  o = {
    ...o,
    img: overlay14Evol,
    ox: o.ox + evol14Offset.ox,
    oy: o.oy + evol14Offset.oy,
    scale: o.scale * evol14Offset.scale
  };

}

else if (isEvol12) {

  o = {
    ...o,
    img: overlay12Evol,
    ox: o.ox + evol12Offset.ox,
    oy: o.oy + evol12Offset.oy,
    scale: o.scale * evol12Offset.scale
  };

}

else if (isEvol16) {

  o = {
    ...o,
    img: overlay16Evol,
    ox: o.ox + evol16Offset.ox,
    oy: o.oy + evol16Offset.oy,
    scale: o.scale * evol16Offset.scale
  };

}


  let arr = data1.find(a => Number(a.c_ar) === idArr);

  if (arr) {

    let c = getArrCenter(arr);

    // =========================
    // FADE OUT SI GIF APPARAÎT
    // =========================

    let overlayAlpha = 255;

    // uniquement pour le 15e
    if (
  (idArr === 15 && selectedArr === 15) ||
  (idArr === 7 && selectedArr === 7)
  || (idArr === 12 && selectedArr === 12)
  || (idArr === 14 && selectedArr === 14)
  || (idArr === 16 && selectedArr === 16)
) {

      let revealZoom = 1;
      let fullZoom = 2;

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
// disparition anticipée des overlays

let hideOverlay = false;

// =========================
// cacher UNIQUEMENT les anciens overlays
// =========================

// 15e
if (
  idArr === 15 &&
  selectedArr === 15 &&
  currentGifFrame15 >= overlayHideFrame15 &&
  currentGifFrame15 < 280 // avant apparition du evol
) {
  hideOverlay = true;
}

if (
  idArr === 12 &&
  selectedArr === 12 &&
  currentGifFrame12 >= overlayHideFrame12 &&
  currentGifFrame12 < 160
) {
  hideOverlay = true;
}

// 7e
if (
  idArr === 7 &&
  selectedArr === 7 &&
  currentGifFrame7 >= overlayHideFrame7 &&
  currentGifFrame7 < 250 // avant apparition du evol
) {
  hideOverlay = true;
}

if (
  idArr === 16 &&
  selectedArr === 16 &&
  currentGifFrame16 >= overlayHideFrame16 &&
  currentGifFrame16 < 250 // avant apparition du evol
) {
  hideOverlay = true;
}



// =========================
// DRAW OVERLAY
// =========================

if (!hideOverlay) {

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
    }
  }
}


// =========================
// SEQUENCE 15e
// =========================

if (selectedArr === 15 && !gifFinished15) {

  let arr = data1.find(a => Number(a.c_ar) === 15);

  if (arr && gifFrames15.length > 0) {

    let c = getArrCenter(arr);
    let g = gifOverlays[15];

    let revealZoom = 1;
    let fullZoom = 2;

    let alpha = map(
      scaleFactor,
      revealZoom,
      fullZoom,
      0,
      255
    );

    alpha = constrain(alpha, 0, 255);

    if (alpha > 1) {

      push();

      translate(
        c.x + g.ox + globalFixX,
        c.y + g.oy + globalFixY
      );

      rotate(radians(g.rot));

      imageMode(CENTER);

      tint(255, alpha);

      let frameImg = gifFrames15[currentGifFrame15];

      image(
        frameImg,
        0,
        0,
        frameImg.width * g.scale,
        frameImg.height * g.scale
      );

      noTint();

      pop();

  // vitesse animation
if (frameCount % 2 === 0) {

  // avance seulement si pas à la dernière frame
  if (currentGifFrame15 < gifFrames15.length - 1) {

    currentGifFrame15++;

  } else {

    // animation terminée
    gifFinished15 = true;
  }
}
    }
  }
}


// =========================
// SEQUENCE 16e
// =========================

if (selectedArr === 16 && !gifFinished16) {

  let arr = data1.find(a => Number(a.c_ar) === 16);

  if (arr && gifFrames16.length > 0) {

    let c = getArrCenter(arr);
    let g = gifOverlays[16];

    let revealZoom = 1;
    let fullZoom = 2;

    let alpha = map(
      scaleFactor,
      revealZoom,
      fullZoom,
      0,
      255
    );

    alpha = constrain(alpha, 0, 255);

    if (alpha > 1) {

      push();

      translate(
        c.x + g.ox + globalFixX,
        c.y + g.oy + globalFixY
      );

      rotate(radians(g.rot));

      imageMode(CENTER);

      tint(255, alpha);

      let frameImg = gifFrames16[currentGifFrame16];

      image(
        frameImg,
        0,
        0,
        frameImg.width * g.scale,
        frameImg.height * g.scale
      );

      noTint();

      pop();

  // vitesse animation
if (frameCount % 1 === 0) {

  // avance seulement si pas à la dernière frame
  if (currentGifFrame16 < gifFrames16.length - 1) {

    currentGifFrame16++;

  } else {

    // animation terminée
    gifFinished16 = true;
  }
}
    }
  }
}

// =========================
// SEQUENCE 7e
// =========================

if (selectedArr === 7 && !gifFinished7) {

  let arr = data1.find(a => Number(a.c_ar) === 7);

  if (arr && gifFrames7.length > 0) {

    let c = getArrCenter(arr);
    let g = gifOverlays[7];

    let revealZoom = 1;
    let fullZoom = 2;

    let alpha = map(
      scaleFactor,
      revealZoom,
      fullZoom,
      0,
      255
    );

    alpha = constrain(alpha, 0, 255);

    if (alpha > 1) {

      push();

      translate(
        c.x + g.ox + globalFixX,
        c.y + g.oy + globalFixY
      );

      rotate(radians(g.rot));

      imageMode(CENTER);

      tint(255, alpha);

      let frameImg = gifFrames7[currentGifFrame7];

      image(
        frameImg,
        0,
        0,
        frameImg.width * g.scale,
        frameImg.height * g.scale
      );

      noTint();

      pop();

      // vitesse animation
      if (frameCount % 1 === 0) {

        if (currentGifFrame7 < gifFrames7.length - 1) {

          currentGifFrame7++;

        } else {

          gifFinished7 = true;
        }
      }
    }
  }
}

// =========================
// SEQUENCE 14e
// =========================

if (selectedArr === 14 && !gifFinished14) {

  let arr = data1.find(a => Number(a.c_ar) === 14);

  if (arr && gifFrames14.length > 0) {

    let c = getArrCenter(arr);
    let g = gifOverlays[14];

    let revealZoom = 1;
    let fullZoom = 2;

    let alpha = map(
      scaleFactor,
      revealZoom,
      fullZoom,
      0,
      255
    );

    alpha = constrain(alpha, 0, 255);

    if (alpha > 1) {

      push();

      translate(
        c.x + g.ox + globalFixX,
        c.y + g.oy + globalFixY
      );

      rotate(radians(g.rot));

      imageMode(CENTER);

      tint(255, alpha);

      let frameImg = gifFrames14[currentGifFrame14];

      image(
        frameImg,
        0,
        0,
        frameImg.width * g.scale,
        frameImg.height * g.scale
      );

      noTint();

      pop();

      // vitesse animation
      if (frameCount % 1 === 0) {

        if (currentGifFrame14 < gifFrames14.length - 1) {

          currentGifFrame14++;

        } else {

          gifFinished14 = true;
        }
      }
    }
  }
}

if (selectedArr === 12 && !gifFinished12) {

  let arr = data1.find(a => Number(a.c_ar) === 12);

  if (arr && gifFrames12.length > 0) {

    let c = getArrCenter(arr);
    let g = gifOverlays[12];

    let revealZoom = 0.80;
    let fullZoom = 1.60;

    let alpha = map(
      scaleFactor,
      revealZoom,
      fullZoom,
      0,
      255
    );

    alpha = constrain(alpha, 0, 255);

    if (alpha > 1) {

      push();

      translate(
        c.x + g.ox + globalFixX,
        c.y + g.oy + globalFixY
      );

      rotate(radians(g.rot));

      imageMode(CENTER);

      tint(255, alpha);

      let frameImg = gifFrames12[currentGifFrame12];

      image(
        frameImg,
        0,
        0,
        frameImg.width * g.scale,
        frameImg.height * g.scale
      );

      noTint();

      pop();

      // vitesse animation
      if (frameCount % 1 === 0) {

        if (currentGifFrame12 < gifFrames12.length - 1) {

          currentGifFrame12++;

        } else {

          gifFinished12 = true;
        }
      }
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

// cacher les pictos pendant les animations

let hidePoints = false;

// =========================
// 15e
// =========================

if (selectedArr === 15 && !gifFinished15) {

  let revealZoom = 1;
  let fullZoom = 2.5;

  let alpha15 = map(
    scaleFactor,
    revealZoom,
    fullZoom,
    0,
    255
  );

  alpha15 = constrain(alpha15, 0, 255);

  // cache seulement quand le gif est totalement visible
  if (alpha15 >= 120) {
    hidePoints = true;
  }
}

// =========================
// 16e
// =========================

if (selectedArr === 16 && !gifFinished16) {

  let revealZoom = 1;
  let fullZoom = 2.5;

  let alpha16 = map(
    scaleFactor,
    revealZoom,
    fullZoom,
    0,
    255
  );

  alpha16 = constrain(alpha16, 0, 255);

  // cache seulement quand le gif est totalement visible
  if (alpha16 >= 120) {
    hidePoints = true;
  }
}

// =========================
// 7e
// =========================

if (selectedArr === 7 && !gifFinished7) {

  let revealZoom = 1;
  let fullZoom = 2.5;

  let alpha7 = map(
    scaleFactor,
    revealZoom,
    fullZoom,
    0,
    255
  );

  alpha7 = constrain(alpha7, 0, 255);

  if (alpha7 >= 120) {
    hidePoints = true;
  }
}

if (selectedArr === 14 && !gifFinished14) {

  let revealZoom = 1;
  let fullZoom = 2.5;

  let alpha14 = map(
    scaleFactor,
    revealZoom,
    fullZoom,
    0,
    255
  );

  alpha14 = constrain(alpha14, 0, 255);

  if (alpha14 >= 120) {
    hidePoints = true;
  }
}

if (selectedArr === 12 && !gifFinished12) {

  let revealZoom = 1;
  let fullZoom = 2.5;

  let alpha12 = map(
    scaleFactor,
    revealZoom,
    fullZoom,
    0,
    255
  );

  alpha12 = constrain(alpha12, 0, 255);

  if (alpha12 >= 120) {
    hidePoints = true;
  }
}
   // =========================
// DRAW POINT
// =========================

if (!hidePoints) {

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
  scaleFactor = 0.7;
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

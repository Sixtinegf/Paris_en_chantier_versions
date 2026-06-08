const TOTAL_PAGES = 42;
const MAX = 24;

let GLOBAL_IMAGE_POOL = [];
let USED_IMAGES = [];

console.log("fanzine.js chargé");


function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function createFilteredPage(src) {

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;

  await new Promise(resolve => img.onload = resolve);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  const activeFilters = getActiveFilters();

  const PRIORITY = {
    fracture: 1,
    imageBlend: 2,
    imageOrganicMix: 3,
    constructionRGB: 4,

    textureConcrete: 10,
   
  };

  const FILTERS = {
    fracture,
    constructionRGB,
    imageBlend,
    imageOrganicMix,
    textureConcrete,

  };

  activeFilters.sort((a, b) =>
    (PRIORITY[a.type] || 999) - (PRIORITY[b.type] || 999)
  );

  // 1) effets principaux
  for (const filter of activeFilters) {

    if (filter.type.startsWith("texture")) continue;

    const fn = FILTERS[filter.type];

    if (!fn) {
      console.warn("⚠️ filtre inconnu :", filter.type);
      continue;
    }

    await fn(ctx, canvas, filter);
  }

  // 2) TEXTURES EN FORCÉ + ULTRA VISIBILITÉ
  for (const filter of activeFilters) {

    if (!filter.type.startsWith("texture")) continue;

    const fn = FILTERS[filter.type];

    if (!fn) continue;

    // BOOST GLOBAL (IMPORTANT)
    const boosted = {
      ...filter,
      intensity: Math.min(2.5, (filter.intensity ?? 1) * 2.2)
    };

    fn(ctx, canvas, boosted);
  }

  return canvas;
}

async function generateFanzine() {

  const container = document.getElementById("container");
  container.innerHTML = "";

  let pages = [];

  // =========================
  // PAGES LOCALES
  // =========================

  for (let i = 1; i <= TOTAL_PAGES; i++) {
    pages.push(`Pages/page${i}.png`);
  }

  // =========================
  // IMAGES SUPABASE
  // =========================

const { data } = await db
  .from("images")
  .select("url");

if (data) {
  pages.push(...data.map(img => img.url));
}

GLOBAL_IMAGE_POOL = shuffle(data ?? []);



  // IMPORTANT :
  // on limite à 24 pages AVANT génération

  pages = shuffle(pages).slice(0, MAX);
  USED_IMAGES = [...pages];

  // =========================
  // DOUBLE PAGES
  // =========================

  for (let i = 0; i < pages.length; i += 2) {

    const spread = document.createElement("div");
    spread.className = "spread";

    // gauche
    const left = await createFilteredPage(pages[i]);

    // droite
    let right;

    if (pages[i + 1]) {
      right = await createFilteredPage(pages[i + 1]);
    } else {
      right = document.createElement("div");
      right.style.visibility = "hidden";
    }

    spread.appendChild(left);
    spread.appendChild(right);

    container.appendChild(spread);
  }
}

async function exportPDF() {

  await waitForImages();

  const spreads = document.querySelectorAll(".spread");

  const pdf = new jspdf.jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  for (let i = 0; i < spreads.length; i++) {

    const spread = spreads[i];

    const canvas = await html2canvas(spread, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/jpeg", 1);

    if (i > 0) {
      pdf.addPage();
    }

    pdf.addImage(
      imgData,
      "JPEG",
      0,
      0,
      297,
      210
    );
  }

  pdf.save("fanzine.pdf");
}

async function waitForImages() {

  const images = document.querySelectorAll("#container img");

  await Promise.all(

    [...images].map(img => {

      if (img.complete) return Promise.resolve();

      return new Promise(resolve => {

        img.onload = resolve;
        img.onerror = resolve;

      });
    })
  );
}


const supabaseUrl = "https://tawfytfbhtmdoscdgpbu.supabase.co";
const supabaseKey = "sb_publishable_BlsdkUhS_7FKGN5uggt2uw_fccuiFDj";

const db = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);


function constructionRGB(ctx, canvas, params) {

 const intensity = mapIntensity(params.intensity ?? 1);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {

    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const luminance =
      (0.299 * r + 0.587 * g + 0.114 * b);

    const isWarm = r > g * 0.9 && r > b * 1.2;

    if (isWarm) {
      r += 60 * intensity;
      g += 25 * intensity;
      b -= 35 * intensity;
    }

    if (luminance < 90) {
      r *= 0.92;
      g *= 0.95;
      b *= 1.08;
    }

    const contrast = 1 + 0.2 * intensity;

    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(imageData, 0, 0);
}

function mapIntensity(v) {
  // courbe beaucoup plus agressive
  return 0.15 + Math.pow(v, 1.6) * 1.8;
}


function fracture(ctx, canvas, params) {

  const intensity = mapIntensity(params.intensity ?? 1);

  const temp = document.createElement("canvas");
  const tctx = temp.getContext("2d");

  temp.width = canvas.width;
  temp.height = canvas.height;

  tctx.drawImage(canvas, 0, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const pieces = Math.floor(20 + 80 * intensity);

  for (let i = 0; i < pieces; i++) {

    // taille du fragment (irrégulier)
    const w = 20 + Math.random() * (canvas.width * 0.4);
    const h = 20 + Math.random() * (canvas.height * 0.4);

    // position source (dans image originale)
    const sx = Math.random() * (canvas.width - w);
    const sy = Math.random() * (canvas.height - h);

    // position destination (COMPLÈTEMENT LIBRE)
    const dx = Math.random() * canvas.width;
    const dy = Math.random() * canvas.height;

    // micro déformation (effet instable chantier)
    const stretchX = 0.8 + Math.random() * 0.6;
    const stretchY = 0.8 + Math.random() * 0.6;

    ctx.save();

    ctx.translate(dx, dy);
    ctx.scale(stretchX, stretchY);

    ctx.globalAlpha = 0.4 + Math.random() * 0.6;

    ctx.drawImage(
      temp,
      sx, sy,
      w, h,
      0, 0,
      w,
      h
    );

    ctx.restore();
  }

  ctx.globalAlpha = 1;
}





function textureConcrete(ctx, canvas, params) {

  const intensity = Math.pow(params.intensity ?? 1, 3);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {

    const grain = (Math.random() - 0.5) * 120 * intensity;

    data[i]     += grain;
    data[i + 1] += grain;
    data[i + 2] += grain;

    // cassure contraste extrême
    const avg = (data[i] + data[i+1] + data[i+2]) / 3;
    const boost = avg > 120 ? 1.4 : 0.6;

    data[i] *= boost;
    data[i+1] *= boost;
    data[i+2] *= boost;
  }

  ctx.putImageData(imageData, 0, 0);
}

async function imageBlend(ctx, canvas, params) {

  const intensity = mapIntensity(params.intensity ?? 1);

  const count = Math.floor(2 + 3 * intensity);

  const images = [];

  // pool sans les images déjà utilisées
  let blendPool = GLOBAL_IMAGE_POOL.filter(item => {

    return !USED_IMAGES.includes(item.url);

  });

  // fallback si pool trop petit
  if (blendPool.length < count) {
    blendPool = [...GLOBAL_IMAGE_POOL];
  }

  // vrai shuffle
  const selected = shuffle([...blendPool]).slice(0, count);

  // load images
  for (const item of selected) {

    const img = new Image();

    img.crossOrigin = "anonymous";
    img.src = item.url;

    await new Promise(resolve => {

      img.onload = resolve;
      img.onerror = resolve;

    });

    images.push(img);
  }

  // image de base
  ctx.globalAlpha = 1;

  // superpositions
  for (const img of images) {

    const alpha =
      0.15 + Math.random() * 0.35 * intensity;

    const scale =
      0.7 + Math.random() * 0.6;

    const offsetX =
      (Math.random() - 0.5) *
      canvas.width *
      0.35 *
      intensity;

    const offsetY =
      (Math.random() - 0.5) *
      canvas.height *
      0.35 *
      intensity;

    ctx.globalAlpha = alpha;

    ctx.drawImage(
      img,
      offsetX,
      offsetY,
      canvas.width * scale,
      canvas.height * scale
    );
  }

  ctx.globalAlpha = 1;
}

async function imageOrganicMix(ctx, canvas, params) {

  const intensity = mapIntensity(params.intensity ?? 1);

  const patchCount = Math.floor(10 + 40 * intensity);

  const { data } = await db
    .from("images")
    .select("url");

  if (!data) return;

  const shuffled = data.sort(() => Math.random() - 0.5);

  const selected = shuffled.slice(0, Math.floor(2 + 3 * intensity));

  const images = [];

  // load images
  for (let item of selected) {

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = item.url;

    await new Promise(res => img.onload = res);

    images.push(img);
  }

  for (let i = 0; i < patchCount; i++) {

    const img = images[Math.floor(Math.random() * images.length)];

    // taille du fragment (irrégulière)
    const w =
      (20 + Math.random() * canvas.width * 0.4) * intensity;

    const h =
      (20 + Math.random() * canvas.height * 0.4) * intensity;

    // position totalement libre
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;

    // origine dans l'image source
    const sx = Math.random() * (img.width - 10);
    const sy = Math.random() * (img.height - 10);

    // légère rotation/instabilité via globalAlpha
    ctx.globalAlpha = 0.3 + Math.random() * 0.7;

    ctx.drawImage(
      img,
      sx, sy,
      w, h,
      x, y,
      w * (0.8 + Math.random() * 0.4),
      h * (0.8 + Math.random() * 0.4)
    );
  }

  ctx.globalAlpha = 1;
} 

function getActiveFilters() {

  const filters = [];


  if (document.getElementById("fx-fracture").checked) {

  filters.push({
    type: "fracture",
    intensity:
      (document.getElementById("fx-fracture-intensity").value ?? 50) / 100
  });
}

  // CONSTRUCTION RGB
  if (document.getElementById("fx-construction").checked) {

    filters.push({
      type: "constructionRGB",
      intensity:
        (document.getElementById("fx-construction-intensity").value ?? 50) / 100
    });
  }

  if (document.getElementById("fx-blend").checked) {

  filters.push({
    type: "imageBlend",
    intensity:
      (document.getElementById("fx-blend-intensity").value ?? 50) / 100
  });
}

if (document.getElementById("fx-cutmix")?.checked) {

  filters.push({
    type: "imageOrganicMix",
    intensity:
      (document.getElementById("fx-cutmix-intensity").value ?? 50) / 100
  });
}
if (document.getElementById("fx-concrete")?.checked) {

  filters.push({
    type: "textureConcrete",
    intensity:
      (document.getElementById("fx-concrete-intensity")?.value ?? 50) / 100
  });
}
  return filters;
}

function applyPreset(name) {

  const preset = PRESETS[name];

  if (!preset) return;

  // reset UI
  document.querySelectorAll("input[type=checkbox]")
    .forEach(cb => cb.checked = false);

  // active preset
  for (const key in preset) {

    const checkbox = document.getElementById("fx-" + key);
    const slider = document.getElementById("fx-" + key + "-intensity");

    if (checkbox) checkbox.checked = true;
    if (slider) slider.value = preset[key] * 100;
  }

  console.log("Preset activé :", name);
}

window.generateFanzine = generateFanzine;
window.exportPDF = exportPDF;
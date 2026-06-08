
const supabaseUrl = "https://tawfytfbhtmdoscdgpbu.supabase.co";
const supabaseKey = "sb_publishable_BlsdkUhS_7FKGN5uggt2uw_fccuiFDj";

const db = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

let cropper;

// =========================
// CHOIX IMAGE
// =========================

document
  .getElementById("fileInput")
  .addEventListener("change", (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {

      const image =
        document.getElementById("preview");

      image.src = reader.result;

      if (cropper) {
        cropper.destroy();
      }

      cropper = new Cropper(image, {

        aspectRatio: 210 / 297,

        viewMode: 1,

        autoCropArea: 1,

        movable: true,
        zoomable: true

      });
    };

    reader.readAsDataURL(file);
});


// =========================
// UPLOAD
// =========================

async function uploadImage() {

  if (!cropper) return;

  const arrondissement =
    document.getElementById("arrondissement").value;

  cropper.getCroppedCanvas({

    width: 1240,
    height: 1754

  }).toBlob(async (blob) => {

    const fileName =
      Date.now() + ".jpg";

    // STORAGE
    const { error } = await db.storage
      .from("Fanzine-Chantiers")
      .upload(fileName, blob, {

        contentType: "image/jpeg"

      });

    if (error) {

      console.log(error);

      return;
    }

    // URL PUBLIQUE
    const { data } = db.storage
      .from("Fanzine-Chantiers")
      .getPublicUrl(fileName);

    // TABLE SQL
    const { error: insertError } = await db
      .from("images")
      .insert({

        url: data.publicUrl,

        arrondissement:
          parseInt(arrondissement)

      });

    if (insertError) {

      console.log(insertError);

      return;
    }

    alert("Image ajoutée !");

    loadImages();
  },
  "image/jpeg",
  1);
}


// =========================
// CHARGEMENT GALERIE
// =========================

async function loadImages(filter = "all") {

  const gallery =
    document.getElementById("gallery");

  gallery.innerHTML = "";

  let query = db
    .from("images")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (filter !== "all") {

    query =
      query.eq(
        "arrondissement",
        filter
      );
  }

  const { data, error } =
    await query;

  if (error) {

    console.log(error);

    return;
  }

  data.forEach(item => {

    const img =
      document.createElement("img");

    img.src = item.url;

    gallery.appendChild(img);
  });
}


// =========================
// AUTO LOAD
// =========================

window.addEventListener(
  "DOMContentLoaded",
  () => {

    loadImages();

});

document.getElementById("cropBtn")
.addEventListener("click", () => {

  if (!cropper) return;

  const arrondissement =
    document.getElementById("arrondissement").value;

  cropper.getCroppedCanvas({
    width: 1240,
    height: 1754
  }).toBlob(async (blob) => {

    const fileName = Date.now() + ".jpg";

    const { error } = await db.storage
      .from("Fanzine-Chantiers")
      .upload(fileName, blob, {
        contentType: "image/jpeg"
      });

    if (error) {
      console.log(error);
      return;
    }

    const { data } = db.storage
      .from("Fanzine-Chantiers")
      .getPublicUrl(fileName);

    const { error: insertError } = await db
      .from("images")
      .insert({
        url: data.publicUrl,
        arrondissement: parseInt(arrondissement)
      });

    if (insertError) {
      console.log(insertError);
      return;
    }

    alert("Image ajoutée à la bibliothèque !");
    loadImages();

  }, "image/jpeg", 1);
});

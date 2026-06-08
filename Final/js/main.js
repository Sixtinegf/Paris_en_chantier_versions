window.addEventListener("DOMContentLoaded", () => {

  window.appState = { view: "intro" };

  const intro = document.getElementById("intro");
  const mapView = document.getElementById("map-view");
  const zineView = document.getElementById("zine-view");

  function setView(view) {

    window.appState.view = view;

    intro.style.display = view === "intro" ? "flex" : "none";
    mapView.style.display = view === "map" ? "block" : "none";
    zineView.style.display = view === "zine" ? "block" : "none";

    window.dispatchEvent(new Event("viewChange"));
  }

  // =========================
  // BUTTONS (IMPORTANT)
  // =========================

  document.getElementById("enterBtn")?.addEventListener("click", () => {
    setView("map");
  });

  document.getElementById("enterZine")?.addEventListener("click", () => {
    setView("zine");
  });

  document.getElementById("backBtn")?.addEventListener("click", () => {
    setView("intro");
  });

document.getElementById("backToIntroMap")?.addEventListener("click", () => {
  window.dispatchEvent(new Event("showIntro"));
});

});

window.addEventListener("enterMap", () => {
  window.appState.view = "map";
  document.getElementById("intro").style.display = "none";
  document.getElementById("map-view").style.display = "block";
  document.getElementById("zine-view").style.display = "none";
});

window.addEventListener("showIntro", () => {
  window.appState.view = "intro";
  document.getElementById("intro").style.display = "flex";
  document.getElementById("map-view").style.display = "none";
  document.getElementById("zine-view").style.display = "none";
});


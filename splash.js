(function () {
  "use strict";

  const root = document.documentElement;
  const splash = document.getElementById("agrocentro-splash");

  if (!splash) {
    root.classList.remove("agro-intro-pending");
    return;
  }

  if (!root.classList.contains("agro-intro-pending")) {
    splash.remove();
    return;
  }

  const MIN_VISIBLE_MS = 240;
  const MAX_VISIBLE_MS = 2500;
  const NORMAL_FADE_MS = 160;
  const REDUCED_FADE_MS = 120;
  const pageStartedAt = Number(window.__agroIntroStartedAt) || Date.now();
  let dismissed = false;
  let fadeTimer = 0;
  let minimumTimer = 0;
  let safetyFadeTimer = 0;
  let visualStartedAt = null;
  // Content is ready after parsing; don't hold the screen for image downloads.
  let pageLoaded = document.readyState !== "loading";

  function removeSplash() {
    if (dismissed) return;
    dismissed = true;
    window.clearTimeout(window.__agroIntroSafetyTimer);
    window.clearTimeout(fadeTimer);
    window.clearTimeout(minimumTimer);
    window.clearTimeout(safetyFadeTimer);
    splash.remove();
    root.classList.remove("agro-intro-pending");
    root.classList.add("agro-intro-seen");
  }

  function fadeSplash() {
    if (dismissed || splash.classList.contains("is-leaving")) return;

    const elapsed = Date.now() - pageStartedAt;
    const timeRemaining = Math.max(0, MAX_VISIBLE_MS - elapsed);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const requestedFade = reducedMotion ? REDUCED_FADE_MS : NORMAL_FADE_MS;
    const fadeDuration = Math.min(requestedFade, timeRemaining);

    if (fadeDuration <= 0) {
      removeSplash();
      return;
    }

    splash.style.setProperty("--agro-splash-fade", `${fadeDuration}ms`);
    splash.classList.add("is-leaving");
    fadeTimer = window.setTimeout(removeSplash, fadeDuration);
  }

  function scheduleDismissal() {
    if (dismissed || !pageLoaded || visualStartedAt === null) return;
    const elapsed = Date.now() - visualStartedAt;
    const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);
    window.clearTimeout(minimumTimer);
    minimumTimer = window.setTimeout(fadeSplash, delay);
  }

  function markSplashVisible() {
    if (dismissed) return;
    visualStartedAt = Date.now();
    scheduleDismissal();
  }

  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(markSplashVisible);
    });
  } else {
    window.setTimeout(markSplashVisible, 0);
  }

  if (!pageLoaded) {
    document.addEventListener("DOMContentLoaded", function () {
      pageLoaded = true;
      scheduleDismissal();
    }, { once: true });
  }

  safetyFadeTimer = window.setTimeout(fadeSplash, Math.max(0, 2200 - (Date.now() - pageStartedAt)));
  window.addEventListener("pagehide", removeSplash, { once: true });
})();

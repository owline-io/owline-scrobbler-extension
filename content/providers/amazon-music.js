function getNPV() {
  return document.querySelector("#miniNPVTrackInfo")
    || document.querySelector("music-horizontal-item[id*='NPVTrackInfo']");
}

function getTrackInfo() {
  const npv = getNPV();
  if (!npv) return null;

  const title = (npv.getAttribute("primary-text") || "").trim();
  const secondary = (npv.getAttribute("secondary-text") || "").trim();
  if (!title || !secondary) return null;

  const parts = secondary.split(/\s+[·•]\s+/).map((s) => s.trim()).filter(Boolean);
  const artist = parts[0] || secondary;
  const album = parts[1] || null;

  const cover_url = npv.getAttribute("image-src") || null;

  let duration = null;
  const progress = document.querySelector("#progress-container");
  const max = progress?.getAttribute("aria-valuemax");
  if (max) duration = Math.round(parseFloat(max));

  return { title, artist, album, cover_url, duration };
}

function isPlaying() {
  const pauseBtn = document.querySelector('music-playback-button[icon-name="pause"]');
  if (pauseBtn) return true;
  const playBtn = document.querySelector('music-playback-button[icon-name="play"], music-playback-button[icon-name="resume"]');
  if (playBtn) return false;
  return false;
}

waitForPlayer({
  source: "amazon_music",
  getTrackInfo,
  isPlaying,
  hasPlayer: () => !!getNPV(),
});

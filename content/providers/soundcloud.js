function getCoverUrl() {
  const candidates = [
    ".playbackSoundBadge__avatar .sc-artwork",
    ".playbackSoundBadge__avatar span[style*='background-image']",
    ".playbackSoundBadge .sc-artwork",
    ".playbackSoundBadge span[style*='background-image']",
  ];
  for (const sel of candidates) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const bg = el.style?.backgroundImage || getComputedStyle(el).backgroundImage;
    const match = bg && bg.match(/url\(["']?(.*?)["']?\)/);
    if (match && match[1]) {
      return match[1].replace(/-t\d+x\d+\./, "-t500x500.");
    }
  }
  return null;
}

function getTrackInfo() {
  const titleEl = document.querySelector(".playbackSoundBadge__titleLink span:nth-child(2)")
    || document.querySelector(".playbackSoundBadge__titleLink");
  const artistEl = document.querySelector(".playbackSoundBadge__lightLink");

  if (!titleEl || !artistEl) return null;

  const title = titleEl.textContent?.trim();
  const artist = artistEl.textContent?.trim();
  if (!title || !artist) return null;

  const duration = parseDurationText(
    document.querySelector(".playbackTimeline__duration span[aria-hidden='true']")?.textContent
  );

  return { title, artist, album: null, cover_url: getCoverUrl(), duration };
}

function isPlaying() {
  const btn = document.querySelector(".playControl");
  if (!btn) return false;
  return btn.classList.contains("playing");
}

waitForPlayer({
  source: "soundcloud",
  getTrackInfo,
  isPlaying,
  hasPlayer: () => !!document.querySelector(".playbackSoundBadge__titleLink"),
  maxDuration: window.OWLINE.CONFIG.MAX_TRACK_DURATION,
});

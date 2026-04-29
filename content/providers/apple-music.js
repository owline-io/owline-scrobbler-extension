function getTrackInfo() {
  const playerEl = document.querySelector("amp-lcd")
    || document.querySelector("[class*='lcd-player']")
    || document.querySelector(".web-chrome-playback-lcd");

  if (!playerEl) return null;

  const titleEl = playerEl.querySelector("[class*='song-name']")
    || playerEl.querySelector(".web-chrome-playback-lcd__song-name-scroll-inner")
    || document.querySelector('[data-testid="player-song-name"]');
  const artistEl = playerEl.querySelector("[class*='sub-copy'] a")
    || playerEl.querySelector(".web-chrome-playback-lcd__sub-copy-scroll-inner a")
    || document.querySelector('[data-testid="player-artist-name"]');

  if (!titleEl || !artistEl) return null;

  const title = titleEl.textContent?.trim();
  const artist = artistEl.textContent?.trim();
  if (!title || !artist) return null;

  const durationEl = document.querySelector("[class*='playback-duration__time-remaining']")
    || document.querySelector(".playback-display__duration");
  const duration = parseDurationText(durationEl?.textContent);

  const coverEl = playerEl.querySelector("picture img")
    || document.querySelector("[class*='artwork'] img")
    || document.querySelector(".web-chrome-playback-lcd img");
  const cover_url = coverEl?.src || null;

  const albumEl = playerEl.querySelector("[class*='sub-copy'] a:nth-child(2)");
  const album = albumEl?.textContent?.trim() || null;

  return { title, artist, album, cover_url, duration };
}

function isPlaying() {
  const btn = document.querySelector('[class*="playback-play"]')
    || document.querySelector("amp-playback-controls-play-pause");
  if (!btn) return false;
  const label = (btn.getAttribute("aria-label") || btn.getAttribute("aria-checked") || "").toLowerCase();
  return label.includes("pause") || label === "true";
}

waitForPlayer({
  source: "apple_music",
  getTrackInfo,
  isPlaying,
  hasPlayer: () =>
    !!(document.querySelector("amp-lcd")
      || document.querySelector("[class*='lcd-player']")
      || document.querySelector(".web-chrome-playback-lcd")),
});

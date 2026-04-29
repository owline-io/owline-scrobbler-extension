function getTrackInfo() {
  const titleEl = document.querySelector('[data-test="footer-track-title"]')
    || document.querySelector('[class*="mediaInformation"] [class*="title"]')
    || document.querySelector('.player__nowPlaying [class*="title"]');
  const artistEl = document.querySelector('[data-test="grid-item-detail-text-title-artist"] a')
    || document.querySelector('[class*="mediaInformation"] [class*="artist"] a')
    || document.querySelector('.player__nowPlaying [class*="artist"] a');

  if (!titleEl || !artistEl) return null;

  const title = titleEl.textContent?.trim();
  const artist = artistEl.textContent?.trim();
  if (!title || !artist) return null;

  const durationEl = document.querySelector('[data-test="duration"]')
    || document.querySelector('[class*="duration"]');
  const duration = parseDurationText(durationEl?.textContent);

  const coverEl = document.querySelector('[class*="mediaImagery"] img')
    || document.querySelector('.player__nowPlaying img');
  const cover_url = coverEl?.src || null;

  const albumEl = document.querySelector('[data-test="grid-item-detail-text-title-artist"] + span a');
  const album = albumEl?.textContent?.trim() || null;

  return { title, artist, album, cover_url, duration };
}

function isPlaying() {
  const btn = document.querySelector('[data-test="play"]')
    || document.querySelector('[data-test="pause"]');
  if (!btn) return false;
  const test = btn.getAttribute("data-test") || "";
  return test === "pause";
}

waitForPlayer({
  source: "tidal",
  getTrackInfo,
  isPlaying,
  hasPlayer: () =>
    !!(document.querySelector('[data-test="footer-track-title"]')
      || document.querySelector('[class*="mediaInformation"] [class*="title"]')),
});

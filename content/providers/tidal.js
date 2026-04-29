function getPlayer() {
  return document.querySelector('[data-test="footer-player"]');
}

function getTrackInfo() {
  const player = getPlayer();
  if (!player) return null;

  const titleEl = player.querySelector('[data-test="footer-track-title"]');
  const artistEl = player.querySelector('[data-test="footer-artist-name"]');
  if (!titleEl || !artistEl) return null;

  const title = titleEl.textContent?.trim();
  const artist = artistEl.textContent?.trim();
  if (!title || !artist) return null;

  const coverEl = document.querySelector('[data-test="current-media-imagery"] img');
  const cover_url = coverEl?.src || null;

  const durationEl = document.querySelector('[data-test="duration"]');
  const duration = parseDurationText(durationEl?.textContent);

  return { title, artist, album: null, cover_url, duration };
}

function isPlaying() {
  if (document.querySelector('[data-test="icon--player__pause"]')) return true;
  if (document.querySelector('[data-test="pause"]')) return true;
  if (document.querySelector('[data-test="icon--player__play"]')) return false;
  return false;
}

waitForPlayer({
  source: "tidal",
  getTrackInfo,
  isPlaying,
  hasPlayer: () => !!document.querySelector('[data-test="footer-player"] [data-test="footer-track-title"]'),
});

function getTrackInfo() {
  const titleEl = document.querySelector('[class*="PlayerControlsMetadata"] a[data-testid="metadataTitleLink"]')
    || document.querySelector('[class*="MiniPlayerPosterTitle"] a')
    || document.querySelector('[data-testid="nowPlayingTitle"]');
  const artistEl = document.querySelector('[class*="PlayerControlsMetadata"] a[data-testid="metadataSubtitleLink"]')
    || document.querySelector('[class*="MiniPlayerPosterTitle"] + * a')
    || document.querySelector('[data-testid="nowPlayingSubtitle"]');

  if (!titleEl || !artistEl) return null;

  const title = titleEl.textContent?.trim();
  const artist = artistEl.textContent?.trim();
  if (!title || !artist) return null;

  const durationEl = document.querySelector('[class*="DurationRemaining"]')
    || document.querySelector('[data-testid="mediaDuration"]');
  const duration = parseDurationText(durationEl?.textContent);

  const coverEl = document.querySelector('[class*="PlayerControlsMetadata"] img')
    || document.querySelector('[class*="PosterCardImg"]');
  const cover_url = coverEl?.src || null;

  return { title, artist, album: null, cover_url, duration };
}

function isPlaying() {
  const btn = document.querySelector('[data-testid="pauseButton"]')
    || document.querySelector('[data-testid="playButton"]');
  if (!btn) return false;
  return btn.getAttribute("data-testid") === "pauseButton";
}

waitForPlayer({
  source: "plex",
  getTrackInfo,
  isPlaying,
  hasPlayer: () =>
    !!(document.querySelector('[data-testid="metadataTitleLink"]')
      || document.querySelector('[data-testid="nowPlayingTitle"]')),
});

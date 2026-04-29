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

  return { title, artist, album: null, duration };
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

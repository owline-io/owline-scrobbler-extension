function getTrackInfo() {
  const titleEl = document.querySelector(".track-link[data-testid='item_title']")
    || document.querySelector(".player-track-link .track-link");
  const artistEl = document.querySelector(".track-link[data-testid='item_subtitle']")
    || document.querySelector(".player-track-link .track-link:nth-child(2)");

  if (!titleEl || !artistEl) return null;

  const title = titleEl.textContent?.trim();
  const artist = artistEl.textContent?.trim();
  if (!title || !artist) return null;

  const duration = parseDurationText(
    document.querySelector("[data-testid='slider_remaining_time']")?.textContent
      || document.querySelector(".player-track-duration")?.textContent
  );

  const album = document.querySelector("[data-testid='item_subtitle']:nth-child(2)")?.textContent?.trim() || null;

  return { title, artist, album, duration };
}

function isPlaying() {
  if (document.querySelector("[data-testid='play_button_pause']")) return true;
  if (document.querySelector("[data-testid='play_button_play']")) return false;
  const btn = document.querySelector(".player-controls .control-play, [data-testid*='play']");
  if (!btn) return false;
  const label = (btn.getAttribute("aria-label") || "").toLowerCase();
  return label.includes("pause");
}

waitForPlayer({
  source: "deezer",
  getTrackInfo,
  isPlaying,
  hasPlayer: () =>
    !!(document.querySelector(".track-link[data-testid='item_title']")
      || document.querySelector(".player-track-link")),
});

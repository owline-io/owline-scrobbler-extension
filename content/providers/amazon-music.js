function getTrackInfo() {
  const titleEl = document.querySelector('[class*="playerControls"] [class*="trackTitle"]')
    || document.querySelector('music-horizontal-item[slot="now-playing"] [slot="primaryText"]')
    || document.querySelector('.nowPlayingDetail .trackTitle');
  const artistEl = document.querySelector('[class*="playerControls"] [class*="artistLink"]')
    || document.querySelector('music-horizontal-item[slot="now-playing"] [slot="secondaryText"]')
    || document.querySelector('.nowPlayingDetail .artistLink');

  if (!titleEl || !artistEl) return null;

  const title = titleEl.textContent?.trim();
  const artist = artistEl.textContent?.trim();
  if (!title || !artist) return null;

  const durationEl = document.querySelector('[class*="playerControls"] [class*="duration"]')
    || document.querySelector('music-horizontal-item .duration');
  const duration = parseDurationText(durationEl?.textContent);

  const coverEl = document.querySelector('[class*="playerControls"] img[class*="artwork"]')
    || document.querySelector('music-horizontal-item[slot="now-playing"] img')
    || document.querySelector('.nowPlayingDetail img');
  const cover_url = coverEl?.src || null;

  return { title, artist, album: null, cover_url, duration };
}

function isPlaying() {
  const btn = document.querySelector('music-button[icon-name="pause"]')
    || document.querySelector('[class*="playerControls"] [class*="playButton"]');
  if (!btn) return false;
  const icon = btn.getAttribute("icon-name") || "";
  if (icon === "pause") return true;
  const label = (btn.getAttribute("aria-label") || "").toLowerCase();
  return label.includes("pause");
}

waitForPlayer({
  source: "amazon_music",
  getTrackInfo,
  isPlaying,
  hasPlayer: () =>
    !!(document.querySelector('[class*="playerControls"] [class*="trackTitle"]')
      || document.querySelector('music-horizontal-item[slot="now-playing"]')),
});

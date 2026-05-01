function getTrackInfo() {
  const titleEl = document.querySelector(".ytmusic-player-bar .title");
  const artistEl = document.querySelector(".ytmusic-player-bar .byline a");
  if (!titleEl || !artistEl) return null;

  const title = titleEl.textContent?.trim();
  const artist = artistEl.textContent?.trim();
  if (!title || !artist) return null;

  const timeText = document.querySelector(".ytmusic-player-bar .time-info")?.textContent || "";
  const match = timeText.match(/\/\s*(\d+:\d+(?::\d+)?)/);
  const duration = match ? parseDurationText(match[1]) : null;

  const album = document.querySelector(".ytmusic-player-bar .byline a:nth-child(3)")?.textContent?.trim() || null;
  const cover_url = document.querySelector(".ytmusic-player-bar img.image")?.src
    || document.querySelector(".ytmusic-player-bar img")?.src
    || null;

  return { title, artist, album, cover_url, duration };
}

function isPlaying() {
  const v = document.querySelector("video");
  return !!v && !v.paused && !v.ended && v.currentTime > 0;
}

waitForPlayer({
  source: "youtube_music",
  getTrackInfo,
  isPlaying,
  hasPlayer: () => !!document.querySelector(".ytmusic-player-bar .title"),
  maxDuration: window.OWLINE.CONFIG.MAX_TRACK_DURATION,
});

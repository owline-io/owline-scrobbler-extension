function getTrackInfo() {
  const isYTMusic = location.hostname === "music.youtube.com";

  if (isYTMusic) {
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

    return { title, artist, album, duration };
  }

  const titleEl = document.querySelector("#info h1 yt-formatted-string")
    || document.querySelector("h1.ytd-watch-metadata yt-formatted-string");
  const channelEl = document.querySelector("#upload-info ytd-channel-name a")
    || document.querySelector("ytd-channel-name yt-formatted-string a");

  if (!titleEl || !channelEl) return null;

  const rawTitle = titleEl.textContent?.trim() || "";
  const channel = channelEl.textContent?.trim() || "";

  const dashMatch = rawTitle.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  const artist = dashMatch ? dashMatch[1].trim() : channel;
  const title = dashMatch ? dashMatch[2].trim() : rawTitle;

  if (!title || !artist) return null;

  const duration = parseDurationText(document.querySelector(".ytp-time-duration")?.textContent);

  return { title, artist, album: null, duration };
}

function isPlaying() {
  if (location.hostname === "music.youtube.com") {
    const btn = document.querySelector("#play-pause-button");
    if (!btn) return false;
    const label = (btn.getAttribute("aria-label") || btn.getAttribute("title") || "").toLowerCase();
    return label.includes("pause");
  }
  const btn = document.querySelector(".ytp-play-button");
  if (!btn) return false;
  const label = (btn.getAttribute("data-title-no-tooltip") || btn.getAttribute("aria-label") || "").toLowerCase();
  return label.includes("pause");
}

waitForPlayer({
  source: "youtube",
  getTrackInfo,
  isPlaying,
  hasPlayer: () =>
    location.hostname === "music.youtube.com"
      ? !!document.querySelector(".ytmusic-player-bar .title")
      : !!document.querySelector("#info h1 yt-formatted-string"),
  maxDuration: window.OWLINE.CONFIG.MAX_TRACK_DURATION,
});

function getTrackInfo() {
  const titleEl = document.querySelector("ytd-watch-metadata h1 yt-formatted-string")
    || document.querySelector("h1.ytd-watch-metadata yt-formatted-string")
    || document.querySelector("#info h1 yt-formatted-string");
  const channelEl = document.querySelector("ytd-watch-metadata #channel-name a")
    || document.querySelector("#owner #channel-name a")
    || document.querySelector("#upload-info ytd-channel-name a")
    || document.querySelector("ytd-channel-name yt-formatted-string a");

  if (!titleEl || !channelEl) return null;

  const rawTitle = titleEl.textContent?.trim() || "";
  const channel = channelEl.textContent?.trim() || "";

  const dashMatch = rawTitle.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  const artist = dashMatch ? dashMatch[1].trim() : channel;
  const title = dashMatch ? dashMatch[2].trim() : rawTitle;

  if (!title || !artist) return null;

  const duration = parseDurationText(document.querySelector(".ytp-time-duration")?.textContent);

  const videoIdMatch = location.search.match(/[?&]v=([^&]+)/);
  const cover_url = videoIdMatch
    ? `https://i.ytimg.com/vi/${videoIdMatch[1]}/hqdefault.jpg`
    : null;

  return { title, artist, album: null, cover_url, duration };
}

function isPlaying() {
  const v = document.querySelector("video");
  return !!v && !v.paused && !v.ended && v.currentTime > 0;
}

waitForPlayer({
  source: "youtube",
  getTrackInfo,
  isPlaying,
  hasPlayer: () => !!document.querySelector("video")
    && (!!document.querySelector("ytd-watch-metadata h1 yt-formatted-string")
      || !!document.querySelector("h1.ytd-watch-metadata yt-formatted-string")
      || !!document.querySelector("#info h1 yt-formatted-string")),
  maxDuration: window.OWLINE.CONFIG.MAX_TRACK_DURATION,
});

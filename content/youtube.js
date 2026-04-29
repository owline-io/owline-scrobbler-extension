function getTrackInfo() {
  const isYTMusic = location.hostname === "music.youtube.com";

  if (isYTMusic) {
    const titleEl = document.querySelector(".ytmusic-player-bar .title");
    const artistEl = document.querySelector(".ytmusic-player-bar .byline a");
    if (!titleEl || !artistEl) return null;

    const title = titleEl.textContent?.trim();
    const artist = artistEl.textContent?.trim();
    if (!title || !artist) return null;

    const timeEl = document.querySelector(".ytmusic-player-bar .time-info");
    let duration = null;
    if (timeEl) {
      const match = timeEl.textContent.match(/\/\s*(\d+):(\d+)/);
      if (match) duration = Number(match[1]) * 60 + Number(match[2]);
    }

    const albumEl = document.querySelector(".ytmusic-player-bar .byline a:nth-child(3)");
    const album = albumEl?.textContent?.trim() || null;

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

  const durationEl = document.querySelector(".ytp-time-duration");
  let duration = null;
  if (durationEl) {
    const parts = durationEl.textContent.split(":").map(Number);
    if (parts.length === 2) duration = parts[0] * 60 + parts[1];
    if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (duration && duration > 1200) return null;

  return { title, artist, album: null, duration };
}

function waitForPlayer() {
  const check = () => {
    const hasPlayer = location.hostname === "music.youtube.com"
      ? document.querySelector(".ytmusic-player-bar .title")
      : document.querySelector("#info h1 yt-formatted-string");

    if (hasPlayer) {
      createScrobbler({ source: "youtube", getTrackInfo });
    } else {
      setTimeout(check, 2000);
    }
  };
  check();
}

waitForPlayer();

function stripArtistPrefix(text) {
  if (!text) return text;
  return text.replace(/^(de |by |por |di )/i, "").trim();
}

function getFloatingPlayerInfo() {
  const root = document.querySelector("#floating-player");
  if (!root) return null;
  const title = root.querySelector(".title-text")?.textContent?.trim();
  const artist = stripArtistPrefix(root.querySelector(".artist-name")?.textContent?.trim());
  if (!title || !artist) return null;
  const meta = root.querySelector(".track-meta");
  const durAttr = meta?.getAttribute("duration");
  const duration = durAttr ? Math.round(parseFloat(durAttr)) : null;
  const cover_url = root.querySelector(".art img")?.src || null;
  return { title, artist, album: null, cover_url, duration };
}

function getTrackInfo() {
  const floating = getFloatingPlayerInfo();
  if (floating) return floating;

  const titleEl = document.querySelector(".title_link span.title")
    || document.querySelector(".trackTitle")
    || document.querySelector("[itemprop='name']");
  const artistEl = document.querySelector("#name-section a")
    || document.querySelector("[itemprop='byArtist'] a")
    || document.querySelector("#band-name-location .title");

  if (!titleEl || !artistEl) return null;

  const title = titleEl.textContent?.trim();
  const artist = artistEl.textContent?.trim();
  if (!title || !artist) return null;

  const durationEl = document.querySelector(".time_total");
  const duration = parseDurationText(durationEl?.textContent);

  const coverEl = document.querySelector("#tralbumArt img")
    || document.querySelector(".popupImage");
  const cover_url = coverEl?.src || null;

  const albumEl = document.querySelector(".fromAlbum a")
    || document.querySelector("h2.trackTitle + h3 span a");
  const album = albumEl?.textContent?.trim()
    || document.querySelector("#name-section h2.trackTitle")?.textContent?.trim()
    || null;

  return { title, artist, album, cover_url, duration };
}

function isPlaying() {
  const floatingBtn = document.querySelector("#floating-player .play-pause-button");
  if (floatingBtn) return floatingBtn.classList.contains("outline");
  const audio = document.querySelector("audio");
  if (audio) return !audio.paused && !audio.ended && audio.currentTime > 0;
  const playBtn = document.querySelector(".playbutton");
  if (playBtn) return playBtn.classList.contains("playing");
  return false;
}

waitForPlayer({
  source: "bandcamp",
  getTrackInfo,
  isPlaying,
  hasPlayer: () =>
    !!(document.querySelector("#floating-player")
      || document.querySelector(".inline_player")
      || document.querySelector("#trackInfoInner")),
  maxDuration: window.OWLINE.CONFIG.MAX_TRACK_DURATION,
});

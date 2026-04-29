function getTrackInfo() {
  const titleEl = document.querySelector(".title_link span.title")
    || document.querySelector(".trackTitle")
    || document.querySelector("[itemprop='name']");
  const artistEl = document.querySelector("#name-section a span")
    || document.querySelector("[itemprop='byArtist'] a");

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
  const playBtn = document.querySelector(".playbutton");
  if (playBtn) return playBtn.classList.contains("playing");
  const audio = document.querySelector("audio");
  return audio ? !audio.paused : false;
}

waitForPlayer({
  source: "bandcamp",
  getTrackInfo,
  isPlaying,
  hasPlayer: () =>
    !!(document.querySelector(".inline_player")
      || document.querySelector("#trackInfoInner")),
  maxDuration: window.OWLINE.CONFIG.MAX_TRACK_DURATION,
});

function getTrackInfo() {
  const titleEl = document.querySelector(".track-link[data-testid='item_title']")
    || document.querySelector(".player-track-link .track-link");
  const artistEl = document.querySelector(".track-link[data-testid='item_subtitle']")
    || document.querySelector(".player-track-link .track-link:nth-child(2)");

  if (!titleEl || !artistEl) return null;

  const title = titleEl.textContent?.trim();
  const artist = artistEl.textContent?.trim();
  if (!title || !artist) return null;

  const durationEl = document.querySelector("[data-testid='slider_remaining_time']")
    || document.querySelector(".player-track-duration");
  let duration = null;
  if (durationEl) {
    const text = durationEl.textContent.replace("-", "").trim();
    const parts = text.split(":").map(Number);
    if (parts.length === 2) duration = parts[0] * 60 + parts[1];
  }

  const albumEl = document.querySelector("[data-testid='item_subtitle']:nth-child(2)");
  const album = albumEl?.textContent?.trim() || null;

  return { title, artist, album, duration };
}

function waitForPlayer() {
  const check = () => {
    if (document.querySelector(".track-link[data-testid='item_title']")
      || document.querySelector(".player-track-link")) {
      createScrobbler({ source: "deezer", getTrackInfo });
    } else {
      setTimeout(check, 2000);
    }
  };
  check();
}

waitForPlayer();

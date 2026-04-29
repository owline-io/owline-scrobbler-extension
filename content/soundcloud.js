function getTrackInfo() {
  const titleEl = document.querySelector(".playbackSoundBadge__titleLink span:nth-child(2)")
    || document.querySelector(".playbackSoundBadge__titleLink");
  const artistEl = document.querySelector(".playbackSoundBadge__lightLink");

  if (!titleEl || !artistEl) return null;

  const title = titleEl.textContent?.trim();
  const artist = artistEl.textContent?.trim();
  if (!title || !artist) return null;

  const durationEl = document.querySelector(".playbackTimeline__duration span[aria-hidden='true']");
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
    if (document.querySelector(".playbackSoundBadge__titleLink")) {
      createScrobbler({ source: "soundcloud", getTrackInfo });
    } else {
      setTimeout(check, 2000);
    }
  };
  check();
}

waitForPlayer();

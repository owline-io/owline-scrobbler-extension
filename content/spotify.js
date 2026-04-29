function getTrackInfo() {
  const selectors = [
    () => ({
      title: document.querySelector('[data-testid="context-item-info-title"]')?.textContent?.trim(),
      artist: document.querySelector('[data-testid="context-item-info-artist"]')?.textContent?.trim(),
    }),
    () => ({
      title: document.querySelector('[data-testid="now-playing-widget"] a[data-testid]')?.textContent?.trim(),
      artist: document.querySelector('[data-testid="context-item-link"]')?.textContent?.trim(),
    }),
    () => ({
      title: document.querySelector('.Root__now-playing-bar [dir="auto"] a')?.textContent?.trim(),
      artist: document.querySelector('.Root__now-playing-bar [dir="auto"] span a')?.textContent?.trim(),
    }),
  ];

  let title = null;
  let artist = null;
  for (const sel of selectors) {
    const r = sel();
    if (r.title && r.artist) { title = r.title; artist = r.artist; break; }
  }
  if (!title || !artist) return null;

  const durationEl = document.querySelector('[data-testid="playback-duration"]');
  let duration = null;
  if (durationEl) {
    const parts = durationEl.textContent.split(":").map(Number);
    duration = parts.length === 2 ? parts[0] * 60 + parts[1] : null;
  }

  const coverEl = document.querySelector('[data-testid="CoverSlotExpanded__container"] img')
    || document.querySelector('.now-playing__cover-art img');

  return { title, artist, album: coverEl?.alt || null, duration };
}

function waitForPlayer() {
  const check = () => {
    if (getTrackInfo()) {
      createScrobbler({ source: "spotify", getTrackInfo });
    } else {
      setTimeout(check, 2000);
    }
  };
  check();
}

waitForPlayer();

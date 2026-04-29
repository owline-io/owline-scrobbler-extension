/**
 * Spotify Web Player scrobbler.
 *
 * Reads now-playing info from the player bar DOM.
 * Selectors may break on Spotify UI updates — check periodically.
 */

function getTrackInfo() {
  const titleEl = document.querySelector('[data-testid="context-item-info-title"]')
    || document.querySelector('[data-testid="now-playing-widget"] a[data-testid]');
  const artistEl = document.querySelector('[data-testid="context-item-info-artist"]')
    || document.querySelector('[data-testid="context-item-link"]');

  if (!titleEl || !artistEl) return null;

  const title = titleEl.textContent?.trim();
  const artist = artistEl.textContent?.trim();
  if (!title || !artist) return null;

  const durationEl = document.querySelector('[data-testid="playback-duration"]');
  let duration = null;
  if (durationEl) {
    const parts = durationEl.textContent.split(":").map(Number);
    duration = parts.length === 2 ? parts[0] * 60 + parts[1] : null;
  }

  const coverEl = document.querySelector('[data-testid="CoverSlotExpanded__container"] img')
    || document.querySelector('.now-playing__cover-art img');
  const album = coverEl?.alt || null;

  return { title, artist, album, duration };
}

function waitForPlayer() {
  const check = () => {
    if (document.querySelector('[data-testid="context-item-info-title"]')
      || document.querySelector('[data-testid="now-playing-widget"]')) {
      createScrobbler({ source: "spotify", getTrackInfo });
    } else {
      setTimeout(check, 2000);
    }
  };
  check();
}

waitForPlayer();

function getPlayer() {
  return document.querySelector("#page_player")
    || document.querySelector('[data-testid="miniplayer_container"]');
}

function getTrackInfo() {
  const player = getPlayer();
  if (!player) return null;

  const titleEl = player.querySelector('[data-testid="item_title"] a')
    || player.querySelector('[data-testid="item_title"]');
  const artistEl = player.querySelector('[data-testid="item_subtitle"] a')
    || player.querySelector('[data-testid="item_subtitle"]');

  if (!titleEl || !artistEl) return null;

  const title = titleEl.textContent?.trim();
  const artist = artistEl.textContent?.trim();
  if (!title || !artist) return null;

  const coverImg = player.querySelector('[data-testid="item_cover"] img');
  const cover_url = coverImg?.src || null;
  const album = coverImg?.alt?.trim() || null;

  let duration = null;
  const slider = player.querySelector('[role="slider"][aria-valuemax]');
  const max = slider?.getAttribute("aria-valuemax");
  if (max) duration = Math.round(parseFloat(max));

  return { title, artist, album, cover_url, duration };
}

function isPlaying() {
  const player = getPlayer();
  if (!player) return false;
  const btn = player.querySelector('[data-testid="play_button_pause"]');
  if (btn) return true;
  const playBtn = player.querySelector('[data-testid="play_button_play"], button[aria-label*="Play" i], button[aria-label*="Reproduzir" i]');
  if (playBtn) return false;
  const anyBtn = player.querySelector('button[aria-label*="ause" i]');
  return !!anyBtn;
}

waitForPlayer({
  source: "deezer",
  getTrackInfo,
  isPlaying,
  hasPlayer: () => !!document.querySelector('#page_player [data-testid="item_title"]'),
  maxDuration: window.OWLINE.CONFIG.MAX_TRACK_DURATION,
});

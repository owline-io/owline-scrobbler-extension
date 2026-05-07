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

  const duration = parseDurationText(
    document.querySelector('[data-testid="playback-duration"]')?.textContent
  );

  const coverEl = document.querySelector('[data-testid="CoverSlotExpanded__container"] img')
    || document.querySelector('[data-testid="now-playing-widget"] img')
    || document.querySelector('.now-playing__cover-art img');

  return {
    title,
    artist,
    album: coverEl?.alt || null,
    cover_url: coverEl?.src || null,
    duration,
  };
}

function isPlaying() {
  const audio = document.querySelector("audio, video");
  if (audio && !audio.paused && !audio.ended && audio.currentTime > 0) return true;
  const btn = document.querySelector('[data-testid="control-button-playpause"]');
  if (!btn) return false;
  const label = (btn.getAttribute("aria-label") || "").toLowerCase();
  const pauseTokens = ["pause", "pausar", "pausa", "anhalten", "pauzeren", "一時停止"];
  return pauseTokens.some((t) => label.includes(t));
}

waitForPlayer({
  source: "spotify",
  getTrackInfo,
  isPlaying,
  hasPlayer: () => !!getTrackInfo(),
});

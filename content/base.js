function createScrobbler({ source, getTrackInfo, pollInterval = 3000, scrobbleAt = 30000 }) {
  if (window.__owlineScrobblerActive) return;
  window.__owlineScrobblerActive = true;

  let current = null;
  let startedAt = 0;
  let scrobbled = false;

  function key(t) {
    return t ? `${t.artist}|${t.title}` : "";
  }

  function poll() {
    try {
      if (!chrome.runtime?.id) throw new Error("dead");

      const info = getTrackInfo();
      if (!info || !info.title || !info.artist) {
        current = null;
        return;
      }

      const k = key(info);
      if (k !== key(current)) {
        current = info;
        startedAt = Date.now();
        scrobbled = false;
        chrome.runtime.sendMessage({ type: "NOW_PLAYING", track: { ...info, source } });
      }

      const elapsed = Date.now() - startedAt;
      const threshold = info.duration
        ? Math.min(scrobbleAt, info.duration * 1000 * 0.5)
        : scrobbleAt;

      if (!scrobbled && elapsed >= threshold) {
        scrobbled = true;
        chrome.runtime.sendMessage({ type: "SCROBBLE_READY", track: { ...info, source } });
      }
    } catch {
      clearInterval(intervalId);
      window.__owlineScrobblerActive = false;
    }
  }

  const intervalId = setInterval(poll, pollInterval);
  poll();
}

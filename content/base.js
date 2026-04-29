function createScrobbler({ source, getTrackInfo, pollInterval = 3000, scrobbleAt = 30000 }) {
  let current = null;
  let startedAt = 0;
  let scrobbled = false;

  function key(t) {
    return t ? `${t.artist}|${t.title}` : "";
  }

  function safeSend(msg) {
    try {
      if (!chrome.runtime?.id) { clearInterval(intervalId); return; }
      chrome.runtime.sendMessage(msg);
    } catch {
      clearInterval(intervalId);
    }
  }

  function poll() {
    if (!chrome.runtime?.id) { clearInterval(intervalId); return; }

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
      safeSend({ type: "NOW_PLAYING", track: { ...info, source } });
    }

    const elapsed = Date.now() - startedAt;
    const threshold = info.duration
      ? Math.min(scrobbleAt, info.duration * 500)
      : scrobbleAt;

    if (!scrobbled && elapsed >= threshold) {
      scrobbled = true;
      safeSend({ type: "SCROBBLE_READY", track: { ...info, source } });
    }
  }

  const intervalId = setInterval(poll, pollInterval);
  poll();
}

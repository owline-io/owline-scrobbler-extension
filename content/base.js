const { CONFIG, KEYS } = window.OWLINE;

const __owlineProviderListeners = new Map();

function isProviderEnabledSync(source, cb) {
  chrome.storage.local.get(KEYS.PROVIDERS, (data) => {
    const settings = data[KEYS.PROVIDERS] || {};
    cb(settings[source] !== false);
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes[KEYS.PROVIDERS]) return;
  const next = changes[KEYS.PROVIDERS].newValue || {};
  for (const [source, restart] of __owlineProviderListeners) {
    if (next[source] === false) {
      window.__owlineScrobblerActive = false;
    } else if (!window.__owlineScrobblerActive) {
      restart();
    }
  }
});

function createScrobbler({
  source,
  getTrackInfo,
  isPlaying = null,
  pollInterval = CONFIG.POLL_INTERVAL_MS,
  scrobbleAt = CONFIG.SCROBBLE_AT_MS,
  maxDuration = null,
}) {
  if (window.__owlineScrobblerActive) return;
  if (window.__owlineIntervalId) clearInterval(window.__owlineIntervalId);
  window.__owlineScrobblerActive = true;

  let current = null;
  let startedAt = 0;
  let scrobbled = false;

  const key = (t) => (t ? `${t.artist}|${t.title}` : "");

  function poll() {
    try {
      if (!chrome.runtime?.id) throw new Error("dead");
      if (!window.__owlineScrobblerActive) throw new Error("disabled");

      const info = getTrackInfo();
      const playing = isPlaying ? isPlaying() : true;
      const tooLong = info && maxDuration && info.duration && info.duration > maxDuration;

      if (!info || !info.title || !info.artist || !playing || tooLong) {
        if (current) {
          chrome.runtime.sendMessage({ type: "NOW_PLAYING", track: null });
        }
        current = null;
        return;
      }

      const k = key(info);
      const trackChanged = k !== key(current);
      if (trackChanged) {
        current = info;
        startedAt = Date.now();
        scrobbled = false;
      }
      chrome.runtime.sendMessage({
        type: "NOW_PLAYING",
        track: { ...info, source, at: Date.now() },
      });

      const elapsed = Date.now() - startedAt;
      const threshold = info.duration
        ? Math.min(scrobbleAt, info.duration * 1000 * CONFIG.MIN_LISTEN_FRACTION)
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
  window.__owlineIntervalId = intervalId;
  poll();
}

function waitForPlayer({ source, hasPlayer, getTrackInfo, isPlaying, pollInterval, scrobbleAt, maxDuration }) {
  const tryStart = () => {
    isProviderEnabledSync(source, (enabled) => {
      if (!enabled) {
        setTimeout(tryStart, CONFIG.PROVIDER_DISABLED_RETRY_MS);
        return;
      }
      const check = () => {
        if (hasPlayer()) {
          createScrobbler({ source, getTrackInfo, isPlaying, pollInterval, scrobbleAt, maxDuration });
        } else {
          setTimeout(check, CONFIG.WAIT_PLAYER_RETRY_MS);
        }
      };
      check();
    });
  };

  __owlineProviderListeners.set(source, tryStart);
  tryStart();
}

function parseDurationText(text) {
  if (!text) return null;
  const cleaned = String(text).replace("-", "").trim();
  const parts = cleaned.split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

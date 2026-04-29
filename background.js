const API_BASE = "https://api.owline.io/api/v1";
const SCROBBLE_THRESHOLD_MS = 30000;
const DEBOUNCE_MS = 5000;

let lastScrobble = { key: "", at: 0 };
let pendingQueue = [];
let scrobbleCount = 0;

async function getToken() {
  const { owline_token } = await chrome.storage.local.get("owline_token");
  return owline_token || null;
}

async function refreshToken() {
  const { owline_refresh } = await chrome.storage.local.get("owline_refresh");
  if (!owline_refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: owline_refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const token = data.access_token || data.token;
    if (token) {
      await chrome.storage.local.set({ owline_token: token });
      if (data.refresh_token) {
        await chrome.storage.local.set({ owline_refresh: data.refresh_token });
      }
    }
    return token;
  } catch {
    return null;
  }
}

async function scrobble(track) {
  const token = await getToken();
  if (!token) {
    pendingQueue.push(track);
    return { queued: true };
  }

  const key = `${track.artist}|${track.title}`;
  const now = Date.now();
  if (key === lastScrobble.key && now - lastScrobble.at < DEBOUNCE_MS) {
    return { skipped: "debounce" };
  }

  try {
    const res = await fetch(`${API_BASE}/scrobbles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        track: track.title,
        artist: track.artist,
        album: track.album || null,
        duration: track.duration || null,
        source: track.source,
      }),
    });

    if (res.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        const retry = await fetch(`${API_BASE}/scrobbles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newToken}`,
          },
          body: JSON.stringify({
            track: track.title,
            artist: track.artist,
            album: track.album || null,
            duration: track.duration || null,
            source: track.source,
          }),
        });
        if (retry.ok) {
          lastScrobble = { key, at: now };
          updateBadge(track);
          return { ok: true, refreshed: true };
        }
      }
      pendingQueue.push(track);
      return { queued: true, reason: "auth_expired" };
    }

    lastScrobble = { key, at: now };
    updateBadge(track);
    return { ok: true };
  } catch (err) {
    pendingQueue.push(track);
    return { queued: true, reason: err.message };
  }
}

async function flushQueue() {
  const token = await getToken();
  if (!token || pendingQueue.length === 0) return;

  const batch = [...pendingQueue];
  pendingQueue = [];

  for (const track of batch) {
    await scrobble(track);
  }
}

function updateBadge(track) {
  scrobbleCount++;
  chrome.storage.local.set({
    owline_scrobble_count: scrobbleCount,
    owline_queue_count: pendingQueue.length,
  });
  chrome.action.setBadgeText({ text: String(scrobbleCount) });
  chrome.action.setBadgeBackgroundColor({ color: "#4ade80" });
  chrome.action.setTitle({ title: `${track.artist} - ${track.title}` });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "SCROBBLE_READY") {
    scrobble(msg.track).then(sendResponse);
    return true;
  }
  if (msg.type === "NOW_PLAYING") {
    chrome.storage.local.set({ owline_now_playing: msg.track });
    return false;
  }
  if (msg.type === "FLUSH_QUEUE") {
    flushQueue().then(() => sendResponse({ flushed: true }));
    return true;
  }
});

chrome.alarms.create("flush-queue", { periodInMinutes: 5 });
chrome.alarms.create("refresh-token", { periodInMinutes: 20 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "flush-queue") flushQueue();
  if (alarm.name === "refresh-token") refreshToken();
});

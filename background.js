const API_BASE = "https://api.owline.io/api/v1";
const SCROBBLE_THRESHOLD_MS = 30000;
const DEBOUNCE_MS = 5000;

let lastScrobble = { key: "", at: 0 };
let pendingQueue = [];

async function getToken() {
  const { owline_token } = await chrome.storage.local.get("owline_token");
  return owline_token || null;
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
  chrome.action.setBadgeText({ text: "1" });
  chrome.action.setBadgeBackgroundColor({ color: "#4ade80" });
  chrome.action.setTitle({
    title: `${track.artist} - ${track.title}`,
  });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 3000);
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
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "flush-queue") flushQueue();
});

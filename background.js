const API_BASE = "https://api.owline.io/api/v1";
const DEBOUNCE_MS = 5000;
const MAX_QUEUE = 200;
const MAX_FLUSH_ATTEMPTS = 3;

let lastScrobble = { key: "", at: 0 };
let pendingQueue = [];
let scrobbleCount = 0;
let flushAttempts = 0;

chrome.storage.local.get(["owline_scrobble_count", "owline_pending_queue"], (d) => {
  scrobbleCount = d.owline_scrobble_count || 0;
  pendingQueue = d.owline_pending_queue || [];
});

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

function buildScrobbleBody(track) {
  return JSON.stringify({
    track: track.title,
    artist: track.artist,
    album: track.album || null,
    duration: track.duration || null,
    source: track.source,
  });
}

async function postScrobble(token, track) {
  return fetch(`${API_BASE}/scrobbles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: buildScrobbleBody(track),
  });
}

function enqueue(track) {
  if (pendingQueue.length < MAX_QUEUE) {
    pendingQueue.push(track);
    chrome.storage.local.set({ owline_pending_queue: pendingQueue });
  }
}

async function scrobble(track) {
  const token = await getToken();
  if (!token) {
    enqueue(track);
    return { queued: true };
  }

  const key = `${track.artist}|${track.title}`;
  const now = Date.now();
  if (key === lastScrobble.key && now - lastScrobble.at < DEBOUNCE_MS) {
    return { skipped: "debounce" };
  }

  try {
    let res = await postScrobble(token, track);

    if (res.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        res = await postScrobble(newToken, track);
        if (res.ok) {
          lastScrobble = { key, at: now };
          updateBadge(track);
          return { ok: true, refreshed: true };
        }
      }
      enqueue(track);
      return { queued: true, reason: "auth_expired" };
    }

    lastScrobble = { key, at: now };
    updateBadge(track);
    return { ok: true };
  } catch (err) {
    enqueue(track);
    return { queued: true, reason: err.message };
  }
}

async function flushQueue() {
  const token = await getToken();
  if (!token || pendingQueue.length === 0) return;

  flushAttempts++;
  if (flushAttempts > MAX_FLUSH_ATTEMPTS) {
    flushAttempts = 0;
    return;
  }

  const batch = [...pendingQueue];
  pendingQueue = [];
  chrome.storage.local.set({ owline_pending_queue: [] });

  const failed = [];
  for (const track of batch) {
    try {
      const res = await postScrobble(token, track);
      if (res.ok) {
        scrobbleCount++;
      } else {
        failed.push(track);
      }
    } catch {
      failed.push(track);
    }
  }

  if (failed.length > 0) {
    pendingQueue = failed;
    chrome.storage.local.set({ owline_pending_queue: failed });
  } else {
    flushAttempts = 0;
  }

  chrome.storage.local.set({
    owline_scrobble_count: scrobbleCount,
    owline_queue_count: pendingQueue.length,
  });
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

const GOOGLE_CLIENT_ID = "55887450-l3337k4faqim9i5jspcljs3mqqo9m8ik.apps.googleusercontent.com";

async function googleLogin() {
  const redirectUrl = chrome.identity.getRedirectURL();
  const nonce = crypto.randomUUID();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("response_type", "id_token");
  authUrl.searchParams.set("redirect_uri", redirectUrl);
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("nonce", nonce);
  authUrl.searchParams.set("prompt", "select_account");

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  });

  const hash = new URL(responseUrl).hash.substring(1);
  const params = new URLSearchParams(hash);
  const idToken = params.get("id_token");
  if (!idToken) throw new Error("NO ID_TOKEN FROM GOOGLE");

  const oauthRes = await fetch(`${API_BASE}/auth/oauth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "google", token: idToken }),
  });

  if (!oauthRes.ok) {
    const err = await oauthRes.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${oauthRes.status}`);
  }

  const data = await oauthRes.json();
  const accessToken = data.access_token || data.token;
  if (!accessToken) throw new Error("NO TOKEN IN RESPONSE");

  await chrome.storage.local.set({
    owline_token: accessToken,
    owline_refresh: data.refresh_token || null,
  });

  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const meData = meRes.ok ? await meRes.json() : {};
  const user = meData.data || meData;
  await chrome.storage.local.set({ owline_user: user });

  return { ok: true, user };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GOOGLE_LOGIN") {
    googleLogin()
      .then((r) => sendResponse(r))
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }
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

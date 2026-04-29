importScripts(
  "shared/config.js",
  "shared/storage-keys.js",
  "shared/api.js",
  "shared/auth.js",
  "shared/providers.js",
  "shared/destinations.js",
  "shared/migrations.js",
);

const { CONFIG, KEYS, api, auth, destinations, migrations } = self.OWLINE;
const { DEBOUNCE_MS, MAX_QUEUE, MAX_FLUSH_ATTEMPTS, GOOGLE_CLIENT_ID } = CONFIG;

const bootReady = (async () => {
  await migrations.run();
  chrome.action.setBadgeText({ text: "" });
})();

async function loadQueue() {
  const data = await chrome.storage.local.get(KEYS.PENDING_QUEUE);
  return data[KEYS.PENDING_QUEUE] || [];
}

async function saveQueue(queue) {
  await chrome.storage.local.set({
    [KEYS.PENDING_QUEUE]: queue,
    [KEYS.QUEUE_COUNT]: queue.length,
  });
}

async function loadLastScrobble() {
  const data = await chrome.storage.local.get(KEYS.LAST_SCROBBLE);
  return data[KEYS.LAST_SCROBBLE] || { key: "", at: 0 };
}

async function saveLastScrobble(key, at) {
  await chrome.storage.local.set({ [KEYS.LAST_SCROBBLE]: { key, at } });
}

async function getFlushAttempts() {
  const data = await chrome.storage.local.get(KEYS.FLUSH_ATTEMPTS);
  return data[KEYS.FLUSH_ATTEMPTS] || 0;
}

async function setFlushAttempts(n) {
  await chrome.storage.local.set({ [KEYS.FLUSH_ATTEMPTS]: n });
}

function buildPayload(track) {
  return {
    track: track.title,
    artist: track.artist,
    album: track.album || null,
    cover_url: track.cover_url || null,
    duration: track.duration || null,
    source: track.source,
  };
}

function sanitizeLogEntry(entry) {
  const clean = { ...entry };
  delete clean.credentials;
  delete clean.token;
  delete clean.api_key;
  delete clean.api_secret;
  delete clean.session_key;
  return clean;
}

async function pushLog(entry) {
  const data = await chrome.storage.local.get(KEYS.LOGS);
  const logs = data[KEYS.LOGS] || [];
  logs.unshift({ at: Date.now(), ...sanitizeLogEntry(entry) });
  if (logs.length > CONFIG.MAX_LOGS) logs.length = CONFIG.MAX_LOGS;
  await chrome.storage.local.set({ [KEYS.LOGS]: logs });
}

async function bumpScrobbleCount(by = 1) {
  const data = await chrome.storage.local.get(KEYS.SCROBBLE_COUNT);
  const next = (data[KEYS.SCROBBLE_COUNT] || 0) + by;
  await chrome.storage.local.set({ [KEYS.SCROBBLE_COUNT]: next });
  return next;
}

async function enqueue(track) {
  const queue = await loadQueue();
  if (queue.length >= MAX_QUEUE) return;
  queue.push(track);
  await saveQueue(queue);
}

async function withAuthRetry(fn) {
  const token = await auth.getToken();
  if (!token) return { error: "no_token" };

  let res = await fn(token);
  if (res.status !== 401) return { res, token };

  const newToken = await auth.refreshAccessToken();
  if (!newToken) return { res, token, authExpired: true };

  res = await fn(newToken);
  return { res, token: newToken, refreshed: true };
}

async function updateBadge(track) {
  await bumpScrobbleCount(1);
  chrome.action.setTitle({ title: `${track.artist} - ${track.title}` });
}

async function scrobble(track) {
  await bootReady;

  const payload = buildPayload(track);
  const token = await auth.getToken();
  if (!token) {
    await enqueue(track);
    await pushLog({ status: "queued", reason: "no_token", payload });
    return { queued: true };
  }

  const key = `${track.artist}|${track.title}`;
  const now = Date.now();
  const last = await loadLastScrobble();
  if (key === last.key && now - last.at < DEBOUNCE_MS) {
    await pushLog({ status: "skipped", reason: "debounce", payload });
    return { skipped: "debounce" };
  }

  try {
    const { res, authExpired, refreshed } = await withAuthRetry((t) => api.postScrobble(t, track));

    if (authExpired || !res || !res.ok) {
      await enqueue(track);
      const reason = authExpired ? "auth_expired" : `http_${res?.status}`;
      await pushLog({ status: "queued", reason, httpStatus: res?.status || null, payload });
      return { queued: true, reason };
    }

    await saveLastScrobble(key, now);
    await updateBadge(track);

    const destResults = await destinations.dispatch(track);
    await pushLog({ status: "sent", httpStatus: res.status, refreshed: !!refreshed, destinations: destResults, payload });

    return refreshed ? { ok: true, refreshed: true, destinations: destResults } : { ok: true, destinations: destResults };
  } catch (err) {
    await enqueue(track);
    await pushLog({ status: "queued", reason: err.message, payload });
    return { queued: true, reason: err.message };
  }
}

async function flushQueue() {
  await bootReady;

  const token = await auth.getToken();
  let queue = await loadQueue();
  if (!token || queue.length === 0) return;

  let attempts = await getFlushAttempts();
  attempts++;
  if (attempts > MAX_FLUSH_ATTEMPTS) {
    await setFlushAttempts(0);
    return;
  }
  await setFlushAttempts(attempts);

  const batch = [...queue];
  await saveQueue([]);

  const failed = [];
  let succeeded = 0;
  let currentToken = token;
  for (const track of batch) {
    const payload = buildPayload(track);
    try {
      let res = await api.postScrobble(currentToken, track);
      if (res.status === 401) {
        const refreshed = await auth.refreshAccessToken();
        if (refreshed) {
          currentToken = refreshed;
          res = await api.postScrobble(currentToken, track);
        }
      }
      if (res.ok) {
        succeeded++;
        const destResults = await destinations.dispatch(track);
        await pushLog({ status: "flushed", httpStatus: res.status, destinations: destResults, payload });
      } else {
        failed.push(track);
        await pushLog({ status: "queued", reason: `http_${res.status}`, httpStatus: res.status, payload });
      }
    } catch (err) {
      failed.push(track);
      await pushLog({ status: "queued", reason: err.message, payload });
    }
  }

  if (succeeded > 0) await bumpScrobbleCount(succeeded);
  await saveQueue(failed);
  if (failed.length === 0) await setFlushAttempts(0);
}

async function googleLogin() {
  await bootReady;

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
  const idToken = new URLSearchParams(hash).get("id_token");
  if (!idToken) throw new Error("NO ID_TOKEN FROM GOOGLE");

  const data = await api.oauth("google", idToken);
  const accessToken = api.extractToken(data);
  if (!accessToken) throw new Error("NO TOKEN IN RESPONSE");

  await auth.setSession({ token: accessToken, refresh: data.refresh_token || null });

  const user = await api.me(accessToken);
  await auth.setSession({ user });

  return { ok: true, user };
}

const HANDLERS = {
  GOOGLE_LOGIN: (_msg, sendResponse) => {
    googleLogin().then(sendResponse).catch((e) => sendResponse({ error: e.message }));
    return true;
  },
  SCROBBLE_READY: (msg, sendResponse) => {
    scrobble(msg.track).then(sendResponse).catch((e) => sendResponse({ error: e.message }));
    return true;
  },
  NOW_PLAYING: (msg) => {
    if (msg.track) {
      chrome.storage.local.set({ [KEYS.NOW_PLAYING]: msg.track });
    } else {
      chrome.storage.local.remove(KEYS.NOW_PLAYING);
    }
    return false;
  },
  FLUSH_QUEUE: (_msg, sendResponse) => {
    flushQueue().then(() => sendResponse({ flushed: true }));
    return true;
  },
  SET_DESTINATION: (msg, sendResponse) => {
    const { id, enabled, credentials } = msg;
    if (!CONFIG.DESTINATIONS[id]) {
      sendResponse({ error: "unknown_destination" });
      return true;
    }
    (async () => {
      if (credentials !== undefined) await destinations.setCredentials(id, credentials);
      if (enabled !== undefined) await destinations.setEnabled(id, enabled);
      sendResponse({ ok: true });
    })().catch((e) => sendResponse({ error: e.message }));
    return true;
  },
  CLEAR_DESTINATION: (msg, sendResponse) => {
    if (!CONFIG.DESTINATIONS[msg.id]) {
      sendResponse({ error: "unknown_destination" });
      return true;
    }
    destinations.clearCredentials(msg.id).then(() => sendResponse({ ok: true }));
    return true;
  },
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const handler = HANDLERS[msg.type];
  return handler ? handler(msg, sendResponse) : false;
});

chrome.alarms.create("flush-queue", { periodInMinutes: CONFIG.FLUSH_PERIOD_MIN });
chrome.alarms.create("refresh-token", { periodInMinutes: CONFIG.REFRESH_PERIOD_MIN });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "flush-queue") flushQueue().catch(() => {});
  if (alarm.name === "refresh-token") auth.refreshAccessToken().catch(() => {});
});

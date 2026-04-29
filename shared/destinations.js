(function () {
  const root = typeof self !== "undefined" ? self : globalThis;
  root.OWLINE = root.OWLINE || {};
  const { CONFIG, KEYS } = root.OWLINE;

  async function getAll() {
    const data = await chrome.storage.local.get(KEYS.DESTINATIONS);
    const stored = data[KEYS.DESTINATIONS] || {};
    const result = {};
    for (const [id, meta] of Object.entries(CONFIG.DESTINATIONS)) {
      result[id] = {
        enabled: stored[id]?.enabled ?? meta.default,
        credentials: stored[id]?.credentials || null,
      };
    }
    return result;
  }

  async function get(id) {
    const all = await getAll();
    return all[id] || null;
  }

  async function setEnabled(id, enabled) {
    const all = await getAll();
    if (!all[id]) return;
    all[id].enabled = !!enabled;
    await chrome.storage.local.set({ [KEYS.DESTINATIONS]: all });
  }

  async function setCredentials(id, credentials) {
    const all = await getAll();
    if (!all[id]) return;
    all[id].credentials = credentials;
    await chrome.storage.local.set({ [KEYS.DESTINATIONS]: all });
  }

  async function clearCredentials(id) {
    const all = await getAll();
    if (!all[id]) return;
    all[id].credentials = null;
    all[id].enabled = false;
    await chrome.storage.local.set({ [KEYS.DESTINATIONS]: all });
  }

  async function enabledList() {
    const all = await getAll();
    return Object.entries(all)
      .filter(([, v]) => v.enabled && (v.credentials || CONFIG.DESTINATIONS[v]?.auth === "owline"))
      .map(([id]) => id);
  }

  async function sendToLastfm(track, credentials) {
    if (!credentials?.api_key || !credentials?.api_secret || !credentials?.session_key) {
      return { error: "lastfm_not_configured" };
    }

    const params = {
      method: "track.scrobble",
      api_key: credentials.api_key,
      sk: credentials.session_key,
      "artist[0]": track.artist,
      "track[0]": track.title,
      "timestamp[0]": Math.floor(Date.now() / 1000).toString(),
    };
    if (track.album) params["album[0]"] = track.album;
    if (track.duration) params["duration[0]"] = String(track.duration);

    const sorted = Object.keys(params).sort();
    let sig = "";
    for (const k of sorted) sig += k + params[k];
    sig += credentials.api_secret;

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("MD5", encoder.encode(sig)).catch(() => null);

    let api_sig;
    if (hashBuffer) {
      api_sig = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } else {
      return { error: "md5_unavailable" };
    }

    params.api_sig = api_sig;
    params.format = "json";

    const body = new URLSearchParams(params);
    const res = await fetch(CONFIG.LASTFM_API_URL, { method: "POST", body });
    if (!res.ok) return { error: `lastfm_http_${res.status}` };
    return { ok: true };
  }

  async function sendToListenBrainz(track, credentials) {
    if (!credentials?.token) {
      return { error: "listenbrainz_not_configured" };
    }

    const payload = {
      listen_type: "single",
      payload: [
        {
          listened_at: Math.floor(Date.now() / 1000),
          track_metadata: {
            artist_name: track.artist,
            track_name: track.title,
            release_name: track.album || undefined,
            additional_info: {
              listening_from: "owline_scrobbler",
              duration_ms: track.duration ? track.duration * 1000 : undefined,
            },
          },
        },
      ],
    };

    const res = await fetch(`${CONFIG.LISTENBRAINZ_API_URL}/1/submit-listens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${credentials.token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { error: `listenbrainz_http_${res.status}` };
    return { ok: true };
  }

  const SENDERS = {
    lastfm: sendToLastfm,
    listenbrainz: sendToListenBrainz,
  };

  async function dispatch(track) {
    const all = await getAll();
    const results = {};

    for (const [id, state] of Object.entries(all)) {
      if (!state.enabled) continue;
      if (id === "owline") continue;
      const sender = SENDERS[id];
      if (!sender) continue;
      if (!state.credentials) {
        results[id] = { error: `${id}_not_configured` };
        continue;
      }
      try {
        results[id] = await sender(track, state.credentials);
      } catch (err) {
        results[id] = { error: err.message };
      }
    }

    return results;
  }

  root.OWLINE.destinations = {
    getAll,
    get,
    setEnabled,
    setCredentials,
    clearCredentials,
    enabledList,
    dispatch,
    sendToLastfm,
    sendToListenBrainz,
  };
})();

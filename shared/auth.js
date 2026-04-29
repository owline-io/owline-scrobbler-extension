(function () {
  const root = typeof self !== "undefined" ? self : globalThis;
  root.OWLINE = root.OWLINE || {};
  const { KEYS, SESSION_KEYS, api } = root.OWLINE;

  async function getToken() {
    const data = await chrome.storage.local.get(KEYS.TOKEN);
    return data[KEYS.TOKEN] || null;
  }

  async function getRefresh() {
    const data = await chrome.storage.local.get(KEYS.REFRESH);
    return data[KEYS.REFRESH] || null;
  }

  async function setSession({ token, refresh, user }) {
    const payload = {};
    if (token !== undefined) payload[KEYS.TOKEN] = token;
    if (refresh !== undefined) payload[KEYS.REFRESH] = refresh;
    if (user !== undefined) payload[KEYS.USER] = user;
    await chrome.storage.local.set(payload);
  }

  async function clearSession() {
    await chrome.storage.local.remove(SESSION_KEYS);
    await chrome.storage.local.remove(KEYS.DESTINATIONS);
  }

  async function refreshAccessToken() {
    const stored = await getRefresh();
    if (!stored) return null;
    try {
      const data = await api.refresh(stored);
      if (!data) return null;
      const token = api.extractToken(data);
      if (!token) return null;
      await setSession({
        token,
        refresh: data.refresh_token || undefined,
      });
      return token;
    } catch {
      return null;
    }
  }

  root.OWLINE.auth = {
    getToken,
    getRefresh,
    setSession,
    clearSession,
    refreshAccessToken,
  };
})();

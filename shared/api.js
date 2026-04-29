(function () {
  const root = typeof self !== "undefined" ? self : globalThis;
  root.OWLINE = root.OWLINE || {};
  const { CONFIG } = root.OWLINE;

  function extractToken(data) {
    return data?.access_token || data?.token || null;
  }

  function extractUser(data) {
    return data?.data || data || null;
  }

  async function call(path, { method = "GET", token = null, body = null } = {}) {
    const headers = {};
    if (body) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;

    return fetch(`${CONFIG.API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async function login(email, password) {
    const res = await call("/auth/login", { method: "POST", body: { email, password } });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function oauth(provider, token) {
    const res = await call("/auth/oauth", { method: "POST", body: { provider, token } });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function refresh(refreshToken) {
    const res = await call("/auth/refresh", { method: "POST", body: { refresh_token: refreshToken } });
    if (!res.ok) return null;
    return res.json();
  }

  async function me(token) {
    const res = await call("/auth/me", { token });
    if (!res.ok) return null;
    const data = await res.json();
    return extractUser(data);
  }

  async function logout(token) {
    return call("/auth/logout", { method: "POST", token });
  }

  async function postScrobble(token, track) {
    return call("/scrobbles", {
      method: "POST",
      token,
      body: {
        track: track.title,
        artist: track.artist,
        album: track.album || null,
        duration: track.duration || null,
        source: track.source,
      },
    });
  }

  root.OWLINE.api = {
    call,
    extractToken,
    extractUser,
    login,
    oauth,
    refresh,
    me,
    logout,
    postScrobble,
  };
})();

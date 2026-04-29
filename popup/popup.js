const API_BASE = "https://api.owline.io/api/v1";

const $ = (sel) => document.querySelector(sel);

async function init() {
  const stored = await chrome.storage.local.get(null);

  if (stored.owline_token && stored.owline_user) {
    showMain(stored.owline_user);
  } else if (stored.owline_token) {
    try {
      const meRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${stored.owline_token}` },
      });
      const meData = meRes.ok ? await meRes.json() : null;
      const user = meData?.data || meData;
      if (user && user.username) {
        await chrome.storage.local.set({ owline_user: user });
        showMain(user);
      } else {
        showLogin();
      }
    } catch {
      showLogin();
    }
  } else {
    showLogin();
  }

  pollStatus();
}

function showLogin() {
  $("#login-section").classList.remove("hidden");
  $("#main-section").classList.add("hidden");
  $("#status-dot").classList.add("dot-red");
  $("#status-dot").classList.remove("dot-green");
}

function showMain(user) {
  $("#login-section").classList.add("hidden");
  $("#main-section").classList.remove("hidden");
  $("#status-dot").classList.add("dot-green");
  $("#status-dot").classList.remove("dot-red");
  $("#username").textContent = `@${user.username || "unknown"}`;
}

async function pollStatus() {
  const data = await chrome.storage.local.get([
    "owline_now_playing",
    "owline_scrobble_count",
    "owline_queue_count",
  ]);

  if (data.owline_now_playing && data.owline_now_playing.title) {
    const np = $("#now-playing");
    np.classList.remove("empty");
    np.innerHTML = `
      <div class="now-playing">
        ${escapeHtml(data.owline_now_playing.title)}
        <div class="artist">${escapeHtml(data.owline_now_playing.artist)} &middot; ${escapeHtml(data.owline_now_playing.source).toUpperCase()}</div>
      </div>
    `;
  }

  $("#scrobble-count").textContent = data.owline_scrobble_count || 0;
  $("#queue-count").textContent = data.owline_queue_count || 0;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

$("#login-btn").addEventListener("click", async () => {
  const email = $("#email").value.trim();
  const password = $("#password").value;
  const errorEl = $("#login-error");

  if (!email || !password) {
    errorEl.textContent = "EMAIL AND PASSWORD REQUIRED";
    errorEl.classList.remove("hidden");
    return;
  }

  $("#login-btn").disabled = true;
  $("#login-btn").textContent = "SIGNING IN...";
  errorEl.classList.add("hidden");

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const token = data.access_token || data.token;
    if (!token) throw new Error("NO TOKEN IN RESPONSE");

    await chrome.storage.local.set({
      owline_token: token,
      owline_refresh: data.refresh_token || null,
    });

    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = meRes.ok ? await meRes.json() : {};
    const user = meData.data || meData;

    await chrome.storage.local.set({ owline_user: user });

    showMain(user);
    chrome.runtime.sendMessage({ type: "FLUSH_QUEUE" });
  } catch (err) {
    errorEl.textContent = err.message.toUpperCase();
    errorEl.classList.remove("hidden");
  } finally {
    $("#login-btn").disabled = false;
    $("#login-btn").textContent = "[ SIGN IN ]";
  }
});

const GOOGLE_CLIENT_ID = "55887450-jpfnthtv3sp0321b1hdidq4c2maiddb0.apps.googleusercontent.com";

$("#google-btn").addEventListener("click", async () => {
  const errorEl = $("#login-error");
  $("#google-btn").disabled = true;
  errorEl.classList.add("hidden");

  try {
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

    showMain(user);
    chrome.runtime.sendMessage({ type: "FLUSH_QUEUE" });
  } catch (err) {
    errorEl.textContent = err.message.toUpperCase();
    errorEl.classList.remove("hidden");
  } finally {
    $("#google-btn").disabled = false;
  }
});

$("#logout-btn").addEventListener("click", async () => {
  await chrome.storage.local.remove([
    "owline_token",
    "owline_refresh",
    "owline_user",
    "owline_now_playing",
  ]);
  showLogin();
});

init();

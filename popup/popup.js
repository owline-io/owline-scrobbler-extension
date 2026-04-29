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
    np.textContent = "";
    const wrap = document.createElement("div");
    wrap.className = "now-playing";
    const titleSpan = document.createElement("span");
    titleSpan.textContent = data.owline_now_playing.title;
    const artistDiv = document.createElement("div");
    artistDiv.className = "artist";
    artistDiv.textContent = `${data.owline_now_playing.artist} \u00B7 ${(data.owline_now_playing.source || "").toUpperCase()}`;
    wrap.appendChild(titleSpan);
    wrap.appendChild(artistDiv);
    np.appendChild(wrap);
  }

  $("#scrobble-count").textContent = data.owline_scrobble_count || 0;
  $("#queue-count").textContent = data.owline_queue_count || 0;
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

$("#google-btn").addEventListener("click", async () => {
  const errorEl = $("#login-error");
  $("#google-btn").disabled = true;
  $("#google-btn").textContent = "SIGNING IN...";
  errorEl.classList.add("hidden");

  chrome.runtime.sendMessage({ type: "GOOGLE_LOGIN" }, (res) => {
    if (res && res.ok) {
      showMain(res.user);
    } else {
      errorEl.textContent = (res?.error || "GOOGLE LOGIN FAILED").toUpperCase();
      errorEl.classList.remove("hidden");
    }
    $("#google-btn").disabled = false;
    $("#google-btn").textContent = "SIGN IN WITH GOOGLE";
  });
});

$("#logout-btn").addEventListener("click", async () => {
  const token = await chrome.storage.local.get("owline_token");
  if (token.owline_token) {
    fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token.owline_token}` },
    }).catch(() => {});
  }
  await chrome.storage.local.remove([
    "owline_token",
    "owline_refresh",
    "owline_user",
    "owline_now_playing",
    "owline_scrobble_count",
    "owline_queue_count",
    "owline_pending_queue",
  ]);
  showLogin();
});

init();

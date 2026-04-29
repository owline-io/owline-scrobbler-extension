const API_BASE = "https://api.owline.io/api/v1";

const $ = (sel) => document.querySelector(sel);

async function init() {
  const { owline_token, owline_user } = await chrome.storage.local.get([
    "owline_token",
    "owline_user",
  ]);

  if (owline_token && owline_user) {
    showMain(owline_user);
  } else {
    showLogin();
  }

  pollNowPlaying();
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

async function pollNowPlaying() {
  const { owline_now_playing } = await chrome.storage.local.get("owline_now_playing");
  if (owline_now_playing && owline_now_playing.title) {
    const np = $("#now-playing");
    np.classList.remove("empty");
    np.innerHTML = `
      <div class="now-playing">
        ${escapeHtml(owline_now_playing.title)}
        <div class="artist">${escapeHtml(owline_now_playing.artist)} &middot; ${escapeHtml(owline_now_playing.source).toUpperCase()}</div>
      </div>
    `;
  }
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

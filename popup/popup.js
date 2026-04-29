const { CONFIG, KEYS, api, auth, providers, migrations } = window.OWLINE;
const $ = (sel) => document.querySelector(sel);

async function init() {
  await migrations.run();

  const stored = await chrome.storage.local.get(null);

  if (stored[KEYS.TOKEN] && stored[KEYS.USER]) {
    showMain(stored[KEYS.USER]);
  } else if (stored[KEYS.TOKEN]) {
    try {
      const user = await api.me(stored[KEYS.TOKEN]);
      if (user && user.username) {
        await auth.setSession({ user });
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
  renderProviders();
}

async function renderProviders() {
  const settings = await providers.get();
  const container = $("#providers");
  container.textContent = "";

  for (const name of CONFIG.PROVIDERS) {
    const row = document.createElement("div");
    row.className = "provider-row";

    const label = document.createElement("span");
    label.textContent = name;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "toggle" + (settings[name] ? " on" : "");
    toggle.setAttribute("aria-label", `Toggle ${name}`);
    toggle.addEventListener("click", async () => {
      const next = !toggle.classList.contains("on");
      toggle.classList.toggle("on", next);
      await providers.setEnabled(name, next);
    });

    row.appendChild(label);
    row.appendChild(toggle);
    container.appendChild(row);
  }
}

async function pollStatus() {
  const data = await chrome.storage.local.get([
    KEYS.NOW_PLAYING,
    KEYS.SCROBBLE_COUNT,
    KEYS.QUEUE_COUNT,
  ]);

  const np = $("#now-playing");
  const raw = data[KEYS.NOW_PLAYING];
  const fresh = raw && raw.at && (Date.now() - raw.at) < CONFIG.NOW_PLAYING_TTL_MS;
  const track = fresh ? raw : null;
  np.textContent = "";
  if (track && track.title) {
    np.classList.remove("empty");
    const wrap = document.createElement("div");
    wrap.className = "now-playing";
    const titleSpan = document.createElement("span");
    titleSpan.textContent = track.title;
    const artistDiv = document.createElement("div");
    artistDiv.className = "artist";
    artistDiv.textContent = `${track.artist} · ${(track.source || "").toUpperCase()}`;
    wrap.appendChild(titleSpan);
    wrap.appendChild(artistDiv);
    np.appendChild(wrap);
  } else {
    np.classList.add("empty");
    np.textContent = "NOTHING DETECTED";
  }

  $("#scrobble-count").textContent = data[KEYS.SCROBBLE_COUNT] || 0;
  $("#queue-count").textContent = data[KEYS.QUEUE_COUNT] || 0;
}

function setBusy(btn, busyText, idleText) {
  return {
    start() { btn.disabled = true; btn.textContent = busyText; },
    stop() { btn.disabled = false; btn.textContent = idleText; },
  };
}

function showError(msg) {
  const errorEl = $("#login-error");
  errorEl.textContent = msg.toUpperCase();
  errorEl.classList.remove("hidden");
}

function hideError() {
  const errorEl = $("#login-error");
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

$("#login-btn").addEventListener("click", async () => {
  const email = $("#email").value.trim();
  const password = $("#password").value;

  if (!email || !password) {
    showError("EMAIL AND PASSWORD REQUIRED");
    return;
  }

  const busy = setBusy($("#login-btn"), "SIGNING IN...", "[ SIGN IN ]");
  busy.start();
  hideError();

  try {
    const data = await api.login(email, password);
    const token = api.extractToken(data);
    if (!token) throw new Error("NO TOKEN IN RESPONSE");

    await auth.setSession({ token, refresh: data.refresh_token || null });

    const user = await api.me(token);
    await auth.setSession({ user });

    showMain(user);
    chrome.runtime.sendMessage({ type: "FLUSH_QUEUE" });
  } catch (err) {
    showError(err.message);
  } finally {
    busy.stop();
  }
});

$("#google-btn").addEventListener("click", () => {
  const busy = setBusy($("#google-btn"), "SIGNING IN...", "SIGN IN WITH GOOGLE");
  busy.start();
  hideError();

  chrome.runtime.sendMessage({ type: "GOOGLE_LOGIN" }, (res) => {
    if (res && res.ok) {
      showMain(res.user);
    } else {
      showError(res?.error || "GOOGLE LOGIN FAILED");
    }
    busy.stop();
  });
});

$("#logout-btn").addEventListener("click", async () => {
  const token = await auth.getToken();
  if (token) api.logout(token).catch(() => {});
  await auth.clearSession();
  showLogin();
});

init();

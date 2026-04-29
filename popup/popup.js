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

function renderProviderList(container, names, settings) {
  container.textContent = "";
  for (const name of names) {
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

async function renderProviders() {
  const settings = await providers.get();
  const cats = CONFIG.PROVIDER_CATEGORIES;
  renderProviderList($("#providers-players"), cats.players, settings);
  renderProviderList($("#providers-trackers"), cats.trackers, settings);
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

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".tab-panel").forEach((p) => {
      p.classList.toggle("hidden", p.id !== `tab-${target}`);
    });
    if (target === "logs") renderLogs();
  });
});

function formatTime(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

async function renderLogs() {
  const data = await chrome.storage.local.get(KEYS.LOGS);
  const logs = data[KEYS.LOGS] || [];
  const container = $("#logs");
  container.textContent = "";

  if (logs.length === 0) {
    const empty = document.createElement("div");
    empty.className = "log-empty";
    empty.textContent = "NO LOGS YET";
    container.appendChild(empty);
    return;
  }

  for (const entry of logs) {
    const card = document.createElement("div");
    card.className = "log";

    const head = document.createElement("div");
    head.className = "log-head";

    const status = document.createElement("span");
    status.className = `log-status ${entry.status}`;
    status.textContent = entry.status;

    const track = document.createElement("span");
    track.className = "log-track";
    track.textContent = entry.payload
      ? `${entry.payload.artist} · ${entry.payload.track}`
      : "—";

    const time = document.createElement("span");
    time.className = "log-time";
    time.textContent = formatTime(entry.at);

    head.appendChild(status);
    head.appendChild(track);
    head.appendChild(time);

    const body = document.createElement("pre");
    body.className = "log-body hidden";
    body.textContent = JSON.stringify(entry, null, 2);

    head.addEventListener("click", () => {
      body.classList.toggle("hidden");
    });

    card.appendChild(head);
    card.appendChild(body);
    container.appendChild(card);
  }
}

$("#logs-clear").addEventListener("click", async () => {
  await chrome.storage.local.remove(KEYS.LOGS);
  renderLogs();
});

$("#logs-download").addEventListener("click", async () => {
  const data = await chrome.storage.local.get(KEYS.LOGS);
  const logs = data[KEYS.LOGS] || [];
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const a = document.createElement("a");
  a.href = url;
  a.download = `owline-logs-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

$("#logout-btn").addEventListener("click", async () => {
  const token = await auth.getToken();
  if (token) api.logout(token).catch(() => {});
  await auth.clearSession();
  showLogin();
});

init();

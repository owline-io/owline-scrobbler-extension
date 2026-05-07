const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function createDOM(_html = "") {
  const elements = {};
  let mediaList = [];

  function createElement(tag, attrs = {}, text = "") {
    const el = {
      tagName: tag.toUpperCase(),
      textContent: text,
      getAttribute: (k) => attrs[k] || null,
      setAttribute: (k, v) => { attrs[k] = v; },
      classList: {
        _set: new Set(attrs.class ? attrs.class.split(" ") : []),
        contains(c) { return this._set.has(c); },
        add(c) { this._set.add(c); },
        remove(c) { this._set.delete(c); },
        toggle(c, force) {
          if (force === undefined) {
            if (this._set.has(c)) this._set.delete(c); else this._set.add(c);
          } else if (force) this._set.add(c); else this._set.delete(c);
        },
      },
      style: attrs.style || {},
      src: attrs.src || null,
      alt: attrs.alt || null,
      querySelector: () => null,
      children: [],
    };
    return el;
  }

  function register(selector, el) {
    elements[selector] = el;
  }

  function querySelector(sel) {
    return elements[sel] || null;
  }

  function querySelectorAll(sel) {
    if (sel === "audio, video" || sel === "audio,video") {
      return mediaList;
    }
    const single = elements[sel];
    return single ? [single] : [];
  }

  function setMediaList(list) { mediaList = list; }

  return { createElement, register, querySelector, querySelectorAll, setMediaList };
}

function loadProvider(providerFile, domSetup) {
  const dom = createDOM();
  if (domSetup) domSetup(dom);

  const waitForPlayerCalls = [];
  const ctx = {
    window: {
      OWLINE: { CONFIG: { POLL_INTERVAL_MS: 3000, SCROBBLE_AT_MS: 30000, MIN_LISTEN_FRACTION: 0.5, MAX_TRACK_DURATION: 1200, WAIT_PLAYER_RETRY_MS: 2000, PROVIDER_DISABLED_RETRY_MS: 3000 }, KEYS: {} },
      __owlineScrobblerActive: false,
    },
    document: {
      querySelector: (sel) => dom.querySelector(sel),
      querySelectorAll: (sel) => dom.querySelectorAll(sel),
    },
    location: { hostname: "", search: "", pathname: "" },
    chrome: {
      runtime: { id: "test", sendMessage: () => {} },
      storage: { local: { get: (_k, cb) => { if (cb) cb({}); return Promise.resolve({}); } }, onChanged: { addListener: () => {} } },
    },
    getComputedStyle: () => ({ backgroundImage: "" }),
    setInterval: () => 0,
    clearInterval: () => {},
    setTimeout: () => 0,
    Date,
    Number,
    String,
    Math,
    parseDurationText: (text) => {
      if (!text) return null;
      const cleaned = String(text).replace("-", "").trim();
      const parts = cleaned.split(":").map(Number);
      if (parts.some(Number.isNaN)) return null;
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      return null;
    },
    waitForPlayer: (opts) => { waitForPlayerCalls.push(opts); },
    __owlineProviderListeners: new Map(),
    isProviderEnabledSync: () => {},
    createScrobbler: () => {},
    anyMediaPlaying: () => {
      // Mirror base.js helper for tests.
      const els = (ctx.document.querySelectorAll && ctx.document.querySelectorAll("audio, video")) || [];
      for (const el of els) {
        if (el && !el.paused && !el.ended && (el.currentTime || 0) > 0 && (el.readyState == null || el.readyState > 2)) {
          return true;
        }
      }
      return false;
    },
    labelMatches: (label, kind) => {
      const tokens = {
        pause: ["pause", "pausa", "pausar", "pausieren", "anhalten", "pauzeren", "pauze", "wstrzymaj", "pozastavit", "keskeytä", "duraklat", "szünet", "παύση", "пауза", "приостановить", "призупинити", "暂停", "暫停", "一時停止", "일시중지", "일시 중지", "หยุด", "tạm dừng", "jeda", "השהה", "إيقاف", "रोकें"],
        play: ["play", "lecture", "lire", "abspielen", "wiedergeben", "reproducir", "reproduzir", "riproduci", "afspelen", "spela", "afspil", "spille", "toista", "odtwórz", "přehrát", "lejátszás", "oynat", "αναπαραγωγή", "воспроизвести", "відтворити", "播放", "再生", "재생", "เล่น", "phát", "putar", "נגן", "تشغيل", "चलाएँ"],
      }[kind] || [];
      if (!label) return false;
      const l = String(label).toLowerCase();
      return tokens.some((t) => l.includes(t.toLowerCase()));
    },
  };

  vm.createContext(ctx);
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "content", "providers", providerFile), "utf8");
  vm.runInContext(src, ctx);

  return { ctx, dom, waitForPlayerCalls };
}

module.exports = { createDOM, loadProvider };

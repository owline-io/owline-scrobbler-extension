(function () {
  const root = typeof self !== "undefined" ? self : globalThis;
  root.OWLINE = root.OWLINE || {};
  const { CONFIG, KEYS } = root.OWLINE;

  const MIGRATIONS = {
    2: async function () {
      const data = await chrome.storage.local.get(KEYS.DESTINATIONS);
      if (!data[KEYS.DESTINATIONS]) {
        const defaults = {};
        for (const [id, meta] of Object.entries(CONFIG.DESTINATIONS)) {
          defaults[id] = { enabled: meta.default, credentials: null };
        }
        await chrome.storage.local.set({ [KEYS.DESTINATIONS]: defaults });
      }
    },
  };

  async function run() {
    const data = await chrome.storage.local.get(KEYS.STORAGE_VERSION);
    const current = data[KEYS.STORAGE_VERSION] || 0;
    const target = CONFIG.STORAGE_VERSION;

    if (current === target) return;

    for (let v = current + 1; v <= target; v++) {
      const fn = MIGRATIONS[v];
      if (fn) await fn();
    }

    await chrome.storage.local.set({ [KEYS.STORAGE_VERSION]: target });
  }

  root.OWLINE.migrations = { run };
})();

(function () {
  const root = typeof self !== "undefined" ? self : globalThis;
  root.OWLINE = root.OWLINE || {};
  const { CONFIG, KEYS } = root.OWLINE;

  async function get() {
    const data = await chrome.storage.local.get(KEYS.PROVIDERS);
    const stored = data[KEYS.PROVIDERS] || {};
    const settings = {};
    for (const p of CONFIG.PROVIDERS) {
      settings[p] = stored[p] !== false;
    }
    return settings;
  }

  async function isEnabled(name) {
    const settings = await get();
    return settings[name] !== false;
  }

  async function setEnabled(name, enabled) {
    const settings = await get();
    settings[name] = !!enabled;
    await chrome.storage.local.set({ [KEYS.PROVIDERS]: settings });
    return settings;
  }

  root.OWLINE.providers = { get, isEnabled, setEnabled };
})();

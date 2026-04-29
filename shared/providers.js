(function () {
  const root = typeof self !== "undefined" ? self : globalThis;
  root.OWLINE = root.OWLINE || {};
  const { CONFIG, KEYS } = root.OWLINE;

  function allProviderNames() {
    const cats = CONFIG.PROVIDER_CATEGORIES || {};
    const names = new Set(CONFIG.PROVIDERS || []);
    for (const list of Object.values(cats)) {
      for (const p of list) names.add(p);
    }
    return [...names];
  }

  async function get() {
    const data = await chrome.storage.local.get(KEYS.PROVIDERS);
    const stored = data[KEYS.PROVIDERS] || {};
    const settings = {};
    const defaultOff = new Set(CONFIG.PROVIDERS_DEFAULT_OFF || []);
    for (const p of allProviderNames()) {
      if (stored[p] !== undefined) {
        settings[p] = !!stored[p];
      } else {
        settings[p] = !defaultOff.has(p);
      }
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

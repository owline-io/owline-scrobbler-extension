const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadProviders(storedProviders = {}) {
  const storage = { owline_providers: storedProviders };
  const ctx = {
    self: {},
    chrome: {
      storage: {
        local: {
          get(_key, cb) { if (cb) cb(storage); return Promise.resolve(storage); },
          set(data) { Object.assign(storage, data); return Promise.resolve(); },
        },
      },
    },
  };
  vm.createContext(ctx);
  for (const f of ["config.js", "storage-keys.js", "providers.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "shared", f), "utf8"), ctx);
  }
  return ctx.self.OWLINE;
}

test("get returns all providers enabled by default", async () => {
  const { providers, CONFIG } = loadProviders();
  const settings = await providers.get();
  for (const p of CONFIG.PROVIDERS) {
    assert.equal(settings[p], true, `${p} should be enabled`);
  }
});

test("get returns trackers enabled by default", async () => {
  const { providers } = loadProviders();
  const settings = await providers.get();
  assert.equal(settings.owline, true);
});

test("unknown provider not in settings", async () => {
  const { providers } = loadProviders();
  const settings = await providers.get();
  assert.equal(settings.nonexistent, undefined);
});

test("stored override takes precedence", async () => {
  const { providers } = loadProviders({ spotify: false });
  const settings = await providers.get();
  assert.equal(settings.spotify, false);
});

test("setEnabled persists change", async () => {
  const { providers } = loadProviders();
  await providers.setEnabled("spotify", false);
  const settings = await providers.get();
  assert.equal(settings.spotify, false);
});

test("isEnabled returns true for enabled provider", async () => {
  const { providers } = loadProviders();
  assert.equal(await providers.isEnabled("spotify"), true);
});

test("isEnabled returns false for disabled provider", async () => {
  const { providers } = loadProviders({ youtube: false });
  assert.equal(await providers.isEnabled("youtube"), false);
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function load(initialStorage = {}) {
  const storage = { ...initialStorage };
  const ctx = {
    self: {},
    Object,
    Promise,
    chrome: {
      storage: {
        local: {
          get(_key) { return Promise.resolve(storage); },
          set(data) { Object.assign(storage, data); return Promise.resolve(); },
        },
      },
    },
  };
  vm.createContext(ctx);
  for (const f of ["config.js", "storage-keys.js", "migrations.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "shared", f), "utf8"), ctx);
  }
  return { migrations: ctx.self.OWLINE.migrations, CONFIG: ctx.self.OWLINE.CONFIG, storage };
}

test("run sets storage version to target", async () => {
  const { migrations, CONFIG, storage } = load();
  await migrations.run();
  assert.equal(storage.owline_storage_version, CONFIG.STORAGE_VERSION);
});

test("run is idempotent", async () => {
  const { migrations, CONFIG, storage } = load({ owline_storage_version: 2 });
  await migrations.run();
  assert.equal(storage.owline_storage_version, CONFIG.STORAGE_VERSION);
});

test("run creates destinations defaults on fresh install", async () => {
  const { migrations, storage } = load();
  await migrations.run();
  assert.ok(storage.owline_destinations);
  assert.equal(storage.owline_destinations.owline.enabled, true);
  assert.equal(storage.owline_destinations.lastfm.enabled, false);
});

test("run does not overwrite existing destinations", async () => {
  const existing = {
    owline: { enabled: true, credentials: null },
    lastfm: { enabled: true, credentials: { api_key: "test" } },
    listenbrainz: { enabled: false, credentials: null },
  };
  const { migrations, storage } = load({
    owline_storage_version: 1,
    owline_destinations: existing,
  });
  await migrations.run();
  assert.equal(storage.owline_destinations.lastfm.enabled, true);
  assert.equal(storage.owline_destinations.lastfm.credentials.api_key, "test");
});

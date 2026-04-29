const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function load(storedDestinations = {}) {
  const storage = { owline_destinations: storedDestinations };
  const ctx = {
    self: {},
    crypto: { subtle: { digest: () => Promise.resolve(new ArrayBuffer(16)) } },
    TextEncoder: TextEncoder,
    URLSearchParams,
    fetch: async () => ({ ok: true, status: 200 }),
    Math,
    Date,
    JSON,
    Array,
    Object,
    String,
    Promise,
    chrome: {
      storage: {
        local: {
          get(_key) { return Promise.resolve(storage); },
          set(data) { Object.assign(storage, data); return Promise.resolve(); },
          remove(key) { delete storage[key]; return Promise.resolve(); },
        },
      },
    },
  };
  vm.createContext(ctx);
  for (const f of ["config.js", "storage-keys.js", "destinations.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "shared", f), "utf8"), ctx);
  }
  return { dest: ctx.self.OWLINE.destinations, CONFIG: ctx.self.OWLINE.CONFIG, storage };
}

test("getAll returns all destinations with defaults", async () => {
  const { dest, CONFIG } = load();
  const all = await dest.getAll();
  for (const id of Object.keys(CONFIG.DESTINATIONS)) {
    assert.ok(all[id], `missing ${id}`);
    assert.equal(typeof all[id].enabled, "boolean");
  }
});

test("owline is enabled by default", async () => {
  const { dest } = load();
  const all = await dest.getAll();
  assert.equal(all.owline.enabled, true);
});

test("lastfm is disabled by default", async () => {
  const { dest } = load();
  const all = await dest.getAll();
  assert.equal(all.lastfm.enabled, false);
});

test("listenbrainz is disabled by default", async () => {
  const { dest } = load();
  const all = await dest.getAll();
  assert.equal(all.listenbrainz.enabled, false);
});

test("get returns single destination", async () => {
  const { dest } = load();
  const owline = await dest.get("owline");
  assert.equal(owline.enabled, true);
});

test("get returns null for unknown id", async () => {
  const { dest } = load();
  const result = await dest.get("nonexistent");
  assert.equal(result, null);
});

test("setEnabled persists change", async () => {
  const { dest } = load();
  await dest.setEnabled("lastfm", true);
  const all = await dest.getAll();
  assert.equal(all.lastfm.enabled, true);
});

test("setEnabled ignores unknown id", async () => {
  const { dest } = load();
  await dest.setEnabled("fake", true);
  const result = await dest.get("fake");
  assert.equal(result, null);
});

test("setCredentials persists credentials", async () => {
  const { dest } = load();
  await dest.setCredentials("lastfm", { api_key: "k", api_secret: "s", session_key: "sk" });
  const all = await dest.getAll();
  assert.deepEqual(all.lastfm.credentials, { api_key: "k", api_secret: "s", session_key: "sk" });
});

test("clearCredentials resets and disables", async () => {
  const { dest } = load();
  await dest.setEnabled("lastfm", true);
  await dest.setCredentials("lastfm", { api_key: "k" });
  await dest.clearCredentials("lastfm");
  const all = await dest.getAll();
  assert.equal(all.lastfm.enabled, false);
  assert.equal(all.lastfm.credentials, null);
});

test("dispatch skips owline", async () => {
  const { dest } = load();
  const results = await dest.dispatch({ artist: "A", title: "B" });
  assert.equal(results.owline, undefined);
});

test("dispatch skips disabled destinations", async () => {
  const { dest } = load();
  const results = await dest.dispatch({ artist: "A", title: "B" });
  assert.equal(results.lastfm, undefined);
  assert.equal(results.listenbrainz, undefined);
});

test("dispatch returns error for enabled but no credentials", async () => {
  const { dest } = load();
  await dest.setEnabled("lastfm", true);
  const results = await dest.dispatch({ artist: "A", title: "B" });
  assert.ok(results.lastfm.error.includes("not_configured"));
});

test("sendToLastfm returns error without credentials", async () => {
  const { dest } = load();
  const result = await dest.sendToLastfm({ artist: "A", title: "B" }, null);
  assert.ok(result.error.includes("not_configured"));
});

test("sendToListenBrainz returns error without token", async () => {
  const { dest } = load();
  const result = await dest.sendToListenBrainz({ artist: "A", title: "B" }, null);
  assert.ok(result.error.includes("not_configured"));
});

test("sendToListenBrainz returns error with empty credentials", async () => {
  const { dest } = load();
  const result = await dest.sendToListenBrainz({ artist: "A", title: "B" }, {});
  assert.ok(result.error.includes("not_configured"));
});

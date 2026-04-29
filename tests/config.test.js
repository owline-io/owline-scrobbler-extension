const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadConfig() {
  const ctx = { self: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "shared", "config.js"), "utf8"), ctx);
  return ctx.self.OWLINE.CONFIG;
}

const CONFIG = loadConfig();

test("PROVIDERS array includes all expected players", () => {
  const expected = ["spotify", "youtube", "youtube_music", "soundcloud", "deezer", "tidal", "amazon_music", "apple_music", "bandcamp", "plex"];
  for (const p of expected) {
    assert.ok(CONFIG.PROVIDERS.includes(p), `missing ${p}`);
  }
});

test("PROVIDER_CATEGORIES.players matches PROVIDERS", () => {
  assert.deepEqual(CONFIG.PROVIDER_CATEGORIES.players, CONFIG.PROVIDERS);
});

test("PROVIDER_CATEGORIES.trackers contains owline", () => {
  assert.ok(CONFIG.PROVIDER_CATEGORIES.trackers.includes("owline"));
});

test("PROVIDER_CATEGORIES has players and trackers keys", () => {
  assert.ok(Array.isArray(CONFIG.PROVIDER_CATEGORIES.players));
  assert.ok(Array.isArray(CONFIG.PROVIDER_CATEGORIES.trackers));
});

test("API_BASE is production URL", () => {
  assert.equal(CONFIG.API_BASE, "https://api.owline.io/api/v1");
});

test("SCROBBLE_AT_MS is 30 seconds", () => {
  assert.equal(CONFIG.SCROBBLE_AT_MS, 30000);
});

test("MAX_TRACK_DURATION is 20 minutes", () => {
  assert.equal(CONFIG.MAX_TRACK_DURATION, 1200);
});

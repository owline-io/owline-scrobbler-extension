const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function load(initialStorage = {}) {
  const storage = { ...initialStorage };
  const ctx = {
    self: {},
    Promise,
    Object,
    chrome: {
      storage: {
        local: {
          get(_key) { return Promise.resolve(storage); },
          set(data) { Object.assign(storage, data); return Promise.resolve(); },
          remove(keys) {
            const arr = Array.isArray(keys) ? keys : [keys];
            for (const k of arr) delete storage[k];
            return Promise.resolve();
          },
        },
      },
    },
  };
  vm.createContext(ctx);
  for (const f of ["config.js", "storage-keys.js", "api.js", "auth.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "shared", f), "utf8"), ctx);
  }
  return { auth: ctx.self.OWLINE.auth, KEYS: ctx.self.OWLINE.KEYS, storage };
}

test("getToken returns null when empty", async () => {
  const { auth } = load();
  assert.equal(await auth.getToken(), null);
});

test("getToken returns stored token", async () => {
  const { auth } = load({ owline_token: "abc123" });
  assert.equal(await auth.getToken(), "abc123");
});

test("setSession stores token", async () => {
  const { auth, storage } = load();
  await auth.setSession({ token: "tok" });
  assert.equal(storage.owline_token, "tok");
});

test("setSession stores user", async () => {
  const { auth, storage } = load();
  await auth.setSession({ user: { username: "nando" } });
  assert.deepEqual(storage.owline_user, { username: "nando" });
});

test("setSession stores refresh", async () => {
  const { auth, storage } = load();
  await auth.setSession({ refresh: "ref" });
  assert.equal(storage.owline_refresh, "ref");
});

test("clearSession removes session keys", async () => {
  const { auth, storage } = load({
    owline_token: "tok",
    owline_refresh: "ref",
    owline_user: { username: "x" },
    owline_now_playing: { title: "t" },
    owline_scrobble_count: 5,
  });
  await auth.clearSession();
  assert.equal(storage.owline_token, undefined);
  assert.equal(storage.owline_refresh, undefined);
  assert.equal(storage.owline_user, undefined);
  assert.equal(storage.owline_now_playing, undefined);
  assert.equal(storage.owline_scrobble_count, undefined);
});

test("clearSession also removes destinations", async () => {
  const { auth, storage } = load({
    owline_token: "tok",
    owline_destinations: { lastfm: { enabled: true, credentials: { key: "x" } } },
  });
  await auth.clearSession();
  assert.equal(storage.owline_destinations, undefined);
});

test("getRefresh returns null when empty", async () => {
  const { auth } = load();
  assert.equal(await auth.getRefresh(), null);
});

test("getRefresh returns stored refresh", async () => {
  const { auth } = load({ owline_refresh: "ref123" });
  assert.equal(await auth.getRefresh(), "ref123");
});

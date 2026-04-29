const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadShared() {
  const ctx = { self: {}, fetch: () => {} };
  vm.createContext(ctx);
  for (const f of ["config.js", "storage-keys.js", "api.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "shared", f), "utf8"), ctx);
  }
  return ctx.self.OWLINE;
}

test("extractToken prefers access_token", () => {
  const { api } = loadShared();
  assert.equal(api.extractToken({ access_token: "a", token: "b" }), "a");
});

test("extractToken falls back to token", () => {
  const { api } = loadShared();
  assert.equal(api.extractToken({ token: "b" }), "b");
});

test("extractToken returns null when missing", () => {
  const { api } = loadShared();
  assert.equal(api.extractToken({}), null);
  assert.equal(api.extractToken(null), null);
});

test("extractUser unwraps data envelope", () => {
  const { api } = loadShared();
  assert.deepEqual(api.extractUser({ data: { username: "x" } }), { username: "x" });
});

test("extractUser passes through bare object", () => {
  const { api } = loadShared();
  assert.deepEqual(api.extractUser({ username: "x" }), { username: "x" });
});

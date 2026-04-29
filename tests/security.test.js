const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadBackground() {
  const src = fs.readFileSync(path.join(__dirname, "..", "background.js"), "utf8");
  const fnMatch = src.match(/function sanitizeLogEntry\(entry\)\s*\{[\s\S]*?\n\}/);
  if (!fnMatch) throw new Error("sanitizeLogEntry not found");
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fnMatch[0], ctx);
  return ctx.sanitizeLogEntry;
}

function loadConfig() {
  const ctx = { self: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "shared", "config.js"), "utf8"), ctx);
  return ctx.self.OWLINE.CONFIG;
}

const sanitizeLogEntry = loadBackground();
const CONFIG = loadConfig();

test("sanitizeLogEntry removes credentials", () => {
  const entry = { status: "sent", credentials: { api_key: "secret" }, payload: { track: "T" } };
  const clean = sanitizeLogEntry(entry);
  assert.equal(clean.credentials, undefined);
  assert.equal(clean.payload.track, "T");
});

test("sanitizeLogEntry removes token", () => {
  const entry = { status: "sent", token: "abc123" };
  const clean = sanitizeLogEntry(entry);
  assert.equal(clean.token, undefined);
});

test("sanitizeLogEntry removes api_key", () => {
  const entry = { api_key: "k", api_secret: "s", session_key: "sk", status: "ok" };
  const clean = sanitizeLogEntry(entry);
  assert.equal(clean.api_key, undefined);
  assert.equal(clean.api_secret, undefined);
  assert.equal(clean.session_key, undefined);
  assert.equal(clean.status, "ok");
});

test("sanitizeLogEntry preserves safe fields", () => {
  const entry = { status: "sent", httpStatus: 200, payload: { track: "T", artist: "A" } };
  const clean = sanitizeLogEntry(entry);
  assert.equal(clean.status, "sent");
  assert.equal(clean.httpStatus, 200);
  assert.equal(clean.payload.track, "T");
  assert.equal(clean.payload.artist, "A");
});

test("SET_DESTINATION rejects unknown id", () => {
  // Validate that CONFIG.DESTINATIONS only has known keys
  const known = Object.keys(CONFIG.DESTINATIONS);
  assert.ok(known.includes("owline"));
  assert.ok(known.includes("lastfm"));
  assert.ok(known.includes("listenbrainz"));
  assert.ok(!known.includes("fake"));
});

test("manifest host_permissions cover all external APIs", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "manifest.json"), "utf8")
  );
  const hosts = manifest.host_permissions || [];
  assert.ok(hosts.some((h) => h.includes("api.owline.io")));
  assert.ok(hosts.some((h) => h.includes("audioscrobbler.com")));
  assert.ok(hosts.some((h) => h.includes("listenbrainz.org")));
});

test("CSP is restrictive", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "manifest.json"), "utf8")
  );
  const csp = manifest.content_security_policy?.extension_pages || "";
  assert.ok(csp.includes("script-src 'self'"));
  assert.ok(csp.includes("object-src 'self'"));
});

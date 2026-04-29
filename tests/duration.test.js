const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const baseSrc = fs.readFileSync(require("node:path").join(__dirname, "..", "content", "base.js"), "utf8");
const ctx = { window: { OWLINE: { CONFIG: {}, KEYS: {} } }, chrome: { storage: { onChanged: { addListener: () => {} }, local: { get: () => {} } } } };
vm.createContext(ctx);
vm.runInContext(baseSrc, ctx);

test("parseDurationText handles mm:ss", () => {
  assert.equal(ctx.parseDurationText("3:45"), 225);
});

test("parseDurationText handles hh:mm:ss", () => {
  assert.equal(ctx.parseDurationText("1:02:03"), 3723);
});

test("parseDurationText strips minus prefix", () => {
  assert.equal(ctx.parseDurationText("-1:30"), 90);
});

test("parseDurationText returns null on garbage", () => {
  assert.equal(ctx.parseDurationText("abc"), null);
  assert.equal(ctx.parseDurationText(""), null);
  assert.equal(ctx.parseDurationText(null), null);
});

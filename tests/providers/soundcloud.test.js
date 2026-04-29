const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadProvider } = require("../helpers/dom");

test("soundcloud: waitForPlayer called with correct source", () => {
  const { waitForPlayerCalls } = loadProvider("soundcloud.js");
  assert.equal(waitForPlayerCalls.length, 1);
  assert.equal(waitForPlayerCalls[0].source, "soundcloud");
});

test("soundcloud: getTrackInfo returns null when no elements", () => {
  const { ctx } = loadProvider("soundcloud.js");
  assert.equal(ctx.getTrackInfo(), null);
});

test("soundcloud: isPlaying returns false when no button", () => {
  const { ctx } = loadProvider("soundcloud.js");
  assert.equal(ctx.isPlaying(), false);
});

test("soundcloud: maxDuration is set", () => {
  const { waitForPlayerCalls } = loadProvider("soundcloud.js");
  assert.equal(waitForPlayerCalls[0].maxDuration, 1200);
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadProvider } = require("../helpers/dom");

test("deezer: waitForPlayer called with correct source", () => {
  const { waitForPlayerCalls } = loadProvider("deezer.js");
  assert.equal(waitForPlayerCalls.length, 1);
  assert.equal(waitForPlayerCalls[0].source, "deezer");
});

test("deezer: getTrackInfo returns null when no elements", () => {
  const { ctx } = loadProvider("deezer.js");
  assert.equal(ctx.getTrackInfo(), null);
});

test("deezer: isPlaying returns false when no button", () => {
  const { ctx } = loadProvider("deezer.js");
  assert.equal(ctx.isPlaying(), false);
});

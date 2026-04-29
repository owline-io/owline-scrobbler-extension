const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadProvider } = require("../helpers/dom");

test("apple-music: waitForPlayer called with correct source", () => {
  const { waitForPlayerCalls } = loadProvider("apple-music.js");
  assert.equal(waitForPlayerCalls.length, 1);
  assert.equal(waitForPlayerCalls[0].source, "apple_music");
});

test("apple-music: getTrackInfo returns null when no elements", () => {
  const { ctx } = loadProvider("apple-music.js");
  assert.equal(ctx.getTrackInfo(), null);
});

test("apple-music: isPlaying returns false when no button", () => {
  const { ctx } = loadProvider("apple-music.js");
  assert.equal(ctx.isPlaying(), false);
});

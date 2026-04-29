const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadProvider } = require("../helpers/dom");

test("amazon-music: waitForPlayer called with correct source", () => {
  const { waitForPlayerCalls } = loadProvider("amazon-music.js");
  assert.equal(waitForPlayerCalls.length, 1);
  assert.equal(waitForPlayerCalls[0].source, "amazon_music");
});

test("amazon-music: getTrackInfo returns null when no elements", () => {
  const { ctx } = loadProvider("amazon-music.js");
  assert.equal(ctx.getTrackInfo(), null);
});

test("amazon-music: isPlaying returns false when no button", () => {
  const { ctx } = loadProvider("amazon-music.js");
  assert.equal(ctx.isPlaying(), false);
});

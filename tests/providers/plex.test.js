const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadProvider } = require("../helpers/dom");

test("plex: waitForPlayer called with correct source", () => {
  const { waitForPlayerCalls } = loadProvider("plex.js");
  assert.equal(waitForPlayerCalls.length, 1);
  assert.equal(waitForPlayerCalls[0].source, "plex");
});

test("plex: getTrackInfo returns null when no elements", () => {
  const { ctx } = loadProvider("plex.js");
  assert.equal(ctx.getTrackInfo(), null);
});

test("plex: isPlaying returns false when no button", () => {
  const { ctx } = loadProvider("plex.js");
  assert.equal(ctx.isPlaying(), false);
});

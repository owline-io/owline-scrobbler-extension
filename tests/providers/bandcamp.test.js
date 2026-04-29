const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadProvider } = require("../helpers/dom");

test("bandcamp: waitForPlayer called with correct source", () => {
  const { waitForPlayerCalls } = loadProvider("bandcamp.js");
  assert.equal(waitForPlayerCalls.length, 1);
  assert.equal(waitForPlayerCalls[0].source, "bandcamp");
});

test("bandcamp: getTrackInfo returns null when no elements", () => {
  const { ctx } = loadProvider("bandcamp.js");
  assert.equal(ctx.getTrackInfo(), null);
});

test("bandcamp: isPlaying returns false when no button", () => {
  const { ctx } = loadProvider("bandcamp.js");
  assert.equal(ctx.isPlaying(), false);
});

test("bandcamp: maxDuration is set", () => {
  const { waitForPlayerCalls } = loadProvider("bandcamp.js");
  assert.equal(waitForPlayerCalls[0].maxDuration, 1200);
});

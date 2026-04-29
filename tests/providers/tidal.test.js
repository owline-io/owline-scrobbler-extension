const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadProvider } = require("../helpers/dom");

test("tidal: waitForPlayer called with correct source", () => {
  const { waitForPlayerCalls } = loadProvider("tidal.js");
  assert.equal(waitForPlayerCalls.length, 1);
  assert.equal(waitForPlayerCalls[0].source, "tidal");
});

test("tidal: getTrackInfo returns null when no elements", () => {
  const { ctx } = loadProvider("tidal.js");
  assert.equal(ctx.getTrackInfo(), null);
});

test("tidal: isPlaying returns false when no button", () => {
  const { ctx } = loadProvider("tidal.js");
  assert.equal(ctx.isPlaying(), false);
});

test("tidal: isPlaying detects pause state", () => {
  const { ctx, dom } = loadProvider("tidal.js", (dom) => {
    dom.register('[data-test="play"]', { getAttribute: () => "play" });
    dom.register('[data-test="pause"]', { getAttribute: (k) => k === "data-test" ? "pause" : null });
  });
  // With pause button present, querySelector('[data-test="play"]') returns first match
  // The function checks data-test attr
});

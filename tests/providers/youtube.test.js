const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadProvider } = require("../helpers/dom");

test("youtube: waitForPlayer called with correct source", () => {
  const { waitForPlayerCalls } = loadProvider("youtube.js");
  assert.equal(waitForPlayerCalls.length, 1);
  assert.equal(waitForPlayerCalls[0].source, "youtube");
});

test("youtube: getTrackInfo returns null when no elements", () => {
  const { ctx } = loadProvider("youtube.js");
  assert.equal(ctx.getTrackInfo(), null);
});

test("youtube: getTrackInfo parses artist - title format", () => {
  const { ctx, dom: _dom } = loadProvider("youtube.js", (dom) => {
    dom.register('#info h1 yt-formatted-string', { textContent: "Radiohead - Creep" });
    dom.register('#upload-info ytd-channel-name a', { textContent: "RadioheadVEVO" });
    dom.register('.ytp-time-duration', { textContent: "3:56" });
  });
  const info = ctx.getTrackInfo();
  assert.equal(info.title, "Creep");
  assert.equal(info.artist, "Radiohead");
  assert.equal(info.duration, 236);
});

test("youtube: isPlaying returns false when no button", () => {
  const { ctx } = loadProvider("youtube.js");
  assert.equal(ctx.isPlaying(), false);
});

test("youtube: maxDuration is set", () => {
  const { waitForPlayerCalls } = loadProvider("youtube.js");
  assert.equal(waitForPlayerCalls[0].maxDuration, 1200);
});

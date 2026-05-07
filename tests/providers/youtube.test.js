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

test("youtube: getTrackInfo parses artist - title format (legacy DOM)", () => {
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

test("youtube: getTrackInfo with current DOM (ytd-watch-metadata)", () => {
  const { ctx } = loadProvider("youtube.js", (dom) => {
    dom.register('ytd-watch-metadata h1 yt-formatted-string', { textContent: "Aphex Twin - Avril 14th" });
    dom.register('ytd-watch-metadata #channel-name a', { textContent: "Aphex Twin" });
    dom.register('.ytp-time-duration', { textContent: "2:05" });
  });
  const info = ctx.getTrackInfo();
  assert.equal(info.title, "Avril 14th");
  assert.equal(info.artist, "Aphex Twin");
  assert.equal(info.duration, 125);
});

test("youtube: isPlaying false when no video", () => {
  const { ctx } = loadProvider("youtube.js");
  assert.equal(ctx.isPlaying(), false);
});

test("youtube: isPlaying true when video playing", () => {
  const { ctx } = loadProvider("youtube.js", (dom) => {
    dom.register("video", { paused: false, ended: false, currentTime: 5 });
  });
  assert.equal(ctx.isPlaying(), true);
});

test("youtube: isPlaying false when paused", () => {
  const { ctx } = loadProvider("youtube.js", (dom) => {
    dom.register("video", { paused: true, ended: false, currentTime: 5 });
  });
  assert.equal(ctx.isPlaying(), false);
});

test("youtube: maxDuration is set", () => {
  const { waitForPlayerCalls } = loadProvider("youtube.js");
  assert.equal(waitForPlayerCalls[0].maxDuration, 1200);
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadProvider } = require("../helpers/dom");

test("spotify: waitForPlayer called with correct source", () => {
  const { waitForPlayerCalls } = loadProvider("spotify.js");
  assert.equal(waitForPlayerCalls.length, 1);
  assert.equal(waitForPlayerCalls[0].source, "spotify");
});

test("spotify: getTrackInfo returns null when no elements", () => {
  const { ctx } = loadProvider("spotify.js");
  assert.equal(ctx.getTrackInfo(), null);
});

test("spotify: getTrackInfo returns track when elements exist", () => {
  const { ctx, dom: _dom } = loadProvider("spotify.js", (dom) => {
    dom.register('[data-testid="context-item-info-title"]', { textContent: "Creep" });
    dom.register('[data-testid="context-item-info-artist"]', { textContent: "Radiohead" });
    dom.register('[data-testid="playback-duration"]', { textContent: "3:56" });
    dom.register('[data-testid="CoverSlotExpanded__container"] img', { src: "https://cover.jpg", alt: "The Bends" });
  });
  const info = ctx.getTrackInfo();
  assert.equal(info.title, "Creep");
  assert.equal(info.artist, "Radiohead");
  assert.equal(info.duration, 236);
  assert.equal(info.cover_url, "https://cover.jpg");
  assert.equal(info.album, "The Bends");
});

test("spotify: isPlaying returns false when no button", () => {
  const { ctx } = loadProvider("spotify.js");
  assert.equal(ctx.isPlaying(), false);
});

test("spotify: isPlaying detects pause state", () => {
  const { ctx, dom: _dom } = loadProvider("spotify.js", (dom) => {
    dom.register('[data-testid="control-button-playpause"]', {
      getAttribute: (k) => k === "aria-label" ? "Pause" : null,
    });
  });
  assert.equal(ctx.isPlaying(), true);
});

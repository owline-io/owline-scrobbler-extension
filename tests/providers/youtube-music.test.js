const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadProvider } = require("../helpers/dom");

test("youtube-music: waitForPlayer called with correct source", () => {
  const { waitForPlayerCalls } = loadProvider("youtube-music.js");
  assert.equal(waitForPlayerCalls.length, 1);
  assert.equal(waitForPlayerCalls[0].source, "youtube_music");
});

test("youtube-music: getTrackInfo returns null when no elements", () => {
  const { ctx } = loadProvider("youtube-music.js");
  assert.equal(ctx.getTrackInfo(), null);
});

test("youtube-music: getTrackInfo returns track when elements exist", () => {
  const { ctx, dom } = loadProvider("youtube-music.js", (dom) => {
    dom.register('.ytmusic-player-bar .title', { textContent: "Starburster" });
    dom.register('.ytmusic-player-bar .byline a', { textContent: "Fontaines D.C." });
    dom.register('.ytmusic-player-bar .time-info', { textContent: "1:23 / 3:45" });
    dom.register('.ytmusic-player-bar img.image', { src: "https://cover.jpg" });
  });
  const info = ctx.getTrackInfo();
  assert.equal(info.title, "Starburster");
  assert.equal(info.artist, "Fontaines D.C.");
  assert.equal(info.duration, 225);
});

test("youtube-music: isPlaying returns false when no button", () => {
  const { ctx } = loadProvider("youtube-music.js");
  assert.equal(ctx.isPlaying(), false);
});

test("youtube-music: maxDuration is set", () => {
  const { waitForPlayerCalls } = loadProvider("youtube-music.js");
  assert.equal(waitForPlayerCalls[0].maxDuration, 1200);
});

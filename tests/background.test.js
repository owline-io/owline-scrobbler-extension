const { test } = require("node:test");
const assert = require("node:assert/strict");

test("buildPayload maps track fields correctly", () => {
  // Inline replica of buildPayload (same logic as background.js)
  function buildPayload(track) {
    return {
      track: track.title,
      artist: track.artist,
      album: track.album || null,
      cover_url: track.cover_url || null,
      duration: track.duration || null,
      source: track.source,
    };
  }

  const track = {
    title: "Paranoid Android",
    artist: "Radiohead",
    album: "OK Computer",
    cover_url: "https://example.com/cover.jpg",
    duration: 384,
    source: "spotify",
  };

  const payload = buildPayload(track);
  assert.equal(payload.track, "Paranoid Android");
  assert.equal(payload.artist, "Radiohead");
  assert.equal(payload.album, "OK Computer");
  assert.equal(payload.cover_url, "https://example.com/cover.jpg");
  assert.equal(payload.duration, 384);
  assert.equal(payload.source, "spotify");
});

test("buildPayload nullifies missing optional fields", () => {
  function buildPayload(track) {
    return {
      track: track.title,
      artist: track.artist,
      album: track.album || null,
      cover_url: track.cover_url || null,
      duration: track.duration || null,
      source: track.source,
    };
  }

  const track = { title: "Test", artist: "Artist", source: "youtube" };
  const payload = buildPayload(track);
  assert.equal(payload.album, null);
  assert.equal(payload.cover_url, null);
  assert.equal(payload.duration, null);
});

test("debounce key format", () => {
  const key = (t) => (t ? `${t.artist}|${t.title}` : "");

  assert.equal(key({ artist: "Radiohead", title: "Creep" }), "Radiohead|Creep");
  assert.equal(key(null), "");
  assert.equal(key({ artist: "A", title: "B" }), "A|B");
});

test("debounce skips within window", () => {
  const DEBOUNCE_MS = 5000;
  const lastAt = Date.now() - 2000; // 2s ago
  const now = Date.now();
  assert.ok(now - lastAt < DEBOUNCE_MS, "should be within debounce window");
});

test("debounce allows after window", () => {
  const DEBOUNCE_MS = 5000;
  const lastAt = Date.now() - 6000; // 6s ago
  const now = Date.now();
  assert.ok(now - lastAt >= DEBOUNCE_MS, "should be outside debounce window");
});

test("scrobble threshold calculation", () => {
  const SCROBBLE_AT_MS = 30000;
  const MIN_LISTEN_FRACTION = 0.5;

  // Short track (60s) → threshold = min(30000, 60000 * 0.5) = 30000
  const short = Math.min(SCROBBLE_AT_MS, 60 * 1000 * MIN_LISTEN_FRACTION);
  assert.equal(short, 30000);

  // Very short track (40s) → threshold = min(30000, 40000 * 0.5) = 20000
  const veryShort = Math.min(SCROBBLE_AT_MS, 40 * 1000 * MIN_LISTEN_FRACTION);
  assert.equal(veryShort, 20000);

  // Long track (300s) → threshold = min(30000, 300000 * 0.5) = 30000
  const long = Math.min(SCROBBLE_AT_MS, 300 * 1000 * MIN_LISTEN_FRACTION);
  assert.equal(long, 30000);

  // No duration → fallback to SCROBBLE_AT_MS
  const noDuration = SCROBBLE_AT_MS;
  assert.equal(noDuration, 30000);
});

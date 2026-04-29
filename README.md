# Owline Scrobbler — Chrome Extension

Scrobble what you listen to on Spotify, YouTube, SoundCloud and Deezer to [Owline](https://owline.io).

## How it works

1. Install the extension
2. Sign in with your Owline account (email/password or Google)
3. Play music on any supported platform
4. Tracks are automatically scrobbled after 30s of playback (or 50% of duration)

## Supported platforms

| Platform | Source | Detection |
|----------|--------|-----------|
| Spotify Web Player | `spotify` | Player bar DOM selectors (multiple fallbacks) |
| YouTube | `youtube` | Video title + channel parsing |
| YouTube Music | `youtube` | Player bar DOM selectors |
| SoundCloud | `soundcloud` | Player bar DOM selectors |
| Deezer | `deezer` | Player bar DOM selectors |

## Features

- Email/password and Google Sign-In authentication
- Auto token refresh (every 20min)
- Offline queue with periodic flush (persisted in storage, max 200 tracks)
- Scrobble counter (persists across restarts)
- Now Playing display with 10s freshness TTL (clears when tab closes)
- Pause detection per platform (no scrobble while paused)
- Per-provider tracking toggle (enable/disable Spotify, YouTube, SoundCloud, Deezer individually)
- Scrobble logs (last 50 attempts) — view, expand payload, download as JSON, clear
- Badge with scrobble count
- Server-side logout on sign out
- Versioned storage with migration runner

## Popup tabs

- **STATUS** — now playing + session counters (scrobbles / queued)
- **SETTINGS** — provider toggles + account / sign out
- **LOGS** — scrobble history with expandable JSON payload, download, clear

## Install (development)

1. `chrome://extensions/` → Enable Developer Mode
2. "Load unpacked" → select this directory
3. Click the Owline icon → Sign in

## Architecture

```
manifest.json            — MV3 manifest, CSP, content scripts per platform
background.js            — Service worker: scrobble API, queue, auth, OAuth, logs
shared/
  config.js              — OWLINE.CONFIG (constants)
  storage-keys.js        — OWLINE.KEYS, SESSION_KEYS
  api.js                 — OWLINE.api (login, oauth, refresh, me, logout, postScrobble)
  auth.js                — OWLINE.auth (token storage, refresh)
  providers.js           — OWLINE.providers (per-provider toggle)
  migrations.js          — OWLINE.migrations (storage versioning)
content/
  base.js                — Shared polling, heartbeat, provider gating
  providers/
    spotify.js           — Spotify Web Player (3 fallback selectors + isPlaying)
    youtube.js           — YouTube + YouTube Music + isPlaying
    soundcloud.js        — SoundCloud + isPlaying
    deezer.js            — Deezer + isPlaying
popup/
  popup.html             — Tabs (Status / Settings / Logs)
  popup.css              — Styles
  popup.js               — UI logic, providers panel, log rendering
tests/
  api.test.js            — extractToken, extractUser
  duration.test.js       — parseDurationText
icons/                   — Extension icons (16, 48, 128)
```

## Scrobble rules

- Min 30s of playback OR 50% of track duration (whichever is less)
- 5s debounce between same track (persisted, survives service worker restarts)
- Tracks > 20min skipped (likely podcasts/mixes) — YouTube and SoundCloud only
- Skips when player is paused (each adapter detects pause state)
- Offline queue persisted in `chrome.storage.local` (max 200, flushes every 5min)
- Flush stops after 3 failed attempts to avoid infinite retry

## Testing

```bash
npm test
```

Uses Node's built-in test runner — zero dependencies.

## Storage keys

All keys are namespaced under `owline_*` and exposed via `OWLINE.KEYS`. Provider settings (`owline_providers`) and storage version (`owline_storage_version`) survive logout; everything else is cleared on sign out.

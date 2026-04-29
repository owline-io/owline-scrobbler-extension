# Owline Scrobbler — Chrome Extension

Scrobble what you listen to on Spotify, YouTube Music, SoundCloud, Deezer, Tidal, Amazon Music, Apple Music, Bandcamp and Plex to [Owline](https://owline.io).

## How it works

1. Install the extension
2. Sign in with your Owline account (email/password or Google)
3. Play music on any supported platform
4. Tracks are automatically scrobbled after 30s of playback (or 50% of duration)

## Supported platforms

### Players

| Platform | Source | URL | Detection |
|----------|--------|-----|-----------|
| Spotify Web Player | `spotify` | `open.spotify.com` | Player bar DOM selectors (multiple fallbacks) |
| YouTube | `youtube` | `www.youtube.com` | Video title + channel parsing |
| YouTube Music | `youtube_music` | `music.youtube.com` | Player bar DOM selectors |
| SoundCloud | `soundcloud` | `soundcloud.com` | Player bar DOM selectors |
| Deezer | `deezer` | `www.deezer.com` | Player bar DOM selectors |
| Tidal | `tidal` | `listen.tidal.com` | Player bar DOM selectors |
| Amazon Music | `amazon_music` | `music.amazon.com` | Player bar DOM selectors |
| Apple Music | `apple_music` | `music.apple.com` | Player bar DOM selectors |
| Bandcamp | `bandcamp` | `*.bandcamp.com` | Player bar + audio element |
| Plex | `plex` | `app.plex.tv` | Player bar DOM selectors |

### Trackers

| Tracker | Description |
|---------|-------------|
| Owline | Scrobbles sent to Owline API (enabled by default) |

## Features

- Email/password and Google Sign-In authentication
- Auto token refresh (every 20min)
- Offline queue with periodic flush (persisted in storage, max 200 tracks)
- Scrobble counter (persists across restarts)
- Now Playing display with 10s freshness TTL (clears when tab closes)
- Pause detection per platform (no scrobble while paused)
- Per-provider toggle (enable/disable each player and tracker individually)
- Players and Trackers organized in separate settings sections
- Scrobble logs (last 50 attempts) — view, expand payload, download as JSON, clear
- Badge with scrobble count
- Server-side logout on sign out
- Versioned storage with migration runner

## Popup tabs

- **STATUS** — now playing + session counters (scrobbles / queued)
- **SETTINGS** — player toggles, tracker toggles, account / sign out
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
  config.js              — OWLINE.CONFIG (constants, provider categories)
  storage-keys.js        — OWLINE.KEYS, SESSION_KEYS
  api.js                 — OWLINE.api (login, oauth, refresh, me, logout, postScrobble)
  auth.js                — OWLINE.auth (token storage, refresh)
  providers.js           — OWLINE.providers (per-provider toggle, category-aware)
  migrations.js          — OWLINE.migrations (storage versioning)
content/
  base.js                — Shared polling, heartbeat, provider gating
  providers/
    spotify.js           — Spotify Web Player
    youtube.js           — YouTube
    youtube-music.js     — YouTube Music
    soundcloud.js        — SoundCloud
    deezer.js            — Deezer
    tidal.js             — Tidal
    amazon-music.js      — Amazon Music
    apple-music.js       — Apple Music
    bandcamp.js          — Bandcamp
    plex.js              — Plex
popup/
  popup.html             — Tabs (Status / Settings / Logs)
  popup.css              — Styles
  popup.js               — UI logic, providers panel, log rendering
tests/
  api.test.js            — extractToken, extractUser
  background.test.js     — buildPayload, debounce, scrobble threshold
  config.test.js         — PROVIDERS, PROVIDER_CATEGORIES, defaults
  duration.test.js       — parseDurationText
  providers.test.js      — get, setEnabled, isEnabled, defaults, overrides
  helpers/
    dom.js               — DOM mock helper for provider tests
  providers/
    spotify.test.js      — Spotify provider tests
    youtube.test.js      — YouTube provider tests
    youtube-music.test.js — YouTube Music provider tests
    soundcloud.test.js   — SoundCloud provider tests
    deezer.test.js       — Deezer provider tests
    tidal.test.js        — Tidal provider tests
    amazon-music.test.js — Amazon Music provider tests
    apple-music.test.js  — Apple Music provider tests
    bandcamp.test.js     — Bandcamp provider tests
    plex.test.js         — Plex provider tests
icons/                   — Extension icons (16, 48, 128)
```

## Scrobble rules

- Min 30s of playback OR 50% of track duration (whichever is less)
- 5s debounce between same track (persisted, survives service worker restarts)
- Tracks > 20min skipped (likely podcasts/mixes) — YouTube, YouTube Music, SoundCloud, Bandcamp
- Skips when player is paused (each adapter detects pause state)
- Offline queue persisted in `chrome.storage.local` (max 200, flushes every 5min)
- Flush stops after 3 failed attempts to avoid infinite retry

## Testing

```bash
npm test
```

68 tests — uses Node's built-in test runner, zero dependencies.

## Storage keys

All keys are namespaced under `owline_*` and exposed via `OWLINE.KEYS`. Provider settings (`owline_providers`) and storage version (`owline_storage_version`) survive logout; everything else is cleared on sign out.

<p align="center">
  <img src="cover.png" alt="Owline Scrobbler" width="100%" />
</p>

# Owline Scrobbler — Chrome Extension

<p align="center">
  <img src="https://img.shields.io/badge/manifest-v3-blue?style=flat-square" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/chrome-extension-green?style=flat-square&logo=googlechrome&logoColor=white" alt="Chrome Extension" />
  <img src="https://img.shields.io/badge/tests-104%20passed-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/dependencies-eslint%20only-lightgrey?style=flat-square" alt="Dependencies" />
  <img src="https://img.shields.io/badge/players-6%20active%20·%204%20experimental-blueviolet?style=flat-square" alt="Players" />
  <img src="https://img.shields.io/badge/destinations-owline%20·%20last.fm%20·%20listenbrainz-orange?style=flat-square" alt="Destinations" />
</p>

Scrobble what you listen to on Spotify, YouTube, SoundCloud, Deezer, Tidal and Amazon Music to [Owline](https://owline.io) — and optionally forward to Last.fm and ListenBrainz.

## How it works

1. Install the extension
2. Sign in with your Owline account (email/password or Google)
3. Play music on any supported platform
4. Tracks are automatically scrobbled after 30s of playback (or 50% of duration)
5. Optionally enable Last.fm or ListenBrainz in Settings → Destinations

## Supported platforms

### Active players

| Platform | Source | URL |
|----------|--------|-----|
| Spotify Web Player | `spotify` | `open.spotify.com` |
| YouTube | `youtube` | `www.youtube.com` |
| SoundCloud | `soundcloud` | `soundcloud.com` |
| Deezer | `deezer` | `www.deezer.com` |
| Tidal | `tidal` | `listen.tidal.com` |
| Amazon Music | `amazon_music` | `music.amazon.com` + regional TLDs |

### Experimental

| Platform | Source | URL |
|----------|--------|-----|
| YouTube Music | `youtube_music` | `music.youtube.com` |
| Apple Music | `apple_music` | `music.apple.com` |
| Bandcamp | `bandcamp` | `*.bandcamp.com` |
| Plex | `plex` | `app.plex.tv` |

Experimental adapters load on matching sites but selectors are untested. See [Validating a new adapter](#validating-a-new-player-adapter).

### Trackers

| Tracker | Description |
|---------|-------------|
| Owline | Scrobbles sent to Owline API (always enabled) |

### Destinations

| Destination | Auth | Description |
|-------------|------|-------------|
| Last.fm | API key + secret + session key | Forwards scrobbles via `track.scrobble` API |
| ListenBrainz | User token | Forwards scrobbles via `submit-listens` API |

Destinations are optional. Configure in Settings → Destinations (collapsible under Trackers).

## Features

- Email/password and Google Sign-In authentication
- Auto token refresh (every 20min)
- Multi-destination scrobbling (Owline + Last.fm + ListenBrainz)
- Offline queue with periodic flush (persisted in storage, max 200 tracks)
- Now Playing display with 10s freshness TTL, auto-refresh every 3s
- Pause detection per platform (no scrobble while paused)
- Cover art per scrobble (sent in payload, persisted as `tracks.image_url`)
- Per-provider toggle in Settings tab (active + experimental)
- Status dot: red (logged out) → grey (idle) → green (track playing)
- Scrobble logs (last 50 attempts) — view, expand JSON payload, download, clear
- Log sanitization (credentials never persisted in logs)
- Credential cleanup on logout
- Server-side logout on sign out
- Versioned storage with migration runner
- ESLint + GitHub Actions CI (tests + code quality)

## Popup tabs

- **STATUS** — now playing + session counters (scrobbles / queued)
- **SETTINGS** — player toggles, tracker toggles, destinations config, account / sign out
- **LOGS** — scrobble history with expandable JSON payload, download, clear

## Install (development)

1. `chrome://extensions/` → Enable Developer Mode
2. "Load unpacked" → select this directory
3. Click the Owline icon → Sign in

## Architecture

```
manifest.json            — MV3 manifest, CSP, content scripts per platform
background.js            — Service worker: scrobble, queue, auth, destinations dispatch
shared/
  config.js              — OWLINE.CONFIG (constants, provider categories, destinations)
  storage-keys.js        — OWLINE.KEYS, SESSION_KEYS
  api.js                 — OWLINE.api (login, oauth, refresh, me, logout, postScrobble)
  auth.js                — OWLINE.auth (token storage, refresh, credential cleanup)
  providers.js           — OWLINE.providers (per-provider toggle, category-aware)
  destinations.js        — OWLINE.destinations (Last.fm + ListenBrainz dispatch, MD5 sig)
  migrations.js          — OWLINE.migrations (storage versioning)
content/
  base.js                — Shared polling, heartbeat, provider gating, interval cleanup
  providers/
    spotify.js           — Spotify Web Player
    youtube.js           — YouTube
    youtube-music.js     — YouTube Music (experimental)
    soundcloud.js        — SoundCloud
    deezer.js            — Deezer
    tidal.js             — Tidal
    amazon-music.js      — Amazon Music
    apple-music.js       — Apple Music (experimental)
    bandcamp.js          — Bandcamp (experimental)
    plex.js              — Plex (experimental)
popup/
  popup.html             — Tabs (Status / Settings / Logs)
  popup.css              — Styles
  popup.js               — UI logic, providers, destinations, log rendering
tests/
  api.test.js            — extractToken, extractUser
  auth.test.js           — getToken, setSession, clearSession, credential cleanup
  background.test.js     — buildPayload, debounce, scrobble threshold
  config.test.js         — PROVIDERS, PROVIDER_CATEGORIES, defaults
  destinations.test.js   — getAll, setEnabled, setCredentials, dispatch, sendTo*
  duration.test.js       — parseDurationText
  migrations.test.js     — run, idempotent, defaults, preserve existing
  providers.test.js      — get, setEnabled, isEnabled, defaults, overrides
  security.test.js       — sanitizeLogEntry, destination validation, CSP, host_permissions
  helpers/dom.js         — DOM mock helper for provider tests
  providers/             — per-adapter tests (10 files)
.github/workflows/
  tests.yml              — Node 20 + 22 test matrix
  code-quality.yml       — ESLint, manifest validation, security scan
icons/                   — Extension icons (16, 48, 128)
```

## Scrobble payload

Each scrobble sent to `POST /api/v1/scrobbles`:

```json
{
  "track": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name or null",
  "cover_url": "https://.../cover.jpg or null",
  "duration": 240,
  "source": "spotify"
}
```

`cover_url` is captured by each adapter when available and persisted server-side as `tracks.image_url`. The stats endpoint falls back to `albums.cover_url` when track image is missing.

## Scrobble rules

- Min 30s of playback OR 50% of track duration (whichever is less)
- 5s debounce between same track (persisted, survives service worker restarts)
- Tracks > 20min skipped (likely podcasts/mixes) — YouTube, SoundCloud, Bandcamp
- Skips when player is paused (each adapter detects pause state)
- Offline queue persisted in `chrome.storage.local` (max 200, flushes every 5min)
- Flush with auth retry on 401
- Flush stops after 3 failed attempts to avoid infinite retry

## Security

- Credentials stored in `chrome.storage.local` (isolated per extension)
- Credentials never written to scrobble logs (`sanitizeLogEntry`)
- Credentials cleared on logout
- Destination IDs validated against `CONFIG.DESTINATIONS`
- CSP: `script-src 'self'; object-src 'self'`
- All `sendMessage` calls use response callbacks with error handling

## Testing

```bash
npm test        # 104 tests
npm run lint    # ESLint (0 warnings)
```

Uses Node's built-in test runner. ESLint 9 flat config.

## Storage keys

All keys are namespaced under `owline_*` and exposed via `OWLINE.KEYS`. Provider settings (`owline_providers`), storage version (`owline_storage_version`) survive logout. Session keys, destinations, and credentials are cleared on sign out.

## Validating a new player adapter

Experimental adapters (YouTube Music, Apple Music, Bandcamp, Plex) need DOM validation:

1. Open the player site, play a track
2. F12 → Console, inspect the player bar DOM selectors
3. Adjust the adapter's `getTrackInfo`, `isPlaying`, `hasPlayer` selectors
4. Move the source from `PROVIDER_CATEGORIES.experimental` to `players` in `shared/config.js`
5. Run `npm test` and `npm run lint`

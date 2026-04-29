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
- Now Playing display in popup
- Badge with scrobble count
- Server-side logout on sign out

## Install (development)

1. `chrome://extensions/` → Enable Developer Mode
2. "Load unpacked" → select this directory
3. Click the Owline icon → Sign in

## Architecture

```
manifest.json          — MV3 manifest, content scripts per platform
background.js          — Service worker: scrobble API, queue, auth, Google OAuth
popup/                 — Login UI + now playing + stats
content/
  base.js              — Shared polling + scrobble logic (singleton per tab)
  spotify.js           — Spotify Web Player selectors (3 fallback strategies)
  youtube.js           — YouTube + YouTube Music selectors
  soundcloud.js        — SoundCloud selectors
  deezer.js            — Deezer selectors
icons/                 — Extension icons (16, 48, 128)
```

## Scrobble rules

- Min 30s of playback OR 50% of track duration (whichever is less)
- 5s debounce between same track
- Tracks > 20min skipped (likely podcasts/mixes) — YouTube and SoundCloud only
- Offline queue persisted in chrome.storage.local (max 200, flushes every 5min)
- Flush stops after 3 failed attempts to avoid infinite retry

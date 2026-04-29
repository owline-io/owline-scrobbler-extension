# Owline Scrobbler — Chrome Extension

Scrobble what you listen to on Spotify, YouTube, SoundCloud and Deezer to [Owline](https://owline.io).

## How it works

1. Install the extension
2. Sign in with your Owline account
3. Play music on any supported platform
4. Tracks are automatically scrobbled after 30s of playback (or 50% of duration)

## Supported platforms

| Platform | Source | Detection |
|----------|--------|-----------|
| Spotify Web Player | `spotify` | Player bar DOM selectors |
| YouTube | `youtube` | Video title + channel parsing |
| YouTube Music | `youtube` | Player bar DOM selectors |
| SoundCloud | `soundcloud` | Player bar DOM selectors |
| Deezer | `deezer` | Player bar DOM selectors |

## Install (development)

1. `chrome://extensions/` → Enable Developer Mode
2. "Load unpacked" → select this directory
3. Click the Owline icon → Sign in

## Architecture

```
manifest.json          — MV3 manifest, content scripts per platform
background.js          — Service worker: scrobble API, queue, badge
popup/                 — Login UI + now playing + stats
content/
  base.js              — Shared polling + scrobble logic
  spotify.js           — Spotify Web Player selectors
  youtube.js           — YouTube + YouTube Music selectors
  soundcloud.js        — SoundCloud selectors
  deezer.js            — Deezer selectors
icons/                 — Extension icons (16, 48, 128)
```

## Scrobble rules

- Min 30s of playback OR 50% of track duration (whichever is less)
- 5s debounce between same track
- Tracks > 20min skipped (likely podcasts/mixes)
- Offline queue with periodic flush (every 5min)

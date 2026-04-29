(function () {
  const root = typeof self !== "undefined" ? self : globalThis;
  root.OWLINE = root.OWLINE || {};

  root.OWLINE.CONFIG = {
    API_BASE: "https://api.owline.io/api/v1",
    GOOGLE_CLIENT_ID: "55887450-l3337k4faqim9i5jspcljs3mqqo9m8ik.apps.googleusercontent.com",
    DEBOUNCE_MS: 5000,
    MAX_QUEUE: 200,
    MAX_FLUSH_ATTEMPTS: 3,
    POLL_INTERVAL_MS: 3000,
    SCROBBLE_AT_MS: 30000,
    MAX_TRACK_DURATION: 1200,
    WAIT_PLAYER_RETRY_MS: 2000,
    PROVIDER_DISABLED_RETRY_MS: 3000,
    MIN_LISTEN_FRACTION: 0.5,
    NOW_PLAYING_TTL_MS: 10000,
    MAX_LOGS: 50,
    FLUSH_PERIOD_MIN: 5,
    REFRESH_PERIOD_MIN: 20,
    PROVIDERS: ["spotify", "youtube", "youtube_music", "soundcloud", "deezer", "tidal", "amazon_music", "apple_music", "bandcamp", "plex"],
    PROVIDER_CATEGORIES: {
      players: ["spotify", "youtube", "soundcloud", "amazon_music"],
      trackers: ["owline"],
      experimental: ["youtube_music", "deezer", "tidal", "apple_music", "bandcamp", "plex"],
    },
    STORAGE_VERSION: 1,
  };
})();

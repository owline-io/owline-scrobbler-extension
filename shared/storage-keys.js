(function () {
  const root = typeof self !== "undefined" ? self : globalThis;
  root.OWLINE = root.OWLINE || {};

  root.OWLINE.KEYS = {
    TOKEN: "owline_token",
    REFRESH: "owline_refresh",
    USER: "owline_user",
    NOW_PLAYING: "owline_now_playing",
    SCROBBLE_COUNT: "owline_scrobble_count",
    QUEUE_COUNT: "owline_queue_count",
    PENDING_QUEUE: "owline_pending_queue",
    PROVIDERS: "owline_providers",
    LAST_SCROBBLE: "owline_last_scrobble",
    FLUSH_ATTEMPTS: "owline_flush_attempts",
    STORAGE_VERSION: "owline_storage_version",
  };

  root.OWLINE.SESSION_KEYS = [
    root.OWLINE.KEYS.TOKEN,
    root.OWLINE.KEYS.REFRESH,
    root.OWLINE.KEYS.USER,
    root.OWLINE.KEYS.NOW_PLAYING,
    root.OWLINE.KEYS.SCROBBLE_COUNT,
    root.OWLINE.KEYS.QUEUE_COUNT,
    root.OWLINE.KEYS.PENDING_QUEUE,
    root.OWLINE.KEYS.LAST_SCROBBLE,
    root.OWLINE.KEYS.FLUSH_ATTEMPTS,
  ];
})();

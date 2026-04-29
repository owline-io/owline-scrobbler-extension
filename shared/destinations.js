(function () {
  const root = typeof self !== "undefined" ? self : globalThis;
  root.OWLINE = root.OWLINE || {};
  const { CONFIG, KEYS } = root.OWLINE;

  /* Minimal MD5 — needed for Last.fm api_sig (WebCrypto does not support MD5) */
  function md5(string) {
    function cmn(q,a,b,x,s,t){a=add(add(a,q),add(x,t));return add((a<<s)|(a>>>(32-s)),b)}
    function ff(a,b,c,d,x,s,t){return cmn((b&c)|((~b)&d),a,b,x,s,t)}
    function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&(~d)),a,b,x,s,t)}
    function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t)}
    function ii(a,b,c,d,x,s,t){return cmn(c^(b|(~d)),a,b,x,s,t)}
    function add(a,b){return(a+b)&0xFFFFFFFF}
    function cycle(x,k){
      let a=x[0],b=x[1],c=x[2],d=x[3];
      a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);
      c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330);
      a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,1200080426);
      c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983);
      a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);
      c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162);
      a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);
      c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329);
      a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);
      c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302);
      a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);
      c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848);
      a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);
      c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501);
      a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);
      c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734);
      a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);
      c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556);
      a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);
      c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640);
      a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);
      c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189);
      a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);
      c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651);
      a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);
      c=ii(c,d,a,b,k[14],15,-1416354905);b=ii(b,c,d,a,k[5],21,-57434055);
      a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);
      c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799);
      a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);
      c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649);
      a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);
      c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551);
      x[0]=add(a,x[0]);x[1]=add(b,x[1]);x[2]=add(c,x[2]);x[3]=add(d,x[3]);
    }
    const n=string.length;
    let state=[1732584193,-271733879,-1732584194,271733878];
    let tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    let i;
    for(i=64;i<=n;i+=64){
      const bl=[];
      for(let j=0;j<64;j+=4)bl.push(string.charCodeAt(i-64+j)|(string.charCodeAt(i-64+j+1)<<8)|(string.charCodeAt(i-64+j+2)<<16)|(string.charCodeAt(i-64+j+3)<<24));
      cycle(state,bl);
    }
    for(let j=0;j<16;j++)tail[j]=0;
    for(let j=i-64;j<n;j++)tail[(j>>2)&15]|=string.charCodeAt(j)<<((j%4)<<3);
    tail[(n>>2)&15]|=0x80<<((n%4)<<3);
    if(n>55){cycle(state,tail);for(let j=0;j<16;j++)tail[j]=0;}
    tail[14]=n*8;
    cycle(state,tail);
    const hex="0123456789abcdef";
    let s="";
    for(let j=0;j<4;j++)for(let k=0;k<4;k++){const b=(state[j]>>(k*8))&0xFF;s+=hex.charAt((b>>4)&0xF)+hex.charAt(b&0xF);}
    return s;
  }

  async function getAll() {
    const data = await chrome.storage.local.get(KEYS.DESTINATIONS);
    const stored = data[KEYS.DESTINATIONS] || {};
    const result = {};
    for (const [id, meta] of Object.entries(CONFIG.DESTINATIONS)) {
      result[id] = {
        enabled: stored[id]?.enabled ?? meta.default,
        credentials: stored[id]?.credentials || null,
      };
    }
    return result;
  }

  async function get(id) {
    const all = await getAll();
    return all[id] || null;
  }

  async function setEnabled(id, enabled) {
    const all = await getAll();
    if (!all[id]) return;
    all[id].enabled = !!enabled;
    await chrome.storage.local.set({ [KEYS.DESTINATIONS]: all });
  }

  async function setCredentials(id, credentials) {
    const all = await getAll();
    if (!all[id]) return;
    all[id].credentials = credentials;
    await chrome.storage.local.set({ [KEYS.DESTINATIONS]: all });
  }

  async function clearCredentials(id) {
    const all = await getAll();
    if (!all[id]) return;
    all[id].credentials = null;
    all[id].enabled = false;
    await chrome.storage.local.set({ [KEYS.DESTINATIONS]: all });
  }

  async function enabledList() {
    const all = await getAll();
    return Object.entries(all)
      .filter(([id, v]) => v.enabled && (v.credentials || CONFIG.DESTINATIONS[id]?.auth === "owline"))
      .map(([id]) => id);
  }

  async function sendToLastfm(track, credentials) {
    if (!credentials?.api_key || !credentials?.api_secret || !credentials?.session_key) {
      return { error: "lastfm_not_configured" };
    }

    const params = {
      method: "track.scrobble",
      api_key: credentials.api_key,
      sk: credentials.session_key,
      "artist[0]": track.artist,
      "track[0]": track.title,
      "timestamp[0]": Math.floor(Date.now() / 1000).toString(),
    };
    if (track.album) params["album[0]"] = track.album;
    if (track.duration) params["duration[0]"] = String(track.duration);

    const sorted = Object.keys(params).sort();
    let sig = "";
    for (const k of sorted) sig += k + params[k];
    sig += credentials.api_secret;

    params.api_sig = md5(sig);
    params.format = "json";

    const body = new URLSearchParams(params);
    const res = await fetch(CONFIG.LASTFM_API_URL, { method: "POST", body });
    if (!res.ok) return { error: `lastfm_http_${res.status}` };
    return { ok: true };
  }

  async function sendToListenBrainz(track, credentials) {
    if (!credentials?.token) {
      return { error: "listenbrainz_not_configured" };
    }

    const payload = {
      listen_type: "single",
      payload: [
        {
          listened_at: Math.floor(Date.now() / 1000),
          track_metadata: {
            artist_name: track.artist,
            track_name: track.title,
            release_name: track.album || undefined,
            additional_info: {
              listening_from: "owline_scrobbler",
              duration_ms: track.duration ? track.duration * 1000 : undefined,
            },
          },
        },
      ],
    };

    const res = await fetch(`${CONFIG.LISTENBRAINZ_API_URL}/1/submit-listens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${credentials.token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { error: `listenbrainz_http_${res.status}` };
    return { ok: true };
  }

  const SENDERS = {
    lastfm: sendToLastfm,
    listenbrainz: sendToListenBrainz,
  };

  async function dispatch(track) {
    const all = await getAll();
    const results = {};

    for (const [id, state] of Object.entries(all)) {
      if (!state.enabled) continue;
      if (id === "owline") continue;
      const sender = SENDERS[id];
      if (!sender) continue;
      if (!state.credentials) {
        results[id] = { error: `${id}_not_configured` };
        continue;
      }
      try {
        results[id] = await sender(track, state.credentials);
      } catch (err) {
        results[id] = { error: err.message };
      }
    }

    return results;
  }

  root.OWLINE.destinations = {
    getAll,
    get,
    setEnabled,
    setCredentials,
    clearCredentials,
    enabledList,
    dispatch,
    sendToLastfm,
    sendToListenBrainz,
  };
})();

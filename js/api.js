/* ═══════════════════════════════════════════════════════
   API Layer – Nebuliton Server Query / RCON-Proxy
   ═══════════════════════════════════════════════════════ */

const DEFAULT_CFG = {
  serverAddress: '',       // z.B. play.nebuliton.io oder play.nebuliton.io:25565
  serverName:    'Mein Nebuliton Server',
  maxPlayers:    20,
  refreshSecs:   30,
  apiUrl:        '',       // RCON-Proxy für Befehle (optional)
  apiToken:      '',
};

class MCApi {
  constructor() {
    this.cfg = this._load();
    this._uuidCache   = {};   // username → uuid
    this._statusCache = null; // letztes Server-Status-Objekt
  }

  /* ── Settings ── */
  _load() {
    try {
      const raw = localStorage.getItem('mc-dash-cfg');
      return raw ? { ...DEFAULT_CFG, ...JSON.parse(raw) } : { ...DEFAULT_CFG };
    } catch { return { ...DEFAULT_CFG }; }
  }
  save(patch) {
    Object.assign(this.cfg, patch);
    localStorage.setItem('mc-dash-cfg', JSON.stringify(this.cfg));
  }
  reset() {
    localStorage.removeItem('mc-dash-cfg');
    this.cfg = { ...DEFAULT_CFG };
  }

  /* ══════════════════════════════════════════════════════
     SPIELER-LISTE
     Priorität: Server-Adresse (mcsrvstat) → RCON-API
     ══════════════════════════════════════════════════════ */
  async getPlayers() {
    if (this.cfg.serverAddress.trim()) {
      return this._fetchFromMcsrvstat();
    }
    return this._get('/players');
  }

  /* ── mcsrvstat.us – öffentliches Server-Status-API ── */
  async _fetchFromMcsrvstat() {
    const addr = this.cfg.serverAddress.trim().replace(/^https?:\/\//i, '');
    const url  = `https://api.mcsrvstat.us/3/${encodeURIComponent(addr)}`;

    const res  = await fetch(url);
    if (!res.ok) throw new Error(`mcsrvstat HTTP ${res.status}`);
    const data = await res.json();
    this._statusCache = data;

    if (!data.online) throw new Error('Server ist offline oder nicht erreichbar');

    /* Spielerliste (kann leer sein wenn der Server sie versteckt) */
    const rawList = data.players?.list ?? [];

    /* Bekannte UUIDs aus dem Status direkt cachen */
    rawList.forEach(p => {
      if (p && typeof p === 'object' && p.uuid && p.name) {
        const clean = p.uuid.replace(/-/g, '');
        this._uuidCache[p.name.toLowerCase()] =
          clean.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
      }
    });

    return rawList.map(entry => {
      const name = typeof entry === 'string' ? entry : entry.name;
      const uuid = typeof entry === 'object' && entry.uuid ? entry.uuid : null;
      return {
        name,
        uuid,
        health: null, maxHealth: null,
        level: null,  xp: null, xpToNext: null,
        gamemode: null, world: null,
        x: null, y: null, z: null,
        dataSource: 'server-status',
      };
    });
  }

  /* ── Server-Infos (MOTD, Version, Spielerzahl) ── */
  async getServerInfo() {
    if (!this.cfg.serverAddress.trim()) return null;
    if (this._statusCache) return this._statusCache;
    const addr = this.cfg.serverAddress.trim().replace(/^https?:\/\//i, '');
    try {
      const res  = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(addr)}`);
      if (!res.ok) return null;
      this._statusCache = await res.json();
      return this._statusCache;
    } catch { return null; }
  }

  clearStatusCache() { this._statusCache = null; }

  /* ══════════════════════════════════════════════════════
     MOJANG / playerdb.co – UUID + Skin
     ══════════════════════════════════════════════════════ */

  /** UUID für Spielernamen via playerdb.co (CORS-freundlich) */
  async getUUID(username) {
    const key = username.toLowerCase();
    if (this._uuidCache[key]) return this._uuidCache[key];

    try {
      const res  = await fetch(
        `https://playerdb.co/api/player/minecraft/${encodeURIComponent(username)}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success && data.data?.player?.id) {
        this._uuidCache[key] = data.data.player.id;
        return this._uuidCache[key];
      }
    } catch {}
    return null;
  }

  /** Crafatar-Avatar-URL (bevorzugt UUID, Fallback auf Username) */
  static avatarUrl(player, size = 64) {
    if (player.uuid) {
      return `https://crafatar.com/avatars/${player.uuid}?size=${size}&overlay=true&default=MHF_Steve`;
    }
    return `https://mc-heads.net/avatar/${encodeURIComponent(player.name)}/${size}`;
  }

  /** Fallback falls beide Bild-Quellen scheitern */
  static fallbackAvatar(name) {
    const colors  = ['#3fb950','#58a6ff','#d29922','#9b6dff','#f85149','#e3814b'];
    const color   = colors[name.charCodeAt(0) % colors.length];
    const letter  = name[0].toUpperCase();
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
      <rect width='64' height='64' fill='${color}' rx='8'/>
      <text x='32' y='46' text-anchor='middle' font-size='32' font-family='monospace' fill='white'>${letter}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /* ══════════════════════════════════════════════════════
     RCON-BEFEHLE (benötigt API-URL)
     ══════════════════════════════════════════════════════ */
  async execute(command) {
    if (!this.cfg.apiUrl) {
      /* Kein RCON-Proxy – Befehl nur anzeigen */
      console.info('[Kein RCON-Proxy] /', command);
      return { success: false, noProxy: true, output: command };
    }
    return this._post('/execute', { command });
  }

  /* ── HTTP-Helfer ── */
  async _get(path) {
    const res = await fetch(this._url(path), { headers: this._headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  async _post(path, body) {
    const res = await fetch(this._url(path), {
      method:  'POST',
      headers: { ...this._headers(), 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  _url(path)    { return this.cfg.apiUrl.replace(/\/$/, '') + path; }
  _headers()    { return this.cfg.apiToken ? { Authorization: `Bearer ${this.cfg.apiToken}` } : {}; }
}

const api = new MCApi();

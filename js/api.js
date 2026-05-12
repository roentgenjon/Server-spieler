/* ═══════════════════════════════════════════════════════
   API Layer – Demo Mode + Real API
   ═══════════════════════════════════════════════════════ */

const DEMO_PLAYERS = [
  {
    name: 'Steve',
    uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    health: 18, maxHealth: 20,
    level: 15, xp: 850, xpToNext: 1200,
    gamemode: 'survival', world: 'world',
    x: 125, y: 64, z: -238,
  },
  {
    name: 'Alex',
    uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    health: 20, maxHealth: 20,
    level: 42, xp: 1200, xpToNext: 3400,
    gamemode: 'survival', world: 'world',
    x: -512, y: 71, z: 304,
  },
  {
    name: 'Notch',
    uuid: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    health: 20, maxHealth: 20,
    level: 7, xp: 300, xpToNext: 600,
    gamemode: 'creative', world: 'world_nether',
    x: 64, y: 45, z: -128,
  },
  {
    name: 'Herobrine',
    uuid: 'd4e5f6a7-b8c9-0123-defa-234567890123',
    health: 40, maxHealth: 40,
    level: 100, xp: 9999, xpToNext: 99999,
    gamemode: 'survival', world: 'world_the_end',
    x: 0, y: 64, z: 0,
  },
  {
    name: 'CreeperFan2',
    uuid: 'e5f6a7b8-c9d0-1234-efab-345678901234',
    health: 6, maxHealth: 20,
    level: 3, xp: 45, xpToNext: 120,
    gamemode: 'adventure', world: 'world',
    x: 800, y: 92, z: 600,
  },
  {
    name: 'DiamondQueen',
    uuid: 'f6a7b8c9-d0e1-2345-fabc-456789012345',
    health: 20, maxHealth: 20,
    level: 60, xp: 5000, xpToNext: 8000,
    gamemode: 'survival', world: 'world',
    x: -200, y: 11, z: 350,
  },
];

/* ── Settings default ── */
const DEFAULT_SETTINGS = {
  apiUrl:      '',
  apiToken:    '',
  serverName:  'Mein Minecraft Server',
  maxPlayers:  20,
  refreshSecs: 30,
  demoMode:    true,
};

class MCApi {
  constructor() {
    this.cfg = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem('mc-dash-cfg');
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  save(patch) {
    Object.assign(this.cfg, patch);
    localStorage.setItem('mc-dash-cfg', JSON.stringify(this.cfg));
  }

  reset() {
    localStorage.removeItem('mc-dash-cfg');
    this.cfg = { ...DEFAULT_SETTINGS };
  }

  /* Returns list of online players */
  async getPlayers() {
    if (this.cfg.demoMode) {
      await this._delay(600 + Math.random() * 400);
      return [...DEMO_PLAYERS];
    }
    return this._get('/players');
  }

  /* Execute a Minecraft command via RCON proxy */
  async execute(command) {
    if (this.cfg.demoMode) {
      await this._delay(300 + Math.random() * 300);
      console.log('[Demo] Befehl:', command);
      return { success: true, output: `[Demo] ${command}` };
    }
    return this._post('/execute', { command });
  }

  /* ── HTTP helpers ── */
  async _get(path) {
    const res = await fetch(this._url(path), { headers: this._headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async _post(path, body) {
    const res = await fetch(this._url(path), {
      method: 'POST',
      headers: { ...this._headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  _url(path) {
    return this.cfg.apiUrl.replace(/\/$/, '') + path;
  }

  _headers() {
    const h = {};
    if (this.cfg.apiToken) h['Authorization'] = `Bearer ${this.cfg.apiToken}`;
    return h;
  }

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}

const api = new MCApi();

/* ═══════════════════════════════════════════════════════
   Minecraft Server Dashboard – App Logic
   ═══════════════════════════════════════════════════════ */

let players       = [];
let activePlayer  = null;
let selectedItem  = null;
let refreshTimer  = null;
let searchQ       = '';

const $  = id  => document.getElementById(id);
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls)              e.className  = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

/* ══════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  applySettings();
  buildDropdowns();
  buildQuickGrids();
  bindNav();
  bindSettings();
  bindModal();
  bindSteppers();
  bindSearch();
  loadPlayers();
  startAutoRefresh();
});

/* ══════════════════════════════════════════════════════
   SETTINGS
   ══════════════════════════════════════════════════════ */

function applySettings() {
  const c = api.cfg;
  $('demo-mode').checked             = c.demoMode;
  $('cfg-server-address').value      = c.serverAddress || '';
  $('api-url').value                 = c.apiUrl || '';
  $('api-token').value               = c.apiToken || '';
  $('cfg-server-name').value         = c.serverName;
  $('cfg-max-players').value         = c.maxPlayers;
  $('cfg-refresh').value             = c.refreshSecs;
  $('server-name-display').textContent = c.serverName;
  $('max-count').textContent           = c.maxPlayers;
  toggleLiveFields(!c.demoMode);
}

function toggleLiveFields(show) {
  $('live-settings-group').style.display = show ? '' : 'none';
}

function bindSettings() {
  $('demo-mode').addEventListener('change', e => toggleLiveFields(!e.target.checked));

  $('save-settings-btn').addEventListener('click', () => {
    api.save({
      demoMode:      $('demo-mode').checked,
      serverAddress: $('cfg-server-address').value.trim(),
      apiUrl:        $('api-url').value.trim(),
      apiToken:      $('api-token').value.trim(),
      serverName:    $('cfg-server-name').value.trim() || 'Mein Nebuliton Server',
      maxPlayers:    parseInt($('cfg-max-players').value) || 20,
      refreshSecs:   parseInt($('cfg-refresh').value) || 30,
    });
    api.clearStatusCache();
    applySettings();
    startAutoRefresh();
    loadPlayers();
    toast('Einstellungen gespeichert', 'success');
  });

  $('reset-settings-btn').addEventListener('click', () => {
    api.reset();
    applySettings();
    toast('Einstellungen zurückgesetzt', 'info');
  });

  $('retry-btn').addEventListener('click', loadPlayers);
  $('refresh-btn').addEventListener('click', () => { api.clearStatusCache(); loadPlayers(); resetRefreshTimer(); });
}

/* ══════════════════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════════════════ */

function bindNav() {
  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById('view-' + item.dataset.view).classList.add('active');
    });
  });
}

/* ══════════════════════════════════════════════════════
   LOAD PLAYERS
   ══════════════════════════════════════════════════════ */

async function loadPlayers() {
  showState('loading');
  const icon = $('refresh-icon');
  icon.classList.add('spin');

  try {
    players = await api.getPlayers();
    renderPlayerGrid();
    updateStatusBar(true);
    updateLastUpdated();

    /* Echte Server-Infos asynchron nachladen */
    loadServerInfo();

    /* UUIDs asynchron per Mojang nachladen (nur bei server-status Modus) */
    if (!api.cfg.demoMode && players.some(p => !p.uuid)) {
      enrichWithUUIDs();
    }
  } catch (err) {
    showState('error');
    $('error-msg').textContent = err.message || 'Verbindung fehlgeschlagen';
    updateStatusBar(false);
  } finally {
    icon.classList.remove('spin');
  }
}

/** UUID-Lookup per Mojang (playerdb.co) für Spieler ohne UUID */
async function enrichWithUUIDs() {
  const missing = players.filter(p => !p.uuid);
  for (const player of missing) {
    const uuid = await api.getUUID(player.name);
    if (uuid) {
      player.uuid = uuid;
      /* Avatar im Grid live aktualisieren */
      const img = document.querySelector(
        `.player-card[data-player="${player.name}"] .card-avatar`
      );
      if (img) {
        img.src = MCApi.avatarUrl(player, 64);
      }
      /* Auch im Modal aktualisieren falls gerade geöffnet */
      if (activePlayer?.name === player.name) {
        $('modal-avatar').src = MCApi.avatarUrl(player, 72);
        $('modal-uuid').textContent = uuid;
      }
    }
  }
}

/** Server-Versioninfo + MOTD in Settings-Karte anzeigen */
async function loadServerInfo() {
  const info = await api.getServerInfo();
  if (!info || !info.online) {
    $('server-info-live').classList.add('hidden');
    return;
  }
  $('server-info-live').classList.remove('hidden');
  $('sil-version').textContent = info.version?.name_clean || info.version?.name || '—';
  const motd = info.motd?.clean?.join(' ') || info.motd?.raw?.[0] || '—';
  $('sil-motd').textContent    = motd.length > 40 ? motd.slice(0, 40) + '…' : motd;
  $('sil-players').textContent = `${info.players?.online ?? 0} / ${info.players?.max ?? '?'}`;

  /* Max-Spieler aus Status übernehmen */
  if (info.players?.max) {
    $('max-count').textContent = info.players.max;
    if (!api.cfg.maxPlayers || api.cfg.maxPlayers === 20) {
      $('cfg-max-players').value = info.players.max;
    }
  }
}

function showState(name) {
  $('state-loading').classList.toggle('hidden', name !== 'loading');
  $('state-error').classList.toggle('hidden',   name !== 'error');
  $('state-empty').classList.toggle('hidden',   name !== 'empty');
  $('player-grid').classList.toggle('hidden',   name !== 'grid');
}

function updateStatusBar(online) {
  const dot  = $('status-dot');
  const text = $('status-text');
  const src  = api.cfg.demoMode ? 'demo' : api.cfg.serverAddress ? 'live' : 'api';
  dot.className    = 'status-dot ' + (online ? 'online' : 'offline');
  text.textContent = online
    ? (src === 'demo' ? 'Demo-Modus' : src === 'live' ? 'Live ✦ ' + (api.cfg.serverAddress || '') : 'Online')
    : 'Offline';
  $('online-count').textContent = players.length;
}

function updateLastUpdated() {
  $('last-updated-text').textContent =
    'Aktualisiert: ' + new Date().toLocaleTimeString('de-DE');
}

/* ══════════════════════════════════════════════════════
   PLAYER GRID
   ══════════════════════════════════════════════════════ */

function renderPlayerGrid() {
  const grid     = $('player-grid');
  grid.innerHTML = '';
  const q        = searchQ.toLowerCase();
  const filtered = players.filter(p => p.name.toLowerCase().includes(q));

  if (filtered.length === 0) { showState('empty'); return; }
  showState('grid');

  filtered.forEach(p => {
    const isLive    = p.dataSource === 'server-status';
    const isPartial = isLive; /* live-Spieler haben noch keine HP/Level */
    const card      = el('div', 'player-card');
    card.dataset.player = p.name;

    card.innerHTML = `
      <span class="card-online-dot"></span>
      <img class="card-avatar"
           src="${MCApi.avatarUrl(p, 64)}"
           alt="${p.name}"
           onerror="this.onerror=null;this.src='${MCApi.fallbackAvatar(p.name)}'">
      <div class="card-name">${p.name}</div>
      <div class="card-meta">
        ${p.gamemode ? `<span class="card-badge badge-${p.gamemode}">${gmLabel(p.gamemode)}</span>` : ''}
        ${p.world    ? `<span class="card-badge badge-spectator">${worldLabel(p.world)}</span>` : ''}
        ${isPartial  ? '<span class="card-partial-badge">Live</span>' : ''}
      </div>
      ${!isPartial && p.health !== null ? `
        <div class="card-health-row">
          <div class="card-health-hearts">${heartsMini(p.health, p.maxHealth)}</div>
          <span>${Math.ceil(p.health / 2)}/${Math.ceil(p.maxHealth / 2)} ❤</span>
        </div>` : `<div class="card-source live">&#127381; Nebuliton Live</div>`}
    `;

    card.addEventListener('click', () => openPlayerModal(p));
    grid.appendChild(card);
  });
}

function heartsMini(hp, maxHp) {
  let h = '';
  const total = Math.min(Math.ceil(maxHp / 2), 10);
  for (let i = 0; i < total; i++) {
    const rem = hp - i * 2;
    if      (rem >= 2) h += '<span class="heart">❤️</span>';
    else if (rem >= 1) h += '<span class="heart" style="opacity:.55">❤️</span>';
    else               h += '<span class="heart" style="opacity:.15">🖤</span>';
  }
  return h;
}

function gmLabel(gm) {
  return { survival:'Survival', creative:'Kreativ', adventure:'Abenteuer', spectator:'Zuschauer' }[gm] || gm;
}
function worldLabel(w) {
  return { world:'Oberwelt', world_nether:'Nether', world_the_end:'Ende' }[w] || w;
}

/* ══════════════════════════════════════════════════════
   AUTO-REFRESH
   ══════════════════════════════════════════════════════ */

function startAutoRefresh() {
  clearInterval(refreshTimer);
  const secs = api.cfg.refreshSecs;
  let cd = secs;
  refreshTimer = setInterval(() => {
    cd--;
    $('auto-refresh-label').textContent = `Auto-Refresh in ${cd}s`;
    if (cd <= 0) { cd = secs; api.clearStatusCache(); loadPlayers(); }
  }, 1000);
  $('auto-refresh-label').textContent = `Auto-Refresh in ${secs}s`;
}
function resetRefreshTimer() { startAutoRefresh(); }

function bindSearch() {
  $('search-input').addEventListener('input', e => { searchQ = e.target.value; renderPlayerGrid(); });
}

/* ══════════════════════════════════════════════════════
   PLAYER MODAL
   ══════════════════════════════════════════════════════ */

function openPlayerModal(player) {
  activePlayer = player;
  const isLive = player.dataSource === 'server-status';
  const hasRcon = !!api.cfg.apiUrl || api.cfg.demoMode;

  /* Avatar */
  const av = $('modal-avatar');
  av.src = MCApi.avatarUrl(player, 72);
  av.onerror = () => { av.onerror = null; av.src = MCApi.fallbackAvatar(player.name); };

  $('modal-player-name').textContent = player.name;
  $('modal-uuid').textContent        = player.uuid || (isLive ? 'Lädt…' : '—');
  $('modal-gamemode-badge').textContent = player.gamemode ? gmLabel(player.gamemode) : '—';
  $('modal-gamemode-badge').className   = `gamemode-badge badge-${player.gamemode || 'spectator'}`;
  $('modal-world-badge').textContent    = player.world ? worldLabel(player.world) : '—';

  /* Stats */
  updateModalStats(player);

  /* "Kein RCON"-Banner ein/ausblenden */
  let banner = $('no-rcon-banner');
  if (!banner) {
    banner = el('div', 'no-rcon-banner', '');
    banner.id = 'no-rcon-banner';
    $('modal-scroll').insertBefore(banner, $('modal-tabs'));
  }
  if (!hasRcon) {
    banner.innerHTML = `<span>&#9888;&#65039;</span>
      <div><strong>Kein RCON-Proxy konfiguriert.</strong>
      Spielerliste wird angezeigt, aber Befehle (Herzen, Items&hellip;) sind nicht m&ouml;glich.
      <a id="goto-settings-link">Einstellungen &rarr;</a></div>`;
    banner.style.display = '';
    document.getElementById('goto-settings-link')?.addEventListener('click', () => {
      closeModal();
      document.querySelector('.nav-item[data-view="settings"]').click();
    });
  } else {
    banner.style.display = 'none';
  }

  /* Tab-Inhalt */
  updateHealthTab(player);
  updateXpTab(player);

  /* Alle Buttons de/aktivieren je nach RCON */
  document.querySelectorAll('.modal-tab-body .btn-success, .modal-tab-body .btn-danger, .modal-tab-body .btn-primary')
    .forEach(b => { b.disabled = !hasRcon; b.title = !hasRcon ? 'RCON-Proxy nicht konfiguriert' : ''; });

  $('modal-backdrop').classList.remove('hidden');
  $('player-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  switchModalTab('health');

  /* UUID nachladen wenn noch nicht vorhanden */
  if (!player.uuid && isLive) {
    api.getUUID(player.name).then(uuid => {
      if (uuid && activePlayer?.name === player.name) {
        activePlayer.uuid = uuid;
        $('modal-uuid').textContent = uuid;
        $('modal-avatar').src = MCApi.avatarUrl(activePlayer, 72);
        const img = document.querySelector(`.player-card[data-player="${player.name}"] .card-avatar`);
        if (img) img.src = MCApi.avatarUrl(activePlayer, 64);
      }
    });
  }
}

function closeModal() {
  $('modal-backdrop').classList.add('hidden');
  $('player-modal').classList.add('hidden');
  document.body.style.overflow = '';
  activePlayer = null;
}

function updateModalStats(player) {
  const hp    = player.health;
  const maxHp = player.maxHealth;
  const na    = '<span class="na">—</span>';

  if (hp !== null && maxHp !== null) {
    $('stat-health').innerHTML = `${hp / 2}/${maxHp / 2}`;
    $('stat-health').classList.remove('na');
    const pct = maxHp > 0 ? (hp / maxHp) * 100 : 0;
    $('health-bar-fill').style.width      = pct + '%';
    $('health-bar-fill').style.background = pct > 50 ? 'var(--green)' : pct > 25 ? 'var(--yellow)' : 'var(--red)';
  } else {
    $('stat-health').innerHTML = na;
    $('health-bar-fill').style.width = '0%';
  }

  $('stat-level').innerHTML = player.level !== null ? player.level : na;
  $('stat-xp').innerHTML    = player.xp    !== null ? (player.xp).toLocaleString('de-DE') : na;

  if (player.x !== null) {
    $('stat-pos').textContent = `${player.x}, ${player.y}, ${player.z}`;
    $('stat-pos').classList.remove('na');
  } else {
    $('stat-pos').innerHTML = na;
  }
}

function updateHealthTab(player) {
  $('health-val').value     = player.health    !== null ? player.health    / 2 : 10;
  $('max-health-val').value = player.maxHealth !== null ? player.maxHealth / 2 : 10;
  renderHearts($('hearts-display'), player.health ?? 0, player.maxHealth ?? 20);
}

function updateXpTab(player) {
  $('xp-level-badge').textContent = player.level ?? 0;
  const pct = player.xpToNext > 0 ? Math.min(100, (player.xp / player.xpToNext) * 100) : 0;
  $('xp-bar-fill').style.width  = pct + '%';
  $('xp-bar-label').textContent = player.xp !== null
    ? `${(player.xp).toLocaleString('de-DE')} XP`
    : 'Keine XP-Daten (RCON benötigt)';
}

function renderHearts(container, hp, maxHp) {
  container.innerHTML = '';
  const total = Math.ceil(maxHp / 2);
  for (let i = 0; i < total; i++) {
    const rem  = hp - i * 2;
    const span = el('span', rem >= 2 ? 'heart-full' : rem >= 1 ? 'heart-half' : 'heart-empty');
    span.textContent = rem >= 1 ? '❤' : '♡';
    container.appendChild(span);
  }
}

/* ── Tab switching ── */
function switchModalTab(name) {
  document.querySelectorAll('.modal-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active',  p.id === `tab-${name}`);
    p.classList.toggle('hidden',  p.id !== `tab-${name}`);
  });
}

function bindModal() {
  $('modal-close').addEventListener('click', closeModal);
  $('modal-backdrop').addEventListener('click', closeModal);
  document.querySelectorAll('.modal-tab').forEach(btn =>
    btn.addEventListener('click', () => switchModalTab(btn.dataset.tab)));

  /* ── Herzen ── */
  $('btn-set-health').addEventListener('click', () => {
    if (!activePlayer) return;
    const hearts = parseFloat($('health-val').value);
    if (isNaN(hearts) || hearts < 0) return toast('Ungültige Herzanzahl', 'error');
    const hp = hearts * 2;
    execCmd(
      `data merge entity @a[name=${activePlayer.name},limit=1] {Health:${hp}f}`,
      `${activePlayer.name} Herzen → ${hearts}`
    );
    activePlayer.health = hp;
    updateModalStats(activePlayer);
    renderHearts($('hearts-display'), hp, activePlayer.maxHealth ?? 20);
  });

  $('btn-heal-full').addEventListener('click', () => {
    if (!activePlayer) return;
    const maxHp = activePlayer.maxHealth ?? 20;
    execCmd(
      `data merge entity @a[name=${activePlayer.name},limit=1] {Health:${maxHp}f}`,
      `${activePlayer.name} vollständig geheilt`
    );
    activePlayer.health = maxHp;
    updateModalStats(activePlayer);
    updateHealthTab(activePlayer);
  });

  $('btn-kill').addEventListener('click', () => {
    if (!activePlayer) return;
    if (!confirm(`Spieler ${activePlayer.name} wirklich töten?`)) return;
    execCmd(`kill ${activePlayer.name}`, `${activePlayer.name} getötet`);
    activePlayer.health = 0;
    updateModalStats(activePlayer);
    renderHearts($('hearts-display'), 0, activePlayer.maxHealth ?? 20);
  });

  $('btn-set-max-health').addEventListener('click', () => {
    if (!activePlayer) return;
    const maxH = parseFloat($('max-health-val').value);
    if (isNaN(maxH) || maxH < 1) return toast('Ungültiger Wert', 'error');
    execCmd(
      `attribute ${activePlayer.name} minecraft:generic.max_health base set ${maxH * 2}`,
      `Max. Herzen von ${activePlayer.name} → ${maxH}`
    );
    activePlayer.maxHealth = maxH * 2;
    updateModalStats(activePlayer);
    renderHearts($('hearts-display'), activePlayer.health ?? 0, maxH * 2);
  });

  $('btn-reset-max-health').addEventListener('click', () => {
    if (!activePlayer) return;
    execCmd(
      `attribute ${activePlayer.name} minecraft:generic.max_health base set 20`,
      `Max. Herzen von ${activePlayer.name} → 10 (Standard)`
    );
    activePlayer.maxHealth = 20;
    $('max-health-val').value = 10;
    updateModalStats(activePlayer);
    renderHearts($('hearts-display'), activePlayer.health ?? 0, 20);
  });

  /* ── Items ── */
  bindItemSearch();

  $('btn-give-item').addEventListener('click', () => {
    if (!activePlayer) return;
    if (!selectedItem)  return toast('Kein Item ausgewählt', 'error');
    const amount = parseInt($('item-amount').value) || 1;
    execCmd(
      `give ${activePlayer.name} ${selectedItem.id} ${amount}`,
      `${amount}× ${selectedItem.name} → ${activePlayer.name}`
    );
  });

  $('btn-clear-item').addEventListener('click', () => {
    if (!activePlayer) return;
    if (!selectedItem)  return toast('Kein Item ausgewählt', 'error');
    execCmd(
      `clear ${activePlayer.name} ${selectedItem.id}`,
      `${selectedItem.name} aus Inventar von ${activePlayer.name} entfernt`
    );
  });

  $('btn-clear-all').addEventListener('click', () => {
    if (!activePlayer) return;
    if (!confirm(`Komplettes Inventar von ${activePlayer.name} leeren?`)) return;
    execCmd(`clear ${activePlayer.name}`, `Inventar von ${activePlayer.name} geleert`);
  });

  /* ── Enchants ── */
  $('enchant-select').addEventListener('change', () => {
    const ench = MC_ENCHANTMENTS.find(e => e.id === $('enchant-select').value);
    const box  = $('enchant-info-box');
    if (ench) {
      box.style.display = '';
      box.innerHTML = `<div class="ench-name ${ench.curse ? 'ench-curse' : ''}">${ench.name}${ench.curse ? ' ⚠️' : ''}</div>
        <div>${ench.desc} · Max. Level: ${ench.max}</div>`;
      $('enchant-level').max   = ench.max;
      $('enchant-level').value = Math.min(parseInt($('enchant-level').value) || 1, ench.max);
    } else {
      box.style.display = 'none';
    }
  });

  $('btn-enchant').addEventListener('click', () => {
    if (!activePlayer) return;
    const id  = $('enchant-select').value;
    const lvl = parseInt($('enchant-level').value);
    if (!id)        return toast('Keine Verzauberung gewählt', 'error');
    if (!lvl || lvl < 1) return toast('Ungültiges Level', 'error');
    const ench = MC_ENCHANTMENTS.find(e => e.id === id);
    execCmd(
      `enchant ${activePlayer.name} ${id} ${lvl}`,
      `${ench?.name || id} ${lvl} auf ${activePlayer.name}s Item`
    );
  });

  $('btn-unenchant').addEventListener('click', () => {
    if (!activePlayer) return;
    execCmd(
      `data modify entity @a[name=${activePlayer.name},limit=1] SelectedItem.tag.Enchantments set value []`,
      `Alle Verzauberungen von ${activePlayer.name}s Item entfernt`
    );
  });

  /* ── Effekte ── */
  $('btn-give-effect').addEventListener('click', () => {
    if (!activePlayer) return;
    const id  = $('effect-select').value;
    const dur = parseInt($('effect-duration').value) || 60;
    const amp = parseInt($('effect-amplifier').value) || 0;
    if (!id) return toast('Kein Effekt gewählt', 'error');
    const eff = MC_EFFECTS.find(e => e.id === id);
    execCmd(
      `effect give ${activePlayer.name} ${id} ${dur} ${amp}`,
      `${eff?.name || id} (${dur}s, Stärke ${amp + 1}) → ${activePlayer.name}`
    );
  });

  $('btn-clear-effects').addEventListener('click', () => {
    if (!activePlayer) return;
    execCmd(`effect clear ${activePlayer.name}`, `Alle Effekte von ${activePlayer.name} entfernt`);
  });

  /* ── XP ── */
  $('btn-add-xp').addEventListener('click', () => {
    if (!activePlayer) return;
    const amount = parseInt($('xp-val').value) || 0;
    const type   = $('xp-type').value;
    if (amount <= 0) return toast('Ungültige XP-Menge', 'error');
    execCmd(`xp add ${activePlayer.name} ${amount} ${type}`,
      `+${amount} ${type === 'levels' ? 'Level' : 'XP'} → ${activePlayer.name}`);
    if (type === 'levels') activePlayer.level = (activePlayer.level ?? 0) + amount;
    else                   activePlayer.xp    = (activePlayer.xp    ?? 0) + amount;
    updateXpTab(activePlayer); updateModalStats(activePlayer);
  });

  $('btn-remove-xp').addEventListener('click', () => {
    if (!activePlayer) return;
    const amount = parseInt($('xp-val').value) || 0;
    const type   = $('xp-type').value;
    if (amount <= 0) return toast('Ungültige XP-Menge', 'error');
    execCmd(`xp add ${activePlayer.name} -${amount} ${type}`,
      `−${amount} ${type === 'levels' ? 'Level' : 'XP'} von ${activePlayer.name}`);
    if (type === 'levels') activePlayer.level = Math.max(0, (activePlayer.level ?? 0) - amount);
    else                   activePlayer.xp    = Math.max(0, (activePlayer.xp    ?? 0) - amount);
    updateXpTab(activePlayer); updateModalStats(activePlayer);
  });

  $('btn-reset-xp').addEventListener('click', () => {
    if (!activePlayer) return;
    execCmd(`xp set ${activePlayer.name} 0 levels`, `XP von ${activePlayer.name} zurückgesetzt`);
    activePlayer.level = 0; activePlayer.xp = 0;
    updateXpTab(activePlayer); updateModalStats(activePlayer);
  });

  /* Quick-XP */
  document.querySelectorAll('[data-action="xp-quick"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!activePlayer) return;
      const val = parseInt(btn.dataset.val), type = btn.dataset.type;
      execCmd(`xp add ${activePlayer.name} ${val} ${type}`,
        `+${val} ${type === 'levels' ? 'Level' : 'XP'} → ${activePlayer.name}`);
      if (type === 'levels') activePlayer.level = (activePlayer.level ?? 0) + val;
      else                   activePlayer.xp    = (activePlayer.xp    ?? 0) + val;
      updateXpTab(activePlayer); updateModalStats(activePlayer);
    });
  });

  document.querySelectorAll('[data-action="xp-quick-remove"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!activePlayer) return;
      const val = parseInt(btn.dataset.val), type = btn.dataset.type;
      execCmd(`xp add ${activePlayer.name} -${val} ${type}`,
        `−${val} ${type === 'levels' ? 'Level' : 'XP'} von ${activePlayer.name}`);
      if (type === 'levels') activePlayer.level = Math.max(0, (activePlayer.level ?? 0) - val);
      else                   activePlayer.xp    = Math.max(0, (activePlayer.xp    ?? 0) - val);
      updateXpTab(activePlayer); updateModalStats(activePlayer);
    });
  });
}

/* ══════════════════════════════════════════════════════
   ITEM AUTOCOMPLETE
   ══════════════════════════════════════════════════════ */

function bindItemSearch() {
  const input    = $('item-search');
  const dropdown = $('item-dropdown');

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    dropdown.innerHTML = '';
    if (q.length < 1) { dropdown.classList.add('hidden'); return; }
    const matches = MC_ITEMS.filter(it =>
      it.id.includes(q) || it.name.toLowerCase().includes(q)).slice(0, 10);
    if (!matches.length) { dropdown.classList.add('hidden'); return; }
    matches.forEach(item => {
      const row = el('div', 'autocomplete-item');
      row.innerHTML = `<span class="autocomplete-icon">${item.icon}</span>
        <span class="autocomplete-name">${item.name}</span>
        <span class="autocomplete-id">${item.id}</span>`;
      row.addEventListener('click', () => selectItem(item));
      dropdown.appendChild(row);
    });
    dropdown.classList.remove('hidden');
  });

  input.addEventListener('blur', () => setTimeout(() => dropdown.classList.add('hidden'), 150));

  $('clear-item-selection').addEventListener('click', () => {
    selectedItem = null;
    $('selected-item-chip').style.display = 'none';
    input.value = '';
  });
}

function selectItem(item) {
  selectedItem = item;
  $('item-search').value = item.id;
  $('item-dropdown').classList.add('hidden');
  $('selected-item-icon').textContent  = item.icon;
  $('selected-item-label').textContent = item.name;
  $('selected-item-chip').style.display = '';
}

/* ══════════════════════════════════════════════════════
   DROPDOWNS (Select-Elemente befüllen)
   ══════════════════════════════════════════════════════ */

function buildDropdowns() {
  const enchSel = $('enchant-select');
  MC_ENCHANTMENTS.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = `${e.name}${e.curse ? ' ⚠️' : ''} (Max. ${e.max})`;
    enchSel.appendChild(opt);
  });

  const effSel  = $('effect-select');
  const grouped = {};
  MC_EFFECTS.forEach(e => {
    const g = e.type === 'positive' ? '✅ Positiv' : e.type === 'negative' ? '❌ Negativ' : '⬜ Neutral';
    (grouped[g] = grouped[g] || []).push(e);
  });
  Object.entries(grouped).forEach(([label, effs]) => {
    const grp = document.createElement('optgroup');
    grp.label = label;
    effs.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = e.name;
      grp.appendChild(opt);
    });
    effSel.appendChild(grp);
  });
}

/* ══════════════════════════════════════════════════════
   QUICK GRIDS
   ══════════════════════════════════════════════════════ */

function buildQuickGrids() {
  const itemGrid = $('quick-items-grid');
  QUICK_ITEMS.forEach(item => {
    const btn = el('button', 'quick-btn');
    btn.innerHTML = `${item.icon} ${item.name}`;
    btn.addEventListener('click', () => {
      if (!activePlayer) return toast('Kein Spieler geöffnet', 'error');
      execCmd(`give ${activePlayer.name} ${item.id} ${item.amount}`,
        `${item.amount}× ${item.name} → ${activePlayer.name}`);
    });
    itemGrid.appendChild(btn);
  });

  const enchGrid = $('quick-enchants-grid');
  QUICK_ENCHANTS.forEach(e => {
    const btn = el('button', 'quick-btn quick-btn--purple');
    btn.textContent = e.name;
    btn.addEventListener('click', () => {
      if (!activePlayer) return toast('Kein Spieler geöffnet', 'error');
      execCmd(`enchant ${activePlayer.name} ${e.id} ${e.level}`,
        `${e.name} auf ${activePlayer.name}s Item`);
    });
    enchGrid.appendChild(btn);
  });

  const effGrid = $('quick-effects-grid');
  QUICK_EFFECTS.forEach(e => {
    const btn = el('button', 'quick-btn quick-btn--blue');
    btn.textContent = e.name;
    btn.addEventListener('click', () => {
      if (!activePlayer) return toast('Kein Spieler geöffnet', 'error');
      execCmd(`effect give ${activePlayer.name} ${e.id} ${e.dur} ${e.amp}`,
        `"${e.name}" → ${activePlayer.name} (${e.dur}s)`);
    });
    effGrid.appendChild(btn);
  });
}

/* ══════════════════════════════════════════════════════
   STEPPERS
   ══════════════════════════════════════════════════════ */

function bindSteppers() {
  document.querySelectorAll('.stepper-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = $(btn.dataset.target);
      if (!input) return;
      const step = parseFloat(btn.dataset.step);
      const min  = parseFloat(input.min) || 0;
      const max  = parseFloat(input.max) || Infinity;
      input.value = Math.min(max, Math.max(min, (parseFloat(input.value) || 0) + step));
    });
  });
}

/* ══════════════════════════════════════════════════════
   EXECUTE COMMAND
   ══════════════════════════════════════════════════════ */

async function execCmd(command, successMsg) {
  try {
    const result = await api.execute(command);
    if (result?.noProxy) {
      /* Kein RCON: Befehl nur anzeigen */
      toast(`Befehl (kein RCON): /${command}`, 'warning', null);
    } else if (result?.success === false) {
      toast(`Fehler: ${result.output || 'Unbekannter Fehler'}`, 'error', command);
    } else {
      toast(successMsg || 'Befehl ausgeführt', 'success', command);
    }
  } catch (err) {
    toast(`Fehler: ${err.message}`, 'error', command);
  }
}

/* ══════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ══════════════════════════════════════════════════════ */

function toast(msg, type = 'info', cmd = null) {
  const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
  const t = el('div', `toast ${type}`);
  t.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <div><div class="toast-msg">${msg}</div>${cmd ? `<div class="toast-cmd">/${cmd}</div>` : ''}</div>`;
  $('toast-container').appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, 4500);
}

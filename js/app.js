/* ═══════════════════════════════════════════════════════
   Minecraft Server Dashboard – App Logic
   ═══════════════════════════════════════════════════════ */

/* ── State ── */
let players       = [];
let activePlayer  = null;
let selectedItem  = null;
let refreshTimer  = null;
let searchQ       = '';

/* ── DOM helpers ── */
const $  = id => document.getElementById(id);
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html !== undefined) e.innerHTML = html; return e; };

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
  $('demo-mode').checked            = c.demoMode;
  $('api-url').value                = c.apiUrl;
  $('api-token').value              = c.apiToken;
  $('cfg-server-name').value        = c.serverName;
  $('cfg-max-players').value        = c.maxPlayers;
  $('cfg-refresh').value            = c.refreshSecs;
  $('server-name-display').textContent = c.serverName;
  $('max-count').textContent        = c.maxPlayers;
  toggleApiFields(!c.demoMode);
}

function toggleApiFields(show) {
  $('api-settings-group').style.display = show ? '' : 'none';
}

function bindSettings() {
  $('demo-mode').addEventListener('change', e => toggleApiFields(!e.target.checked));

  $('save-settings-btn').addEventListener('click', () => {
    api.save({
      demoMode:    $('demo-mode').checked,
      apiUrl:      $('api-url').value.trim(),
      apiToken:    $('api-token').value.trim(),
      serverName:  $('cfg-server-name').value.trim() || 'Mein Minecraft Server',
      maxPlayers:  parseInt($('cfg-max-players').value) || 20,
      refreshSecs: parseInt($('cfg-refresh').value) || 30,
    });
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
  $('refresh-btn').addEventListener('click', () => { loadPlayers(); resetRefreshTimer(); });
}

/* ══════════════════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════════════════ */

function bindNav() {
  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const view = item.dataset.view;
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      $(`view-${view}`).classList.add('active');
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
  } catch (err) {
    showState('error');
    $('error-msg').textContent = err.message || 'Verbindung fehlgeschlagen';
    updateStatusBar(false);
  } finally {
    icon.classList.remove('spin');
  }
}

function showState(name) {
  ['loading','error','empty','grid'].forEach(s => {
    const el = $(s === 'grid' ? 'player-grid' : `state-${s}`);
    if (el) el.classList.toggle('hidden', s !== name);
  });
  if (name === 'grid') {
    $('state-loading').classList.add('hidden');
    $('state-error').classList.add('hidden');
    $('state-empty').classList.add('hidden');
    $('player-grid').classList.remove('hidden');
  }
}

function updateStatusBar(online) {
  const dot  = $('status-dot');
  const text = $('status-text');
  dot.className  = 'status-dot ' + (online ? 'online' : 'offline');
  text.textContent = online ? 'Online' : 'Offline';
  $('online-count').textContent = players.length;
}

function updateLastUpdated() {
  const now = new Date();
  $('last-updated-text').textContent = `Zuletzt aktualisiert: ${now.toLocaleTimeString('de-DE')}`;
}

/* ══════════════════════════════════════════════════════
   PLAYER GRID
   ══════════════════════════════════════════════════════ */

function renderPlayerGrid() {
  const grid = $('player-grid');
  grid.innerHTML = '';

  const q = searchQ.toLowerCase();
  const filtered = players.filter(p => p.name.toLowerCase().includes(q));

  if (filtered.length === 0) {
    showState(q ? 'empty' : 'empty');
    return;
  }

  showState('grid');

  filtered.forEach(p => {
    const card = el('div', 'player-card');
    card.innerHTML = `
      <span class="card-online-dot"></span>
      <img class="card-avatar"
           src="https://mc-heads.net/avatar/${encodeURIComponent(p.name)}/64"
           alt="${p.name}"
           onerror="this.src='https://minotar.net/avatar/${encodeURIComponent(p.name)}/64'">
      <div class="card-name">${p.name}</div>
      <div class="card-meta">
        <span class="card-badge badge-${p.gamemode}">${gmLabel(p.gamemode)}</span>
        <span class="card-badge badge-spectator">${worldLabel(p.world)}</span>
      </div>
      <div class="card-health-row">
        <div class="card-health-hearts">${renderHeartsMini(p.health, p.maxHealth)}</div>
        <span>${Math.ceil(p.health/2)}/${Math.ceil(p.maxHealth/2)} ❤</span>
      </div>`;
    card.addEventListener('click', () => openPlayerModal(p));
    grid.appendChild(card);
  });
}

function renderHeartsMini(hp, maxHp) {
  let html = '';
  const hearts = Math.ceil(maxHp / 2);
  for (let i = 0; i < Math.min(hearts, 10); i++) {
    const val = hp - i * 2;
    if (val >= 2)      html += '<span class="heart">❤️</span>';
    else if (val >= 1) html += '<span class="heart" style="opacity:.5">❤️</span>';
    else               html += '<span class="heart" style="opacity:.15">🖤</span>';
  }
  return html;
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
  let countdown = secs;

  refreshTimer = setInterval(() => {
    countdown--;
    $('auto-refresh-label').textContent = `Auto-Refresh in ${countdown}s`;
    if (countdown <= 0) {
      countdown = secs;
      loadPlayers();
    }
  }, 1000);
  $('auto-refresh-label').textContent = `Auto-Refresh in ${secs}s`;
}

function resetRefreshTimer() {
  startAutoRefresh();
}

/* ══════════════════════════════════════════════════════
   SEARCH
   ══════════════════════════════════════════════════════ */

function bindSearch() {
  $('search-input').addEventListener('input', e => {
    searchQ = e.target.value;
    renderPlayerGrid();
  });
}

/* ══════════════════════════════════════════════════════
   PLAYER MODAL
   ══════════════════════════════════════════════════════ */

function openPlayerModal(player) {
  activePlayer = player;

  /* Header */
  const av = $('modal-avatar');
  av.src = `https://mc-heads.net/avatar/${encodeURIComponent(player.name)}/72`;
  av.onerror = () => { av.src = `https://minotar.net/avatar/${encodeURIComponent(player.name)}/72`; };
  $('modal-player-name').textContent = player.name;
  $('modal-uuid').textContent = player.uuid || '—';
  $('modal-gamemode-badge').textContent = gmLabel(player.gamemode);
  $('modal-gamemode-badge').className = `gamemode-badge badge-${player.gamemode}`;
  $('modal-world-badge').textContent = worldLabel(player.world);

  /* Stats */
  updateModalStats(player);

  /* Tab content */
  updateHealthTab(player);
  updateXpTab(player);

  /* Show modal */
  $('modal-backdrop').classList.remove('hidden');
  $('player-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  /* Switch to health tab */
  switchModalTab('health');
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
  $('stat-health').textContent = `${hp/2}/${maxHp/2}`;
  const pct = maxHp > 0 ? (hp / maxHp) * 100 : 0;
  $('health-bar-fill').style.width = pct + '%';
  $('health-bar-fill').style.background = pct > 50 ? 'var(--green)' : pct > 25 ? 'var(--yellow)' : 'var(--red)';
  $('stat-level').textContent = player.level;
  $('stat-xp').textContent    = `${(player.xp || 0).toLocaleString('de-DE')}`;
  $('stat-pos').textContent   = `${player.x}, ${player.y}, ${player.z}`;
}

function updateHealthTab(player) {
  $('health-val').value     = player.health / 2;
  $('max-health-val').value = player.maxHealth / 2;
  renderHearts($('hearts-display'), player.health, player.maxHealth);
}

function updateXpTab(player) {
  $('xp-level-badge').textContent = player.level;
  const pct = player.xpToNext > 0 ? Math.min(100, (player.xp / player.xpToNext) * 100) : 0;
  $('xp-bar-fill').style.width   = pct + '%';
  $('xp-bar-label').textContent  = `${(player.xp || 0).toLocaleString('de-DE')} XP`;
}

function renderHearts(container, hp, maxHp) {
  container.innerHTML = '';
  const totalHearts = Math.ceil(maxHp / 2);
  for (let i = 0; i < totalHearts; i++) {
    const remaining = hp - i * 2;
    const span = el('span', '');
    if      (remaining >= 2) { span.className = 'heart-full';  span.textContent = '❤'; }
    else if (remaining >= 1) { span.className = 'heart-half';  span.textContent = '❤'; }
    else                     { span.className = 'heart-empty'; span.textContent = '♡'; }
    container.appendChild(span);
  }
}

/* ── Tab switching ── */

function switchModalTab(name) {
  document.querySelectorAll('.modal-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === name)
  );
  document.querySelectorAll('.tab-pane').forEach(p =>
    p.classList.toggle('active', p.id === `tab-${name}`)
  );
  document.querySelectorAll('.tab-pane').forEach(p =>
    p.classList.toggle('hidden', p.id !== `tab-${name}`)
  );
}

function bindModal() {
  $('modal-close').addEventListener('click', closeModal);
  $('modal-backdrop').addEventListener('click', closeModal);

  document.querySelectorAll('.modal-tab').forEach(btn => {
    btn.addEventListener('click', () => switchModalTab(btn.dataset.tab));
  });

  /* ── Health ── */
  $('btn-set-health').addEventListener('click', () => {
    if (!activePlayer) return;
    const hearts = parseFloat($('health-val').value);
    if (isNaN(hearts) || hearts < 0) return toast('Ungültige Herzanzahl', 'error');
    const hp = hearts * 2;
    execCmd(
      `data merge entity @a[name=${activePlayer.name},limit=1] {Health:${hp}f}`,
      `${activePlayer.name} Herzen auf ${hearts} gesetzt`
    );
    activePlayer.health = hp;
    updateModalStats(activePlayer);
    renderHearts($('hearts-display'), hp, activePlayer.maxHealth);
  });

  $('btn-heal-full').addEventListener('click', () => {
    if (!activePlayer) return;
    execCmd(
      `data merge entity @a[name=${activePlayer.name},limit=1] {Health:${activePlayer.maxHealth}f}`,
      `${activePlayer.name} vollständig geheilt`
    );
    activePlayer.health = activePlayer.maxHealth;
    updateModalStats(activePlayer);
    updateHealthTab(activePlayer);
  });

  $('btn-kill').addEventListener('click', () => {
    if (!activePlayer) return;
    if (!confirm(`Spieler ${activePlayer.name} wirklich töten?`)) return;
    execCmd(`kill ${activePlayer.name}`, `${activePlayer.name} wurde getötet`);
    activePlayer.health = 0;
    updateModalStats(activePlayer);
    renderHearts($('hearts-display'), 0, activePlayer.maxHealth);
  });

  $('btn-set-max-health').addEventListener('click', () => {
    if (!activePlayer) return;
    const maxH = parseFloat($('max-health-val').value);
    if (isNaN(maxH) || maxH < 1) return toast('Ungültiger Wert', 'error');
    const val = maxH * 2;
    execCmd(
      `attribute ${activePlayer.name} minecraft:generic.max_health base set ${val}`,
      `Max. Herzen von ${activePlayer.name} auf ${maxH} gesetzt`
    );
    activePlayer.maxHealth = val;
    updateModalStats(activePlayer);
    renderHearts($('hearts-display'), activePlayer.health, val);
  });

  $('btn-reset-max-health').addEventListener('click', () => {
    if (!activePlayer) return;
    execCmd(
      `attribute ${activePlayer.name} minecraft:generic.max_health base set 20`,
      `Max. Herzen von ${activePlayer.name} auf 10 zurückgesetzt`
    );
    activePlayer.maxHealth = 20;
    $('max-health-val').value = 10;
    updateModalStats(activePlayer);
    renderHearts($('hearts-display'), activePlayer.health, 20);
  });

  /* ── Items ── */
  bindItemSearch();

  $('btn-give-item').addEventListener('click', () => {
    if (!activePlayer) return;
    if (!selectedItem) return toast('Kein Item ausgewählt', 'error');
    const amount = parseInt($('item-amount').value) || 1;
    execCmd(
      `give ${activePlayer.name} ${selectedItem.id} ${amount}`,
      `${amount}x ${selectedItem.name} an ${activePlayer.name} gegeben`
    );
  });

  $('btn-clear-item').addEventListener('click', () => {
    if (!activePlayer) return;
    if (!selectedItem) return toast('Kein Item ausgewählt', 'error');
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
    const id   = $('enchant-select').value;
    const ench = MC_ENCHANTMENTS.find(e => e.id === id);
    const box  = $('enchant-info-box');
    if (ench) {
      box.style.display = '';
      box.innerHTML = `<div class="ench-name ${ench.curse ? 'ench-curse' : ''}">${ench.name}${ench.curse ? ' ⚠️' : ''}</div>
        <div>${ench.desc} &middot; Max. Level: ${ench.max}</div>`;
      $('enchant-level').max   = ench.max;
      $('enchant-level').value = Math.min($('enchant-level').value, ench.max);
    } else {
      box.style.display = 'none';
    }
  });

  $('btn-enchant').addEventListener('click', () => {
    if (!activePlayer) return;
    const id  = $('enchant-select').value;
    const lvl = parseInt($('enchant-level').value);
    if (!id) return toast('Keine Verzauberung ausgewählt', 'error');
    if (!lvl || lvl < 1) return toast('Ungültiges Level', 'error');
    const ench = MC_ENCHANTMENTS.find(e => e.id === id);
    execCmd(
      `enchant ${activePlayer.name} ${id} ${lvl}`,
      `${ench?.name || id} ${lvl} auf ${activePlayer.name}s Item angewendet`
    );
  });

  $('btn-unenchant').addEventListener('click', () => {
    if (!activePlayer) return;
    execCmd(
      `data modify entity @a[name=${activePlayer.name},limit=1] SelectedItem.tag.Enchantments set value []`,
      `Alle Verzauberungen vom gehaltenen Item von ${activePlayer.name} entfernt`
    );
  });

  /* ── Effects ── */
  $('btn-give-effect').addEventListener('click', () => {
    if (!activePlayer) return;
    const id  = $('effect-select').value;
    const dur = parseInt($('effect-duration').value) || 60;
    const amp = parseInt($('effect-amplifier').value) || 0;
    if (!id) return toast('Kein Effekt ausgewählt', 'error');
    const eff = MC_EFFECTS.find(e => e.id === id);
    execCmd(
      `effect give ${activePlayer.name} ${id} ${dur} ${amp}`,
      `Effekt ${eff?.name || id} (${dur}s, Stärke ${amp+1}) an ${activePlayer.name} gegeben`
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
    execCmd(
      `xp add ${activePlayer.name} ${amount} ${type}`,
      `${amount} ${type === 'levels' ? 'Level' : 'XP'} an ${activePlayer.name} gegeben`
    );
    if (type === 'levels') activePlayer.level += amount;
    else activePlayer.xp += amount;
    updateXpTab(activePlayer);
    updateModalStats(activePlayer);
  });

  $('btn-remove-xp').addEventListener('click', () => {
    if (!activePlayer) return;
    const amount = parseInt($('xp-val').value) || 0;
    const type   = $('xp-type').value;
    if (amount <= 0) return toast('Ungültige XP-Menge', 'error');
    execCmd(
      `xp add ${activePlayer.name} -${amount} ${type}`,
      `${amount} ${type === 'levels' ? 'Level' : 'XP'} von ${activePlayer.name} entfernt`
    );
    if (type === 'levels') activePlayer.level = Math.max(0, activePlayer.level - amount);
    else activePlayer.xp = Math.max(0, activePlayer.xp - amount);
    updateXpTab(activePlayer);
    updateModalStats(activePlayer);
  });

  $('btn-reset-xp').addEventListener('click', () => {
    if (!activePlayer) return;
    execCmd(`xp set ${activePlayer.name} 0 levels`, `XP von ${activePlayer.name} auf 0 zurückgesetzt`);
    activePlayer.level = 0;
    activePlayer.xp    = 0;
    updateXpTab(activePlayer);
    updateModalStats(activePlayer);
  });

  /* Quick XP buttons */
  document.querySelectorAll('[data-action="xp-quick"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!activePlayer) return;
      const val  = parseInt(btn.dataset.val);
      const type = btn.dataset.type;
      execCmd(`xp add ${activePlayer.name} ${val} ${type}`,
        `+${val} ${type === 'levels' ? 'Level' : 'XP'} an ${activePlayer.name}`);
      if (type === 'levels') activePlayer.level += val;
      else activePlayer.xp += val;
      updateXpTab(activePlayer);
      updateModalStats(activePlayer);
    });
  });

  document.querySelectorAll('[data-action="xp-quick-remove"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!activePlayer) return;
      const val  = parseInt(btn.dataset.val);
      const type = btn.dataset.type;
      execCmd(`xp add ${activePlayer.name} -${val} ${type}`,
        `−${val} ${type === 'levels' ? 'Level' : 'XP'} von ${activePlayer.name}`);
      if (type === 'levels') activePlayer.level = Math.max(0, activePlayer.level - val);
      else activePlayer.xp = Math.max(0, activePlayer.xp - val);
      updateXpTab(activePlayer);
      updateModalStats(activePlayer);
    });
  });
}

/* ══════════════════════════════════════════════════════
   ITEM SEARCH (AUTOCOMPLETE)
   ══════════════════════════════════════════════════════ */

function bindItemSearch() {
  const input    = $('item-search');
  const dropdown = $('item-dropdown');

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    dropdown.innerHTML = '';
    if (q.length < 1) { dropdown.classList.add('hidden'); return; }

    const matches = MC_ITEMS.filter(it =>
      it.id.includes(q) || it.name.toLowerCase().includes(q)
    ).slice(0, 10);

    if (matches.length === 0) { dropdown.classList.add('hidden'); return; }

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
   DROPDOWNS (Enchants, Effects)
   ══════════════════════════════════════════════════════ */

function buildDropdowns() {
  /* Enchantments */
  const enchSel = $('enchant-select');
  MC_ENCHANTMENTS.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = `${e.name}${e.curse ? ' ⚠️' : ''} (Max. ${e.max})`;
    enchSel.appendChild(opt);
  });

  /* Effects */
  const effSel = $('effect-select');
  const grouped = {};
  MC_EFFECTS.forEach(e => {
    const g = e.type === 'positive' ? '✅ Positiv' : e.type === 'negative' ? '❌ Negativ' : '⬜ Neutral';
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(e);
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
  /* Quick Items */
  const itemGrid = $('quick-items-grid');
  QUICK_ITEMS.forEach(item => {
    const btn = el('button', 'quick-btn');
    btn.innerHTML = `${item.icon} ${item.name}`;
    btn.addEventListener('click', () => {
      if (!activePlayer) return toast('Kein Spieler geöffnet', 'error');
      execCmd(`give ${activePlayer.name} ${item.id} ${item.amount}`,
        `${item.amount}x ${item.name} an ${activePlayer.name}`);
    });
    itemGrid.appendChild(btn);
  });

  /* Quick Enchants */
  const enchGrid = $('quick-enchants-grid');
  QUICK_ENCHANTS.forEach(e => {
    const btn = el('button', 'quick-btn quick-btn--purple');
    btn.textContent = e.name;
    btn.addEventListener('click', () => {
      if (!activePlayer) return toast('Kein Spieler geöffnet', 'error');
      execCmd(`enchant ${activePlayer.name} ${e.id} ${e.level}`,
        `${e.name} auf ${activePlayer.name}s Item angewendet`);
    });
    enchGrid.appendChild(btn);
  });

  /* Quick Effects */
  const effGrid = $('quick-effects-grid');
  QUICK_EFFECTS.forEach(e => {
    const btn = el('button', 'quick-btn quick-btn--blue');
    btn.textContent = e.name;
    btn.addEventListener('click', () => {
      if (!activePlayer) return toast('Kein Spieler geöffnet', 'error');
      execCmd(`effect give ${activePlayer.name} ${e.id} ${e.dur} ${e.amp}`,
        `Effekt "${e.name}" an ${activePlayer.name} (${e.dur}s)`);
    });
    effGrid.appendChild(btn);
  });
}

/* ══════════════════════════════════════════════════════
   STEPPERS (+ / - buttons for number inputs)
   ══════════════════════════════════════════════════════ */

function bindSteppers() {
  document.querySelectorAll('.stepper-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = $(btn.dataset.target);
      if (!input) return;
      const step = parseFloat(btn.dataset.step);
      const min  = parseFloat(input.min ?? -Infinity);
      const max  = parseFloat(input.max ??  Infinity);
      const cur  = parseFloat(input.value) || 0;
      input.value = Math.min(max, Math.max(min, cur + step));
      input.dispatchEvent(new Event('change'));
    });
  });
}

/* ══════════════════════════════════════════════════════
   EXECUTE COMMAND
   ══════════════════════════════════════════════════════ */

async function execCmd(command, successMsg) {
  try {
    const result = await api.execute(command);
    if (result && result.success === false) {
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
  const container = $('toast-container');

  const t = el('div', `toast ${type}`);
  t.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <div><div class="toast-msg">${msg}</div>${cmd ? `<div class="toast-cmd">/${cmd}</div>` : ''}</div>`;
  container.appendChild(t);

  setTimeout(() => {
    t.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, 4000);
}

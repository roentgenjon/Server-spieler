/* ═══════════════════════════════════════════════════════
   Minecraft Data – Items, Enchantments, Effects (DE)
   ═══════════════════════════════════════════════════════ */

const MC_ENCHANTMENTS = [
  // ── Universal ──
  { id:'unbreaking',           name:'Haltbarkeit',          max:3,   cat:'*',          desc:'Reduziert Haltbarkeitsverlust', curse:false },
  { id:'mending',              name:'Ausbesserung',          max:1,   cat:'*',          desc:'Repariert Item mit gesammelter XP', curse:false },
  { id:'curse_of_vanishing',   name:'Fluch des Verlusts',   max:1,   cat:'*',          desc:'Item verschwindet beim Tod', curse:true },
  { id:'curse_of_binding',     name:'Fluch der Bindung',    max:1,   cat:'armor',      desc:'Item kann nicht abgelegt werden', curse:true },

  // ── Sword ──
  { id:'sharpness',            name:'Schärfe',               max:5,   cat:'sword',      desc:'Erhöht den Nahkampfschaden' },
  { id:'smite',                name:'Erschlagen',            max:5,   cat:'sword',      desc:'Extra-Schaden gegen Untote' },
  { id:'bane_of_arthropods',   name:'Naturfeind',            max:5,   cat:'sword',      desc:'Extra-Schaden gegen Gliederfüßer' },
  { id:'knockback',            name:'Rückstoß',              max:2,   cat:'sword',      desc:'Erhöht den Rückstoß bei Treffern' },
  { id:'fire_aspect',          name:'Feuerhauch',            max:2,   cat:'sword',      desc:'Setzt Ziel in Brand' },
  { id:'looting',              name:'Plünderung',            max:3,   cat:'sword',      desc:'Erhöht Loot-Menge von Mobs' },
  { id:'sweeping_edge',        name:'Kreisschlag',           max:3,   cat:'sword',      desc:'Erhöht Kreisschlag-Schaden' },

  // ── Bow ──
  { id:'power',                name:'Schlagkraft',           max:5,   cat:'bow',        desc:'Erhöht Schaden durch Pfeile' },
  { id:'punch',                name:'Stoß',                  max:2,   cat:'bow',        desc:'Erhöht Rückstoß von Pfeilen' },
  { id:'flame',                name:'Flamme',                max:1,   cat:'bow',        desc:'Pfeile setzen Ziele in Brand' },
  { id:'infinity',             name:'Unendlichkeit',         max:1,   cat:'bow',        desc:'Benötigt nur 1 Pfeil im Inventar' },

  // ── Crossbow ──
  { id:'multishot',            name:'Mehrfachschuss',        max:1,   cat:'crossbow',   desc:'Schießt 3 Pfeile auf einmal' },
  { id:'quick_charge',         name:'Schnellladung',         max:3,   cat:'crossbow',   desc:'Kürzere Ladezeit' },
  { id:'piercing',             name:'Durchdringung',         max:4,   cat:'crossbow',   desc:'Pfeile durchdringen mehrere Gegner' },

  // ── Trident ──
  { id:'impaling',             name:'Durchbohrung',          max:5,   cat:'trident',    desc:'Extra-Schaden gegen Wassermobs' },
  { id:'riptide',              name:'Wirbelwind',            max:3,   cat:'trident',    desc:'Schleudert Spieler beim Werfen (Regen)' },
  { id:'loyalty',              name:'Treue',                 max:3,   cat:'trident',    desc:'Dreizack kehrt nach dem Wurf zurück' },
  { id:'channeling',           name:'Kanalisation',          max:1,   cat:'trident',    desc:'Ruft Blitz bei Gewitter herbei' },

  // ── Pickaxe / Shovel / Axe / Hoe ──
  { id:'efficiency',           name:'Effizienz',             max:5,   cat:'tool',       desc:'Erhöht Abbaugeschwindigkeit' },
  { id:'silk_touch',           name:'Behutsamkeit',          max:1,   cat:'tool',       desc:'Blöcke fallen als sie selbst' },
  { id:'fortune',              name:'Glück',                 max:3,   cat:'tool',       desc:'Erhöht Block-Drops' },

  // ── Armor (alle) ──
  { id:'protection',           name:'Schutz',                max:4,   cat:'armor',      desc:'Verringert erlittenen Schaden' },
  { id:'fire_protection',      name:'Feuerschutz',           max:4,   cat:'armor',      desc:'Verringert Feuerschaden' },
  { id:'blast_protection',     name:'Explosionsschutz',      max:4,   cat:'armor',      desc:'Verringert Explosionsschaden' },
  { id:'projectile_protection',name:'Projektilschutz',       max:4,   cat:'armor',      desc:'Verringert Projektilschaden' },
  { id:'thorns',               name:'Dornen',                max:3,   cat:'armor',      desc:'Reflektiert Schaden auf Angreifer' },

  // ── Helm ──
  { id:'respiration',          name:'Atmung',                max:3,   cat:'helmet',     desc:'Verlängert Unterwasser-Atemzeit' },
  { id:'aqua_affinity',        name:'Wasseraffinität',       max:1,   cat:'helmet',     desc:'Normales Abbauen unter Wasser' },

  // ── Boots ──
  { id:'feather_falling',      name:'Federfall',             max:4,   cat:'boots',      desc:'Verringert Fallschaden' },
  { id:'depth_strider',        name:'Tiefenwanderer',        max:3,   cat:'boots',      desc:'Schneller Bewegen unter Wasser' },
  { id:'frost_walker',         name:'Eiswanderer',           max:2,   cat:'boots',      desc:'Verwandelt Wasser zu Eis beim Gehen' },
  { id:'soul_speed',           name:'Seelengeschwindigkeit', max:3,   cat:'boots',      desc:'Schnell auf Seelensand/Seelenboden' },

  // ── Leggings ──
  { id:'swift_sneak',          name:'Flinkes Schleichen',    max:3,   cat:'leggings',   desc:'Schneller schleichen' },

  // ── Fishing Rod ──
  { id:'luck_of_the_sea',      name:'Meeresglück',           max:3,   cat:'fishing_rod',desc:'Bessere Beute beim Angeln' },
  { id:'lure',                 name:'Köder',                 max:3,   cat:'fishing_rod',desc:'Kürzere Wartezeit beim Angeln' },
];

/* ─────────────────────────────────────────────── */

const MC_EFFECTS = [
  { id:'speed',               name:'Schnelligkeit',        color:'#7CAFC7', type:'positive', desc:'Bewegungsgeschwindigkeit erhöht' },
  { id:'slowness',            name:'Langsamkeit',          color:'#5A6C81', type:'negative', desc:'Bewegungsgeschwindigkeit verringert' },
  { id:'haste',               name:'Eile',                 color:'#D9C043', type:'positive', desc:'Abbaugeschwindigkeit erhöht' },
  { id:'mining_fatigue',      name:'Abbaumüdigkeit',       color:'#4A4217', type:'negative', desc:'Abbaugeschwindigkeit verringert' },
  { id:'strength',            name:'Stärke',               color:'#932423', type:'positive', desc:'Nahkampfschaden erhöht' },
  { id:'instant_health',      name:'Sofortige Heilung',    color:'#F82423', type:'positive', desc:'Heilt sofort Lebenspunkte' },
  { id:'instant_damage',      name:'Sofortiger Schaden',   color:'#430A09', type:'negative', desc:'Verursacht sofort Schaden' },
  { id:'jump_boost',          name:'Sprungkraft',          color:'#786297', type:'positive', desc:'Sprungkraft erhöht' },
  { id:'nausea',              name:'Übelkeit',             color:'#551D4A', type:'negative', desc:'Dreht das Bild (Seekrankheit)' },
  { id:'regeneration',        name:'Regeneration',         color:'#CD5CAB', type:'positive', desc:'Lebenspunkte regenerieren sich' },
  { id:'resistance',          name:'Widerstand',           color:'#99453A', type:'positive', desc:'Erlittener Schaden verringert' },
  { id:'fire_resistance',     name:'Feuerschutz',          color:'#E49A3A', type:'positive', desc:'Kein Feuer- und Lavschaden' },
  { id:'water_breathing',     name:'Wasseratmung',         color:'#2E5299', type:'positive', desc:'Unbegrenzt Luft unter Wasser' },
  { id:'invisibility',        name:'Unsichtbarkeit',       color:'#7F8392', type:'positive', desc:'Spieler ist unsichtbar' },
  { id:'blindness',           name:'Blindheit',            color:'#1F1F23', type:'negative', desc:'Sichtweite stark eingeschränkt' },
  { id:'night_vision',        name:'Nachtsicht',           color:'#1F1FA1', type:'positive', desc:'Sehen im Dunkeln' },
  { id:'hunger',              name:'Hunger',               color:'#587653', type:'negative', desc:'Hungeranzeige nimmt schnell ab' },
  { id:'weakness',            name:'Schwäche',             color:'#484D48', type:'negative', desc:'Nahkampfschaden verringert' },
  { id:'poison',              name:'Gift',                 color:'#4E9331', type:'negative', desc:'Vergiftet (stirbt nicht daran)' },
  { id:'wither',              name:'Wither-Effekt',        color:'#352A27', type:'negative', desc:'Starker Gifteffekt (kann töten)' },
  { id:'health_boost',        name:'Gesundheitsschub',     color:'#F87D23', type:'positive', desc:'Max. Lebenspunkte erhöht' },
  { id:'absorption',          name:'Absorption',           color:'#2552A5', type:'positive', desc:'Gibt zusätzliche Schutzherzen' },
  { id:'saturation',          name:'Sättigung',            color:'#F82423', type:'positive', desc:'Füllt Hunger und Lebenspunkte' },
  { id:'glowing',             name:'Leuchtend',            color:'#94A061', type:'neutral',  desc:'Spieler leuchtet durch Wände' },
  { id:'levitation',          name:'Schweben',             color:'#CEFFFF', type:'negative', desc:'Schwebt unkontrolliert nach oben' },
  { id:'luck',                name:'Glück',                color:'#339900', type:'positive', desc:'Verbessert Loot-Tabellen' },
  { id:'unluck',              name:'Pech',                 color:'#C0A44D', type:'negative', desc:'Verschlechtert Loot-Tabellen' },
  { id:'slow_falling',        name:'Langsamer Fall',       color:'#F7F8E0', type:'positive', desc:'Fällt sehr langsam herunter' },
  { id:'conduit_power',       name:'Konduit-Kraft',        color:'#1DC2D1', type:'positive', desc:'Wasservorteil (Nachtsicht+Haste+Atem)' },
  { id:'dolphins_grace',      name:'Delfinanmut',          color:'#88A3BE', type:'positive', desc:'Erhöht Schwimmgeschwindigkeit' },
  { id:'bad_omen',            name:'Schlechtes Omen',      color:'#0B6138', type:'negative', desc:'Löst einen Dorfüberfall aus' },
  { id:'hero_of_the_village', name:'Dorftourist',          color:'#44FF44', type:'positive', desc:'Bessere Händlerpreise im Dorf' },
  { id:'darkness',            name:'Dunkelheit',           color:'#292721', type:'negative', desc:'Sichtweite stark reduziert' },
];

/* ─────────────────────────────────────────────── */

const MC_ITEMS = [
  // ── Waffen ──
  { id:'netherite_sword',   name:'Netherit-Schwert',          icon:'⚔️',  cat:'Waffen' },
  { id:'diamond_sword',     name:'Diamantschwert',             icon:'⚔️',  cat:'Waffen' },
  { id:'iron_sword',        name:'Eisenschwert',               icon:'⚔️',  cat:'Waffen' },
  { id:'stone_sword',       name:'Steinschwert',               icon:'⚔️',  cat:'Waffen' },
  { id:'golden_sword',      name:'Goldschwert',                icon:'⚔️',  cat:'Waffen' },
  { id:'wooden_sword',      name:'Holzschwert',                icon:'⚔️',  cat:'Waffen' },
  { id:'bow',               name:'Bogen',                      icon:'🏹',  cat:'Waffen' },
  { id:'crossbow',          name:'Armbrust',                   icon:'🏹',  cat:'Waffen' },
  { id:'trident',           name:'Dreizack',                   icon:'🔱',  cat:'Waffen' },
  { id:'arrow',             name:'Pfeil',                      icon:'➡️',  cat:'Waffen' },
  { id:'spectral_arrow',    name:'Spektraler Pfeil',           icon:'➡️',  cat:'Waffen' },

  // ── Werkzeuge ──
  { id:'netherite_pickaxe', name:'Netherit-Spitzhacke',       icon:'⛏️',  cat:'Werkzeuge' },
  { id:'diamond_pickaxe',   name:'Diamant-Spitzhacke',        icon:'⛏️',  cat:'Werkzeuge' },
  { id:'iron_pickaxe',      name:'Eisen-Spitzhacke',          icon:'⛏️',  cat:'Werkzeuge' },
  { id:'stone_pickaxe',     name:'Stein-Spitzhacke',          icon:'⛏️',  cat:'Werkzeuge' },
  { id:'netherite_axe',     name:'Netherit-Axt',              icon:'🪓',  cat:'Werkzeuge' },
  { id:'diamond_axe',       name:'Diamant-Axt',               icon:'🪓',  cat:'Werkzeuge' },
  { id:'iron_axe',          name:'Eisen-Axt',                 icon:'🪓',  cat:'Werkzeuge' },
  { id:'netherite_shovel',  name:'Netherit-Schaufel',         icon:'🔨',  cat:'Werkzeuge' },
  { id:'diamond_shovel',    name:'Diamant-Schaufel',          icon:'🔨',  cat:'Werkzeuge' },
  { id:'iron_shovel',       name:'Eisen-Schaufel',            icon:'🔨',  cat:'Werkzeuge' },
  { id:'netherite_hoe',     name:'Netherit-Hacke',            icon:'🌾',  cat:'Werkzeuge' },
  { id:'diamond_hoe',       name:'Diamant-Hacke',             icon:'🌾',  cat:'Werkzeuge' },
  { id:'flint_and_steel',   name:'Feuerstein und Stahl',      icon:'🔥',  cat:'Werkzeuge' },
  { id:'shears',            name:'Schere',                    icon:'✂️',  cat:'Werkzeuge' },
  { id:'fishing_rod',       name:'Angelrute',                 icon:'🎣',  cat:'Werkzeuge' },
  { id:'compass',           name:'Kompass',                   icon:'🧭',  cat:'Werkzeuge' },
  { id:'clock',             name:'Uhr',                       icon:'⏰',  cat:'Werkzeuge' },

  // ── Rüstung ──
  { id:'netherite_helmet',     name:'Netherit-Helm',          icon:'⛑️',  cat:'Rüstung' },
  { id:'netherite_chestplate', name:'Netherit-Brustpanzer',   icon:'🛡️',  cat:'Rüstung' },
  { id:'netherite_leggings',   name:'Netherit-Hose',          icon:'👖',  cat:'Rüstung' },
  { id:'netherite_boots',      name:'Netherit-Stiefel',       icon:'👢',  cat:'Rüstung' },
  { id:'diamond_helmet',       name:'Diamant-Helm',           icon:'⛑️',  cat:'Rüstung' },
  { id:'diamond_chestplate',   name:'Diamant-Brustpanzer',    icon:'🛡️',  cat:'Rüstung' },
  { id:'diamond_leggings',     name:'Diamant-Hose',           icon:'👖',  cat:'Rüstung' },
  { id:'diamond_boots',        name:'Diamant-Stiefel',        icon:'👢',  cat:'Rüstung' },
  { id:'iron_helmet',          name:'Eisen-Helm',             icon:'⛑️',  cat:'Rüstung' },
  { id:'iron_chestplate',      name:'Eisen-Brustpanzer',      icon:'🛡️',  cat:'Rüstung' },
  { id:'iron_leggings',        name:'Eisen-Hose',             icon:'👖',  cat:'Rüstung' },
  { id:'iron_boots',           name:'Eisen-Stiefel',          icon:'👢',  cat:'Rüstung' },
  { id:'golden_helmet',        name:'Gold-Helm',              icon:'⛑️',  cat:'Rüstung' },
  { id:'golden_chestplate',    name:'Gold-Brustpanzer',       icon:'🛡️',  cat:'Rüstung' },
  { id:'golden_leggings',      name:'Gold-Hose',              icon:'👖',  cat:'Rüstung' },
  { id:'golden_boots',         name:'Gold-Stiefel',           icon:'👢',  cat:'Rüstung' },
  { id:'chainmail_helmet',     name:'Ketten-Helm',            icon:'⛑️',  cat:'Rüstung' },
  { id:'chainmail_chestplate', name:'Ketten-Brustpanzer',     icon:'🛡️',  cat:'Rüstung' },
  { id:'chainmail_leggings',   name:'Ketten-Hose',            icon:'👖',  cat:'Rüstung' },
  { id:'chainmail_boots',      name:'Ketten-Stiefel',         icon:'👢',  cat:'Rüstung' },
  { id:'leather_helmet',       name:'Leder-Helm',             icon:'⛑️',  cat:'Rüstung' },
  { id:'leather_chestplate',   name:'Leder-Brustpanzer',      icon:'🛡️',  cat:'Rüstung' },
  { id:'leather_leggings',     name:'Leder-Hose',             icon:'👖',  cat:'Rüstung' },
  { id:'leather_boots',        name:'Leder-Stiefel',          icon:'👢',  cat:'Rüstung' },
  { id:'turtle_helmet',        name:'Schildkrötenpanzer',     icon:'🐢',  cat:'Rüstung' },
  { id:'elytra',               name:'Elytra',                 icon:'🦋',  cat:'Rüstung' },
  { id:'shield',               name:'Schild',                 icon:'🛡️',  cat:'Rüstung' },

  // ── Essen ──
  { id:'enchanted_golden_apple',name:'Verzauberter Goldapfel',icon:'🍎',  cat:'Essen' },
  { id:'golden_apple',          name:'Goldapfel',             icon:'🍏',  cat:'Essen' },
  { id:'bread',                 name:'Brot',                  icon:'🍞',  cat:'Essen' },
  { id:'cooked_beef',           name:'Rindfleisch (gegart)',  icon:'🥩',  cat:'Essen' },
  { id:'cooked_porkchop',       name:'Schweinefleisch (gar)', icon:'🥓',  cat:'Essen' },
  { id:'cooked_chicken',        name:'Hühnerfleisch (gegart)',icon:'🍗',  cat:'Essen' },
  { id:'cooked_salmon',         name:'Lachs (gegart)',        icon:'🐟',  cat:'Essen' },
  { id:'apple',                 name:'Apfel',                 icon:'🍎',  cat:'Essen' },
  { id:'carrot',                name:'Karotte',               icon:'🥕',  cat:'Essen' },
  { id:'baked_potato',          name:'Ofenkartoffel',         icon:'🥔',  cat:'Essen' },
  { id:'pumpkin_pie',           name:'Kürbiskuchen',          icon:'🥧',  cat:'Essen' },
  { id:'cookie',                name:'Keks',                  icon:'🍪',  cat:'Essen' },
  { id:'cake',                  name:'Kuchen',                icon:'🎂',  cat:'Essen' },
  { id:'melon_slice',           name:'Melonenscheibe',        icon:'🍈',  cat:'Essen' },

  // ── Materialien ──
  { id:'netherite_ingot',   name:'Netherit-Barren',          icon:'⬛',  cat:'Materialien' },
  { id:'diamond',           name:'Diamant',                  icon:'💎',  cat:'Materialien' },
  { id:'emerald',           name:'Smaragd',                  icon:'💚',  cat:'Materialien' },
  { id:'gold_ingot',        name:'Gold-Barren',              icon:'🟡',  cat:'Materialien' },
  { id:'iron_ingot',        name:'Eisen-Barren',             icon:'⬜',  cat:'Materialien' },
  { id:'coal',              name:'Kohle',                    icon:'🖤',  cat:'Materialien' },
  { id:'redstone',          name:'Redstone',                 icon:'🔴',  cat:'Materialien' },
  { id:'lapis_lazuli',      name:'Lapislazuli',              icon:'🔵',  cat:'Materialien' },
  { id:'obsidian',          name:'Obsidian',                 icon:'⬛',  cat:'Materialien' },
  { id:'ender_pearl',       name:'Enderperle',               icon:'🟣',  cat:'Materialien' },
  { id:'blaze_rod',         name:'Glutrute',                 icon:'🔥',  cat:'Materialien' },
  { id:'nether_star',       name:'Netherstern',              icon:'⭐',  cat:'Materialien' },
  { id:'totem_of_undying',  name:'Totem des Lebens',         icon:'🪆',  cat:'Materialien' },
  { id:'experience_bottle', name:'XP-Phiole',                icon:'💚',  cat:'Materialien' },
  { id:'phantom_membrane',  name:'Phantom-Membran',          icon:'👻',  cat:'Materialien' },

  // ── Blöcke ──
  { id:'netherite_block',   name:'Netherit-Block',           icon:'⬛',  cat:'Blöcke' },
  { id:'diamond_block',     name:'Diamant-Block',            icon:'💎',  cat:'Blöcke' },
  { id:'gold_block',        name:'Gold-Block',               icon:'🟡',  cat:'Blöcke' },
  { id:'iron_block',        name:'Eisen-Block',              icon:'⬜',  cat:'Blöcke' },
  { id:'emerald_block',     name:'Smaragd-Block',            icon:'💚',  cat:'Blöcke' },
  { id:'beacon',            name:'Leuchtfeuer',              icon:'🗼',  cat:'Blöcke' },
  { id:'tnt',               name:'TNT',                      icon:'💣',  cat:'Blöcke' },
  { id:'chest',             name:'Truhe',                    icon:'📦',  cat:'Blöcke' },
  { id:'ender_chest',       name:'Endertruhe',               icon:'📦',  cat:'Blöcke' },
  { id:'bedrock',           name:'Grundgestein',             icon:'🔲',  cat:'Blöcke' },
  { id:'obsidian',          name:'Obsidian',                 icon:'⬛',  cat:'Blöcke' },

  // ── Sonstiges ──
  { id:'saddle',            name:'Sattel',                   icon:'🐴',  cat:'Sonstiges' },
  { id:'name_tag',          name:'Namensschild',             icon:'🏷️',  cat:'Sonstiges' },
  { id:'lead',              name:'Leine',                    icon:'🧶',  cat:'Sonstiges' },
  { id:'water_bucket',      name:'Wassereimer',              icon:'🪣',  cat:'Sonstiges' },
  { id:'lava_bucket',       name:'Lavaeimer',                icon:'🪣',  cat:'Sonstiges' },
  { id:'milk_bucket',       name:'Milcheimer',               icon:'🥛',  cat:'Sonstiges' },
  { id:'book',              name:'Buch',                     icon:'📚',  cat:'Sonstiges' },
  { id:'enchanted_book',    name:'Verzaubertes Buch',        icon:'📖',  cat:'Sonstiges' },
  { id:'written_book',      name:'Geschriebenes Buch',       icon:'📖',  cat:'Sonstiges' },
  { id:'map',               name:'Karte',                    icon:'🗺️',  cat:'Sonstiges' },
  { id:'firework_rocket',   name:'Feuerwerksrakete',         icon:'🎆',  cat:'Sonstiges' },
];

/* Quick Enchants for sidebar buttons */
const QUICK_ENCHANTS = [
  { id:'sharpness',  name:'Schärfe V',       level:5  },
  { id:'protection', name:'Schutz IV',       level:4  },
  { id:'efficiency', name:'Effizienz V',     level:5  },
  { id:'unbreaking', name:'Haltbarkeit III', level:3  },
  { id:'mending',    name:'Ausbesserung I',  level:1  },
  { id:'fortune',    name:'Glück III',       level:3  },
  { id:'silk_touch', name:'Behutsamkeit I',  level:1  },
  { id:'looting',    name:'Plünderung III',  level:3  },
  { id:'power',      name:'Schlagkraft V',   level:5  },
  { id:'feather_falling', name:'Federfall IV', level:4 },
];

/* Quick Effects for sidebar buttons */
const QUICK_EFFECTS = [
  { id:'speed',          name:'Schnelligkeit',  amp:1,   dur:300  },
  { id:'strength',       name:'Stärke II',      amp:1,   dur:300  },
  { id:'regeneration',   name:'Regeneration',   amp:0,   dur:60   },
  { id:'resistance',     name:'Widerstand IV',  amp:3,   dur:300  },
  { id:'fire_resistance',name:'Feuerschutz',    amp:0,   dur:300  },
  { id:'night_vision',   name:'Nachtsicht',     amp:0,   dur:300  },
  { id:'invisibility',   name:'Unsichtbarkeit', amp:0,   dur:300  },
  { id:'haste',          name:'Eile II',        amp:1,   dur:300  },
  { id:'slow_falling',   name:'Langsamer Fall', amp:0,   dur:300  },
  { id:'water_breathing',name:'Wasseratmung',   amp:0,   dur:300  },
];

/* Quick Items shortcut */
const QUICK_ITEMS = [
  { id:'diamond_sword',     name:'Diamantschwert', icon:'⚔️', amount:1 },
  { id:'diamond_pickaxe',   name:'Diamant-Hacke',  icon:'⛏️', amount:1 },
  { id:'diamond_chestplate',name:'Diamant-BP',     icon:'🛡️', amount:1 },
  { id:'enchanted_golden_apple', name:'Goldenap.', icon:'🍎', amount:1 },
  { id:'diamond',           name:'Diamant x64',    icon:'💎', amount:64 },
  { id:'netherite_ingot',   name:'Netherit x16',   icon:'⬛', amount:16 },
  { id:'totem_of_undying',  name:'Totem',          icon:'🪆', amount:1 },
  { id:'nether_star',       name:'Netherstern',     icon:'⭐', amount:1 },
  { id:'elytra',            name:'Elytra',          icon:'🦋', amount:1 },
  { id:'experience_bottle', name:'XP-Phiole x64',  icon:'💚', amount:64 },
];

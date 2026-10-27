'use strict';

var State = {
    grid:      {},
    cellStats: {},
    wars:      [],
    alliances: [],
    units:      [],
    battles:    [],
    buildQueue: [],

    tech: { weapons: 1, armor: 1, artifacts: 1, survival: 1 },
    activeResearch:   null,
    activeFocus:      null,
    completedFocuses: null,

    resources: { 
        equipment: 1000, 
        caches: 0,
        rubles: 5000 
    },

    artifacts: [],
    nextArtifactDay: 0, // День, когда найдут следующий артефакт

    myFactionId:   null,
    myLeaderId:    null,
    leaderChanged: false,
    isGameMode:    false,
    gameSpeed:     0,
    lastSpeed:     1,
    gameDate:      null,

    camera: { x: 0, y: 0, zoom: 1.0 },
    selectedFaction: "loners",
    brushMode:       "draw",
    selectedUnitId:   null,
    recruitMode:      null,
    buildModeType:    null,
    diplomaticTarget: null,
    alerts: [],

    // ─── ИНИЦИАЛИЗАЦИЯ ────────────────────────
    init: function() {
        this.completedFocuses = new Set();
        // 1. Сначала ставим дату
        this.gameDate = new Date(2006, 3, 1);
        this.artifacts = [];
        // 2. Потом планируем артефакт
        this._scheduleNextArtifact();
    },

    // Расчет прошедших дней от старта (1 апреля 2006)
    _getDaysSinceStart: function() {
        if (!this.gameDate) return 0;
        var start = new Date(2006, 3, 1);
        var diff  = this.gameDate.getTime() - start.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    },

    _scheduleNextArtifact: function() {
        // Если константы не подгрузились, используем запасные числа (3 и 7)
        var min = (typeof ARTIFACT_FIND_INTERVAL_MIN !== 'undefined') ? ARTIFACT_FIND_INTERVAL_MIN : 3;
        var max = (typeof ARTIFACT_FIND_INTERVAL_MAX !== 'undefined') ? ARTIFACT_FIND_INTERVAL_MAX : 7;
        
        var daysUntil = Math.floor(Math.random() * (max - min + 1)) + min;
        this.nextArtifactDay = this._getDaysSinceStart() + daysUntil;
    },

    checkArtifactFind: function() {
        if (!this.isGameMode || !this.myFactionId) return;
        
        var currentDay = this._getDaysSinceStart();
        
        // Если наступил или прошел день находки
        if (currentDay >= this.nextArtifactDay) {
            this._findRandomArtifact();
            this._scheduleNextArtifact();
        }
    },

    _findRandomArtifact: function() {
        var roll = Math.random();
        var rarity = 1;
        
        if (roll < 0.10) rarity = 3;      // 10% шанс на очень редкий
        else if (roll < 0.40) rarity = 2; // 30% шанс на редкий (0.1 + 0.3)
        else rarity = 1;                 // 60% шанс на обычный

        var pool = [];
        Object.keys(ARTIFACTS).forEach(function(key) {
            if (ARTIFACTS[key].rarity === rarity) pool.push(key);
        });
        
        if (pool.length === 0) return;
        
        var artId = pool[Math.floor(Math.random() * pool.length)];
        var art   = ARTIFACTS[artId];
        
        this.artifacts.push({
            id:    artId,
            name:  art.name,
            price: art.price,
            icon:  art.icon,
            type:  art.type,
            rarity: art.rarity,
            foundDate: new Date(this.gameDate)
        });
        
        this.createAlert("НАЙДЕН АРТЕФАКТ: " + art.name.toUpperCase(), 10, "info");
    },

    sellArtifact: function(index) {
        if (index < 0 || index >= this.artifacts.length) return;
        var art = this.artifacts[index];
        this.resources.rubles += art.price;
        this.artifacts.splice(index, 1);
        this.createAlert("ПРОДАНО: " + art.name + " (" + art.price + " RU)", 5, "info");
        UI.updateTopBar();
    },

    // ─── ОСТАЛЬНЫЕ МЕТОДЫ ──────────────────────
    // Данные клетки генерируются один раз и запоминаются.
    // Аномалии и сильный фон — редкость, иначе карта превращается в шум.
    getCellData: function(key) {
        if (!this.cellStats[key]) {
            var dangerous = Math.random() < 0.18;

            this.cellStats[key] = {
                stalkers:  5 + Math.floor(Math.random() * 46),
                radiation: dangerous
                    ? 45 + Math.floor(Math.random() * 55)
                    : Math.floor(Math.random() * 30),
                anomalies: dangerous ? 1 + Math.floor(Math.random() * 3) : 0,
                artifacts: dangerous && Math.random() < 0.25 ? 1 : 0,
                buildings: []
            };
        }
        return this.cellStats[key];
    },

    getFactionInfo: function(id) {
        return FACTIONS[id] || { name: id, color: "#fff", icon: "❓" };
    },

    getCurrentLeader: function() {
        if (!this.myFactionId || !this.myLeaderId) return null;
        var leaders = FACTION_LEADERS[this.myFactionId];
        if (!leaders) return null;
        for (var i = 0; i < leaders.length; i++) {
            if (leaders[i].id === this.myLeaderId) return leaders[i];
        }
        return leaders[0];
    },

    getLeaderBonuses: function() {
        var leader = this.getCurrentLeader();
        return leader ? leader.bonuses : {};
    },

    isAtWar: function(a, b) {
        return this.wars.some(function(w) {
            return (w.a === a && w.b === b) || (w.b === a && w.a === b);
        });
    },

    areAllies: function(a, b) {
        if (a === b) return true;
        return this.alliances.some(function(s) { return s.has(a) && s.has(b); });
    },

    calcFactionStats: function(fid) {
        var cells = 0, totalCaches = 0;
        var self = this;
        Object.keys(this.grid).forEach(function(pos) {
            if (self.grid[pos] !== fid) return;
            var d = self.getCellData(pos);
            cells++;
            d.buildings.forEach(function(b) { if (b === "cache") totalCaches++; });
        });
        return { cells: cells, totalCaches: totalCaches };
    },

    // ─── СПАУН ЮНИТОВ С ЭКИПИРОВКОЙ ────────────
    spawnUnit: function(pos, owner, type) {
        var isMine  = owner === this.myFactionId;
        var bonuses = isMine ? this.getLeaderBonuses() : {};
        // ИИ не наследует технологии игрока
        var tech    = isMine ? this.tech : { weapons: 1, armor: 1, artifacts: 1, survival: 1 };
        var defs = getUnitDefs(tech, bonuses);
        var def  = defs[type];
        if (!def) return;

        // Базовое снаряжение для новобранца
        var weapon = "pm";                    // ПМ по умолчанию
        var armor  = "leather_jacket";        // Кожанка по умолчанию
        
        // Рассчитываем характеристики с учётом экипировки
        var weaponData = Items.getWeapon(weapon);
        var armorData  = Items.getArmor(armor);
        
        var attack  = def.baseAttack  + weaponData.damage;
        var defense = def.baseDefense + armorData.protection;
        var hp      = def.baseHp      + armorData.protection;

        // Применяем бонусы лидера
        var attackMult  = bonuses.unitAttack  || 1;
        var defenseMult = bonuses.unitDefense || 1;
        var hpMult      = bonuses.unitHP      || 1;

        this.units.push({
            id: Math.random().toString(36).slice(2, 9),
            pos: pos, owner: owner, type: type,
            weapon: weapon,
            armor: armor,
            hp: Math.round(hp * hpMult),
            maxHp: Math.round(hp * hpMult),
            attack: Math.round(attack * attackMult),
            defense: Math.round(defense * defenseMult),
            trainingDaysLeft: 0, moveCooldown: 0, path: [],
            visualX: undefined, visualY: undefined
        });
    },

    // ─── СМЕНА ЭКИПИРОВКИ ──────────────────────
    equipUnit: function(unitId, itemId, itemType) {
        var unit = this.units.find(function(u) { return u.id === unitId; });
        if (!unit || unit.owner !== this.myFactionId) return false;

        var item;
        if (itemType === 'weapon') {
            item = Items.getWeapon(itemId);
            if (this.resources.rubles < item.price) {
                this.createAlert("НЕДОСТАТОЧНО РУБЛЕЙ", 3, "war");
                return false;
            }
            this.resources.rubles -= item.price;
            unit.weapon = itemId;
        } else if (itemType === 'armor') {
            item = Items.getArmor(itemId);
            if (this.resources.rubles < item.price) {
                this.createAlert("НЕДОСТАТОЧНО РУБЛЕЙ", 3, "war");
                return false;
            }
            this.resources.rubles -= item.price;
            unit.armor = itemId;
        }

        // Пересчитываем характеристики
        this.recalculateUnitStats(unit);
        this.createAlert("ЭКИПИРОВКА ОБНОВЛЕНА: " + item.name.toUpperCase(), 5, "info");
        return true;
    },

    recalculateUnitStats: function(unit) {
        var isMine  = unit.owner === this.myFactionId;
        var bonuses = isMine ? this.getLeaderBonuses() : {};
        var tech    = isMine ? this.tech : { weapons: 1, armor: 1, artifacts: 1, survival: 1 };
        var defs = getUnitDefs(tech, bonuses);
        var def  = defs[unit.type];
        
        if (!def) return;

        var weaponData = Items.getWeapon(unit.weapon);
        var armorData  = Items.getArmor(unit.armor);
        
        var attack  = def.baseAttack  + weaponData.damage;
        var defense = def.baseDefense + armorData.protection;
        var hp      = def.baseHp      + armorData.protection;

        var attackMult  = bonuses.unitAttack  || 1;
        var defenseMult = bonuses.unitDefense || 1;
        var hpMult      = bonuses.unitHP      || 1;

        var oldMaxHp = unit.maxHp;
        unit.maxHp   = Math.round(hp * hpMult);
        unit.attack  = Math.round(attack * attackMult);
        unit.defense = Math.round(defense * defenseMult);
        
        // Корректируем текущее HP пропорционально
        if (oldMaxHp > 0) {
            unit.hp = Math.round((unit.hp / oldMaxHp) * unit.maxHp);
        } else {
            unit.hp = unit.maxHp;
        }
    },

    createAlert: function(text, days, type) {
        var id  = "al-" + Math.random().toString(36).slice(2, 9);
        var box = document.getElementById("notification-box");
        if (!box) return;
        var div = document.createElement("div");
        div.id  = id;
        div.className = "alert-" + (type || "info");
        var labels = { war: "⚠ БОЕВАЯ ТРЕВОГА", info: "◈ СООБЩЕНИЕ", diplo: "◉ ДИПЛОМАТИЯ" };
        div.innerHTML = '<div class="alert-label">' + (labels[type] || "СООБЩЕНИЕ") + '</div><span>' + text + '</span>';
        box.appendChild(div);
        this.alerts.push({ id: id, days: days });
    }
};
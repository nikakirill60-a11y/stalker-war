'use strict';

/**
 * СОХРАНЕНИЯ И РЕКОРДЫ
 *
 * Партия целиком живёт в объекте State, но часть полей не сериализуется
 * напрямую: Set (союзы, изученные фокусы), ссылки на юнитов в боях и
 * функции в активном фокусе. Здесь они превращаются в id/массивы и
 * собираются обратно при загрузке.
 */
var SaveManager = {
    SAVE_KEY:    'stalker_save_v1',
    RECORDS_KEY: 'stalker_records',
    AUTOSAVE_EVERY: 10,   // дней между автосейвами

    // ─── СЕРИАЛИЗАЦИЯ ────────────────────────────
    serialize: function() {
        var focus = State.activeFocus;
        return {
            version: 1,
            savedAt: Date.now(),

            grid:      State.grid,
            cellStats: State.cellStats,
            wars:      State.wars,
            warSince:  State.warSince || {},
            relations: State.relations || {},
            alliances: State.alliances.map(function(s) { return Array.from(s); }),
            units:     State.units.map(function(u) {
                return {
                    id: u.id, pos: u.pos, owner: u.owner, type: u.type,
                    weapon: u.weapon, armor: u.armor,
                    hp: u.hp, maxHp: u.maxHp, attack: u.attack, defense: u.defense,
                    trainingDaysLeft: u.trainingDaysLeft, moveCooldown: u.moveCooldown,
                    path: u.path || []
                };
            }),
            battles: State.battles.map(function(b) {
                return { a: b.attacker.id, d: b.defender.id, timer: b.timer || 0 };
            }),
            buildQueue: State.buildQueue,

            tech:             State.tech,
            activeResearch:   State.activeResearch,
            activeFocus:      focus ? { id: focus.id, name: focus.name, description: focus.description, daysLeft: focus.daysLeft } : null,
            completedFocuses: Array.from(State.completedFocuses || []),

            resources: State.resources,
            inventory: State.inventory || { weapons: [], armor: [] },
            artifacts: State.artifacts,
            nextArtifactDay: State.nextArtifactDay,

            myFactionId:   State.myFactionId,
            myLeaderId:    State.myLeaderId,
            leaderChanged: State.leaderChanged,
            gameDate:      State.gameDate ? State.gameDate.getTime() : null,
            camera:        State.camera,
            selectedFaction: State.selectedFaction,
            brushMode:       State.brushMode,

            idleDays:       State.idleDays || 0,
            gameOver:       State.gameOver,
            lastStandUsed:  State.lastStandUsed,
            lastStandUntil: State.lastStandUntil,
            startedAt:      State.startedAt,
            saveDay:        State.saveDay
        };
    },

    // ─── ВОССТАНОВЛЕНИЕ ──────────────────────────
    restore: function(data) {
        if (!data || data.version !== 1) return false;

        State.grid      = data.grid || {};
        State.cellStats = data.cellStats || {};
        State.wars      = data.wars || [];
        State.relations = data.relations || {};
        State.warSince  = data.warSince || {};
        State.alliances = (data.alliances || []).map(function(pair) { return new Set(pair); });
        State.units     = (data.units || []).map(function(u) {
            return {
                id: u.id, pos: u.pos, owner: u.owner, type: u.type,
                weapon: u.weapon, armor: u.armor,
                hp: u.hp, maxHp: u.maxHp, attack: u.attack, defense: u.defense,
                trainingDaysLeft: u.trainingDaysLeft || 0,
                moveCooldown: u.moveCooldown || 0,
                path: u.path || [],
                visualX: undefined, visualY: undefined
            };
        });

        // Бои ссылаются на объекты юнитов — собираем ссылки по id
        var byId = {};
        State.units.forEach(function(u) { byId[u.id] = u; });
        State.battles = (data.battles || []).map(function(b) {
            if (!byId[b.a] || !byId[b.d]) return null;
            return { attacker: byId[b.a], defender: byId[b.d], timer: b.timer || 0 };
        }).filter(Boolean);

        State.buildQueue  = data.buildQueue || [];
        State.tech        = data.tech || { weapons: 1, armor: 1, artifacts: 1, survival: 1 };
        State.activeResearch = data.activeResearch || null;
        State.completedFocuses = new Set(data.completedFocuses || []);

        // Эффект фокуса — функция, её берём из конфига по id
        State.activeFocus = null;
        if (data.activeFocus) {
            var focuses = FACTION_FOCUSES[data.myFactionId] || [];
            var def = null;
            focuses.forEach(function(f) { if (f.id === data.activeFocus.id) def = f; });
            if (def) {
                State.activeFocus = {
                    id: def.id, name: def.name, description: def.description,
                    effect: def.effect, daysLeft: data.activeFocus.daysLeft
                };
            }
        }

        State.resources   = data.resources || { equipment: 1000, caches: 0, rubles: 5000 };
        State.inventory   = data.inventory || { weapons: [], armor: [] };
        State.artifacts   = data.artifacts || [];
        State.nextArtifactDay = data.nextArtifactDay || 0;

        State.myFactionId   = data.myFactionId;
        State.myLeaderId    = data.myLeaderId;
        State.leaderChanged = !!data.leaderChanged;
        State.gameDate      = data.gameDate ? new Date(data.gameDate) : new Date(2006, 3, 1);
        State.camera        = data.camera || { x: 0, y: 0, zoom: 1 };
        State.selectedFaction = data.selectedFaction || "loners";
        State.brushMode       = data.brushMode || "draw";

        State.idleDays       = data.idleDays || 0;
        State.gameOver       = data.gameOver || null;
        State.lastStandUsed  = !!data.lastStandUsed;
        State.lastStandUntil = data.lastStandUntil || 0;
        State.startedAt      = data.startedAt || Date.now();
        State.saveDay        = data.saveDay || 0;
        State.alerts         = [];

        return true;
    },

    // ─── LOCALSTORAGE ────────────────────────────
    save: function() {
        if (!State.isGameMode || !State.myFactionId || State.gameOver) return false;
        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.serialize()));
            return true;
        } catch (err) {
            console.warn('Не удалось сохранить партию:', err);
            return false;
        }
    },

    hasSave: function() {
        try { return !!localStorage.getItem(this.SAVE_KEY); }
        catch (e) { return false; }
    },

    load: function() {
        try {
            var raw = localStorage.getItem(this.SAVE_KEY);
            if (!raw) return false;
            return this.restore(JSON.parse(raw));
        } catch (err) {
            console.warn('Не удалось загрузить партию:', err);
            return false;
        }
    },

    clear: function() {
        try { localStorage.removeItem(this.SAVE_KEY); }
        catch (e) { /* приватный режим */ }
    },

    // ─── АВТОСЕЙВ ────────────────────────────────
    autoSave: function() {
        if (!State.isGameMode || State.gameOver) return;
        var day = State._getDaysSinceStart();
        if (day - (State.saveDay || 0) < this.AUTOSAVE_EVERY) return;
        State.saveDay = day;
        if (this.save()) {
            State.createAlert('АВТОСОХРАНЕНИЕ · ДЕНЬ ' + day, 3, 'info');
        }
    },

    // ─── ЭКСПОРТ / ИМПОРТ ФАЙЛОМ ─────────────────
    exportToFile: function() {
        var blob = new Blob([JSON.stringify(this.serialize(), null, 2)], { type: 'application/json' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href = url;
        a.download = 'stalker_save_day' + State._getDaysSinceStart() + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    },

    importFromText: function(text) {
        var data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            return { ok: false, error: 'Это не JSON: ' + err.message };
        }
        if (!data || data.version !== 1 || !data.grid || !data.myFactionId) {
            return { ok: false, error: 'Файл не похож на сохранение партии' };
        }
        if (!this.restore(data)) return { ok: false, error: 'Не удалось применить сохранение' };
        return { ok: true, faction: State.myFactionId };
    },

    // ─── РЕКОРДЫ ─────────────────────────────────
    getRecords: function() {
        try {
            return JSON.parse(localStorage.getItem(this.RECORDS_KEY) || '[]');
        } catch (e) {
            return [];
        }
    },

    saveRecord: function(result) {
        try {
            var list = this.getRecords();
            list.push({
                result:  result.result,
                faction: result.faction,
                day:     result.day,
                percent: result.percent,
                date:    Date.now()
            });
            // Победы выше поражений, среди побед — быстрее и с большим контролем
            list.sort(function(a, b) {
                if (a.result !== b.result) return a.result === 'victory' ? -1 : 1;
                if (a.result === 'victory') {
                    if (a.day !== b.day) return a.day - b.day;
                    return b.percent - a.percent;
                }
                return b.day - a.day;
            });
            localStorage.setItem(this.RECORDS_KEY, JSON.stringify(list.slice(0, 10)));
        } catch (err) {
            console.warn('Не удалось сохранить рекорд:', err);
        }
    }
};

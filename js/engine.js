'use strict';

var Engine = {
    keys: {},

    init: function() {
        var self = this;
        window.addEventListener("keydown", function(e) {
            if (e.code === "Space" && State.isGameMode) { e.preventDefault(); self.togglePause(); }
            self.keys[e.code] = true;
        });
        window.addEventListener("keyup", function(e) { self.keys[e.code] = false; });
        window.addEventListener("wheel", function(e) {
            State.camera.zoom = Math.min(Math.max(State.camera.zoom * (e.deltaY > 0 ? 0.88 : 1.13), 0.05), 12);
        }, { passive: true });

        requestAnimationFrame(function() { self._loop(); });
    },

    _loop: function() {
        var self = this;
        this._moveCamera();
        this._advanceTime();
        Renderer.draw();
        requestAnimationFrame(function() { self._loop(); });
    },

    // Сколько игрового времени прибавляется за один кадр.
    // 1x ≈ 1 сутки за 2 секунды, 3x ≈ 0.7 с, 5x ≈ 0.4 с.
    _advanceTime: function() {
        if (State.gameSpeed === 0) return;
        var msMap = { 1: 720000, 3: 2160000, 5: 3600000 };
        var ms    = msMap[State.gameSpeed] || 720000;
        var prev  = new Date(State.gameDate);
        State.gameDate = new Date(State.gameDate.getTime() + ms);

        if (State.gameDate.getDate() !== prev.getDate()) {
            this._onDayPassed();
        }

        var d = State.gameDate;
        var el = document.getElementById("game-date");
        if (el) el.innerText = d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
    },

    setSpeed: function(s) {
        State.gameSpeed = s;
        if (s > 0) State.lastSpeed = s;
        document.querySelectorAll(".speed-btn").forEach(function(b, i) {
            b.classList.toggle("active", (s === 0 && i === 0) || (s === 1 && i === 1) || (s === 3 && i === 2) || (s === 5 && i === 3));
        });
    },

    togglePause: function() {
        if (State.gameSpeed === 0) this.setSpeed(State.lastSpeed);
        else this.setSpeed(0);
    },

    _onDayPassed: function() {
        this._tickFocus();
        this._tickResearch();
        this._tickBuilding();
        this._tickProduction();
        this._tickAlerts();
        this._tickUnits();
        this._tickCombat();
        this._tickAI();
        this._tickDiplomacy(); // НОВАЯ ФУНКЦИЯ - ИИ дипломатия
        
        // ВАЖНО: Проверка артефактов каждый день
        State.checkArtifactFind();
        
        UI.updateTopBar();
    },

    _tickFocus: function() {
        var f = State.activeFocus;
        if (!f) return;
        // Длительность уже сокращена бонусом лидера в момент запуска фокуса
        f.daysLeft -= 1;
        if (f.daysLeft <= 0) {
            try {
                f.effect(State);
            } catch (err) {
                console.error("Ошибка эффекта фокуса " + f.id + ":", err);
                State.createAlert("ФОКУС ПРОВАЛЕН: " + (f.name || f.id), 5, "war");
            }
            State.completedFocuses.add(f.id);
            State.activeFocus = null;
            var el = document.getElementById("focus-indicator");
            if (el) el.classList.add("hidden");
        }
    },

    _tickResearch: function() {
        var r = State.activeResearch;
        if (!r) return;
        // Длительность уже сокращена бонусом в startResearch
        r.daysLeft -= 1;
        if (r.daysLeft <= 0) {
            State.tech[r.type] = r.level;
            State.createAlert("ИССЛЕДОВАНИЕ ЗАВЕРШЕНО", 10, "info");
            State.activeResearch = null;
            var el = document.getElementById("research-indicator");
            if (el) el.classList.add("hidden");
            
            // Обновляем характеристики всех юнитов игрока после исследования
            State.units.forEach(function(u) {
                if (u.owner === State.myFactionId) {
                    State.recalculateUnitStats(u);
                }
            });
        }
    },

    _tickBuilding: function() {
        if (!State.buildQueue.length) return;
        var p = State.buildQueue[0];
        p.daysLeft -= 1;
        if (p.daysLeft <= 0) {
            State.getCellData(p.pos).buildings.push(p.type);
            State.createAlert("ПОСТРОЕНО: " + BUILDING_DEFS[p.type].name, 5, "info");
            State.buildQueue.shift();
        }
    },

    _tickProduction: function() {
        if (!State.myFactionId) return;
        var stats = State.calcFactionStats(State.myFactionId);
        var bonuses = State.getLeaderBonuses();
        var prod = (stats.totalCaches * 2 + 1) * (1 + (State.tech.survival - 1) * 0.05) * (bonuses.equipmentProduction || 1);
        var maint = 0;
        var defs = getUnitDefs(State.tech, bonuses);
        State.units.forEach(function(u) {
            if (u.owner === State.myFactionId) maint += (defs[u.type] ? defs[u.type].maintenance : 0);
        });
        State.resources.equipment = Math.max(0, State.resources.equipment + prod - maint);
    },

    _tickAlerts: function() {
        State.alerts = State.alerts.filter(function(a) {
            a.days--;
            if (a.days <= 0) { var el = document.getElementById(a.id); if (el) el.remove(); return false; }
            return true;
        });
    },

    _tickUnits: function() {
        var self = this;
        State.units.forEach(function(u) {
            if (!u.path || !u.path.length || u.trainingDaysLeft > 0) return;
            if (u.moveCooldown === undefined) u.moveCooldown = 0;
            u.moveCooldown++;
            var moveSpeed = UNIT_MOVE_EVERY;
            var bonuses = u.owner === State.myFactionId ? State.getLeaderBonuses() : {};
            if (bonuses.unitSpeed) moveSpeed = Math.max(1, Math.floor(moveSpeed / bonuses.unitSpeed));
            
            if (u.moveCooldown < moveSpeed) return;
            u.moveCooldown = 0;

            var next = u.path[0];
            var nextOwner = State.grid[next];
            if (!nextOwner) {
                // Пустая клетка: идём по ней, но не присваиваем её фракции
                u.path.shift();
                u.pos = next;
                return;
            }

            var enemy = null;
            State.units.forEach(function(x) { if (x.pos === next && State.isAtWar(u.owner, x.owner)) enemy = x; });

            if (enemy) self._startBattle(u, enemy);
            else if (State.isAtWar(u.owner, nextOwner)) {
                u.path.shift(); State.grid[next] = u.owner; u.pos = next;
                self._checkCapitulation(nextOwner, u.owner);
            } else if (nextOwner === u.owner || State.areAllies(u.owner, nextOwner)) {
                u.path.shift(); u.pos = next;
            } else u.path = [];
        });
    },

    _startBattle: function(a, d) {
        var exists = State.battles.some(function(b) { return (b.attacker.id === a.id && b.defender.id === d.id) || (b.attacker.id === d.id && b.defender.id === a.id); });
        if (!exists) State.battles.push({ attacker: a, defender: d, timer: 0 });
    },

    _tickCombat: function() {
        var self = this;
        State.battles = State.battles.filter(function(b) {
            if (b.attacker.hp <= 0 || b.defender.hp <= 0) {
                var fallen = [];
                if (b.defender.hp <= 0) {
                    // Защитник пал — атакующий занимает его клетку
                    State.grid[b.defender.pos] = b.attacker.owner;
                    b.attacker.pos = b.defender.pos;
                    fallen.push(b.defender.id);
                    self._checkCapitulation(b.defender.owner, b.attacker.owner);
                }
                if (b.attacker.hp <= 0) fallen.push(b.attacker.id);
                if (fallen.length) {
                    State.units = State.units.filter(function(u) { return fallen.indexOf(u.id) === -1; });
                }
                return false;
            }
            b.timer++;
            if (b.timer >= COMBAT_TICK_DAYS) {
                b.timer = 0;
                
                // Урон зависит от экипировки!
                var defDamage = Math.max(1, b.defender.attack * (Math.random() * 0.5 + 0.5));
                var attDamage = Math.max(1, b.attacker.attack * 0.4);
                
                // Защита снижает урон
                defDamage = Math.max(1, defDamage - b.attacker.defense * 0.1);
                attDamage = Math.max(1, attDamage - b.defender.defense * 0.1);
                
                b.defender.hp -= attDamage;
                b.attacker.hp -= defDamage;
            }
            return true;
        });
    },

    _checkCapitulation: function(t, w) {
        if (!t || t === w || !FACTIONS[t]) return;
        var stats = State.calcFactionStats(t);
        if (stats.cells < 2) {
            State.createAlert(State.getFactionInfo(t).name.toUpperCase() + " УНИЧТОЖЕНЫ!", 15, "war");
            Object.keys(State.grid).forEach(function(k) { if (State.grid[k] === t) State.grid[k] = w; });
            State.units = State.units.filter(function(u) { return u.owner !== t; });
            State.wars = State.wars.filter(function(wr) { return wr.a !== t && wr.b !== t; });
            // Очищаем союзы с уничтоженной фракцией
            State.alliances = State.alliances.filter(function(alliance) {
                return !alliance.has(t);
            });
        }
    },

    // ─── АКТИВНЫЙ ИИ С ДИПЛОМАТИЕЙ ──────────
    _tickAI: function() {
        var self = this;
        Object.keys(FACTIONS).forEach(function(id) {
            if (id === State.myFactionId || State.gameSpeed === 0) return;
            self._runAI(id);
        });
    },

    _runAI: function(id) {
        var self = this;
        
        // Подсчитываем армию ИИ
        var armyCount = 0;
        State.units.forEach(function(u) {
            if (u.owner === id) armyCount++;
        });
        
        // Спауним юниты только если армия меньше лимита
        if (armyCount < MAX_AI_ARMY_SIZE && Math.random() < 0.02) { // Увеличил с 0.01 до 0.02
            var uc = Object.keys(State.grid).filter(function(k) { return State.grid[k] === id; });
            if (uc.length) State.spawnUnit(uc[Math.floor(Math.random() * uc.length)], id, "stalker");
        }
        
        // Боевая логика ИИ
        State.units.forEach(function(u) {
            if (u.owner === id && (!u.path || u.path.length === 0)) {
                // Ищем врагов для атаки
                var enemies = [];
                State.wars.forEach(function(w) {
                    if (w.a === id) enemies.push(w.b);
                    if (w.b === id) enemies.push(w.a);
                });
                
                if (enemies.length > 0) {
                    // Атакуем случайного врага
                    var targetFaction = enemies[Math.floor(Math.random() * enemies.length)];
                    var enemyTerritories = Object.keys(State.grid).filter(function(k) { 
                        return State.grid[k] === targetFaction; 
                    });
                    
                    if (enemyTerritories.length) {
                        var target = enemyTerritories[Math.floor(Math.random() * enemyTerritories.length)];
                        u.path = self._buildPath(u.pos, target);
                    }
                }
            }
        });
    },

    // ─── УСИЛЕННАЯ ДИПЛОМАТИЧЕСКАЯ СИСТЕМА ИИ ──────────
    _tickDiplomacy: function() {
        // Увеличенный шанс дипломатических решений - каждый день 3% шанс
        if (Math.random() > 0.03) return;
        
        var self = this;
        var allFactions = Object.keys(FACTIONS);
        
        // Выбираем случайную фракцию ИИ (не игрока)
        var aiFactions = allFactions.filter(function(id) { return id !== State.myFactionId; });
        if (aiFactions.length < 2) return;
        
        var initiator = aiFactions[Math.floor(Math.random() * aiFactions.length)];
        var possibleTargets = allFactions.filter(function(id) { return id !== initiator; });
        var target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        
        var atWar = State.isAtWar(initiator, target);
        var areAllied = State.areAllies(initiator, target);
        
        // Анализ силы фракций
        var initiatorStats = State.calcFactionStats(initiator);
        var targetStats = State.calcFactionStats(target);
        var initiatorArmy = State.units.filter(function(u) { return u.owner === initiator; }).length;
        var targetArmy = State.units.filter(function(u) { return u.owner === target; }).length;
        
        var initiatorStrength = initiatorStats.cells + initiatorArmy;
        var targetStrength = targetStats.cells + targetArmy;
        var strengthRatio = initiatorStrength / Math.max(1, targetStrength);
        
        // ЛОГИКА ОБЪЯВЛЕНИЯ ВОЙН (УВЕЛИЧЕННЫЕ ШАНСЫ)
        if (!atWar && !areAllied) {
            var warChance = 0;
            
            // Агрессивные фракции (увеличены шансы)
            if (['duty', 'bandits', 'monolith', 'military'].indexOf(initiator) !== -1) {
                warChance = 0.6; // Было 0.3
            }
            // Нейтральные фракции
            else if (['loners', 'clearnsky', 'mercs'].indexOf(initiator) !== -1) {
                warChance = 0.3; // Было 0.1
            }
            // Мирные фракции
            else {
                warChance = 0.15; // Было 0.05
            }
            
            // Увеличиваем шанс войны если мы сильнее
            if (strengthRatio > 1.5) warChance *= 1.5;
            if (strengthRatio > 2.0) warChance *= 1.5;
            
            // Уменьшаем шанс войны если мы слабее
            if (strengthRatio < 0.7) warChance *= 0.5;
            if (strengthRatio < 0.5) warChance *= 0.3;
            
            // Особые отношения между фракциями (УВЕЛИЧЕНЫ)
            if ((initiator === 'duty' && target === 'freedom') || 
                (initiator === 'freedom' && target === 'duty')) {
                warChance = 0.8; // Было 0.6 - Долг и Свобода заклятые враги
            }
            
            if ((initiator === 'bandits' && target === 'loners') ||
                (initiator === 'bandits' && target === 'scientists')) {
                warChance = 0.7; // Было 0.4 - Бандиты любят грабить
            }
            
            if (initiator === 'monolith') {
                warChance = 0.8; // Было 0.5 - Монолит агрессивен ко всем
            }
            
            // ПРИНУДИТЕЛЬНАЯ ВОЙНА для тестирования
            if (target === State.myFactionId && ['bandits', 'monolith'].indexOf(initiator) !== -1) {
                warChance = 0.9; // 90% шанс что Бандиты или Монолит объявят войну игроку
            }
            
            if (Math.random() < warChance) {
                State.wars.push({ a: initiator, b: target });
                var initiatorName = State.getFactionInfo(initiator).name;
                var targetName = State.getFactionInfo(target).name;
                
                State.createAlert(
                    "ВОЙНА: " + initiatorName.toUpperCase() + " ОБЪЯВЛЯЕТ ВОЙНУ " + targetName.toUpperCase(),
                    15, "war"
                );
                return; // Выходим, чтобы не делать союз в этот же тик
            }
        }
        
        // ЛОГИКА ЗАКЛЮЧЕНИЯ СОЮЗОВ (тоже увеличены шансы)
        if (!atWar && !areAllied) {
            var allianceChance = 0;
            
            // Дипломатичные фракции охотнее заключают союзы
            if (['freedom', 'loners', 'clearnsky', 'scientists'].indexOf(initiator) !== -1) {
                allianceChance = 0.25; // Было 0.15
            }
            else if (['mercs', 'duty'].indexOf(initiator) !== -1) {
                allianceChance = 0.15; // Было 0.08
            }
            else {
                allianceChance = 0.08; // Было 0.03
            }
            
            // Союзы более вероятны между похожими силами
            if (strengthRatio > 0.7 && strengthRatio < 1.3) {
                allianceChance *= 1.5;
            }
            
            // Особые дружественные отношения
            if ((initiator === 'loners' && target === 'clearnsky') ||
                (initiator === 'clearnsky' && target === 'scientists') ||
                (initiator === 'scientists' && target === 'loners')) {
                allianceChance = 0.4; // Было 0.3 - Исследователи любят объединяться
            }
            
            // Никто не дружит с Монолитом и Бандитами
            if (target === 'monolith' || target === 'bandits' || 
                initiator === 'monolith' || initiator === 'bandits') {
                allianceChance = 0;
            }
            
            if (Math.random() < allianceChance) {
                State.alliances.push(new Set([initiator, target]));
                var initiatorName = State.getFactionInfo(initiator).name;
                var targetName = State.getFactionInfo(target).name;
                
                State.createAlert(
                    "СОЮЗ: " + initiatorName.toUpperCase() + " И " + targetName.toUpperCase() + " ЗАКЛЮЧИЛИ АЛЬЯНС",
                    12, "diplo"
                );

            }
        }
        
        // ЛОГИКА РАЗРЫВА СОЮЗОВ (увеличена вероятность)
        else if (areAllied && Math.random() < 0.05) { // Было 0.02
            // Иногда союзы распадаются
            State.alliances = State.alliances.filter(function(alliance) {
                if (alliance.has(initiator) && alliance.has(target)) {
                    var initiatorName = State.getFactionInfo(initiator).name;
                    var targetName = State.getFactionInfo(target).name;
                    
                    State.createAlert(
                        "РАЗРЫВ: " + initiatorName.toUpperCase() + " РАЗОРВАЛИ СОЮЗ С " + targetName.toUpperCase(),
                        10, "diplo"
                    );
                    return false;
                }
                return true;
            });
        }
    },

    _buildPath: function(f, t) {
        var fp = f.split(","), tp = t.split(",");
        var cx = parseInt(fp[0]), cy = parseInt(fp[1]), ex = parseInt(tp[0]), ey = parseInt(tp[1]);
        var path = [];
        while (cx !== ex || cy !== ey) {
            if (cx < ex) cx++; else if (cx > ex) cx--;
            if (cy < ey) cy++; else if (cy > ey) cy--;
            path.push(cx + "," + cy);
            if (path.length > 100) break;
        }
        return path;
    },

    _moveCamera: function() {
        var spd = 14 / State.camera.zoom;
        if (this.keys["KeyW"]) State.camera.y -= spd;
        if (this.keys["KeyS"]) State.camera.y += spd;
        if (this.keys["KeyA"]) State.camera.x -= spd;
        if (this.keys["KeyD"]) State.camera.x += spd;
    },

    deployUnit: function(pk) {
        if (!State.recruitMode || State.grid[pk] !== State.myFactionId) return;
        var bns = State.getLeaderBonuses();
        var defs = getUnitDefs(State.tech, bns);
        var cost = Math.round(defs[State.recruitMode].costEquipment * (bns.recruitCost || 1));
        if (State.resources.equipment < cost) { State.createAlert("НЕТ СНАРЯЖЕНИЯ", 3, "war"); return; }
        State.resources.equipment -= cost;
        State.spawnUnit(pk, State.myFactionId, State.recruitMode);
        State.recruitMode = null;
        document.getElementById("recruit-hint").classList.add("hidden");
        UI.updateTopBar();
    },

    placeBuilding: function(pk) {
        if (!State.buildModeType || State.grid[pk] !== State.myFactionId) return;
        var cost = BUILDING_DEFS[State.buildModeType].costEquipment;
        if (State.resources.equipment < cost) { State.createAlert("НЕТ СНАРЯЖЕНИЯ", 3, "war"); return; }
        State.resources.equipment -= cost;
        var speed     = State.getLeaderBonuses().constructionSpeed || 1;
        var totalDays = CONSTRUCTION_DAYS * speed;
        State.buildQueue.push({
            pos: pk, type: State.buildModeType,
            daysLeft: totalDays, totalDays: totalDays,
            owner: State.myFactionId
        });
        State.buildModeType = null;
        document.getElementById("build-hint").classList.add("hidden");
        UI.updateTopBar();
    },

    giveOrder: function(pk) {
        var unit = State.units.find(function(u) { return u.id === State.selectedUnitId; });
        if (unit && State.grid[pk]) unit.path = this._buildPath(unit.pos, pk);
        State.selectedUnitId = null;
        document.getElementById("order-hint").classList.add("hidden");
    }
};
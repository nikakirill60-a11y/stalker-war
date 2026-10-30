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
        if (State.gameSpeed === 0 || State.gameOver) return;
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
        if (State.gameOver) return;
        this._tickFocus();
        this._tickResearch();
        this._tickBuilding();
        this._tickProduction();
        this._tickAlerts();
        this._tickUnits();
        this._tickCombat();
        this._tickZoneDanger();
        this._tickEconomy();
        this._tickAI();
        this._tickDiplomacy(); // НОВАЯ ФУНКЦИЯ - ИИ дипломатия
        
        // ВАЖНО: Проверка артефактов каждый день
        State.checkArtifactFind();

        UI.updateTopBar();

        if (typeof SaveManager !== 'undefined') SaveManager.autoSave();

        this._checkGameOver();
    },

    // ─── УСЛОВИЯ ЗАВЕРШЕНИЯ ПАРТИИ ───────────────
    _checkGameOver: function() {
        if (State.gameOver || !State.isGameMode || !State.myFactionId) return;

        var myStats = State.calcFactionStats(State.myFactionId);
        var total   = Object.keys(State.grid).length || 1;
        var foes    = Object.keys(FACTIONS).filter(function(id) {
            return id !== State.myFactionId && State.calcFactionStats(id).cells > 0;
        });

        // Победа: все остальные группировки уничтожены
        if (!foes.length) {
            this._finishGame('victory', 'ВСЕ ГРУППИРОВКИ ЗОНЫ УНИЧТОЖЕНЫ');
            return;
        }

        // Победа по контролю территории
        if (myStats.cells / total >= WIN_CONTROL_PERCENT / 100) {
            this._finishGame('victory', 'ПОД КОНТРОЛЕМ ' + Math.round(myStats.cells / total * 100) + '% ЗОНЫ');
            return;
        }

        // Без отрядов и без базы группировка разваливается сама —
        // иначе игрок может вечно сидеть на паре секторов и ничего не делать.
        var myArmy = State.armySize(State.myFactionId);
        var caches = myStats.totalCaches || 0;
        if (myArmy === 0 && caches === 0) {
            State.idleDays = (State.idleDays || 0) + 1;
            if (State.idleDays === 60) {
                State.createAlert("ГРУППИРОВКА РАЗВАЛИВАЕТСЯ: НУЖНЫ ОТРЯДЫ ИЛИ СХРОН", 20, "war");
            }
            if (State.idleDays >= 90) {
                this._finishGame('defeat', 'ГРУППИРОВКА РАСПАЛАСЬ: НЕТ НИ ОТРЯДОВ, НИ БАЗЫ');
                return;
            }
        } else {
            State.idleDays = 0;
        }

        // Поражение — но первый раз даём «последний шанс».
        // Один сектор тоже считается крахом: удержать его нечем,
        // а бесконечно висеть на последней клетке игрок не должен.
        if (myStats.cells <= 1) {
            if (!State.lastStandUsed) {
                State.grantLastStand();
                UI.updateTopBar();
                return;
            }
            if (State._getDaysSinceStart() >= State.lastStandUntil) {
                this._finishGame('defeat', myStats.cells === 0
                    ? 'ПОТЕРЯНЫ ВСЕ СЕКТОРА'
                    : 'ОТ ГРУППИРОВКИ ОСТАЛСЯ ОДИН СЕКТОР');
            }
        }
    },

    _finishGame: function(result, reason) {
        var myStats = State.calcFactionStats(State.myFactionId);
        var total   = Object.keys(State.grid).length || 1;
        var foes    = Object.keys(FACTIONS).filter(function(id) {
            return id !== State.myFactionId && State.calcFactionStats(id).cells > 0;
        });

        State.gameOver = {
            result: result,
            reason: reason,
            day:    State._getDaysSinceStart(),
            date:   new Date(State.gameDate),
            cells:  myStats.cells,
            percent: Math.round(myStats.cells / total * 100),
            units:  State.armySize(State.myFactionId),
            wars:   State.wars.length,
            artifacts: State.artifacts.length,
            factionsLeft: foes.length + 1,
            faction: State.myFactionId
        };

        this.setSpeed(0);

        if (typeof SaveManager !== 'undefined') {
            SaveManager.clear();
            SaveManager.saveRecord(State.gameOver);
        }
        if (typeof UI !== 'undefined' && UI.showGameOver) {
            UI.showGameOver(State.gameOver);
        }
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

            // Неприкосновенность игрока: ИИ не входит на его клетки
            if (State.isProtected(nextOwner)) { u.path = []; return; }

            var enemy = null;
            State.units.forEach(function(x) { if (x.pos === next && State.isAtWar(u.owner, x.owner)) enemy = x; });

            if (enemy && State.isProtected(enemy.owner)) { u.path = []; return; }

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
        
        // Лимит и темп найма зависят от характера фракции
        var prof = (typeof FACTION_AI !== 'undefined' && FACTION_AI[id]) || { armyLimit: 8, aggression: 0.7 };
        // ИИ держит скромный гарнизон: иначе десять фракций выставляют
        // восемьдесят отрядов против десяти игроцких и задавливают числом.
        var armyLimit = Math.max(3, Math.round(prof.armyLimit * 0.55));
        if (armyCount < armyLimit && Math.random() < 0.03 * prof.aggression) {
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
                    // Враги, до которых есть сухопутный путь через свои/союзные земли
                    var reachable = enemies.filter(function(e) {
                        return !State.isProtected(e) && State.calcFactionStats(e).cells > 0;
                    });

                    if (reachable.length) {
                        // Ищем ближайший вражеский сектор. Раньше цель была
                        // случайной — юнит шёл через полконтинента и разворачивался.
                        var up = u.pos.split(",");
                        var ux = parseInt(up[0], 10), uy = parseInt(up[1], 10);

                        var best = null, bestDist = 1e9;
                        Object.keys(State.grid).forEach(function(k) {
                            if (reachable.indexOf(State.grid[k]) === -1) return;
                            var kp = k.split(",");
                            var d = Math.abs(parseInt(kp[0], 10) - ux) + Math.abs(parseInt(kp[1], 10) - uy);
                            // немного шума, чтобы юниты не липли к одной и той же клетке
                            d += Math.random() * 2;
                            if (d < bestDist) { bestDist = d; best = k; }
                        });

                        if (best) {
                            var p2 = self._buildPath(u.pos, best);
                            if (p2.length) u.path = p2;
                        }
                    }
                }
            }
        });
    },

    // ─── ЭКОНОМИКА ───────────────────────────────
    // Доход идёт с секторов и схронов, расход — на содержание отрядов.
    // Если отрядов больше лимита или казна в минусе — люди разбегаются.

    _tickEconomy: function() {
        if (!State.isGameMode || !State.myFactionId || State.gameOver) return;

        var stats  = State.calcFactionStats(State.myFactionId);
        var caches = stats.totalCaches || 0;
        var army   = State.armySize(State.myFactionId);

        var incomeBonus = 1 + State.artifactBonus("income");
        var income = Math.round(
            (stats.cells * RUBLES_PER_SECTOR + caches * RUBLES_PER_CACHE) * incomeBonus
        );
        var upkeep = army * RUBLES_PER_UNIT;

        State.resources.rubles += income - upkeep;
        State.lastIncome = { income: income, upkeep: upkeep, net: income - upkeep };

        // ── Лимит армии ──
        var limit = State.maxArmySize(State.myFactionId);
        if (army > limit) {
            var myUnits = State.units.filter(function(u) { return u.owner === State.myFactionId; });
            var deserter = myUnits[myUnits.length - 1];
            if (deserter) {
                State.units = State.units.filter(function(u) { return u.id !== deserter.id; });
                State.createAlert("ДЕЗЕРТИР: ЛИМИТ ОТРЯДОВ ПРЕВЫШЕН (" + limit + ")", 8, "war");
            }
        }

        // ── Казна в минусе ──
        if (State.resources.rubles < 0) {
            var myU = State.units.filter(function(u) { return u.owner === State.myFactionId; });
            if (myU.length) {
                var gone = myU[myU.length - 1];
                State.units = State.units.filter(function(u) { return u.id !== gone.id; });
                State.resources.rubles = 0;
                State.createAlert("НЕТ ДЕНЕГ НА СОДЕРЖАНИЕ — ОТРЯД РАСПАЛСЯ", 10, "war");
            }
        }
    },

    // ─── ОПАСНОСТЬ ЗОНЫ ──────────────────────────
    // Радиация и аномалии раньше были просто декорацией на карте.
    // Теперь каждый день в опасной клетке снимает прочность отряда.

    _tickZoneDanger: function() {
        if (!State.isGameMode || State.gameOver) return;

        var radResist = State.artifactBonus("radResist");
        var dead = [];

        State.units.forEach(function(u) {
            if (u.trainingDaysLeft > 0) return;

            var data = State.getCellData(u.pos);
            var dmg = 0;

            // Радиация «фонит» постоянно, но с шансом — иначе отряды
            // вымирают целиком за пару недель и карта пустеет.
            if (data.radiation > RADIATION_THRESHOLD && Math.random() < 0.4) {
                dmg += RADIATION_DAMAGE;
            }

            // Аномалия бьёт один раз — когда отряд входит в клетку
            if (data.anomalies && u.lastPos !== u.pos) {
                dmg += data.anomalies * ANOMALY_DAMAGE;
            }

            u.lastPos = u.pos;

            if (!dmg) return;

            // Артефакты защищают только своего владельца
            if (u.owner === State.myFactionId) dmg = Math.max(1, dmg * (1 - Math.min(0.8, radResist)));

            u.hp -= dmg;
            if (u.hp <= 0) dead.push(u.id);
        });

        if (dead.length) {
            State.units = State.units.filter(function(u) { return dead.indexOf(u.id) === -1; });
            if (dead.length > 1) State.createAlert("ЗОНА ПОГУБИЛА " + dead.length + " ОТРЯДОВ", 8, "war");
            else State.createAlert("ОТРЯД ПОГИБ В АНОМАЛИИ", 6, "war");
        }
    },

    // ─── ДИПЛОМАТИЯ: ОТНОШЕНИЯ, ВОЙНЫ, КОАЛИЦИИ ──────────
    //
    // Раньше война объявлялась с шансом 3% в день, то есть раз в месяц,
    // поэтому карта стояла годами. Теперь у каждой пары фракций есть
    // отношение от -100 до 100. Оно падает от общей границы, идеологической
    // вражды и от чужого доминирования на карте. Перевалило за порог —
    // война. Война поднимает отношения обратно — и через какое-то время
    // стороны мирятся.

    _tickDiplomacy: function() {
        var self = this;
        var ids = Object.keys(FACTIONS);
        if (ids.length < 2) return;

        // Кто доминирует на карте — против него сближаются все остальные
        var shares = {};
        var leader = null, leaderShare = 0;
        ids.forEach(function(id) {
            shares[id] = State.factionShare(id);
            if (shares[id] > leaderShare) { leaderShare = shares[id]; leader = id; }
        });
        var dominant = leaderShare >= COALITION_DOMINANCE_PERCENT ? leader : null;

        // Средняя «сила» фракции — территории + отряды
        var power = {};
        ids.forEach(function(id) {
            power[id] = State.calcFactionStats(id).cells + State.armySize(id) * 3;
        });

        for (var a = 0; a < ids.length; a++) {
            for (var b = a + 1; b < ids.length; b++) {
                var fa = ids[a], fb = ids[b];
                if (State.calcFactionStats(fa).cells === 0) continue;
                if (State.calcFactionStats(fb).cells === 0) continue;

                var rel    = State.getRelation(fa, fb);
                var atWar  = State.isAtWar(fa, fb);
                var allied = State.areAllies(fa, fb);

                var profA = (typeof FACTION_AI !== 'undefined' && FACTION_AI[fa]) || { aggression: 0.7 };
                var profB = (typeof FACTION_AI !== 'undefined' && FACTION_AI[fb]) || { aggression: 0.7 };

                if (atWar) {
                    // Война изматывает: отношения медленно выбираются из ямы
                    rel += 0.35;
                    // Но если одна сторона сильно слабее — добивают, мира не будет
                    var ratio = Math.min(power[fa], power[fb]) / Math.max(1, Math.max(power[fa], power[fb]));
                    if (ratio > 0.45) rel += 0.25;

                    State.setRelation(fa, fb, rel);

                    var key = State._pairKey(fa, fb);
                    var since = State.warSince[key] || 0;
                    var warAge = State._getDaysSinceStart() - since;

                    if (rel >= RELATION_PEACE_THRESHOLD && warAge > 12 && Math.random() < 0.25) {
                        self._makePeace(fa, fb);
                    }
                    continue;
                }

                // ── Дрейф к нейтралитету ──
                rel *= 0.995;

                // ── Трение на общей границе ──
                var border = State.borderLength(fa, fb);
                if (border > 0) {
                    rel -= Math.min(1.2, border * 0.06) * (profA.aggression + profB.aggression) / 2;
                }

                // ── Идеологические противоречия ──
                if (typeof IDEOLOGY_FOES !== 'undefined') {
                    var foe = IDEOLOGY_FOES.some(function(p) {
                        return (p[0] === fa && p[1] === fb) || (p[0] === fb && p[1] === fa);
                    });
                    if (foe) rel -= 0.25;
                }
                if (typeof IDEOLOGY_FRIENDS !== 'undefined') {
                    var friend = IDEOLOGY_FRIENDS.some(function(p) {
                        return (p[0] === fa && p[1] === fb) || (p[0] === fb && p[1] === fa);
                    });
                    if (friend) rel += 0.35;
                }

                // ── Силовой дисбаланс ──
                if (power[fa] > power[fb] * 1.8) rel -= 0.25;
                if (power[fb] > power[fa] * 1.8) rel -= 0.25;

                // ── Коалиция против лидера ──
                if (dominant && (fa === dominant || fb === dominant)) {
                    var other = fa === dominant ? fb : fa;
                    rel -= 0.9 * profA.aggression;
                    // остальные сближаются друг с другом
                    ids.forEach(function(third) {
                        if (third === dominant) return;
                        if (Math.random() < 0.05) State.changeRelation(other, third, 0.4);
                    });
                }

                // ── Игрок: ИИ не любит усиливаться рядом ──
                if (fa === State.myFactionId || fb === State.myFactionId) {
                    var myId = State.myFactionId;
                    var aiId = fa === myId ? fb : fa;
                    var aiProf = FACTION_AI[aiId] || { aggression: 0.7 };
                    if (shares[myId] > shares[aiId] * 1.5) rel -= 0.3 * aiProf.aggression;
                    if (State.isProtected(myId)) rel -= 0.15;
                }

                State.setRelation(fa, fb, rel);

                // ── Порог войны ──
                if (!allied && rel <= RELATION_WAR_THRESHOLD) {
                    if (Math.random() < 0.08 + (profA.aggression + profB.aggression) * 0.04) {
                        self._declareWar(fa, fb);
                        continue;
                    }
                }

                // ── Порог союза ──
                if (!allied && rel >= RELATION_ALLIANCE_THRESHOLD && Math.random() < 0.01) {
                    State.alliances.push(new Set([fa, fb]));
                    State.createAlert(
                        "СОЮЗ: " + State.getFactionInfo(fa).name.toUpperCase() +
                        " И " + State.getFactionInfo(fb).name.toUpperCase(),
                        10, "diplo"
                    );
                }
            }
        }

        // ── Разрыв союзов, которые потрепала жизнь ──
        State.alliances = State.alliances.filter(function(s) {
            var arr = Array.from(s);
            if (arr.length < 2) return false;
            if (State.getRelation(arr[0], arr[1]) < 0) {
                State.createAlert("СОЮЗ РАЗОРВАН: " +
                    State.getFactionInfo(arr[0]).name.toUpperCase() + " / " +
                    State.getFactionInfo(arr[1]).name.toUpperCase(), 8, "diplo");
                return false;
            }
            return true;
        });
    },

    _declareWar: function(a, b) {
        if (State.isAtWar(a, b) || a === b) return;

        // Первые недели Зона «присматривается»: ИИ не трогает игрока,
        // пока тот осваивается и строит первые отряды.
        if (b === State.myFactionId && State._getDaysSinceStart() < 20) return;
        if (State.calcFactionStats(a).cells === 0) return;
        if (State.calcFactionStats(b).cells === 0) return;

        // Союзники вступают в войну на стороне союзника
        var alliesOfA = State.alliances.filter(function(s) { return s.has(a) && !s.has(b); });
        var alliesOfB = State.alliances.filter(function(s) { return s.has(b) && !s.has(a); });

        State.wars.push({ a: a, b: b });
        State.warSince[State._pairKey(a, b)] = State._getDaysSinceStart();
        State.setRelation(a, b, Math.min(State.getRelation(a, b), -60));

        State.createAlert(
            "ВОЙНА: " + State.getFactionInfo(a).name.toUpperCase() +
            " ПРОТИВ " + State.getFactionInfo(b).name.toUpperCase(),
            12, "war"
        );

        // …и союзники подтягиваются
        alliesOfA.forEach(function(s) {
            Array.from(s).forEach(function(ally) {
                if (ally !== a && !State.isAtWar(ally, b) && Math.random() < 0.5) {
                    State.wars.push({ a: ally, b: b });
                    State.warSince[State._pairKey(ally, b)] = State._getDaysSinceStart();
                    State.setRelation(ally, b, Math.min(State.getRelation(ally, b), -60));
                    State.createAlert(
                        "СОЮЗНИК " + State.getFactionInfo(ally).name.toUpperCase() +
                        " ВСТУПАЕТ В ВОЙНУ", 8, "war"
                    );
                }
            });
        });
        alliesOfB.forEach(function(s) {
            Array.from(s).forEach(function(ally) {
                if (ally !== b && !State.isAtWar(ally, a) && Math.random() < 0.5) {
                    State.wars.push({ a: ally, b: a });
                    State.warSince[State._pairKey(ally, a)] = State._getDaysSinceStart();
                    State.setRelation(ally, a, Math.min(State.getRelation(ally, a), -60));
                }
            });
        });
    },

    _makePeace: function(a, b) {
        State.wars = State.wars.filter(function(w) {
            return !((w.a === a && w.b === b) || (w.a === b && w.b === a));
        });
        delete State.warSince[State._pairKey(a, b)];
        State.setRelation(a, b, -10);
        State.createAlert(
            "МИР: " + State.getFactionInfo(a).name.toUpperCase() +
            " И " + State.getFactionInfo(b).name.toUpperCase() + " ЗАКЛЮЧИЛИ ПЕРЕМИРИЕ",
            12, "diplo"
        );
    },


    _buildPath: function(f, t) {
        if (!f || !t || f === t) return [];
        var owner = State.grid[f];
        var goalOwner = State.grid[t];
        if (!owner) return [];

        var self = this;

        // Границы карты берём из фактического содержимого сетки —
        // карта может быть перерисована в редакторе и стать больше/меньше.
        var mapW = BETA_MAP_WIDTH, mapH = BETA_MAP_HEIGHT;
        Object.keys(State.grid).forEach(function(k) {
            var p = k.split(",");
            var x = parseInt(p[0], 10), y = parseInt(p[1], 10);
            if (x + 1 > mapW) mapW = x + 1;
            if (y + 1 > mapH) mapH = y + 1;
        });

        // Проходимость: своя земля и земля союзников — свободно,
        // земля врага — с боем и дороже. Через нейтралов не ходим:
        // для этого сначала объявляют войну.
        function cellCost(k) {
            if (k === t) return 1;
            var o = State.grid[k];
            if (!o) return Infinity;
            if (o === owner) return 1;
            if (State.areAllies(owner, o)) return 1.2;
            if (State.isAtWar(owner, o)) return 3.0;     // штурм
            return Infinity;
        }

        function passable(k) {
            return cellCost(k) !== Infinity;
        }

        function heuristic(k) {
            var a = k.split(","), b = t.split(",");
            var dx = Math.abs(a[0] - b[0]), dy = Math.abs(a[1] - b[1]);
            return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy); // октальная
        }

        // Двоичная куча-минимум по fScore — без неё A* на 560 клетках тормозит
        var heap = [f], heapF = {};
        heapF[f] = heuristic(f);
        var gScore = {};
        gScore[f] = 0;
        var cameFrom = {};
        var closed = {};
        var guard = 0;
        var MAX_NODES = 3000;

        function push(k, score) {
            heapF[k] = score;
            heap.push(k);
            var i = heap.length - 1;
            while (i > 0) {
                var par = (i - 1) >> 1;
                if ((heapF[heap[par]] || 1e9) <= (heapF[heap[i]] || 1e9)) break;
                var tmp = heap[par]; heap[par] = heap[i]; heap[i] = tmp;
                i = par;
            }
        }

        function pop() {
            var top = heap[0];
            var last = heap.pop();
            if (heap.length) {
                heap[0] = last;
                var i = 0;
                for (;;) {
                    var l = 2 * i + 1, r = l + 1, m = i;
                    if (l < heap.length && (heapF[heap[l]] || 1e9) < (heapF[heap[m]] || 1e9)) m = l;
                    if (r < heap.length && (heapF[heap[r]] || 1e9) < (heapF[heap[l]] || 1e9) && (heapF[heap[r]] || 1e9) < (heapF[heap[m]] || 1e9)) m = r;
                    if (m === i) break;
                    var tmp = heap[m]; heap[m] = heap[i]; heap[i] = tmp;
                    i = m;
                }
            }
            return top;
        }

        var found = false;
        while (heap.length && guard++ < MAX_NODES) {
            var cur = pop();
            if (cur === t) { found = true; break; }
            if (closed[cur]) continue;
            closed[cur] = true;

            var p = cur.split(",");
            var cx = parseInt(p[0], 10), cy = parseInt(p[1], 10);

            for (var dx = -1; dx <= 1; dx++) {
                for (var dy = -1; dy <= 1; dy++) {
                    if (!dx && !dy) continue;
                    var nk = (cx + dx) + "," + (cy + dy);
                    if (closed[nk]) continue;
                    var nx = cx + dx, ny = cy + dy;
                    if (nx < 0 || ny < 0 || nx >= mapW || ny >= mapH) continue;
                    if (!passable(nk)) continue;

                    var step = ((dx && dy) ? Math.SQRT2 : 1) * cellCost(nk);
                    var tentative = gScore[cur] + step;
                    if (tentative < (gScore[nk] === undefined ? 1e9 : gScore[nk])) {
                        cameFrom[nk] = cur;
                        gScore[nk] = tentative;
                        push(nk, tentative + heuristic(nk));
                    }
                }
            }
        }

        if (!found) return [];

        var path = [];
        var node = t;
        while (node !== f) {
            path.unshift(node);
            node = cameFrom[node];
            if (path.length > 400) return [];
        }
        // Первая клетка — стартовая позиция, её в пути не держим
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
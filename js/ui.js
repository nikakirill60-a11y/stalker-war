'use strict';

var UI = {

    init: function() {
        var self = this;

        var btnDraw  = document.getElementById("btn-draw");
        var btnErase = document.getElementById("btn-erase");
        var btnDl    = document.getElementById("btn-download");
        var btnPanel = document.getElementById("toggle-panel-btn");
        var btnPlay  = document.getElementById("btn-start-play");
        var btnNorm  = document.getElementById("btn-map-normal");

        if (btnDraw)  btnDraw.onclick  = function() { self.setBrush("draw"); };
        if (btnErase) btnErase.onclick = function() { self.setBrush("erase"); };
        if (btnDl)    btnDl.onclick    = function() { self.exportMap(); };
        if (btnPanel) btnPanel.onclick = function() {
            document.getElementById("ui-wrapper").classList.toggle("hidden-panel");
        };
        if (btnPlay)  btnPlay.onclick  = function() { self.openPlayMenu(); };
        if (btnNorm)  btnNorm.onclick  = function() { self.resetMapMode(); };

        document.getElementById("btn-pause").onclick   = function() { Engine.setSpeed(0); };
        document.getElementById("btn-speed-1").onclick = function() { Engine.setSpeed(1); };
        document.getElementById("btn-speed-3").onclick = function() { Engine.setSpeed(3); };
        document.getElementById("btn-speed-5").onclick = function() { Engine.setSpeed(5); };
    },

    // ═══════════════════════════════════════════════
    //  МЕНЮ
    // ═══════════════════════════════════════════════

    goToIntelCenter: function() {
        document.getElementById("menu-home").classList.add("hidden");
        document.getElementById("menu-intel").classList.remove("hidden");
    },

    handleFileSelect: function(input) {
        var file = input.files[0];
        if (!file) return;
        var r = new FileReader();
        r.onload = function(e) {
            document.getElementById("import-area").value = e.target.result;
        };
        r.readAsText(file);
    },

    processIntel: function() {
        var raw = document.getElementById("import-area").value.trim();
        try {
            State.grid = raw ? JSON.parse(raw) : generateBetaMap();
        } catch(err) {
            alert("Ошибка JSON!");
            return;
        }
        this.showGame();
    },

    loadBetaMap: function() {
        State.grid = generateBetaMap();
        this.showGame();
    },

    showGame: function() {
        document.getElementById("main-menu").style.display     = "none";
        document.getElementById("game-container").style.display = "block";
        Renderer.resize();
        this.initEditorUI();
    },

    // ═══════════════════════════════════════════════
    //  ВЫБОР ФРАКЦИИ
    // ═══════════════════════════════════════════════

    openPlayMenu: function() {
        var self = this;
        var list = document.getElementById("play-faction-list");
        list.innerHTML = "";
        
        Object.keys(FACTIONS).forEach(function(id) {
            var f   = FACTIONS[id];
            var img = AssetManager.get("factions", id);
            
            var iconHtml = img
                ? '<img src="' + img.src + '" style="width:40px;height:40px;object-fit:contain">'
                : '<div class="faction-icon">' + f.icon + '</div>';
            
            var div = document.createElement("div");
            div.className = "faction-item " + f.cssClass;
            div.innerHTML =
                iconHtml +
                '<div class="faction-info">' +
                    '<div class="faction-name" style="color:' + f.color + '">' + f.name + '</div>' +
                    '<div class="faction-leader">Лидер: ' + (FACTION_LEADERS[id] ? FACTION_LEADERS[id][0].name : 'Неизвестен') + '</div>' +
                    '<div class="faction-desc">' + f.desc + '</div>' +
                '</div>';
            div.onclick = function() { self.startPlay(id); };
            list.appendChild(div);
        });
        
        document.getElementById("play-menu").style.display = "flex";
    },

    startPlay: function(id) {
        var f = FACTIONS[id];
        State.myFactionId         = id;
        State.myLeaderId          = f.defaultLeader;
        State.leaderChanged       = false;
        State.isGameMode          = true;
        State.resources.equipment = f.startEquip || 1000;
        State.resources.rubles    = 5000;
        Engine.setSpeed(1);
        this.updateTopBar();
        document.getElementById("play-menu").style.display     = "none";
        document.getElementById("ui-wrapper").classList.add("hidden-panel");
        document.getElementById("game-tabs").classList.remove("hidden");
        document.getElementById("top-faction-name").innerText  = f.name.toUpperCase();
        State.createAlert("ДОБРО ПОЖАЛОВАТЬ В ЗОНУ. ФРАКЦИЯ: " + f.name.toUpperCase(), 8, "info");
    },

    closePlayMenu: function() {
        document.getElementById("play-menu").style.display = "none";
    },

    // ═══════════════════════════════════════════════
    //  РЕДАКТОР
    // ═══════════════════════════════════════════════

    initEditorUI: function() {
        var self = this;
        var list = document.getElementById("faction-list");
        list.innerHTML = "";
        Object.keys(FACTIONS).forEach(function(id) {
            var f   = FACTIONS[id];
            var div = document.createElement("div");
            div.className = "faction-item " + f.cssClass;
            div.style.cursor       = "pointer";
            div.style.marginBottom = "4px";
            if (id === State.selectedFaction) div.style.borderColor = "#4ade80";
            div.innerHTML =
                '<div class="faction-icon" style="font-size:18px">' + f.icon + '</div>' +
                '<div class="faction-info">' +
                    '<div class="faction-name" style="color:' + f.color + ';font-size:11px">' + f.name + '</div>' +
                '</div>';
            div.onclick = function() {
                State.selectedFaction = id;
                self.initEditorUI();
            };
            list.appendChild(div);
        });
    },

    setBrush: function(mode) {
        State.brushMode = mode;
        var d = document.getElementById("btn-draw");
        var e = document.getElementById("btn-erase");
        if (d) d.classList.toggle("active", mode === "draw");
        if (e) e.classList.toggle("active", mode === "erase");
    },

    exportMap: function() {
        var a  = document.createElement("a");
        a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(State.grid));
        a.download = "stalker_map.json";
        a.click();
    },

    // ═══════════════════════════════════════════════
    //  ВЕРХНЯЯ ПАНЕЛЬ
    // ═══════════════════════════════════════════════

    updateTopBar: function() {
        if (!State.myFactionId) return;
        var stats = State.calcFactionStats(State.myFactionId);
        var eq    = document.getElementById("val-equipment");
        var ter   = document.getElementById("val-stalkers");
        var cach  = document.getElementById("val-caches");
        var rub   = document.getElementById("val-rubles");
        
        if (eq)   eq.innerText   = Math.floor(State.resources.equipment).toLocaleString();
        if (ter)  ter.innerText  = stats.cells;
        if (cach) cach.innerText = stats.totalCaches;
        if (rub)  rub.innerText  = Math.floor(State.resources.rubles).toLocaleString();
    },

    // ═══════════════════════════════════════════════
    //  ИНФОРМАЦИОННАЯ ПАНЕЛЬ
    // ═══════════════════════════════════════════════

    showIntel: function(id, key, withDiplo) {
        var info = State.getFactionInfo(id);
        var cell = State.getCellData(key);

        var el;
        el = document.getElementById("intel-name");     if (el) el.innerText = info.name;
        el = document.getElementById("intel-leader");   
        if (el) {
            var leaders = FACTION_LEADERS[id];
            if (leaders && leaders[0]) el.innerText = leaders[0].name;
            else el.innerText = "Неизвестен";
        }
        el = document.getElementById("intel-ideology"); if (el) el.innerText = info.ideology;
        el = document.getElementById("cell-stalkers");  if (el) el.innerText = cell.stalkers;
        el = document.getElementById("cell-rad");       if (el) el.innerText = cell.radiation + "%";
        el = document.getElementById("cell-anomaly");   if (el) el.innerText = cell.anomalies;

        document.getElementById("intel-sidebar").style.display = "block";

        var diploBlock = document.getElementById("diplo-view-info");
        var show = withDiplo && id !== State.myFactionId;
        diploBlock.classList.toggle("hidden", !show);

        if (show) {
            var atWar  = State.isAtWar(State.myFactionId, id);
            var allied = State.areAllies(State.myFactionId, id);
            var st     = document.getElementById("diplo-status-text");
            if (st) st.innerText = atWar ? "⚔ В СОСТОЯНИИ ВОЙНЫ" : (allied ? "🤝 СОЮЗНИКИ" : "— НЕЙТРАЛЬНЫЕ");

            var acts = document.getElementById("diplo-actions");
            acts.innerHTML = "";

            // ТОРГОВЛЯ (всегда доступна)
            var tradeBtn = document.createElement("button");
            tradeBtn.className = "game-btn amber";
            tradeBtn.style.width = "100%";
            tradeBtn.style.marginTop = "4px";
            tradeBtn.innerText = "🛒 Торговать";
            var capturedId = id;
            tradeBtn.onclick = function() {
                UI.openForeignTrader(capturedId);
            };
            acts.appendChild(tradeBtn);

            if (!atWar) {
                var wb = document.createElement("button");
                wb.className = "game-btn red";
                wb.style.width = "100%";
                wb.style.marginTop = "4px";
                wb.innerText = "Объявить войну";
                var capturedKey = key;
                var self = this;
                wb.onclick = function() {
                    State.wars.push({ a: State.myFactionId, b: capturedId });
                    State.createAlert("ВОЙНА: " + info.name.toUpperCase(), 10, "war");
                    self.showIntel(capturedId, capturedKey, true);
                };
                acts.appendChild(wb);

                if (!allied) {
                    var ab = document.createElement("button");
                    ab.className = "game-btn";
                    ab.style.width     = "100%";
                    ab.style.marginTop = "4px";
                    ab.innerText = "Предложить союз";
                    ab.onclick = function() {
                        State.alliances.push(new Set([State.myFactionId, capturedId]));
                        State.createAlert("СОЮЗ С " + info.name.toUpperCase(), 10, "info");
                        self.showIntel(capturedId, capturedKey, true);
                    };
                    acts.appendChild(ab);
                }
            }
        }
    },

    resetMapMode: function() {
        State.diplomaticTarget = null;
        var bn = document.getElementById("btn-map-normal");
        if (bn) bn.classList.add("hidden");
        document.getElementById("intel-sidebar").style.display = "none";
    },

    // ═══════════════════════════════════════════════
    //  ОКНА
    // ═══════════════════════════════════════════════

    openWindow: function(tab) {
        document.getElementById("hoi-window").style.display = "flex";
        var titles = {
            politics:   "◈ ФРАКЦИЯ",
            research:   "◈ ИССЛЕДОВАНИЯ",
            build:      "◈ СТРОИТЕЛЬСТВО",
            diplomacy:  "◈ ДИПЛОМАТИЯ",
            army:       "◈ ВООРУЖЁННЫЕ СИЛЫ",
            trader:     "◈ ТОРГОВЦЫ",
            mods:       "◈ СИСТЕМА МОДОВ",
            inventory:  "◈ ИНВЕНТАРЬ АРТЕФАКТОВ",
        };
        var wt = document.getElementById("window-title");
        if (wt) wt.innerText = titles[tab] || tab;

        var self = this;
        var map  = {
            politics:   function() { self.renderPolitics(); },
            research:   function() { self.renderResearch(); },
            build:      function() { self.renderBuild(); },
            diplomacy:  function() { self.renderDiplomacy(); },
            army:       function() { self.renderArmy(); },
            trader:     function() { self.renderTrader(); },
            mods:       function() { self.renderMods(); },
            inventory:  function() { self.renderInventory(); },
        };
        if (map[tab]) map[tab]();
    },

    closeWindow: function() {
        document.getElementById("hoi-window").style.display = "none";
    },

    setBody: function(html) {
        document.getElementById("window-body").innerHTML = html;
    },

    // ═══════════════════════════════════════════════
    //  ПОЛИТИКА
    // ═══════════════════════════════════════════════

    renderPolitics: function() {
        var f      = State.getFactionInfo(State.myFactionId);
        var stat   = State.calcFactionStats(State.myFactionId);
        var leader = State.getCurrentLeader();
        
        if (!leader) {
            this.setBody('<div style="text-align:center;padding:40px">Ошибка: лидер не найден</div>');
            return;
        }
        
        var factionLogo = AssetManager.get("factions", State.myFactionId);
        var leaderImg   = AssetManager.get("leaders", leader.portrait);
        
        var logoHtml = factionLogo 
            ? '<img src="' + factionLogo.src + '" class="faction-logo" ' +
              'style="width:64px;height:64px;object-fit:contain;margin:0 auto 10px;display:block">'
            : '<div style="font-size:48px;text-align:center;margin-bottom:10px">' + f.icon + '</div>';
        
        var leaderHtml = leaderImg
            ? '<img src="' + leaderImg.src + '" class="leader-portrait" ' +
              'style="width:165px;height:108px;object-fit:cover;' +
              'border:2px solid var(--stalker-green);background:#0a0f0a;' +
              'box-shadow:0 0 12px rgba(74,222,128,0.2)">'
            : '<div style="width:165px;height:108px;background:#1a1a1a;' +
              'border:2px solid #2a3a2a;display:flex;align-items:center;' +
              'justify-content:center;font-size:48px">👤</div>';
        
        var bonusesHtml = this.renderLeaderBonuses(leader.bonuses);
        
        var changeLeaderBtn = State.leaderChanged
            ? '<div style="background:rgba(139,26,26,0.2);border:1px solid #8b1a1a;padding:10px;text-align:center;font-size:10px;color:#f87171">ЛИДЕР УЖЕ МЕНЯЛСЯ ЗА ЭТУ ИГРУ</div>'
            : '<button onclick="UI.showLeaderSelection()" class="game-btn amber" style="width:100%;padding:10px;font-size:10px">СМЕНИТЬ ЛИДЕРА (ОДИН РАЗ)</button>';
        
        this.setBody(
            '<div style="background:rgba(74,124,78,0.05);border:1px solid #2a3a2a;padding:20px;margin-bottom:12px">' +
                logoHtml +
                '<h2 style="color:' + f.color + ';font-size:22px;text-align:center;letter-spacing:0.15em;margin-bottom:4px">' + 
                    f.name.toUpperCase() + 
                '</h2>' +
                '<p style="text-align:center;color:#5a7a5a;font-size:9px;letter-spacing:0.3em;margin:0 0 20px;text-transform:uppercase">' + 
                    f.ideology + 
                '</p>' +
                '<div style="background:rgba(0,0,0,0.2);border:1px solid #2a3a2a;padding:14px;margin-bottom:16px">' +
                    '<div style="font-size:9px;color:#6a8a6a;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px;border-bottom:1px solid #2a3a2a;padding-bottom:4px">◈ ТЕКУЩИЙ ЛИДЕР</div>' +
                    '<div style="display:flex;gap:16px;align-items:flex-start">' +
                        leaderHtml +
                        '<div style="flex:1">' +
                            '<div style="font-size:16px;font-weight:bold;color:#c8a84b;margin-bottom:6px;letter-spacing:0.05em">' + leader.name + '</div>' +
                            '<div style="font-size:9px;color:#4a6a4a;line-height:1.5;font-style:italic;margin-bottom:12px">"' + leader.quote + '"</div>' +
                            bonusesHtml +
                        '</div>' +
                    '</div>' +
                '</div>' +
                changeLeaderBtn +
                '<div style="border-top:1px solid #2a3a2a;padding-top:12px;margin-top:12px">' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px">' +
                        '<div style="display:flex;justify-content:space-between;font-size:11px"><span style="color:#6a8a6a">Территорий:</span><span style="color:#4ade80;font-weight:bold">' + stat.cells + '</span></div>' +
                        '<div style="display:flex;justify-content:space-between;font-size:11px"><span style="color:#6a8a6a">Схроны:</span><span style="color:#c8a84b;font-weight:bold">' + stat.totalCaches + '</span></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button onclick="UI.renderFocuses()" class="game-btn amber" style="width:100%;padding:12px;font-size:11px;letter-spacing:0.15em">◈ ДЕРЕВО ФОКУСОВ ФРАКЦИИ</button>'
        );
    },

    renderLeaderBonuses: function(bonuses) {
        var bonusMap = {
            equipmentProduction: { label: "Производство", icon: "📦", isPercent: true },
            unitAttack:  { label: "Атака юнитов", icon: "⚔️", isPercent: true },
            unitDefense: { label: "Защита юнитов", icon: "🛡️", isPercent: true },
            unitHP:      { label: "HP юнитов", icon: "❤️", isPercent: true },
            unitCost:    { label: "Стоимость юнитов", icon: "💰", isPercent: true },
            maintenanceCost: { label: "Содержание", icon: "🔧", isPercent: true },
            recruitCost: { label: "Найм", icon: "👥", isPercent: true },
            researchSpeed: { label: "Исследования", icon: "🔬", isPercent: true, inverse: true },
            constructionSpeed: { label: "Стройка", icon: "🏗️", isPercent: true, inverse: true },
            focusSpeed: { label: "Фокусы", icon: "🎯", isPercent: true, inverse: true },
        };
        
        var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:9px">';
        Object.keys(bonuses).forEach(function(key) {
            var val = bonuses[key];
            var cfg = bonusMap[key];
            if (!cfg) return;
            
            var percent;
            if (cfg.inverse) {
                percent = Math.round((1 - val) * 100);
            } else {
                percent = Math.round((val - 1) * 100);
            }
            var sign = percent > 0 ? '+' : '';
            var color = percent > 0 ? '#4ade80' : '#f87171';
            
            html += '<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #1a2a1a">' +
                '<span style="color:#6a8a6a">' + cfg.icon + ' ' + cfg.label + ':</span>' +
                '<span style="color:' + color + ';font-weight:bold">' + sign + percent + '%</span>' +
            '</div>';
        });
        html += '</div>';
        return html;
    },

    // ═══════════════════════════════════════════════
    //  СМЕНА ЛИДЕРА
    // ═══════════════════════════════════════════════

    showLeaderSelection: function() {
        if (State.leaderChanged) {
            State.createAlert("ВЫ УЖЕ МЕНЯЛИ ЛИДЕРА ЗА ЭТУ ИГРУ!", 5, "war");
            return;
        }
        
        var leaders = FACTION_LEADERS[State.myFactionId];
        if (!leaders) {
            State.createAlert("НЕТ ДОСТУПНЫХ ЛИДЕРОВ", 3, "war");
            return;
        }
        
        var html = '<div style="padding:10px;background:rgba(200,168,75,0.05);border:1px solid #c8a84b30;margin-bottom:12px;text-align:center;font-size:10px;color:#c8a84b">⚠ ВНИМАНИЕ: ВЫ МОЖЕТЕ СМЕНИТЬ ЛИДЕРА ТОЛЬКО ОДИН РАЗ ЗА ИГРУ</div>';
        
        leaders.forEach(function(leader) {
            var isCurrent = leader.id === State.myLeaderId;
            var leaderImg = AssetManager.get("leaders", leader.portrait);
            var imgHtml = leaderImg
                ? '<img src="' + leaderImg.src + '" style="width:120px;height:80px;object-fit:cover;border:1px solid #2a3a2a">'
                : '<div style="width:120px;height:80px;background:#1a1a1a;border:1px solid #2a3a2a;display:flex;align-items:center;justify-content:center">👤</div>';
            
            var bonusesShort = '';
            var bonusKeys = Object.keys(leader.bonuses).slice(0, 3);
            bonusKeys.forEach(function(key) {
                var val = leader.bonuses[key];
                var percent = Math.round((val - 1) * 100);
                if (key === 'researchSpeed' || key === 'constructionSpeed' || key === 'focusSpeed') {
                    percent = Math.round((1 - val) * 100);
                }
                var sign = percent > 0 ? '+' : '';
                bonusesShort += '<span style="color:' + (percent > 0 ? '#4ade80' : '#f87171') + '">' + sign + percent + '%</span> ';
            });
            
            html += '<div class="unit-card" style="display:flex;gap:12px;align-items:center;' + (isCurrent ? 'border-left:3px solid #c8a84b;background:rgba(200,168,75,0.1)' : '') + '">' +
                imgHtml +
                '<div style="flex:1">' +
                    '<div style="font-size:13px;font-weight:bold;color:' + (isCurrent ? '#c8a84b' : '#c8c8a0') + '">' + leader.name + (isCurrent ? ' (ТЕКУЩИЙ)' : '') + '</div>' +
                    '<div style="font-size:9px;color:#4a6a4a;margin:4px 0">' + leader.description + '</div>' +
                    '<div style="font-size:9px">' + bonusesShort + '</div>' +
                '</div>';
            
            if (!isCurrent) {
                html += '<button onclick="UI.selectLeader(\'' + leader.id + '\')" class="game-btn" style="font-size:9px;padding:6px 12px">ВЫБРАТЬ</button>';
            }
            
            html += '</div>';
        });
        
        this.setBody(html);
        document.getElementById("window-title").innerText = "◈ ВЫБОР ЛИДЕРА";
        document.getElementById("hoi-window").style.display = "flex";
    },

    selectLeader: function(leaderId) {
        if (State.leaderChanged) {
            State.createAlert("ЛИДЕР УЖЕ МЕНЯЛСЯ!", 3, "war");
            return;
        }
        
        var oldLeader = State.getCurrentLeader();
        State.myLeaderId    = leaderId;
        State.leaderChanged = true;
        
        var newLeader = State.getCurrentLeader();
        
        State.createAlert(
            "НОВЫЙ ЛИДЕР: " + newLeader.name.toUpperCase() + ". " + oldLeader.name.toUpperCase() + " ОТСТРАНЁН.",
            12, "info"
        );
        
        // Перерасчет характеристик всех юнитов при смене лидера
        State.units.forEach(function(u) {
            if (u.owner === State.myFactionId) {
                State.recalculateUnitStats(u);
            }
        });
        
        this.closeWindow();
        this.updateTopBar();
    },

    // ═══════════════════════════════════════════════
    //  ФОКУСЫ
    // ═══════════════════════════════════════════════

    renderFocuses: function() {
        var wt = document.getElementById("window-title");
        if (wt) wt.innerText = "◈ ФОКУСЫ ФРАКЦИИ";

        var focuses = FACTION_FOCUSES[State.myFactionId] || [];
        var html    = "";

        if (State.activeFocus) {
            var bonuses = State.getLeaderBonuses();
            var speedMult = bonuses.focusSpeed || 1;
            var totalDays = FOCUS_DAYS * speedMult;
            var pct = ((totalDays - State.activeFocus.daysLeft) / totalDays * 100).toFixed(1);
            html += '<div style="background:rgba(200,168,75,0.08);border:1px solid rgba(200,168,75,0.3);padding:14px;margin-bottom:12px">' +
                '<div style="font-size:9px;color:#c8a84b;letter-spacing:0.2em;margin-bottom:6px">ВЫПОЛНЯЕТСЯ ФОКУС</div>' +
                '<div style="font-size:13px;margin-bottom:8px">' + State.activeFocus.name + '</div>' +
                '<div class="progress-bg"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
                '<div style="font-size:9px;text-align:right;margin-top:4px;color:#6a8a6a">' + Math.ceil(State.activeFocus.daysLeft) + ' ДНЕЙ</div>' +
            '</div>';
        }

        if (!focuses.length) {
            html += '<div style="text-align:center;padding:40px;color:#4a6a4a;font-size:11px">Нет доступных фокусов</div>';
        } else {
            focuses.forEach(function(f) {
                var done    = State.completedFocuses.has(f.id);
                var current = State.activeFocus && State.activeFocus.id === f.id;
                var btnHtml = "";
                if (done) {
                    btnHtml = '<span style="color:#4ade80;font-size:10px">✓ ГОТОВО</span>';
                } else if (current) {
                    btnHtml = '<span style="color:#c8a84b;font-size:10px">В ПРОЦЕССЕ...</span>';
                } else if (!State.activeFocus) {
                    btnHtml = '<button onclick="UI.startFocus(\'' + f.id + '\')" class="game-btn amber" style="font-size:9px;padding:6px 12px">НАЧАТЬ</button>';
                }
                html += '<div class="unit-card" style="' +
                    (done ? "opacity:0.5;border-color:rgba(74,222,128,0.2);" : "") +
                    (current ? "border-color:#c8a84b;" : "") + '">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center">' +
                        '<div>' +
                            '<div style="font-size:13px;color:' + (done ? "#4ade80" : "#c8a84b") + ';margin-bottom:4px">' + f.name + '</div>' +
                            '<div style="font-size:9px;color:#4a6a4a;text-transform:uppercase;letter-spacing:0.05em">' + f.description + '</div>' +
                        '</div>' +
                        '<div style="margin-left:12px;flex-shrink:0">' + btnHtml + '</div>' +
                    '</div>' +
                '</div>';
            });
        }

        this.setBody(html);
    },

    startFocus: function(id) {
        var focuses = FACTION_FOCUSES[State.myFactionId] || [];
        var f = null;
        focuses.forEach(function(x) { if (x.id === id) f = x; });
        if (f) {
            var bonuses = State.getLeaderBonuses();
            var speedMult = bonuses.focusSpeed || 1;
            State.activeFocus = {
                id:          f.id,
                name:        f.name,
                description: f.description,
                effect:      f.effect,
                daysLeft:    FOCUS_DAYS * speedMult,
            };
            this.renderFocuses();
        }
    },

    // ═══════════════════════════════════════════════
    //  ИССЛЕДОВАНИЯ
    // ═══════════════════════════════════════════════

    renderResearch: function() {
        var html = "";
        var bonuses = State.getLeaderBonuses();
        
        Object.keys(TECH_CONFIG).forEach(function(type) {
            var cfg = TECH_CONFIG[type];
            var cur = State.tech[type];
            html += '<div style="margin-bottom:16px">' +
                '<h4 style="color:#4ade80;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;' +
                'margin-bottom:6px;border-bottom:1px solid #1a3a1a;padding-bottom:4px">' + cfg.label + '</h4>';

            for (var lv = 1; lv <= cfg.maxLevel; lv++) {
                var done  = lv <= cur;
                var proc  = State.activeResearch && State.activeResearch.type === type && State.activeResearch.level === lv;
                var avail = lv === cur + 1 && !State.activeResearch;
                var btn   = '<span style="color:#2a4a2a;font-size:9px">ЗАБЛОКИРОВАНО</span>';
                if (done)  btn = '<span style="color:#4ade80;font-size:9px">АКТИВНО ✓</span>';
                if (proc) {
                    var daysLeft = Math.ceil(State.activeResearch.daysLeft);
                    btn = '<span style="color:#60a5fa;font-size:9px">ИЗУЧАЕТСЯ (' + daysLeft + 'д)</span>';
                }
                if (avail) btn = '<button onclick="UI.startResearch(\'' + type + '\',' + lv + ')" class="game-btn blue" style="font-size:9px;padding:4px 10px">ИЗУЧИТЬ</button>';

                html += '<div class="research-node' + (done ? " completed" : "") + '">' +
                    '<span style="font-size:11px;color:' + (done ? "#c8a84b" : "#6a8a6a") + '">' + cfg.label + ' УР.' + lv + '</span>' +
                    btn +
                '</div>';
            }
            html += '</div>';
        });
        this.setBody(html);
    },

    startResearch: function(type, level) {
        var bonuses = State.getLeaderBonuses();
        var speedMult = bonuses.researchSpeed || 1;
        State.activeResearch = { 
            type: type, 
            level: level, 
            daysLeft: RESEARCH_DAYS * speedMult 
        };
        var el = document.getElementById("research-indicator");
        if (el) el.classList.remove("hidden");
        this.renderResearch();
    },

    // ═══════════════════════════════════════════════
    //  СТРОИТЕЛЬСТВО
    // ═══════════════════════════════════════════════

    renderBuild: function() {
        var active = "";
        var bonuses = State.getLeaderBonuses();
        var constMult = bonuses.constructionSpeed || 1;
        
        if (State.buildQueue.length) {
            var p   = State.buildQueue[0];
            var totalDays = CONSTRUCTION_DAYS * constMult;
            var pct = ((totalDays - p.daysLeft) / totalDays * 100).toFixed(1);
            var bd  = BUILDING_DEFS[p.type];
            active =
                '<div style="background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.3);' +
                'padding:12px;margin-bottom:12px">' +
                    '<div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:6px">' +
                        '<span style="color:#60a5fa">' + bd.icon + ' ' + bd.name + '</span>' +
                        '<span style="color:#6a8a6a">' + Math.ceil(p.daysLeft) + ' дн.</span>' +
                    '</div>' +
                    '<div class="progress-bg"><div class="progress-fill-blue" style="width:' + pct + '%"></div></div>' +
                '</div>';
        }

        var cards = "";
        Object.keys(BUILDING_DEFS).forEach(function(key) {
            var b = BUILDING_DEFS[key];
            cards +=
                '<div class="unit-card" style="display:flex;justify-content:space-between;align-items:center">' +
                    '<div>' +
                        '<div style="font-size:13px;margin-bottom:4px">' + b.icon + ' ' + b.name + '</div>' +
                        '<div style="font-size:9px;color:#4a6a4a">' + b.description + '</div>' +
                        '<div style="font-size:9px;color:#c8a84b;margin-top:4px">Стоимость: ' + b.costEquipment + ' снаряжения</div>' +
                    '</div>' +
                    '<button onclick="UI.selectBuild(\'' + key + '\')" class="game-btn blue" ' +
                    'style="font-size:9px;padding:6px 12px;margin-left:10px">СТРОИТЬ</button>' +
                '</div>';
        });
        this.setBody(active + '<div style="display:flex;flex-direction:column;gap:6px">' + cards + '</div>');
    },

    selectBuild: function(type) {
        var cost = BUILDING_DEFS[type].costEquipment;
        if (State.resources.equipment < cost) {
            State.createAlert("НЕДОСТАТОЧНО СНАРЯЖЕНИЯ", 3, "war");
            return;
        }
        State.buildModeType = type;
        this.closeWindow();
        var el = document.getElementById("build-hint");
        if (el) el.classList.remove("hidden");
    },

    // ═══════════════════════════════════════════════
    //  ДИПЛОМАТИЯ
    // ═══════════════════════════════════════════════

    renderDiplomacy: function() {
        var myId   = State.myFactionId;
        var allies = [];
        State.alliances.forEach(function(a) {
            if (a.has(myId)) {
                a.forEach(function(id) { if (id !== myId) allies.push(id); });
            }
        });

        var enemySet = {};
        State.wars.forEach(function(w) {
            if (w.a === myId) enemySet[w.b] = true;
            if (w.b === myId) enemySet[w.a] = true;
        });
        var enemies = Object.keys(enemySet);

        var aHtml = "";
        if (allies.length) {
            allies.forEach(function(id) {
                var f = State.getFactionInfo(id);
                aHtml +=
                    '<div class="unit-card" style="border-left:3px solid #4ade80;display:flex;justify-content:space-between;align-items:center">' +
                        '<div>' +
                            '<div style="color:#4ade80;font-size:12px">' + f.icon + ' ' + f.name + '</div>' +
                            '<div style="font-size:9px;color:#4a6a4a">' + f.ideology + '</div>' +
                        '</div>' +
                        '<div style="display:flex;gap:6px">' +
                            '<button onclick="UI.callToWar(\'' + id + '\')" class="game-btn red" style="font-size:9px;padding:4px 8px">ПРИЗВАТЬ</button>' +
                            '<button onclick="UI.kickAlly(\'' + id + '\')" class="game-btn" style="font-size:9px;padding:4px 8px;color:#6a8a6a">РАЗОРВАТЬ</button>' +
                        '</div>' +
                    '</div>';
            });
        } else {
            aHtml = '<div style="color:#2a4a2a;font-size:10px;padding:16px;text-align:center">Нет союзников</div>';
        }

        var eHtml = "";
        if (enemies.length) {
            enemies.forEach(function(id) {
                var f = State.getFactionInfo(id);
                eHtml +=
                    '<div class="unit-card" style="border-left:3px solid #dc2626;display:flex;justify-content:space-between;align-items:center">' +
                        '<div>' +
                            '<div style="color:#f87171;font-size:12px">' + f.icon + ' ' + f.name + '</div>' +
                            '<div style="font-size:9px;color:#4a3a3a">' + f.ideology + '</div>' +
                        '</div>' +
                        '<div style="color:#ef4444;font-size:9px;letter-spacing:0.1em">⚔ В ВОЙНЕ</div>' +
                    '</div>';
            });
        } else {
            eHtml = '<div style="color:#2a4a2a;font-size:10px;padding:16px;text-align:center">Мирное время</div>';
        }

        this.setBody(
            '<div style="margin-bottom:16px">' +
                '<h3 style="color:#4ade80;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;' +
                'border-bottom:1px solid #1a3a1a;padding-bottom:6px;margin-bottom:10px">Союзники</h3>' +
                aHtml +
            '</div>' +
            '<div>' +
                '<h3 style="color:#f87171;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;' +
                'border-bottom:1px solid #3a1a1a;padding-bottom:6px;margin-bottom:10px">Враги</h3>' +
                eHtml +
            '</div>'
        );
    },

    callToWar: function(allyId) {
        var myId = State.myFactionId;
        State.wars.forEach(function(w) {
            var enemy = null;
            if (w.a === myId) enemy = w.b;
            if (w.b === myId) enemy = w.a;
            if (enemy && !State.isAtWar(allyId, enemy)) {
                State.wars.push({ a: allyId, b: enemy });
            }
        });
        State.createAlert(State.getFactionInfo(allyId).name + " ВСТУПАЕТ В БОЙ!", 5, "war");
        this.renderDiplomacy();
    },

    kickAlly: function(allyId) {
        var myId = State.myFactionId;
        State.alliances = State.alliances.filter(function(a) {
            return !(a.has(myId) && a.has(allyId));
        });
        State.createAlert("СОЮЗ РАЗОРВАН: " + State.getFactionInfo(allyId).name.toUpperCase(), 8, "info");
        this.renderDiplomacy();
    },

    // ═══════════════════════════════════════════════
    //  АРМИЯ
    // ═══════════════════════════════════════════════

    renderArmy: function() {
        var bonuses = State.getLeaderBonuses();
        var defs  = getUnitDefs(State.tech, bonuses);
        
        var html = '';
        
        // Сначала показываем существующие юниты
        var myUnits = State.units.filter(function(u) { return u.owner === State.myFactionId; });
        if (myUnits.length > 0) {
            html += '<div style="margin-bottom:16px">' +
                '<h3 style="color:#4ade80;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;' +
                'border-bottom:1px solid #1a3a1a;padding-bottom:6px;margin-bottom:10px">Активные бойцы (' + myUnits.length + ')</h3>';
            
            myUnits.forEach(function(unit) {
                var weaponData = Items.getWeapon(unit.weapon);
                var armorData = Items.getArmor(unit.armor);
                var hpPercent = Math.round((unit.hp / unit.maxHp) * 100);
                var hpColor = hpPercent > 75 ? '#4ade80' : (hpPercent > 25 ? '#f59e0b' : '#ef4444');
                
                // Иконки экипировки
                var weaponImg = AssetManager.get("weapons", unit.weapon);
                var armorImg = AssetManager.get("armor", unit.armor);
                var wHtml = weaponImg ? '<img src="' + weaponImg.src + '" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:4px">' : '🔫';
                var aHtml = armorImg ? '<img src="' + armorImg.src + '" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:4px">' : '🛡️';
                
                html += '<div class="unit-card" style="position:relative">' +
                    '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
                        '<div style="flex:1">' +
                            '<div style="font-size:13px;margin-bottom:6px;color:#c8c8a0">' + defs[unit.type].icon + ' ' + defs[unit.type].name + '</div>' +
                            '<div style="font-size:9px;color:#6a8a6a;margin-bottom:4px">ID: ' + unit.id + '</div>' +
                            '<div style="font-size:10px;margin-bottom:6px">' + wHtml + weaponData.name + ' | ' + aHtml + armorData.name + '</div>' +
                            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:9px">' +
                                '<div>⚔️ ' + unit.attack + '</div>' +
                                '<div>🛡️ ' + unit.defense + '</div>' +
                                '<div style="color:' + hpColor + '">❤️ ' + unit.hp + '/' + unit.maxHp + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<button onclick="UI.openUnitEquipment(\'' + unit.id + '\')" class="game-btn amber" style="font-size:9px;padding:6px 12px;margin-left:10px">ЭКИПИРОВКА</button>' +
                    '</div>' +
                '</div>';
            });
            html += '</div>';
        }
        
        // Затем показываем доступные типы для найма
        html += '<div>' +
            '<h3 style="color:#c8a84b;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;' +
            'border-bottom:1px solid #3a2a1a;padding-bottom:6px;margin-bottom:10px">Доступен для найма</h3>';

        var cards = "";
        Object.keys(defs).forEach(function(key) {
            var u = defs[key];
            var rows = [
                ["Атака",        u.baseAttack.toFixed(0),      "#f87171"],
                ["Снаряжение",   u.costEquipment,              "#c8a84b"],
                ["Защита",       u.baseDefense.toFixed(0),     "#60a5fa"],
                ["Люди",         u.costManpower,               "#fb923c"],
                ["HP базовое",   u.baseHp.toFixed(0),          "#4ade80"],
                ["Обслуж./день", u.maintenance.toFixed(1),     "#6a8a6a"],
            ];
            var rowsHtml = rows.map(function(r) {
                return '<div style="display:flex;justify-content:space-between;border-bottom:1px solid #1a2a1a;' +
                    'padding:2px 0;font-size:10px">' +
                    '<span style="color:#4a6a4a">' + r[0] + '</span>' +
                    '<span style="color:' + r[2] + '">' + r[1] + '</span>' +
                    '</div>';
            }).join("");

            cards +=
                '<div class="unit-card">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
                        '<span style="font-size:16px">' + u.icon + ' <span style="font-size:13px">' + u.name + '</span></span>' +
                        '<button onclick="UI.startRecruitment(\'' + key + '\')" class="game-btn" style="font-size:9px;padding:6px 14px">ПРИЗВАТЬ</button>' +
                    '</div>' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px">' + rowsHtml + '</div>' +
                '</div>';
        });
        html += '<div style="display:flex;flex-direction:column;gap:8px">' + cards + '</div></div>';
        
        this.setBody(html);
    },

    startRecruitment: function(type) {
        State.recruitMode = type;
        this.closeWindow();
        var el = document.getElementById("recruit-hint");
        if (el) el.classList.remove("hidden");
    },

    // ═══════════════════════════════════════════════
    //  ЭКИПИРОВКА ЮНИТОВ
    // ═══════════════════════════════════════════════

    openUnitEquipment: function(unitId) {
        var unit = State.units.find(function(u) { return u.id === unitId; });
        if (!unit || unit.owner !== State.myFactionId) return;

        var stock = Items.getTraderStock(State.myFactionId);
        var weaponData = Items.getWeapon(unit.weapon);
        var armorData = Items.getArmor(unit.armor);

        var html = '<div style="margin-bottom:16px;padding:12px;background:rgba(74,124,78,0.05);border:1px solid #2a3a2a">' +
            '<div style="font-size:13px;margin-bottom:8px;color:#c8a84b">Текущая экипировка</div>' +
            '<div style="display:flex;gap:16px;margin-bottom:8px">' +
                '<div>🔫 <span style="color:#c8c8a0">' + weaponData.name + '</span> (+' + weaponData.damage + ' урон)</div>' +
                '<div>🛡️ <span style="color:#c8c8a0">' + armorData.name + '</span> (+' + armorData.protection + ' защита)</div>' +
            '</div>' +
            '<div style="font-size:9px;color:#6a8a6a">Итого: ⚔️' + unit.attack + ' 🛡️' + unit.defense + ' ❤️' + unit.maxHp + '</div>' +
        '</div>';

        // Оружие
        html += '<div style="margin-bottom:16px">' +
            '<h4 style="color:#f87171;font-size:10px;text-transform:uppercase;margin-bottom:8px">🔫 Оружие</h4>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
        
        stock.weapons.forEach(function(weaponId) {
            var weapon = Items.getWeapon(weaponId);
            var isCurrent = unit.weapon === weaponId;
            var canAfford = State.resources.rubles >= weapon.price;
            
            var weaponImg = AssetManager.get("weapons", weaponId);
            var imgHtml = weaponImg ? '<img src="' + weaponImg.src + '" style="width:32px;height:32px;object-fit:contain;margin:0 auto 4px;display:block">' : '🔫';
            
            html += '<div class="unit-card" style="padding:8px;text-align:center;' + (isCurrent ? 'border-color:#4ade80;' : '') + (!canAfford && !isCurrent ? 'opacity:0.5;' : '') + '">' +
                imgHtml +
                '<div style="font-size:11px;margin-bottom:2px;color:' + (isCurrent ? '#4ade80' : '#c8c8a0') + '">' + weapon.name + (isCurrent ? ' ✓' : '') + '</div>' +
                '<div style="font-size:9px;color:#f87171;margin-bottom:4px">+' + weapon.damage + ' урон</div>' +
                '<div style="font-size:9px;color:#c8a84b;margin-bottom:6px">' + weapon.price.toLocaleString() + ' RU</div>';
            
            if (!isCurrent) {
                if (canAfford) {
                    html += '<button onclick="UI.equipItem(\'' + unitId + '\', \'' + weaponId + '\', \'weapon\')" class="game-btn red" style="width:100%;font-size:8px;padding:4px">КУПИТЬ</button>';
                } else {
                    html += '<div style="font-size:8px;color:#666;text-align:center">МАЛО ДЕНЕГ</div>';
                }
            }
            
            html += '</div>';
        });
        html += '</div></div>';

        // Броня
        html += '<div>' +
            '<h4 style="color:#60a5fa;font-size:10px;text-transform:uppercase;margin-bottom:8px">🛡️ Броня</h4>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
        
        stock.armor.forEach(function(armorId) {
            var armor = Items.getArmor(armorId);
            var isCurrent = unit.armor === armorId;
            var canAfford = State.resources.rubles >= armor.price;
            
            var armorImg = AssetManager.get("armor", armorId);
            var imgHtml = armorImg ? '<img src="' + armorImg.src + '" style="width:32px;height:32px;object-fit:contain;margin:0 auto 4px;display:block">' : '🛡️';
            
            html += '<div class="unit-card" style="padding:8px;text-align:center;' + (isCurrent ? 'border-color:#4ade80;' : '') + (!canAfford && !isCurrent ? 'opacity:0.5;' : '') + '">' +
                imgHtml +
                '<div style="font-size:11px;margin-bottom:2px;color:' + (isCurrent ? '#4ade80' : '#c8c8a0') + '">' + armor.name + (isCurrent ? ' ✓' : '') + '</div>' +
                '<div style="font-size:9px;color:#60a5fa;margin-bottom:4px">+' + armor.protection + ' защита</div>' +
                '<div style="font-size:9px;color:#c8a84b;margin-bottom:6px">' + armor.price.toLocaleString() + ' RU</div>';
            
            if (!isCurrent) {
                if (canAfford) {
                    html += '<button onclick="UI.equipItem(\'' + unitId + '\', \'' + armorId + '\', \'armor\')" class="game-btn blue" style="width:100%;font-size:8px;padding:4px">КУПИТЬ</button>';
                } else {
                    html += '<div style="font-size:8px;color:#666;text-align:center">МАЛО ДЕНЕГ</div>';
                }
            }
            
            html += '</div>';
        });
        html += '</div></div>';

        this.setBody(html);
        document.getElementById("window-title").innerText = "◈ ЭКИПИРОВКА БОЙЦА";
    },

    equipItem: function(unitId, itemId, itemType) {
        if (State.equipUnit(unitId, itemId, itemType)) {
            this.openUnitEquipment(unitId);
            this.updateTopBar();
        }
    },

    // ═══════════════════════════════════════════════
    //  ТОРГОВЦЫ
    // ═══════════════════════════════════════════════

    renderTrader: function() {
        var stock = Items.getTraderStock(State.myFactionId);
        var factionInfo = State.getFactionInfo(State.myFactionId);

        var html = '<div style="margin-bottom:16px;padding:12px;background:rgba(74,124,78,0.05);border:1px solid #2a3a2a;text-align:center">' +
            '<div style="font-size:13px;color:#c8a84b;margin-bottom:4px">Торговец группировки ' + factionInfo.name + '</div>' +
            '<div style="font-size:9px;color:#6a8a6a">Ваш баланс: <span style="color:#c8a84b;font-weight:bold">' + Math.floor(State.resources.rubles).toLocaleString() + ' RU</span></div>' +
        '</div>';

        // Оружие
        html += '<div style="margin-bottom:20px">' +
            '<h3 style="color:#f87171;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid #3a1a1a;padding-bottom:6px;margin-bottom:10px">🔫 Оружие</h3>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">';

        stock.weapons.forEach(function(weaponId) {
            var weapon = Items.getWeapon(weaponId);
            var canAfford = State.resources.rubles >= weapon.price;
            
            var weaponImg = AssetManager.get("weapons", weaponId);
            var imgHtml = weaponImg ? '<img src="' + weaponImg.src + '" style="width:48px;height:48px;object-fit:contain;margin:0 auto 8px;display:block">' : '🔫';
            
            html += '<div class="unit-card" style="padding:10px;text-align:center;' + (!canAfford ? 'opacity:0.5;' : '') + '">' +
                imgHtml +
                '<div style="font-size:12px;margin-bottom:4px;color:#f87171">' + weapon.name + '</div>' +
                '<div style="font-size:9px;color:#6a8a6a;margin-bottom:4px">' + weapon.description + '</div>' +
                '<div style="font-size:10px;color:#4ade80;margin-bottom:4px">Урон: +' + weapon.damage + '</div>' +
                '<div style="font-size:11px;color:#c8a84b;margin-bottom:8px">' + weapon.price.toLocaleString() + ' RU</div>';
            
            if (canAfford) {
                html += '<button onclick="UI.buyItem(\'' + weaponId + '\', \'weapon\')" class="game-btn red" style="width:100%;font-size:8px;padding:4px">КУПИТЬ</button>';
            } else {
                html += '<div style="font-size:8px;color:#666">МАЛО ДЕНЕГ</div>';
            }
            
            html += '</div>';
        });
        html += '</div></div>';

        // Броня
        html += '<div>' +
            '<h3 style="color:#60a5fa;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid #1a2a3a;padding-bottom:6px;margin-bottom:10px">🛡️ Броня</h3>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">';

        stock.armor.forEach(function(armorId) {
            var armor = Items.getArmor(armorId);
            var canAfford = State.resources.rubles >= armor.price;
            
            var armorImg = AssetManager.get("armor", armorId);
            var imgHtml = armorImg ? '<img src="' + armorImg.src + '" style="width:48px;height:48px;object-fit:contain;margin:0 auto 8px;display:block">' : '🛡️';
            
            html += '<div class="unit-card" style="padding:10px;text-align:center;' + (!canAfford ? 'opacity:0.5;' : '') + '">' +
                imgHtml +
                '<div style="font-size:12px;margin-bottom:4px;color:#60a5fa">' + armor.name + '</div>' +
                '<div style="font-size:9px;color:#6a8a6a;margin-bottom:4px">' + armor.description + '</div>' +
                '<div style="font-size:10px;color:#4ade80;margin-bottom:4px">Защита: +' + armor.protection + '</div>' +
                '<div style="font-size:11px;color:#c8a84b;margin-bottom:8px">' + armor.price.toLocaleString() + ' RU</div>';
            
            if (canAfford) {
                html += '<button onclick="UI.buyItem(\'' + armorId + '\', \'armor\')" class="game-btn blue" style="width:100%;font-size:8px;padding:4px">КУПИТЬ</button>';
            } else {
                html += '<div style="font-size:8px;color:#666">МАЛО ДЕНЕГ</div>';
            }
            
            html += '</div>';
        });
        html += '</div></div>';

        this.setBody(html);
    },

    buyItem: function(itemId, itemType) {
        var item = itemType === 'weapon' ? Items.getWeapon(itemId) : Items.getArmor(itemId);
        if (State.resources.rubles >= item.price) {
            State.resources.rubles -= item.price;
            State.createAlert("КУПЛЕНО: " + item.name.toUpperCase(), 5, "info");
            this.renderTrader();
            this.updateTopBar();
        } else {
            State.createAlert("НЕДОСТАТОЧНО РУБЛЕЙ", 3, "war");
        }
    },

    openForeignTrader: function(factionId) {
        var stock = Items.getTraderStock(factionId);
        var factionInfo = State.getFactionInfo(factionId);
        var atWar = State.isAtWar(State.myFactionId, factionId);

        var html = '<div style="margin-bottom:16px;padding:12px;background:rgba(74,124,78,0.05);border:1px solid #2a3a2a;text-align:center">' +
            '<div style="font-size:13px;color:#c8a84b;margin-bottom:4px">Торговец группировки ' + factionInfo.name + '</div>' +
            '<div style="font-size:9px;color:#6a8a6a">Ваш баланс: <span style="color:#c8a84b;font-weight:bold">' + Math.floor(State.resources.rubles).toLocaleString() + ' RU</span></div>';

        if (atWar) {
            html += '<div style="margin-top:8px;padding:8px;background:rgba(185,28,28,0.2);border:1px solid #ef4444;color:#f87171;font-size:10px">⚠ ТОРГОВЛЯ С ВРАЖДЕБНОЙ ФРАКЦИЕЙ ПРЕКРАЩЕНА</div>';
        } else {
            html += '<div style="margin-top:8px;font-size:9px;color:#4ade80">✓ Торговля доступна</div>';
        }
        html += '</div>';

        if (atWar) {
            html += '<div style="text-align:center;padding:40px;color:#f87171"><div style="font-size:24px;margin-bottom:12px">⚔️</div><div style="font-size:12px;text-transform:uppercase">Торговля невозможна</div></div>';
        } else {
            // Оружие и броня в сетку
            html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">';
            stock.weapons.concat(stock.armor).forEach(function(itemId) {
                var item = Items.weapons[itemId] || Items.armor[itemId];
                var cat = Items.weapons[itemId] ? "weapons" : "armor";
                var img = AssetManager.get(cat, itemId);
                var imgHtml = img ? '<img src="' + img.src + '" style="width:40px;height:40px;object-fit:contain;margin:0 auto 4px;display:block">' : '📦';
                var canAfford = State.resources.rubles >= item.price;

                html += '<div class="unit-card" style="padding:10px;text-align:center;' + (!canAfford ? 'opacity:0.5;' : '') + '">' +
                    imgHtml + '<div style="font-size:10px;margin-bottom:4px">' + item.name + '</div>' +
                    '<div style="font-size:10px;color:#c8a84b;margin-bottom:6px">' + item.price + ' RU</div>';
                if (canAfford) {
                    html += '<button onclick="UI.buyForeignItem(\'' + itemId + '\', \'' + (Items.weapons[itemId] ? 'weapon' : 'armor') + '\')" class="game-btn amber" style="width:100%;font-size:8px;padding:4px">КУПИТЬ</button>';
                }
                html += '</div>';
            });
            html += '</div>';
        }
        this.setBody(html);
        document.getElementById("window-title").innerText = "◈ ТОРГОВЕЦ: " + factionInfo.name.toUpperCase();
        document.getElementById("hoi-window").style.display = "flex";
    },

    buyForeignItem: function(itemId, itemType) {
        var item = itemType === 'weapon' ? Items.getWeapon(itemId) : Items.getArmor(itemId);
        if (State.resources.rubles >= item.price) {
            State.resources.rubles -= item.price;
            State.createAlert("КУПЛЕНО У СОСЕДЕЙ: " + item.name.toUpperCase(), 5, "info");
            this.updateTopBar();
        } else {
            State.createAlert("НЕДОСТАТОЧНО РУБЛЕЙ", 3, "war");
        }
    },

    // ═══════════════════════════════════════════════
    //  МОДЫ
    // ═══════════════════════════════════════════════

    renderMods: function() {
        var html = '<div style="margin-bottom:16px;padding:12px;background:rgba(200,168,75,0.05);border:1px solid #c8a84b30;text-align:center">' +
            '<div style="font-size:13px;color:#c8a84b;margin-bottom:4px">🔧 Система Модификаций S.T.A.L.K.E.R.</div>' +
            '<div style="font-size:9px;color:#6a8a6a">Загружайте пользовательские моды для расширения игры</div>' +
        '</div>';

        html += '<div style="margin-bottom:20px;padding:12px;background:rgba(0,0,0,0.3);border:1px solid #2a3a2a">' +
            '<h3 style="color:#4ade80;font-size:10px;text-transform:uppercase;margin-bottom:8px">📁 Загрузить мод</h3>' +
            '<div style="display:flex;gap:8px;margin-bottom:8px">' +
                '<button onclick="document.getElementById(\'mod-file-input\').click()" class="game-btn blue" style="flex:1;font-size:9px">ВЫБРАТЬ ФАЙЛ</button>' +
                '<button onclick="UI.downloadModTemplate()" class="game-btn amber" style="flex:1;font-size:9px">ШАБЛОН</button>' +
            '</div>' +
            '<input type="file" id="mod-file-input" style="display:none" accept=".json" onchange="UI.handleModFile(this)">' +
            '<textarea id="mod-text-area" style="width:100%;height:80px;background:#0a120a;border:1px solid #2a3a2a;color:#4ade80;font-family:monospace;font-size:9px;padding:8px;resize:vertical" placeholder="JSON-код мода..."></textarea>' +
            '<button onclick="UI.loadModFromText()" class="game-btn" style="width:100%;margin-top:8px;font-size:9px">ЗАГРУЗИТЬ</button>' +
        '</div>';

        html += '<div><h3 style="color:#f87171;font-size:10px;text-transform:uppercase">📋 Загруженные моды (' + ModManager.loadedMods.length + ')</h3>';
        ModManager.loadedMods.forEach(function(mod) {
            html += '<div class="unit-card" style="display:flex;justify-content:space-between"><div><div style="font-size:12px;color:#c8a84b">' + mod.name + '</div><div style="font-size:9px;color:#6a8a6a">от ' + mod.author + '</div></div>' +
                '<button onclick="UI.removeMod(\'' + mod.id + '\')" class="game-btn red" style="font-size:8px">УДАЛИТЬ</button></div>';
        });
        html += '</div>';
        this.setBody(html);
    },

    handleModFile: function(input) {
        var file = input.files[0];
        if (!file) return;
        var r = new FileReader();
        r.onload = function(e) { document.getElementById('mod-text-area').value = e.target.result; };
        r.readAsText(file);
    },

    loadModFromText: function() {
        var txt = document.getElementById('mod-text-area').value.trim();
        if (txt && ModManager.loadMod(txt)) this.renderMods();
    },

    downloadModTemplate: function() {
        var t = ModManager.generateModTemplate();
        var blob = new Blob([JSON.stringify(t, null, 2)], { type: 'application/json' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'stalker_mod.json'; a.click();
    },

    removeMod: function(modId) {
        if (confirm("Удалить мод?")) { ModManager.removeMod(modId); this.renderMods(); }
    },

    // ═══════════════════════════════════════════════
    //  ИНВЕНТАРЬ
    // ═══════════════════════════════════════════════

    renderInventory: function() {
        var html = '<div style="text-align:center;padding:12px;background:rgba(200,168,75,0.1);margin-bottom:12px">' +
            '<div style="font-size:24px;color:#c8a84b">' + Math.floor(State.resources.rubles) + ' RU</div></div>';
        
        if (State.artifacts.length === 0) {
            html += '<div style="text-align:center;padding:60px;opacity:0.4">ИНВЕНТАРЬ ПУСТ</div>';
        } else {
            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
            State.artifacts.forEach(function(art, index) {
                var img = AssetManager.get("artifacts", art.icon);
                var imgHtml = img ? '<img src="' + img.src + '" style="width:60px;margin:0 auto;display:block">' : '💎';
                html += '<div class="unit-card" style="text-align:center">' + imgHtml + '<div style="font-size:11px">' + art.name + '</div>' +
                    '<div style="color:#c8a84b;font-weight:bold;margin:4px 0">' + art.price + ' RU</div>' +
                    '<button onclick="UI.sellArtifact(' + index + ')" class="game-btn" style="width:100%;font-size:9px">ПРОДАТЬ</button></div>';
            });
            html += '</div>';
        }
        this.setBody(html);
    },

    sellArtifact: function(index) {
        State.sellArtifact(index);
        this.renderInventory();
    },
};
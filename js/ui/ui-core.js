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

        // Безопасное назначение кнопок управления скоростью времени
        var btnPause  = document.getElementById("btn-pause");
        var btnSpeed1 = document.getElementById("btn-speed-1");
        var btnSpeed3 = document.getElementById("btn-speed-3");
        var btnSpeed5 = document.getElementById("btn-speed-5");

        if (btnPause)  btnPause.onclick  = function() { Engine.setSpeed(0); };
        if (btnSpeed1) btnSpeed1.onclick = function() { Engine.setSpeed(1); };
        if (btnSpeed3) btnSpeed3.onclick = function() { Engine.setSpeed(3); };
        if (btnSpeed5) btnSpeed5.onclick = function() { Engine.setSpeed(5); };
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

            var tradeBtn = document.createElement("button");
            tradeBtn.className = "game-btn amber";
            tradeBtn.style.width = "100%";
            tradeBtn.style.marginTop = "4px";
            tradeBtn.innerText = "🛒 Торговать";
            var capturedId = id;
            tradeBtn.onclick = function() {
                UIDiplomacy.openForeignTrader(capturedId);
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

        var map  = {
            politics:   function() { UIPolitics.render(); },
            research:   function() { UIResearch.render(); },
            build:      function() { UIResearch.renderBuild(); },
            diplomacy:  function() { UIDiplomacy.render(); },
            army:       function() { UIMilitary.renderArmy(); },
            trader:     function() { UIEconomy.renderTrader(); },
            mods:       function() { UIMods.render(); },
            inventory:  function() { UIEconomy.renderInventory(); },
        };
        if (map[tab]) map[tab]();
    },

    closeWindow: function() {
        document.getElementById("hoi-window").style.display = "none";
    },

    setBody: function(html) {
        document.getElementById("window-body").innerHTML = html;
    },
};
'use strict';

var Renderer = {
    canvas:  null,
    ctx:     null,
    _isDown: false,
    _hover:  null,

    init: function(canvas) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext("2d");
        var self    = this;
        window.addEventListener("resize", function() { self.resize(); });
        this.resize();
        canvas.addEventListener("mousedown",   function(e) { self._onDown(e); });
        canvas.addEventListener("mousemove",   function(e) { self._onMove(e); });
        canvas.addEventListener("contextmenu", function(e) { e.preventDefault(); });
        window.addEventListener("mouseup",     function()  { self._isDown = false; });
    },

    resize: function() {
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    // ─── ВВОД ─────────────────────────────────
    _onDown: function(e) {
        var key = this._key(e.clientX, e.clientY);

        if (State.isGameMode) {
            if (e.button === 2) {
                var unit = null;
                State.units.forEach(function(u) {
                    if (u.pos === key && u.owner === State.myFactionId) unit = u;
                });
                if (unit) {
                    State.selectedUnitId = unit.id;
                    var oh = document.getElementById("order-hint");
                    if (oh) oh.classList.remove("hidden");
                } else if (State.grid[key]) {
                    State.diplomaticTarget = State.grid[key];
                    var bn = document.getElementById("btn-map-normal");
                    if (bn) bn.classList.remove("hidden");
                    UI.showIntel(State.grid[key], key, true);
                }
            } else {
                if (State.recruitMode)         Engine.deployUnit(key);
                else if (State.buildModeType)  Engine.placeBuilding(key);
                else if (State.selectedUnitId) Engine.giveOrder(key);
                else if (State.grid[key])      UI.showIntel(State.grid[key], key, false);
            }
        } else if (e.button === 0) {
            this._isDown = true;
            this._paint(key);
        }
    },

    _onMove: function(e) {
        var key  = this._key(e.clientX, e.clientY);
        this._hover = State.grid[key] ? key : null;
        if (this._isDown && !State.isGameMode) this._paint(key);
    },

    _paint: function(key) {
        if (State.brushMode === "draw") State.grid[key] = State.selectedFaction;
        else delete State.grid[key];
    },

    _key: function(sx, sy) {
        var c  = State.camera;
        var wx = Math.floor(((sx - this.canvas.width  / 2) / c.zoom + c.x) / CELL_SIZE);
        var wy = Math.floor(((sy - this.canvas.height / 2) / c.zoom + c.y) / CELL_SIZE);
        return wx + "," + wy;
    },

    // ─── РЕНДЕР ───────────────────────────────
    draw: function() {
        var ctx    = this.ctx;
        var canvas = this.canvas;
        var c      = State.camera;

        ctx.fillStyle = "#060d06";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(
            canvas.width  / 2 - c.x * c.zoom,
            canvas.height / 2 - c.y * c.zoom
        );
        ctx.scale(c.zoom, c.zoom);

        this._drawGrid();
        this._drawBuildings();
        this._drawBuildProgress();
        this._drawAnomalies();
        this._drawUnits();
        this._drawBattles();

        ctx.restore();
    },

    // ─── СЕТКА ────────────────────────────────
    _drawGrid: function() {
        var ctx   = this.ctx;
        var S     = CELL_SIZE;
        var self  = this;
        var grid  = State.grid;

        Object.keys(grid).forEach(function(pos) {
            var id   = grid[pos];
            var parts = pos.split(",");
            var x    = parseInt(parts[0]);
            var y    = parseInt(parts[1]);
            var info = State.getFactionInfo(id);
            var color = info.color;

            // Дипломатический режим
            if (State.isGameMode && State.diplomaticTarget) {
                if (id === State.diplomaticTarget) {
                    color = "#f59e0b";
                } else if (State.isAtWar(State.diplomaticTarget, id)) {
                    color = "#dc2626";
                } else if (State.areAllies(State.diplomaticTarget, id)) {
                    color = "#16a34a";
                } else {
                    color = "#374151";
                }
            }

            ctx.fillStyle = color;
            ctx.fillRect(x * S, y * S, S, S);

            // Радиация
            var cell     = State.getCellData(pos);
            var radAlpha = (cell.radiation / 100) * 0.25;
            if (radAlpha > 0.04) {
                ctx.fillStyle = "rgba(74,222,128," + radAlpha + ")";
                ctx.fillRect(x * S, y * S, S, S);
            }

            // Наведение
            if (self._hover === pos) {
                ctx.fillStyle = "rgba(255,255,255,0.12)";
                ctx.fillRect(x * S, y * S, S, S);
            }

            // Сетка
            ctx.strokeStyle = "rgba(0,0,0,0.2)";
            ctx.lineWidth   = 0.5;
            ctx.strokeRect(x * S, y * S, S, S);
        });
    },

    // ─── ПОСТРОЙКИ ────────────────────────────
    _drawBuildings: function() {
        var ctx   = this.ctx;
        var S     = CELL_SIZE;
        var icons = { outpost: "🏕", cache: "📦", lab: "🧪" };

        Object.keys(State.grid).forEach(function(pos) {
            var cell = State.getCellData(pos);
            if (!cell.buildings || !cell.buildings.length) return;
            var parts = pos.split(",");
            var x = parseInt(parts[0]);
            var y = parseInt(parts[1]);
            var last = cell.buildings[cell.buildings.length - 1];
            ctx.font         = Math.floor(S * 0.55) + "px sans-serif";
            ctx.textAlign    = "left";
            ctx.textBaseline = "bottom";
            ctx.fillText(icons[last] || "🏗", x * S + 1, y * S + S - 1);
        });
    },

    // ─── ПРОГРЕСС СТРОЙКИ ─────────────────────
    _drawBuildProgress: function() {
        if (!State.buildQueue.length) return;
        var ctx  = this.ctx;
        var S    = CELL_SIZE;
        var proj = State.buildQueue[0];
        var parts = proj.pos.split(",");
        var x    = parseInt(parts[0]);
        var y    = parseInt(parts[1]);
        var pct  = (CONSTRUCTION_DAYS - proj.daysLeft) / CONSTRUCTION_DAYS;

        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(x * S, y * S + S - 3, S, 3);
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(x * S, y * S + S - 3, S * pct, 3);
    },

    // ─── АНОМАЛИИ ─────────────────────────────
    _drawAnomalies: function() {
        var ctx = this.ctx;
        var S   = CELL_SIZE;
        var t   = Date.now() / 1000;

        Object.keys(State.grid).forEach(function(pos) {
            var cell = State.getCellData(pos);
            if (!cell.anomalies || cell.anomalies <= 0) return;
            var parts = pos.split(",");
            var x     = parseInt(parts[0]);
            var y     = parseInt(parts[1]);
            var pulse = Math.sin(t * 2 + x + y) * 0.5 + 0.5;

            ctx.fillStyle = "rgba(168,85,247," + (0.06 + pulse * 0.10) + ")";
            ctx.fillRect(x * S, y * S, S, S);

            ctx.beginPath();
            ctx.arc(x * S + S - 4, y * S + 4, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(168,85,247," + (0.5 + pulse * 0.5) + ")";
            ctx.fill();
        });
    },

// ─── ЮНИТЫ ────────────────────────────────
_drawUnits: function() {
    var ctx  = this.ctx;
    var S    = CELL_SIZE;
    var defs = getUnitDefs(State.tech);

    State.units.forEach(function(u) {
        var parts = u.pos.split(",");
        var gx = parseInt(parts[0]);
        var gy = parseInt(parts[1]);
        var tx = gx * S + S / 2;
        var ty = gy * S + S / 2;

        // Интерполяция
        if (u.visualX === undefined) { u.visualX = tx; u.visualY = ty; }
        u.visualX += (tx - u.visualX) * 0.18;
        u.visualY += (ty - u.visualY) * 0.18;

        // Выделение
        if (u.id === State.selectedUnitId) {
            ctx.strokeStyle = "#f59e0b";
            ctx.lineWidth   = 2;
            ctx.strokeRect(u.visualX - S / 2 - 2, u.visualY - S / 2 - 2, S + 4, S + 4);
        }

        // Иконка юнита
        ctx.globalAlpha = u.trainingDaysLeft > 0 ? 0.4 : 1;
        
        var iconImg = AssetManager.get("icons", u.type);
        
        if (iconImg && u.trainingDaysLeft <= 0) {
            // Рисуем PNG-изображение
            var iconSize = S * 0.8;
            ctx.drawImage(
                iconImg,
                u.visualX - iconSize / 2,
                u.visualY - iconSize / 2,
                iconSize,
                iconSize
            );
        } else {
            // Fallback на эмодзи
            ctx.font         = Math.floor(S * 0.75) + "px serif";
            ctx.textAlign    = "center";
            ctx.textBaseline = "middle";
            var def  = defs[u.type];
            var icon = u.trainingDaysLeft > 0 ? "⏳" : (def ? def.icon : "👤");
            ctx.fillText(icon, u.visualX, u.visualY);
        }
        
        ctx.globalAlpha = 1;

        // HP-бар
        var bw  = S * 0.82;
        var bx  = u.visualX - bw / 2;
        var by  = u.visualY + S / 2 - 4;
        ctx.fillStyle = "#300";
        ctx.fillRect(bx, by, bw, 3);
        var pct = Math.max(0, u.hp / u.maxHp);
        ctx.fillStyle = pct > 0.5 ? "#4ade80" : (pct > 0.25 ? "#f59e0b" : "#ef4444");
        ctx.fillRect(bx, by, bw * pct, 3);
    });
},

    // ─── ИКОНКИ БОЯ ───────────────────────────
    _drawBattles: function() {
        var ctx = this.ctx;
        State.battles.forEach(function(b) {
            if (b.attacker.visualX == null || b.defender.visualX == null) return;
            var mx = (b.attacker.visualX + b.defender.visualX) / 2;
            var my = (b.attacker.visualY + b.defender.visualY) / 2;
            ctx.font         = "16px serif";
            ctx.textAlign    = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("💥", mx, my);
        });
    },
};
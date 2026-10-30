'use strict';

var UIResearch = {
    // ═══════════════════════════════════════════════
    //  ИССЛЕДОВАНИЯ
    // ═══════════════════════════════════════════════

    render: function() {
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
                if (avail) btn = '<button onclick="UIResearch.startResearch(\'' + type + '\',' + lv + ')" class="game-btn blue" style="font-size:9px;padding:4px 10px">ИЗУЧИТЬ</button>';

                html += '<div class="research-node' + (done ? " completed" : "") + '">' +
                    '<span style="font-size:11px;color:' + (done ? "#c8a84b" : "#6a8a6a") + '">' + cfg.label + ' УР.' + lv + '</span>' +
                    btn +
                '</div>';
            }
            html += '</div>';
        });
        UI.setBody(html);
    },

    startResearch: function(type, level) {
        if (!TECH_CONFIG[type] || !State.tech) return;
        if (State.activeResearch) {
            State.createAlert("СНАЧАЛА ЗАВЕРШИТЕ ТЕКУЩЕЕ ИССЛЕДОВАНИЕ", 3, "war");
            return;
        }
        if (level !== State.tech[type] + 1) {
            State.createAlert("ЭТОТ УРОВЕНЬ НЕДОСТУПЕН", 3, "war");
            return;
        }
        var bonuses = State.getLeaderBonuses();
        var speedMult = bonuses.researchSpeed || 1;
        State.activeResearch = { 
            type: type, 
            level: level, 
            daysLeft: RESEARCH_DAYS * speedMult 
        };
        var el = document.getElementById("research-indicator");
        if (el) el.classList.remove("hidden");
        this.render();
    },

    // ═══════════════════════════════════════════════
    //  СТРОИТЕЛЬСТВО
    // ═══════════════════════════════════════════════

    renderBuild: function() {
        var active = "";
        var bonuses = State.getLeaderBonuses();
        var constMult = bonuses.constructionSpeed || 1;
        
        if (State.buildQueue.length) {
            var p = State.buildQueue[0];
            var totalDays = p.totalDays || (CONSTRUCTION_DAYS * constMult);
            var pct = Math.max(0, Math.min(100, (totalDays - p.daysLeft) / totalDays * 100)).toFixed(1);
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
                    '<button onclick="UIResearch.selectBuild(\'' + key + '\')" class="game-btn blue" ' +
                    'style="font-size:9px;padding:6px 12px;margin-left:10px">СТРОИТЬ</button>' +
                '</div>';
        });
        UI.setBody(active + '<div style="display:flex;flex-direction:column;gap:6px">' + cards + '</div>');
    },

    selectBuild: function(type) {
        var cost = BUILDING_DEFS[type].costEquipment;
        if (State.resources.equipment < cost) {
            State.createAlert("НЕДОСТАТОЧНО СНАРЯЖЕНИЯ", 3, "war");
            return;
        }
        State.buildModeType = type;
        UI.closeWindow();
        var el = document.getElementById("build-hint");
        if (el) el.classList.remove("hidden");
        
        var buildIndicator = document.getElementById("build-indicator");
        if (buildIndicator) buildIndicator.classList.remove("hidden");
    }
};
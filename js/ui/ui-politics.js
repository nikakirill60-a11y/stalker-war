'use strict';

var UIPolitics = {
    // ═══════════════════════════════════════════════
    //  ПОЛИТИКА
    // ═══════════════════════════════════════════════

    render: function() {
        var f      = State.getFactionInfo(State.myFactionId);
        var stat   = State.calcFactionStats(State.myFactionId);
        var leader = State.getCurrentLeader();
        
        if (!leader) {
            UI.setBody('<div style="text-align:center;padding:40px">Ошибка: лидер не найден</div>');
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
            : '<button onclick="UIPolitics.showLeaderSelection()" class="game-btn amber" style="width:100%;padding:10px;font-size:10px">СМЕНИТЬ ЛИДЕРА (ОДИН РАЗ)</button>';
        
        UI.setBody(
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
            '<button onclick="UIPolitics.renderFocuses()" class="game-btn amber" style="width:100%;padding:12px;font-size:11px;letter-spacing:0.15em">◈ ДЕРЕВО ФОКУСОВ ФРАКЦИИ</button>'
        );
    },

    renderLeaderBonuses: function(bonuses) {
        var bonusMap = {
            equipmentProduction: { label: "Производство", icon: "📦", isPercent: true },
            unitAttack:  { label: "Атака юнитов", icon: "⚔️", isPercent: true },
            unitDefense: { label: "Защита юнитов", icon: "🛡️", isPercent: true },
            unitHP:      { label: "HP юнитов", icon: "❤️", isPercent: true },
            unitSpeed:   { label: "Скорость", icon: "👟", isPercent: true },
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
                html += '<button onclick="UIPolitics.selectLeader(\'' + leader.id + '\')" class="game-btn" style="font-size:9px;padding:6px 12px">ВЫБРАТЬ</button>';
            }
            
            html += '</div>';
        });
        
        UI.setBody(html);
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
        
        UI.closeWindow();
        UI.updateTopBar();
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
                    btnHtml = '<button onclick="UIPolitics.startFocus(\'' + f.id + '\')" class="game-btn amber" style="font-size:9px;padding:6px 12px">НАЧАТЬ</button>';
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

        UI.setBody(html);
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
            
            var focusIndicator = document.getElementById("focus-indicator");
            if (focusIndicator) focusIndicator.classList.remove("hidden");
            
            this.renderFocuses();
        }
    }
};
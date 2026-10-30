'use strict';

var UIDiplomacy = {
    // ═══════════════════════════════════════════════
    //  ДИПЛОМАТИЯ
    // ═══════════════════════════════════════════════

    render: function() {
        var myId = State.myFactionId;
        var self = this;

        // Кто доминирует — против него может собраться коалиция
        var shares = {};
        var leader = null, leaderShare = 0;
        Object.keys(FACTIONS).forEach(function(id) {
            var sh = State.factionShare(id);
            shares[id] = sh;
            if (sh > leaderShare) { leaderShare = sh; leader = id; }
        });
        var dominant = leaderShare >= COALITION_DOMINANCE_PERCENT ? leader : null;

        var html = '';

        // ── Сводка ──
        html += '<div style="margin-bottom:14px;padding:10px 12px;background:rgba(6,16,8,0.6);border:1px solid #2a3a2a;font-size:10px;color:#8aa88a">' +
            '<div style="font-size:9px;letter-spacing:0.14em;color:#4a6a4a;text-transform:uppercase;margin-bottom:6px">РАССТАНОВКА СИЛ</div>' +
            '<div>Контроль Зоны: <b style="color:#c8a84b">' + shares[myId].toFixed(1) + '%</b></div>' +
            (dominant
                ? '<div style="margin-top:4px;color:#f87171">⚠ ' + State.getFactionInfo(dominant).name.toUpperCase() +
                  ' КОНТРОЛИРУЕТ ' + leaderShare.toFixed(0) + '% ЗОНЫ — ПРОТИВ НЕЁ СБИВАЕТСЯ КОАЛИЦИЯ</div>'
                : '<div style="margin-top:4px;color:#2a4a2a">Никто не доминирует. Баланс держится.</div>') +
        '</div>';

        // ── Все фракции по убыванию отношений ──
        var rows = Object.keys(FACTIONS)
            .filter(function(id) { return id !== myId; })
            .map(function(id) {
                return { id: id, rel: State.getRelation(myId, id), cells: State.calcFactionStats(id).cells };
            })
            .filter(function(r) { return r.cells > 0; })
            .sort(function(a, b) { return b.rel - a.rel; });

        html += '<h3 style="color:#4ade80;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;' +
            'border-bottom:1px solid #1a3a1a;padding-bottom:6px;margin-bottom:10px">Отношения</h3>';

        rows.forEach(function(r) {
            var f = State.getFactionInfo(r.id);
            var atWar = State.isAtWar(myId, r.id);
            var allied = State.areAllies(myId, r.id);

            var status, color, barColor;
            if (atWar)        { status = "⚔ ВОЙНА";      color = "#ef4444"; barColor = "#7f1d1d"; }
            else if (allied)  { status = "✓ СОЮЗ";       color = "#4ade80"; barColor = "#166534"; }
            else if (r.rel <= RELATION_WAR_THRESHOLD) { status = "⚠ НА ГРАНИ"; color = "#f59e0b"; barColor = "#78350f"; }
            else if (r.rel >= RELATION_ALLIANCE_THRESHOLD) { status = "≈ ДРУЖБА"; color = "#86efac"; barColor = "#166534"; }
            else              { status = "— НЕЙТРАЛИТЕТ"; color = "#6a8a6a"; barColor = "#2a4a2a"; }

            // шкала от -100 до 100
            var pct = Math.round((r.rel + 100) / 2);

            html += '<div class="unit-card" style="border-left:3px solid ' + color + ';margin-bottom:6px;padding:8px 10px">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
                    '<div style="color:' + color + ';font-size:11px">' + f.icon + ' ' + f.name +
                        ' <span style="color:#2a4a2a">· ' + r.cells + ' сект.</span></div>' +
                    '<div style="font-size:8px;letter-spacing:0.08em;color:' + color + '">' + status + '</div>' +
                '</div>' +
                '<div style="height:4px;background:#0a1a0c;border:1px solid #1c2e1c;position:relative">' +
                    '<div style="position:absolute;left:0;top:0;bottom:0;width:' + pct + '%;background:' + barColor + '"></div>' +
                    '<div style="position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:#2a4a2a"></div>' +
                '</div>' +
                '<div style="display:flex;gap:4px;margin-top:6px">' +
                    (atWar
                        ? '<button onclick="UIDiplomacy.offerPeace(\'' + r.id + '\')" class="game-btn" style="font-size:8px;padding:3px 8px">ПРЕДЛОЖИТЬ МИР</button>'
                        : (allied
                            ? '<button onclick="UIDiplomacy.kickAlly(\'' + r.id + '\')" class="game-btn" style="font-size:8px;padding:3px 8px;color:#6a8a6a">РАЗОРВАТЬ СОЮЗ</button>'
                            : '<button onclick="UIDiplomacy.declareWar(\'' + r.id + '\')" class="game-btn red" style="font-size:8px;padding:3px 8px">ОБЪЯВИТЬ ВОЙНУ</button>')) +
                    (!atWar && !allied && r.rel >= RELATION_ALLIANCE_THRESHOLD
                        ? '<button onclick="UIDiplomacy.proposeAlliance(\'' + r.id + '\')" class="game-btn" style="font-size:8px;padding:3px 8px;color:#4ade80">ПРЕДЛОЖИТЬ СОЮЗ</button>'
                        : '') +
                    '<button onclick="UIDiplomacy.openForeignTrader(\'' + r.id + '\')" class="game-btn" style="font-size:8px;padding:3px 8px;color:#c8a84b">ТОРГОВЕЦ</button>' +
                '</div>' +
            '</div>';
        });

        if (!rows.length) {
            html += '<div style="color:#2a4a2a;font-size:10px;padding:16px;text-align:center">В Зоне не осталось других группировок</div>';
        }

        UI.setBody(html);
    },

    declareWar: function(targetId) {
        if (State.isAtWar(State.myFactionId, targetId)) return;
        Engine._declareWar(State.myFactionId, targetId);
        State.setRelation(State.myFactionId, targetId, -80);
        this.render();
    },

    /** Мир возможен, если противник тоже устал от войны. */
    offerPeace: function(targetId) {
        var rel = State.getRelation(State.myFactionId, targetId);
        if (rel >= RELATION_PEACE_THRESHOLD - 25) {
            Engine._makePeace(State.myFactionId, targetId);
        } else {
            State.createAlert(State.getFactionInfo(targetId).name.toUpperCase() +
                " ОТВЕРГАЕТ МИР: ОТНОШЕНИЯ СЛИШКОМ ВРАЖДЕБНЫ", 6, "diplo");
        }
        this.render();
    },

    proposeAlliance: function(targetId) {
        var rel = State.getRelation(State.myFactionId, targetId);
        if (rel < RELATION_ALLIANCE_THRESHOLD) {
            State.createAlert("ОНИ НЕ ДОВЕРЯЮТ ВАМ НАСТОЛЬКО", 5, "diplo");
            this.render();
            return;
        }
        State.alliances.push(new Set([State.myFactionId, targetId]));
        State.createAlert("СОЮЗ С " + State.getFactionInfo(targetId).name.toUpperCase(), 10, "diplo");
        this.render();
    },

    callToWar: function(allyId) {
        var myId = State.myFactionId;
        var newWars = 0;
        
        State.wars.forEach(function(w) {
            var enemy = null;
            if (w.a === myId) enemy = w.b;
            if (w.b === myId) enemy = w.a;
            
            if (enemy && !State.isAtWar(allyId, enemy)) {
                // Проверяем дубликат
                var alreadyAtWar = State.wars.some(function(war) {
                    return (war.a === allyId && war.b === enemy) || (war.a === enemy && war.b === allyId);
                });
                
                if (!alreadyAtWar) {
                    State.wars.push({ a: allyId, b: enemy });
                    newWars++;
                }
            }
        });

        if (newWars > 0) {
            State.createAlert(State.getFactionInfo(allyId).name + " ВСТУПАЕТ В БОЙ! (" + newWars + " войн)", 8, "war");
        } else {
            State.createAlert("НЕТ ОБЩИХ ВРАГОВ", 3, "info");
        }
        this.render();
    },

    kickAlly: function(allyId) {
        var myId = State.myFactionId;
        State.alliances = State.alliances.filter(function(a) {
            return !(a.has(myId) && a.has(allyId));
        });
        State.createAlert("СОЮЗ РАЗОРВАН: " + State.getFactionInfo(allyId).name.toUpperCase(), 8, "info");
        this.render();
    },

    // ─── ОТКРЫТИЕ ИНОСТРАННОГО ТОРГОВЦА ────────────
    openForeignTrader: function(factionId) {
        UIEconomy.openForeignTrader(factionId);
    }
};
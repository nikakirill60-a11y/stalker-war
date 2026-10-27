'use strict';

var UIDiplomacy = {
    // ═══════════════════════════════════════════════
    //  ДИПЛОМАТИЯ
    // ═══════════════════════════════════════════════

    render: function() {
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
                            '<button onclick="UIDiplomacy.callToWar(\'' + id + '\')" class="game-btn red" style="font-size:9px;padding:4px 8px">ПРИЗВАТЬ</button>' +
                            '<button onclick="UIDiplomacy.kickAlly(\'' + id + '\')" class="game-btn" style="font-size:9px;padding:4px 8px;color:#6a8a6a">РАЗОРВАТЬ</button>' +
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

        UI.setBody(
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
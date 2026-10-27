'use strict';

var UIMilitary = {
    // ═══════════════════════════════════════════════
    //  АРМИЯ
    // ═══════════════════════════════════════════════

    renderArmy: function() {
        var bonuses = State.getLeaderBonuses();
        var defs  = getUnitDefs(State.tech, bonuses);
        
        var html = '';
        
        // Существующие юниты
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
                        '<button onclick="UIMilitary.openUnitEquipment(\'' + unit.id + '\')" class="game-btn amber" style="font-size:9px;padding:6px 12px;margin-left:10px">ЭКИПИРОВКА</button>' +
                    '</div>' +
                '</div>';
            });
            html += '</div>';
        }
        
        // Доступные типы для найма
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
                        '<button onclick="UIMilitary.startRecruitment(\'' + key + '\')" class="game-btn" style="font-size:9px;padding:6px 14px">ПРИЗВАТЬ</button>' +
                    '</div>' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px">' + rowsHtml + '</div>' +
                '</div>';
        });
        html += '<div style="display:flex;flex-direction:column;gap:8px">' + cards + '</div></div>';
        
        UI.setBody(html);
    },

    startRecruitment: function(type) {
        State.recruitMode = type;
        UI.closeWindow();
        var el = document.getElementById("recruit-hint");
        if (el) el.classList.remove("hidden");
    },

    // ═══════════════════════════════════════════════
    //  ЭКИПИРОВКА ЮНИТОВ
    // ═══════════════════════════════════════════════

    openUnitEquipment: function(unitId) {
        var unit = State.units.find(function(u) { return u.id === unitId; });
        if (!unit || unit.owner !== State.myFactionId) return;

        var weaponData = Items.getWeapon(unit.weapon);
        var armorData = Items.getArmor(unit.armor);

        var html = '<div style="margin-bottom:16px;padding:14px;background:rgba(74,124,78,0.05);border:1px solid #2a3a2a">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
                '<div>' +
                    '<div style="font-size:16px;color:#c8a84b;margin-bottom:4px">' + unit.type.toUpperCase() + ' #' + unit.id + '</div>' +
                    '<div style="font-size:9px;color:#6a8a6a">Позиция: ' + unit.pos + '</div>' +
                '</div>' +
                '<div style="text-align:right">' +
                    '<div style="font-size:9px;color:#6a8a6a">HP</div>' +
                    '<div style="font-size:14px;color:#4ade80">' + unit.hp + '/' + unit.maxHp + '</div>' +
                '</div>' +
            '</div>' +
            
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:12px;background:rgba(0,0,0,0.3);border:1px solid #1a2a1a;margin-bottom:12px">' +
                '<div style="text-align:center">' +
                    '<div style="font-size:20px;color:#f87171">⚔️</div>' +
                    '<div style="font-size:14px;font-weight:bold;color:#f87171">' + unit.attack + '</div>' +
                    '<div style="font-size:8px;color:#6a8a6a">АТАКА</div>' +
                '</div>' +
                '<div style="text-align:center">' +
                    '<div style="font-size:20px;color:#60a5fa">🛡️</div>' +
                    '<div style="font-size:14px;font-weight:bold;color:#60a5fa">' + unit.defense + '</div>' +
                    '<div style="font-size:8px;color:#6a8a6a">ЗАЩИТА</div>' +
                '</div>' +
                '<div style="text-align:center">' +
                    '<div style="font-size:20px;color:#4ade80">❤️</div>' +
                    '<div style="font-size:14px;font-weight:bold;color:#4ade80">' + unit.maxHp + '</div>' +
                    '<div style="font-size:8px;color:#6a8a6a">HP</div>' +
                '</div>' +
            '</div>' +
            
            '<div style="border:1px solid #2a3a2a;padding:10px;background:rgba(0,0,0,0.2)">' +
                '<div style="font-size:9px;color:#6a8a6a;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.1em">Текущая экипировка</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
                    '<div style="padding:8px;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);text-align:center">' +
                        '<div style="font-size:10px;color:#f87171;margin-bottom:4px">🔫 ' + weaponData.name + '</div>' +
                        '<div style="font-size:9px;color:#6a8a6a">+' + weaponData.damage + ' урон</div>' +
                    '</div>' +
                    '<div style="padding:8px;background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.3);text-align:center">' +
                        '<div style="font-size:10px;color:#60a5fa;margin-bottom:4px">🛡️ ' + armorData.name + '</div>' +
                        '<div style="font-size:9px;color:#6a8a6a">+' + armorData.protection + ' защита</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

        // Инвентарь игрока
        if (!State.inventory) State.inventory = { weapons: [], armor: [] };
        
        var inventoryWeapons = State.inventory.weapons || [];
        var inventoryArmor = State.inventory.armor || [];
        
        if (inventoryWeapons.length > 0) {
            html += '<div style="margin-bottom:16px">' +
                '<h4 style="color:#f87171;font-size:10px;text-transform:uppercase;margin-bottom:8px">🔫 Оружие в инвентаре</h4>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">';
            
            inventoryWeapons.forEach(function(weaponId) {
                var weapon = Items.getWeapon(weaponId);
                var isCurrent = unit.weapon === weaponId;
                var weaponImg = AssetManager.get("weapons", weaponId);
                var imgHtml = weaponImg ? '<img src="' + weaponImg.src + '" style="width:40px;height:40px;object-fit:contain;margin:0 auto 4px;display:block">' : '🔫';
                
                html += '<div class="unit-card" style="padding:8px;text-align:center;' + (isCurrent ? 'border-color:#4ade80;background:rgba(74,222,128,0.1)' : '') + '">' +
                    imgHtml +
                    '<div style="font-size:10px;margin-bottom:2px">' + weapon.name + '</div>' +
                    '<div style="font-size:9px;color:#f87171;margin-bottom:6px">+' + weapon.damage + ' урон</div>';
                
                if (!isCurrent) {
                    html += '<button onclick="UIMilitary.equipFromInventory(\'' + unitId + '\', \'' + weaponId + '\', \'weapon\')" class="game-btn red" style="width:100%;font-size:8px;padding:4px">ЭКИПИРОВАТЬ</button>';
                } else {
                    html += '<div style="font-size:8px;color:#4ade80">✓ ЭКИПИРОВАНО</div>';
                }
                
                html += '</div>';
            });
            html += '</div></div>';
        }

        if (inventoryArmor.length > 0) {
            html += '<div>' +
                '<h4 style="color:#60a5fa;font-size:10px;text-transform:uppercase;margin-bottom:8px">🛡️ Броня в инвентаре</h4>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">';
            
            inventoryArmor.forEach(function(armorId) {
                var armor = Items.getArmor(armorId);
                var isCurrent = unit.armor === armorId;
                var armorImg = AssetManager.get("armor", armorId);
                var imgHtml = armorImg ? '<img src="' + armorImg.src + '" style="width:40px;height:40px;object-fit:contain;margin:0 auto 4px;display:block">' : '🛡️';
                
                html += '<div class="unit-card" style="padding:8px;text-align:center;' + (isCurrent ? 'border-color:#4ade80;background:rgba(74,222,128,0.1)' : '') + '">' +
                    imgHtml +
                    '<div style="font-size:10px;margin-bottom:2px">' + armor.name + '</div>' +
                    '<div style="font-size:9px;color:#60a5fa;margin-bottom:6px">+' + armor.protection + ' защита</div>';
                
                if (!isCurrent) {
                    html += '<button onclick="UIMilitary.equipFromInventory(\'' + unitId + '\', \'' + armorId + '\', \'armor\')" class="game-btn blue" style="width:100%;font-size:8px;padding:4px">ЭКИПИРОВАТЬ</button>';
                } else {
                    html += '<div style="font-size:8px;color:#4ade80">✓ ЭКИПИРОВАНО</div>';
                }
                
                html += '</div>';
            });
            html += '</div></div>';
        }
        
        if (inventoryWeapons.length === 0 && inventoryArmor.length === 0) {
            html += '<div style="text-align:center;padding:40px;opacity:0.4">' +
                '<div style="font-size:48px;margin-bottom:12px">📦</div>' +
                '<div style="font-size:11px;color:#4a6a4a">Инвентарь пуст</div>' +
                '<div style="font-size:9px;color:#2a4a2a;margin-top:8px">Купите предметы у торговца</div>' +
            '</div>';
        }

        UI.setBody(html);
        document.getElementById("window-title").innerText = "◈ ЭКИПИРОВКА БОЙЦА";
    },

    equipFromInventory: function(unitId, itemId, itemType) {
        var unit = State.units.find(function(u) { return u.id === unitId; });
        if (!unit) return;

        if (!State.inventory) State.inventory = { weapons: [], armor: [] };
        var slot  = itemType === 'weapon' ? 'weapons' : 'armor';
        var bag   = State.inventory[slot] = State.inventory[slot] || [];
        var oldId = itemType === 'weapon' ? unit.weapon : unit.armor;

        var idx = bag.indexOf(itemId);
        if (idx === -1) {
            State.createAlert("ПРЕДМЕТА НЕТ В ИНВЕНТАРЕ", 3, "war");
            return;
        }
        bag.splice(idx, 1);

        // Старый предмет возвращаем в инвентарь (если он не тот же самый)
        if (oldId && oldId !== itemId) bag.push(oldId);

        if (itemType === 'weapon') unit.weapon = itemId;
        else                       unit.armor  = itemId;
        
        // Пересчёт
        State.recalculateUnitStats(unit);
        
        var item = itemType === 'weapon' ? Items.getWeapon(itemId) : Items.getArmor(itemId);
        State.createAlert("ЭКИПИРОВАНО: " + item.name.toUpperCase(), 3, "info");
        
        this.openUnitEquipment(unitId);
    }
};
'use strict';

var UIEconomy = {
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
                html += '<button onclick="UIEconomy.buyItem(\'' + weaponId + '\', \'weapon\')" class="game-btn red" style="width:100%;font-size:8px;padding:4px">КУПИТЬ</button>';
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
                html += '<button onclick="UIEconomy.buyItem(\'' + armorId + '\', \'armor\')" class="game-btn blue" style="width:100%;font-size:8px;padding:4px">КУПИТЬ</button>';
            } else {
                html += '<div style="font-size:8px;color:#666">МАЛО ДЕНЕГ</div>';
            }
            
            html += '</div>';
        });
        html += '</div></div>';

        UI.setBody(html);
    },

    buyItem: function(itemId, itemType) {
        var item = itemType === 'weapon' ? Items.getWeapon(itemId) : Items.getArmor(itemId);
        if (!item || typeof item.price !== 'number') {
            State.createAlert("ТОВАР НЕДОСТУПЕН", 3, "war");
            return;
        }
        if (State.resources.rubles >= item.price) {
            State.resources.rubles -= item.price;
            
            // Добавляем в инвентарь
            if (!State.inventory) State.inventory = { weapons: [], armor: [] };
            if (itemType === 'weapon') {
                State.inventory.weapons.push(itemId);
            } else {
                State.inventory.armor.push(itemId);
            }
            
            State.createAlert("КУПЛЕНО: " + item.name.toUpperCase() + " → ИНВЕНТАРЬ", 5, "info");
            this.renderTrader();
            UI.updateTopBar();
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
                    '<div style="font-size:10px;color:#c8a84b;margin-bottom:6px">' + item.price.toLocaleString() + ' RU</div>';
                if (canAfford) {
                    html += '<button onclick="UIEconomy.buyForeignItem(\'' + itemId + '\', \'' + (Items.weapons[itemId] ? 'weapon' : 'armor') + '\')" class="game-btn amber" style="width:100%;font-size:8px;padding:4px">КУПИТЬ</button>';
                }
                html += '</div>';
            });
            html += '</div>';
        }
        UI.setBody(html);
        document.getElementById("window-title").innerText = "◈ ТОРГОВЕЦ: " + factionInfo.name.toUpperCase();
        document.getElementById("hoi-window").style.display = "flex";
    },

    buyForeignItem: function(itemId, itemType) {
        var item = itemType === 'weapon' ? Items.getWeapon(itemId) : Items.getArmor(itemId);
        if (State.resources.rubles >= item.price) {
            State.resources.rubles -= item.price;
            
            if (!State.inventory) State.inventory = { weapons: [], armor: [] };
            if (itemType === 'weapon') {
                State.inventory.weapons.push(itemId);
            } else {
                State.inventory.armor.push(itemId);
            }
            
            State.createAlert("КУПЛЕНО У СОСЕДЕЙ: " + item.name.toUpperCase(), 5, "info");
            UI.updateTopBar();
        } else {
            State.createAlert("НЕДОСТАТОЧНО РУБЛЕЙ", 3, "war");
        }
    },

    // ═══════════════════════════════════════════════
    //  ИНВЕНТАРЬ АРТЕФАКТОВ
    // ═══════════════════════════════════════════════

    renderInventory: function() {
        var artifacts = State.artifacts || [];
        
        var html = '<div style="text-align:center;padding:12px;background:rgba(200,168,75,0.1);margin-bottom:12px">' +
            '<div style="font-size:24px;color:#c8a84b">' + Math.floor(State.resources.rubles).toLocaleString() + ' RU</div>' +
            '<div style="font-size:10px;color:#6a8a6a;margin-top:4px">💎 Артефактов: ' + artifacts.length + '</div>' +
        '</div>';
        
        if (artifacts.length === 0) {
            html += '<div style="text-align:center;padding:60px;opacity:0.4">' +
                '<div style="font-size:48px;margin-bottom:16px">🎒</div>' +
                '<div style="font-size:12px;color:#4a6a4a">ИНВЕНТАРЬ ПУСТ</div>' +
                '<div style="font-size:9px;color:#2a4a2a;margin-top:8px">Исследуйте аномальные зоны для поиска артефактов</div>' +
            '</div>';
        } else {
            html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">';
            artifacts.forEach(function(art, index) {
                // Данные берём из ARTIFACTS, а если артефакт пришёл из мода/сейва —
                // подставляем то, что записано в самом объекте.
                var artData = ARTIFACTS[art.id] || art;
                var rarity  = art.rarity || artData.rarity || 1;
                var img = AssetManager.get("artifacts", art.id);
                var imgHtml = img
                    ? '<img src="' + img.src + '" style="width:64px;height:64px;object-fit:contain;margin:0 auto 8px;display:block">'
                    : '<div style="font-size:48px">💎</div>';

                var rarityColor = rarity === 3 ? '#a855f7' : (rarity === 2 ? '#60a5fa' : '#4ade80');
                var rarityStars = '★'.repeat(rarity);
                var typeLabel   = (artData.type || art.type || "unknown").toUpperCase();
                var artPrice    = artData.price || art.price || 0;

                html += '<div class="unit-card" style="text-align:center;border-color:' + rarityColor + '30">' +
                    imgHtml +
                    '<div style="font-size:11px;font-weight:bold;margin-bottom:4px">' + art.name + '</div>' +
                    '<div style="font-size:9px;color:' + rarityColor + ';margin-bottom:6px">' + rarityStars + ' ' + typeLabel + '</div>' +
                    '<div style="color:#c8a84b;font-weight:bold;margin-bottom:8px">' + artPrice.toLocaleString() + ' RU</div>' +
                    '<button onclick="UIEconomy.sellArtifact(' + index + ')" class="game-btn amber" style="width:100%;font-size:9px">💰 ПРОДАТЬ</button>' +
                '</div>';
            });
            html += '</div>';
        }
        UI.setBody(html);
    },

    sellArtifact: function(index) {
        if (index < 0 || index >= State.artifacts.length) return;
        
        var art = State.artifacts[index];
        var artData = ARTIFACTS[art.id] || art;
        var price = artData.price || art.price || 0;

        State.resources.rubles += price;
        State.artifacts.splice(index, 1);

        State.createAlert(
            "ПРОДАН АРТЕФАКТ: " + art.name.toUpperCase() + " (+" + price.toLocaleString() + " RU)",
            8, "info"
        );
        
        this.renderInventory();
        UI.updateTopBar();
    }
};
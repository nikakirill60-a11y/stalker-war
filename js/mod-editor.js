'use strict';

/**
 * ВИЗУАЛЬНЫЙ РЕДАКТОР МОДОВ
 * Позволяет создавать моды прямо в игре
 */
var ModEditor = {
    currentMod: null,
    editingItem: null,
    currentLeaderFaction: null, // НОВОЕ: текущая фракция для лидеров
    
    // ─── ИНИЦИАЛИЗАЦИЯ НОВОГО МОДА ───────────────────
    createNewMod: function() {
        this.currentMod = {
            id: 'mod_' + Date.now(),
            name: 'Новый мод',
            version: '1.0.0',
            author: 'Аноним',
            description: 'Описание мода',
            weapons: {},
            armor: {},
            factions: {},
            leaders: {},
            artifacts: {},
            focuses: {},
            images: {}
        };
        
        this.renderEditor();
    },

    // ─── ЗАГРУЗКА СУЩЕСТВУЮЩЕГО МОДА ──────────────────
    loadMod: function(modId) {
        var mod = ModManager.loadedMods.find(function(m) { return m.id === modId; });
        if (mod) {
            this.currentMod = JSON.parse(JSON.stringify(mod));
            this.renderEditor();
        }
    },

    // ─── РЕНДЕР РЕДАКТОРА ─────────────────────────────
    renderEditor: function() {
        if (!this.currentMod) {
            this.createNewMod();
            return;
        }

        var html = '';
        
        // Заголовок
        html += '<div style="background:rgba(74,124,78,0.1);border:1px solid #2a3a2a;padding:16px;margin-bottom:16px">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
                '<div>' +
                    '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px;text-transform:uppercase">ID мода</label>' +
                    '<input type="text" id="mod-id" value="' + this.currentMod.id + '" class="mod-input">' +
                '</div>' +
                '<div>' +
                    '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px;text-transform:uppercase">Версия</label>' +
                    '<input type="text" id="mod-version" value="' + this.currentMod.version + '" class="mod-input">' +
                '</div>' +
                '<div>' +
                    '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px;text-transform:uppercase">Название</label>' +
                    '<input type="text" id="mod-name" value="' + this.currentMod.name + '" class="mod-input">' +
                '</div>' +
                '<div>' +
                    '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px;text-transform:uppercase">Автор</label>' +
                    '<input type="text" id="mod-author" value="' + this.currentMod.author + '" class="mod-input">' +
                '</div>' +
            '</div>' +
            '<div style="margin-top:12px">' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px;text-transform:uppercase">Описание</label>' +
                '<textarea id="mod-description" class="mod-input" style="height:60px;resize:vertical;margin-bottom:0">' +
                this.currentMod.description + '</textarea>' +
            '</div>' +
        '</div>';

        // Вкладки контента
        html += '<div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a3a2a;padding-bottom:8px;overflow-x:auto">' +
            '<button onclick="ModEditor.showTab(\'factions\')" class="mod-tab-btn active" data-tab="factions">Фракции</button>' +
            '<button onclick="ModEditor.showTab(\'leaders\')" class="mod-tab-btn" data-tab="leaders">Лидеры</button>' +
            '<button onclick="ModEditor.showTab(\'weapons\')" class="mod-tab-btn" data-tab="weapons">Оружие</button>' +
            '<button onclick="ModEditor.showTab(\'armor\')" class="mod-tab-btn" data-tab="armor">Броня</button>' +
            '<button onclick="ModEditor.showTab(\'artifacts\')" class="mod-tab-btn" data-tab="artifacts">Артефакты</button>' +
        '</div>';

        // Контент вкладок
        html += '<div id="mod-editor-content" style="min-height:400px;max-height:50vh;overflow-y:auto;margin-bottom:16px"></div>';

        // Кнопки действий
        html += '<div style="display:flex;gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid #2a3a2a">' +
            '<button onclick="ModEditor.saveMod()" class="game-btn" style="flex:1">💾 Сохранить</button>' +
            '<button onclick="ModEditor.exportMod()" class="game-btn amber" style="flex:1">📦 Экспортировать ZIP</button>' +
            '<button onclick="UIMods.render()" class="game-btn red">❌ Закрыть</button>' +
        '</div>';

        UI.setBody(html);
        document.getElementById("window-title").innerText = "◈ РЕДАКТОР МОДОВ";
        
        this.showTab('factions');
    },

    // ─── ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ─────────────────────────
    showTab: function(tab) {
        // Обновляем активную вкладку
        document.querySelectorAll('.mod-tab-btn').forEach(function(btn) {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
        });

        var content = document.getElementById('mod-editor-content');
        if (!content) return;

        if (tab === 'factions') this.renderFactionsTab(content);
        else if (tab === 'leaders') this.renderLeadersTab(content);
        else if (tab === 'weapons') this.renderWeaponsTab(content);
        else if (tab === 'armor') this.renderArmorTab(content);
        else if (tab === 'artifacts') this.renderArtifactsTab(content);
    },

    // ─── ВКЛАДКА ФРАКЦИЙ ──────────────────────────────
    renderFactionsTab: function(container) {
        var self = this;
        var html = '';

        html += '<button onclick="ModEditor.addFaction()" class="game-btn" style="width:100%;margin-bottom:12px">+ Добавить фракцию</button>';

        var factions = this.currentMod.factions || {};
        
        if (Object.keys(factions).length === 0) {
            html += '<div style="text-align:center;padding:40px;opacity:0.4">Фракций нет. Нажмите "Добавить"</div>';
        } else {
            Object.keys(factions).forEach(function(id) {
                var faction = factions[id];
                var imageKey = 'faction_' + id;
                var hasImage = self.currentMod.images && self.currentMod.images[imageKey];
                
                html += '<div class="unit-card" style="position:relative">' +
                    '<div style="display:flex;gap:12px;align-items:flex-start">' +
                        '<div style="width:64px;height:64px;background:#0a0f0a;border:1px solid #2a3a2a;display:flex;align-items:center;justify-content:center;flex-shrink:0">';
                
                if (hasImage) {
                    html += '<img src="' + self.currentMod.images[imageKey] + '" style="width:100%;height:100%;object-fit:contain">';
                } else {
                    html += '<span style="font-size:32px">' + faction.icon + '</span>';
                }
                
                html += '</div>' +
                        '<div style="flex:1">' +
                            '<div style="font-size:13px;font-weight:bold;color:' + faction.color + ';margin-bottom:4px">' + faction.name + '</div>' +
                            '<div style="font-size:9px;color:#6a8a6a;margin-bottom:4px">ID: ' + id + '</div>' +
                            '<div style="font-size:9px;color:#4a6a4a">' + faction.desc + '</div>' +
                        '</div>' +
                        '<div style="display:flex;flex-direction:column;gap:4px">' +
                            '<button onclick="ModEditor.editFaction(\'' + id + '\')" class="game-btn" style="font-size:8px;padding:4px 8px">Редактировать</button>' +
                            '<button onclick="ModEditor.uploadFactionImage(\'' + id + '\')" class="game-btn amber" style="font-size:8px;padding:4px 8px">📷 Фото</button>' +
                            '<button onclick="ModEditor.deleteFaction(\'' + id + '\')" class="game-btn red" style="font-size:8px;padding:4px 8px">Удалить</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            });
        }

        container.innerHTML = html;
    },

    // ─── ДОБАВЛЕНИЕ ФРАКЦИИ ───────────────────────────
    addFaction: function() {
        var id = prompt("Введите ID фракции (латиница, без пробелов):");
        if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
            State.createAlert("НЕВЕРНЫЙ ID: ТОЛЬКО ЛАТИНИЦА, ЦИФРЫ, _ И -", 6, "war");
            return;
        }

        if (!this.currentMod.factions) this.currentMod.factions = {};
        
        this.currentMod.factions[id] = {
            name: "Новая фракция",
            color: "#4ade80",
            ideology: "Идеология",
            icon: "❓",
            cssClass: "fi-" + id,
            desc: "Описание фракции",
            startEquip: 1000,
            defaultLeader: null
        };

        this.showTab('factions');
    },

    // ─── РЕДАКТИРОВАНИЕ ФРАКЦИИ ───────────────────────
    editFaction: function(id) {
        var faction = this.currentMod.factions[id];
        if (!faction) return;

        var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Название</label>' +
                '<input type="text" id="edit-name" value="' + faction.name + '" class="mod-input">' +
            '</div>' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Цвет</label>' +
                '<input type="color" id="edit-color" value="' + faction.color + '" class="mod-input">' +
            '</div>' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Иконка</label>' +
                '<input type="text" id="edit-icon" value="' + faction.icon + '" class="mod-input" placeholder="🎯">' +
            '</div>' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Идеология</label>' +
                '<input type="text" id="edit-ideology" value="' + faction.ideology + '" class="mod-input">' +
            '</div>' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Стартовое снаряжение</label>' +
                '<input type="number" id="edit-equip" value="' + faction.startEquip + '" class="mod-input">' +
            '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
            '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Описание</label>' +
            '<textarea id="edit-desc" class="mod-input" style="height:60px;resize:vertical;margin-bottom:0">' + faction.desc + '</textarea>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:16px">' +
            '<button onclick="ModEditor.saveFactionEdit(\'' + id + '\')" class="game-btn" style="flex:1">Сохранить</button>' +
            '<button onclick="ModEditor.showTab(\'factions\')" class="game-btn red">Отмена</button>' +
        '</div>';

        document.getElementById('mod-editor-content').innerHTML = html;
    },

    saveFactionEdit: function(id) {
        var faction = this.currentMod.factions[id];
        
        faction.name = document.getElementById('edit-name').value;
        faction.color = document.getElementById('edit-color').value;
        faction.icon = document.getElementById('edit-icon').value;
        faction.ideology = document.getElementById('edit-ideology').value;
        faction.startEquip = parseInt(document.getElementById('edit-equip').value);
        faction.desc = document.getElementById('edit-desc').value;

        this.showTab('factions');
    },

    deleteFaction: function(id) {
        if (confirm("Удалить фракцию?")) {
            delete this.currentMod.factions[id];
            delete this.currentMod.leaders[id]; // Удаляем лидеров этой фракции
            this.showTab('factions');
        }
    },

    // ─── ЗАГРУЗКА ИЗОБРАЖЕНИЯ ФРАКЦИИ ─────────────────
    uploadFactionImage: function(id) {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        var self = this;
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function(event) {
                if (!self.currentMod.images) self.currentMod.images = {};
                self.currentMod.images['faction_' + id] = event.target.result;
                self.showTab('factions');
            };
            reader.readAsDataURL(file);
        };
        
        input.click();
    },

    // ─── ВКЛАДКА ЛИДЕРОВ (ИСПРАВЛЕНА) ─────────────────
    renderLeadersTab: function(container) {
        var self = this;
        var html = '';

        // Объединяем встроенные и пользовательские фракции
        var allFactions = Object.assign({}, FACTIONS, this.currentMod.factions || {});
        var factionKeys = Object.keys(allFactions);
        
        // Если нет фракций в моде - предлагаем создать
        if (factionKeys.length === 0) {
            html = '<div style="text-align:center;padding:40px;color:#f87171">' +
                '<div style="font-size:18px;margin-bottom:16px">⚠️</div>' +
                '<div style="font-size:12px;margin-bottom:16px">Сначала создайте фракцию!</div>' +
                '<button onclick="ModEditor.showTab(\'factions\')" class="game-btn">Создать фракцию</button>' +
            '</div>';
            container.innerHTML = html;
            return;
        }

        // Выбор фракции
        html += '<div style="margin-bottom:12px">' +
            '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px;text-transform:uppercase">Выберите фракцию</label>' +
            '<select id="leader-faction-select" class="mod-input" onchange="ModEditor.updateLeadersList()" style="margin-bottom:0">';
        
        // Устанавливаем первую доступную фракцию если не выбрана
        if (!this.currentLeaderFaction || !allFactions[this.currentLeaderFaction]) {
            this.currentLeaderFaction = factionKeys[0];
        }
        
        factionKeys.forEach(function(id) {
            var isSelected = (id === ModEditor.currentLeaderFaction) ? 'selected' : '';
            html += '<option value="' + id + '" ' + isSelected + '>' + allFactions[id].name + '</option>';
        });
        
        html += '</select></div>';

        html += '<button onclick="ModEditor.addLeader()" class="game-btn" style="width:100%;margin-bottom:12px">+ Добавить лидера</button>';

        html += '<div id="leaders-list-container"></div>';

        container.innerHTML = html;

        // После рендера обновляем список лидеров
        setTimeout(function() {
            ModEditor.updateLeadersList();
        }, 0);
    },

    updateLeadersList: function() {
        var select = document.getElementById('leader-faction-select');
        if (!select) return;
        
        var factionId = select.value;
        this.currentLeaderFaction = factionId;
        
        this.renderLeadersList(document.getElementById('leaders-list-container'), factionId);
    },

    renderLeadersList: function(container, factionId) {
        var self = this;
        var leaders = this.currentMod.leaders[factionId] || [];
        var allFactions = Object.assign({}, FACTIONS, this.currentMod.factions || {});
        
        var html = '';

        if (leaders.length === 0) {
            html += '<div style="text-align:center;padding:40px;opacity:0.4">Лидеров нет. Нажмите "Добавить"</div>';
        } else {
            leaders.forEach(function(leader, index) {
                var imageKey = 'leader_' + leader.id;
                var hasImage = self.currentMod.images && self.currentMod.images[imageKey];
                
                html += '<div class="unit-card">' +
                    '<div style="display:flex;gap:12px;align-items:flex-start">' +
                        '<div style="width:120px;height:80px;background:#0a0f0a;border:1px solid #2a3a2a;flex-shrink:0;overflow:hidden">';
                
                if (hasImage) {
                    html += '<img src="' + self.currentMod.images[imageKey] + '" style="width:100%;height:100%;object-fit:cover">';
                } else {
                    html += '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px">👤</div>';
                }
                
                html += '</div>' +
                        '<div style="flex:1">' +
                            '<div style="font-size:13px;font-weight:bold;color:#c8a84b;margin-bottom:4px">' + leader.name + '</div>' +
                            '<div style="font-size:9px;color:#6a8a6a;margin-bottom:4px">ID: ' + leader.id + '</div>' +
                            '<div style="font-size:9px;color:#4a6a4a;font-style:italic">"' + leader.quote + '"</div>' +
                        '</div>' +
                        '<div style="display:flex;flex-direction:column;gap:4px">' +
                            '<button onclick="ModEditor.editLeader(\'' + factionId + '\',' + index + ')" class="game-btn" style="font-size:8px;padding:4px 8px">Редактировать</button>' +
                            '<button onclick="ModEditor.uploadLeaderImage(\'' + leader.id + '\')" class="game-btn amber" style="font-size:8px;padding:4px 8px">📷 Фото</button>' +
                            '<button onclick="ModEditor.deleteLeader(\'' + factionId + '\',' + index + ')" class="game-btn red" style="font-size:8px;padding:4px 8px">Удалить</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            });
        }

        container.innerHTML = html;
    },

    addLeader: function() {
        var select = document.getElementById('leader-faction-select');
        if (!select) {
            State.createAlert("СНАЧАЛА ВЫБЕРИТЕ ФРАКЦИЮ", 6, "war");
            return;
        }
        
        var factionId = select.value;
        
        var id = prompt("Введите ID лидера (латиница):");
        if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
            State.createAlert("НЕВЕРНЫЙ ID: ТОЛЬКО ЛАТИНИЦА, ЦИФРЫ, _ И -", 6, "war");
            return;
        }

        if (!this.currentMod.leaders) this.currentMod.leaders = {};
        if (!this.currentMod.leaders[factionId]) this.currentMod.leaders[factionId] = [];

        this.currentMod.leaders[factionId].push({
            id: id,
            name: "Новый лидер",
            portrait: id,
            quote: "Цитата лидера",
            bonuses: {
                unitAttack: 1.10
            },
            description: "Описание лидера"
        });

        this.updateLeadersList();
    },

    editLeader: function(factionId, index) {
        var leader = this.currentMod.leaders[factionId][index];
        
        var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Имя</label>' +
                '<input type="text" id="edit-leader-name" value="' + leader.name + '" class="mod-input">' +
            '</div>' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">ID портрета</label>' +
                '<input type="text" id="edit-leader-portrait" value="' + leader.portrait + '" class="mod-input">' +
            '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
            '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Цитата</label>' +
            '<textarea id="edit-leader-quote" class="mod-input" style="height:50px;resize:vertical;margin-bottom:0">' + leader.quote + '</textarea>' +
        '</div>' +
        '<div style="margin-top:12px">' +
            '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Описание</label>' +
            '<textarea id="edit-leader-desc" class="mod-input" style="height:50px;resize:vertical;margin-bottom:0">' + leader.description + '</textarea>' +
        '</div>' +
        '<div style="margin-top:12px">' +
            '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:12px">Бонусы (JSON)</label>' +
            '<textarea id="edit-leader-bonuses" class="mod-input" style="height:100px;font-family:monospace;resize:vertical;margin-bottom:0">' + JSON.stringify(leader.bonuses, null, 2) + '</textarea>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:16px">' +
            '<button onclick="ModEditor.saveLeaderEdit(\'' + factionId + '\',' + index + ')" class="game-btn" style="flex:1">Сохранить</button>' +
            '<button onclick="ModEditor.updateLeadersList()" class="game-btn red">Отмена</button>' +
        '</div>';

        document.getElementById('leaders-list-container').innerHTML = html;
    },

    saveLeaderEdit: function(factionId, index) {
        var leader = this.currentMod.leaders[factionId][index];
        
        leader.name = document.getElementById('edit-leader-name').value;
        leader.portrait = document.getElementById('edit-leader-portrait').value;
        leader.quote = document.getElementById('edit-leader-quote').value;
        leader.description = document.getElementById('edit-leader-desc').value;
        
        try {
            leader.bonuses = JSON.parse(document.getElementById('edit-leader-bonuses').value);
        } catch(e) {
            State.createAlert("ОШИБКА В JSON БОНУСОВ: " + e.message, 8, "war");
            return;
        }

        this.updateLeadersList();
    },

    deleteLeader: function(factionId, index) {
        if (confirm("Удалить лидера?")) {
            this.currentMod.leaders[factionId].splice(index, 1);
            this.updateLeadersList();
        }
    },

    uploadLeaderImage: function(id) {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        var self = this;
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function(event) {
                if (!self.currentMod.images) self.currentMod.images = {};
                self.currentMod.images['leader_' + id] = event.target.result;
                self.updateLeadersList();
            };
            reader.readAsDataURL(file);
        };
        
        input.click();
    },

    // ─── ВКЛАДКА ОРУЖИЯ ───────────────────────────────
    renderWeaponsTab: function(container) {
        var self = this;
        var html = '';

        html += '<button onclick="ModEditor.addWeapon()" class="game-btn" style="width:100%;margin-bottom:12px">+ Добавить оружие</button>';

        var weapons = this.currentMod.weapons || {};
        
        if (Object.keys(weapons).length === 0) {
            html += '<div style="text-align:center;padding:40px;opacity:0.4">Оружия нет. Нажмите "Добавить"</div>';
        } else {
            Object.keys(weapons).forEach(function(id) {
                var weapon = weapons[id];
                var imageKey = 'weapon_' + id;
                var hasImage = self.currentMod.images && self.currentMod.images[imageKey];
                
                html += '<div class="unit-card" style="display:flex;gap:12px;align-items:center">' +
                    '<div style="width:48px;height:48px;background:#0a0f0a;border:1px solid #2a3a2a;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">';
                
                if (hasImage) {
                    html += '<img src="' + self.currentMod.images[imageKey] + '" style="width:100%;height:100%;object-fit:contain">';
                } else {
                    html += '<span style="font-size:24px">🔫</span>';
                }
                
                html += '</div>' +
                        '<div style="flex:1">' +
                            '<div style="font-size:12px;font-weight:bold;color:#f87171;margin-bottom:2px">' + weapon.name + '</div>' +
                            '<div style="font-size:9px;color:#6a8a6a">Урон: +' + weapon.damage + ' | Цена: ' + weapon.price + ' RU</div>' +
                        '</div>' +
                        '<div style="display:flex;flex-direction:column;gap:4px">' +
                            '<button onclick="ModEditor.editWeapon(\'' + id + '\')" class="game-btn" style="font-size:8px;padding:4px 8px">Редактировать</button>' +
                            '<button onclick="ModEditor.uploadWeaponImage(\'' + id + '\')" class="game-btn amber" style="font-size:8px;padding:4px 8px">📷</button>' +
                            '<button onclick="ModEditor.deleteWeapon(\'' + id + '\')" class="game-btn red" style="font-size:8px;padding:4px 8px">Удалить</button>' +
                        '</div>' +
                    '</div>';
            });
        }

        container.innerHTML = html;
    },

    addWeapon: function() {
        var id = prompt("ID оружия (латиница):");
        if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
            State.createAlert("НЕВЕРНЫЙ ID: ТОЛЬКО ЛАТИНИЦА, ЦИФРЫ, _ И -", 6, "war");
            return;
        }

        if (!this.currentMod.weapons) this.currentMod.weapons = {};
        
        this.currentMod.weapons[id] = {
            name: "Новое оружие",
            type: "rifle",
            damage: 50,
            price: 25000,
            icon: id,
            description: "Описание оружия"
        };

        this.showTab('weapons');
    },

    editWeapon: function(id) {
        var weapon = this.currentMod.weapons[id];
        
        var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Название</label>' +
                '<input type="text" id="edit-weapon-name" value="' + weapon.name + '" class="mod-input">' +
            '</div>' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Урон</label>' +
                '<input type="number" id="edit-weapon-damage" value="' + weapon.damage + '" class="mod-input">' +
            '</div>' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Цена (RU)</label>' +
                '<input type="number" id="edit-weapon-price" value="' + weapon.price + '" class="mod-input">' +
            '</div>' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Тип</label>' +
                '<select id="edit-weapon-type" class="mod-input" style="margin-bottom:0">' +
                    '<option value="pistol" ' + (weapon.type === 'pistol' ? 'selected' : '') + '>Пистолет</option>' +
                    '<option value="shotgun" ' + (weapon.type === 'shotgun' ? 'selected' : '') + '>Дробовик</option>' +
                    '<option value="rifle" ' + (weapon.type === 'rifle' ? 'selected' : '') + '>Винтовка</option>' +
                    '<option value="sniper" ' + (weapon.type === 'sniper' ? 'selected' : '') + '>Снайперская</option>' +
                    '<option value="special" ' + (weapon.type === 'special' ? 'selected' : '') + '>Спецоружие</option>' +
                    '<option value="heavy" ' + (weapon.type === 'heavy' ? 'selected' : '') + '>Тяжёлое</option>' +
                '</select>' +
            '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
            '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Описание</label>' +
            '<textarea id="edit-weapon-desc" class="mod-input" style="height:60px;resize:vertical;margin-bottom:0">' + weapon.description + '</textarea>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:16px">' +
            '<button onclick="ModEditor.saveWeaponEdit(\'' + id + '\')" class="game-btn" style="flex:1">Сохранить</button>' +
            '<button onclick="ModEditor.showTab(\'weapons\')" class="game-btn red">Отмена</button>' +
        '</div>';

        document.getElementById('mod-editor-content').innerHTML = html;
    },

    saveWeaponEdit: function(id) {
        var weapon = this.currentMod.weapons[id];
        
        weapon.name = document.getElementById('edit-weapon-name').value;
        weapon.damage = parseInt(document.getElementById('edit-weapon-damage').value);
        weapon.price = parseInt(document.getElementById('edit-weapon-price').value);
        weapon.type = document.getElementById('edit-weapon-type').value;
        weapon.description = document.getElementById('edit-weapon-desc').value;

        this.showTab('weapons');
    },

    deleteWeapon: function(id) {
        if (confirm("Удалить оружие?")) {
            delete this.currentMod.weapons[id];
            this.showTab('weapons');
        }
    },

    uploadWeaponImage: function(id) {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        var self = this;
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function(event) {
                if (!self.currentMod.images) self.currentMod.images = {};
                self.currentMod.images['weapon_' + id] = event.target.result;
                self.showTab('weapons');
            };
            reader.readAsDataURL(file);
        };
        
        input.click();
    },

    // ─── ВКЛАДКА БРОНИ ────────────────────────────────
    renderArmorTab: function(container) {
        var self = this;
        var html = '';

        html += '<button onclick="ModEditor.addArmor()" class="game-btn" style="width:100%;margin-bottom:12px">+ Добавить броню</button>';

        var armor = this.currentMod.armor || {};
        
        if (Object.keys(armor).length === 0) {
            html += '<div style="text-align:center;padding:40px;opacity:0.4">Брони нет. Нажмите "Добавить"</div>';
        } else {
            Object.keys(armor).forEach(function(id) {
                var armorItem = armor[id];
                var imageKey = 'armor_' + id;
                var hasImage = self.currentMod.images && self.currentMod.images[imageKey];
                
                html += '<div class="unit-card" style="display:flex;gap:12px;align-items:center">' +
                    '<div style="width:48px;height:48px;background:#0a0f0a;border:1px solid #2a3a2a;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">';
                
                if (hasImage) {
                    html += '<img src="' + self.currentMod.images[imageKey] + '" style="width:100%;height:100%;object-fit:contain">';
                } else {
                    html += '<span style="font-size:24px">🛡️</span>';
                }
                
                html += '</div>' +
                        '<div style="flex:1">' +
                            '<div style="font-size:12px;font-weight:bold;color:#60a5fa;margin-bottom:2px">' + armorItem.name + '</div>' +
                            '<div style="font-size:9px;color:#6a8a6a">Защита: +' + armorItem.protection + ' | Цена: ' + armorItem.price + ' RU</div>' +
                        '</div>' +
                        '<div style="display:flex;flex-direction:column;gap:4px">' +
                            '<button onclick="ModEditor.editArmor(\'' + id + '\')" class="game-btn" style="font-size:8px;padding:4px 8px">Редактировать</button>' +
                            '<button onclick="ModEditor.uploadArmorImage(\'' + id + '\')" class="game-btn amber" style="font-size:8px;padding:4px 8px">📷</button>' +
                            '<button onclick="ModEditor.deleteArmor(\'' + id + '\')" class="game-btn red" style="font-size:8px;padding:4px 8px">Удалить</button>' +
                        '</div>' +
                    '</div>';
            });
        }

        container.innerHTML = html;
    },

    addArmor: function() {
        var id = prompt("ID брони (латиница):");
        if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
            State.createAlert("НЕВЕРНЫЙ ID: ТОЛЬКО ЛАТИНИЦА, ЦИФРЫ, _ И -", 6, "war");
            return;
        }

        if (!this.currentMod.armor) this.currentMod.armor = {};
        
        this.currentMod.armor[id] = {
            name: "Новая броня",
            type: "medium",
            protection: 25,
            price: 45000,
            icon: id,
            description: "Описание брони"
        };

        this.showTab('armor');
    },

    editArmor: function(id) {
        var armorItem = this.currentMod.armor[id];
        
        var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Название</label>' +
                '<input type="text" id="edit-armor-name" value="' + armorItem.name + '" class="mod-input">' +
            '</div>' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Защита</label>' +
                '<input type="number" id="edit-armor-protection" value="' + armorItem.protection + '" class="mod-input">' +
            '</div>' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Цена (RU)</label>' +
                '<input type="number" id="edit-armor-price" value="' + armorItem.price + '" class="mod-input">' +
            '</div>' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Тип</label>' +
                '<select id="edit-armor-type" class="mod-input" style="margin-bottom:0">' +
                    '<option value="light" ' + (armorItem.type === 'light' ? 'selected' : '') + '>Лёгкая</option>' +
                    '<option value="medium" ' + (armorItem.type === 'medium' ? 'selected' : '') + '>Средняя</option>' +
                    '<option value="heavy" ' + (armorItem.type === 'heavy' ? 'selected' : '') + '>Тяжёлая</option>' +
                    '<option value="exo" ' + (armorItem.type === 'exo' ? 'selected' : '') + '>Экзоскелет</option>' +
                    '<option value="unique" ' + (armorItem.type === 'unique' ? 'selected' : '') + '>Уникальная</option>' +
                '</select>' +
            '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
            '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Описание</label>' +
            '<textarea id="edit-armor-desc" class="mod-input" style="height:60px;resize:vertical;margin-bottom:0">' + armorItem.description + '</textarea>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:16px">' +
            '<button onclick="ModEditor.saveArmorEdit(\'' + id + '\')" class="game-btn" style="flex:1">Сохранить</button>' +
            '<button onclick="ModEditor.showTab(\'armor\')" class="game-btn red">Отмена</button>' +
        '</div>';

        document.getElementById('mod-editor-content').innerHTML = html;
    },

    saveArmorEdit: function(id) {
        var armorItem = this.currentMod.armor[id];
        
        armorItem.name = document.getElementById('edit-armor-name').value;
        armorItem.protection = parseInt(document.getElementById('edit-armor-protection').value);
        armorItem.price = parseInt(document.getElementById('edit-armor-price').value);
        armorItem.type = document.getElementById('edit-armor-type').value;
        armorItem.description = document.getElementById('edit-armor-desc').value;

        this.showTab('armor');
    },

    deleteArmor: function(id) {
        if (confirm("Удалить броню?")) {
            delete this.currentMod.armor[id];
            this.showTab('armor');
        }
    },

    uploadArmorImage: function(id) {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        var self = this;
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function(event) {
                if (!self.currentMod.images) self.currentMod.images = {};
                self.currentMod.images['armor_' + id] = event.target.result;
                self.showTab('armor');
            };
            reader.readAsDataURL(file);
        };
        
        input.click();
    },

    // ─── ВКЛАДКА АРТЕФАКТОВ ───────────────────────────
    renderArtifactsTab: function(container) {
        var self = this;
        var html = '';

        html += '<button onclick="ModEditor.addArtifact()" class="game-btn" style="width:100%;margin-bottom:12px">+ Добавить артефакт</button>';

        var artifacts = this.currentMod.artifacts || {};
        
        if (Object.keys(artifacts).length === 0) {
            html += '<div style="text-align:center;padding:40px;opacity:0.4">Артефактов нет. Нажмите "Добавить"</div>';
        } else {
            Object.keys(artifacts).forEach(function(id) {
                var artifact = artifacts[id];
                var imageKey = 'artifact_' + id;
                var hasImage = self.currentMod.images && self.currentMod.images[imageKey];
                
                html += '<div class="unit-card" style="display:flex;gap:12px;align-items:center">' +
                    '<div style="width:48px;height:48px;background:#0a0f0a;border:1px solid #2a3a2a;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">';
                
                if (hasImage) {
                    html += '<img src="' + self.currentMod.images[imageKey] + '" style="width:100%;height:100%;object-fit:contain">';
                } else {
                    html += '<span style="font-size:24px">💎</span>';
                }
                
                html += '</div>' +
                        '<div style="flex:1">' +
                            '<div style="font-size:12px;font-weight:bold;color:#a855f7;margin-bottom:2px">' + artifact.name + '</div>' +
                            '<div style="font-size:9px;color:#6a8a6a">Редкость: ' + artifact.rarity + ' | Цена: ' + artifact.price + ' RU</div>' +
                        '</div>' +
                        '<div style="display:flex;flex-direction:column;gap:4px">' +
                            '<button onclick="ModEditor.editArtifact(\'' + id + '\')" class="game-btn" style="font-size:8px;padding:4px 8px">Редактировать</button>' +
                            '<button onclick="ModEditor.uploadArtifactImage(\'' + id + '\')" class="game-btn amber" style="font-size:8px;padding:4px 8px">📷</button>' +
                            '<button onclick="ModEditor.deleteArtifact(\'' + id + '\')" class="game-btn red" style="font-size:8px;padding:4px 8px">Удалить</button>' +
                        '</div>' +
                    '</div>';
            });
        }

        container.innerHTML = html;
    },

    addArtifact: function() {
        var id = prompt("ID артефакта (латиница):");
        if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
            State.createAlert("НЕВЕРНЫЙ ID: ТОЛЬКО ЛАТИНИЦА, ЦИФРЫ, _ И -", 6, "war");
            return;
        }

        if (!this.currentMod.artifacts) this.currentMod.artifacts = {};
        
        this.currentMod.artifacts[id] = {
            name: "Новый артефакт",
            price: 5000,
            icon: id,
            type: "rare",
            rarity: 2
        };

        this.showTab('artifacts');
    },

    editArtifact: function(id) {
        var artifact = this.currentMod.artifacts[id];
        
        var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Название</label>' +
                '<input type="text" id="edit-artifact-name" value="' + artifact.name + '" class="mod-input">' +
            '</div>' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Цена (RU)</label>' +
                '<input type="number" id="edit-artifact-price" value="' + artifact.price + '" class="mod-input">' +
            '</div>' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Тип</label>' +
                '<select id="edit-artifact-type" class="mod-input" style="margin-bottom:0">' +
                    '<option value="electric" ' + (artifact.type === 'electric' ? 'selected' : '') + '>Электрический</option>' +
                    '<option value="chemical" ' + (artifact.type === 'chemical' ? 'selected' : '') + '>Химический</option>' +
                    '<option value="gravity" ' + (artifact.type === 'gravity' ? 'selected' : '') + '>Гравитационный</option>' +
                    '<option value="thermal" ' + (artifact.type === 'thermal' ? 'selected' : '') + '>Термальный</option>' +
                    '<option value="protective" ' + (artifact.type === 'protective' ? 'selected' : '') + '>Защитный</option>' +
                    '<option value="rare" ' + (artifact.type === 'rare' ? 'selected' : '') + '>Редкий</option>' +
                '</select>' +
            '</div>' +
            '<div>' +
                '<label style="display:block;font-size:9px;color:#6a8a6a;margin-bottom:4px">Редкость (1-3)</label>' +
                '<input type="number" id="edit-artifact-rarity" value="' + artifact.rarity + '" min="1" max="3" class="mod-input">' +
            '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:16px">' +
            '<button onclick="ModEditor.saveArtifactEdit(\'' + id + '\')" class="game-btn" style="flex:1">Сохранить</button>' +
            '<button onclick="ModEditor.showTab(\'artifacts\')" class="game-btn red">Отмена</button>' +
        '</div>';

        document.getElementById('mod-editor-content').innerHTML = html;
    },

    saveArtifactEdit: function(id) {
        var artifact = this.currentMod.artifacts[id];
        
        artifact.name = document.getElementById('edit-artifact-name').value;
        artifact.price = parseInt(document.getElementById('edit-artifact-price').value);
        artifact.type = document.getElementById('edit-artifact-type').value;
        artifact.rarity = parseInt(document.getElementById('edit-artifact-rarity').value);

        this.showTab('artifacts');
    },

    deleteArtifact: function(id) {
        if (confirm("Удалить артефакт?")) {
            delete this.currentMod.artifacts[id];
            this.showTab('artifacts');
        }
    },

    uploadArtifactImage: function(id) {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        var self = this;
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function(event) {
                if (!self.currentMod.images) self.currentMod.images = {};
                self.currentMod.images['artifact_' + id] = event.target.result;
                self.showTab('artifacts');
            };
            reader.readAsDataURL(file);
        };
        
        input.click();
    },

    // ─── СОХРАНЕНИЕ МОДА ──────────────────────────────
    saveMod: function() {
        // Обновляем метаданные из формы
        this.currentMod.id = document.getElementById('mod-id').value;
        this.currentMod.name = document.getElementById('mod-name').value;
        this.currentMod.version = document.getElementById('mod-version').value;
        this.currentMod.author = document.getElementById('mod-author').value;
        this.currentMod.description = document.getElementById('mod-description').value;

        // Проверяем существующий мод
        var existingIndex = ModManager.loadedMods.findIndex(function(m) { 
            return m.id === ModEditor.currentMod.id; 
        });

        if (existingIndex !== -1) {
            ModManager.loadedMods[existingIndex] = this.currentMod;
        } else {
            ModManager.loadedMods.push(this.currentMod);
        }

        ModManager.saveModsToStorage();
        ModManager.applyMods();

        State.createAlert("МОД СОХРАНЁН: " + this.currentMod.name.toUpperCase(), 5, "info");
    },

    // ─── ЭКСПОРТ МОДА В ZIP (ИСПРАВЛЕН) ───────────────
    exportMod: function() {
        // Сначала сохраняем
        this.saveMod();
        
        State.createAlert("ПОДГОТОВКА ЭКСПОРТА...", 3, "info");

        // Небольшая задержка чтобы пользователь видел сообщение
        setTimeout(function() {
            ModManager.exportMod(ModEditor.currentMod, function(blob) {
                var a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = ModEditor.currentMod.id + '_v' + ModEditor.currentMod.version + '.zip';
                
                // Добавляем в DOM чтобы click сработал
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // Освобождаем URL
                setTimeout(function() {
                    URL.revokeObjectURL(a.href);
                }, 100);
                
                State.createAlert("МОД ЭКСПОРТИРОВАН: " + ModEditor.currentMod.id + '.zip', 5, "info");
            });
        }, 100);
    }
};
'use strict';

var UIMods = {
    // ═══════════════════════════════════════════════
    //  СИСТЕМА МОДОВ
    // ═══════════════════════════════════════════════

    render: function() {
        var html = '<div style="margin-bottom:16px;padding:12px;background:rgba(200,168,75,0.05);border:1px solid #c8a84b30;text-align:center">' +
            '<div style="font-size:13px;color:#c8a84b;margin-bottom:4px">🔧 Система Модификаций S.T.A.L.K.E.R. v2.0</div>' +
            '<div style="font-size:9px;color:#6a8a6a">Загружайте и создавайте пользовательские моды</div>' +
        '</div>';

        // Вкладки
        html += '<div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a3a2a;padding-bottom:8px">' +
            '<button onclick="UIMods.showTab(\'browser\')" class="mod-tab-btn active" data-tab="browser">📁 Моды</button>' +
            '<button onclick="UIMods.showTab(\'upload\')" class="mod-tab-btn" data-tab="upload">📦 Загрузить</button>' +
            '<button onclick="UIMods.showTab(\'create\')" class="mod-tab-btn" data-tab="create">✏️ Редактор</button>' +
        '</div>';

        // Контент вкладок
        html += '<div id="mods-tab-content" style="min-height:400px;max-height:55vh;overflow-y:auto"></div>';

        UI.setBody(html);
        document.getElementById("window-title").innerText = "◈ СИСТЕМА МОДОВ";
        
        this.showTab('browser');
    },

    showTab: function(tab) {
        // Обновляем активную вкладку
        document.querySelectorAll('.mod-tab-btn').forEach(function(btn) {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
        });

        var content = document.getElementById('mods-tab-content');
        if (!content) return;

        if (tab === 'browser') this.renderBrowser(content);
        else if (tab === 'upload') this.renderUpload(content);
        else if (tab === 'create') this.renderCreate(content);
    },

    // ─── БРАУЗЕР МОДОВ ────────────────────────────
    renderBrowser: function(container) {
        var html = '';

        if (ModManager.loadedMods.length === 0) {
            html = '<div style="text-align:center;padding:60px;opacity:0.4">' +
                '<div style="font-size:48px;margin-bottom:16px">📦</div>' +
                '<div style="font-size:12px;color:#4a6a4a">НЕТ ЗАГРУЖЕННЫХ МОДОВ</div>' +
                '<div style="font-size:9px;color:#2a4a2a;margin-top:8px">Нажмите "Загрузить" чтобы добавить мод</div>' +
            '</div>';
        } else {
            html = '<div style="display:grid;gap:8px">';
            
            ModManager.loadedMods.forEach(function(mod) {
                var logo = ModManager.getModImage('faction', Object.keys(mod.factions || {})[0]);
                var logoHtml = logo 
                    ? '<img src="' + logo + '" style="width:48px;height:48px;object-fit:contain">'
                    : '<div style="width:48px;height:48px;background:#1a1a1a;border:1px solid #2a3a2a;display:flex;align-items:center;justify-content:center;font-size:20px">📦</div>';
                
                var factionCount = Object.keys(mod.factions || {}).length;
                var leaderCount = Object.keys(mod.leaders || {}).reduce(function(sum, key) {
                    return sum + (mod.leaders[key] ? mod.leaders[key].length : 0);
                }, 0);
                var weaponCount = Object.keys(mod.weapons || {}).length;
                var armorCount = Object.keys(mod.armor || {}).length;
                
                html += '<div class="unit-card" style="display:flex;gap:12px;align-items:flex-start">' +
                    logoHtml +
                    '<div style="flex:1">' +
                        '<div style="font-size:13px;font-weight:bold;color:#c8a84b">' + mod.name + ' <span style="color:#6a8a6a;font-size:10px">v' + mod.version + '</span></div>' +
                        '<div style="font-size:9px;color:#4a6a4a;margin:4px 0">' + mod.author + '</div>' +
                        '<div style="font-size:9px;color:#6a8a6a;margin-bottom:8px">' + mod.description + '</div>' +
                        '<div style="display:flex;gap:8px;font-size:8px;color:#5a7a5a">' +
                            '<span>🏘️ Фракции: ' + factionCount + '</span>' +
                            '<span>👤 Лидеры: ' + leaderCount + '</span>' +
                            '<span>🔫 Оружие: ' + weaponCount + '</span>' +
                            '<span>🛡️ Броня: ' + armorCount + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div style="display:flex;flex-direction:column;gap:4px">' +
                        '<button onclick="UIMods.editMod(\'' + mod.id + '\')" class="game-btn" style="font-size:8px;padding:4px 8px">✏️ Редактировать</button>' +
                        '<button onclick="UIMods.exportMod(\'' + mod.id + '\')" class="game-btn amber" style="font-size:8px;padding:4px 8px">📥 Экспортировать</button>' +
                        '<button onclick="UIMods.deleteMod(\'' + mod.id + '\')" class="game-btn red" style="font-size:8px;padding:4px 8px">❌ Удалить</button>' +
                    '</div>' +
                '</div>';
            });
            
            html += '</div>';
        }

        container.innerHTML = html;
    },

    // ─── ЗАГРУЗКА МОДОВ ───────────────────────────
    renderUpload: function(container) {
        var html = '<div style="padding:20px;text-align:center">' +
            '<div style="font-size:48px;margin-bottom:16px">📦</div>' +
            '<div style="font-size:12px;color:#c8a84b;margin-bottom:16px">Загрузите архив мода (.zip)</div>' +
            '<div style="display:flex;gap:8px;margin-bottom:16px">' +
                '<button onclick="document.getElementById(\'mod-file-input\').click()" class="game-btn blue" style="flex:1;padding:12px;font-size:10px">📁 ВЫБРАТЬ ФАЙЛ</button>' +
                '<button onclick="UIMods.downloadTemplate()" class="game-btn amber" style="flex:1;padding:12px;font-size:10px">📋 ШАБЛОН</button>' +
            '</div>' +
            '<input type="file" id="mod-file-input" style="display:none" accept=".zip" onchange="UIMods.handleModFile(this)">' +
            '<div style="background:rgba(0,0,0,0.3);border:1px solid #2a3a2a;padding:16px;border-radius:2px">' +
                '<div style="font-size:10px;color:#6a8a6a;margin-bottom:12px;text-align:left">📖 Структура архива:</div>' +
                '<pre style="background:#0a120a;border:1px solid #1a2a1a;padding:12px;font-size:8px;color:#4ade80;overflow-x:auto;text-align:left">' +
'mod.json                          (конфиг мода)' + '\n' +
'README.md                          (описание)' + '\n' +
'images/' + '\n' +
'  factions/my_faction.png        (логотип фракции 256x256)' + '\n' +
'  leaders/my_leader.jpg          (портрет 165x108)' + '\n' +
'  weapons/gun_name.png           (иконка оружия 128x128)' + '\n' +
'  armor/armor_name.png           (иконка брони 128x128)' + '\n' +
'  artifacts/artifact_name.png    (иконка артефакта 128x128)' +
                '</pre>' +
            '</div>' +
        '</div>';

        container.innerHTML = html;
    },

    handleModFile: function(input) {
        var file = input.files[0];
        if (!file) return;

        ModManager.loadModArchive(file,
            function(mod) {
                // Успех
                UIMods.showTab('browser');
            },
            function(error) {
                State.createAlert("ОШИБКА МОДА: " + error, 8, "war");
            }
        );
    },

    downloadTemplate: function() {
        var template = ModManager.generateModTemplate();
        var json = JSON.stringify(template, null, 2);
        
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'mod_template.json';
        a.click();
        
        State.createAlert("ШАБЛОН ЗАГРУЖЕН", 3, "info");
    },

    // ─── РЕДАКТОР МОДОВ ───────────────────────────
    renderCreate: function(container) {
        var html = '<div style="display:flex;gap:8px;margin-bottom:16px">' +
            '<button onclick="UIMods.createNewMod()" class="game-btn amber" style="flex:1;padding:10px;font-size:10px">✨ НОВЫЙ МОД</button>' +
            '<button onclick="UIMods.loadModForEditing()" class="game-btn blue" style="flex:1;padding:10px;font-size:10px">📖 ЗАГРУЗИТЬ МОД</button>' +
        '</div>';

        if (ModEditor.currentMod) {
            html += '<div style="background:rgba(200,168,75,0.1);border:1px solid #c8a84b30;padding:12px;margin-bottom:16px">' +
                '<div style="font-size:11px;color:#c8a84b;margin-bottom:8px">📝 Редактируется: ' + ModEditor.currentMod.name + '</div>' +
                '<button onclick="UIMods.openEditor()" class="game-btn amber" style="width:100%;padding:10px;font-size:10px">✏️ ОТКРЫТЬ РЕДАКТОР</button>' +
            '</div>';
        } else {
            html += '<div style="text-align:center;padding:60px;opacity:0.4">' +
                '<div style="font-size:48px;margin-bottom:16px">✏️</div>' +
                '<div style="font-size:12px;color:#4a6a4a">РЕДАКТОР МОДОВ</div>' +
                '<div style="font-size:9px;color:#2a4a2a;margin-top:8px">Создавайте собственные фракции, лидеров, оружие и броню</div>' +
            '</div>';
        }

        container.innerHTML = html;
    },

    createNewMod: function() {
        ModEditor.createNewMod();
        this.showTab('create');
    },

    loadModForEditing: function() {
        if (ModManager.loadedMods.length === 0) {
            State.createAlert("НЕТ МОДОВ ДЛЯ РЕДАКТИРОВАНИЯ", 4, "info");
            return;
        }

        var mod = ModManager.loadedMods[0];
        for (var i = 0; i < ModManager.loadedMods.length; i++) {
            var m = ModManager.loadedMods[i];
            if (confirm("Редактировать мод: " + m.name + " ?")) {
                mod = m;
                break;
            }
        }

        ModEditor.loadMod(mod.id);
        this.showTab('create');
    },

    openEditor: function() {
        // Закрываем текущее окно и открываем редактор в основном
        UI.closeWindow();
        ModEditor.renderEditor();
    },

    editMod: function(modId) {
        ModEditor.loadMod(modId);
        this.openEditor();
    },

    exportMod: function(modId) {
        var mod = ModManager.loadedMods.find(function(m) { return m.id === modId; });
        if (!mod) return;

        ModManager.exportMod(mod, function(blob) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = mod.id + '_v' + mod.version + '.zip';
            a.click();
            
            State.createAlert("МОД ЭКСПОРТИРОВАН: " + mod.name, 5, "info");
        });
    },

    deleteMod: function(modId) {
        var mod = ModManager.loadedMods.find(function(m) { return m.id === modId; });
        if (!mod) return;

        if (confirm("Удалить мод '" + mod.name + "'? Это действие нельзя отменить.")) {
            ModManager.removeMod(modId);
            UIMods.showTab('browser');
        }
    }
};
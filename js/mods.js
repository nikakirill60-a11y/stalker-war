'use strict';

// Проверка что JSZip загружена
if (typeof JSZip === 'undefined') {
    console.error('JSZip не загружена! Проверьте подключение библиотеки.');
}

/**
 * СИСТЕМА МОДОВ S.T.A.L.K.E.R. v2.0
 * Поддержка RAR-архивов с изображениями
 */
var ModManager = {
    loadedMods: [],
    modData: {
        weapons: {},
        armor: {},
        factions: {},
        leaders: {},
        buildings: {},
        technologies: {},
        artifacts: {},
        focuses: {},
        images: {} // кэш изображений из модов
    },

    // ─── ИНИЦИАЛИЗАЦИЯ ───────────────────────────────
    init: function() {
        this.loadModsFromStorage();
        this.applyMods();
    },

    // ─── ЗАГРУЗКА RAR-АРХИВА ─────────────────────────
    loadModArchive: function(file, onSuccess, onError) {
        var self = this;
        
        // Проверяем JSZip
        if (typeof JSZip === 'undefined') {
            if (onError) onError("Библиотека JSZip не загружена");
            console.error("JSZip не определена!");
            return;
        }
        
        if (!file.name.endsWith('.rar') && !file.name.endsWith('.zip')) {
            if (onError) onError("Поддерживаются только .rar и .zip архивы");
            return;
        }

        var reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                JSZip.loadAsync(e.target.result).then(function(zip) {
                    var mod = {
                        id: null,
                        name: null,
                        version: null,
                        author: null,
                        description: null,
                        weapons: {},
                        armor: {},
                        factions: {},
                        leaders: {},
                        artifacts: {},
                        focuses: {},
                        images: {}
                    };

                    var promises = [];

                    // Ищем mod.json
                    var modJsonFile = zip.file("mod.json");
                    if (!modJsonFile) {
                        if (onError) onError("Файл mod.json не найден в архиве");
                        return;
                    }

                    // Читаем mod.json
                    promises.push(
                        modJsonFile.async("string").then(function(content) {
                            var modConfig = JSON.parse(content);
                            Object.assign(mod, modConfig);
                        })
                    );

                    // Загружаем все изображения
                    zip.forEach(function(relativePath, zipEntry) {
                        if (zipEntry.dir) return;
                        
                        // Изображения фракций
                        if (relativePath.startsWith('images/factions/')) {
                            var fileName = relativePath.split('/').pop();
                            var factionId = fileName.replace(/\.(png|jpg|jpeg|webp)$/, '');
                            
                            promises.push(
                                zipEntry.async("base64").then(function(data) {
                                    var ext = fileName.split('.').pop();
                                    mod.images['faction_' + factionId] = 'data:image/' + ext + ';base64,' + data;
                                })
                            );
                        }
                        
                        // Изображения лидеров
                        else if (relativePath.startsWith('images/leaders/')) {
                            var fileName = relativePath.split('/').pop();
                            var leaderId = fileName.replace(/\.(png|jpg|jpeg|webp)$/, '');
                            
                            promises.push(
                                zipEntry.async("base64").then(function(data) {
                                    var ext = fileName.split('.').pop();
                                    mod.images['leader_' + leaderId] = 'data:image/' + ext + ';base64,' + data;
                                })
                            );
                        }
                        
                        // Изображения оружия
                        else if (relativePath.startsWith('images/weapons/')) {
                            var fileName = relativePath.split('/').pop();
                            var weaponId = fileName.replace(/\.(png|jpg|jpeg|webp)$/, '');
                            
                            promises.push(
                                zipEntry.async("base64").then(function(data) {
                                    var ext = fileName.split('.').pop();
                                    mod.images['weapon_' + weaponId] = 'data:image/' + ext + ';base64,' + data;
                                })
                            );
                        }
                        
                        // Изображения брони
                        else if (relativePath.startsWith('images/armor/')) {
                            var fileName = relativePath.split('/').pop();
                            var armorId = fileName.replace(/\.(png|jpg|jpeg|webp)$/, '');
                            
                            promises.push(
                                zipEntry.async("base64").then(function(data) {
                                    var ext = fileName.split('.').pop();
                                    mod.images['armor_' + armorId] = 'data:image/' + ext + ';base64,' + data;
                                })
                            );
                        }
                        
                        // Изображения артефактов
                        else if (relativePath.startsWith('images/artifacts/')) {
                            var fileName = relativePath.split('/').pop();
                            var artifactId = fileName.replace(/\.(png|jpg|jpeg|webp)$/, '');
                            
                            promises.push(
                                zipEntry.async("base64").then(function(data) {
                                    var ext = fileName.split('.').pop();
                                    mod.images['artifact_' + artifactId] = 'data:image/' + ext + ';base64,' + data;
                                })
                            );
                        }
                    });

                    // Когда всё загружено
                    Promise.all(promises).then(function() {
                        if (self.validateMod(mod)) {
                            // Проверка дубликатов
                            var existing = self.loadedMods.find(function(m) { return m.id === mod.id; });
                            if (existing) {
                                if (onError) onError("Мод с ID '" + mod.id + "' уже загружен");
                                return;
                            }

                            self.loadedMods.push(mod);
                            self.saveModsToStorage();
                            self.applyMods();
                            
                            if (onSuccess) onSuccess(mod);
                            State.createAlert("МОД ЗАГРУЖЕН: " + mod.name.toUpperCase(), 8, "info");
                        } else {
                            if (onError) onError("Неверная структура мода");
                        }
                    }).catch(function(err) {
                        if (onError) onError("Ошибка обработки архива: " + err.message);
                        console.error("Promise.all error:", err);
                    });

                }).catch(function(err) {
                    if (onError) onError("Ошибка чтения архива: " + err.message);
                    console.error("JSZip.loadAsync error:", err);
                });
            } catch(e) {
                if (onError) onError("Ошибка при обработке файла: " + e.message);
                console.error("Exception:", e);
            }
        };

        reader.onerror = function() {
            if (onError) onError("Ошибка чтения файла");
        };

        reader.readAsArrayBuffer(file);
    },

    // ─── ВАЛИДАЦИЯ МОДА ──────────────────────────────
    validateMod: function(mod) {
        if (!mod.id || !mod.name || !mod.version || !mod.author) {
            console.error("Отсутствуют обязательные поля мода");
            return false;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(mod.id)) {
            console.error("ID мода содержит недопустимые символы");
            return false;
        }

        return true;
    },

    // ─── ПРИМЕНЕНИЕ ВСЕХ МОДОВ ───────────────────────
    applyMods: function() {
        // Сброс модифицированных данных
        this.modData = {
            weapons: {},
            armor: {},
            factions: {},
            leaders: {},
            buildings: {},
            technologies: {},
            artifacts: {},
            focuses: {},
            images: {}
        };

        var self = this;
        
        // Применяем каждый мод
        this.loadedMods.forEach(function(mod) {
            self.applyMod(mod);
        });

        // Объединяем с базовыми данными
        this.mergeWithBaseData();
    },

    // ─── ПРИМЕНЕНИЕ ОДНОГО МОДА ──────────────────────
    applyMod: function(mod) {
        var self = this;

        // Оружие
        if (mod.weapons) {
            Object.keys(mod.weapons).forEach(function(id) {
                self.modData.weapons[id] = mod.weapons[id];
            });
        }

        // Броня
        if (mod.armor) {
            Object.keys(mod.armor).forEach(function(id) {
                self.modData.armor[id] = mod.armor[id];
            });
        }

        // Фракции
        if (mod.factions) {
            Object.keys(mod.factions).forEach(function(id) {
                self.modData.factions[id] = mod.factions[id];
            });
        }

        // Лидеры
        if (mod.leaders) {
            Object.keys(mod.leaders).forEach(function(factionId) {
                if (!self.modData.leaders[factionId]) {
                    self.modData.leaders[factionId] = [];
                }
                self.modData.leaders[factionId] = self.modData.leaders[factionId].concat(mod.leaders[factionId]);
            });
        }

        // Артефакты
        if (mod.artifacts) {
            Object.keys(mod.artifacts).forEach(function(id) {
                self.modData.artifacts[id] = mod.artifacts[id];
            });
        }

        // Фокусы
        if (mod.focuses) {
            Object.keys(mod.focuses).forEach(function(factionId) {
                if (!self.modData.focuses[factionId]) {
                    self.modData.focuses[factionId] = [];
                }
                self.modData.focuses[factionId] = self.modData.focuses[factionId].concat(mod.focuses[factionId]);
            });
        }

        // Изображения
        if (mod.images) {
            Object.keys(mod.images).forEach(function(key) {
                self.modData.images[key] = mod.images[key];
            });
        }
    },

    // ─── ОБЪЕДИНЕНИЕ С БАЗОВЫМИ ДАННЫМИ ──────────────
    mergeWithBaseData: function() {
        var self = this;

        // Оружие
        Object.keys(this.modData.weapons).forEach(function(id) {
            Items.weapons[id] = self.modData.weapons[id];
        });

        // Броня
        Object.keys(this.modData.armor).forEach(function(id) {
            Items.armor[id] = self.modData.armor[id];
        });

        // Фракции
        Object.keys(this.modData.factions).forEach(function(id) {
            FACTIONS[id] = self.modData.factions[id];
        });

        // Лидеры
        Object.keys(this.modData.leaders).forEach(function(factionId) {
            if (!FACTION_LEADERS[factionId]) {
                FACTION_LEADERS[factionId] = [];
            }
            FACTION_LEADERS[factionId] = FACTION_LEADERS[factionId].concat(self.modData.leaders[factionId]);
        });

        // Артефакты
        Object.keys(this.modData.artifacts).forEach(function(id) {
            ARTIFACTS[id] = self.modData.artifacts[id];
        });

        // Фокусы
        Object.keys(this.modData.focuses).forEach(function(factionId) {
            if (!FACTION_FOCUSES[factionId]) {
                FACTION_FOCUSES[factionId] = [];
            }
            FACTION_FOCUSES[factionId] = FACTION_FOCUSES[factionId].concat(self.modData.focuses[factionId]);
        });

        // Изображения - добавляем в AssetManager
        Object.keys(this.modData.images).forEach(function(key) {
            var img = new Image();
            img.src = self.modData.images[key];
            
            // Парсим ключ: 'faction_my_faction' -> category='factions', id='my_faction'
            var parts = key.split('_');
            var category = parts[0] + 's'; // faction -> factions
            var id = parts.slice(1).join('_');
            
            var cacheKey = category + '/' + id;
            AssetManager._cache[cacheKey] = img;
        });

        this.updateTraderStocks();
    },

    // ─── ОБНОВЛЕНИЕ ТОРГОВЫХ АССОРТИМЕНТОВ ───────────
    updateTraderStocks: function() {
        Object.keys(this.modData.factions).forEach(function(factionId) {
            if (!Items.traderStock[factionId]) {
                Items.traderStock[factionId] = {
                    weapons: ['pm', 'pb1s', 'tos34', 'akm74_2u'],
                    armor: ['leather_jacket', 'stalker_suit', 'army_armor']
                };

                var modWeapons = Object.keys(ModManager.modData.weapons);
                var modArmor = Object.keys(ModManager.modData.armor);
                
                Items.traderStock[factionId].weapons = Items.traderStock[factionId].weapons.concat(modWeapons.slice(0, 3));
                Items.traderStock[factionId].armor = Items.traderStock[factionId].armor.concat(modArmor.slice(0, 3));
            }
        });
    },

    // ─── ПОЛУЧЕНИЕ ИЗОБРАЖЕНИЯ МОДА ──────────────────
    getModImage: function(category, id) {
        var key = category + '_' + id;
        if (this.modData.images[key]) {
            return this.modData.images[key];
        }
        return null;
    },

    // ─── СОХРАНЕНИЕ/ЗАГРУЗКА ──────────────────────────
    saveModsToStorage: function() {
        try {
            // Сохраняем метаданные + base64 изображения (они не такие уж большие)
            var modsToSave = this.loadedMods.map(function(mod) {
                return {
                    id: mod.id,
                    name: mod.name,
                    version: mod.version,
                    author: mod.author,
                    description: mod.description,
                    weapons: mod.weapons || {},
                    armor: mod.armor || {},
                    factions: mod.factions || {},
                    leaders: mod.leaders || {},
                    artifacts: mod.artifacts || {},
                    focuses: mod.focuses || {},
                    images: mod.images || {}
                };
            });
            
            localStorage.setItem('stalker_mods', JSON.stringify(modsToSave));
        } catch (error) {
            console.error("Не удалось сохранить моды:", error);
        }
    },

    loadModsFromStorage: function() {
        try {
            var saved = localStorage.getItem('stalker_mods');
            if (saved) {
                this.loadedMods = JSON.parse(saved);
            }
        } catch (error) {
            console.error("Не удалось загрузить моды:", error);
            this.loadedMods = [];
        }
    },

    // ─── УДАЛЕНИЕ МОДА ───────────────────────────────
    removeMod: function(modId) {
        this.loadedMods = this.loadedMods.filter(function(mod) {
            return mod.id !== modId;
        });
        this.saveModsToStorage();
        this.applyMods();
        
        State.createAlert("МОД УДАЛЁН: " + modId.toUpperCase(), 8, "info");
    },

    // ─── ЭКСПОРТ МОДА В ZIP ──────────────────────────
    exportMod: function(mod, callback) {
        // Проверяем JSZip
        if (typeof JSZip === 'undefined') {
            console.error("JSZip не загружена!");
            if (callback) callback(null);
            return;
        }
        
        try {
            var zip = new JSZip();
            
            // Создаём mod.json (без изображений для уменьшения размера)
            var modConfig = {
                id: mod.id,
                name: mod.name,
                version: mod.version,
                author: mod.author,
                description: mod.description,
                weapons: mod.weapons || {},
                armor: mod.armor || {},
                factions: mod.factions || {},
                leaders: mod.leaders || {},
                artifacts: mod.artifacts || {},
                focuses: mod.focuses || {}
            };
            zip.file("mod.json", JSON.stringify(modConfig, null, 2));
            
            // Создаём README
            var factionNames = Object.keys(mod.factions || {}).map(function(id) {
                return mod.factions[id].name;
            }).join(', ');
            
            var readme = "# " + mod.name + "\n\n" +
                         "**Версия:** " + mod.version + "\n" +
                         "**Автор:** " + mod.author + "\n\n" +
                         mod.description + "\n\n" +
                         "## Содержание\n" +
                         "- Фракции: " + (Object.keys(mod.factions || {}).length) + "\n" +
                         "- Лидеры: " + (Object.keys(mod.leaders || {}).reduce(function(sum, key) {
                             return sum + (mod.leaders[key] ? mod.leaders[key].length : 0);
                         }, 0)) + "\n" +
                         "- Оружие: " + (Object.keys(mod.weapons || {}).length) + "\n" +
                         "- Броня: " + (Object.keys(mod.armor || {}).length) + "\n" +
                         "- Артефакты: " + (Object.keys(mod.artifacts || {}).length) + "\n\n" +
                         "## Установка\n" +
                         "1. Откройте игру S.T.A.L.K.E.R. Tactical Zone Control\n" +
                         "2. Перейдите в раздел МОДЫ\n" +
                         "3. Нажмите 'Загрузить мод'\n" +
                         "4. Выберите этот архив\n";
            zip.file("README.md", readme);
            
            // Добавляем изображения
            if (mod.images) {
                Object.keys(mod.images).forEach(function(key) {
                    var parts = key.split('_');
                    var category = parts[0] + 's'; // faction -> factions
                    var id = parts.slice(1).join('_');
                    
                    // Конвертируем base64 в blob
                    if (mod.images[key] && mod.images[key].startsWith('data:image/')) {
                        var base64Data = mod.images[key].split(',')[1];
                        var ext = mod.images[key].split(';')[0].split('/')[1];
                        
                        if (base64Data) {
                            zip.file("images/" + category + "/" + id + "." + ext, base64Data, { base64: true });
                        }
                    }
                });
            }
            
            // Генерируем архив
            zip.generateAsync({ type: "blob", compression: "DEFLATE" }).then(function(content) {
                if (callback) callback(content);
            }).catch(function(err) {
                console.error("Ошибка генерации ZIP:", err);
                State.createAlert("ОШИБКА ЭКСПОРТА: " + err.message, 5, "war");
            });
        } catch(e) {
            console.error("Ошибка в exportMod:", e);
            State.createAlert("ОШИБКА: " + e.message, 5, "war");
        }
    },

    // ─── ГЕНЕРАЦИЯ ШАБЛОНА МОДА ───────────────────────
    generateModTemplate: function() {
        return {
            "id": "my_custom_mod",
            "name": "Мой Мод",
            "version": "1.0.0",
            "author": "Аноним",
            "description": "Описание мода",
            "weapons": {},
            "armor": {},
            "factions": {},
            "leaders": {},
            "artifacts": {},
            "focuses": {}
        };
    }
};
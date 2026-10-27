'use strict';

var AssetManager = {
    _cache: {},
    _ready: false,
    _totalAssets: 0,
    _loadedAssets: 0,

    manifest: {
        // ─── ЛОГОТИПЫ ФРАКЦИЙ (256×256) ───────
        factions: {
            loners:     "assets/factions/loners.png",
            duty:       "assets/factions/duty.png",
            freedom:    "assets/factions/freedom.png",
            bandits:    "assets/factions/bandits.png",
            clearnsky:  "assets/factions/clearnsky.png",
            monolith:   "assets/factions/monolith.png",
            mercs:      "assets/factions/mercs.png",
            military:   "assets/factions/military.png",
            scientists: "assets/factions/scientists.png",
            renegades:  "assets/factions/renegades.png",
            ozone:      "assets/factions/ozone.png",
        },

        // ─── ПОРТРЕТЫ ЛИДЕРОВ (165×108) ───────
        leaders: {
            valerian:   "assets/leaders/valerian.png",
            strelok:    "assets/leaders/strelok.png",
            beard:      "assets/leaders/beard.png",
            sidorovich: "assets/leaders/sidorovich.png",
            krylov:     "assets/leaders/krylov.png",
            voronin:    "assets/leaders/voronin.png",
            shulga:     "assets/leaders/shulga.png",
            volkodav:   "assets/leaders/volkodav.png",
            chekhov:    "assets/leaders/chekhov.png",
            lukash:     "assets/leaders/lukash.png",
            loki:       "assets/leaders/loki.png",
            yoga:       "assets/leaders/yoga.png",
            borov:      "assets/leaders/borov.png",
            sultan:     "assets/leaders/sultan.png",
            lebedev:    "assets/leaders/lebedev.png",
            charon:     "assets/leaders/charon.png",
            vagrant:    "assets/leaders/vagrant.png",
            jackal:     "assets/leaders/jackal.png",
            scar:       "assets/leaders/scar.png",
            khaletsky:  "assets/leaders/khaletsky.png",
            kuznetsov:  "assets/leaders/kuznetsov.png",
            kovalsky:   "assets/leaders/kovalsky.png",
            degtyarev:  "assets/leaders/degtyarev.png",
            sakharov:   "assets/leaders/sakharov.png",
            herman:     "assets/leaders/herman.png",
            ozersky:    "assets/leaders/ozersky.png",
            renegade_chief: "assets/leaders/renegade_chief.png",
            ozone_rep:  "assets/leaders/ozone_rep.png",
        },

        // ─── ИКОНКИ ЮНИТОВ/ЗДАНИЙ (128×128) 
        icons: {
            stalker:    "assets/icons/stalker.png",
            soldier:    "assets/icons/soldier.png",
            sniper:     "assets/icons/sniper.png",
            outpost:    "assets/icons/outpost.png",
            cache:      "assets/icons/cache.png",
            lab:        "assets/icons/lab.png",
            anomaly:    "assets/icons/anomaly.png",
            radiation:  "assets/icons/radiation.png",
        },

        // ─── ИКОНКИ ОРУЖИЯ (128×128) ──────────
        weapons: {
            // Пистолеты
            pm:         "assets/weapons/pm.png",
            pb1s:       "assets/weapons/pb1s.png",
            fora12:     "assets/weapons/fora12.png",
            hpss1m:     "assets/weapons/hpss1m.png",
            marta:      "assets/weapons/marta.png",
            walker:     "assets/weapons/walker.png",
            kora919:    "assets/weapons/kora919.png",
            sipt:       "assets/weapons/sipt.png",
            udp:        "assets/weapons/udp.png",
            blackhawk:  "assets/weapons/blackhawk.png",
            
            // Дробовики
            sawn_off:   "assets/weapons/sawn_off.png",
            tos34:      "assets/weapons/tos34.png",
            chaser13:   "assets/weapons/chaser13.png",
            spas14:     "assets/weapons/spas14.png",
            protecta:   "assets/weapons/protecta.png",
            
            // Автоматы
            viper:      "assets/weapons/viper.png",
            akm74_2u:   "assets/weapons/akm74_2u.png",
            akm74_2:    "assets/weapons/akm74_2.png",
            obokan:     "assets/weapons/obokan.png",
            thunder:    "assets/weapons/thunder.png",
            avalanche:  "assets/weapons/avalanche.png",
            il86:       "assets/weapons/il86.png",
            trs301:     "assets/weapons/trs301.png",
            sgi5k:      "assets/weapons/sgi5k.png",
            
            // Спецоружие
            gp37:       "assets/weapons/gp37.png",
            ft200m:     "assets/weapons/ft200m.png",
            rp74:       "assets/weapons/rp74.png",
            
            // Снайперские
            vintar:     "assets/weapons/vintar.png",
            svu:        "assets/weapons/svu.png",
            svd:        "assets/weapons/svd.png",
            gauss:      "assets/weapons/gauss.png",
            
            // Тяжёлое
            bulldog:    "assets/weapons/bulldog.png",
            rpg7u:      "assets/weapons/rpg7u.png",
        },

        // ─── ИКОНКИ БРОНИ (128×128) ───────────
        armor: {
            // Лёгкая
            leather_jacket:     "assets/armor/leather_jacket.png",
            bandit_jacket:      "assets/armor/bandit_jacket.png",
            merc_suit:          "assets/armor/merc_suit.png",
            
            // Средняя
            stalker_suit:       "assets/armor/stalker_suit.png",
            psz9d:              "assets/armor/psz9d.png",
            wind_freedom:       "assets/armor/wind_freedom.png",
            guardian_freedom:   "assets/armor/guardian_freedom.png",
            monolith_suit:      "assets/armor/monolith_suit.png",
            
            // Научная
            ssp99:              "assets/armor/ssp99.png",
            ssp99m:             "assets/armor/ssp99m.png",
            seva:               "assets/armor/seva.png",
            
            // Тяжёлая
            psz9md:             "assets/armor/psz9md.png",
            beril5m:            "assets/armor/beril5m.png",
            army_armor:         "assets/armor/army_armor.png",
            
            // Экзоскелеты
            exoskeleton:        "assets/armor/exoskeleton.png",
            exo_pnb4uz:         "assets/armor/exo_pnb4uz.png",
            freedom_exo:        "assets/armor/freedom_exo.png",
            
            // Уникальная
            anomalous_jacket:   "assets/armor/anomalous_jacket.png",
            chainmail:          "assets/armor/chainmail.png",
            reinforced_suit:    "assets/armor/reinforced_suit.png",
            tourist_suit:       "assets/armor/tourist_suit.png",
            ghost_suit:         "assets/armor/ghost_suit.png",
            hunting_psz:        "assets/armor/hunting_psz.png",
            freedom_m2:         "assets/armor/freedom_m2.png",
            healing_beril:      "assets/armor/healing_beril.png",
            dawn_suit:          "assets/armor/dawn_suit.png",
            vest_cn1:           "assets/armor/vest_cn1.png",
            ps5m:               "assets/armor/ps5m.png",
            vest_cn3a:          "assets/armor/vest_cn3a.png",
            bulat:              "assets/armor/bulat.png",
            leather_coat:       "assets/armor/leather_coat.png",
        },

        // ─── АРТЕФАКТЫ (128×128) ──────────────────
        artifacts: {
            // Электрические
            flash:          "assets/art/flash.png",
            moonlight:      "assets/art/moonlight.png",
            sparkler:       "assets/art/sparkler.png",
            battery:        "assets/art/battery.png",
            
            // Химические
            stoneblood:     "assets/art/stoneblood.png",
            meatpiece:      "assets/art/meatpiece.png",
            soul:           "assets/art/soul.png",
            
            // Гравитационные
            slime:          "assets/art/slime.png",
            slug:           "assets/art/slug.png",
            mica:           "assets/art/mica.png",
            gravi:          "assets/art/gravi.png",
            goldfish:       "assets/art/goldfish.png",
            twist:          "assets/art/twist.png",
            
            // Термальные
            jellyfish:      "assets/art/jellyfish.png",
            stoneflower:    "assets/art/stoneflower.png",
            nightstar:      "assets/art/nightstar.png",
            fireball:       "assets/art/fireball.png",
            crystal:        "assets/art/crystal.png",
            drops:          "assets/art/drops.png",
            
            // Защитные
            kolobok:        "assets/art/kolobok.png",
            thorn:          "assets/art/thorn.png",
            crystalthorn:   "assets/art/crystalthorn.png",
            urchin:         "assets/art/urchin.png",
            
            // Редкие
            mammasbeads:    "assets/art/mammasbeads.png",
            dummy:          "assets/art/dummy.png",
            pellicle:       "assets/art/pellicle.png",
            spring:         "assets/art/spring.png",
        },

        // ─── UI ЭЛЕМЕНТЫ ──────────────────────
        ui: {
            logo:       "assets/ui/logo.png",
            background: "assets/ui/background.jpg",
            loading:    "assets/ui/loading.jpg",
        },
    },

    // Остальные методы без изменений...
    init: function(onComplete, onProgress) {
        var self = this;
        var allPaths = [];

        Object.keys(this.manifest).forEach(function(category) {
            Object.keys(self.manifest[category]).forEach(function(key) {
                allPaths.push({
                    category: category,
                    key: key,
                    path: self.manifest[category][key]
                });
            });
        });

        this._totalAssets  = allPaths.length;
        this._loadedAssets = 0;

        if (allPaths.length === 0) {
            this._ready = true;
            if (onComplete) onComplete();
            return;
        }

        allPaths.forEach(function(asset) {
            var img = new Image();
            
            img.onload = function() {
                self._cache[asset.category + "/" + asset.key] = img;
                self._loadedAssets++;
                
                if (onProgress) {
                    onProgress(self._loadedAssets, self._totalAssets);
                }

                if (self._loadedAssets >= self._totalAssets) {
                    self._ready = true;
                    if (onComplete) onComplete();
                }
            };

            img.onerror = function() {
                console.warn("⚠ Не удалось загрузить: " + asset.path);
                self._cache[asset.category + "/" + asset.key] = self._createPlaceholder(asset.key);
                self._loadedAssets++;
                
                if (onProgress) {
                    onProgress(self._loadedAssets, self._totalAssets);
                }

                if (self._loadedAssets >= self._totalAssets) {
                    self._ready = true;
                    if (onComplete) onComplete();
                }
            };

            img.src = asset.path;
        });
    },

    _createPlaceholder: function(name) {
        var canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        var ctx = canvas.getContext('2d');
        
        var gradient = ctx.createLinearGradient(0, 0, 0, 128);
        gradient.addColorStop(0, '#2a3a2a');
        gradient.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 124, 124);
        
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.toUpperCase(), 64, 64);
        
        var img = new Image();
        img.src = canvas.toDataURL();
        return img;
    },

    get: function(category, key) {
        var cacheKey = category + "/" + key;
        return this._cache[cacheKey] || null;
    },

    isReady: function() {
        return this._ready;
    },

    getProgress: function() {
        if (this._totalAssets === 0) return 100;
        return Math.floor((this._loadedAssets / this._totalAssets) * 100);
    },
};

// ═══════════════════════════════════════════════════════════
//  ГЕНЕРАТОР ЗАГЛУШЕК ДЛЯ ВСЕХ ПРЕДМЕТОВ
// ═══════════════════════════════════════════════════════════

function generateItemIcon(text, color, filename) {
    var canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');
    
    // Градиентный фон
    var gradient = ctx.createRadialGradient(64, 64, 20, 64, 64, 80);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    
    // Рамка
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, 122, 122);
    
    // Текст
    ctx.fillStyle = '#c8c8a0';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Разбиваем длинный текст на строки
    var words = text.split(' ');
    if (words.length > 1) {
        ctx.fillText(words[0], 64, 54);
        ctx.fillText(words.slice(1).join(' '), 64, 74);
    } else {
        ctx.fillText(text, 64, 64);
    }
    
    // Декоративные углы
    ctx.strokeStyle = '#c8a84b';
    ctx.lineWidth = 2;
    [[15,15,25,15,15,25], [113,15,103,15,113,25], [15,113,25,113,15,103], [113,113,103,113,113,103]].forEach(function(pts) {
        ctx.beginPath();
        ctx.moveTo(pts[0], pts[1]); ctx.lineTo(pts[2], pts[3]);
        ctx.moveTo(pts[0], pts[1]); ctx.lineTo(pts[4], pts[5]);
        ctx.stroke();
    });
    
    // Скачать
    canvas.toBlob(function(blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
    });
}

function generateAllWeaponIcons() {
    var weapons = [
        // Пистолеты (жёлто-оранжевые)
        { text: 'ПМ', color: '#f59e0b', file: 'pm.png' },
        { text: 'ПБ-1с', color: '#ea580c', file: 'pb1s.png' },
        { text: 'ФОРА-12', color: '#fb923c', file: 'fora12.png' },
        { text: 'ХПСС-1м', color: '#fdba74', file: 'hpss1m.png' },
        { text: 'МАРТА', color: '#f97316', file: 'marta.png' },
        { text: 'ВОЛКЕР', color: '#fb923c', file: 'walker.png' },
        { text: 'КОРА-919', color: '#ea580c', file: 'kora919.png' },
        { text: 'СИП-т', color: '#f59e0b', file: 'sipt.png' },
        { text: 'УДП', color: '#fb923c', file: 'udp.png' },
        { text: 'ЯСТРЕБ', color: '#000000', file: 'blackhawk.png' },
        
        // Дробовики (тёмно-красные)
        { text: 'ОБРЕЗ', color: '#7c2d12', file: 'sawn_off.png' },
        { text: 'ТОС-34', color: '#991b1b', file: 'tos34.png' },
        { text: 'ЧЕЙЗЕР', color: '#b91c1c', file: 'chaser13.png' },
        { text: 'СПСА-14', color: '#dc2626', file: 'spas14.png' },
        { text: 'ОТБОЙНИК', color: '#ef4444', file: 'protecta.png' },
        
        // Автоматы (красные)
        { text: 'ГАДЮКА', color: '#16a34a', file: 'viper.png' },
        { text: 'АКМ-74У', color: '#dc2626', file: 'akm74_2u.png' },
        { text: 'АКМ-74', color: '#ef4444', file: 'akm74_2.png' },
        { text: 'ОБОКАН', color: '#f87171', file: 'obokan.png' },
        { text: 'ГРОМ', color: '#fca5a5', file: 'thunder.png' },
        { text: 'ЛАВИНА', color: '#dc2626', file: 'avalanche.png' },
        { text: 'ИЛ86', color: '#b91c1c', file: 'il86.png' },
        { text: 'ТРс-301', color: '#991b1b', file: 'trs301.png' },
        { text: 'СГИ-5к', color: '#7f1d1d', file: 'sgi5k.png' },
        
        // Спецоружие (фиолетово-оранжевые)
        { text: 'ГП37', color: '#c2410c', file: 'gp37.png' },
        { text: 'ФТ-200М', color: '#ea580c', file: 'ft200m.png' },
        { text: 'РП-74', color: '#f97316', file: 'rp74.png' },
        
        // Снайперские (тёмно-синие)
        { text: 'ВИНТАРЬ', color: '#1e3a8a', file: 'vintar.png' },
        { text: 'СВУ', color: '#1e40af', file: 'svu.png' },
        { text: 'СВД', color: '#2563eb', file: 'svd.png' },
        { text: 'ГАУСС', color: '#7c3aed', file: 'gauss.png' },
        
        // Тяжёлое (тёмно-коричневые)
        { text: 'БУЛЬДОГ', color: '#78350f', file: 'bulldog.png' },
        { text: 'РПГ-7у', color: '#92400e', file: 'rpg7u.png' },
    ];
    
    var index = 0;
    var interval = setInterval(function() {
        if (index >= weapons.length) {
            clearInterval(interval);
            console.log('✅ Все иконки оружия сгенерированы!');
            return;
        }
        
        var w = weapons[index];
        generateItemIcon(w.text, w.color, w.file);
        console.log('✓ Создана: ' + w.file);
        index++;
    }, 500);
}

function generateAllArmorIcons() {
    var armor = [
        // Лёгкая (коричневые)
        { text: 'КОЖАНКА', color: '#78716c', file: 'leather_jacket.png' },
        { text: 'БАНДИТ', color: '#57534e', file: 'bandit_jacket.png' },
        { text: 'НАЁМНИК', color: '#ea580c', file: 'merc_suit.png' },
        
        // Средняя (зелёно-синие)
        { text: 'СТАЛКЕР', color: '#d97706', file: 'stalker_suit.png' },
        { text: 'ДОЛГ', color: '#b91c1c', file: 'psz9d.png' },
        { text: 'ВЕТЕР', color: '#16a34a', file: 'wind_freedom.png' },
        { text: 'СТРАЖ', color: '#059669', file: 'guardian_freedom.png' },
        { text: 'МОНОЛИТ', color: '#7c3aed', file: 'monolith_suit.png' },
        
        // Научная (голубые)
        { text: 'ЭКОЛОГ', color: '#0891b2', file: 'ssp99.png' },
        { text: 'ССП-99М', color: '#06b6d4', file: 'ssp99m.png' },
        { text: 'СЕВА', color: '#0ea5e9', file: 'seva.png' },
        
        // Тяжёлая (тёмно-синие)
        { text: 'ПСЗ-9Мд', color: '#1e40af', file: 'psz9md.png' },
        { text: 'БЕРИЛЛ', color: '#2563eb', file: 'beril5m.png' },
        { text: 'АРМИЯ', color: '#65a30d', file: 'army_armor.png' },
        
        // Экзоскелеты (фиолетовые)
        { text: 'ЭКЗО', color: '#7c3aed', file: 'exoskeleton.png' },
        { text: 'ПНБ-4УЗ', color: '#6d28d9', file: 'exo_pnb4uz.png' },
        { text: 'ЭКЗО СВОБОДА', color: '#5b21b6', file: 'freedom_exo.png' },
        
        // Уникальная (разные цвета)
        { text: 'АНОМАЛЬНАЯ', color: '#a855f7', file: 'anomalous_jacket.png' },
        { text: 'КОЛЬЧУГА', color: '#71717a', file: 'chainmail.png' },
        { text: 'УКРЕПЛЁННЫЙ', color: '#0891b2', file: 'reinforced_suit.png' },
        { text: 'ТУРИСТ', color: '#84cc16', file: 'tourist_suit.png' },
        { text: 'ПРИЗРАК', color: '#000000', file: 'ghost_suit.png' },
        { text: 'ОХОТНИК', color: '#92400e', file: 'hunting_psz.png' },
        { text: 'СВОБОДА М2', color: '#22c55e', file: 'freedom_m2.png' },
        { text: 'БЕРИЛЛ ЛЕЧЕБНЫЙ', color: '#10b981', file: 'healing_beril.png' },
        { text: 'ЗАРЯ', color: '#f59e0b', file: 'dawn_suit.png' },
        { text: 'ЧН-1', color: '#475569', file: 'vest_cn1.png' },
        { text: 'ПС5-М', color: '#1e40af', file: 'ps5m.png' },
        { text: 'ЧН-3а', color: '#64748b', file: 'vest_cn3a.png' },
        { text: 'БУЛАТ', color: '#1e3a8a', file: 'bulat.png' },
        { text: 'ПЛАЩ', color: '#292524', file: 'leather_coat.png' },
    ];
    
    var index = 0;
    var interval = setInterval(function() {
        if (index >= armor.length) {
            clearInterval(interval);
            console.log('✅ Все иконки брони сгенерированы!');
            return;
        }
        
        var a = armor[index];
        generateItemIcon(a.text, a.color, a.file);
        console.log('✓ Создана: ' + a.file);
        index++;
    }, 500);
}
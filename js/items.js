'use strict';

// ═══════════════════════════════════════════════════════════
//  СИСТЕМА ПРЕДМЕТОВ
// ═══════════════════════════════════════════════════════════

var Items = {
    // ─── ОРУЖИЕ ───────────────────────────────────────────
    weapons: {
        // Пистолеты
        pm: {
            name: "ПМ",
            type: "pistol",
            damage: 15,
            price: 2500,
            icon: "pm",
            description: "Пистолет Макарова. Надёжен как автомат Калашникова."
        },
        pb1s: {
            name: "ПБ-1с",
            type: "pistol", 
            damage: 18,
            price: 4500,
            icon: "pb1s",
            description: "Бесшумный пистолет. Любимец диверсантов."
        },
        fora12: {
            name: "Фора-12Мк2",
            type: "pistol",
            damage: 25,
            price: 8500,
            icon: "fora12",
            description: "Спортивный пистолет высокой точности."
        },
        hpss1m: {
            name: "ХПСС-1м",
            type: "pistol",
            damage: 22,
            price: 6800,
            icon: "hpss1m",
            description: "Специальный пистолет для скрытного ношения."
        },
        marta: {
            name: "Марта",
            type: "pistol",
            damage: 28,
            price: 12000,
            icon: "marta",
            description: "Тяжёлый пистолет. Останавливающее действие."
        },
        walker: {
            name: "Волкер-П9м",
            type: "pistol",
            damage: 20,
            price: 5500,
            icon: "walker",
            description: "Современный пистолет с полимерной рамой."
        },
        kora919: {
            name: "Кора-919",
            type: "pistol",
            damage: 24,
            price: 7200,
            icon: "kora919",
            description: "Компактный пистолет повышенной мощности."
        },
        sipt: {
            name: "СИП-т М200",
            type: "pistol",
            damage: 30,
            price: 15000,
            icon: "sipt",
            description: "Тактический пистолет спецназа."
        },
        udp: {
            name: "УДП «Компакт»",
            type: "pistol",
            damage: 26,
            price: 9500,
            icon: "udp",
            description: "Ударно-дробящий пистолет."
        },
        blackhawk: {
            name: "Чёрный ястреб",
            type: "pistol",
            damage: 35,
            price: 22000,
            icon: "blackhawk",
            description: "Элитный пистолет наёмников."
        },

        // Дробовики
        sawn_off: {
            name: "Обрез",
            type: "shotgun",
            damage: 65,
            price: 8000,
            icon: "sawn_off",
            description: "Обрез двустволки. Смертоносен в ближнем бою."
        },
        tos34: {
            name: "ТОС-34",
            type: "shotgun", 
            damage: 55,
            price: 12000,
            icon: "tos34",
            description: "Охотничье ружьё. Проверено временем."
        },
        chaser13: {
            name: "Чейзер-13",
            type: "shotgun",
            damage: 70,
            price: 18000,
            icon: "chaser13",
            description: "Полуавтоматический дробовик."
        },
        spas14: {
            name: "СПСА-14",
            type: "shotgun",
            damage: 75,
            price: 25000,
            icon: "spas14",
            description: "Боевой дробовик спецназа."
        },
        protecta: {
            name: "Отбойник",
            type: "shotgun", 
            damage: 80,
            price: 35000,
            icon: "protecta",
            description: "Барабанный дробовик. Огневая мощь."
        },

        // Автоматы
        viper: {
            name: "Гадюка-5",
            type: "rifle",
            damage: 45,
            price: 28000,
            icon: "viper",
            description: "Компактный автомат. Высокая скорострельность."
        },
        akm74_2u: {
            name: "АКМ-74/2У",
            type: "rifle",
            damage: 50,
            price: 32000,
            icon: "akm74_2u",
            description: "Укороченная версия легендарного автомата."
        },
        akm74_2: {
            name: "АКМ-74/2",
            type: "rifle",
            damage: 55,
            price: 38000,
            icon: "akm74_2",
            description: "Модернизированный Калашников."
        },
        obokan: {
            name: "АС-96/2 «Обокан»",
            type: "rifle",
            damage: 60,
            price: 45000,
            icon: "obokan",
            description: "Штурмовая винтовка нового поколения."
        },
        thunder: {
            name: "Гром-С14",
            type: "rifle",
            damage: 65,
            price: 55000,
            icon: "thunder",
            description: "Мощная штурмовая винтовка."
        },
        avalanche: {
            name: "СА «ЛАВИНА»",
            type: "rifle",
            damage: 70,
            price: 65000,
            icon: "avalanche",
            description: "Спецавтомат высокой мощности."
        },
        il86: {
            name: "ИЛ86",
            type: "rifle",
            damage: 58,
            price: 42000,
            icon: "il86",
            description: "Снайперская винтовка под автоматный патрон."
        },
        trs301: {
            name: "ТРс-301",
            type: "rifle",
            damage: 62,
            price: 48000,
            icon: "trs301",
            description: "Тактическая винтовка спецподразделений."
        },
        sgi5k: {
            name: "СГИ-5к",
            type: "rifle",
            damage: 75,
            price: 70000,
            icon: "sgi5k",
            description: "Элитная штурмовая винтовка."
        },

        // Спецоружие  
        gp37: {
            name: "ГП37",
            type: "special",
            damage: 90,
            price: 85000,
            icon: "gp37",
            description: "Гранатомёт. Разрушительная сила."
        },
        ft200m: {
            name: "ФТ-200М",
            type: "special",
            damage: 100,
            price: 120000,
            icon: "ft200m",
            description: "Огнемёт. Очищает от всего живого."
        },
        rp74: {
            name: "РП-74",
            type: "special",
            damage: 85,
            price: 95000,
            icon: "rp74",
            description: "Подствольный гранатомёт."
        },

        // Снайперские
        vintar: {
            name: "Винтарь-ВС",
            type: "sniper",
            damage: 95,
            price: 110000,
            icon: "vintar",
            description: "Бесшумная снайперская винтовка."
        },
        svu: {
            name: "СВУмк-2",
            type: "sniper", 
            damage: 105,
            price: 135000,
            icon: "svu",
            description: "Снайперская винтовка укороченная."
        },
        svd: {
            name: "СВДм-2",
            type: "sniper",
            damage: 115,
            price: 155000,
            icon: "svd",
            description: "Легендарная снайперская винтовка Драгунова."
        },
        gauss: {
            name: "Гаусс-пушка",
            type: "sniper",
            damage: 200,
            price: 500000,
            icon: "gauss",
            description: "Экспериментальная рельсотрон-винтовка."
        },

        // Тяжёлое
        bulldog: {
            name: "Бульдог-6",
            type: "heavy",
            damage: 120,
            price: 180000,
            icon: "bulldog",
            description: "Тяжёлый пулемёт. Подавляющий огонь."
        },
        rpg7u: {
            name: "РПГ-7у",
            type: "heavy",
            damage: 250,
            price: 300000,
            icon: "rpg7u",
            description: "Ручной противотанковый гранатомёт."
        },
    },

    // ─── БРОНЯ ────────────────────────────────────────────
    armor: {
        // Лёгкая защита
        leather_jacket: {
            name: "Кожаная куртка",
            type: "light",
            protection: 5,
            price: 1500,
            icon: "leather_jacket",
            description: "Обычная кожаная куртка. Защита от собак и когтей."
        },
        bandit_jacket: {
            name: "Бандитская куртка", 
            type: "light",
            protection: 8,
            price: 3500,
            icon: "bandit_jacket",
            description: "Укреплённая кожанка с металлическими вставками."
        },
        merc_suit: {
            name: "Комбинезон наёмника",
            type: "light",
            protection: 12,
            price: 8500,
            icon: "merc_suit",
            description: "Лёгкий тактический костюм наёмников."
        },
        stalker_suit: {
            name: "Комбинезон сталкера",
            type: "medium",
            protection: 15,
            price: 12000,
            icon: "stalker_suit",
            description: "Стандартная защита вольных сталкеров."
        },
        psz9d: {
            name: "ПСЗ-9д «Броня Долга»",
            type: "medium", 
            protection: 25,
            price: 25000,
            icon: "psz9d",
            description: "Тяжёлая броня группировки «Долг»."
        },
        wind_freedom: {
            name: "Комбинезон «Ветер свободы»",
            type: "medium",
            protection: 18,
            price: 15000,
            icon: "wind_freedom",
            description: "Лёгкий костюм бойцов «Свободы»."
        },
        guardian_freedom: {
            name: "Комбинезон «Страж свободы»",
            type: "medium", 
            protection: 22,
            price: 22000,
            icon: "guardian_freedom",
            description: "Усиленная защита ветеранов «Свободы»."
        },
        monolith_suit: {
            name: "Комбинезон «Монолита»",
            type: "medium",
            protection: 28,
            price: 35000,
            icon: "monolith_suit",
            description: "Мистическая броня фанатиков «Монолита»."
        },
        ssp99: {
            name: "ССП-99 «Эколог»",
            type: "scientific",
            protection: 10,
            price: 18000,
            icon: "ssp99",
            description: "Научный костюм повышенной защиты от аномалий."
        },
        ssp99m: {
            name: "Комбинезон ССП-99М",
            type: "scientific",
            protection: 15,
            price: 25000,
            icon: "ssp99m",
            description: "Улучшенный научный костюм."
        },
        psz9md: {
            name: "ПСЗ-9Мд «Универсальная защита»",
            type: "heavy",
            protection: 35,
            price: 45000,
            icon: "psz9md",
            description: "Тяжёлая универсальная броня."
        },
        seva: {
            name: "Комбинезон «СЕВА»",
            type: "scientific",
            protection: 20,
            price: 55000,
            icon: "seva",
            description: "Костюм химической защиты высшего класса."
        },
        beril5m: {
            name: "Бронекостюм «Берилл-5М»",
            type: "heavy",
            protection: 40,
            price: 65000,
            icon: "beril5m",
            description: "Военный бронекостюм нового поколения."
        },
        army_armor: {
            name: "Армейский бронекостюм",
            type: "heavy",
            protection: 30,
            price: 38000,
            icon: "army_armor",
            description: "Стандартная броня военных сил."
        },
        exoskeleton: {
            name: "Экзоскелет", 
            type: "exo",
            protection: 60,
            price: 150000,
            icon: "exoskeleton",
            description: "Силовая броня. Максимальная защита."
        },

        // Уникальная броня
        anomalous_jacket: {
            name: "Аномальная кожанка",
            type: "unique",
            protection: 15,
            price: 35000,
            icon: "anomalous_jacket",
            description: "Кожанка, пропитанная аномальной энергией."
        },
        chainmail: {
            name: "Кольчужная куртка",
            type: "unique",
            protection: 20,
            price: 28000,
            icon: "chainmail",
            description: "Средневековая защита в современном мире."
        },
        reinforced_suit: {
            name: "Укреплённый комбез",
            type: "medium",
            protection: 24,
            price: 32000,
            icon: "reinforced_suit",
            description: "Усиленный комбинезон самодельными пластинами."
        },
        tourist_suit: {
            name: "Комбинезон туриста",
            type: "light",
            protection: 12,
            price: 8000,
            icon: "tourist_suit",
            description: "Походная одежда с базовой защитой."
        },
        ghost_suit: {
            name: "Комбинезон Призрака",
            type: "unique",
            protection: 32,
            price: 85000,
            icon: "ghost_suit",
            description: "Легендарная броня невидимки."
        },
        hunting_psz: {
            name: "Охотничий ПСЗ-9д",
            type: "medium",
            protection: 26,
            price: 28000,
            icon: "hunting_psz",
            description: "Броня для охоты на мутантов."
        },
        freedom_m2: {
            name: "Комбез «Свободы» М2",
            type: "medium",
            protection: 24,
            price: 26000,
            icon: "freedom_m2",
            description: "Обновлённая броня бойцов Свободы."
        },
        healing_beril: {
            name: "Лечебный «Берилл»",
            type: "unique",
            protection: 38,
            price: 120000,
            icon: "healing_beril",
            description: "Броня с медицинскими нано-системами."
        },
        exo_pnb4uz: {
            name: "Экзоскелет ПНБ-4УЗ",
            type: "exo",
            protection: 75,
            price: 250000,
            icon: "exo_pnb4uz",
            description: "Экзоскелет нового поколения."
        },
        dawn_suit: {
            name: "Комбинезон «Заря»",
            type: "unique", 
            protection: 45,
            price: 95000,
            icon: "dawn_suit",
            description: "Экспериментальный костюм учёных."
        },
        vest_cn1: {
            name: "Бронежилет ЧН-1",
            type: "light",
            protection: 18,
            price: 15000,
            icon: "vest_cn1",
            description: "Лёгкий тактический бронежилет."
        },
        ps5m: {
            name: "ПС5-М «Универсальная защита»",
            type: "heavy",
            protection: 42,
            price: 58000,
            icon: "ps5m",
            description: "Универсальная тяжёлая броня."
        },
        vest_cn3a: {
            name: "Бронежилет ЧН-3а",
            type: "medium",
            protection: 22,
            price: 22000,
            icon: "vest_cn3a",
            description: "Средний бронежилет спецназа."
        },
        bulat: {
            name: "Бронекостюм «Булат»",
            type: "heavy",
            protection: 50,
            price: 85000,
            icon: "bulat",
            description: "Тяжёлая боевая броня элитных войск."
        },
        freedom_exo: {
            name: "Экзоскелет «Свобода»",
            type: "exo",
            protection: 65,
            price: 180000,
            icon: "freedom_exo",
            description: "Модифицированный экзоскелет анархистов."
        },
        leather_coat: {
            name: "Кожаный плащ",
            type: "light",
            protection: 6,
            price: 2500,
            icon: "leather_coat",
            description: "Длинный кожаный плащ. Стиль важнее защиты."
        },
    },

    // ─── ТОРГОВЫЕ АССОРТИМЕНТЫ ПО ФРАКЦИЯМ ──────────────────
    traderStock: {
        loners: {
            weapons: ['pm', 'pb1s', 'tos34', 'sawn_off', 'akm74_2u', 'viper', 'vintar'],
            armor: ['leather_jacket', 'stalker_suit', 'tourist_suit', 'dawn_suit', 'exoskeleton']
        },
        duty: {
            weapons: ['pm', 'fora12', 'marta', 'chaser13', 'akm74_2', 'obokan', 'thunder', 'svu', 'bulldog'],
            armor: ['stalker_suit', 'psz9d', 'army_armor', 'beril5m', 'ps5m', 'exoskeleton']
        },
        freedom: {
            weapons: ['walker', 'hpss1m', 'spas14', 'viper', 'akm74_2u', 'avalanche', 'trs301', 'svd'],
            armor: ['stalker_suit', 'wind_freedom', 'guardian_freedom', 'freedom_m2', 'vest_cn3a', 'freedom_exo']
        },
        bandits: {
            weapons: ['pm', 'sawn_off', 'chaser13', 'viper', 'akm74_2u', 'obokan'],
            armor: ['leather_jacket', 'bandit_jacket', 'chainmail', 'reinforced_suit', 'anomalous_jacket']
        },
        clearnsky: {
            weapons: ['pb1s', 'fora12', 'tos34', 'akm74_2', 'il86', 'trs301', 'vintar', 'svu'],
            armor: ['stalker_suit', 'ssp99', 'ssp99m', 'seva', 'dawn_suit', 'healing_beril']
        },
        monolith: {
            weapons: ['marta', 'kora919', 'spas14', 'protecta', 'thunder', 'avalanche', 'sgi5k', 'gauss'],
            armor: ['monolith_suit', 'psz9md', 'bulat', 'exo_pnb4uz', 'ghost_suit']
        },
        mercs: {
            weapons: ['blackhawk', 'sipt', 'udp', 'spas14', 'obokan', 'sgi5k', 'bulldog', 'rpg7u'],
            armor: ['merc_suit', 'beril5m', 'bulat', 'exoskeleton', 'ps5m']
        },
        military: {
            weapons: ['pm', 'marta', 'chaser13', 'akm74_2', 'thunder', 'gp37', 'ft200m', 'rp74', 'bulldog'],
            armor: ['army_armor', 'beril5m', 'psz9md', 'bulat', 'exoskeleton']
        },
        scientists: {
            weapons: ['pb1s', 'fora12', 'walker', 'il86', 'vintar'],
            armor: ['ssp99', 'ssp99m', 'seva', 'dawn_suit', 'healing_beril']
        },
        renegades: {
            weapons: ['pm', 'sawn_off', 'viper', 'akm74_2u'],
            armor: ['leather_jacket', 'bandit_jacket', 'stalker_suit']
        },
        ozone: {
            weapons: ['sipt', 'kora919', 'avalanche', 'sgi5k', 'gauss', 'rpg7u'],
            armor: ['ghost_suit', 'exo_pnb4uz', 'dawn_suit', 'healing_beril']
        }
    },

    // ─── ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ─────────────────────────────
    getWeapon: function(id) {
        return this.weapons[id] || this.weapons.pm;
    },

    getArmor: function(id) { 
        return this.armor[id] || this.armor.leather_jacket;
    },

    getTraderStock: function(factionId) {
        return this.traderStock[factionId] || this.traderStock.loners;
    },
};
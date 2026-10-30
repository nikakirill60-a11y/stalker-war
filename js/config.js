'use strict';

// ═══════════════════════════════════════════════
//  КОНСТАНТЫ
// ═══════════════════════════════════════════════
const CELL_SIZE          = 18;
const RESEARCH_DAYS      = 90;
const CONSTRUCTION_DAYS  = 120;
const FOCUS_DAYS         = 60;
const UNIT_MOVE_EVERY    = 2;
const COMBAT_TICK_DAYS   = 2;
const REGEN_PER_TICK     = 3;
const PORT_RANGE         = 6;
const AMPHIBIOUS_DAYS    = 25;
const MAX_AI_ARMY_SIZE   = 10; // Лимит армии ИИ

// ─── УСЛОВИЯ ЗАВЕРШЕНИЯ ПАРТИИ ───────────────────
const WIN_CONTROL_PERCENT = 30;   // % Зоны для победы по контролю   // % Зоны для победы по контролю
const LAST_STAND_DAYS     = 10;  // дней неприкосновенности после «последнего шанса»

// ─── ЭКОНОМИКА ───────────────────────────────────
const RUBLES_PER_SECTOR   = 12;  // доход с сектора в день
const RUBLES_PER_CACHE    = 25;  // доход со схрона в день
const RUBLES_PER_UNIT     = 3;   // содержание отряда в день
const ARMY_BASE_LIMIT     = 10;  // лимит отрядов без схронов
const ARMY_PER_CACHE      = 3;   // +3 к лимиту за каждый схрон
const SELL_RATE           = 0.6; // доля цены при продаже предмета

// ─── ОПАСНОСТЬ ЗОНЫ ──────────────────────────────
const RADIATION_THRESHOLD = 60;  // с этого уровня фона юниты получают урон
const RADIATION_DAMAGE    = 3;   // урон в день на «грязной» клетке
const ANOMALY_DAMAGE      = 5;   // урон за проход через аномалию (× число аномалий)

const MONTHS = [
    "ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН",
    "ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"
];

// Время между находками артефактов (в днях)
const ARTIFACT_FIND_INTERVAL_MIN = 3;  // Минимум 3 дня
const ARTIFACT_FIND_INTERVAL_MAX = 7;  // Максимум 7 дней

// ═══════════════════════════════════════════════
//  ЛИДЕРЫ ФРАКЦИЙ С БОНУСАМИ
// ═══════════════════════════════════════════════
const FACTION_LEADERS = {
    loners: [
        {
            id: "valerian",
            name: "Отец Валерьян",
            portrait: "valerian",
            quote: "Зона — наш дом. Мы здесь, чтобы выжить.",
            bonuses: {
                equipmentProduction: 1.15,  // +15% производство снаряжения
                recruitCost: 0.90,          // -10% стоимость найма
            },
            description: "Опытный сталкер. Улучшает торговлю и снижает затраты на найм."
        },
        {
            id: "strelok",
            name: "Стрелок",
            portrait: "strelok",
            quote: "Я прошёл через Зону и вернулся. Дважды.",
            bonuses: {
                unitAttack: 1.20,           // +20% атака всех юнитов
                researchSpeed: 0.85,        // -15% время исследований
            },
            description: "Легенда Зоны. Усиливает боевые характеристики и ускоряет исследования."
        },
        {
            id: "beard",
            name: "Борода",
            portrait: "beard",
            quote: "Опыт — лучший учитель в Зоне.",
            bonuses: {
                unitDefense: 1.25,          // +25% защита
                maintenanceCost: 0.80,      // -20% содержание юнитов
            },
            description: "Мудрый ветеран. Укрепляет оборону и снижает расходы на содержание."
        },
        {
            id: "sidorovich",
            name: "Сидорович",
            portrait: "sidorovich",
            quote: "Деньги не пахнут, а артефакты — тем более.",
            bonuses: {
                equipmentProduction: 1.30,  // +30% производство
                unitCost: 1.10,             // +10% стоимость юнитов (жадный)
            },
            description: "Торговец. Огромный бонус к производству, но юниты дороже."
        },
    ],

    duty: [
        {
            id: "krylov",
            name: "Генерал Крылов",
            portrait: "krylov",
            quote: "Долг — это не просто слово. Это образ жизни.",
            bonuses: {
                unitAttack: 1.15,
                focusSpeed: 0.90,           // -10% время фокусов
            },
            description: "Стратег. Усиливает атаку и ускоряет выполнение фокусов."
        },
        {
            id: "voronin",
            name: "Генерал Воронин",
            portrait: "voronin",
            quote: "Зона должна быть уничтожена.",
            bonuses: {
                unitHP: 1.20,               // +20% HP всех юнитов
                constructionSpeed: 0.85,    // -15% время строительства
            },
            description: "Командир. Увеличивает живучесть войск и скорость строительства."
        },
        {
            id: "shulga",
            name: "Подполковник Шульга",
            portrait: "shulga",
            quote: "Порядок и дисциплина превыше всего.",
            bonuses: {
                unitDefense: 1.30,
                recruitCost: 0.85,
            },
            description: "Тактик. Мощная оборона и дешёвый найм."
        },
        {
            id: "volkodav",
            name: "Волкодав",
            portrait: "volkodav",
            quote: "Зона не прощает ошибок. Я — тем более.",
            bonuses: {
                unitAttack: 1.10,
                unitSpeed: 1.15,            // быстрее двигаются по карте
            },
            description: "Ветеран Долга. Агрессивные и быстрые отряды."
        },
    ],

    freedom: [
        {
            id: "chekhov",
            name: "Чехов",
            portrait: "chekhov",
            quote: "Свобода — это не анархия. Это выбор.",
            bonuses: {
                researchSpeed: 0.80,        // -20% время исследований
                equipmentProduction: 1.10,
            },
            description: "Учёный-анархист. Быстрые исследования."
        },
        {
            id: "lukash",
            name: "Лукаш",
            portrait: "lukash",
            quote: "Зона принадлежит всем. Мы боремся за это право.",
            bonuses: {
                unitAttack: 1.18,
                allianceBonus: 1.15,        // +15% бонус от союзников в бою
            },
            description: "Дипломат-воин. Сильнее с союзниками."
        },
        {
            id: "loki",
            name: "Локи",
            portrait: "loki",
            quote: "Правила созданы, чтобы их нарушать.",
            bonuses: {
                unitSpeed: 1.25,            // +25% скорость передвижения (меньше кулдаун)
                maintenanceCost: 0.90,
            },
            description: "Рейдер. Быстрые юниты и низкое содержание."
        },
    ],

    bandits: [
        {
            id: "yoga",
            name: "Йога",
            portrait: "yoga",
            quote: "В Зоне выживают только умные бандиты.",
            bonuses: {
                equipmentProduction: 1.25,
                unitCost: 0.80,
            },
            description: "Хитрый лидер. Дешёвые юниты и хорошее производство."
        },
        {
            id: "borov",
            name: "Боров",
            portrait: "borov",
            quote: "Деньги решают всё.",
            bonuses: {
                equipmentProduction: 1.40,  // Самый высокий бонус
                unitAttack: 0.90,           // -10% атака (жирный, не боец)
            },
            description: "Олигарх Зоны. Огромное производство, но слабее в бою."
        },
        {
            id: "sultan",
            name: "Султан",
            portrait: "sultan",
            quote: "Сильный берёт, слабый отдаёт.",
            bonuses: {
                unitAttack: 1.25,
                unitDefense: 0.85,          // -15% защита (агрессивный стиль)
            },
            description: "Налётчик. Очень сильная атака, но слабая оборона."
        },
    ],

    clearnsky: [
        {
            id: "lebedev",
            name: "Лебедев",
            portrait: "lebedev",
            quote: "Изучение Зоны — ключ к её пониманию.",
            bonuses: {
                researchSpeed: 0.70,        // -30% время (лучший учёный)
                unitHP: 0.90,               // -10% HP (не военные)
            },
            description: "Гений науки. Самые быстрые исследования, но хрупкие войска."
        },
    ],

    monolith: [
        {
            id: "charon",
            name: "Харон",
            portrait: "charon",
            quote: "Монолит есть истина. Всё остальное — иллюзия.",
            bonuses: {
                unitHP: 1.30,               // Фанатики не боятся смерти
                maintenanceCost: 0.70,      // -30% содержание (самопожертвование)
            },
            description: "Фанатичный жрец. Живучие и дешёвые войска."
        },
        {
            id: "vagrant",
            name: "Бродяга",
            portrait: "vagrant",
            quote: "Монолит покажет нам путь.",
            bonuses: {
                unitAttack: 1.35,           // Самая высокая атака
                unitDefense: 0.80,          // -20% защита (берсеркеры)
            },
            description: "Псих-берсеркер. Огромный урон, но уязвим."
        },
    ],

    mercs: [
        {
            id: "jackal",
            name: "Шакал",
            portrait: "jackal",
            quote: "Контракт есть контракт.",
            bonuses: {
                equipmentProduction: 1.20,
                unitCost: 0.90,
            },
            description: "Профессионал. Эффективное производство и дешёвый найм."
        },
        {
            id: "scar",
            name: "Шрам",
            portrait: "scar",
            quote: "Выжить любой ценой.",
            bonuses: {
                unitHP: 1.25,
                unitAttack: 1.15,
            },
            description: "Ветеран войн. Сбалансированные бонусы к боевым характеристикам."
        },
    ],

    military: [
        {
            id: "khaletsky",
            name: "Майор Халецкий",
            portrait: "khaletsky",
            quote: "Порядок должен быть восстановлен.",
            bonuses: {
                constructionSpeed: 0.75,    // -25% время строительства
                unitDefense: 1.15,
            },
            description: "Инженер. Быстрое строительство и хорошая оборона."
        },
        {
            id: "kuznetsov",
            name: "Капитан Кузнецов",
            portrait: "kuznetsov",
            quote: "Периметр должен быть закрыт.",
            bonuses: {
                unitHP: 1.20,
                maintenanceCost: 0.90,
            },
            description: "Командир гарнизона. Живучие войска с низким содержанием."
        },
        {
            id: "kovalsky",
            name: "Полковник Ковальский",
            portrait: "kovalsky",
            quote: "Никто не войдёт, никто не выйдёт.",
            bonuses: {
                unitAttack: 1.20,
                unitDefense: 1.20,
            },
            description: "Генерал. Сбалансированные мощные бонусы."
        },
        {
            id: "degtyarev",
            name: "Майор Дегтярёв",
            portrait: "degtyarev",
            quote: "Операция началась. Выполним задачу.",
            bonuses: {
                researchSpeed: 0.85,
                focusSpeed: 0.85,
            },
            description: "Агент СБУ. Ускоряет исследования и фокусы."
        },
    ],

    scientists: [
        {
            id: "sakharov",
            name: "Профессор Сахаров",
            portrait: "sakharov",
            quote: "Знание — сила. Зона — величайшая лаборатория.",
            bonuses: {
                researchSpeed: 0.65,        // -35% (лучший)
                equipmentProduction: 0.85,  // -15% производство (учёный, не торговец)
            },
            description: "Гений физики. Супербыстрые исследования."
        },
        {
            id: "herman",
            name: "Профессор Герман",
            portrait: "herman",
            quote: "Аномалии — ключ к пониманию Зоны.",
            bonuses: {
                researchSpeed: 0.80,
                unitHP: 1.10,               // Экспериментальная броня
            },
            description: "Практик. Быстрые исследования и улучшенная броня."
        },
        {
            id: "ozersky",
            name: "Озерский",
            portrait: "ozersky",
            quote: "Эксперименты должны продолжаться.",
            bonuses: {
                researchSpeed: 0.75,
                constructionSpeed: 0.80,
            },
            description: "Изобретатель. Ускоряет исследования и стройку."
        },
    ],

    renegades: [
        {
            id: "renegade_chief",
            name: "Командир Отряда",
            portrait: "renegade_chief",
            quote: "Нас отвергли все. Теперь мы сами по себе.",
            bonuses: {
                unitCost: 0.70,             // Очень дёшево (отбросы)
                unitAttack: 0.85,           // -15% атака
            },
            description: "Изгой. Дешёвые, но слабые войска."
        },
    ],

    ozone: [
        {
            id: "ozone_rep",
            name: "Представитель О-Сознания",
            portrait: "ozone_rep",
            quote: "Мы — единое целое. Индивидуальность — слабость.",
            bonuses: {
                unitHP: 1.25,
                maintenanceCost: 0.75,
                researchSpeed: 0.85,
            },
            description: "Коллективный разум. Мощные бонусы по всем направлениям."
        },
    ],
};

// ═══════════════════════════════════════════════
//  ФРАКЦИИ (обновлено)
// ═══════════════════════════════════════════════
const FACTIONS = {
    loners: {
        name:       "Одиночки",
        color:      "#d97706",
        ideology:   "Выживание",
        icon:       "🧥",
        cssClass:   "fi-loners",
        desc:       "Вольные сталкеры Зоны. Сила в единстве.",
        startEquip: 800,
        defaultLeader: "valerian",
    },
    duty: {
        name:       "Долг",
        color:      "#b91c1c",
        ideology:   "Военный орден",
        icon:       "⚔️",
        cssClass:   "fi-duty",
        desc:       "Уничтожить Зону — наш долг перед человечеством.",
        startEquip: 1200,
        defaultLeader: "voronin",
    },
    freedom: {
        name:       "Свобода",
        color:      "#16a34a",
        ideology:   "Анархия",
        icon:       "🌿",
        cssClass:   "fi-freedom",
        desc:       "Зона принадлежит всем. Свобода или смерть.",
        startEquip: 900,
        defaultLeader: "lukash",
    },
    bandits: {
        name:       "Бандиты",
        color:      "#4b5563",
        ideology:   "Криминал",
        icon:       "💀",
        cssClass:   "fi-bandits",
        desc:       "Закон один — сильный берёт, слабый отдаёт.",
        startEquip: 700,
        defaultLeader: "borov",
    },
    clearnsky: {
        name:       "Чистое Небо",
        color:      "#0284c7",
        ideology:   "Исследование",
        icon:       "🔵",
        cssClass:   "fi-cs",
        desc:       "Изучить Зону — ключ к контролю над ней.",
        startEquip: 1000,
        defaultLeader: "lebedev",
    },
    monolith: {
        name:       "Монолит",
        color:      "#7c3aed",
        ideology:   "Религиозный фанатизм",
        icon:       "🔮",
        cssClass:   "fi-monolith",
        desc:       "Монолит есть истина. Нарушившие погибнут.",
        startEquip: 1500,
        defaultLeader: "charon",
    },
    mercs: {
        name:       "Наёмники",
        color:      "#ea580c",
        ideology:   "Коммерция",
        icon:       "🎯",
        cssClass:   "fi-mercs",
        desc:       "Работаем за деньги. Клиент всегда прав.",
        startEquip: 1100,
        defaultLeader: "jackal",
    },
    military: {
        name:       "Военные",
        color:      "#65a30d",
        ideology:   "Государство",
        icon:       "🪖",
        cssClass:   "fi-military",
        desc:       "Периметр должен быть закрыт. Любой ценой.",
        startEquip: 1400,
        defaultLeader: "kovalsky",
    },
    scientists: {
        name:       "Учёные",
        color:      "#0891b2",
        ideology:   "Наука",
        icon:       "🔬",
        cssClass:   "fi-scientists",
        desc:       "Знание — сила. Зона — наша лаборатория.",
        startEquip: 600,
        defaultLeader: "sakharov",
    },
    renegades: {
        name:       "Ренегаты",
        color:      "#92400e",
        ideology:   "Хаос",
        icon:       "☠️",
        cssClass:   "fi-renegades",
        desc:       "Бывшие сталкеры, отвергнутые всеми.",
        startEquip: 500,
        defaultLeader: "renegade_chief",
    },
    ozone: {
        name:       "О-Сознание",
        color:      "#6d28d9",
        ideology:   "Трансгуманизм",
        icon:       "🧠",
        cssClass:   "fi-ozone",
        desc:       "Мы — единое целое. Индивидуальность — слабость.",
        startEquip: 2000,
        defaultLeader: "ozone_rep",
    },
};

// ═══════════════════════════════════════════════
//  ЮНИТЫ (с учётом экипировки)
// ═══════════════════════════════════════════════
function getUnitDefs(tech, leaderBonuses) {
    if (!leaderBonuses) leaderBonuses = {};
    if (!tech) tech = { weapons: 1, armor: 1, artifacts: 1, survival: 1 };

    var costMult    = leaderBonuses.unitCost    || 1;
    var maintMult   = leaderBonuses.maintenanceCost || 1;

    // Бонусы исследований: оружие → атака, броня → защита,
    // артефакты → запас здоровья, выживание → экономика (см. engine)
    var atkTech = 1 + (Math.max(1, tech.weapons)   - 1) * 0.10;
    var defTech = 1 + (Math.max(1, tech.armor)     - 1) * 0.10;
    var hpTech  = 1 + (Math.max(1, tech.artifacts) - 1) * 0.08;
    
    return {
        stalker: {
            name:          "Сталкер",
            icon:          "🧥",
            costEquipment: Math.round(120 * costMult),
            costManpower:  800,
            baseHp:        Math.round(80  * hpTech),
            baseAttack:    Math.round(8   * atkTech),
            baseDefense:   Math.round(15  * defTech),
            maintenance:   0.3 * maintMult,
        },
        soldier: {
            name:          "Боец",
            icon:          "🪖",
            costEquipment: Math.round(200 * costMult),
            costManpower:  600,
            baseHp:        Math.round(100 * hpTech),
            baseAttack:    Math.round(12  * atkTech),
            baseDefense:   Math.round(20  * defTech),
            maintenance:   0.5 * maintMult,
        },
        sniper: {
            name:          "Снайпер",
            icon:          "🎯",
            costEquipment: Math.round(350 * costMult),
            costManpower:  400,
            baseHp:        Math.round(60  * hpTech),
            baseAttack:    Math.round(25  * atkTech),
            baseDefense:   Math.round(8   * defTech),
            maintenance:   0.8 * maintMult,
        },
    };
}

// ═══════════════════════════════════════════════
//  ПОСТРОЙКИ
// ═══════════════════════════════════════════════
var BUILDING_DEFS = {
    outpost: {
        name:          "Аванпост",
        icon:          "🏕️",
        costEquipment: 300,
        description:   "Укрепляет позиции",
    },
    cache: {
        name:          "Схрон снаряжения",
        icon:          "📦",
        costEquipment: 200,
        description:   "Увеличивает производство снаряжения",
    },
    lab: {
        name:          "Полевая лаборатория",
        icon:          "🧪",
        costEquipment: 600,
        description:   "Ускоряет исследования",
    },
};

// ═══════════════════════════════════════════════
//  ТЕХНОЛОГИИ
// ═══════════════════════════════════════════════
var TECH_CONFIG = {
    weapons:  { label: "Оружие и боеприпасы", color: "red",    maxLevel: 5 },
    armor:    { label: "Броня и защита",       color: "blue",   maxLevel: 5 },
    artifacts:{ label: "Артефакты Зоны",       color: "purple", maxLevel: 5 },
    survival: { label: "Выживание",            color: "green",  maxLevel: 5 },
};

// ═══════════════════════════════════════════════
//  ФОКУСЫ (сокращённая версия для примера)
// ═══════════════════════════════════════════════
var FACTION_FOCUSES = {
    loners: [
        { id: "lon_union", name: "Союз Одиночек", description: "+500 снаряжения и 2 новых сталкера",
          effect: function(state) {
              state.resources.equipment += 500;
              _spawnRandom(state, state.myFactionId, "stalker", 2);
              state.createAlert("ОДИНОЧКИ ОБЪЕДИНЯЮТСЯ! +500 СНАРЯЖЕНИЯ", 10, "info");
          } },
        { id: "lon_trade", name: "Торговые связи", description: "+3 000 рублей в казну",
          effect: function(state) {
              state.resources.rubles += 3000;
              state.createAlert("ТОРГОВЛЯ НАЛАЖЕНА: +3 000 RU", 10, "info");
          } },
    ],

    duty: [
        { id: "duty_martial", name: "Военная мобилизация", description: "+4 бойца",
          effect: function(state) {
              _spawnRandom(state, state.myFactionId, "soldier", 4);
              state.createAlert("ДОЛГ МОБИЛИЗОВАН: +4 БОЙЦА", 10, "war");
          } },
        { id: "duty_supply", name: "Армейские склады", description: "+900 снаряжения",
          effect: function(state) {
              state.resources.equipment += 900;
              state.createAlert("СКЛАДЫ ВСКРЫТЫ: +900 СНАРЯЖЕНИЯ", 10, "info");
          } },
    ],

    freedom: [
        { id: "free_forest", name: "Лесное братство", description: "+3 сталкера и +400 снаряжения",
          effect: function(state) {
              state.resources.equipment += 400;
              _spawnRandom(state, state.myFactionId, "stalker", 3);
              state.createAlert("СВОБОДА НАБИРАЕТ ЛЮДЕЙ: +3 СТАЛКЕРА", 10, "info");
          } },
        { id: "free_smoke", name: "Дымовая завеса", description: "+2 000 рублей",
          effect: function(state) {
              state.resources.rubles += 2000;
              state.createAlert("КОНТРАБАНДА ПРОШЛА: +2 000 RU", 10, "info");
          } },
    ],

    bandits: [
        { id: "band_loot", name: "Большой налёт", description: "+4 000 рублей",
          effect: function(state) {
              state.resources.rubles += 4000;
              state.createAlert("НАЛЁТ УДАЛСЯ: +4 000 RU", 10, "war");
          } },
        { id: "band_press", name: "Рэкет", description: "+2 500 рублей и +400 снаряжения",
          effect: function(state) {
              state.resources.rubles += 2500;
              state.resources.equipment += 400;
              state.createAlert("ДАНИ СОБРАНЫ: +2 500 RU, +400 СНАРЯЖЕНИЯ", 10, "info");
          } },
    ],

    clearnsky: [
        { id: "cs_recon", name: "Разведка Зоны", description: "+2 снайпера и +300 снаряжения",
          effect: function(state) {
              state.resources.equipment += 300;
              _spawnRandom(state, state.myFactionId, "sniper", 2);
              state.createAlert("РАЗВЕДКА ГОТОВА: +2 СНАЙПЕРА", 10, "info");
          } },
        { id: "cs_lab", name: "Полевая лаборатория", description: "+1 уровень технологии артефактов",
          effect: function(state) {
              state.tech.artifacts = Math.min(5, state.tech.artifacts + 1);
              state.createAlert("ПРОРЫВ В ИЗУЧЕНИИ АРТЕФАКТОВ", 10, "info");
          } },
    ],

    monolith: [
        { id: "mono_faith", name: "Единая вера", description: "+4 бойца",
          effect: function(state) {
              _spawnRandom(state, state.myFactionId, "soldier", 4);
              state.createAlert("МОНОЛИТ ПРИЗЫВАЕТ: +4 БОЙЦА", 10, "war");
          } },
        { id: "mono_prism", name: "Призматический обряд", description: "+1 500 снаряжения",
          effect: function(state) {
              state.resources.equipment += 1500;
              state.createAlert("ОБРЯД ЗАВЕРШЁН: +1 500 СНАРЯЖЕНИЯ", 10, "info");
          } },
    ],

    mercs: [
        { id: "merc_contract", name: "Жирный контракт", description: "+5 000 рублей",
          effect: function(state) {
              state.resources.rubles += 5000;
              state.createAlert("КОНТРАКТ ВЫПОЛНЕН: +5 000 RU", 10, "info");
          } },
        { id: "merc_squad", name: "Ударная группа", description: "+2 снайпера и +2 бойца",
          effect: function(state) {
              _spawnRandom(state, state.myFactionId, "sniper", 2);
              _spawnRandom(state, state.myFactionId, "soldier", 2);
              state.createAlert("ГРУППА СОБРАНА: +2 СНАЙПЕРА, +2 БОЙЦА", 10, "info");
          } },
    ],

    military: [
        { id: "mil_supply", name: "Централизованное снабжение", description: "+1 200 снаряжения",
          effect: function(state) {
              state.resources.equipment += 1200;
              state.createAlert("СНАБЖЕНИЕ ПРИБЫЛО: +1 200", 10, "info");
          } },
        { id: "mil_arty", name: "Артподготовка", description: "+3 бойца",
          effect: function(state) {
              _spawnRandom(state, state.myFactionId, "soldier", 3);
              state.createAlert("ПОДКРЕПЛЕНИЕ: +3 БОЙЦА", 10, "war");
          } },
    ],

    scientists: [
        { id: "sci_breakthrough", name: "Научный прорыв", description: "+1 уровень технологии выживания",
          effect: function(state) {
              state.tech.survival = Math.min(5, state.tech.survival + 1);
              state.createAlert("ПРОРЫВ: ТЕХНОЛОГИЯ ВЫЖИВАНИЯ +1", 10, "info");
          } },
        { id: "sci_grant", name: "Грант на исследования", description: "+3 000 рублей и +300 снаряжения",
          effect: function(state) {
              state.resources.rubles += 3000;
              state.resources.equipment += 300;
              state.createAlert("ГРАНТ ПОЛУЧЕН: +3 000 RU", 10, "info");
          } },
    ],

    renegades: [
        { id: "ren_scavenge", name: "Мародёрство", description: "+600 снаряжения",
          effect: function(state) {
              state.resources.equipment += 600;
              state.createAlert("ХЛАМ СОБРАН: +600 СНАРЯЖЕНИЯ", 10, "info");
          } },
        { id: "ren_raid", name: "Отчаянный рейд", description: "+4 сталкера",
          effect: function(state) {
              _spawnRandom(state, state.myFactionId, "stalker", 4);
              state.createAlert("ИЗГОИ ИДУТ В БОЙ: +4 СТАЛКЕРА", 10, "war");
          } },
    ],

    ozone: [
        { id: "oz_hive", name: "Единый разум", description: "+4 бойца",
          effect: function(state) {
              _spawnRandom(state, state.myFactionId, "soldier", 4);
              state.createAlert("КОЛЛЕКТИВ СОБРАН: +4 БОЙЦА", 10, "info");
          } },
        { id: "oz_psi", name: "Пси-излучение", description: "+2 снайпера и +1 000 снаряжения",
          effect: function(state) {
              state.resources.equipment += 1000;
              _spawnRandom(state, state.myFactionId, "sniper", 2);
              state.createAlert("ПСИ-ИМПУЛЬС: +2 СНАЙПЕРА, +1 000 СНАРЯЖЕНИЯ", 10, "info");
          } },
    ],
};

// ═══════════════════════════════════════════════
//  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ═══════════════════════════════════════════════
function _spawnRandom(state, owner, type, count) {
    var cells = Object.keys(state.grid).filter(function(k) {
        return state.grid[k] === owner;
    });
    if (!cells.length) return;
    for (var i = 0; i < count; i++) {
        var pos = cells[Math.floor(Math.random() * cells.length)];
        state.spawnUnit(pos, owner, type);
    }
}

function generateColor(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
        h = str.charCodeAt(i) + ((h << 5) - h);
    }
    var c = "#";
    for (var j = 0; j < 3; j++) {
        var v = (h >> (j * 8)) & 0xff;
        v = Math.floor(v * 0.55 + 60);
        c += ("00" + v.toString(16)).slice(-2);
    }
    return c;
}

// ═══════════════════════════════════════════════
//  АРТЕФАКТЫ ЗОНЫ
// ═══════════════════════════════════════════════
const ARTIFACTS = {
    // Электрические
    flash: {
        name: "Вспышка",
        price: 2500,
        icon: "flash",
        type: "electric",
        rarity: 2,
    },
    moonlight: {
        name: "Лунный свет",
        price: 5000,
        icon: "moonlight",
        type: "electric",
        rarity: 3,
    },
    sparkler: {
        name: "Бенгальский огонь",
        price: 1000,
        icon: "sparkler",
        type: "electric",
        rarity: 1,
    },
    battery: {
        name: "Батарейка",
        price: 5000,
        icon: "battery",
        type: "electric",
        rarity: 3,
    },

    // Химические
    stoneblood: {
        name: "Кровь камня",
        price: 1000,
        icon: "stoneblood",
        type: "chemical",
        rarity: 1,
    },
    meatpiece: {
        name: "Ломоть мяса",
        price: 2500,
        icon: "meatpiece",
        type: "chemical",
        rarity: 2,
    },
    soul: {
        name: "Душа",
        price: 5000,
        icon: "soul",
        type: "chemical",
        rarity: 3,
    },

    // Гравитационные
    slime: {
        name: "Слизь",
        price: 1000,
        icon: "slime",
        type: "gravity",
        rarity: 1,
    },
    slug: {
        name: "Слизняк",
        price: 2500,
        icon: "slug",
        type: "gravity",
        rarity: 2,
    },
    mica: {
        name: "Слюда",
        price: 5000,
        icon: "mica",
        type: "gravity",
        rarity: 3,
    },
    gravi: {
        name: "Грави",
        price: 2500,
        icon: "gravi",
        type: "gravity",
        rarity: 2,
    },
    goldfish: {
        name: "Золотая рыбка",
        price: 5000,
        icon: "goldfish",
        type: "gravity",
        rarity: 3,
    },
    twist: {
        name: "Выверт",
        price: 1000,
        icon: "twist",
        type: "gravity",
        rarity: 1,
    },

    // Термальные
    jellyfish: {
        name: "Медуза",
        price: 1000,
        icon: "jellyfish",
        type: "thermal",
        rarity: 1,
    },
    stoneflower: {
        name: "Каменный цветок",
        price: 2500,
        icon: "stoneflower",
        type: "thermal",
        rarity: 2,
    },
    nightstar: {
        name: "Ночная звезда",
        price: 5000,
        icon: "nightstar",
        type: "thermal",
        rarity: 3,
    },
    fireball: {
        name: "Огненный шар",
        price: 2500,
        icon: "fireball",
        type: "thermal",
        rarity: 2,
    },
    crystal: {
        name: "Кристалл",
        price: 5000,
        icon: "crystal",
        type: "thermal",
        rarity: 3,
    },
    drops: {
        name: "Капли",
        price: 1000,
        icon: "drops",
        type: "thermal",
        rarity: 1,
    },

    // Защитные
    kolobok: {
        name: "Колобок",
        price: 5000,
        icon: "kolobok",
        type: "protective",
        rarity: 3,
    },
    thorn: {
        name: "Колючка",
        price: 1000,
        icon: "thorn",
        type: "protective",
        rarity: 1,
    },
    crystalthorn: {
        name: "Кристальная колючка",
        price: 2500,
        icon: "crystalthorn",
        type: "protective",
        rarity: 2,
    },
    urchin: {
        name: "Морской ёж",
        price: 5000,
        icon: "urchin",
        type: "protective",
        rarity: 3,
    },

    // Редкие
    mammasbeads: {
        name: "Мамины бусы",
        price: 5000,
        icon: "mammasbeads",
        type: "rare",
        rarity: 3,
    },
    dummy: {
        name: "Пустышка",
        price: 5000,
        icon: "dummy",
        type: "rare",
        rarity: 3,
    },
    pellicle: {
        name: "Плёнка",
        price: 5000,
        icon: "pellicle",
        type: "rare",
        rarity: 3,
    },
    spring: {
        name: "Пружина",
        price: 5000,
        icon: "spring",
        type: "rare",
        rarity: 3,
    },
};

// Шанс получения артефакта в зависимости от редкости
const ARTIFACT_DROP_CHANCES = {
    1: 0.60,  // 60% для обычных
    2: 0.30,  // 30% для редких
    3: 0.10,  // 10% для очень редких
};

function generateBetaMap() {
    var W = 28, H = 20;
    var grid = {};

    // Прямоугольники фракций. Вместе покрывают всю карту без дыр,
    // иначе юниты не могут пройти через «пустые» клетки.
    var zones = [
        // ── север (y 0..4) ──────────────────────
        ["military",    0,  0,  8,  5],
        ["loners",      8,  0,  8,  5],
        ["bandits",    16,  0,  6,  5],
        ["ozone",      22,  0,  6,  5],
        // ── центр-север (y 5..9) ────────────────
        ["renegades",   0,  5,  5,  5],
        ["clearnsky",   5,  5,  6,  5],
        ["loners",     11,  5,  5,  5],
        ["duty",       16,  5,  6,  5],
        ["scientists", 22,  5,  6,  5],
        // ── центр-юг (y 10..14) ─────────────────
        ["freedom",     0, 10,  7,  5],
        ["mercs",       7, 10,  6,  5],
        ["duty",       13, 10,  5,  5],
        ["monolith",   18, 10,  6,  5],
        ["ozone",      24, 10,  4,  5],
        // ── юг (y 15..19) ───────────────────────
        ["renegades",   0, 15,  6,  5],
        ["military",    6, 15,  8,  5],
        ["freedom",    14, 15,  8,  5],
        ["bandits",    22, 15,  6,  5],
    ];

    zones.forEach(function(z) {
        var id = z[0], sx = z[1], sy = z[2], w = z[3], h = z[4];
        for (var x = sx; x < sx + w; x++) {
            for (var y = sy; y < sy + h; y++) {
                grid[x + "," + y] = id;
            }
        }
    });

    // Страховка: если в разметке зон появилась дыра — закрашиваем её
    // цветом соседа, чтобы карта оставалась связной.
    var filled = true, guard = 0;
    while (filled && guard++ < 50) {
        filled = false;
        for (var cx = 0; cx < W; cx++) {
            for (var cy = 0; cy < H; cy++) {
                var key = cx + "," + cy;
                if (grid[key]) continue;
                var votes = {};
                [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function(d) {
                    var owner = grid[(cx + d[0]) + "," + (cy + d[1])];
                    if (owner) votes[owner] = (votes[owner] || 0) + 1;
                });
                var best = null;
                Object.keys(votes).forEach(function(f) {
                    if (best === null || votes[f] > votes[best]) best = f;
                });
                if (best) { grid[key] = best; filled = true; }
            }
        }
    }

    return grid;
}

// Размеры бета-карты (используются камерой и миникартой)
// ══════════════════════════════════════════════════
//  ПАССИВНЫЕ БОНУСЫ АРТЕФАКТОВ (по типу)
// ══════════════════════════════════════════════════
// Артефакт в инвентаре работает постоянно: чем выше редкость, тем сильнее.
var ARTIFACT_BONUS = {
    electric:    { stat: "speed",      perRarity: 0.06, label: "скорость отрядов" },
    chemical:    { stat: "radResist",  perRarity: 0.10, label: "защита от радиации" },
    thermal:     { stat: "attack",     perRarity: 0.07, label: "урон в бою" },
    gravity:     { stat: "defense",    perRarity: 0.08, label: "защита в бою" },
    protective:  { stat: "hp",         perRarity: 0.09, label: "здоровье отрядов" },
    rare:        { stat: "income",     perRarity: 0.05, label: "доход рублей" }
};

// Экономика: сколько рублей стоит единица снаряжения при обмене
var RUBLES_PER_EQUIPMENT = 8;

// ══════════════════════════════════════════════════
//  ХАРАКТЕРЫ ФРАКЦИЙ И ИДЕОЛОГИЧЕСКИЕ ПРОТИВОРЕЧИЯ
// ══════════════════════════════════════════════════
// aggression  — как быстро копит вражду и объявляет войны
// caution     — насколько держится за свои сектора
// expansion   — как охотно шлёт юнитов вперёд
// armyLimit   — сколько отрядов держит одновременно
var FACTION_AI = {
    loners:     { aggression: 0.5, caution: 0.6, expansion: 0.7, armyLimit: 8  },
    duty:       { aggression: 0.9, caution: 0.8, expansion: 1.0, armyLimit: 12 },
    freedom:    { aggression: 0.6, caution: 0.5, expansion: 0.8, armyLimit: 9  },
    bandits:    { aggression: 1.0, caution: 0.3, expansion: 1.2, armyLimit: 10 },
    monolith:   { aggression: 1.2, caution: 0.6, expansion: 1.3, armyLimit: 11 },
    military:   { aggression: 0.9, caution: 0.9, expansion: 0.9, armyLimit: 12 },
    scientists: { aggression: 0.2, caution: 1.2, expansion: 0.4, armyLimit: 6  },
    clearnsky:  { aggression: 0.4, caution: 0.8, expansion: 0.5, armyLimit: 7  },
    mercs:      { aggression: 0.8, caution: 0.4, expansion: 0.9, armyLimit: 9  },
    renegades:  { aggression: 0.9, caution: 0.3, expansion: 1.0, armyLimit: 8  },
    ozone:      { aggression: 0.7, caution: 0.7, expansion: 0.8, armyLimit: 10 }
};

// Пары, которые ненавидят друг друга с первого дня
var IDEOLOGY_FOES = [
    ['duty', 'freedom'],       // устав против вольницы
    ['duty', 'bandits'],
    ['freedom', 'military'],
    ['bandits', 'loners'],
    ['bandits', 'scientists'],
    ['monolith', 'loners'],
    ['monolith', 'scientists'],
    ['monolith', 'duty'],
    ['military', 'renegades'],
    ['mercs', 'renegades'],
    ['ozone', 'monolith']
];

// Пары, которые друг другу симпатизируют
var IDEOLOGY_FRIENDS = [
    ['loners', 'clearnsky'],
    ['clearnsky', 'scientists'],
    ['scientists', 'loners'],
    ['duty', 'military'],
    ['bandits', 'renegades'],
    ['mercs', 'freedom']
];

// Порог отношений: ниже — война, выше — союз
var RELATION_WAR_THRESHOLD    = -55;
var RELATION_PEACE_THRESHOLD  = -20;
var RELATION_ALLIANCE_THRESHOLD = 45;

// Коалиция: если фракция держит больше стольких процентов карты —
// все остальные начинают видеть в ней угрозу и сближаются против неё
var COALITION_DOMINANCE_PERCENT = 32;

var BETA_MAP_WIDTH  = 28;
var BETA_MAP_HEIGHT = 20;

'use strict';

/**
 * Смоук-тест игры: прогоняет все фракции, окна, экономику,
 * стройку, исследования, бои и 400 игровых дней.
 * Запуск: node tests/smoke.js
 */
const { boot } = require('./harness');

const DAY = 24 * 3600 * 1000;

function fail(errors, label, e) {
    errors.push(`${label} → ${e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e}`);
}

function tickDays(w, days, errors) {
    const State = w.State, Engine = w.Engine;
    for (let i = 0; i < days; i++) {
        try {
            State.gameDate = new Date(State.gameDate.getTime() + DAY);
            Engine._onDayPassed();
            if (i % 50 === 0) w.Renderer.draw();
        } catch (e) {
            fail(errors, `day ${i}`, e);
            if (errors.length > 40) return;
        }
    }
}

function firstCells(w, fid, n) {
    return Object.keys(w.State.grid).filter(k => w.State.grid[k] === fid).slice(0, n);
}

let H = null;
const ev = (expr) => H.ev(expr);

function runFaction(fid) {
    const h = boot();
    H = h;
    const w = h.window;
    const errors = [];

    const run = (label, fn) => {
        try { return fn(); } catch (e) { fail(errors, label, e); }
    };

    run('entry', () => h.vm.runInContext(`
        State.init();
        AssetManager.init(function(){ window.__assetsReady = true; }, function(){});
        Renderer.init(document.getElementById("grid-canvas"));
        UI.init();
        Engine.init();
    `, h.ctx, { filename: 'entry' }));

    const State = w.State, UI = w.UI, Engine = w.Engine;

    run('loadBetaMap', () => UI.loadBetaMap());
    run('openPlayMenu', () => {
        UI.openPlayMenu();
        if (!w.document.getElementById('play-faction-list').innerHTML.trim()) throw new Error('пустой список фракций');
    });
    run('startPlay', () => UI.startPlay(fid));

    // ── все окна ──────────────────────────────────
    ['politics', 'research', 'build', 'diplomacy', 'army', 'trader', 'mods', 'inventory']
        .forEach(tab => run('window:' + tab, () => {
            UI.openWindow(tab);
            const body = w.document.getElementById('window-body').innerHTML;
            if (!body.trim()) throw new Error('пустое окно');
        }));

    // ── политика: смена лидера ────────────────────
    run('politics:leaders', () => {
        w.UIPolitics.showLeaderSelection();
        const leaders = ev('FACTION_LEADERS')[fid];
        const other = leaders[1] || leaders[0];
        State.myLeaderId = leaders[0].id;
        w.UIPolitics.selectLeader(other.id);
        if (State.getCurrentLeader().id !== other.id) throw new Error('лидер не сменился');
    });

    // ── фокусы ────────────────────────────────────
    run('politics:focus', () => {
        w.UIPolitics.renderFocuses();
        const f = (ev('FACTION_FOCUSES')[fid] || [])[0];
        if (f) w.UIPolitics.startFocus(f.id);
    });

    // ── карта: не должно быть дыр ─────────────────
    run('map:no-holes', () => {
        const grid = State.grid;
        const keys = Object.keys(grid).map(k => k.split(',').map(Number));
        const xs = keys.map(k => k[0]), ys = keys.map(k => k[1]);
        const x0 = Math.min(...xs), x1 = Math.max(...xs);
        const y0 = Math.min(...ys), y1 = Math.max(...ys);
        let holes = 0;
        for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (!grid[x + ',' + y]) holes++;
        if (holes) errors.push(`map:no-holes → пустых клеток: ${holes}`);
    });

    // ── фокусы: эффект любого фокуса не должен падать ──
    run('focus:all-effects', () => {
        const focuses = ev('FACTION_FOCUSES');
        for (const fid of Object.keys(focuses)) {
            for (const f of focuses[fid]) {
                try { f.effect(State); }
                catch (e) { errors.push(`focus:all-effects → ${fid}.${f.id}: ${e.message}`); }
            }
        }
    });

    // ── исследования и стройка ────────────────────
    run('research', () => {
        w.UIResearch.render();
        w.UIResearch.startResearch('weapons', 2);
    });
    run('build', () => {
        w.UIResearch.renderBuild();
        w.UIResearch.selectBuild('cache');
    });

    // ── найм и приказ ─────────────────────────────
    const cells = firstCells(w, fid, 3);
    run('recruit', () => {
        w.UIMilitary.renderArmy();
        w.UIMilitary.startRecruitment('stalker');
        if (!cells[0]) throw new Error('у фракции нет клеток: ' + fid);
        Engine.deployUnit(cells[0]);
        if (!State.units.some(u => u.owner === fid)) throw new Error('юнит не создан');
    });
    run('order', () => {
        const u = State.units.find(x => x.owner === fid);
        if (!u || !cells[1]) return;
        State.selectedUnitId = u.id;
        Engine.giveOrder(cells[1]);
        w.UIMilitary.openUnitEquipment(u.id);
    });

    // ── экономика ─────────────────────────────────
    run('trader:render', () => w.UIEconomy.renderTrader());
    run('trader:buy', () => {
        const stock = w.Items.getTraderStock(fid);
        const firstWeapon = Object.keys(w.Items.weapons)[0];
        State.resources.rubles = 999999;
        w.UIEconomy.buyItem(firstWeapon, 'weapon');
    });
    run('inventory', () => {
        w.UIEconomy.renderInventory();
        State.gameDate = new Date(State.gameDate.getTime());
        for (let i = 0; i < 5; i++) State._findRandomArtifact();
        if (!State.artifacts.length) throw new Error('артефакты не найдены');
        const a = State.artifacts[0];
        if (typeof a.rarity !== 'number') errors.push('inventory → у артефакта нет поля rarity');
        w.UIEconomy.renderInventory();
    });
    run('inventory:sell', () => {
        const before = State.resources.rubles;
        w.UIEconomy.sellArtifact(0);
        if (State.resources.rubles <= before) throw new Error('рубли не начислены за артефакт');
    });
    run('equip:inventory', () => {
        const u = State.units.find(x => x.owner === fid);
        if (!u) return;
        // даём предмет в инвентарь и экипируем
        if (!State.inventory) State.inventory = { weapons: [], armor: [] };
        const wid = Object.keys(w.Items.weapons)[3];
        State.inventory.weapons.push(wid);
        w.UIMilitary.equipFromInventory(u.id, wid, 'weapon');
        if (u.weapon !== wid) throw new Error('оружие не экипировано');
    });
    run('artifact:find', () => {
        for (let i = 0; i < 60; i++) State.checkArtifactFind();
    });

    // ── дипломатия ────────────────────────────────
    run('diplomacy:render', () => w.UIDiplomacy.render());
    run('diplomacy:war', () => {
        const others = ev('Object.keys(FACTIONS)').filter(x => x !== fid);
        w.UIDiplomacy.callToWar(others[0]);
    });
    run('diplomacy:trader', () => {
        const others = ev('Object.keys(FACTIONS)').filter(x => x !== fid);
        w.UIEconomy.openForeignTrader(others[0]);
    });

    // ── моды ──────────────────────────────────────
    run('mods', () => {
        w.UIMods.render();
        ['browser', 'upload', 'create'].forEach(t => w.UIMods.showTab(t));
    });

    // ── моды: добавление, идемпотентность, удаление ──
    run('mods:apply', () => {
        const MM = w.ModManager;
        const before = ev('Object.keys(FACTIONS)').length;
        const mod = {
            id: 'test_mod', name: 'Тестовый мод', version: '1.0.0', author: 'test',
            factions: { test_faction: { name: 'Тест', color: '#123456', ideology: 'Тест', icon: '🧪', cssClass: 'fi-test', desc: '', startEquip: 1000, defaultLeader: 'test_leader' } },
            leaders: { test_faction: [{ id: 'test_leader', name: 'Тест Лидер', portrait: 'strelok', quote: '', bonuses: { unitAttack: 1.1 }, description: '' }] },
            focuses: { test_faction: [{ id: 'test_focus', name: 'Тест', description: '', effect: function() {} }] },
            weapons: {}, armor: {}, artifacts: {},
            images: { armor_test_armor: 'data:image/png;base64,AA==' }
        };
        MM.loadedMods.push(mod);
        MM.applyMods();
        if (ev('Object.keys(FACTIONS)').length !== before + 1) throw new Error('фракция мода не добавилась');
        // повторное применение не должно дублировать
        MM.applyMods();
        const leaders = ev('FACTION_LEADERS').test_faction.length;
        const focuses = ev('FACTION_FOCUSES').test_faction.length;
        if (leaders !== 1) throw new Error('лидеры продублировались: ' + leaders);
        if (focuses !== 1) throw new Error('фокусы продублировались: ' + focuses);
        if (!w.AssetManager._cache['armor/test_armor']) errors.push('mods:apply → картинка брони попала не в ту категорию');
        // удаление возвращает базу
        MM.removeMod('test_mod');
        if (ev('Object.keys(FACTIONS)').length !== before) throw new Error('удаление мода не откатило фракцию');
        if (ev('FACTION_LEADERS').test_faction) throw new Error('лидеры удалённого мода остались');
        if (ev('FACTION_FOCUSES').loners.length !== 2) throw new Error('базовые фокусы пострадали');
    });

    // ── длинная симуляция ─────────────────────────
    run('sim:start', () => Engine.setSpeed(5));
    tickDays(w, 400, errors);
    run('sim:draw', () => w.Renderer.draw());

    // ── бой: павший атакующий не должен оставаться в армии ──
    run('combat:cleanup', () => {
        const a = { id: 'testA', pos: cells[0], owner: fid, type: 'stalker', hp: 1, maxHp: 10, attack: 100, defense: 0, weapon: 'pm', armor: 'leather_jacket', path: [] };
        const d = { id: 'testD', pos: cells[0], owner: ev('Object.keys(FACTIONS)').find(x => x !== fid), type: 'stalker', hp: 9999, maxHp: 9999, attack: 100, defense: 0, weapon: 'pm', armor: 'leather_jacket', path: [] };
        State.units.push(a, d);
        State.battles.push({ attacker: a, defender: d, timer: 0 });
        for (let i = 0; i < 20; i++) Engine._tickCombat();
        if (State.units.some(u => u.id === 'testA')) errors.push('combat:cleanup → погибший атакующий остался в State.units');
        State.units = State.units.filter(u => u.id !== 'testD');
        State.battles = [];
    });

    // ── время: сутки не должны пролетать за кадр ──
    run('time:pace', () => {
        const before = new Date(State.gameDate).getTime();
        State.gameSpeed = 1;
        Engine._advanceTime();
        const diff = new Date(State.gameDate).getTime() - before;
        if (diff >= 24 * 3600 * 1000) errors.push(`time:pace → за один кадр прошло ${(diff / 3600000).toFixed(1)} ч игрового времени`);
    });

    // ── инварианты после 400 дней ─────────────────
    run('invariants', () => {
        const ids = ev('Object.keys(FACTIONS)');
        for (const [k, v] of Object.entries(State.grid)) {
            if (!ids.includes(v)) { errors.push(`invariants → невалидная фракция в клетке ${k}: ${v}`); break; }
        }
        for (const u of State.units) {
            if (!ids.includes(u.owner)) { errors.push(`invariants → юнит ${u.id} с невалидным owner ${u.owner}`); break; }
            if (!Number.isFinite(u.hp) || !Number.isFinite(u.maxHp)) { errors.push(`invariants → юнит ${u.id} hp=${u.hp}/${u.maxHp}`); break; }
            if (u.pos === undefined) { errors.push(`invariants → юнит ${u.id} без позиции`); break; }
        }
        for (const r of ['equipment', 'rubles']) {
            if (!Number.isFinite(State.resources[r])) { errors.push(`invariants → ресурс ${r} = ${State.resources[r]}`); break; }
        }
        for (const war of State.wars) {
            if (!ids.includes(war.a) || !ids.includes(war.b)) { errors.push(`invariants → война с невалидным id: ${war.a}/${war.b}`); break; }
        }
        if (State.units.length > 500) errors.push(`invariants → юнитов ${State.units.length} (утечка?)`);
        if (State.buildQueue.length > 200) errors.push(`invariants → очередь строительства ${State.buildQueue.length}`);
    });

    const jsErrors = h.errors.filter(e => !/JSZip/.test(e));
    return { fid, errors: errors.concat(jsErrors), logs: h.logs };
}

// ─────────────────────────────────────────────────────────
//  Редактор модов + ZIP end-to-end (асинхронная фаза)
// ─────────────────────────────────────────────────────────
async function runModsPhase() {
    const errors = [];
    const h = boot();
    const w = h.window;
    // В jsdom-vm планировщик JSZip не крутится — берём ту же библиотеку из Node.
    // На игру это не влияет: в браузере используется vendor/jszip.min.js.
    const NodeJSZip = require('jszip');
    w.JSZip = NodeJSZip;
    w.prompt = () => 'prompted_id';
    w.confirm = () => true;

    h.ev(`
        State.init();
        AssetManager.init(function(){}, function(){});
        Renderer.init(document.getElementById("grid-canvas"));
        UI.init(); Engine.init();
        UI.loadBetaMap(); UI.startPlay('loners');
    `);

    const check = (cond, msg) => { if (!cond) errors.push('mods-e2e → ' + msg); };

    // 1. редактор: все вкладки рендерятся
    try {
        w.ModEditor.createNewMod();
        for (const tab of ['factions', 'leaders', 'weapons', 'armor', 'artifacts']) {
            w.ModEditor.showTab(tab);
            const html = w.document.getElementById('mod-editor-content').innerHTML;
            if (!html.trim()) errors.push(`mods-e2e → вкладка ${tab} пуста`);
        }
        w.ModEditor.saveMod();
        check(w.ModManager.loadedMods.some(m => m.id === w.ModEditor.currentMod.id), 'мод не сохранился из редактора');
        w.ModEditor.saveMod(); // повторное сохранение не должно дублировать
        const ids = w.ModManager.loadedMods.map(m => m.id);
        check(new Set(ids).size === ids.length, 'мод задублировался в списке');
    } catch (e) { errors.push('mods-e2e → редактор упал: ' + e.message); }

    // 2. настоящий ZIP: собираем архив и грузим через ModManager
    try {
        const JSZipC = NodeJSZip;
        const zip = new JSZipC();
        zip.file('mod.json', JSON.stringify({
            id: 'e2e_mod', name: 'E2E мод', version: '1.0.0', author: 'тест',
            description: 'проверка', factions: {}, leaders: {},
            weapons: { e2e_gun: { name: 'Е2Е-Пушка', type: 'rifle', damage: 42, price: 1000, icon: 'pm', description: '' } },
            armor: { e2e_armor: { name: 'Е2Е-Броня', type: 'light', protection: 12, price: 900, icon: 'leather_jacket', description: '' } },
            artifacts: {}, focuses: {}
        }));
        zip.file('images/armor/e2e_armor.png', Buffer.from('89504e470d0a1a0a', 'hex'), { binary: true });
        const blob = await zip.generateAsync({ type: 'nodebuffer' });
        const file = new w.File([blob], 'e2e.zip', { type: 'application/zip' });

        const result = await new Promise((resolve) => {
            w.ModManager.loadModArchive(file,
                (mod) => resolve({ ok: true, mod }),
                (err) => resolve({ ok: false, err }));
            setTimeout(() => resolve({ ok: false, err: 'таймаут' }), 8000);
        });
        check(result.ok, 'ZIP-мод не загрузился: ' + (result.err || ''));
        if (result.ok) {
            check(w.Items.weapons.e2e_gun && w.Items.weapons.e2e_gun.damage === 42, 'оружие из мода не применилось');
            check(w.Items.armor.e2e_armor, 'броня из мода не применилась');
            check(!!w.AssetManager._cache['armor/e2e_armor'], 'картинка брони мода не попала в кэш');
            check(w.ModManager.loadedMods.filter(m => m.id === 'e2e_mod').length === 1, 'мод загрузился дважды');
        }

        // 3. RAR должен отклоняться понятной ошибкой
        const rarFile = new w.File([blob], 'e2e.rar', { type: 'application/x-rar' });
        const rar = await new Promise((resolve) => {
            w.ModManager.loadModArchive(rarFile, () => resolve({ ok: true }), (e) => resolve({ ok: false, err: e }));
            setTimeout(() => resolve({ ok: false, err: 'таймаут' }), 3000);
        });
        check(!rar.ok && /zip/i.test(rar.err || ''), 'RAR не отклонён с понятным сообщением');
    } catch (e) { errors.push('mods-e2e → ZIP упал: ' + e.message); }

    return errors;
}

async function main() {
    const probe = boot();
    H = probe;
    const factions = ev('Object.keys(FACTIONS)');
    const all = [];
    for (const fid of factions) {
        const r = runFaction(fid);
        all.push(r);
    }

    const modErrors = await runModsPhase();
    for (const e of modErrors) {
        all.push({ fid: 'mods', errors: [e] });
    }

    let total = 0;
    const uniq = new Map();
    for (const r of all) {
        for (const e of r.errors) {
            total++;
            const key = e.split(' → ')[0] + '||' + e.split(' → ')[1];
            if (!uniq.has(key)) uniq.set(key, { count: 0, sample: e, factions: new Set() });
            const u = uniq.get(key);
            u.count++;
            u.factions.add(r.fid);
        }
    }

    console.log(`\nФракций: ${factions.length}, ошибок: ${total}, уникальных: ${uniq.size}\n`);
    for (const [key, u] of [...uniq.entries()].sort((a, b) => b[1].count - a[1].count)) {
        console.log(`✗ [${u.count}×] ${u.sample}`);
        console.log(`   фракции: ${[...u.factions].join(', ')}\n`);
    }
    const warns = new Map();
    for (const r of all) for (const l of r.logs) if (l[0] === 'warn') warns.set(l[1], (warns.get(l[1]) || 0) + 1);
    if (warns.size) {
        console.log('ПРЕДУПРЕЖДЕНИЯ:');
        for (const [m, c] of warns) console.log(`  ! [${c}×] ${m}`);
    }
    process.exit(uniq.size ? 1 : 0);
}

if (require.main === module) main();

module.exports = { runModsPhase, runFaction };

'use strict';

/**
 * Статический аудит проекта: проверяет ссылки из разметки на функции,
 * getElementById на существующие id, соответствие данных об ассетах.
 * Запуск: node tests/audit.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { boot } = require('./harness');

const ROOT = path.resolve(__dirname, '..');
const problems = [];
const add = (kind, msg) => problems.push({ kind, msg });

// ── 1. сбор всех onclick/oninput/onchange из HTML и JS-строк ───────────
function collectHandlers() {
    const files = ['index.html', ...fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f),
        ...fs.readdirSync(path.join(ROOT, 'js/ui')).map(f => 'js/ui/' + f)];
    const handlers = new Map();
    for (const rel of files) {
        const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        const re = /\bon(?:click|change|input|submit)\s*=\s*(?:"([^"]*)"|\\'([^\\']*)\\'|'([^']*)')/g;
        let m;
        while ((m = re.exec(src))) {
            const code = (m[1] || m[2] || m[3] || '').replace(/\\'/g, "'");
            if (!code.trim() || code.includes('<')) continue;
            const calls = [...code.matchAll(/([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\s*\(/g)];
            for (const c of calls) {
                const key = c[1] + '.' + c[2];
                if (!handlers.has(key)) handlers.set(key, new Set());
                handlers.get(key).add(rel);
            }
        }
    }
    return handlers;
}

// ── 2. getElementById из JS ────────────────────────────────────────────
function collectIds() {
    const ids = new Map();
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(p);
            else if (entry.name.endsWith('.js') && !p.includes('tests')) {
                const src = fs.readFileSync(p, 'utf8');
                for (const m of src.matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)/g)) {
                    const rel = path.relative(ROOT, p);
                    if (!ids.has(m[1])) ids.set(m[1], new Set());
                    ids.get(m[1]).add(rel);
                }
            }
        }
    };
    walk(path.join(ROOT, 'js'));
    return ids;
}

function main() {
    const h = boot();
    const w = h.window;
    h.run('entry', () => h.vm.runInContext(`
        State.init();
        AssetManager.init(function(){}, function(){});
        Renderer.init(document.getElementById("grid-canvas"));
        UI.init();
        Engine.init();
    `, h.ctx, { filename: 'entry' }));

    const ev = (expr) => h.ev(expr);

    // ── обработчики ─────────────────────────────
    for (const [key, files] of collectHandlers()) {
        const [obj, method] = key.split('.');
        let target;
        try { target = ev(obj); } catch (e) { target = undefined; }
        if (!target) { add('onclick', `${key} — объект не существует (${[...files].join(', ')})`); continue; }
        if (typeof target[method] !== 'function') add('onclick', `${key} — метод не найден (${[...files].join(', ')})`);
    }

    // ── id ──────────────────────────────────────
    const staticIds = new Set();
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const dom = new JSDOM(html);
    dom.window.document.querySelectorAll('[id]').forEach(el => staticIds.add(el.id));
    const jsIds = new Set();
    for (const dir of ['js', 'js/ui']) {
        for (const f of fs.readdirSync(path.join(ROOT, dir)).filter(f => f.endsWith('.js'))) {
            const src = fs.readFileSync(path.join(ROOT, dir, f), 'utf8');
            for (const m of src.matchAll(/id\s*=\s*\\?["']([\w-]+)\\?["']/g)) jsIds.add(m[1]);
        }
    }
    for (const [id, files] of collectIds()) {
        if (staticIds.has(id) || jsIds.has(id)) continue;
        add('getElementById', `"${id}" нигде не создаётся (${[...files].join(', ')})`);
    }

    // ── лидеры ──────────────────────────────────
    const FACTIONS = ev('FACTIONS');
    const leaders = ev('FACTION_LEADERS');
    const manifest = ev('AssetManager.manifest');
    for (const fid of Object.keys(FACTIONS)) {
        const f = FACTIONS[fid];
        if (!leaders[fid]) { add('data', `нет массива лидеров для фракции ${fid}`); continue; }
        if (!leaders[fid].some(l => l.id === f.defaultLeader)) add('data', `${fid}: defaultLeader "${f.defaultLeader}" отсутствует в FACTION_LEADERS`);
    }
    for (const fid of Object.keys(leaders)) {
        if (!FACTIONS[fid]) add('data', `FACTION_LEADERS содержит неизвестную фракцию ${fid}`);
        for (const l of leaders[fid]) {
            if (!manifest.leaders[l.portrait]) add('asset', `нет портрета "${l.portrait}" (лидер ${l.name} / ${fid})`);
        }
    }
    for (const key of Object.keys(manifest.factions)) {
        if (!FACTIONS[key]) add('asset', `манифест factions.${key} — такой фракции нет`);
    }
    for (const fid of Object.keys(FACTIONS)) {
        if (!manifest.factions[fid]) add('asset', `нет логотипа для фракции ${fid}`);
    }

    // ── артефакты ───────────────────────────────
    const ARTIFACTS = ev('ARTIFACTS');
    for (const key of Object.keys(ARTIFACTS)) {
        if (!manifest.artifacts[key]) add('asset', `артефакт ${key} без картинки в манифесте`);
        else if (!fs.existsSync(path.join(ROOT, manifest.artifacts[key]))) add('asset', `файл ${manifest.artifacts[key]} отсутствует`);
    }
    for (const key of Object.keys(manifest.artifacts)) {
        if (!ARTIFACTS[key]) add('data', `манифест artifacts.${key} — такого артефакта нет`);
    }

    // ── оружие/броня ────────────────────────────
    const Items = ev('Items');
    for (const cat of ['weapons', 'armor']) {
        const data = cat === 'weapons' ? Items.weapons : Items.armor;
        for (const key of Object.keys(data)) {
            if (!manifest[cat][key]) add('asset', `${cat}.${key} нет в манифесте ассетов`);
            else if (!fs.existsSync(path.join(ROOT, manifest[cat][key]))) add('asset', `файл ${manifest[cat][key]} отсутствует`);
        }
        for (const key of Object.keys(manifest[cat])) {
            if (!data[key]) add('data', `манифест ${cat}.${key} — предмета нет в Items`);
        }
    }

    // ── фокусы ──────────────────────────────────
    const focuses = ev('FACTION_FOCUSES');
    for (const fid of Object.keys(focuses)) {
        if (!FACTIONS[fid]) add('data', `FACTION_FOCUSES: неизвестная фракция ${fid}`);
        for (const f of focuses[fid]) {
            if (!f.id || !f.name) add('data', `фокус без id/name у ${fid}`);
            if (typeof f.effect !== 'function') add('data', `фокус ${fid}.${f.id} без effect()`);
        }
    }
    const noFocus = Object.keys(FACTIONS).filter(f => !focuses[f]);
    if (noFocus.length) add('data', `фракции без фокусов: ${noFocus.join(', ')}`);

    // ── сущности в манифесте icons/ui ───────────
    for (const cat of ['icons', 'ui']) {
        for (const key of Object.keys(manifest[cat])) {
            const rel = manifest[cat][key];
            if (!fs.existsSync(path.join(ROOT, rel))) add('asset', `файл ${rel} отсутствует`);
        }
    }

    // ── офлайн-режим: никаких внешних CDN ────────
    const htmlSrc = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const cssSrc  = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
    // SVG-неймспейсы (xmlns) — не сетевые запросы, их пропускаем
    const isNamespace = (url) => /w3\.org\/(2000\/svg|1999\/xhtml|1998\/Math)/.test(url);
    for (const [name, src] of [['index.html', htmlSrc], ['css/style.css', cssSrc]]) {
        for (const m of src.matchAll(/https?:\/\/[^"')\s]+/g)) {
            if (isNamespace(m[0])) continue;
            add('offline', `${name} ссылается на внешний ресурс: ${m[0]}`);
        }
    }
    for (const rel of ['js/assets.js']) {
        const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        for (const m of src.matchAll(/"(https?:\/\/[^"]+)"/g)) add('offline', `${rel}: внешний URL ${m[1]}`);
    }

    // ── не должно остаться блокирующих alert() ───
    const walkJs = (dir) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) walkJs(p);
            else if (e.name.endsWith('.js')) {
                const src = fs.readFileSync(p, 'utf8');
                const lines = src.split('\n');
                lines.forEach((line, i) => {
                    if (/\balert\s*\(/.test(line) && !/createAlert/.test(line)) {
                        add('alert', `${path.relative(ROOT, p)}:${i + 1} — блокирующий alert()`);
                    }
                });
            }
        }
    };
    walkJs(path.join(ROOT, 'js'));

    // ── у каждой иконки должен быть манифест-ключ ──
    const iconFiles = fs.readdirSync(path.join(ROOT, 'assets/icons')).map(f => f.replace(/\.png$/, ''));
    for (const icon of iconFiles) {
        if (!manifest.icons[icon]) add('asset', `assets/icons/${icon}.png не описан в манифесте`);
    }

    if (!problems.length) {
        console.log('Аудит: проблем не найдено.');
        process.exit(0);
    }
    const byKind = {};
    for (const p of problems) (byKind[p.kind] = byKind[p.kind] || []).push(p.msg);
    for (const [kind, list] of Object.entries(byKind)) {
        console.log(`\n=== ${kind.toUpperCase()} (${list.length}) ===`);
        list.forEach(m => console.log('  ✗ ' + m));
    }
    console.log(`\nВсего проблем: ${problems.length}`);
    process.exit(1);
}

main();

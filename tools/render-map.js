'use strict';

/**
 * Отрисовывает настоящую игровую карту в PNG через @napi-rs/canvas.
 * Полезно, чтобы глазами проверить результат без браузера.
 *
 * Запуск: node tools/render-map.js [out.png]
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || '/tmp/map.png';

(async () => {
    const W = 1200, H = 800;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // минимальный DOM-стаб, чтобы скрипты загрузились
    const stubEl = { style: {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, remove() {}, innerHTML: '', innerText: '', onclick: null };
    const sandbox = {
        console,
        navigator: { userAgent: 'node' },
        performance,
        document: {
            getElementById: () => stubEl,
            createElement: () => { const c = createCanvas(128, 128); c.style = {}; c.classList = { add() {}, remove() {}, toggle() {} }; return c; },
            querySelectorAll: () => [],
            body: { appendChild() {} },
        },
        window: { innerWidth: W, innerHeight: H, addEventListener() {}, dispatchEvent() {} },
        requestAnimationFrame: () => {},
        Image: class {},
        Set, Date, Math, parseInt, parseFloat, isNaN,
    };
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);

    for (const f of ['js/config.js', 'js/items.js', 'js/state.js', 'js/render.js', 'js/assets.js']) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f });
    }

    // подгружаем реальные ассеты в кэш AssetManager-совместимого вида
    const icons = {};
    for (const name of ['stalker', 'soldier', 'sniper', 'outpost', 'cache', 'lab']) {
        icons[name] = await loadImage(path.join(ROOT, 'assets/icons', name + '.png'));
    }

    vm.runInContext(`
        State.init();
        State.grid = generateBetaMap();
        State.isGameMode = true;
        State.myFactionId = 'duty';
        // та же логика, что в UI.centerCameraOnMap
        (function() {
            var keys = Object.keys(State.grid);
            var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            keys.forEach(function(pos) {
                var p = pos.split(",");
                var x = parseInt(p[0], 10), y = parseInt(p[1], 10);
                if (x < minX) minX = x; if (x > maxX) maxX = x;
                if (y < minY) minY = y; if (y > maxY) maxY = y;
            });
            State.camera.x = ((minX + maxX + 1) / 2) * CELL_SIZE;
            State.camera.y = ((minY + maxY + 1) / 2) * CELL_SIZE;
            var w = (maxX - minX + 1) * CELL_SIZE;
            var h = (maxY - minY + 1) * CELL_SIZE;
            State.camera.zoom = Math.min((__canvas.width - 80) / w, (__canvas.height - 120) / h);
        })();
        Renderer.ctx = __ctx;
        Renderer.canvas = __canvas;
        AssetManager.get = function(cat, key) { return __icons[key] || null; };
        Renderer.draw();
    `, Object.assign(sandbox, { __ctx: ctx, __canvas: canvas, __icons: icons }), { filename: 'render' });

    fs.writeFileSync(OUT, canvas.toBuffer('image/png'));
    console.log('карта отрисована:', OUT);
})();

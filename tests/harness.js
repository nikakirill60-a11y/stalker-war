'use strict';

/**
 * Тестовый стенд: загружает игру в jsdom, подменяет canvas/Image,
 * прогоняет основные сценарии и собирает ошибки.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');

function makeCtx(canvas) {
    const gradient = { addColorStop() {} };
    const base = {
        canvas,
        createLinearGradient: () => gradient,
        createRadialGradient: () => gradient,
        measureText: (t) => ({ width: String(t).length * 6 }),
        getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h * 4)) }),
        putImageData() {},
        setLineDash() {},
        getLineDash: () => [],
        isPointInPath: () => false,
    };
    return new Proxy(base, {
        get(target, prop) {
            if (prop in target) return target[prop];
            if (typeof prop === 'symbol') return undefined;
            // неизвестный метод — no-op, неизвестное свойство — undefined
            return target['__methods_' + String(prop)] || (target['__methods_' + String(prop)] = function () {});
        },
        set(target, prop, value) { target[prop] = value; return true; },
    });
}

function boot(options = {}) {
    const htmlPath = path.join(ROOT, 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Вырезаем внешние скрипты (CDN) и инлайн-точку входа — их запускаем сами
    html = html.replace(/<script[^>]*src="https?:\/\/[^"]*"[^>]*><\/script>/g, '');
    const scripts = [];
    html = html.replace(/<script[^>]*src="((?:js|vendor)\/[^"]*)"[^>]*><\/script>/g, (m, src) => {
        scripts.push(src);
        return '';
    });
    html = html.replace(/<script>[\s\S]*?<\/script>/g, '');

    const dom = new JSDOM(html, {
        url: 'http://localhost/index.html',
        runScripts: 'outside-only',
        pretendToBeVisual: true,
    });
    const { window } = dom;
    const ctx = dom.getInternalVMContext();
    const errors = [];

    // ── console capture ──────────────────────────────
    const logs = [];
    const origLog = window.console.log;
    window.console.log = (...a) => { logs.push(['log', a.join(' ')]); if (options.verbose) origLog.apply(window.console, a); };
    window.console.warn = (...a) => { logs.push(['warn', a.join(' ')]); };
    window.console.error = (...a) => { logs.push(['error', a.join(' ')]); errors.push('console.error: ' + a.join(' ')); };

    window.addEventListener('error', (e) => errors.push('window.error: ' + (e.message || e.error)));
    window.addEventListener('unhandledrejection', (e) => errors.push('unhandledrejection: ' + e.reason));

    // ── stubs ────────────────────────────────────────
    const ctxs = new Map();
    window.HTMLCanvasElement.prototype.getContext = function () {
        if (!ctxs.has(this)) ctxs.set(this, makeCtx(this));
        return ctxs.get(this);
    };
    window.HTMLCanvasElement.prototype.toDataURL = function () { return 'data:image/png;base64,'; };

    class FakeImage {
        constructor() { this.width = 128; this.height = 128; this.naturalWidth = 128; this.naturalHeight = 128; this._src = ''; }
        set src(v) {
            this._src = v;
            const ok = !options.failAssets || !String(v).includes(options.failAssets);
            setTimeout(() => {
                if (ok) { if (this.onload) this.onload({ type: 'load' }); }
                else { if (this.onerror) this.onerror({ type: 'error' }); }
            }, 0);
        }
        get src() { return this._src; }
        addEventListener(t, fn) { if (t === 'load') this.onload = fn; if (t === 'error') this.onerror = fn; }
    }
    window.Image = FakeImage;
    window.alert = (m) => { logs.push(['alert', String(m)]); };
    if (!window.URL.createObjectURL) window.URL.createObjectURL = () => 'blob:stub';
    if (!window.URL.revokeObjectURL) window.URL.revokeObjectURL = () => {};

    // ── load scripts ─────────────────────────────────
    for (const src of scripts) {
        const file = path.join(ROOT, src);
        const code = fs.readFileSync(file, 'utf8');
        try {
            vm.runInContext(code, ctx, { filename: src });
        } catch (e) {
            errors.push(`LOAD ${src}: ${e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e}`);
        }
    }

    const g = (name) => window[name];
    const run = (label, fn) => {
        try { return fn(); }
        catch (e) { errors.push(`${label}: ${e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e}`); }
    };

    const ev = (expr) => vm.runInContext(expr, ctx);

    return { dom, window, ctx, vm, errors, logs, g, run, ev, scripts };
}

module.exports = { boot, makeCtx };

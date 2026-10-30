'use strict';

/**
 * Подготовка ассетов (идемпотентно).
 *
 * 1. Все файлы assets/**.png на самом деле были WebP — конвертируем в настоящий PNG.
 * 2. Нумерованные артефакты assets/art/N.png переименовываем в смысловые ключи
 *    в порядке объявления в js/assets.js (ARTIFACTS и манифест совпадают по порядку).
 *
 * Запуск: node tools/prepare-assets.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

const ARTIFACT_ORDER = [
    // электрические
    'flash', 'moonlight', 'sparkler', 'battery',
    // химические
    'stoneblood', 'meatpiece', 'soul',
    // гравитационные
    'slime', 'slug', 'mica', 'gravi', 'goldfish', 'twist',
    // термальные
    'jellyfish', 'stoneflower', 'nightstar', 'fireball', 'crystal', 'drops',
    // защитные
    'kolobok', 'thorn', 'crystalthorn', 'urchin',
    // редкие
    'mammasbeads', 'dummy', 'pellicle', 'spring',
];

function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else out.push(p);
    }
    return out;
}

async function toPng(file) {
    const buf = fs.readFileSync(file);
    if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return false;
    const png = await sharp(buf).png({ compressionLevel: 9, palette: true }).toBuffer();
    fs.writeFileSync(file, png);
    return true;
}

(async () => {
    let converted = 0, skipped = 0, renamed = 0;

    for (const file of walk(ASSETS).filter(f => f.endsWith('.png'))) {
        const base = path.basename(file, '.png');
        const isArt = path.dirname(file) === path.join(ASSETS, 'art');

        if (isArt && /^\d+$/.test(base)) {
            const target = ARTIFACT_ORDER[parseInt(base, 10) - 1];
            if (!target) {
                console.warn(`⚠ нет ключа для assets/art/${base}.png — пропуск`);
                skipped++;
                continue;
            }
            const dst = path.join(ASSETS, 'art', target + '.png');
            const png = await sharp(file).png({ compressionLevel: 9, palette: true }).toBuffer();
            fs.writeFileSync(dst, png);
            fs.unlinkSync(file);
            renamed++;
            continue;
        }

        if (await toPng(file)) converted++;
        else skipped++;
    }

    console.log(`Артефактов переименовано: ${renamed}`);
    console.log(`Файлов сконвертировано WebP→PNG: ${converted}`);
    console.log(`Уже были PNG: ${skipped}`);

    const left = walk(ASSETS).filter(f => f.endsWith('.png')).map(f => {
        const b = fs.readFileSync(f);
        return b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? null : f;
    }).filter(Boolean);
    if (left.length) {
        console.error('Остались не-PNG файлы:', left);
        process.exit(1);
    }
})();

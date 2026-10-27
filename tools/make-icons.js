'use strict';

/**
 * Генерирует отсутствующие иконки (юниты/постройки) и логотип из SVG,
 * а также приводит портреты/фоны к нужным размерам.
 *
 * Запуск: node tools/make-icons.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const A = (p) => path.join(ROOT, 'assets', p);

const GREEN = '#4ade80';
const AMBER = '#c8a84b';
const DARK = '#0a140a';

const ICONS = {
    // Сталкер в капюшоне с оружием
    stalker: `
        <path d="M32 60 Q36 30 64 28 Q92 30 96 60 L96 84 Q64 76 32 84 Z" fill="${DARK}" stroke="${GREEN}" stroke-width="6"/>
        <circle cx="64" cy="52" r="12" fill="none" stroke="${GREEN}" stroke-width="6"/>
        <path d="M30 112 Q34 86 64 86 Q94 86 98 112" fill="none" stroke="${GREEN}" stroke-width="6"/>
        <path d="M84 74 L112 96" stroke="${AMBER}" stroke-width="7" stroke-linecap="round"/>`,
    // Боец в шлеме
    soldier: `
        <path d="M38 52 Q38 26 64 26 Q90 26 90 52 L90 60 L38 60 Z" fill="${DARK}" stroke="${GREEN}" stroke-width="6"/>
        <path d="M34 68 L94 68 L94 78 L34 78 Z" fill="${DARK}" stroke="${GREEN}" stroke-width="5"/>
        <path d="M28 112 Q30 84 64 84 Q98 84 100 112" fill="none" stroke="${GREEN}" stroke-width="6"/>
        <path d="M92 62 L114 74" stroke="${AMBER}" stroke-width="7" stroke-linecap="round"/>`,
    // Снайпер: прицел
    sniper: `
        <circle cx="64" cy="64" r="34" fill="none" stroke="${GREEN}" stroke-width="6"/>
        <circle cx="64" cy="64" r="10" fill="none" stroke="${AMBER}" stroke-width="6"/>
        <path d="M64 18 L64 42 M64 86 L64 110 M18 64 L42 64 M86 64 L110 64" stroke="${GREEN}" stroke-width="6" stroke-linecap="round"/>
        <path d="M40 104 L104 40" stroke="${AMBER}" stroke-width="6" stroke-linecap="round" opacity="0.85"/>`,
    // Аванпост: вышка
    outpost: `
        <path d="M40 36 L88 36 L96 52 L32 52 Z" fill="${DARK}" stroke="${GREEN}" stroke-width="6"/>
        <path d="M44 52 L30 112 M84 52 L98 112" stroke="${GREEN}" stroke-width="6" stroke-linecap="round"/>
        <path d="M34 88 L94 88 M44 52 L84 52" stroke="${GREEN}" stroke-width="5"/>
        <path d="M64 36 L64 14 L86 22 L64 30" fill="${AMBER}" stroke="${AMBER}" stroke-width="4"/>`,
    // Схрон: ящик
    cache: `
        <rect x="24" y="40" width="80" height="64" fill="${DARK}" stroke="${GREEN}" stroke-width="6"/>
        <path d="M24 56 L104 56 M24 88 L104 88 M64 40 L64 104" stroke="${GREEN}" stroke-width="5"/>
        <path d="M48 40 L48 24 L80 24 L80 40" fill="none" stroke="${AMBER}" stroke-width="6" stroke-linejoin="round"/>`,
    // Лаборатория: колба
    lab: `
        <path d="M52 18 L52 46 L28 102 Q26 110 36 110 L92 110 Q102 110 100 102 L76 46 L76 18 Z"
              fill="${DARK}" stroke="${GREEN}" stroke-width="6" stroke-linejoin="round"/>
        <path d="M42 84 L86 84 L96 104 Q97 108 92 108 L36 108 Q31 108 32 104 Z" fill="${GREEN}" opacity="0.35"/>
        <path d="M44 18 L84 18" stroke="${AMBER}" stroke-width="7" stroke-linecap="round"/>
        <circle cx="56" cy="92" r="4" fill="${AMBER}"/>
        <circle cx="72" cy="98" r="3" fill="${AMBER}"/>`,
    // Аномалия: вихрь
    anomaly: `
        <circle cx="64" cy="64" r="10" fill="${AMBER}" opacity="0.9"/>
        <path d="M64 26 A38 38 0 0 1 102 64" fill="none" stroke="${GREEN}" stroke-width="7" stroke-linecap="round"/>
        <path d="M64 102 A38 38 0 0 1 26 64" fill="none" stroke="${GREEN}" stroke-width="7" stroke-linecap="round"/>
        <path d="M64 44 A20 20 0 0 1 84 64" fill="none" stroke="${AMBER}" stroke-width="6" stroke-linecap="round"/>
        <path d="M64 84 A20 20 0 0 1 44 64" fill="none" stroke="${AMBER}" stroke-width="6" stroke-linecap="round"/>
        <circle cx="64" cy="64" r="52" fill="none" stroke="${GREEN}" stroke-width="3" opacity="0.4"/>`,
    // Радиация: трилистник
    radiation: `
        <circle cx="64" cy="64" r="8" fill="${AMBER}"/>
        <path d="M64 64 L64 20 A44 44 0 0 1 102 86 Z" fill="${GREEN}" opacity="0.85"/>
        <path d="M64 64 L25 86 A44 44 0 0 1 25 42 Z" fill="${GREEN}" opacity="0.85"/>
        <path d="M64 64 L102 42 A44 44 0 0 1 102 86 Z" fill="${GREEN}" opacity="0.85"/>
        <circle cx="64" cy="64" r="50" fill="none" stroke="${AMBER}" stroke-width="4" opacity="0.6"/>`,
};

const LOGO = `
    <circle cx="256" cy="256" r="210" fill="#0a140a" stroke="${GREEN}" stroke-width="10"/>
    <circle cx="256" cy="256" r="176" fill="none" stroke="${AMBER}" stroke-width="4" opacity="0.5"/>
    <circle cx="256" cy="256" r="34" fill="${AMBER}"/>
    <path d="M256 256 L256 92 A164 164 0 0 1 398 338 Z" fill="${GREEN}" opacity="0.85"/>
    <path d="M256 256 L112 338 A164 164 0 0 1 112 174 Z" fill="${GREEN}" opacity="0.85"/>
    <path d="M256 256 L398 174 A164 164 0 0 1 398 338 Z" fill="${GREEN}" opacity="0.6"/>
    <path d="M150 400 L362 400" stroke="${AMBER}" stroke-width="6" opacity="0.6"/>
`;

async function renderSvg(svg, file, size) {
    await sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9, palette: true }).toFile(file);
}

(async () => {
    fs.mkdirSync(A('icons'), { recursive: true });

    for (const [name, body] of Object.entries(ICONS)) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">${body}</svg>`;
        await renderSvg(svg, A(`icons/${name}.png`), 128);
        console.log('иконка:', name);
    }

    const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${LOGO}</svg>`;
    await renderSvg(logoSvg, A('ui/logo.png'), 512);
    console.log('логотип: ui/logo.png');

    // Портреты лидеров — 165×108 с фокусом на лице
    for (const name of ['jackal', 'renegade_chief']) {
        const src = A(`leaders/${name}.png`);
        const meta = await sharp(src).metadata();
        const w = meta.width, h = meta.height;
        // центр лица примерно на 42% ширины, 32% высоты
        const cropW = Math.round(w * 0.42);
        const cropH = Math.round(cropW * 108 / 165);
        const left = Math.max(0, Math.min(w - cropW, Math.round(w * 0.42 - cropW / 2)));
        const top = Math.max(0, Math.min(h - cropH, Math.round(h * 0.30 - cropH / 2)));
        await sharp(src).extract({ left, top, width: cropW, height: cropH }).resize(165, 108, { fit: 'cover' })
            .png({ compressionLevel: 9 }).toFile(A(`leaders/${name}.tmp.png`));
        fs.renameSync(A(`leaders/${name}.tmp.png`), src);
        console.log('портрет:', name, `${w}x${h} → 165x108`);
    }

    // Фон меню — ограничиваем разрешение
    const bg = A('ui/background.png');
    const bgMeta = await sharp(bg).metadata();
    await sharp(bg).resize(1600, null, { withoutEnlargement: true })
        .jpeg({ quality: 82 }).toFile(A('ui/background.jpg'));
    fs.unlinkSync(bg);
    console.log('фон: ui/background.jpg', bgMeta.width + 'x' + bgMeta.height);

    // Экран загрузки — сильно ужимаем (был 2 МБ)
    const loadSrc = A('ui/loading.png');
    const loadMeta = await sharp(loadSrc).metadata();
    await sharp(loadSrc).resize(1280, null, { withoutEnlargement: true })
        .jpeg({ quality: 80 }).toFile(A('ui/loading.jpg'));
    fs.unlinkSync(loadSrc);
    console.log('загрузка: ui/loading.jpg', loadMeta.width + 'x' + loadMeta.height);
})();

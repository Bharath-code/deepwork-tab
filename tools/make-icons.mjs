import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const tile = (ring, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="${bg}"/><g transform="translate(16 16) scale(.75)"><path d="M86.452 23.851A46 46 0 0 1 108.138 51.045M109.388 56.521A46 46 0 0 1 101.648 90.431M98.146 94.823A46 46 0 0 1 66.808 109.914M61.192 109.914A46 46 0 0 1 29.854 94.823M26.352 90.431A46 46 0 0 1 18.612 56.521M19.862 51.045A46 46 0 0 1 41.548 23.851" fill="none" stroke="${ring}" stroke-width="14"/><path d="M46.609 21.414A46 46 0 0 1 81.391 21.414" fill="none" stroke="#F5C46B" stroke-width="14"/></g></svg>`;

const small = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="#12151B"/><circle cx="64" cy="64" r="38" fill="none" stroke="#E8E6E1" stroke-width="20" stroke-dasharray="48 24 48 24 48 24" transform="rotate(-70 64 64)" opacity=".9"/><path d="M42 33.5A38 38 0 0 1 86 33.5" fill="none" stroke="#F5C46B" stroke-width="20"/></svg>`;

writeFileSync('brand/icon-tile.svg', tile('#E8E6E1', '#12151B'));
writeFileSync('brand/icon-tile-16.svg', small);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = (svg, size, file) => {
  const page = join(mkdtempSync(join(tmpdir(), 'icon-')), 'i.html');
  const markup = readFileSync(svg, 'utf8').replace('<svg ', `<svg width="${size}" height="${size}" `);
  writeFileSync(page, `<body style="margin:0;background:transparent">${markup}`);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000', `--window-size=${size},${size}`, `--screenshot=${file}`, `file://${page}`], { stdio: 'ignore' });
};
out('brand/icon-tile.svg', 128, 'icons/icon128.png');
out('brand/icon-tile.svg', 48, 'icons/icon48.png');
out('brand/icon-tile-16.svg', 16, 'icons/icon16.png');

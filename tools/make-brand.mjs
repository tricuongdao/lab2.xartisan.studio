// Generate the Xartisan Studio brand mark (SVG) from Playfair Display Italic.
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';

const fontBuf = fs.readFileSync('tools/fonts/PlayfairDisplay-Italic.ttf');
const font = opentype.parse(fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength));
const glyph = font.charToGlyph('X');
const upm = font.unitsPerEm;
const fontSize = 1000;
const glyphPath = glyph.getPath(0, 0, fontSize);
const box = glyphPath.getBoundingBox(); // y grows downward in opentype path

const W = 100;
const H = 88;
const pad = 4;
const scale = Math.min((W - pad * 2) / (box.x2 - box.x1), (H - pad * 2) / (box.y2 - box.y1));
const w = (box.x2 - box.x1) * scale;
const h = (box.y2 - box.y1) * scale;
const tx = (W - w) / 2 - box.x1 * scale;
const ty = (H - h) / 2 - box.y1 * scale;

const xPath = glyphPath.toPathData(2);

const sparkle = `<path d="M0 8.00302C1.89111 7.7296 4.08244 7.7401 5.70205 6.59217C7.745 5.14418 7.64415 2.20892 8.00312 0C8.0478 0.47793 8.12025 1.04611 8.18318 1.52395C8.37129 2.95222 8.56725 4.62808 9.47319 5.79966C10.4724 7.09182 12.0535 7.48217 13.5896 7.71188C14.391 7.8317 15.195 7.90422 16 8.00088C14.4316 8.17452 12.6452 8.30125 11.1925 8.90141L10.9818 8.99693C10.6357 9.18514 10.4374 9.29011 10.1207 9.5408C8.8049 10.582 8.48801 12.2774 8.26522 13.8519C8.169 14.5669 8.08168 15.2829 8.00325 16C7.94179 15.6667 7.91116 15.2367 7.86504 14.8908C7.6553 13.3171 7.50553 11.4215 6.47773 10.14C5.39076 8.78483 3.59886 8.43822 1.96915 8.2259C1.31362 8.14423 0.657196 8.06993 0 8.00302Z"/>`;

function mark({ color, sparkleColor = color, sparkleScale = 1 }) {
  // sparkle sits at the optical top-right of the X, scaled into the canvas
  const s = 11 * sparkleScale;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none"><g fill="${color}"><path transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})" d="${xPath}"/></g><g transform="translate(${(W - s - 1).toFixed(2)} 0) scale(${(s / 16).toFixed(4)})" fill="${sparkleColor}" opacity="0.9">${sparkle}</g></svg>`;
}

const dark = mark({ color: '#141210' });
const white = mark({ color: '#FFFFFF' });

const dir = path.join('site', 'images', 'svg');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'logo-xt2.svg'), dark);
fs.writeFileSync(path.join(dir, 'logo2-xt2.svg'), white);

// footer mark: square canvas, same art
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 99 99" fill="none"><g transform="translate(0 5.5) scale(0.99)"><g fill="#FFFFFF"><path transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})" d="${xPath}"/></g><g transform="translate(${(W - 11 - 1).toFixed(2)} 0) scale(${(11 / 16).toFixed(4)})" fill="#FFFFFF" opacity="0.9">${sparkle}</g></g></svg>`;
fs.writeFileSync(path.join(dir, 'logoSimple-xt2.svg'), square);

console.log('glyph bbox', box, 'scale', scale.toFixed(3), 'w', w.toFixed(1), 'h', h.toFixed(1));
console.log('wrote brand marks');

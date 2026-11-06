import fs from 'node:fs';
import { connectTo, closeTarget, sleep } from './cdp.mjs';

const url = process.argv[2] || 'http://127.0.0.1:4173/';
const out = process.argv[3] || 'inspect/tour';
const shots = Number(process.argv[4] || 16);
fs.mkdirSync(out, { recursive: true });

const s = await connectTo({ url: 'about:blank' });
await s.send('Page.navigate', { url });
await s.waitEvent('Page.loadEventFired', 45000).catch(() => null);
await sleep(4500);

const start = await s.eval(`(() => { const el = [...document.querySelectorAll('div,button')].find(e => /^Click to start$/.test((e.textContent||'').trim()) && e.getBoundingClientRect().width>40 && e.getBoundingClientRect().width<400); if(!el) return null; const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
console.log('start button', JSON.stringify(start));
if (start) {
  for (const type of ['mousePressed', 'mouseReleased']) await s.send('Input.dispatchMouseEvent', { type, x: start.x, y: start.y, button: 'left', clickCount: 1 });
}
await sleep(3000);
await s.eval('window.scrollTo({top:0,behavior:"instant"})');
await sleep(2000);
await s.screenshot(`${out}/00-hero.png`);

const docH = await s.eval('document.documentElement.scrollHeight');
const step = Math.floor((docH - 900) / (shots - 1));
for (let i = 1; i < shots; i++) {
  await s.eval(`window.scrollTo({top:${i * step},behavior:"instant"})`);
  await sleep(1600);
  await s.screenshot(`${out}/${String(i).padStart(2, '0')}-scroll.png`);
}
console.log('done', docH, step);
await closeTarget(s.targetId);
process.exit(0);

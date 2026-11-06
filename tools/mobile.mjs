import fs from 'node:fs';
import { connectTo, closeTarget, sleep } from './cdp.mjs';

fs.mkdirSync('inspect/mobile', { recursive: true });
const s = await connectTo({ url: 'about:blank' });
await s.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await s.send('Emulation.setTouchEmulationEnabled', { enabled: true });
await s.send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
await s.waitEvent('Page.loadEventFired', 40000).catch(() => null);
await sleep(4500);
await s.screenshot('inspect/mobile/01-intro.png');

const start = await s.eval(`(() => { const el = [...document.querySelectorAll('div,button')].find(e => /^Click to start$/.test((e.textContent||'').trim()) && e.getBoundingClientRect().width>40); if(!el) return null; const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
console.log('start', JSON.stringify(start));
if (start) {
  for (const type of ['mousePressed', 'mouseReleased']) await s.send('Input.dispatchMouseEvent', { type, x: start.x, y: start.y, button: 'left', clickCount: 1 });
}
await sleep(3500);
await s.screenshot('inspect/mobile/02-hero.png');
const docH = await s.eval('document.documentElement.scrollHeight');
for (const [i, frac] of [0.25, 0.5, 0.75, 0.98].entries()) {
  await s.eval(`window.scrollTo({top:${Math.round(docH * frac)},behavior:'instant'})`);
  await sleep(1500);
  await s.screenshot(`inspect/mobile/0${i + 3}-scroll.png`);
}
await s.send('Page.navigate', { url: 'http://127.0.0.1:4173/contacts' });
await s.waitEvent('Page.loadEventFired', 30000).catch(() => null);
await sleep(3000);
await s.screenshot('inspect/mobile/07-contacts.png');
console.log('docH', docH);
await closeTarget(s.targetId);
process.exit(0);

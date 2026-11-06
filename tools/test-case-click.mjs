// Regression check: the homepage project cards must not navigate anywhere.
import { connectTo, closeTarget, sleep } from './cdp.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4173';
const s = await connectTo({ url: 'about:blank' });
const errors = [];
s.on('Runtime.consoleAPICalled', (e) => { if (e.type === 'error') errors.push(e.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 140)); });

await s.send('Network.setUserAgentOverride', {
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  platform: 'iPhone',
});
await s.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await s.send('Emulation.setTouchEmulationEnabled', { enabled: true });
await s.send('Page.navigate', { url: BASE + '/' });
await s.waitEvent('Page.loadEventFired', 40000).catch(() => null);
await sleep(5000);

const before = await s.eval('({ path: location.pathname, title: document.title, caseEls: document.querySelectorAll(".case-debug").length })');
console.log('loaded:', JSON.stringify(before));

// Force one project card into view without touching Vue state, then click it.
const rect = await s.eval(`(() => {
  const el = [...document.querySelectorAll('.case-debug')].find((e) => e.children.length) || document.querySelector('.case-debug');
  if (!el) return null;
  el.style.display = 'flex';
  el.style.transform = 'none';
  el.style.bottom = '220px';
  el.style.left = '0';
  el.style.height = '200px';
  const inner = el.firstElementChild;
  if (inner) { inner.style.opacity = '1'; inner.style.transform = 'none'; }
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80) };
})()`);
console.log('project card:', JSON.stringify(rect));

if (rect) {
  for (const type of ['mousePressed', 'mouseReleased']) {
    await s.send('Input.dispatchMouseEvent', { type, x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
  }
  await sleep(1500);
}

const after = await s.eval('({ path: location.pathname, hash: location.hash, title: document.title })');
console.log('after click:', JSON.stringify(after));
console.log('NAVIGATED:', before.path !== after.path ? 'YES (FAIL)' : 'no (pass)');
console.log('ERRORS:', JSON.stringify([...new Set(errors)].slice(0, 4)));

await closeTarget(s.targetId);
process.exit(0);


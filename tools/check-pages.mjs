import fs from 'node:fs';
import path from 'node:path';
import { connectTo, closeTarget, sleep } from './cdp.mjs';

const base = process.argv[2] || 'http://127.0.0.1:4173';
const pages = (process.argv[3] || '/,/contacts,/cases/ppf-dong-nai,/cases/engmind-study').split(',');
fs.mkdirSync('inspect/pages', { recursive: true });

for (const p of pages) {
  const s = await connectTo({ url: 'about:blank' });
  const errors = [];
  const bad = [];
  s.on('Runtime.consoleAPICalled', (e) => { if (e.type === 'error') errors.push(e.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)); });
  s.on('Log.entryAdded', (e) => { if (e.entry.level === 'error') errors.push(`[${e.entry.url || ''}] ${e.entry.text}`.slice(0, 200)); });
  s.on('Network.responseReceived', (r) => { if (r.response.status >= 400) bad.push(`${r.response.status} ${r.response.url}`); });
  await s.send('Page.navigate', { url: base + p });
  await s.waitEvent('Page.loadEventFired', 30000).catch(() => null);
  await sleep(4000);
  const info = await s.eval(`(() => ({ title: document.title, text: document.body.innerText.replace(/\\n{2,}/g,'\\n').slice(0, 700), canvases: document.querySelectorAll('canvas').length, videos: [...document.querySelectorAll('video')].map(v => ({src: v.currentSrc || v.src, ready: v.readyState, w: v.videoWidth})) }))()`);
  const name = (p === '/' ? 'home' : p.replace(/\//g, '_')).replace(/^_/, '');
  await s.screenshot(path.join('inspect/pages', name + '.png'));
  console.log(`\n=== ${p} | ${info.title} | canvas:${info.canvases} | videos:${JSON.stringify(info.videos)}`);
  console.log(info.text);
  if (errors.length) console.log('ERRORS:', JSON.stringify([...new Set(errors)].slice(0, 6), null, 1));
  if (bad.length) console.log('BAD:', JSON.stringify([...new Set(bad)].slice(0, 8)));
  await closeTarget(s.targetId);
}
process.exit(0);

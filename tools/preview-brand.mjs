import fs from 'node:fs';
import { connectTo, closeTarget, sleep } from './cdp.mjs';

const s = await connectTo({ url: 'about:blank' });
const { frameTree } = await s.send('Page.getFrameTree');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:PF;src:url('http://127.0.0.1:4173/_nuxt/fonts-vi/playfair-400i-latin.woff2') format('woff2');font-style:italic;font-weight:400}
@font-face{font-family:BV;src:url('http://127.0.0.1:4173/_nuxt/fonts-vi/be-vietnam-pro-300-latin.woff2') format('woff2');font-weight:300}
body{margin:0;font-family:BV,sans-serif;background:#efeae2;color:#141210}
.row{display:flex;gap:40px;padding:48px}
.card{background:#fff;border-radius:18px;padding:32px;display:flex;align-items:center;gap:24px}
.dark{background:#111;color:#fff}
img.mark{height:88px;width:auto}
.word{font-family:PF,serif;font-style:italic;font-size:64px;letter-spacing:-1px}
.small{font-size:13px;letter-spacing:.18em;text-transform:uppercase;opacity:.55;font-family:BV}
</style></head><body>
<div class="row">
  <div class="card"><img class="mark" src="http://127.0.0.1:4173/images/svg/logo-xt2.svg"><div><div class="word">Xartisan Studio</div><div class="small">Digital solutions &amp; web design</div></div></div>
  <div class="card dark"><img class="mark" src="http://127.0.0.1:4173/images/svg/logoSimple-xt2.svg"><div><div class="word">Xartisan Studio</div><div class="small">Digital solutions &amp; web design</div></div></div>
</div>
<div class="row" style="padding-top:0">
  <div class="card"><img src="http://127.0.0.1:4173/images/svg/logo-xt2.svg" style="height:36px"><img src="http://127.0.0.1:4173/images/svg/logo-xt2.svg" style="height:24px"><img src="http://127.0.0.1:4173/images/svg/logo-xt2.svg" style="height:16px"></div>
</div>
</body></html>`;
await s.send('Page.setDocumentContent', { frameId: frameTree.frame.id, html });
await s.send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 460, deviceScaleFactor: 2, mobile: false });
await sleep(1500);
await s.screenshot('inspect/brand-preview.png');
console.log('ok');
await closeTarget(s.targetId);

// Generate og:image and favicon by rendering HTML in headless Chromium.
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { connectTo, closeTarget, sleep } from './cdp.mjs';
import { startServer } from './server.mjs';

const local = startServer(4188);
await once(local, 'listening');
const ASSET = 'http://127.0.0.1:4188';
const s = await connectTo({ url: 'about:blank' });
const { frameTree } = await s.send('Page.getFrameTree');
const frameId = frameTree.frame.id;

const fontFaces = `
@font-face{font-family:PF;src:url('${ASSET}/_nuxt/fonts-vi/playfair-400i-latin.woff2') format('woff2');font-style:italic;font-weight:400}
@font-face{font-family:BV;src:url('${ASSET}/_nuxt/fonts-vi/be-vietnam-pro-300-latin.woff2') format('woff2');font-weight:300}
`;

const og = `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFaces}
*{box-sizing:border-box}
body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:BV,sans-serif;color:#191712;
  background:
   radial-gradient(120% 90% at 12% 8%, #f6e6f4 0%, rgba(246,230,244,0) 55%),
   radial-gradient(90% 80% at 88% 18%, #dfe8ff 0%, rgba(223,232,255,0) 60%),
   radial-gradient(90% 90% at 70% 100%, #d8f3f6 0%, rgba(216,243,246,0) 65%),
   linear-gradient(160deg,#f3eee6 0%, #efe9f7 45%, #e8f2f6 100%);}
.wrap{position:relative;height:100%;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}
.top{display:flex;align-items:center;gap:20px}
.top img{height:52px}
.kicker{font-size:15px;letter-spacing:.28em;text-transform:uppercase;opacity:.55}
h1{font-family:PF,serif;font-style:italic;font-weight:400;font-size:132px;line-height:.92;margin:0;letter-spacing:-3px}
h1 span{display:block}
.sub{font-size:26px;opacity:.62;margin-top:26px;letter-spacing:.01em}
.foot{display:flex;justify-content:space-between;align-items:flex-end;font-size:17px;opacity:.55;letter-spacing:.06em}
.star{position:absolute;right:96px;top:96px;width:80px;opacity:.5}
</style></head><body><div class="wrap">
  <div class="top"><img src="${ASSET}/images/svg/logo-xt2.svg"><div class="kicker">Xartisan Studio</div></div>
  <div>
    <h1><span>Digital solutions</span><span>&amp; web design</span></h1>
    <div class="sub">Stories told through light, motion and sound.</div>
  </div>
  <div class="foot"><div>xartisan.studio</div><div>hello@xartisan.studio</div></div>
</div></body></html>`;

await s.send('Page.setDocumentContent', { frameId, html: og });
await s.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
await sleep(1200);
await s.screenshot('site/OG.png');
console.log('wrote site/OG.png');

const fav = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:256px;height:256px;background:transparent}
.card{width:256px;height:256px;border-radius:58px;background:#141210;display:flex;align-items:center;justify-content:center}
img{width:150px;height:auto}
</style></head><body><div class="card"><img src="${ASSET}/images/svg/logo2-xt2.svg"></div></body></html>`;

await s.send('Page.setDocumentContent', { frameId, html: fav });
await s.send('Emulation.setDeviceMetricsOverride', { width: 256, height: 256, deviceScaleFactor: 1, mobile: false });
await s.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
await sleep(800);
await s.screenshot('site/fav.png');
console.log('wrote site/fav.png');

await closeTarget(s.targetId);
local.close();
process.exit(0);

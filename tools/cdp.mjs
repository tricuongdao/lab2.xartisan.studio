// Minimal CDP driver for inspecting/capturing the reference site.
import fs from 'node:fs';
import path from 'node:path';

const PORT = process.env.CDP_PORT || 9333;
const HOST = `127.0.0.1:${PORT}`;

export async function newTarget(url = 'about:blank') {
  const res = await fetch(`http://${HOST}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`newTarget failed ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function listTargets() {
  const res = await fetch(`http://${HOST}/json/list`);
  return res.json();
}

export class Session {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    this.handlers = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} ${JSON.stringify(msg.error.data || '')}`));
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
        const hs = this.handlers.get(msg.method);
        if (hs) for (const h of hs) h(msg.params);
      }
    });
  }

  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    return new Session(ws);
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`timeout ${method}`));
        }
      }, 60000);
    });
  }

  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }

  waitEvent(method, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`wait ${method} timeout`)), timeout);
      const h = (params) => {
        clearTimeout(t);
        const arr = this.handlers.get(method);
        arr.splice(arr.indexOf(h), 1);
        resolve(params);
      };
      this.on(method, h);
    });
  }

  async eval(expression, awaitPromise = true) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise,
      userGesture: true,
    });
    if (r.exceptionDetails) throw new Error(`eval error: ${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description || ''}`);
    return r.result.value;
  }

  async screenshot(file, { fullPage = false } = {}) {
    const params = { format: 'png', captureBeyondViewport: fullPage };
    if (fullPage) {
      const m = await this.send('Page.getLayoutMetrics');
      const w = Math.ceil(m.cssContentSize.width);
      const h = Math.ceil(m.cssContentSize.height);
      params.clip = { x: 0, y: 0, width: w, height: h, scale: 1 };
    }
    const { data } = await this.send('Page.captureScreenshot', params);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    return file;
  }
}

export async function connectTo({ url } = {}) {
  const t = await newTarget(url || 'about:blank');
  const s = await Session.connect(t.webSocketDebuggerUrl);
  await s.send('Page.enable');
  await s.send('Runtime.enable');
  await s.send('Network.enable');
  await s.send('Log.enable');
  s.targetId = t.id;
  return s;
}

export async function closeTarget(targetId) {
  await fetch(`http://${HOST}/json/close/${targetId}`);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

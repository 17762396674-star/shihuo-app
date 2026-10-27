/* ===================================================================
 * 拾货 SHIHUO · 数据层（多工作空间）
 * 一个空间 = 一套独立的 品类/物料/单据/库存。互不干扰。
 * 全部落在 localStorage，不上传。
 * =================================================================== */

const KEY_V2 = 'shihuo.db.v2';
const KEY_V1 = 'shihuo.db.v1';

// 单据类型（数据层自有，避免反向依赖 pages.js）
const DOC_TYPE = { inbound: '入库单', outbound: '出库单', transfer: '调拨单', check: '盘点单' };
// 已过账状态集合：approved 与 done 都视为「库存已落地」
const POSTED_STATUS = ['approved', 'done'];

const Store = {
  root: { v: 2, current: null, workspaces: [] },

  /* ---------------- 初始化 / 持久化 ---------------- */
  init() {
    let loaded = null;
    try {
      const raw = localStorage.getItem(KEY_V2);
      if (raw) loaded = JSON.parse(raw);
    } catch (e) { loaded = null; }

    // 已初始化过（有空间，或曾经清空过）就直接用
    if (loaded && Array.isArray(loaded.workspaces) && (loaded.workspaces.length || loaded.seeded)) {
      this.root = loaded;
      return this.root;
    }

    // 首次进入：建根节点，尝试迁移旧版单库，再预置两个示例空间
    this.root = { v: 2, current: null, workspaces: [], seeded: true };

    let old = null;
    try { old = localStorage.getItem(KEY_V1); } catch (e) {}
    if (old) {
      try {
        const d = JSON.parse(old);
        if (d && d.products) {
          this.root.workspaces.push({
            id: this._newId(), name: '我的门店（旧数据）', type: 'market',
            createdAt: Date.now(),
            cats: JSON.parse(JSON.stringify(TEMPLATES.market.cats)),
            labels: JSON.parse(JSON.stringify(TEMPLATES.market.labels)),
            suppliers: TEMPLATES.market.suppliers.slice(),
            tip: TEMPLATES.market.tip,
            data: {
              products: d.products, docs: d.docs || [], todos: d.todos || [],
              notices: d.notices || [], trend: d.trend || [], scans: [], ocrCount: 0, stocklog: [],
            },
          });
        }
      } catch (e) {}
    }

    if (!this.root.workspaces.length) {
      this.root.workspaces.push(this._fromTemplate('milktea', '一杯好茶 · 中山路店'));
      this.root.workspaces.push(this._fromTemplate('market', '拾货便利 · 江滨店'));
    }
    this.save();
    return this.root;
  },

  save() {
    try { localStorage.setItem(KEY_V2, JSON.stringify(this.root)); } catch (e) {}
  },

  /* ---------------- 工作空间 ---------------- */
  list() { return this.root.workspaces; },
  hasWorkspace() { return this.root.workspaces.length > 0; },

  ws() {
    return this.root.workspaces.find(w => w.id === this.root.current) || null;
  },

  enter(id) {
    if (!this.root.workspaces.some(w => w.id === id)) return false;
    this.root.current = id;
    this.save();
    return true;
  },

  leave() {
    this.root.current = null;
    this.save();
  },

  _newId() { return 'ws_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); },

  _fromTemplate(tplKey, name) {
    const T = TEMPLATES[tplKey] || TEMPLATES.blank;
    const clone = o => JSON.parse(JSON.stringify(o));
    return {
      id: this._newId(),
      name: name || T.name,
      type: tplKey,
      createdAt: Date.now(),
      cats: clone(T.cats),
      labels: clone(T.labels),
      suppliers: clone(T.suppliers),
      tip: T.tip,
      data: {
        products: clone(T.products),
        docs: clone(T.docs),
        todos: clone(T.todos),
        notices: clone(T.notices),
        trend: clone(T.trend),
        scans: [],
        ocrCount: 0,
        stocklog: [],
      },
    };
  },

  create(tplKey, name) {
    const T = TEMPLATES[tplKey] || TEMPLATES.blank;
    let nm = (name || '').trim();
    if (!nm) {
      const base = T.name;
      let n = 1, cand = base;
      while (this.root.workspaces.some(w => w.name === cand)) { n++; cand = base + ' ' + n; }
      nm = cand;
    }
    const w = this._fromTemplate(tplKey, nm);
    this.root.workspaces.push(w);
    this.root.current = w.id;
    this.save();
    return w;
  },

  remove(id) {
    const i = this.root.workspaces.findIndex(w => w.id === id);
    if (i < 0) return false;
    this.root.workspaces.splice(i, 1);
    if (this.root.current === id) this.root.current = null;
    this.save();
    return true;
  },

  rename(id, name) {
    const w = this.root.workspaces.find(x => x.id === id);
    if (!w || !name || !name.trim()) return false;
    w.name = name.trim();
    this.save();
    return true;
  },

  // 按模板重置当前空间的数据
  reset() {
    const w = this.ws();
    if (!w) return false;
    const fresh = this._fromTemplate(w.type, w.name);
    w.cats = fresh.cats;
    w.labels = fresh.labels;
    w.suppliers = fresh.suppliers;
    w.tip = fresh.tip;
    w.data = fresh.data;
    this.save();
    return true;
  },

  /* ---------------- 当前空间的数据 ---------------- */
  get db() {
    const w = this.ws();
    return w ? w.data : { products: [], docs: [], todos: [], notices: [], trend: [], scans: [], ocrCount: 0, stocklog: [] };
  },

  cats() { const w = this.ws(); return (w && w.cats) || TEMPLATES.blank.cats; },
  cat(k) { const c = this.cats(); return c[k] || { name: '其他', hue: '220', glyph: 'box' }; },
  labels() { const w = this.ws(); return (w && w.labels) || TEMPLATES.blank.labels; },
  suppliers() { const w = this.ws(); return (w && w.suppliers) || []; },
  tip() { const w = this.ws(); return (w && w.tip) || ''; },

  products() { return this.db.products; },
  docs() { return this.db.docs; },
  todos() { return this.db.todos; },

  product(id) { return this.db.products.find(p => p.id === id); },

  byBarcode(code) {
    if (!code) return null;
    return this.db.products.find(p => p.bc && p.bc === code);
  },

  search(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return this.db.products.slice();
    return this.db.products.filter(p =>
      p.name.toLowerCase().includes(q) || (p.bc && p.bc.includes(q)) ||
      p.id.toLowerCase().includes(q) || (p.spec || '').includes(q) || (p.loc || '').toLowerCase().includes(q));
  },

  adjustStock(pid, delta, reason) {
    const p = this._applyStock(pid, delta, reason || (delta >= 0 ? '盘盈' : '报损'), 'adjust');
    if (p) this.save();
    return p;
  },

  /* ---------------- 建档 ---------------- */
  addProduct(prod) {
    const ps = this.db.products;
    const next = this._nextProductId();
    const p = Object.assign({
      id: next, name: '', spec: '', bc: '', cat: '', unit: '件', stock: 0, safe: 0,
      cost: 0, price: 0, loc: '', batch: '', expiry: '', supplier: '', abc: 'B', sales30: 0, lead: 3,
    }, prod, { id: next });
    if (!p.cat) {
      const firstCat = Object.keys(this.cats())[0] || 'general';
      p.cat = firstCat;
    }
    ps.push(p);
    this.save();
    return p;
  },

  _nextProductId() {
    const ps = this.db.products;
    const prefix = this.ws().type === 'market' ? 'P' : 'M';
    let max = 0;
    ps.forEach(p => {
      const m = String(p.id || '').match(/^[A-Z]+(\d+)$/);
      if (m) max = Math.max(max, Number(m[1]));
    });
    return prefix + String(max + 1).padStart(4, '0');
  },

  /* ---------------- 库存流水 ---------------- */
  stocklog() { return this.db.stocklog || []; },

  _logStock(pid, delta, reason, source) {
    const p = this.product(pid);
    if (!p) return;
    if (!this.db.stocklog) this.db.stocklog = [];
    this.db.stocklog.unshift({
      t: Date.now(),
      pid: pid,
      name: p.name,
      delta: delta,
      after: p.stock,
      reason: reason || '',
      source: source || 'manual',
    });
    this.db.stocklog = this.db.stocklog.slice(0, 200);
  },

  // 统一过账：任何库存变动都走这里，记录流水，保证账实可追溯
  _applyStock(pid, delta, reason, source) {
    const p = this.product(pid);
    if (!p) return null;
    const before = p.stock;
    p.stock = Math.max(0, before + delta);
    // 记录「实际变动量」而非原始 delta：库存被钳到 0 时，实际变动 = after - before
    this._logStock(pid, p.stock - before, reason, source);
    return p;
  },

  addDoc(doc) {
    this.db.docs.unshift(doc);
    if (POSTED_STATUS.indexOf(doc.status) >= 0) {
      this._postDoc(doc);
    }
    this.save();
    return doc;
  },

  // 单据审批通过后，按单据类型正确过账
  _postDoc(doc) {
    doc.items.forEach(it => {
      const p = this.product(it.pid);
      if (!p) return;
      let delta = 0;
      if (doc.type === 'inbound') delta = it.qty;
      else if (doc.type === 'outbound' || doc.type === 'transfer') delta = -it.qty;
      else if (doc.type === 'check') delta = it.qty; // 盘点：差异数（盘盈为正、盘亏为负）
      if (delta) this._applyStock(it.pid, delta, doc.id + ' · ' + (DOC_TYPE[doc.type] || doc.type), doc.type);
    });
  },

  // 驳回时，撤销该单据此前已经过的账
  _reverseDoc(doc) {
    doc.items.forEach(it => {
      const p = this.product(it.pid);
      if (!p) return;
      let delta = 0;
      if (doc.type === 'inbound') delta = -it.qty;
      else if (doc.type === 'outbound' || doc.type === 'transfer') delta = it.qty;
      else if (doc.type === 'check') delta = -it.qty;
      if (delta) this._applyStock(it.pid, delta, doc.id + ' · 驳回回滚', doc.type);
    });
  },

  setDocStatus(id, status) {
    const d = this.db.docs.find(x => x.id === id);
    if (!d) return null;
    const was = d.status;
    d.status = status;
    const wasPosted = POSTED_STATUS.indexOf(was) >= 0;
    const willPost = POSTED_STATUS.indexOf(status) >= 0;
    // 进入过账态 → 过账；离开过账态（驳回/退回）→ 回滚
    if (willPost && !wasPosted) {
      this._postDoc(d);
    } else if (!willPost && wasPosted) {
      this._reverseDoc(d);
    }
    this.save();
    return d;
  },

  addScan(p) {
    this.db.scans.unshift(Object.assign({ t: Date.now() }, p));
    this.db.scans = this.db.scans.slice(0, 40);
    this.save();
  },

  stats() {
    const ps = this.db.products;
    const value = ps.reduce((s, p) => s + p.stock * p.cost, 0);
    const low = ps.filter(p => p.stock < p.safe).length;
    const out = ps.filter(p => p.stock === 0).length;
    const soon = ps.filter(p => { const d = daysTo(p.expiry); return d >= 0 && d <= 7; }).length;
    return { value, low, out, soon, sku: ps.length };
  },
};

function daysTo(dateStr) {
  const t = new Date(dateStr + 'T00:00:00').getTime();
  if (isNaN(t)) return 9999;
  return Math.ceil((t - Date.now()) / 86400000);
}

function pad(n, w) { return String(n).padStart(w || 2, '0'); }

function uid(prefix) {
  const d = new Date();
  return prefix + '-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
    '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

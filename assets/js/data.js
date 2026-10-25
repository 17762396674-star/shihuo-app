/* ===================================================================
 * 拾货 SHIHUO · 数据层
 * 本地 mock 数据 + localStorage 持久化。所有页面只通过 Store 读取。
 * =================================================================== */

const CATS = {
  drink:  { name: '饮品',   hue: '202', glyph: 'bottle' },
  snack:  { name: '零食',   hue: '28',  glyph: 'bag' },
  digi:   { name: '数码',   hue: '262', glyph: 'chip' },
  care:   { name: '个护',   hue: '334', glyph: 'drop' },
  daily:  { name: '日用',   hue: '158', glyph: 'box' },
};

const SUPPLIERS = ['华东食品供应链', '鲜达冷链', '深圳智联数码', '恒美日化', '禾丰粮油'];

function mkProduct(o) {
  return Object.assign({
    unit: '件', stock: 0, safe: 20, cost: 10, price: 15,
    loc: 'A-01-01', batch: 'B2610', expiry: '2027-06-30',
    supplier: SUPPLIERS[0], abc: 'B', sales30: 40, lead: 3,
  }, o);
}

const SEED_PRODUCTS = [
  mkProduct({ id:'P1001', name:'冰露纯净水', spec:'550ml×24瓶', bc:'6901234567017', cat:'drink', unit:'箱',
    stock:126, safe:60, cost:18.5, price:26.0, loc:'A-01-03', sales30:210, abc:'A', supplier:'华东食品供应链' }),
  mkProduct({ id:'P1002', name:'农夫山泉天然水', spec:'550ml×12瓶', bc:'6902345678028', cat:'drink', unit:'件',
    stock:48, safe:70, cost:23.0, price:32.0, loc:'A-01-04', sales30:186, abc:'A', supplier:'华东食品供应链' }),
  mkProduct({ id:'P1003', name:'元气森林白桃气泡水', spec:'480ml×15瓶', bc:'6903456789039', cat:'drink', unit:'箱',
    stock:73, safe:40, cost:52.0, price:72.0, loc:'A-02-01', sales30:132, abc:'A', supplier:'鲜达冷链' }),
  mkProduct({ id:'P1004', name:'伊利安慕希酸奶', spec:'205g×12盒', bc:'6904567890040', cat:'drink', unit:'箱',
    stock:22, safe:30, cost:46.0, price:63.0, loc:'C-01-01', batch:'B2609', expiry:'2026-11-08',
    sales30:95, abc:'B', supplier:'鲜达冷链' }),
  mkProduct({ id:'P1005', name:'三只松鼠每日坚果', spec:'750g/30包', bc:'6905678901051', cat:'snack', unit:'袋',
    stock:86, safe:30, cost:59.0, price:89.0, loc:'B-01-02', sales30:64, abc:'B', supplier:'华东食品供应链' }),
  mkProduct({ id:'P1006', name:'乐事薯片原味', spec:'70g×22包', bc:'6906789012062', cat:'snack', unit:'箱',
    stock:134, safe:50, cost:96.0, price:138.0, loc:'B-01-05', sales30:118, abc:'A', supplier:'华东食品供应链' }),
  mkProduct({ id:'P1007', name:'好丽友派巧克力', spec:'12枚/盒', bc:'6907890123073', cat:'snack', unit:'盒',
    stock:9, safe:25, cost:13.5, price:19.9, loc:'B-02-02', batch:'B2608', expiry:'2027-02-14',
    sales30:52, abc:'C', supplier:'华东食品供应链' }),
  mkProduct({ id:'P1008', name:'小米移动电源 3', spec:'10000mAh 快充版', bc:'6908901234084', cat:'digi', unit:'台',
    stock:41, safe:15, cost:79.0, price:129.0, loc:'D-01-01', sales30:33, abc:'A', supplier:'深圳智联数码' }),
  mkProduct({ id:'P1009', name:'罗技 M185 无线鼠标', spec:'黑色 2.4G', bc:'6909012345095', cat:'digi', unit:'个',
    stock:57, safe:20, cost:45.0, price:79.0, loc:'D-01-02', sales30:28, abc:'B', supplier:'深圳智联数码' }),
  mkProduct({ id:'P1010', name:'绿联 Type-C 数据线', spec:'1m 3A 编织', bc:'6910123456106', cat:'digi', unit:'条',
    stock:0, safe:40, cost:11.0, price:25.0, loc:'D-02-03', sales30:74, abc:'C', supplier:'深圳智联数码' }),
  mkProduct({ id:'P1011', name:'蓝月亮深层洁净洗衣液', spec:'3kg/瓶', bc:'6911234567117', cat:'daily', unit:'瓶',
    stock:64, safe:25, cost:32.0, price:46.0, loc:'E-01-01', sales30:41, abc:'B', supplier:'恒美日化' }),
  mkProduct({ id:'P1012', name:'维达超韧抽纸', spec:'130抽×24包', bc:'6912345678128', cat:'daily', unit:'提',
    stock:98, safe:35, cost:58.0, price:82.0, loc:'E-01-04', sales30:88, abc:'A', supplier:'恒美日化' }),
  mkProduct({ id:'P1013', name:'金龙鱼稻米油', spec:'5L/桶', bc:'6913456789139', cat:'daily', unit:'桶',
    stock:31, safe:18, cost:76.0, price:99.0, loc:'E-02-01', sales30:26, abc:'B', supplier:'禾丰粮油' }),
  mkProduct({ id:'P1014', name:'花王蒸汽眼罩', spec:'14片/盒', bc:'6914567890140', cat:'care', unit:'盒',
    stock:44, safe:15, cost:38.0, price:59.0, loc:'F-01-02', sales30:37, abc:'B', supplier:'恒美日化' }),
  mkProduct({ id:'P1015', name:'舒肤佳纯白沐浴露', spec:'720ml/瓶', bc:'6915678901151', cat:'care', unit:'瓶',
    stock:76, safe:25, cost:29.0, price:42.0, loc:'F-01-03', sales30:45, abc:'B', supplier:'恒美日化' }),
  mkProduct({ id:'P1016', name:'参半益生菌漱口水', spec:'500ml/瓶', bc:'6916789012162', cat:'care', unit:'瓶',
    stock:12, safe:20, cost:26.0, price:39.9, loc:'F-02-01', batch:'B2610', expiry:'2026-11-20',
    sales30:19, abc:'C', supplier:'恒美日化' }),
];

const SEED_DOCS = [
  { id:'RK-20261025-0031', type:'inbound',  code:'RK20261025007', partner:'华东食品供应链', status:'pending',
    amount:2860.0, createdAt:'2026-10-25 09:12', owner:'林知夏', source:'ocr', items:[
      { pid:'P1001', qty:60, price:18.5 }, { pid:'P1006', qty:10, price:96.0 }, { pid:'P1005', qty:8, price:59.0 } ] },
  { id:'CK-20261025-0032', type:'outbound', code:'CK20261025009', partner:'拾货便利 · 中山路店', status:'done',
    amount:4210.0, createdAt:'2026-10-25 08:40', owner:'周航', source:'scan', items:[
      { pid:'P1002', qty:30, price:32.0 }, { pid:'P1006', qty:20, price:138.0 } ] },
  { id:'RK-20261025-0033', type:'inbound',  code:'RK20261025010', partner:'鲜达冷链', status:'approved',
    amount:5240.0, createdAt:'2026-10-25 07:55', owner:'林知夏', source:'ocr', items:[
      { pid:'P1003', qty:80, price:52.0 }, { pid:'P1004', qty:20, price:46.0 } ] },
  { id:'PD-20261024-0018', type:'check',    code:'PD20261024004', partner:'华东仓 · A库区', status:'pending',
    amount:0, createdAt:'2026-10-24 22:10', owner:'陈默', source:'scan', items:[
      { pid:'P1006', qty:-3, price:0 }, { pid:'P1010', qty:-6, price:0 }, { pid:'P1016', qty:2, price:0 } ] },
  { id:'DB-20261024-0016', type:'transfer', code:'DB20261024002', partner:'华东仓 → 城西前置仓', status:'done',
    amount:0, createdAt:'2026-10-24 16:30', owner:'周航', source:'manual', items:[
      { pid:'P1001', qty:24, price:0 }, { pid:'P1012', qty:12, price:0 } ] },
  { id:'CK-20261024-0030', type:'outbound', code:'CK20261024008', partner:'拾货便利 · 江滨店', status:'done',
    amount:1980.0, createdAt:'2026-10-24 14:05', owner:'陈默', source:'scan', items:[
      { pid:'P1011', qty:20, price:46.0 }, { pid:'P1015', qty:25, price:42.0 } ] },
];

const SEED_TODOS = [
  { id:'T1', type:'approve', title:'待审：入库单 RK20261025007', desc:'华东食品供应链 · 3 个品 · ¥2,860.00', at:'09:12', tag:'审批' },
  { id:'T2', type:'check',   title:'盘点差异待确认 PD20261024004', desc:'A库区 3 个品存在账实差异，最大差额 -6', at:'昨晚 22:10', tag:'盘点' },
  { id:'T3', type:'warn',    title:'2 个 SKU 已低于安全库存', desc:'Type-C 数据线已售罄，农夫山泉接近下限', at:'07:00', tag:'补货' },
  { id:'T4', type:'expiry',  title:'伊利安慕希 14 天后到期', desc:'C-01-01 库位 22 箱，建议促销或调拨', at:'06:30', tag:'效期' },
  { id:'T5', type:'approve', title:'周航 @了你 在出库单 CK20261025009', desc:'“江滨店临时加单，麻烦优先放行”', at:'08:44', tag:'协同' },
];

const SEED_NOTICES = [
  { id:'N1', t:'识别引擎已就绪', d:'OCR 中文模型已缓存，本次会话识别 0 张单据', time:'刚刚', kind:'ok' },
  { id:'N2', t:'低库存预警', d:'P1010 绿联 Type-C 数据线 库存为 0', time:'2 小时前', kind:'warn' },
  { id:'N3', t:'审批通过', d:'RK20261025010 已由 王砚 审核通过', time:'1 小时前', kind:'ok' },
  { id:'N4', t:'效期提醒', d:'P1004 伊利安慕希酸奶 剩余 14 天', time:'今天 06:30', kind:'warn' },
];

const TREND = [
  { d:'10-19', in:186, out:142 }, { d:'10-20', in:240, out:198 },
  { d:'10-21', in:164, out:220 }, { d:'10-22', in:312, out:186 },
  { d:'10-23', in:208, out:264 }, { d:'10-24', in:276, out:238 },
  { d:'10-25', in:168, out:154 },
];

const KEY = 'shihuo.db.v1';

const Store = {
  db: null,

  init() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (raw) {
      try { this.db = JSON.parse(raw); } catch (e) { this.db = null; }
    }
    if (!this.db || !this.db.products || !this.db.products.length) {
      this.db = {
        products: JSON.parse(JSON.stringify(SEED_PRODUCTS)),
        docs: JSON.parse(JSON.stringify(SEED_DOCS)),
        todos: JSON.parse(JSON.stringify(SEED_TODOS)),
        notices: JSON.parse(JSON.stringify(SEED_NOTICES)),
        trend: JSON.parse(JSON.stringify(TREND)),
        scans: [],
        lastInbound: null,
        ocrCount: 0,
      };
      this.save();
    }
    return this.db;
  },

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.db)); } catch (e) {}
  },

  reset() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    this.init();
  },

  products() { return this.db.products; },
  docs() { return this.db.docs; },
  todos() { return this.db.todos; },

  product(id) { return this.db.products.find(p => p.id === id); },
  byBarcode(code) { return this.db.products.find(p => p.bc === code); },

  search(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return this.db.products.slice();
    return this.db.products.filter(p =>
      p.name.toLowerCase().includes(q) || p.bc.includes(q) || p.id.toLowerCase().includes(q) || p.spec.includes(q));
  },

  adjustStock(pid, delta) {
    const p = this.product(pid);
    if (!p) return null;
    p.stock = Math.max(0, p.stock + delta);
    this.save();
    return p;
  },

  addDoc(doc) {
    this.db.docs.unshift(doc);
    // 入库/出库联动库存
    if (doc.status === 'done' || doc.status === 'approved') {
      doc.items.forEach(it => this.adjustStock(it.pid, doc.type === 'inbound' ? it.qty : -it.qty));
    }
    this.save();
    return doc;
  },

  setDocStatus(id, status) {
    const d = this.db.docs.find(x => x.id === id);
    if (!d) return null;
    const was = d.status;
    d.status = status;
    if (status === 'approved' && was !== 'approved' && d.type === 'inbound') {
      d.items.forEach(it => this.adjustStock(it.pid, it.qty));
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
    const soon = ps.filter(p => daysTo(p.expiry) <= 30 && daysTo(p.expiry) >= 0).length;
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

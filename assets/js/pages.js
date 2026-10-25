/* ===================================================================
 * 拾货 SHIHUO · 页面层
 * 每个页面导出 { title, sub, render(), mount(el) }
 * =================================================================== */

const ScanState = { tab: 'barcode', bill: [], lastProduct: null, doc: null, docImg: null, text: null, camOn: false };

const DOC_TYPE = { inbound: '入库单', outbound: '出库单', transfer: '调拨单', check: '盘点单' };
const DOC_STATUS = {
  draft:    { t: '草稿',   c: 'muted' },
  pending:  { t: '待审批', c: 'warn' },
  approved: { t: '已通过', c: 'brand' },
  done:     { t: '已执行', c: 'ok' },
};

function pill(status) {
  const s = DOC_STATUS[status] || DOC_STATUS.draft;
  return '<span class="pill ' + s.c + '"><i></i>' + s.t + '</span>';
}

function kpiCard(o) {
  return '<div class="kpi ' + (o.tone || '') + '">' +
    '<div class="kpi-top"><span class="kpi-ico">' + UI.icon(o.icon) + '</span>' +
    (o.tag ? '<span class="kpi-tag">' + o.tag + '</span>' : '') + '</div>' +
    '<b class="kpi-val">' + o.value + '</b>' +
    '<span class="kpi-label">' + o.label + '</span>' +
    (o.foot ? '<div class="kpi-foot">' + o.foot + '</div>' : '') +
  '</div>';
}

function emptyState(icon, title, desc, action) {
  return '<div class="empty">' + UI.icon(icon) + '<b>' + title + '</b><p>' + desc + '</p>' + (action || '') + '</div>';
}

const Pages = {};

/* =========================================================
 * 1. 工作台
 * ======================================================= */
Pages.dashboard = {
  title: '工作台',
  get sub() {
    const w = Store.ws();
    return (w ? w.name : '') + ' · 实时经营概览';
  },
  render() {
    const st = Store.stats();
    const todos = Store.todos();
    const lowList = Store.products().filter(p => p.stock < p.safe).slice(0, 4);
    const h = new Date().getHours();
    const greet = h < 6 ? '夜深了' : h < 11 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好';
    const pendingDocs = Store.docs().filter(d => d.status === 'pending').length;
    const todayDocs = Store.docs().filter(d => (d.createdAt || '').startsWith(todayStr()));
    const inDocs = todayDocs.filter(d => d.type === 'inbound').length;
    const outDocs = todayDocs.filter(d => d.type === 'outbound').length;
    const ocrDocs = todayDocs.filter(d => d.source === 'ocr').length;
    const last = (Store.db.trend || []).slice(-1)[0] || { in: 0, out: 0 };

    const health = [
      { label: '库存充足', v: Store.products().filter(p => p.stock >= p.safe).length, c: 'var(--ok)' },
      { label: '低于安全线', v: Store.products().filter(p => p.stock > 0 && p.stock < p.safe).length, c: 'var(--warn)' },
      { label: '已售罄', v: st.out, c: 'var(--danger)' },
    ];

    return '' +
    '<section class="hero">' +
      '<div class="hero-main">' +
        '<p class="eyebrow">' + new Date().getFullYear() + '.' + pad(new Date().getMonth() + 1) + '.' + pad(new Date().getDate()) + ' · ' + ((TEMPLATES[Store.ws().type] || {}).name || '') + '</p>' +
        '<h2 class="hero-title">' + greet + '，知夏</h2>' +
        '<p class="hero-desc">今天有 <b>' + pendingDocs + '</b> 张单据等你审批，<b>' + st.low + '</b> 个' +
          Store.labels().product + '低于安全库存' + (st.soon ? '，<b>' + st.soon + '</b> 个 7 天内到期' : '') + '。</p>' +
        '<div class="hero-actions">' +
          '<a class="btn primary" data-go="#/scan">' + UI.icon('scan') + '扫码入库</a>' +
          '<a class="btn soft" data-go="#/scan" data-tab="doc">' + UI.icon('camera') + '拍照录单</a>' +
          '<a class="btn ghost" data-go="#/docs">' + UI.icon('doc') + '审批中心</a>' +
        '</div>' +
      '</div>' +
      '<div class="hero-art" aria-hidden="true">' +
        '<svg viewBox="0 0 220 160" fill="none">' +
          '<rect x="34" y="54" width="64" height="80" rx="10" stroke="currentColor" stroke-width="2.4" opacity=".5"/>' +
          '<rect x="108" y="34" width="72" height="100" rx="12" stroke="currentColor" stroke-width="2.4" opacity=".32"/>' +
          '<path d="M52 96h28M52 110h18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>' +
          '<path d="M124 60h40M124 78h28M124 96h34" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity=".32"/>' +
          '<circle cx="170" cy="42" r="17" fill="var(--accent)" opacity=".9"/>' +
          '<path d="M163 42l5 5 10-11" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
      '</div>' +
    '</section>' +

    '<div class="kpis">' +
      kpiCard({ icon:'layers', label:'库存总值', value: UI.moneyShort(st.value), tone:'brand',
        foot: st.value
          ? '<span class="up">' + UI.icon('up') + '3.2%</span> 较上周'
          : '还没有' + Store.labels().product + '，去物料档案添加' }) +
      kpiCard({ icon:'downArrow', label:'今日入库', value:String(last.in || 0), tone:'ok',
        foot: inDocs + ' 张单据 · 其中 ' + ocrDocs + ' 张来自拍照识别' }) +
      kpiCard({ icon:'up', label:'今日出库', value:String(last.out || 0), tone:'accent',
        foot: outDocs + ' 张单据 · 全部已复核' }) +
      kpiCard({ icon:'alert', label:'待处理', value: String(todos.length), tone:'warn',
        foot:'含 ' + pendingDocs + ' 个审批 · ' + st.soon + ' 个效期提醒' }) +
    '</div>' +

    '<div class="dash-grid">' +
      '<div class="card trend-card">' +
        '<div class="card-head">' +
          '<div><h3>出入库趋势</h3><p>近 7 天 · 单位：件</p></div>' +
          '<div class="legend"><span><i class="dot brand"></i>入库</span><span><i class="dot accent"></i>出库</span></div>' +
        '</div>' +
        (Store.db.trend && Store.db.trend.length
          ? UI.groupedBars(Store.db.trend, { h: 196 })
          : emptyState('chart', '还没有出入库记录', '扫码或录单后，这里会出现近 7 天趋势', '')) +
      '</div>' +

      '<div class="card health-card">' +
        '<div class="card-head"><div><h3>库存健康度</h3><p>' + st.sku + ' 个 SKU</p></div></div>' +
        '<div class="health-wrap">' +
          UI.donut(health.map(x => ({ v: x.v, c: x.c, label: x.label })),
            st.sku ? Math.round((health[0].v / st.sku) * 100) + '%' : '—', '健康占比') +
          '<div class="health-legend">' +
            health.map(x => '<div class="hl-row"><i style="background:' + x.c + '"></i><span>' + x.label + '</span><b>' + x.v + '</b></div>').join('') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="card todo-card">' +
        '<div class="card-head"><div><h3>待办</h3><p>按紧急度排序</p></div><a class="link" data-go="#/collab">全部' + UI.icon('right') + '</a></div>' +
        (todos.length ? '<div class="todo-list">' +
          todos.map(t => '<button class="todo-item" data-todo="' + t.id + '">' +
            '<span class="todo-ico ' + t.type + '">' + UI.icon(t.type === 'approve' ? 'check' : t.type === 'expiry' ? 'clock' : t.type === 'warn' ? 'alert' : 'layers') + '</span>' +
            '<span class="todo-main"><b>' + t.title + '</b><i>' + t.desc + '</i></span>' +
            '<span class="todo-at">' + t.at + '</span>' +
          '</button>').join('') +
        '</div>'
          : emptyState('check', '没有待办', '审批、盘点和效期提醒会出现在这里', '')) +
      '</div>' +

      '<div class="card alert-card">' +
        '<div class="card-head"><div><h3>补货预警</h3><p>低于安全库存</p></div><a class="link" data-go="#/inventory">去补货' + UI.icon('right') + '</a></div>' +
        '<div class="mini-list">' +
          (lowList.length ? lowList.map(p => {
            return '<button class="mini-item" data-prod="' + p.id + '">' + UI.productTile(p, 'xs') +
              '<span class="mini-main"><b>' + p.name + '</b><i>' + p.spec + '</i></span>' +
              '<span class="mini-val ' + (p.stock === 0 ? 'bad' : 'warn') + '">' + p.stock + '<i>/' + p.safe + '</i></span>' +
            '</button>';
          }).join('') : emptyState('check', '库存健康', '暂无低于安全线的商品', '')) +
        '</div>' +
      '</div>' +
    '</div>';
  },

  mount(el) {
    el.querySelectorAll('[data-todo]').forEach(b => {
      b.addEventListener('click', () => {
        const t = Store.todos().find(x => x.id === b.dataset.todo);
        if (!t) return;
        if (t.type === 'approve') location.hash = '#/docs';
        else if (t.type === 'check') location.hash = '#/docs';
        else location.hash = '#/inventory';
      });
    });
    el.querySelectorAll('[data-prod]').forEach(b => {
      b.addEventListener('click', () => openProduct(b.dataset.prod));
    });
  },
};

/* =========================================================
 * 商品详情弹层（多处复用）
 * ======================================================= */
function openProduct(pid) {
  const p = Store.product(pid);
  if (!p) return;
  const c = Store.cat(p.cat);
  const d = daysTo(p.expiry);
  const lowRatio = Math.min(100, Math.round((p.stock / Math.max(p.safe, 1)) * 100));
  UI.open({
    title: p.name,
    sub: p.spec + ' · ' + p.id,
    body:
      '<div class="pd-hero">' + UI.productTile(p, 'lg') +
        '<div class="pd-hero-r">' +
          '<div class="pd-price">' + UI.money(p.price || p.cost) + '<i>' + (p.price ? '零售价' : '成本价') + '</i></div>' +
          '<div class="pd-meta">' +
            '<span>' + c.name + '</span><span>' + p.unit + '</span><span>' + p.abc + ' 类</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pd-bar"><i style="width:' + lowRatio + '%" class="' + (p.stock < p.safe ? 'warn' : 'ok') + '"></i></div>' +
      '<div class="pd-grid">' +
        '<div><i>当前库存</i><b>' + p.stock + ' ' + p.unit + '</b></div>' +
        '<div><i>安全库存</i><b>' + p.safe + ' ' + p.unit + '</b></div>' +
        '<div><i>库位</i><b>' + p.loc + '</b></div>' +
        '<div><i>批次</i><b>' + p.batch + '</b></div>' +
        '<div><i>效期</i><b class="' + (d < 30 ? 'warn-t' : '') + '">' + p.expiry + (d < 900 ? '（' + d + '天）' : '') + '</b></div>' +
        '<div><i>供应商</i><b>' + p.supplier + '</b></div>' +
        '<div><i>成本价</i><b>' + UI.money(p.cost) + '</b></div>' +
        '<div><i>近30天动销</i><b>' + p.sales30 + ' ' + p.unit + '</b></div>' +
      '</div>' +
      '<div class="pd-code"><div class="pd-code-l"><i>商品条码</i><b>' + UI.ean13(p.bc) + '</b></div>' + UI.barcode(p.bc, { h: 46 }) + '</div>',
    foot: '<button class="btn ghost" data-close>关闭</button>' +
          '<button class="btn soft" id="pdAdj">调整库存</button>' +
          '<button class="btn primary" id="pdScan">扫码出库</button>',
    onMount(l) {
      l.querySelector('#pdScan').addEventListener('click', () => { UI.close(); location.hash = '#/scan'; });
      l.querySelector('#pdAdj').addEventListener('click', () => {
        UI.close();
        setTimeout(() => openAdjust(p.id), 220);
      });
    },
  });
}

function openAdjust(pid) {
  const p = Store.product(pid);
  let delta = 0;
  UI.open({
    variant: 'modal',
    title: '调整库存',
    sub: p.name + ' · 当前 ' + p.stock + ' ' + p.unit,
    body:
      '<div class="stepper-lg">' +
        '<button class="step-btn" id="dec">' + UI.icon('minus') + '</button>' +
        '<input id="adjVal" type="number" value="0" inputmode="numeric">' +
        '<button class="step-btn" id="inc">' + UI.icon('plus') + '</button>' +
      '</div>' +
      '<p class="hint-line">正数为盘盈入库，负数为报损出库。调整将写入库存流水。</p>',
    foot: '<button class="btn ghost" data-close>取消</button><button class="btn primary" id="adjOk">确认调整</button>',
    onMount(l) {
      const inp = l.querySelector('#adjVal');
      l.querySelector('#inc').addEventListener('click', () => { inp.value = Number(inp.value) + 1; });
      l.querySelector('#dec').addEventListener('click', () => { inp.value = Number(inp.value) - 1; });
      l.querySelector('#adjOk').addEventListener('click', () => {
        const v = Number(inp.value) || 0;
        if (!v) { UI.toast('请输入调整数量', 'warn'); return; }
        Store.adjustStock(pid, v);
        UI.close();
        UI.toast('已调整 ' + (v > 0 ? '+' : '') + v + ' ' + p.unit, 'ok');
        App.refresh();
      });
    },
  });
}

/* =========================================================
 * 2. 扫码作业
 * ======================================================= */
Pages.scan = {
  get title() { return Store.labels().scan; },
  sub: '条码 / 单据 / 图文识别',
  render() {
    const tabs = [
      { k: 'barcode', t: '扫条码', i: 'barcode' },
      { k: 'doc', t: '拍单据', i: 'doc' },
      { k: 'text', t: '识文字', i: 'spark' },
    ];
    const head = '<div class="scan-tabs">' + tabs.map(t =>
      '<button class="scan-tab ' + (ScanState.tab === t.k ? 'on' : '') + '" data-stab="' + t.k + '">' +
      UI.icon(t.i) + '<span>' + t.t + '</span></button>').join('') + '</div>';

    if (ScanState.tab === 'barcode') return head + renderBarcodeTab();
    if (ScanState.tab === 'doc') return head + renderDocTab();
    return head + renderTextTab();
  },

  mount(el) {
    el.querySelectorAll('[data-stab]').forEach(b => {
      b.addEventListener('click', () => {
        if (ScanState.tab === 'barcode') Engine.stopCamera();
        ScanState.tab = b.dataset.stab;
        App.refresh();
      });
    });
    if (ScanState.tab === 'barcode') mountBarcode(el);
    else if (ScanState.tab === 'doc') mountDoc(el);
    else mountText(el);
  },
};

function billTotal() {
  return ScanState.bill.reduce((s, it) => {
    const p = Store.product(it.pid);
    return s + (p ? p.cost * it.qty : 0);
  }, 0);
}

function recentScans() {
  const list = (Store.db.scans || []).slice(0, 4);
  if (!list.length) {
    return '<div class="recent"><p class="recent-t">最近扫描</p>' +
      '<div class="recent-none">还没有扫描记录，试试上传一张条码图</div></div>';
  }
  return '<div class="recent"><p class="recent-t">最近扫描</p>' +
    list.map(s => {
      const p = Store.product(s.pid);
      if (!p) return '';
      const d = new Date(s.t);
      return '<button class="recent-item" data-recent="' + s.pid + '">' + UI.productTile(p, 'xs') +
        '<span class="ri-t"><b>' + p.name + '</b><i>' + s.code + '</i></span>' +
        '<span class="ri-time">' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + '</span>' +
      '</button>';
    }).join('') + '</div>';
}

function renderBarcodeTab() {
  const r = ScanState.lastProduct;
  const p = r ? Store.product(r.pid) : null;

  return '<div class="scan-wrap">' +
    '<div class="scan-stage">' +
      '<div class="viewfinder" id="vf">' +
        '<video id="cam" playsinline muted></video>' +
        '<div class="vf-idle" id="vfIdle">' + UI.icon('barcode') + '<b>摄像头未开启</b><i>也可以上传图片或手动输入</i></div>' +
        '<span class="vf-c tl"></span><span class="vf-c tr"></span><span class="vf-c bl"></span><span class="vf-c br"></span>' +
        '<div class="vf-line" id="vfLine"></div>' +
        '<div class="vf-badge" id="vfBadge">' + UI.icon('camera') + '准备就绪</div>' +
      '</div>' +
      '<div class="stage-actions">' +
        '<button class="btn primary" id="camBtn">' + UI.icon('camera') + '开启摄像头</button>' +
        '<label class="btn soft file-btn">' + UI.icon('upload') + '上传条码图<input type="file" accept="image/*" id="bcFile" hidden></label>' +
        '<button class="btn ghost" id="manualBtn">' + UI.icon('edit') + '手动输入</button>' +
      '</div>' +
      '<p class="stage-note">' + (Engine.hasDetector ? '本机支持原生 BarcodeDetector，识别更快' : '使用 ZXing WASM 解码，支持 EAN-13 / Code128 / QR') + '</p>' +
    '</div>' +

    '<div class="scan-side">' +
      '<div class="card result-card" id="scanResult">' +
        (p ? '<div class="rc-head">' + UI.productTile(p, 'md') +
              '<div class="rc-t"><b>' + p.name + '</b><i>' + p.spec + '</i><span class="rc-code">' + UI.ean13(p.bc) + '</span></div>' +
              '<span class="pill ok"><i></i>已匹配</span>' +
            '</div>' +
            '<div class="rc-stock"><div><i>当前库存</i><b>' + p.stock + ' ' + p.unit + '</b></div>' +
              '<div><i>库位</i><b>' + p.loc + '</b></div><div><i>成本</i><b>' + UI.money(p.cost) + '</b></div></div>' +
            '<div class="rc-qty"><span>入库数量</span>' +
              '<div class="stepper"><button id="qDec">' + UI.icon('minus') + '</button>' +
              '<input id="qVal" type="number" value="1" min="1" inputmode="numeric"><button id="qInc">' + UI.icon('plus') + '</button></div>' +
            '</div>' +
            '<button class="btn primary wide" id="addBill">' + UI.icon('plus') + '加入本单</button>'
          : '<div class="rc-empty">' + UI.icon('scan') + '<b>等待扫码</b><p>扫描或上传一个条码，自动匹配商品档案</p></div>' + recentScans()) +
      '</div>' +

      '<div class="card bill-card">' +
        '<div class="card-head"><div><h3>本单</h3><p>' + ScanState.bill.length + ' 个品</p></div>' +
          (ScanState.bill.length ? '<button class="link danger-t" id="clearBill">清空</button>' : '') + '</div>' +
        (ScanState.bill.length ?
          '<div class="bill-list">' + ScanState.bill.map((it, i) => {
            const pp = Store.product(it.pid);
            return '<div class="bill-item">' + UI.productTile(pp, 'xs') +
              '<span class="bill-t"><b>' + pp.name + '</b><i>' + pp.spec + '</i></span>' +
              '<span class="bill-q">× ' + it.qty + '</span>' +
              '<button class="icon-btn xs" data-del="' + i + '">' + UI.icon('x') + '</button>' +
            '</div>';
          }).join('') + '</div>' +
          '<div class="bill-foot"><span>预估金额 <b>' + UI.money(billTotal()) + '</b></span>' +
          '<button class="btn primary" id="billSubmit">生成入库单</button></div>'
        : '<div class="bill-empty">还没有商品，扫码后点「加入本单」</div>') +
      '</div>' +
    '</div>' +
  '</div>';
}

function mountBarcode(el) {
  const camBtn = el.querySelector('#camBtn');
  const video = el.querySelector('#cam');
  const badge = el.querySelector('#vfBadge');
  const idle = el.querySelector('#vfIdle');
  const line = el.querySelector('#vfLine');

  function acceptCode(code, fromCamera) {
    const p = Store.byBarcode(code);
    if (!p) {
      UI.toast('未匹配到商品：' + code, 'warn');
      badge.innerHTML = UI.icon('alert') + '未匹配 ' + code;
      return;
    }
    ScanState.lastProduct = { pid: p.id, code: code, at: Date.now() };
    Store.addScan({ code: code, pid: p.id, name: p.name, from: fromCamera ? 'camera' : 'image' });
    badge.innerHTML = UI.icon('check') + '识别成功';
    if (fromCamera) { Engine.stopCamera(); ScanState.camOn = false; }
    UI.toast('已识别 ' + p.name, 'ok');
    App.refresh();
  }
  window.__acceptCode = acceptCode;

  if (camBtn) {
    camBtn.addEventListener('click', async () => {
      if (ScanState.camOn) {
        Engine.stopCamera(); ScanState.camOn = false;
        video.style.display = 'none'; idle.style.display = '';
        line.style.display = 'none';
        camBtn.innerHTML = UI.icon('camera') + '开启摄像头';
        return;
      }
      try {
        badge.innerHTML = UI.icon('camera') + '启动摄像头…';
        await Engine.startCamera(video, (tick, r, dup) => {
          if (r && !dup) acceptCode(r.code, true);
        });
        ScanState.camOn = true;
        video.style.display = 'block';
        idle.style.display = 'none';
        line.style.display = '';
        badge.innerHTML = UI.icon('scan') + '正在扫描…';
        camBtn.innerHTML = UI.icon('x') + '关闭摄像头';
      } catch (e) {
        badge.innerHTML = UI.icon('alert') + '摄像头不可用';
        UI.toast(e.message || '摄像头启动失败，请改用上传图片', 'err');
      }
    });
  }

  const file = el.querySelector('#bcFile');
  if (file) {
    file.addEventListener('change', async () => {
      if (!file.files.length) return;
      UI.toast('正在解码…');
      try {
        const r = await Engine.decodeFile(file.files[0]);
        if (r) acceptCode(r.code, false);
        else { UI.toast('没能识别出条码，换个角度或更清晰的图片试试', 'warn'); badge.innerHTML = UI.icon('alert') + '未识别到条码'; }
      } catch (e) {
        UI.toast('图片解析失败', 'err');
      }
    });
  }

  const mb = el.querySelector('#manualBtn');
  if (mb) {
    mb.addEventListener('click', () => {
      UI.open({
        variant: 'modal',
        title: '手动输入条码',
        body: '<input class="input big" id="manCode" placeholder="输入 13 位条码" inputmode="numeric" value="">' +
              '<p class="hint-line">示例：' + Store.products()[0].bc + '（' + Store.products()[0].name + '）</p>',
        foot: '<button class="btn ghost" data-close>取消</button><button class="btn primary" id="manOk">识别</button>',
        onMount(l) {
          const i = l.querySelector('#manCode');
          i.focus();
          l.querySelector('#manOk').addEventListener('click', () => { UI.close(); acceptCode(i.value.trim(), false); });
          i.addEventListener('keydown', e => { if (e.key === 'Enter') { UI.close(); acceptCode(i.value.trim(), false); } });
        },
      });
    });
  }

  // 最近扫描回填
  el.querySelectorAll('[data-recent]').forEach(b => {
    b.addEventListener('click', () => {
      const p = Store.product(b.dataset.recent);
      if (!p) return;
      ScanState.lastProduct = { pid: p.id, code: p.bc, at: Date.now() };
      App.refresh();
    });
  });

  // 数量与加入本单
  const qInc = el.querySelector('#qInc'), qDec = el.querySelector('#qDec'), qVal = el.querySelector('#qVal');
  if (qInc) {
    qInc.addEventListener('click', () => { qVal.value = Number(qVal.value) + 1; });
    qDec.addEventListener('click', () => { qVal.value = Math.max(1, Number(qVal.value) - 1); });
  }
  const addBill = el.querySelector('#addBill');
  if (addBill) {
    addBill.addEventListener('click', () => {
      const pid = ScanState.lastProduct.pid;
      const qty = Math.max(1, Number(qVal.value) || 1);
      const ex = ScanState.bill.find(x => x.pid === pid);
      if (ex) ex.qty += qty; else ScanState.bill.push({ pid, qty });
      ScanState.lastProduct = null;
      UI.toast('已加入本单', 'ok');
      App.refresh();
    });
  }
  el.querySelectorAll('[data-del]').forEach(b => {
    b.addEventListener('click', () => {
      ScanState.bill.splice(Number(b.dataset.del), 1);
      App.refresh();
    });
  });
  const clr = el.querySelector('#clearBill');
  if (clr) clr.addEventListener('click', () => { ScanState.bill = []; App.refresh(); });

  const sub = el.querySelector('#billSubmit');
  if (sub) {
    sub.addEventListener('click', () => {
      const doc = {
        id: 'RK-' + todayStr().replace(/-/g, '') + '-' + pad(Math.floor(Math.random() * 900) + 100, 3),
        type: 'inbound',
        code: 'RK' + todayStr().replace(/-/g, '') + pad(Store.docs().length + 11, 3),
        partner: '扫码快速入库',
        status: 'pending',
        amount: billTotal(),
        createdAt: todayStr() + ' ' + pad(new Date().getHours()) + ':' + pad(new Date().getMinutes()),
        owner: '林知夏',
        source: 'scan',
        items: ScanState.bill.map(it => ({ pid: it.pid, qty: it.qty, price: (Store.product(it.pid) || {}).cost || 0 })),
      };
      Store.addDoc(doc);
      ScanState.bill = [];
      UI.toast('已生成入库单，待审批', 'ok');
      location.hash = '#/docs';
    });
  }
}

/* -------- 拍照录单 -------- */
function renderDocTab() {
  const doc = ScanState.doc;
  const f = doc && doc.fields;
  const rows = f && f.items && f.items.length
    ? f.items.map((it, i) => '<tr>' +
        '<td data-l="商品">' + it.name + '<i class="sub">' + it.spec + '</i></td>' +
        '<td data-l="数量"><input class="mini-input" data-qty="' + i + '" type="number" value="' + it.qty + '" min="0"></td>' +
        '<td data-l="单价">' + UI.money(it.price) + '</td>' +
        '<td data-l="金额">' + UI.money(it.price * it.qty) + '</td>' +
      '</tr>').join('')
    : '';

  return '<div class="scan-wrap scan-doc">' +
    '<div class="scan-stage">' +
      '<label class="dropzone lg" id="docDrop">' +
        '<span class="dz-ico">' + UI.icon('camera') + '</span>' +
        '<b>上传送货单 / 发票 / 入库清单</b>' +
        '<p>支持 JPG、PNG · 建议正对拍摄、光线均匀</p>' +
        '<span class="dz-btn">选择图片</span>' +
        '<input type="file" accept="image/*" id="docFile" hidden>' +
      '</label>' +
      (doc && ScanState.docImg ? '<div class="ocr-preview big"><img src="' + ScanState.docImg + '" alt="识别原图"></div>' : '') +
      '<div class="stage-actions center">' +
        '<button class="btn soft" id="sampleBtn">' + UI.icon('spark') + '用示例单据试一次</button>' +
        '<button class="btn ghost" id="cameraDocBtn">' + UI.icon('camera') + '拍照</button>' +
      '</div>' +
      (doc ? '' :
        '<div class="pipe">' +
          '<p class="pipe-t">识别流水线</p>' +
          '<div class="pipe-steps">' +
            '<div class="pipe-step"><span>1</span><b>图像预处理</b><i>灰度 · 缩放 · 提高对比</i></div>' +
            '<div class="pipe-step"><span>2</span><b>版面分析</b><i>切分行与文字块</i></div>' +
            '<div class="pipe-step"><span>3</span><b>文字识别</b><i>chi_sim 中文模型</i></div>' +
            '<div class="pipe-step"><span>4</span><b>字段抽取</b><i>正则 + 商品模糊匹配</i></div>' +
          '</div>' +
        '</div>') +
      '<div class="ocr-progress" id="ocrProg" hidden>' +
        '<div class="op-head"><span id="opStage">准备中…</span><b id="opPct">0%</b></div>' +
        '<div class="op-bar"><i id="opBar"></i></div>' +
        '<ul class="op-steps" id="opSteps"></ul>' +
      '</div>' +
      '<div class="ocr-preview" id="ocrPrev" hidden><img id="prevImg" alt=""></div>' +
    '</div>' +

    '<div class="scan-side">' +
      '<div class="card">' +
        '<div class="card-head"><div><h3>识别结果</h3><p>' + (doc && doc.demo ? '演示数据（引擎未就绪）' : '来自真实 OCR') + '</p></div>' +
          (doc ? '<span class="pill ' + (doc.demo ? 'warn' : 'ok') + '"><i></i>' + (doc.demo ? '演示' : 'OCR') + '</span>' : '') +
        '</div>' +
        (f ?
          '<div class="field-grid">' +
            '<label class="field"><i>供应商</i><input id="fSupplier" value="' + (f.supplier || '') + '"></label>' +
            '<label class="field"><i>单据号</i><input id="fCode" value="' + (f.code || '') + '"></label>' +
            '<label class="field"><i>日期</i><input id="fDate" type="date" value="' + (f.date || '') + '"></label>' +
            '<label class="field"><i>合计金额</i><input id="fAmount" type="number" value="' + (f.amount || 0) + '"></label>' +
          '</div>' +
          '<div class="tbl-wrap"><table class="tbl ocr-tbl"><thead><tr><th>商品</th><th>数量</th><th>单价</th><th>金额</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          '<div class="ocr-meta">' +
            '<span>整体置信度 <b>' + (doc.confidence || 0) + '%</b></span>' +
            '<span>识别行数 <b>' + (f.lineCount || 0) + '</b></span>' +
            '<span>耗时 <b>' + (doc.ms || 0) + ' ms</b></span>' +
          '</div>' +
          '<details class="raw-box"><summary>查看原始识别文本</summary><pre>' + escapeHtml(doc.text || '') + '</pre></details>' +
          '<div class="doc-actions">' +
            '<button class="btn ghost" id="ocrAgain">重新识别</button>' +
            '<button class="btn primary" id="docSubmit">生成入库单</button>' +
          '</div>'
        : emptyState('doc', '还没有识别结果', '上传一张单据图片，或用示例单据体验完整流程', '')) +
      '</div>' +
    '</div>' +
  '</div>';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function makeSampleInvoice() {
  const ps = Store.products().slice(0, 3);
  const sup = Store.suppliers()[0] || '示例供应商';
  const code = 'RK' + todayStr().replace(/-/g, '') + '031';
  const qty = [60, 10, 8];
  const rows = ps.map((p, i) => [p.name, p.spec || '', String(qty[i] || 5), p.cost.toFixed(2)]);
  const total = rows.reduce((a, r) => a + Number(r[2]) * Number(r[3]), 0);

  const c = document.createElement('canvas');
  c.width = 900; c.height = 1100;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#111';
  x.font = 'bold 44px "Microsoft YaHei", sans-serif';
  x.fillText('送 货 单', 340, 90);
  x.font = '26px "Microsoft YaHei", sans-serif';
  x.fillText('供应商：' + sup, 70, 180);
  x.fillText('单号：' + code, 70, 230);
  x.fillText('日期：' + todayStr(), 70, 280);
  x.strokeStyle = '#111'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(60, 320); x.lineTo(840, 320); x.stroke();
  x.font = 'bold 26px "Microsoft YaHei", sans-serif';
  x.fillText('名称', 70, 370); x.fillText('规格', 380, 370); x.fillText('数量', 620, 370); x.fillText('单价', 720, 370);
  x.font = '26px "Microsoft YaHei", sans-serif';
  rows.forEach((r, i) => {
    const y = 430 + i * 62;
    x.fillText(r[0], 70, y); x.fillText(r[1], 380, y); x.fillText(r[2], 620, y); x.fillText(r[3], 720, y);
  });
  x.beginPath(); x.moveTo(60, 640); x.lineTo(840, 640); x.stroke();
  x.font = 'bold 28px "Microsoft YaHei", sans-serif';
  x.fillText('合计：' + total.toFixed(2), 560, 700);
  x.font = '24px "Microsoft YaHei", sans-serif';
  x.fillText('收货人：____________    制单人：____________', 70, 800);
  return c.toDataURL('image/png');
}

function mountDoc(el) {
  const file = el.querySelector('#docFile');
  const drop = el.querySelector('#docDrop');
  const prog = el.querySelector('#ocrProg');
  const prev = el.querySelector('#ocrPrev');

  const steps = [
    { pct: 8,  t: '加载识别内核' },
    { pct: 30, t: '加载中文语言模型' },
    { pct: 52, t: '逐行识别文字' },
    { pct: 88, t: '抽取字段与明细' },
    { pct: 100, t: '完成' },
  ];

  function paintProgress(pct, stage) {
    prog.hidden = false;
    el.querySelector('#opPct').textContent = Math.round(pct) + '%';
    el.querySelector('#opBar').style.width = pct + '%';
    el.querySelector('#opStage').textContent = stage || '识别中…';
    el.querySelector('#opSteps').innerHTML = steps.map(s => {
      const done = pct >= s.pct;
      const cur = !done && pct >= s.pct - 18;
      return '<li class="' + (done ? 'done' : cur ? 'cur' : '') + '">' +
        '<i>' + (done ? UI.icon('check') : '') + '</i><span>' + s.t + '</span></li>';
    }).join('');
  }

  async function runOcr(src, previewUrl) {
    if (previewUrl) { prev.hidden = false; el.querySelector('#prevImg').src = previewUrl; }
    paintProgress(2, '准备中…');
    const t0 = performance.now();
    const res = await Engine.recognize(src, (o) => paintProgress(o.pct, o.stage));
    res.ms = Math.round(performance.now() - t0);
    ScanState.doc = res;
    ScanState.docImg = previewUrl || null;
    UI.toast(res.demo ? '演示模式：引擎未加载，返回示例数据' : '识别完成 · 置信度 ' + res.confidence + '%', res.demo ? 'warn' : 'ok');
    App.refresh();
  }

  if (file) file.addEventListener('change', () => {
    if (!file.files.length) return;
    const url = URL.createObjectURL(file.files[0]);
    runOcr(file.files[0], url);
  });

  if (drop) {
    ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('hot'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('hot'); }));
    drop.addEventListener('drop', e => {
      const f = e.dataTransfer.files[0];
      if (f) runOcr(f, URL.createObjectURL(f));
    });
  }

  const sample = el.querySelector('#sampleBtn');
  if (sample) sample.addEventListener('click', async () => {
    const dataUrl = makeSampleInvoice();
    runOcr(dataUrl, dataUrl);
  });

  const camBtn = el.querySelector('#cameraDocBtn');
  if (camBtn) camBtn.addEventListener('click', () => {
    UI.open({
      variant: 'modal',
      title: '拍摄单据',
      sub: '摄像头仅在 HTTPS 或 localhost 环境可用',
      body: '<div class="cam-box"><video id="docCam" playsinline muted></video><span class="vf-c tl"></span><span class="vf-c tr"></span><span class="vf-c bl"></span><span class="vf-c br"></span></div>',
      foot: '<button class="btn ghost" data-close>关闭</button><button class="btn primary" id="shotBtn">拍下并识别</button>',
      onMount(l) {
        const v = l.querySelector('#docCam');
        Engine.startCamera(v, () => {}).catch(e => {
          l.querySelector('.cam-box').innerHTML = '<div class="cam-fail">' + UI.icon('alert') + '<b>无法使用摄像头</b><p>' + e.message + '</p></div>';
        });
        l.querySelector('#shotBtn').addEventListener('click', () => {
          if (!v.videoWidth) { UI.toast('摄像头还没准备好', 'warn'); return; }
          const c = document.createElement('canvas');
          c.width = v.videoWidth; c.height = v.videoHeight;
          c.getContext('2d').drawImage(v, 0, 0);
          const url = c.toDataURL('image/jpeg', 0.92);
          Engine.stopCamera();
          UI.close();
          setTimeout(() => runOcr(url, url), 260);
        });
      },
    });
    document.getElementById('scrim').addEventListener('click', () => Engine.stopCamera());
  });

  const again = el.querySelector('#ocrAgain');
  if (again) again.addEventListener('click', () => { ScanState.doc = null; ScanState.docImg = null; App.refresh(); });

  const submit = el.querySelector('#docSubmit');
  if (submit) submit.addEventListener('click', () => {
    const f = ScanState.doc.fields;
    const items = f.items.map((it, i) => {
      const inp = el.querySelector('[data-qty="' + i + '"]');
      return { pid: it.pid, qty: Number(inp ? inp.value : it.qty) || 0, price: it.price };
    }).filter(x => x.qty > 0);
    if (!items.length) { UI.toast('明细为空，无法生成单据', 'warn'); return; }
    const amount = items.reduce((s, it) => s + it.qty * it.price, 0);
    Store.addDoc({
      id: 'RK-' + todayStr().replace(/-/g, '') + '-' + pad(Math.floor(Math.random() * 900) + 100, 3),
      type: 'inbound',
      code: el.querySelector('#fCode').value || 'RK' + todayStr().replace(/-/g, ''),
      partner: el.querySelector('#fSupplier').value || '未知供应商',
      status: 'pending',
      amount: amount,
      createdAt: el.querySelector('#fDate').value + ' ' + pad(new Date().getHours()) + ':' + pad(new Date().getMinutes()),
      owner: '林知夏',
      source: 'ocr',
      items: items,
    });
    Store.db.ocrCount++;
    ScanState.doc = null;
    ScanState.docImg = null;
    UI.toast('入库单已生成，待审批', 'ok');
    location.hash = '#/docs';
  });
}

/* -------- 识文字 -------- */
function renderTextTab() {
  const r = ScanState.text;
  return '<div class="scan-wrap scan-doc">' +
    '<div class="scan-stage">' +
      '<label class="dropzone lg" id="txtDrop">' +
        '<span class="dz-ico">' + UI.icon('spark') + '</span>' +
        '<b>上传图片，提取其中文字</b>' +
        '<p>适合说明书、合同、名片等非结构化图片</p>' +
        '<span class="dz-btn">选择图片</span>' +
        '<input type="file" accept="image/*" id="txtFile" hidden>' +
      '</label>' +
      '<div class="ocr-progress" id="txtProg" hidden>' +
        '<div class="op-head"><span id="tpStage">准备中…</span><b id="tpPct">0%</b></div>' +
        '<div class="op-bar"><i id="tpBar"></i></div>' +
      '</div>' +
      '<div class="ocr-preview" id="txtPrev" hidden><img id="txtImg" alt=""></div>' +
    '</div>' +
    '<div class="scan-side">' +
      '<div class="card">' +
        '<div class="card-head"><div><h3>识别文本</h3><p>' + (r ? '置信度 ' + r.confidence + '%' : '支持中英文混排') + '</p></div>' +
          (r ? '<button class="link" id="copyTxt">复制</button>' : '') +
        '</div>' +
        (r ? '<pre class="raw-text">' + escapeHtml(r.text || '（未识别到文字）') + '</pre>'
           : emptyState('spark', '等待图片', '上传图片后会在原文位置返回可编辑文本', '')) +
      '</div>' +
    '</div>' +
  '</div>';
}

function mountText(el) {
  const file = el.querySelector('#txtFile');
  const prog = el.querySelector('#txtProg');
  if (!file) return;
  file.addEventListener('change', async () => {
    if (!file.files.length) return;
    const url = URL.createObjectURL(file.files[0]);
    el.querySelector('#txtPrev').hidden = false;
    el.querySelector('#txtImg').src = url;
    prog.hidden = false;
    const res = await Engine.recognize(file.files[0], (o) => {
      el.querySelector('#tpPct').textContent = Math.round(o.pct) + '%';
      el.querySelector('#tpBar').style.width = o.pct + '%';
      el.querySelector('#tpStage').textContent = o.stage;
    });
    ScanState.text = res;
    UI.toast(res.demo ? '演示模式返回' : '识别完成', res.demo ? 'warn' : 'ok');
    App.refresh();
  });
  const cp = el.querySelector('#copyTxt');
  if (cp) cp.addEventListener('click', () => {
    navigator.clipboard.writeText(ScanState.text.text || '').then(
      () => UI.toast('已复制到剪贴板', 'ok'),
      () => UI.toast('复制失败，请手动选择', 'warn'));
  });
}

/* =========================================================
 * 3. 库存
 * ======================================================= */
const InvState = { q: '', filter: 'all' };

Pages.inventory = {
  get title() { return Store.labels().inv; },
  sub: '实时库存 · 批次 · 库位',
  render() {
    const st = Store.stats();
    let list = Store.search(InvState.q);
    if (InvState.filter === 'low') list = list.filter(p => p.stock < p.safe && p.stock > 0);
    else if (InvState.filter === 'out') list = list.filter(p => p.stock === 0);
    else if (InvState.filter === 'exp') list = list.filter(p => daysTo(p.expiry) <= 30);

    const chips = [
      { k: 'all', t: '全部' }, { k: 'low', t: '低库存' }, { k: 'out', t: '已售罄' }, { k: 'exp', t: '临期' },
    ];

    return '<div class="inv-sum">' +
        '<div class="is-item"><i>库存总值</i><b>' + UI.moneyShort(st.value) + '</b></div>' +
        '<div class="is-item"><i>SKU 数</i><b>' + st.sku + '</b></div>' +
        '<div class="is-item"><i>低库存</i><b class="warn-t">' + st.low + '</b></div>' +
        '<div class="is-item"><i>临期</i><b class="warn-t">' + st.soon + '</b></div>' +
      '</div>' +

      '<div class="toolbar">' +
        '<label class="search inline">' + UI.icon('search') +
          '<input id="invQ" placeholder="搜索名称 / 条码 / 库位" value="' + InvState.q + '">' +
        '</label>' +
        '<div class="chips">' + chips.map(c =>
          '<button class="chip ' + (InvState.filter === c.k ? 'on' : '') + '" data-f="' + c.k + '">' + c.t + '</button>').join('') + '</div>' +
        '<button class="btn soft sm only-d" id="addProd">' + UI.icon('plus') + '新增商品</button>' +
      '</div>' +

      '<div class="card tbl-card">' +
        (list.length ?
          '<table class="tbl inv-tbl">' +
            '<thead><tr><th>商品</th><th>条码</th><th>库位</th><th class="ta-r">库存</th><th class="ta-r">安全线</th><th class="ta-r">成本</th><th>状态</th></tr></thead>' +
            '<tbody>' + list.map(p => {
              const ratio = Math.round((p.stock / Math.max(p.safe, 1)) * 100);
              const bad = p.stock === 0, warn = p.stock < p.safe;
              return '<tr data-prod="' + p.id + '" class="row-click">' +
                '<td data-l="商品"><div class="cell-prod">' + UI.productTile(p, 'xs') +
                  '<span><b>' + p.name + '</b><i>' + p.spec + '</i></span></div></td>' +
                '<td data-l="条码"><span class="mono">' + UI.ean13(p.bc) + '</span></td>' +
                '<td data-l="库位"><span class="loc">' + p.loc + '</span></td>' +
                '<td data-l="库存" class="ta-r"><b class="' + (bad ? 'bad' : warn ? 'warn' : '') + '">' + p.stock + '</b>' +
                  '<span class="stock-bar"><i class="' + (bad ? 'bad' : warn ? 'warn' : 'ok') + '" style="width:' + Math.min(100, ratio) + '%"></i></span></td>' +
                '<td data-l="安全线" class="ta-r muted">' + p.safe + '</td>' +
                '<td data-l="成本" class="ta-r">' + UI.money(p.cost) + '</td>' +
                '<td data-l="状态">' + (bad ? '<span class="pill danger"><i></i>售罄</span>'
                  : warn ? '<span class="pill warn"><i></i>偏低</span>'
                  : '<span class="pill ok"><i></i>正常</span>') + '</td>' +
              '</tr>';
            }).join('') + '</tbody>' +
          '</table>'
        : emptyState('search', '没有匹配的商品', '换个关键词，或清除筛选条件', '<button class="btn soft sm" id="clearF">清除筛选</button>')) +
      '</div>';
  },

  mount(el) {
    const q = el.querySelector('#invQ');
    if (q) q.addEventListener('input', () => {
      InvState.q = q.value;
      const list = Store.search(q.value);
      // 轻量重绘（保留焦点）
      App.refresh(true);
      const nq = document.getElementById('invQ');
      if (nq) { nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); }
    });
    el.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => {
      InvState.filter = b.dataset.f; App.refresh();
    }));
    el.querySelectorAll('tr[data-prod]').forEach(tr => tr.addEventListener('click', () => openProduct(tr.dataset.prod)));
    const cf = el.querySelector('#clearF');
    if (cf) cf.addEventListener('click', () => { InvState.q = ''; InvState.filter = 'all'; App.refresh(); });
    const ap = el.querySelector('#addProd');
    if (ap) ap.addEventListener('click', () => UI.toast('新增商品会调用「拍照识别条码」自动填充', 'ok'));
  },
};

/* =========================================================
 * 4. 单据
 * ======================================================= */
const DocState = { filter: 'all' };

Pages.docs = {
  get title() { return Store.labels().doc; },
  sub: '入库 · 出库 · 调拨 · 盘点',
  render() {
    let list = Store.docs();
    if (DocState.filter !== 'all') list = list.filter(d => d.type === DocState.filter);
    const pending = Store.docs().filter(d => d.status === 'pending').length;
    const chips = [
      { k: 'all', t: '全部' }, { k: 'inbound', t: '入库' }, { k: 'outbound', t: '出库' },
      { k: 'transfer', t: '调拨' }, { k: 'check', t: '盘点' },
    ];

    return '<div class="inv-sum">' +
        '<div class="is-item"><i>待审批</i><b class="warn-t">' + pending + '</b></div>' +
        '<div class="is-item"><i>今日单据</i><b>' + Store.docs().filter(d => d.createdAt.startsWith(todayStr())).length + '</b></div>' +
        '<div class="is-item"><i>本月金额</i><b>' + UI.moneyShort(Store.docs().reduce((s, d) => s + d.amount, 0)) + '</b></div>' +
      '</div>' +
      '<div class="toolbar"><div class="chips">' + chips.map(c =>
        '<button class="chip ' + (DocState.filter === c.k ? 'on' : '') + '" data-df="' + c.k + '">' + c.t + '</button>').join('') + '</div></div>' +
      '<div class="doc-list">' +
        (list.length ? list.map(d => {
          const typeName = DOC_TYPE[d.type] || '单据';
          const qtySum = d.items.reduce((s, i) => s + Math.abs(i.qty), 0);
          return '<article class="card doc-card" data-doc="' + d.id + '">' +
            '<div class="dc-top">' +
              '<span class="dc-type ' + d.type + '">' + UI.icon(d.type === 'inbound' ? 'downArrow' : d.type === 'outbound' ? 'up' : d.type === 'check' ? 'check' : 'truck') + typeName + '</span>' +
              pill(d.status) +
              '<span class="dc-src">' + (d.source === 'ocr' ? UI.icon('camera') + 'OCR' : d.source === 'scan' ? UI.icon('barcode') + '扫码' : UI.icon('edit') + '手工') + '</span>' +
            '</div>' +
            '<div class="dc-mid">' +
              '<h4>' + d.id + '</h4>' +
              '<p>' + d.partner + '</p>' +
            '</div>' +
            '<div class="dc-grid">' +
              '<div><i>品项</i><b>' + d.items.length + ' 个 / ' + qtySum + ' 件</b></div>' +
              '<div><i>金额</i><b>' + (d.amount ? UI.money(d.amount) : '—') + '</b></div>' +
              '<div><i>创建</i><b>' + d.createdAt + '</b></div>' +
              '<div><i>经办</i><b>' + d.owner + '</b></div>' +
            '</div>' +
            (d.status === 'pending' ?
              '<div class="dc-act"><button class="btn soft sm" data-reject="' + d.id + '">驳回</button>' +
              '<button class="btn primary sm" data-approve="' + d.id + '">通过并入库</button></div>' : '') +
          '</article>';
        }).join('') : emptyState('doc', '没有单据', '换个类型筛选试试', '')) +
      '</div>';
  },

  mount(el) {
    el.querySelectorAll('[data-df]').forEach(b => b.addEventListener('click', () => {
      DocState.filter = b.dataset.df; App.refresh();
    }));
    el.querySelectorAll('[data-approve]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const id = b.dataset.approve;
      Store.setDocStatus(id, 'approved');
      UI.toast('已通过，库存已更新', 'ok');
      App.refresh();
    }));
    el.querySelectorAll('[data-reject]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      Store.setDocStatus(b.dataset.reject, 'draft');
      UI.toast('已驳回，退回草稿', 'warn');
      App.refresh();
    }));
    el.querySelectorAll('[data-doc]').forEach(c => c.addEventListener('click', () => openDoc(c.dataset.doc)));
  },
};

function openDoc(id) {
  const d = Store.docs().find(x => x.id === id);
  if (!d) return;
  UI.open({
    title: d.id,
    sub: DOC_TYPE[d.type] + ' · ' + d.partner,
    body:
      '<div class="doc-detail-top">' + pill(d.status) +
        '<span class="muted">' + d.createdAt + ' · ' + d.owner + '</span></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>商品</th><th>数量</th><th>单价</th><th>小计</th></tr></thead><tbody>' +
        d.items.map(it => {
          const p = Store.product(it.pid) || { name: it.pid, spec: '' };
          return '<tr><td>' + p.name + '<i class="sub">' + (p.spec || '') + '</i></td>' +
            '<td>' + it.qty + '</td><td>' + (it.price ? UI.money(it.price) : '—') + '</td>' +
            '<td>' + (it.price ? UI.money(it.price * it.qty) : '—') + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
      (d.amount ? '<div class="doc-total"><span>合计</span><b>' + UI.money(d.amount) + '</b></div>' : '') +
      '<div class="doc-timeline">' +
        '<div class="tl-item done"><i></i><span>创建单据</span><em>' + d.createdAt + '</em></div>' +
        '<div class="tl-item ' + (d.status === 'pending' ? 'cur' : 'done') + '"><i></i><span>提交审批</span><em>' + d.owner + '</em></div>' +
        '<div class="tl-item ' + (d.status === 'approved' || d.status === 'done' ? 'done' : '') + '"><i></i><span>审核通过</span><em>' + (d.status === 'approved' || d.status === 'done' ? '已通过' : '等待中') + '</em></div>' +
      '</div>',
    foot: (d.status === 'pending' ? '<button class="btn ghost" data-close>关闭</button><button class="btn primary" id="dApproved">通过并入库</button>'
      : '<button class="btn ghost" data-close>关闭</button>'),
    onMount(l) {
      const b = l.querySelector('#dApproved');
      if (b) b.addEventListener('click', () => {
        Store.setDocStatus(d.id, 'approved');
        UI.close(); UI.toast('已通过，库存已更新', 'ok'); App.refresh();
      });
    },
  });
}

/* =========================================================
 * 5. 商品
 * ======================================================= */
Pages.products = {
  get title() { return Store.labels().productPage; },
  sub: '档案 · 条码 · 图片',
  render() {
    const list = Store.products();
    return '<div class="toolbar">' +
        '<label class="search inline">' + UI.icon('search') + '<input id="pQ" placeholder="搜索商品"></label>' +
        '<button class="btn soft sm" id="pAdd">' + UI.icon('plus') + '拍照建档</button>' +
      '</div>' +
      (list.length ? '' : emptyState('tag', '还没有' + Store.labels().product,
        '新建空间后可以手动添加，也可以扫码自动建档', '<button class="btn primary sm" id="pAdd2">新增' + Store.labels().product + '</button>')) +
      '<div class="prod-grid">' + list.map(p => {
        const c = Store.cat(p.cat);
        return '<article class="card prod-card" data-prod="' + p.id + '">' +
          '<div class="pc-visual" style="--h:' + c.hue + '">' + UI.productTile(p, 'lg') +
            '<span class="pc-cat">' + c.name + '</span>' +
            '<span class="pc-stock ' + (p.stock === 0 ? 'bad' : p.stock < p.safe ? 'warn' : '') + '">' + p.stock + '</span>' +
          '</div>' +
          '<div class="pc-body">' +
            '<b class="pc-name">' + p.name + '</b>' +
            '<p class="pc-spec">' + p.spec + '</p>' +
            '<div class="pc-bc">' + UI.barcode(p.bc, { h: 28 }) + '</div>' +
            '<div class="pc-foot"><span class="mono">' + (p.bc ? UI.ean13(p.bc) : '—') + '</span><b>' +
              (p.price ? UI.money(p.price) : '<i class="pc-cost">成本</i>' + UI.money(p.cost)) + '</b></div>' +
          '</div>' +
        '</article>';
      }).join('') + '</div>';
  },
  mount(el) {
    el.querySelectorAll('[data-prod]').forEach(c => c.addEventListener('click', () => openProduct(c.dataset.prod)));
    ['#pAdd', '#pAdd2'].forEach(sel => {
      const b = el.querySelector(sel);
      if (b) b.addEventListener('click', () => UI.toast('新增物料：填名称 / 规格 / 库位，条码可扫码带入', 'ok'));
    });
    const q = el.querySelector('#pQ');
    if (q) q.addEventListener('input', () => {
      const kw = q.value.trim().toLowerCase();
      el.querySelectorAll('.prod-card').forEach(c => {
        const p = Store.product(c.dataset.prod);
        const hit = !kw || p.name.toLowerCase().includes(kw) || p.bc.includes(kw);
        c.style.display = hit ? '' : 'none';
      });
    });
  },
};

/* =========================================================
 * 6. 协同
 * ======================================================= */
Pages.collab = {
  title: '协同',
  sub: '审批流 · 团队动态',
  render() {
    const todos = Store.todos();
    const feed = [
      { who: '周航', act: '提交了出库单', target: 'CK20261025009', time: '08:40', tone: 'accent' },
      { who: '王砚', act: '通过了入库单', target: 'RK20261025010', time: '07:58', tone: 'ok' },
      { who: '陈默', act: '发起了盘点', target: 'A库区 · PD20261024004', time: '昨晚 22:10', tone: 'brand' },
      { who: '系统', act: '自动生成补货建议', target: 'P1010 / P1002', time: '07:00', tone: 'warn' },
      { who: '林知夏', act: '用 OCR 录入了送货单', target: 'RK20261025007', time: '09:12', tone: 'ok' },
    ];
    return '<div class="collab-grid">' +
      '<div class="card">' +
        '<div class="card-head"><div><h3>待我处理</h3><p>' + todos.length + ' 项</p></div></div>' +
        '<div class="todo-list big">' + todos.map(t =>
          '<button class="todo-item" data-todo="' + t.id + '">' +
            '<span class="todo-ico ' + t.type + '">' + UI.icon(t.type === 'approve' ? 'check' : t.type === 'expiry' ? 'clock' : 'alert') + '</span>' +
            '<span class="todo-main"><b>' + t.title + '</b><i>' + t.desc + '</i></span>' +
            '<span class="todo-tag">' + t.tag + '</span>' +
          '</button>').join('') + '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-head"><div><h3>团队动态</h3><p>华东仓 · 6 人</p></div></div>' +
        '<div class="feed">' + feed.map(f =>
          '<div class="feed-row">' +
            '<span class="feed-av ' + f.tone + '">' + f.who.slice(0, 1) + '</span>' +
            '<div class="feed-t"><b>' + f.who + '</b> ' + f.act + ' <em>' + f.target + '</em><i>' + f.time + '</i></div>' +
          '</div>').join('') + '</div>' +
        '<div class="members">' +
          ['林知夏', '周航', '陈默', '王砚', '苏晴', '郑野'].map((n, i) =>
            '<span class="mem" style="--h:' + (200 + i * 26) + '">' + n.slice(0, 1) + '</span>').join('') +
          '<span class="mem ghost">+1</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  },
  mount(el) {
    el.querySelectorAll('[data-todo]').forEach(b => b.addEventListener('click', () => {
      const t = Store.todos().find(x => x.id === b.dataset.todo);
      if (t && t.type === 'approve') location.hash = '#/docs';
      else location.hash = '#/inventory';
    }));
  },
};

/* =========================================================
 * 7. 洞察
 * ======================================================= */
Pages.insights = {
  title: '数据洞察',
  sub: '周转 · 结构 · 补货建议',
  render() {
    const ps = Store.products();
    const byCat = {};
    ps.forEach(p => {
      byCat[p.cat] = byCat[p.cat] || { v: 0, n: 0 };
      byCat[p.cat].v += p.stock * p.cost;
      byCat[p.cat].n++;
    });
    const catSegs = Object.keys(byCat).map((k, i) => ({
      label: Store.cat(k).name, v: byCat[k].v,
      c: ['var(--brand)', 'var(--accent)', 'var(--ok)', 'var(--warn)', 'var(--danger)'][i % 5],
    }));
    const abc = [
      { k: 'A 类（高频高值）', v: ps.filter(p => p.abc === 'A').length, c: 'var(--brand)' },
      { k: 'B 类（常规）', v: ps.filter(p => p.abc === 'B').length, c: 'var(--accent)' },
      { k: 'C 类（长尾）', v: ps.filter(p => p.abc === 'C').length, c: 'var(--ink-3)' },
    ];
    const st2 = Store.stats();
    const outRate = st2.sku ? ((st2.out / st2.sku) * 100).toFixed(1) + '%' : '—';
    const activeRate = ps.length
      ? (ps.filter(p => p.sales30 >= 25).length / ps.length * 100).toFixed(1) + '%'
      : '—';
    const suggest = ps.filter(p => p.stock < p.safe * 1.2)
      .map(p => ({ p, need: Math.max(p.safe * 2 - p.stock, 0) }))
      .sort((a, b) => b.need - a.need).slice(0, 5);

    return '<div class="kpis">' +
        kpiCard({ icon:'clock', label:'平均周转天数', value:'18.4', tone:'brand', foot:'较上月 -2.1 天' }) +
        kpiCard({ icon:'alert', label:'缺货率', value: outRate, tone:'warn', foot: st2.out + ' 个 SKU 已售罄' }) +
        kpiCard({ icon:'layers', label:'呆滞库存', value: UI.moneyShort(ps.filter(p => p.sales30 < 25).reduce((s, p) => s + p.stock * p.cost, 0)), tone:'accent', foot:'超 30 天未动销' }) +
        kpiCard({ icon:'bolt', label:'动销率', value: activeRate, tone:'ok', foot: ps.filter(p => p.sales30 >= 25).length + ' / ' + ps.length + ' 个 SKU 有销' }) +
      '</div>' +
      '<div class="ins-grid">' +
        '<div class="card">' +
          '<div class="card-head"><div><h3>库存金额 · 品类结构</h3><p>按成本价计</p></div></div>' +
          '<div class="health-wrap">' +
            UI.donut(catSegs, UI.moneyShort(Store.stats().value), '库存总值') +
            '<div class="health-legend">' + catSegs.map(s =>
              '<div class="hl-row"><i style="background:' + s.c + '"></i><span>' + s.label + '</span><b>' + UI.moneyShort(s.v) + '</b></div>').join('') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-head"><div><h3>ABC 分类</h3><p>按动销与货值</p></div></div>' +
          UI.hbars(abc.map(x => ({ label: x.k, v: x.v, text: x.v + ' 个', c: x.c }))) +
        '</div>' +
        '<div class="card wide">' +
          '<div class="card-head"><div><h3>智能补货建议</h3><p>基于安全库存与 30 天动销</p></div>' +
            '<button class="btn soft sm" id="exportBtn">' + UI.icon('download') + '导出</button></div>' +
          '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>商品</th><th>当前</th><th>安全线</th><th>建议补货</th><th>预计到货</th></tr></thead><tbody>' +
            suggest.map(s => {
              const d = new Date(Date.now() + s.p.lead * 86400000);
              return '<tr><td><div class="cell-prod">' + UI.productTile(s.p, 'xs') + '<span><b>' + s.p.name + '</b><i>' + s.p.supplier + '</i></span></div></td>' +
                '<td class="' + (s.p.stock === 0 ? 'bad' : 'warn') + '">' + s.p.stock + '</td>' +
                '<td class="muted">' + s.p.safe + '</td>' +
                '<td><b class="brand-t">+' + s.need + ' ' + s.p.unit + '</b></td>' +
                '<td class="muted">' + (d.getMonth() + 1) + '/' + d.getDate() + '（' + s.p.lead + '天）</td></tr>';
            }).join('') + '</tbody></table></div>' +
        '</div>' +
      '</div>';
  },
  mount(el) {
    const e = el.querySelector('#exportBtn');
    if (e) e.addEventListener('click', () => UI.toast('补货建议已导出为 CSV（演示）', 'ok'));
  },
};

/* =========================================================
 * 8. 设计说明
 * ======================================================= */
Pages.about = {
  title: '设计说明',
  sub: '本次重设计的定位、架构与跨端策略',
  render() {
    const ia = [
      { g: '日常作业', items: ['工作台', '扫码作业', '库存'] },
      { g: '流转', items: ['单据', '协同'] },
      { g: '主数据', items: ['商品档案'] },
      { g: '分析', items: ['数据洞察'] },
    ];
    const flows = [
      { n: '01', t: '拍照收货入库', s: ['拍送货单', 'OCR 抽取字段', '匹配商品档案', '核对数量', '生成入库单', '审批后入库'] },
      { n: '02', t: '扫码拣货出库', s: ['扫商品条码', '校验库位批次', '录入数量', '生成出库单', '库存扣减'] },
      { n: '03', t: '循环盘点', s: ['扫码盘点', '自动比对账面', '标记差异', '生成盘点单', '审批调整'] },
      { n: '04', t: '异常闭环', s: ['预警触发', '一键补货/报损', '生成单据', '审批', '库存回写'] },
    ];
    return '<div class="about-wrap">' +
      '<section class="card about-hero">' +
        '<span class="pill brand"><i></i>产品重设计</span>' +
        '<h2>把「录单」这件事，从键盘搬到镜头</h2>' +
        '<p>原项目 Umi-OCR 是一个离线识别工具：截图 OCR、批量 OCR、文档 OCR、二维码。它擅长「看图出字」，但止步于文本。' +
        '「拾货」保留它的识别内核，把能力嫁接到真实的进销存业务上——<b>识别不再是一个功能，而是所有单据录入的默认入口</b>。</p>' +
        '<div class="about-kv">' +
          '<div><i>一句话定位</i><b>给中小零售商和仓配团队的「扫一下就懂货」的进销存</b></div>' +
          '<div><i>核心矛盾</i><b>传统进销存把成本压在录入上，我们把录入做到接近零</b></div>' +
          '<div><i>识别内核</i><b>浏览器端真实 OCR + 条码解码，离线优先，不上传图片</b></div>' +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card-head"><div><h3>工作空间模型</h3><p>一个空间 = 一家店，数据完全隔离</p></div></div>' +
        '<div class="tech-list">' +
          '<div><b>为什么要拆</b><span>奶茶店的物料几乎没有条码，核心痛点是<strong>效期</strong>；超市的核心是<strong>条码</strong>，品类横跨食品到日用。硬塞进一套品类树，就是“什么都装”的混乱。</span></div>' +
          '<div><b>怎么拆</b><span>进入系统先选工作空间。每个空间独立持有品类、物料、单据、库存与趋势数据，互不可见，也不会互相覆盖。</span></div>' +
          '<div><b>术语随行</b><span>选奶茶店模板时，导航自动变成「物料档案 / 原料库存 / 出入库单 / 收货扫码」；选超市模板则是「商品档案 / 库存 / 单据 / 扫码作业」。</span></div>' +
          '<div><b>三个起点</b><span>奶茶店（18 个物料、5 个品类、重批次效期）· 超市便利店（16 个商品、EAN-13 条码驱动）· 空白空间（0 物料，自己建）。</span></div>' +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card-head"><div><h3>信息架构</h3><p>5 个域 / 8 个页面，桌面侧栏与移动底栏共用同一套路由</p></div></div>' +
        '<div class="ia-tree">' + ia.map(g =>
          '<div class="ia-group"><b>' + g.g + '</b>' + g.items.map(i => '<span>' + i + '</span>').join('') + '</div>').join('') +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card-head"><div><h3>核心用户流程</h3><p>四条主链路覆盖 90% 的日常动作</p></div></div>' +
        '<div class="flow-grid">' + flows.map(f =>
          '<div class="flow"><div class="flow-h"><span>' + f.n + '</span><b>' + f.t + '</b></div>' +
            '<div class="flow-steps">' + f.s.map((s, i) => '<span class="fs">' + s + '</span>' + (i < f.s.length - 1 ? '<i class="fa"></i>' : '')).join('') + '</div>' +
          '</div>').join('') +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card-head"><div><h3>跨设备适配策略</h3><p>不是缩小桌面，而是各自做最擅长的事</p></div></div>' +
        '<div class="tbl-wrap"><table class="tbl resp-tbl"><thead><tr><th>维度</th><th>手机 &lt;768</th><th>平板 768–1023</th><th>桌面 ≥1024</th></tr></thead><tbody>' +
          [['导航', '底部 5 项 + 更多抽屉', '图标侧栏 72px', '完整侧栏 248px'],
           ['主任务', '扫码 / 拍照 / 审批', '扫码 + 查询', '批量操作 / 分析 / 配置'],
           ['表格', '转为卡片，标签化字段', '横向滚动', '完整多列 + 排序'],
           ['弹层', '底部抽屉，可下滑关闭', '居中弹窗', '右侧抽屉'],
           ['扫码', '全屏取景 + 震动反馈', '半屏取景', '摄像头 / 上传 / 手输'],
           ['触控', '≥44px 点击区、safe-area', '≥44px', '悬停态 + 快捷键']].map(r =>
            '<tr>' + r.map((c, i) => i === 0 ? '<td><b>' + c + '</b></td>'
              : '<td data-l="' + ['手机', '平板', '桌面'][i - 1] + '">' + c + '</td>').join('') + '</tr>').join('') +
        '</tbody></table></div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card-head"><div><h3>视觉语言</h3><p>奶油底色 + 电光紫 + 珊瑚橙，圆角 20px 起</p></div></div>' +
        '<div class="swatches">' +
          [['#5B4CFF','电光紫 · 主色'],['#FF6B3D','珊瑚橙 · 强调'],['#0FA97A','薄荷绿 · 成功'],['#E8912D','琥珀 · 警示'],['#F6F4F1','奶油 · 底色'],['#151318','墨 · 文字']].map(s =>
            '<div class="sw"><i style="background:' + s[0] + '"></i><span>' + s[1] + '</span><code>' + s[0] + '</code></div>').join('') +
        '</div>' +
        '<p class="about-note">刻意回避了传统 ERP 的深蓝灰配色与密集小字：卡片留白更大、字号基准 14.5px、数字使用等宽字形，让「看数据」这件事不累。</p>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card-head"><div><h3>技术实现</h3><p>全部在浏览器里跑，零后端依赖</p></div></div>' +
        '<div class="tech-list">' +
          '<div><b>单据 OCR</b><span>tesseract.js v5 · chi_sim+eng · 首次加载约 20MB 模型，之后走 IndexedDB 缓存</span></div>' +
          '<div><b>条码解码</b><span>优先 BarcodeDetector 原生 API，不支持时回落 ZXing WASM</span></div>' +
          '<div><b>数据层</b><span>localStorage 持久化，单据审批会真实联动库存数字</span></div>' +
          '<div><b>降级策略</b><span>引擎加载失败自动切演示模式，界面明确标注，不假装识别成功</span></div>' +
        '</div>' +
        '<div class="about-actions">' +
          '<button class="btn soft" id="resetDb">' + UI.icon('refresh') + '重置演示数据</button>' +
          '<button class="btn ghost" data-go="#/scan">' + UI.icon('scan') + '去试一下真识别</button>' +
        '</div>' +
      '</section>' +
    '</div>';
  },
  mount(el) {
    const r = el.querySelector('#resetDb');
    if (r) r.addEventListener('click', async () => {
      if (await UI.confirm('重置演示数据', '将清空本次所有操作（含扫码记录、新建单据），恢复到初始状态。')) {
        Store.reset(); ScanState.bill = []; ScanState.doc = null;
        UI.toast('已重置', 'ok'); App.refresh();
      }
    });
  },
};

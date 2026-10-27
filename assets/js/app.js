/* ===================================================================
 * 拾货 SHIHUO · 应用外壳
 * 工作空间选择 / 路由 / 导航 / 主题 / 搜索
 * =================================================================== */

const NAV = [
  { g: '日常作业', items: [
    { k: 'dashboard', t: '工作台', i: 'dashboard' },
    { k: 'scan',      t: '扫码作业', i: 'scan', label: 'scan' },
    { k: 'inventory', t: '库存', i: 'box', label: 'inv' },
  ]},
  { g: '流转', items: [
    { k: 'docs',   t: '单据', i: 'doc', label: 'doc' },
    { k: 'collab', t: '协同', i: 'users' },
  ]},
  { g: '主数据', items: [
    { k: 'products', t: '商品档案', i: 'tag', label: 'productPage' },
  ]},
  { g: '分析', items: [
    { k: 'insights', t: '数据洞察', i: 'chart' },
  ]},
  { g: '', items: [
    { k: 'about', t: '设计说明', i: 'help' },
  ]},
];

const App = {
  current: 'dashboard',

  init() {
    Store.init();
    if (!location.hash) {
      location.hash = '#/' + (Store.ws() ? 'dashboard' : 'spaces');
    }
    this.renderNav();
    this.bindShell();
    const qt = new URLSearchParams(location.search).get('theme');
    this.setTheme(qt || localStorage.getItem('shihuo.theme') || 'light', true);
    UI.hydrate(document);

    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  navLabel(it) {
    if (!it.label) return it.t;
    const L = Store.labels();
    return (L && L[it.label]) || it.t;
  },

  renderNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    nav.innerHTML = NAV.map(grp =>
      (grp.g ? '<p class="nav-g">' + grp.g + '</p>' : '<p class="nav-g gap"></p>') +
      grp.items.map(it =>
        '<a class="nav-a" href="#/' + it.k + '" data-k="' + it.k + '">' +
          '<span class="nav-ico">' + UI.icon(it.i) + '</span><span>' + this.navLabel(it) + '</span>' +
          (it.k === 'docs' ? '<i class="nav-badge" id="navBadge"></i>' : '') +
        '</a>').join('')
    ).join('');
    this.paintWsSwitcher();
    this.badge();
  },

  paintWsSwitcher() {
    const w = Store.ws();
    const nm = document.getElementById('wsName');
    const tp = document.getElementById('wsType');
    if (nm) nm.textContent = w ? w.name : '拾货';
    if (tp) {
      const T = w ? TEMPLATES[w.type] : null;
      tp.textContent = T ? T.name + ' · 工作空间' : '选择工作空间';
    }
  },

  bindShell() {
    document.addEventListener('click', e => {
      const go = e.target.closest('[data-go]');
      if (go) {
        const tab = go.getAttribute('data-tab');
        if (tab) ScanState.tab = tab;
        location.hash = go.getAttribute('data-go');
      }
    });

    document.getElementById('themeBtn').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      this.setTheme(cur === 'dark' ? 'light' : 'dark');
    });

    document.getElementById('bellBtn').addEventListener('click', () => {
      const list = Store.db.notices || [];
      UI.open({
        title: '通知',
        sub: list.length + ' 条',
        body: list.length
          ? '<div class="feed">' + list.map(n =>
              '<div class="feed-row"><span class="feed-av ' + (n.kind === 'warn' ? 'warn' : 'ok') + '">' +
              UI.icon(n.kind === 'warn' ? 'alert' : 'check') + '</span>' +
              '<div class="feed-t"><b>' + n.t + '</b><br>' + n.d + '<i>' + n.time + '</i></div></div>').join('') + '</div>'
          : '<div class="empty">' + UI.icon('bell') + '<b>暂无通知</b><p>入库、审批、效期预警都会出现在这里</p></div>',
      });
    });

    document.getElementById('sideScan').addEventListener('click', () => {
      ScanState.tab = 'barcode';
      location.hash = '#/scan';
    });

    document.getElementById('wsSwitch').addEventListener('click', () => {
      location.hash = '#/spaces';
    });

    document.getElementById('menuBtn').addEventListener('click', () => this.openNavSheet());
    document.getElementById('moreBtn').addEventListener('click', () => this.openNavSheet());

    const q = document.getElementById('q');
    q.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        InvState.q = q.value;
        InvState.filter = 'all';
        location.hash = '#/inventory';
        q.blur();
      }
    });

    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!document.body.classList.contains('launcher')) q.focus();
      }
      if (e.key === 'Escape') UI.close();
    });

    document.getElementById('scrim').addEventListener('click', () => {
      Engine.stopCamera();
      UI.close();
    });
  },

  openNavSheet() {
    const items = NAV.reduce((a, g) => a.concat(g.items), []);
    UI.open({
      title: '导航',
      sub: Store.ws() ? Store.ws().name : '拾货 SHIHUO',
      body: '<div class="nav-sheet">' +
        '<a class="ns-item" href="#/spaces" data-close>' + UI.icon('grid') +
          '<span>切换工作空间</span>' + UI.icon('right') + '</a>' +
        items.map(it =>
          '<a class="ns-item ' + (it.k === this.current ? 'on' : '') + '" href="#/' + it.k + '" data-close>' +
          UI.icon(it.i) + '<span>' + this.navLabel(it) + '</span>' + UI.icon('right') + '</a>').join('') +
        '<div class="ns-foot">' + UI.icon('layers') + '本地运行 · 数据存在这台设备上</div></div>',
    });
  },

  setTheme(t, silent) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('shihuo.theme', t);
    const btn = document.getElementById('themeBtn');
    if (btn) btn.innerHTML = UI.icon(t === 'dark' ? 'sun' : 'moon');
    const lb = document.getElementById('lTheme');
    if (lb) lb.innerHTML = UI.icon(t === 'dark' ? 'sun' : 'moon');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#131217' : '#F6F4F1');
    if (!silent) UI.toast(t === 'dark' ? '已切换到深色' : '已切换到浅色');
  },

  /* ---------------- 路由 ---------------- */
  route() {
    const raw = (location.hash || '#/spaces').replace(/^#\//, '');
    const parts = raw.split('/');
    if (parts[0] === 'scan' && ['barcode', 'doc', 'text'].indexOf(parts[1]) >= 0) {
      ScanState.tab = parts[1];
    }
    let key = parts[0];
    if (key !== 'spaces' && !Pages[key]) key = 'dashboard';

    // 没有进入任何空间时，强制回到选择页
    if (key !== 'spaces' && !Store.ws()) {
      location.hash = '#/spaces';
      return;
    }
    if (this.current === 'scan' && key !== 'scan') Engine.stopCamera();
    this.current = key;

    const launcher = key === 'spaces';
    document.body.classList.toggle('launcher', launcher);

    if (launcher) {
      document.title = '选择工作空间 · 拾货 SHIHUO';
    } else {
      const page = Pages[key];
      const isM = window.matchMedia('(max-width: 767px)').matches;
      document.getElementById('pageTitle').textContent = page.title;
      document.getElementById('pageSub').textContent = isM
        ? ((Store.ws() || {}).name || '')
        : (page.sub || '');
      document.title = page.title + ' · ' + (Store.ws() ? Store.ws().name : '拾货');
    }

    document.querySelectorAll('.nav-a').forEach(a => a.classList.toggle('on', a.dataset.k === key));
    document.querySelectorAll('.tabbar [data-tab]').forEach(a => a.classList.toggle('on', a.dataset.tab === key));

    this.render();
    window.scrollTo(0, 0);
    document.getElementById('view').focus({ preventScroll: true });
  },

  render(keepScroll) {
    const y = window.scrollY;
    const view = document.getElementById('view');
    try {
      view.innerHTML = this.current === 'spaces' ? this.launcher() : Pages[this.current].render();
    } catch (err) {
      view.innerHTML = '<div class="card"><div class="empty">' + UI.icon('alert') +
        '<b>页面渲染出错</b><p>' + (err && err.message ? err.message : err) + '</p></div></div>';
      console.error(err);
      return;
    }
    if (this.current !== 'spaces' && Pages[this.current]) {
      const p2 = Pages[this.current];
      document.getElementById('pageTitle').textContent = p2.title;
      document.getElementById('pageSub').textContent = p2.sub || '';
    }
    view.classList.remove('in');
    void view.offsetWidth;
    view.classList.add('in');

    if (this.current === 'spaces') this.mountLauncher(view);
    else if (Pages[this.current].mount) {
      try { Pages[this.current].mount(view); } catch (err) { console.error(err); }
    }
    this.badge();
    this.paintWsSwitcher();
    if (keepScroll) window.scrollTo(0, y);
  },

  refresh(keepScroll) { this.render(keepScroll); },

  badge() {
    const b = document.getElementById('navBadge');
    if (!b) return;
    const n = Store.ws() ? Store.docs().filter(d => d.status === 'pending').length : 0;
    b.textContent = n || '';
    b.style.display = n ? '' : 'none';
  },

  /* ---------------- 工作空间选择页 ---------------- */
  launcher() {
    const GLYPH = {
      cup: '<path d="M6.8 7h10.4l-1.3 12.1a2 2 0 0 1-2 1.9H10.1a2 2 0 0 1-2-1.9z"/><path d="M9 3.6h6M5.6 7h12.8"/>',
      box: '<path d="M20 8.4 12 4 4 8.4 12 12.8z"/><path d="M4 8.4v7.2L12 20l8-4.4V8.4"/>',
      grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    };
    const list = Store.list();
    const cards = list.map(w => {
      const T = TEMPLATES[w.type] || TEMPLATES.blank;
      const ps = w.data.products || [];
      const pending = (w.data.docs || []).filter(d => d.status === 'pending').length;
      const value = ps.reduce((s, p) => s + p.stock * p.cost, 0);
      const low = ps.filter(p => p.stock < p.safe).length;
      return '<div class="ws-card" data-ws="' + w.id + '" tabindex="0" role="button">' +
        '<div class="ws-top">' +
          '<span class="ws-badge" style="--h:' + T.hue + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
            (GLYPH[T.glyph] || GLYPH.box) + '</svg>' +
          '</span>' +
          '<span class="ws-type">' + T.name + '</span>' +
          '<button class="ws-del" data-del="' + w.id + '" title="删除空间" aria-label="删除空间">' + UI.icon('trash') + '</button>' +
        '</div>' +
        '<b class="ws-name">' + w.name + '</b>' +
        '<p class="ws-desc">' + T.desc + '</p>' +
        '<div class="ws-stats">' +
          '<span><i>' + ps.length + '</i>' + (w.labels ? w.labels.product : '物料') + '</span>' +
          '<span><i>' + pending + '</i>待审</span>' +
          '<span><i class="' + (low ? 'warn' : '') + '">' + low + '</i>预警</span>' +
        '</div>' +
        '<div class="ws-foot"><span class="ws-val">' + UI.moneyShort(value) + '</span>' +
          '<span class="ws-go">进入' + UI.icon('right') + '</span></div>' +
      '</div>';
    }).join('');

    return '<div class="launch">' +
      '<div class="launch-head">' +
        '<div class="launch-brand">' +
          '<span class="sb-mark">' +
            '<svg viewBox="0 0 32 32" fill="none">' +
              '<rect x="3" y="6" width="2.6" height="20" rx="1.3" fill="currentColor"/>' +
              '<rect x="8" y="6" width="1.6" height="20" rx="0.8" fill="currentColor"/>' +
              '<rect x="12" y="6" width="3.4" height="20" rx="1.7" fill="currentColor"/>' +
              '<rect x="18" y="6" width="1.6" height="20" rx="0.8" fill="currentColor"/>' +
              '<rect x="22" y="6" width="2.6" height="20" rx="1.3" fill="currentColor"/>' +
              '<rect x="27" y="6" width="1.6" height="20" rx="0.8" fill="currentColor"/>' +
            '</svg>' +
          '</span>' +
          '<span class="lb-t"><b>拾货</b><i>SHIHUO · 进销存协同</i></span>' +
        '</div>' +
        '<button class="icon-btn" id="lTheme" aria-label="切换主题">' + UI.icon('moon') + '</button>' +
      '</div>' +
      '<div class="launch-hero">' +
        '<p class="eyebrow">工作空间</p>' +
        '<h1>一个空间，管一家店</h1>' +
        '<p class="launch-sub">奶茶店和超市的品类、单位、效期规则完全不同。拆成独立空间后，物料、单据和库存各管各的，不会互相污染。</p>' +
      '</div>' +
      '<div class="ws-grid">' + cards +
        '<button class="ws-new" id="wsNew">' +
          '<span class="ws-new-ico">' + UI.icon('plus') + '</span>' +
          '<b>新建工作空间</b>' +
          '<i>选一个行业模板开始</i>' +
        '</button>' +
      '</div>' +
      '<p class="launch-foot">' + UI.icon('layers') + '数据保存在这台设备的浏览器里，不会上传</p>' +
    '</div>';
  },

  mountLauncher(el) {
    const lt = el.querySelector('#lTheme');
    if (lt) lt.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      this.setTheme(cur === 'dark' ? 'light' : 'dark');
    });
    el.querySelectorAll('[data-ws]').forEach(c => {
      c.addEventListener('click', e => {
        if (e.target.closest('[data-del]')) return;
        Store.enter(c.dataset.ws);
        this.renderNav();
        location.hash = '#/dashboard';
      });
      c.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); }
      });
    });
    el.querySelectorAll('[data-del]').forEach(b => {
      b.addEventListener('click', async e => {
        e.stopPropagation();
        const w = Store.list().find(x => x.id === b.dataset.del);
        if (!w) return;
        if (await UI.confirm('删除工作空间', '「' + w.name + '」的物料、单据和库存都会被删除，且无法恢复。')) {
          Store.remove(w.id);
          UI.toast('已删除', 'ok');
          this.refresh();
          this.renderNav();
        }
      });
    });
    const nw = el.querySelector('#wsNew');
    if (nw) nw.addEventListener('click', () => this.openCreate());
  },

  openCreate() {
    let tpl = 'milktea';
    const GLYPH = {
      cup: '<path d="M6.8 7h10.4l-1.3 12.1a2 2 0 0 1-2 1.9H10.1a2 2 0 0 1-2-1.9z"/><path d="M9 3.6h6M5.6 7h12.8"/>',
      box: '<path d="M20 8.4 12 4 4 8.4 12 12.8z"/><path d="M4 8.4v7.2L12 20l8-4.4V8.4"/>',
      grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    };
    const grid = TEMPLATE_LIST.map(k => {
      const T = TEMPLATES[k];
      return '<button class="tpl ' + (k === tpl ? 'on' : '') + '" data-tpl="' + k + '">' +
        '<span class="tpl-ico" style="--h:' + T.hue + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
          (GLYPH[T.glyph] || GLYPH.box) + '</svg>' +
        '</span>' +
        '<b>' + T.name + '</b><i>' + T.desc + '</i>' +
      '</button>';
    }).join('');

    UI.open({
      variant: 'modal',
      title: '新建工作空间',
      sub: '选一个起点，创建后仍可自己加品类',
      body:
        '<div class="tpl-grid">' + grid + '</div>' +
        '<label class="field" style="margin-top:14px"><i>空间名称</i>' +
          '<input id="wsNameInp" placeholder="例如：一杯好茶 · 中山路店" maxlength="24"></label>' +
        '<p class="hint-line" id="tplTip">' + TEMPLATES[tpl].tip + '</p>',
      foot: '<button class="btn ghost" data-close>取消</button>' +
            '<button class="btn primary" id="wsCreate">创建并进入</button>',
      onMount(l) {
        const tip = l.querySelector('#tplTip');
        const inp = l.querySelector('#wsNameInp');
        l.querySelectorAll('[data-tpl]').forEach(b => {
          b.addEventListener('click', () => {
            l.querySelectorAll('[data-tpl]').forEach(x => x.classList.remove('on'));
            b.classList.add('on');
            tpl = b.dataset.tpl;
            tip.textContent = TEMPLATES[tpl].tip;
            inp.placeholder = tpl === 'blank'
              ? '例如：我的新店'
              : '例如：' + TEMPLATES[tpl].name + ' · 分店名';
          });
        });
        l.querySelector('#wsCreate').addEventListener('click', () => {
          const w = Store.create(tpl, inp.value);
          UI.close();
          App.renderNav();
          const hasProducts = (w.data.products || []).length > 0;
          if (hasProducts) {
            // 模板自带商品：直接进入工作台
            location.hash = '#/dashboard';
            UI.toast('已创建「' + w.name + '」', 'ok');
          } else {
            // 新空间还没有商品：按流程引导先建档，再扫码入库
            location.hash = '#/products';
            UI.toast('空间已创建，先添加' + (w.labels ? w.labels.product : '商品') + '，再扫码入库', 'ok');
          }
          App.refresh();
        });
      },
    });
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => { Engine.warmup(() => {}).catch(() => {}); }, { timeout: 6000 });
  } else {
    setTimeout(() => Engine.warmup(() => {}).catch(() => {}), 4000);
  }
});

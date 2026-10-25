/* ===================================================================
 * 拾货 SHIHUO · 应用外壳
 * 路由 / 导航 / 主题 / 搜索 / 快捷键
 * =================================================================== */

const NAV = [
  { g: '日常作业', items: [
    { k: 'dashboard', t: '工作台', i: 'dashboard' },
    { k: 'scan',      t: '扫码作业', i: 'scan' },
    { k: 'inventory', t: '库存', i: 'box' },
  ]},
  { g: '流转', items: [
    { k: 'docs',   t: '单据', i: 'doc' },
    { k: 'collab', t: '协同', i: 'users' },
  ]},
  { g: '主数据', items: [
    { k: 'products', t: '商品档案', i: 'tag' },
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
    this.renderNav();
    this.bindShell();
    const qt = new URLSearchParams(location.search).get('theme');
    this.setTheme(qt || localStorage.getItem('shihuo.theme') || 'light', true);
    UI.hydrate(document);

    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  renderNav() {
    const nav = document.getElementById('nav');
    nav.innerHTML = NAV.map(grp =>
      (grp.g ? '<p class="nav-g">' + grp.g + '</p>' : '<p class="nav-g gap"></p>') +
      grp.items.map(it =>
        '<a class="nav-a" href="#/' + it.k + '" data-k="' + it.k + '">' +
          '<span class="nav-ico">' + UI.icon(it.i) + '</span><span>' + it.t + '</span>' +
          (it.k === 'docs' ? '<i class="nav-badge" id="navBadge"></i>' : '') +
        '</a>').join('')
    ).join('');
  },

  bindShell() {
    // 全局 data-go 跳转
    document.addEventListener('click', e => {
      const go = e.target.closest('[data-go]');
      if (go) {
        const tab = go.getAttribute('data-tab');
        if (tab) ScanState.tab = tab;
        location.hash = go.getAttribute('data-go');
      }
    });

    // 顶部：主题
    document.getElementById('themeBtn').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      this.setTheme(cur === 'dark' ? 'light' : 'dark');
    });

    // 顶部：通知
    document.getElementById('bellBtn').addEventListener('click', () => {
      UI.open({
        title: '通知',
        sub: Store.db.notices.length + ' 条未读',
        body: '<div class="feed">' + Store.db.notices.map(n =>
          '<div class="feed-row"><span class="feed-av ' + (n.kind === 'warn' ? 'warn' : 'ok') + '">' +
          UI.icon(n.kind === 'warn' ? 'alert' : 'check') + '</span>' +
          '<div class="feed-t"><b>' + n.t + '</b><br>' + n.d + '<i>' + n.time + '</i></div></div>').join('') +
          '</div>',
      });
    });

    // 侧栏扫码按钮
    document.getElementById('sideScan').addEventListener('click', () => {
      ScanState.tab = 'barcode';
      location.hash = '#/scan';
    });

    // 移动端菜单
    document.getElementById('menuBtn').addEventListener('click', () => this.openNavSheet());
    document.getElementById('moreBtn').addEventListener('click', () => this.openNavSheet());

    // 搜索
    const q = document.getElementById('q');
    q.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        InvState.q = q.value;
        InvState.filter = 'all';
        location.hash = '#/inventory';
        q.blur();
      }
    });

    // 快捷键
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        q.focus();
      }
      if (e.key === 'Escape') UI.close();
    });

    // 遮罩关闭
    document.getElementById('scrim').addEventListener('click', () => {
      Engine.stopCamera();
      UI.close();
    });
  },

  openNavSheet() {
    const items = NAV.reduce((a, g) => a.concat(g.items), []);
    UI.open({
      title: '导航',
      sub: '拾货 SHIHUO',
      body: '<div class="nav-sheet">' + items.map(it =>
        '<a class="ns-item ' + (it.k === this.current ? 'on' : '') + '" href="#/' + it.k + '" data-close>' +
        UI.icon(it.i) + '<span>' + it.t + '</span>' + UI.icon('right') + '</a>').join('') +
        '<div class="ns-foot">' + UI.icon('layers') + '本地运行 · 数据存在这台设备上</div></div>',
    });
  },

  setTheme(t, silent) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('shihuo.theme', t);
    const btn = document.getElementById('themeBtn');
    if (btn) btn.innerHTML = UI.icon(t === 'dark' ? 'sun' : 'moon');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#131217' : '#F6F4F1');
    if (!silent) UI.toast(t === 'dark' ? '已切换到深色' : '已切换到浅色');
  },

  route() {
    const raw = (location.hash || '#/dashboard').replace(/^#\//, '');
    const parts = raw.split('/');
    // 支持深链：#/scan/doc 直接打开拍照录单
    if (parts[0] === 'scan' && ['barcode', 'doc', 'text'].indexOf(parts[1]) >= 0) {
      ScanState.tab = parts[1];
    }
    const key = Pages[parts[0]] ? parts[0] : 'dashboard';
    if (this.current === 'scan' && key !== 'scan') Engine.stopCamera();
    this.current = key;

    const page = Pages[key];
    document.getElementById('pageTitle').textContent = page.title;
    document.getElementById('pageSub').textContent = page.sub || '';
    document.title = page.title + ' · 拾货 SHIHUO';

    // 高亮
    document.querySelectorAll('.nav-a').forEach(a =>
      a.classList.toggle('on', a.dataset.k === key));
    document.querySelectorAll('.tabbar [data-tab]').forEach(a =>
      a.classList.toggle('on', a.dataset.tab === key));

    this.render();
    window.scrollTo(0, 0);
    document.getElementById('view').focus({ preventScroll: true });
  },

  render(keepScroll) {
    const y = window.scrollY;
    const view = document.getElementById('view');
    const page = Pages[this.current];
    try {
      view.innerHTML = page.render();
    } catch (err) {
      view.innerHTML = '<div class="card"><div class="empty">' +
        UI.icon('alert') + '<b>页面渲染出错</b><p>' + (err && err.message ? err.message : err) + '</p></div></div>';
      console.error(err);
      return;
    }
    view.classList.remove('in');
    void view.offsetWidth;
    view.classList.add('in');
    if (page.mount) {
      try { page.mount(view); } catch (err) { console.error(err); }
    }
    this.badge();
    if (keepScroll) window.scrollTo(0, y);
  },

  refresh(keepScroll) {
    this.render(keepScroll);
  },

  badge() {
    const b = document.getElementById('navBadge');
    if (!b) return;
    const n = Store.docs().filter(d => d.status === 'pending').length;
    b.textContent = n || '';
    b.style.display = n ? '' : 'none';
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
  // 预热 OCR：空闲时提前把模型拉进缓存，用户点「拍照录单」时更快
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      Engine.warmup(() => {}).catch(() => {});
    }, { timeout: 6000 });
  } else {
    setTimeout(() => Engine.warmup(() => {}).catch(() => {}), 4000);
  }
});

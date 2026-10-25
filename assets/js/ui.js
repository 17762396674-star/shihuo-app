/* ===================================================================
 * 拾货 SHIHUO · UI 组件层
 * 图标 / 图表 / 弹层 / Toast / 条形码绘制，全部零依赖手写。
 * =================================================================== */

const UI = (() => {

  /* ---------------- 图标 ---------------- */
  const P = {
    dashboard: '<rect x="3" y="3" width="7.5" height="7.5" rx="2.2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2.2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2.2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.2"/>',
    scan: '<path d="M4 8.5V6.2A2.2 2.2 0 0 1 6.2 4h2.3"/><path d="M15.5 4h2.3A2.2 2.2 0 0 1 20 6.2v2.3"/><path d="M20 15.5v2.3a2.2 2.2 0 0 1-2.2 2.2h-2.3"/><path d="M8.5 20H6.2A2.2 2.2 0 0 1 4 17.8v-2.3"/><path d="M3.6 12h16.8"/>',
    box: '<path d="M20.6 8.1 12 3.6 3.4 8.1 12 12.6z"/><path d="M3.4 8.1v7.8L12 20.4l8.6-4.5V8.1"/><path d="M12 12.6v7.8"/>',
    doc: '<path d="M14 3H7.5A1.5 1.5 0 0 0 6 4.5v15A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V7z"/><path d="M14 3v4.5h4"/><path d="M9 13h6M9 16.5h4"/>',
    tag: '<path d="M20.4 13.6 13 21l-9-9V4.4A1.4 1.4 0 0 1 5.4 3H12l8.4 8.4a1.6 1.6 0 0 1 0 2.2z"/><circle cx="7.8" cy="7.8" r="1.3"/>',
    users: '<path d="M15.5 20.5v-1.8a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.7v1.8"/><circle cx="9.2" cy="8" r="3.6"/><path d="M21 20.5v-1.8a3.6 3.6 0 0 0-2.7-3.5"/><path d="M15.5 4.6a3.6 3.6 0 0 1 0 6.9"/>',
    chart: '<path d="M3.5 3.5v17h17"/><path d="M7.5 15.5l3.2-4.2 3 3 4.3-6"/>',
    help: '<circle cx="12" cy="12" r="8.6"/><path d="M12 8.2v.01"/><path d="M12 11v5.2"/>',
    search: '<circle cx="11" cy="11" r="6.8"/><path d="M20.5 20.5 16 16"/>',
    bell: '<path d="M18 8.6a6 6 0 1 0-12 0c0 6.4-2.6 8.4-2.6 8.4h17.2S18 15 18 8.6"/><path d="M13.7 20.4a2 2 0 0 1-3.4 0"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h12"/>',
    plus: '<path d="M12 5.5v13M5.5 12h13"/>',
    minus: '<path d="M5.5 12h13"/>',
    check: '<path d="M20 6.5 9.4 17.1 4 11.7"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    right: '<path d="M9 5.5 15.5 12 9 18.5"/>',
    left: '<path d="M15 5.5 8.5 12 15 18.5"/>',
    down: '<path d="M6 9.5 12 15.5 18 9.5"/>',
    up: '<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>',
    downArrow: '<path d="M12 5v14"/><path d="M6 13l6 6 6-6"/>',
    camera: '<path d="M21.5 18.6a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V8.4a2 2 0 0 1 2-2h3.2l1.6-2.6h5.4l1.6 2.6h3.2a2 2 0 0 1 2 2z"/><circle cx="12" cy="13.2" r="3.9"/>',
    barcode: '<path d="M3.5 5v14M6.6 5v14M9.4 5v10M12.4 5v14M15.2 5v10M18 5v14M20.6 5v14"/>',
    spark: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    alert: '<path d="M10.3 4 2.7 17.2A1.9 1.9 0 0 0 4.4 20h15.2a1.9 1.9 0 0 0 1.7-2.8L13.7 4a1.9 1.9 0 0 0-3.4 0z"/><path d="M12 9.4v4M12 16.6h.01"/>',
    clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4v5l3.2 1.9"/>',
    filter: '<path d="M3.5 5.5h17l-6.6 7.7v5.6l-3.8 1.9v-7.5z"/>',
    more: '<circle cx="5.2" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18.8" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    download: '<path d="M12 3.6v11.8"/><path d="M7.4 11 12 15.6 16.6 11"/><path d="M4.5 20.4h15"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>',
    moon: '<path d="M20.4 14.6A8.6 8.6 0 0 1 9.4 3.6a8.6 8.6 0 1 0 11 11z"/>',
    layers: '<path d="m12 3 8.5 4.4L12 11.8 3.5 7.4z"/><path d="m3.5 12 8.5 4.4 8.5-4.4"/><path d="m3.5 16.6 8.5 4.4 8.5-4.4"/>',
    truck: '<path d="M3 6.5h10.5v9H3z"/><path d="M13.5 9.5h3.6l3 3.2v2.8h-6.6z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
    edit: '<path d="M15.6 3.9 20.1 8.4 9 19.5H4.5V15z"/><path d="M13.2 6.3 17.7 10.8"/>',
    upload: '<path d="M12 16.4V4.6"/><path d="M7.4 9 12 4.4 16.6 9"/><path d="M4.5 20.4h15"/>',
    refresh: '<path d="M20.4 11a8.5 8.5 0 0 0-14.6-4.4L3.6 8.8"/><path d="M3.6 4.4v4.4h4.4"/><path d="M3.6 13a8.5 8.5 0 0 0 14.6 4.4l2.2-2.2"/><path d="M20.4 19.6v-4.4h-4.4"/>',
    trash: '<path d="M4.5 7h15"/><path d="M9 7V4.8h6V7"/><path d="M6.4 7l.9 13h9.4l.9-13"/><path d="M10.4 10.6v6M13.6 10.6v6"/>',
    pin: '<path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21z"/><circle cx="12" cy="10" r="2.4"/>',
    bolt: '<path d="M13.4 2.6 4.5 13.8h6.2l-1.1 7.6 8.9-11.2h-6.2z"/>',
    grid: '<rect x="3.2" y="3.2" width="7" height="7" rx="1.8"/><rect x="13.8" y="3.2" width="7" height="7" rx="1.8"/><rect x="3.2" y="13.8" width="7" height="7" rx="1.8"/><rect x="13.8" y="13.8" width="7" height="7" rx="1.8"/>',
    list: '<path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12"/><circle cx="4" cy="6.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="17.5" r="1.2" fill="currentColor" stroke="none"/>',
  };

  function icon(name, cls) {
    const body = P[name] || '';
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  function hydrate(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(n => {
      n.innerHTML = icon(n.getAttribute('data-icon'));
      n.removeAttribute('data-icon');
    });
  }

  /* ---------------- 格式化 ---------------- */
  const money = n => '¥' + Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const moneyShort = n => {
    n = Number(n || 0);
    if (Math.abs(n) >= 10000) return '¥' + (n / 10000).toFixed(1) + '万';
    return '¥' + Math.round(n).toLocaleString('zh-CN');
  };
  const num = n => Number(n || 0).toLocaleString('zh-CN');

  /* ---------------- Toast ---------------- */
  function toast(msg, type) {
    const box = document.getElementById('toasts');
    const n = document.createElement('div');
    n.className = 'toast ' + (type || '');
    const ic = type === 'ok' ? 'check' : type === 'warn' ? 'alert' : type === 'err' ? 'x' : 'bolt';
    n.innerHTML = icon(ic) + '<span>' + msg + '</span>';
    box.appendChild(n);
    requestAnimationFrame(() => n.classList.add('in'));
    setTimeout(() => {
      n.classList.remove('in');
      setTimeout(() => n.remove(), 320);
    }, 2600);
  }

  /* ---------------- 弹层 ---------------- */
  let layerOpen = false;

  function close() {
    if (!layerOpen) return;
    layerOpen = false;
    const layer = document.getElementById('layer');
    const scrim = document.getElementById('scrim');
    layer.classList.remove('open');
    scrim.classList.remove('open');
    document.body.classList.remove('lock');
    setTimeout(() => { if (!layerOpen) layer.innerHTML = ''; }, 300);
  }

  function open(opt) {
    const layer = document.getElementById('layer');
    const scrim = document.getElementById('scrim');
    layer.className = 'layer ' + (opt.variant || 'sheet');
    layer.innerHTML =
      '<div class="layer-head">' +
        '<div><h3>' + opt.title + '</h3>' + (opt.sub ? '<p>' + opt.sub + '</p>' : '') + '</div>' +
        '<button class="icon-btn" data-close aria-label="关闭">' + icon('x') + '</button>' +
      '</div>' +
      '<div class="layer-body">' + (opt.body || '') + '</div>' +
      (opt.foot ? '<div class="layer-foot">' + opt.foot + '</div>' : '');
    document.body.classList.add('lock');
    scrim.classList.add('open');
    layer.classList.add('open');
    layerOpen = true;
    hydrate(layer);
    layer.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
    if (opt.onMount) opt.onMount(layer);
    return layer;
  }

  function confirm(title, msg, okText) {
    return new Promise(resolve => {
      const l = open({
        variant: 'modal',
        title: title,
        body: '<p class="confirm-msg">' + msg + '</p>',
        foot: '<button class="btn ghost" data-close>取消</button><button class="btn danger" id="cfmOk">' + (okText || '确认') + '</button>',
      });
      l.querySelector('#cfmOk').addEventListener('click', () => { close(); resolve(true); });
      document.getElementById('scrim').addEventListener('click', function once() {
        document.getElementById('scrim').removeEventListener('click', once);
        resolve(false);
      });
    });
  }

  /* ---------------- 图表 ---------------- */
  function groupedBars(data, opts) {
    opts = opts || {};
    const W = 640, H = opts.h || 190, padB = 26, padT = 12, padL = 6;
    const max = Math.max(...data.map(d => Math.max(d.in, d.out))) * 1.18 || 1;
    const innerH = H - padB - padT;
    const step = W / data.length;
    const bw = Math.min(18, step * 0.19);
    let bars = '', labels = '', grid = '';
    for (let g = 0; g < 4; g++) {
      const y = padT + (innerH / 3) * g;
      grid += '<line x1="0" y1="' + y + '" x2="' + W + '" y2="' + y + '" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 5"/>';
    }
    data.forEach((d, i) => {
      const cx = step * i + step / 2;
      const hIn = Math.max(2, (d.in / max) * innerH);
      const hOut = Math.max(2, (d.out / max) * innerH);
      bars += '<rect x="' + (cx - bw - 2) + '" y="' + (padT + innerH - hIn) + '" width="' + bw + '" height="' + hIn +
        '" rx="' + (bw / 2) + '" fill="var(--brand)"><title>' + d.d + ' 入库 ' + d.in + '</title></rect>';
      bars += '<rect x="' + (cx + 2) + '" y="' + (padT + innerH - hOut) + '" width="' + bw + '" height="' + hOut +
        '" rx="' + (bw / 2) + '" fill="var(--accent)" opacity=".85"><title>' + d.d + ' 出库 ' + d.out + '</title></rect>';
      labels += '<text x="' + cx + '" y="' + (H - 7) + '" text-anchor="middle" font-size="10" fill="var(--ink-3)">' + d.d + '</text>';
    });
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img">' +
      grid + bars + labels + '</svg>';
  }

  function areaLine(data, key, color) {
    const W = 300, H = 90;
    const vals = data.map(d => d[key]);
    const max = Math.max(...vals) * 1.15, min = Math.min(...vals) * 0.75;
    const pts = vals.map((v, i) => {
      const x = (W / (vals.length - 1)) * i;
      const y = H - ((v - min) / (max - min || 1)) * (H - 12) - 6;
      return [x, y];
    });
    let d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1], p1 = pts[i];
      const cx = (p0[0] + p1[0]) / 2;
      d += ' C' + cx + ' ' + p0[1] + ' ' + cx + ' ' + p1[1] + ' ' + p1[0] + ' ' + p1[1];
    }
    const gid = 'g' + Math.random().toString(36).slice(2, 7);
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + color + '" stop-opacity=".26"/>' +
      '<stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + d + ' L' + W + ' ' + H + ' L0 ' + H + ' Z" fill="url(#' + gid + ')"/>' +
      '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round"/></svg>';
  }

  function donut(segs, centerTop, centerSub) {
    const R = 54, C = 2 * Math.PI * R;
    const total = segs.reduce((s, x) => s + x.v, 0) || 1;
    let off = 0, arcs = '';
    segs.forEach(s => {
      const len = (s.v / total) * C;
      arcs += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + s.c + '" stroke-width="15" ' +
        'stroke-dasharray="' + (len - 3.5) + ' ' + (C - len + 3.5) + '" stroke-dashoffset="' + (-off) + '" ' +
        'stroke-linecap="round" transform="rotate(-90 70 70)"><title>' + s.label + ' ' + s.v + '</title></circle>';
      off += len;
    });
    return '<svg class="donut" viewBox="0 0 140 140">' + arcs +
      '<text x="70" y="68" text-anchor="middle" font-size="21" font-weight="600" fill="var(--ink)">' + centerTop + '</text>' +
      '<text x="70" y="86" text-anchor="middle" font-size="10.5" fill="var(--ink-3)">' + centerSub + '</text></svg>';
  }

  function hbars(list, opts) {
    opts = opts || {};
    const max = Math.max(...list.map(x => x.v)) || 1;
    return list.map(x =>
      '<div class="hbar">' +
        '<div class="hbar-t"><span>' + x.label + '</span><b>' + x.text + '</b></div>' +
        '<div class="hbar-track"><i style="width:' + Math.max(4, (x.v / max) * 100) + '%;background:' + (x.c || 'var(--brand)') + '"></i></div>' +
      '</div>').join('');
  }

  /* ---------------- 条形码（EAN-13 视觉） ---------------- */
  function ean13(code12) {
    const d = String(code12).replace(/\D/g, '').padEnd(12, '0').slice(0, 12);
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += Number(d[i]) * (i % 2 ? 3 : 1);
    return d + ((10 - (sum % 10)) % 10);
  }

  function barcode(code, opt) {
    opt = opt || {};
    const h = opt.h || 42;
    const d = ean13(code);
    const L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
    const G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
    const R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
    const PAR = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];
    const f = d[0];
    let pat = '101';
    for (let i = 1; i <= 6; i++) pat += (PAR[f][i - 1] === 'L' ? L : G)[Number(d[i])];
    pat += '01010';
    for (let i = 7; i <= 12; i++) pat += R[Number(d[i])];
    pat += '101';

    const unit = 1;
    let x = 0, bars = '';
    for (let i = 0; i < pat.length; i++) {
      if (pat[i] === '1') {
        bars += '<rect x="' + (x * unit) + '" y="0" width="' + unit + '" height="' + h + '" fill="currentColor"/>';
      }
      x++;
    }
    const W = pat.length;
    return '<svg class="barcode" viewBox="0 0 ' + W + ' ' + h + '" preserveAspectRatio="none" role="img" aria-label="条码 ' + d + '">' +
      bars + '</svg>';
  }

  /* ---------------- 品类视觉 ---------------- */
  function productTile(p, size) {
    const c = CATS[p.cat] || CATS.daily;
    const glyph = {
      bottle: '<path d="M10 3h4v3l1.6 2.2A4 4 0 0 1 16.4 11v8.6a1.4 1.4 0 0 1-1.4 1.4H9a1.4 1.4 0 0 1-1.4-1.4V11a4 4 0 0 1 .8-2.8L10 6z"/>',
      bag: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
      chip: '<rect x="6" y="6" width="12" height="12" rx="2.4"/><path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3"/>',
      drop: '<path d="M12 3.4s5.6 6 5.6 9.8A5.6 5.6 0 0 1 6.4 13.2C6.4 9.4 12 3.4 12 3.4z"/>',
      box: '<path d="M20 8.4 12 4 4 8.4 12 12.8z"/><path d="M4 8.4v7.2L12 20l8-4.4V8.4"/>',
    }[c.glyph] || '';
    return '<div class="ptile ' + (size || '') + '" style="--h:' + c.hue + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + glyph + '</svg>' +
      '</div>';
  }

  return {
    icon, hydrate, money, moneyShort, num, toast, open, close, confirm,
    groupedBars, areaLine, donut, hbars, barcode, ean13, productTile,
  };
})();

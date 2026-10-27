/* ===================================================================
 * 拾货 SHIHUO · 识别引擎层
 * 条码：BarcodeDetector（原生）→ ZXing（兜底）
 * 单据：tesseract.js v5（真 OCR，中文 + 英文）
 * 全部按需懒加载，加载失败自动降级为演示模式并明确告知用户。
 * =================================================================== */

const Engine = (() => {
  const CDN = {
    tess:    'https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.min.js',
    tessWk:  'https://unpkg.com/tesseract.js@5.1.1/dist/worker.min.js',
    tessCore:'https://unpkg.com/tesseract.js-core@5.1.1/',
    tessLang:'https://unpkg.com/@tesseract.js-data/chi_sim@1.0.0/4.0.0',
    tessLangAlt:'https://tessdata.projectnaptha.com/4.0.0',
    zxing:   'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js',
    zxingAlt: [
      'https://fastly.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js',
      'https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js',
    ],
  };

  const state = {
    worker: null,
    workerPromise: null,
    zxing: null,
    zxingPromise: null,
    zxingUnavailable: false,
    demo: false,
    lang: 'chi_sim',
    stream: null,
    loop: null,
    lastCode: '',
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('无法加载 ' + src));
      document.head.appendChild(s);
    });
  }

  /* ---------------- 条码 ---------------- */
  async function loadZXing() {
    if (window.ZXing) return window.ZXing;
    if (!state.zxingPromise) {
      // 多源轮询：主源失败自动尝试备选源（unpkg 的 @zxing 某些网络下不通）
      const sources = [CDN.zxing].concat(CDN.zxingAlt);
      state.zxingPromise = (async () => {
        let lastErr = null;
        for (const src of sources) {
          try {
            await loadScript(src);
            state.zxing = window.ZXing;
            return state.zxing;
          } catch (e) { lastErr = e; }
        }
        state.zxingPromise = null;  // 允许下次重试
        throw lastErr || new Error('条码解码库加载失败');
      })();
    }
    return state.zxingPromise;
  }

  function hasNativeDetector() {
    return typeof window.BarcodeDetector !== 'undefined';
  }

  async function decodeCanvas(canvas) {
    // 优先原生（快）
    if (hasNativeDetector()) {
      try {
        const det = new BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'itf', 'qr_code'],
        });
        const codes = await det.detect(canvas);
        if (codes && codes.length) {
          return { code: codes[0].rawValue, format: codes[0].format, engine: 'native' };
        }
      } catch (e) { /* 落到 ZXing */ }
    }
    // ZXing 兜底
    let Z;
    try {
      Z = await loadZXing();
    } catch (e) {
      // 解码库本身加载失败（CDN 网络问题）——与「图片里没条码」区分开
      state.zxingUnavailable = true;
      return null;
    }
    try {
      // 增强解码：TRY_HARDER 提升模糊/低对比度识别，限定常见一维码+二维码格式减少误判
      const hints = new Map();
      hints.set(Z.DecodeHintType.TRY_HARDER, true);
      hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [
        Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8,
        Z.BarcodeFormat.CODE_128, Z.BarcodeFormat.CODE_39,
        Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E,
        Z.BarcodeFormat.ITF, Z.BarcodeFormat.QR_CODE,
      ]);
      const reader = new Z.MultiFormatReader();
      const res = decodeZXing(Z, reader, canvas, hints);
      state.zxingUnavailable = false;
      return { code: res.getText(), format: String(res.getBarcodeFormat()), engine: 'zxing' };
    } catch (e) {
      return null;
    }
  }

  // 用 ZXing 解码一张画布；条码过小时放大重试，提升实时画面的命中率
  function decodeZXing(Z, reader, canvas, hints) {
    const scales = [1, 1.5, 2];
    for (const k of scales) {
      try {
        let src = canvas;
        if (k !== 1) {
          const c2 = document.createElement('canvas');
          c2.width = Math.round(canvas.width * k);
          c2.height = Math.round(canvas.height * k);
          const cx = c2.getContext('2d');
          // 关键：关闭平滑，用最近邻放大，保持条码黑白边缘锐利（平滑会让条纹糊掉）
          cx.imageSmoothingEnabled = false;
          cx.drawImage(canvas, 0, 0, c2.width, c2.height);
          src = c2;
        }
        const ctx = src.getContext('2d', { willReadFrequently: true });
        const img = ctx.getImageData(0, 0, src.width, src.height);
        // 关键修复：getImageData 返回 RGBA 交错数据（每像素 4 字节），
        // 而 ZXing 的 RGBLuminanceSource 对 Uint8ClampedArray 会直接当作
        // 「每像素 1 字节的灰度」使用，颜色通道错乱导致永远解不出。
        // 必须先把 RGBA 转成灰度再喂进去。
        const gray = new Uint8ClampedArray(src.width * src.height);
        const d = img.data;
        for (let i = 0, j = 0; i < d.length; i += 4, j++) {
          gray[j] = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
        }
        const lum = new Z.RGBLuminanceSource(gray, src.width, src.height);
        const bmp = new Z.BinaryBitmap(new Z.HybridBinarizer(lum));
        return reader.decode(bmp, hints);
      } catch (e) { /* 下一尺度重试 */ }
    }
    throw new Error('decode failed');
  }

  function fileToCanvas(file, maxSide) {
    maxSide = maxSide || 1280;
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => {
        let w = im.naturalWidth, h = im.naturalHeight;
        const s = Math.min(1, maxSide / Math.max(w, h));
        w = Math.round(w * s); h = Math.round(h * s);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(im, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(c);
      };
      im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片读取失败')); };
      im.src = url;
    });
  }

  async function decodeFile(file) {
    const canvas = await fileToCanvas(file, 1400);
    const r = await decodeCanvas(canvas);
    if (r) { state.lastCode = r.code; state.demo = false; }
    return r;
  }

  /* ---------------- 摄像头 ---------------- */
  async function startCamera(video, onFrame) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('当前浏览器不支持摄像头调用（需 HTTPS 或 localhost 环境）');
    }
    stopCamera();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    state.stream = stream;
    video.srcObject = stream;
    await video.play().catch(() => {});

    const canvas = document.createElement('canvas');
    let busy = false, tick = 0;

    state.loop = setInterval(async () => {
      if (busy || video.readyState < 2) return;
      busy = true;
      try {
        const vw = video.videoWidth, vh = video.videoHeight;
        if (!vw || !vh) { busy = false; return; }
        const s = Math.min(1, 900 / Math.max(vw, vh));
        canvas.width = Math.round(vw * s);
        canvas.height = Math.round(vh * s);
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        tick++;
        if (onFrame) onFrame(tick);
        const r = await decodeCanvas(canvas);
        if (r && r.code !== state.lastCode) {
          state.lastCode = r.code;
          if (onFrame) onFrame(tick, r);
        } else if (r && onFrame) {
          onFrame(tick, r, true);
        }
      } catch (e) { /* 帧丢弃 */ }
      busy = false;
    }, 220);

    return stream;
  }

  function stopCamera() {
    if (state.loop) { clearInterval(state.loop); state.loop = null; }
    if (state.stream) {
      state.stream.getTracks().forEach(t => t.stop());
      state.stream = null;
    }
  }

  /* ---------------- OCR ---------------- */
  function makeWorker(lang, langPath) {
    return window.Tesseract.createWorker(lang, 1, {
      workerPath: CDN.tessWk,
      corePath: CDN.tessCore,
      langPath: langPath,
      logger: m => { if (state.onLog) state.onLog(m); },
    });
  }

  function ensureTesseract() {
    if (state.worker) return Promise.resolve(state.worker);
    if (state.workerPromise) return state.workerPromise;

    state.workerPromise = (async () => {
      try {
        if (!window.Tesseract) await loadScript(CDN.tess);
        let worker;
        try {
          // 主源：unpkg 上的 chi_sim 全量模型（实测 3MB/s，约 6 秒）
          worker = await makeWorker(state.lang, CDN.tessLang);
        } catch (e1) {
          // 备源：官方 tessdata（慢，但覆盖 chi_sim+eng）
          if (state.onLog) state.onLog({ status: '备用源加载中', progress: 0 });
          worker = await makeWorker('chi_sim+eng', CDN.tessLangAlt);
        }
        state.worker = worker;
        return worker;
      } catch (e) {
        state.workerPromise = null;  // 允许下次重试
        throw e;
      }
    })();

    return state.workerPromise;
  }

  async function warmup(onProgress) {
    state.onLog = onProgress;
    try {
      await ensureTesseract();
      state.demo = false;
      return true;
    } catch (e) {
      state.demo = true;
      return false;
    } finally {
      state.onLog = null;
    }
  }

  const STAGE_MAP = {
    'loading tesseract core':   { pct: 8,  label: '加载识别内核' },
    'initializing tesseract':   { pct: 18, label: '初始化引擎' },
    'loading language traineddata': { pct: 30, label: '加载中文语言模型' },
    'initializing api':         { pct: 46, label: '构建识别上下文' },
    'recognizing text':         { pct: 52, label: '逐行识别文字' },
    '备用源加载中':              { pct: 26, label: '切换备用源' },
  };

  async function recognize(source, onProgress) {
    const report = (o) => { if (onProgress) onProgress(o); };
    let worker;
    try {
      report({ pct: 4, stage: '加载引擎', label: '准备识别流水线' });
      state.onLog = (m) => {
        const map = STAGE_MAP[m.status];
        if (!map) return;
        let pct = map.pct;
        if (m.status === 'recognizing text') pct = 52 + Math.round((m.progress || 0) * 44);
        report({ pct, stage: map.label, label: map.label, progress: m.progress || 0 });
      };
      worker = await Promise.race([
        ensureTesseract(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('模型加载超时')), 150000)),
      ]);
    } catch (e) {
      state.onLog = null;
      state.demo = true;
      return demoResult(source);
    }

    try {
      report({ pct: 50, stage: '识别中', label: '逐行识别文字' });
      const { data } = await worker.recognize(source);
      state.onLog = null;
      state.demo = false;
      report({ pct: 100, stage: '完成', label: '识别完成' });
      const fields = parseDocument(data.text || '');
      return {
        demo: false,
        text: data.text || '',
        confidence: Math.round(data.confidence || 0),
        lines: (data.lines || []).map(l => ({ text: l.text, conf: Math.round(l.confidence || 0) })),
        fields,
        ms: 0,
      };
    } catch (e) {
      state.onLog = null;
      state.demo = true;
      return demoResult(source);
    }
  }

  /* ---------------- 单据字段抽取 ---------------- */

  // 模糊查找：OCR 常把个别汉字认错（薯→藏），允许一定比例不同字
  function fuzzyIndexOf(hay, needle, tol) {
    const n = needle.length;
    if (n < 2 || hay.length < n) return hay.indexOf(needle);
    const need = Math.max(1, Math.ceil(n * (1 - (tol || 0.3))));
    for (let i = 0; i <= hay.length - n; i++) {
      let hit = 0;
      for (let j = 0; j < n; j++) if (hay[i + j] === needle[j]) hit++;
      if (hit >= need) return i;
    }
    return -1;
  }

  function parseDocument(text) {
    const raw = String(text || '');
    // chi_sim 会在汉字之间插空格（"送 货 单"），所有匹配都基于「去掉全部空白」的紧凑串
    const compact = raw.replace(/\s+/g, '');
    const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

    // 供应商
    let supplier = '';
    for (const s of Store.suppliers()) {
      if (compact.indexOf(s) >= 0) { supplier = s; break; }
    }
    if (!supplier) {
      const m = compact.match(/([\u4e00-\u9fa5]{2,12}(?:供应链|商行|商贸|有限公司|公司|超市|食品))/);
      if (m) supplier = m[1];
    }

    // 单号
    let code = '';
    const mc = compact.match(/(?:单号|编号|单编号|No\.?|NO\.?)[：:]*([A-Za-z0-9\-]{6,24})/);
    if (mc) code = mc[1];
    else {
      const m2 = compact.match(/\b([A-Z]{2,3}\d{8,14})\b/);
      if (m2) code = m2[1];
    }

    // 日期
    let date = '';
    const md = compact.match(/(20\d{2})[-/年.](\d{1,2})[-/月.](\d{1,2})/);
    if (md) date = md[1] + '-' + pad(md[2]) + '-' + pad(md[3]);
    else date = todayStr();

    // 金额
    let amount = 0;
    const ma = compact.match(/(?:合计|总计|金额|应付|小计)[^\d]{0,6}([\d,]+(?:\.\d{1,2})?)/);
    if (ma) amount = parseFloat(ma[1].replace(/,/g, '')) || 0;

    // 明细行：逐行匹配商品名；名称用「去空白」串匹配，数字用「保留空格」的原始行提取
    const items = [];
    const rows = raw.split(/\r?\n/).filter(l => l.trim()).map(l => ({
      loose: l.replace(/\s+/g, ''),
      orig: l,
    }));
    const hitPid = {};
    Store.products().forEach(p => {
      const key = p.name.replace(/\s/g, '');
      let rowHit = null;
      for (const row of rows) {
        if (row.loose.indexOf(key) >= 0 || fuzzyIndexOf(row.loose, key, 0.34) >= 0) {
          rowHit = row;
          break;
        }
      }
      if (!rowHit || hitPid[p.id]) return;
      hitPid[p.id] = true;

      const specNums = (p.spec.match(/\d+/g) || []);
      const nums = rowHit.orig.match(/\d+(?:\.\d+)?/g) || [];
      let qty = 0;
      for (const n of nums) {
        if (specNums.indexOf(n) >= 0) continue;   // 规格里的数字（550ml×24）不算数量
        if (!/^\d+$/.test(n)) continue;           // 只接受纯整数（18.50 这类单价跳过）
        const v = parseInt(n, 10);
        if (v > 0 && v < 10000) { qty = v; break; }
      }
      items.push({
        pid: p.id, name: p.name, spec: p.spec,
        qty: qty || 1, price: p.cost,
        matched: qty > 0,
      });
    });

    return { supplier, code, date, amount, items, lineCount: lines.length };
  }

  /* ---------------- 演示模式（离线兜底） ---------------- */
  function demoResult() {
    const ps = Store.products().slice(0, 3);
    if (!ps.length) {
      return { demo: true, text: '（当前空间还没有物料，无法演示识别）', confidence: 0, lines: [],
        fields: { supplier: '', code: '', date: todayStr(), amount: 0, items: [], lineCount: 0 }, ms: 0 };
    }
    const items = ps.map(p => ({
      pid: p.id, name: p.name, spec: p.spec,
      qty: [24, 12, 30][ps.indexOf(p)] || 10,
      price: p.cost, matched: true,
    }));
    const amount = items.reduce((s, i) => s + i.qty * i.price, 0);
    const rows = items.map(i => i.name + '  ' + i.spec + '  ' + i.qty + '  ' + i.price.toFixed(2)).join('\n');
    const text = '送货单\n' + (Store.suppliers()[0] || '示例供应商') + '\n单号：RK' + todayStr().replace(/-/g, '') + '001\n日期：' + todayStr() +
      '\n' + rows + '\n合计：' + amount.toFixed(2);
    return {
      demo: true,
      text: text,
      confidence: 0,
      lines: [],
      fields: {
        supplier: Store.suppliers()[0] || '示例供应商',
        code: 'RK' + todayStr().replace(/-/g, '') + '001',
        date: todayStr(),
        amount: amount,
        items: items,
        lineCount: 8,
      },
      ms: 0,
    };
  }

  return {
    state,
    warmup, recognize, parseDocument,
    decodeFile, decodeCanvas, startCamera, stopCamera, fileToCanvas,
    get isDemo() { return state.demo; },
    get hasDetector() { return hasNativeDetector(); },
    get zxingDown() { return state.zxingUnavailable; },
  };
})();

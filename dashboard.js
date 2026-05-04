// ══════════════════════════════════════════════════════
//  Tradinoxaior — AI Dashboard Engine v4.1
//  Strong OCR preprocessing + AI Vision combination
// ══════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── FIREBASE ─────────────────────────────────────────
const FB = {
  apiKey:"AIzaSyCX-lQnfA7mjt5P09TTw4Xn8hretwPPTrA",
  authDomain:"earncrypto-26d59.firebaseapp.com",
  projectId:"earncrypto-26d59",
  storageBucket:"earncrypto-26d59.firebasestorage.app",
  messagingSenderId:"98622740161",
  appId:"1:98622740161:web:83e7ec5ed8c4b4046c2640"
};
const fbApp = initializeApp(FB);
const auth  = getAuth(fbApp);
const db    = getFirestore(fbApp);

// ── AI CONFIG (internal — not shown in UI) ────────────
const _K  = "AIzaSyC8hjdJIJO-Nh2-sole2odN2sc6vHdO_MI";
const _M  = "gemini-2.0-flash";
const _EP = `https://generativelanguage.googleapis.com/v1beta/models/${_M}:generateContent?key=${_K}`;

// ── AUTH GUARD ────────────────────────────────────────
onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    const name = snap.exists() ? snap.data().username : user.displayName || 'Trader';
    document.getElementById('display-username').textContent = name;
  } catch(e) { console.warn(e); }
});

// ── DOM ───────────────────────────────────────────────
const fileInput   = document.getElementById('file-input');
const uploadZone  = document.getElementById('upload-zone');
const uploadHint  = document.getElementById('upload-hint');
const previewWrap = document.getElementById('preview-wrap');
const previewImg  = document.getElementById('preview-img');
const btnAnalyze  = document.getElementById('btn-analyze');
const terminal    = document.getElementById('terminal');
const termBody    = document.getElementById('term-body');
const progBar     = document.getElementById('prog-bar');
const errBox      = document.getElementById('err-box');
const resultEl    = document.getElementById('result');
const scanLine    = document.getElementById('scan-line');
const engineSt    = document.getElementById('engine-status');

let b64  = null;
let mime = 'image/jpeg';

// ── SETTINGS ─────────────────────────────────────────
document.getElementById('btn-settings').addEventListener('click', e => {
  e.stopPropagation();
  document.getElementById('settings-menu').classList.toggle('hidden');
});
document.addEventListener('click', () =>
  document.getElementById('settings-menu')?.classList.add('hidden'));

document.getElementById('btn-logout').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'index.html';
});

document.getElementById('btn-theme').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const btn = document.getElementById('btn-theme');
  btn.textContent = document.body.classList.contains('dark') ? '☀ Light Mode' : '🌙 Dark Mode';
});

// ── FILE UPLOAD ───────────────────────────────────────
fileInput.addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  mime = f.type || 'image/jpeg';
  const reader = new FileReader();
  reader.onload = ev => {
    const data = ev.target.result;
    b64 = data.split(',')[1];
    previewImg.src = data;
    previewWrap.classList.remove('hidden');
    uploadHint.style.display = 'none';
    btnAnalyze.classList.remove('hidden');
    errBox.classList.add('hidden');
    resultEl.classList.add('hidden');
    terminal.classList.remove('hidden');
    termBody.innerHTML = '';
    log('Chart loaded ✓ Ready to analyze.');
    setP(5);
  };
  reader.readAsDataURL(f);
});

// Drag & drop
['dragover','dragenter'].forEach(ev =>
  uploadZone.addEventListener(ev, e => { e.preventDefault(); uploadZone.classList.add('drag-over'); }));
['dragleave','drop'].forEach(ev =>
  uploadZone.addEventListener(ev, () => uploadZone.classList.remove('drag-over')));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  const f = e.dataTransfer.files[0];
  if (f?.type.startsWith('image/')) {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event('change'));
  }
});

// ── HELPERS ───────────────────────────────────────────
function log(msg, t='') {
  const p = document.createElement('p');
  p.className = 'tlog' + (t ? ' ' + t : '');
  p.textContent = '> ' + msg;
  termBody.appendChild(p);
  termBody.scrollTop = termBody.scrollHeight;
}
function setP(v) { progBar.style.width = v + '%'; }
const sleep = ms => new Promise(r => setTimeout(r, ms));

function setErr(msg) {
  document.getElementById('err-msg').textContent = msg;
  errBox.classList.remove('hidden');
  scanLine.style.display = 'none';
  engineSt.className = 'engine-status';
  engineSt.innerHTML = '<span class="st-dot"></span> Online';
  btnAnalyze.disabled = false;
  btnAnalyze.textContent = '⚡ Retry Analysis';
}

// ── OCR PREPROCESSING ────────────────────────────────
// Sharpen image on canvas before OCR for better accuracy
function preprocessForOCR(imgEl) {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');
    // Scale up for better OCR
    canvas.width  = imgEl.naturalWidth  * 2 || 1200;
    canvas.height = imgEl.naturalHeight * 2 || 900;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

    // Increase contrast for text
    ctx.filter = 'contrast(1.4) brightness(1.1) saturate(0)';
    ctx.drawImage(canvas, 0, 0);

    canvas.toBlob(blob => resolve(blob), 'image/png', 1.0);
  });
}

async function runOCR(imgEl) {
  try {
    log('Running OCR text extraction...');
    const blob = await preprocessForOCR(imgEl);
    const { data: { text } } = await Tesseract.recognize(blob, 'eng', {
      logger: () => {},
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./:-+%,. '
    });
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
    log(`OCR: ${lines.length} lines extracted ✓`, 'ok');
    return lines.join(' ').toUpperCase();
  } catch(e) {
    log('OCR skipped — using AI vision only.', 'warn');
    return '';
  }
}

// ── PARSE OCR FOR CONTEXT ─────────────────────────────
function parseOCR(text) {
  const info = {};
  // Timeframe
  const tfMatch = text.match(/\b(1M|3M|5M|15M|30M|1H|2H|4H|6H|12H|1D|3D|1W)\b/);
  if (tfMatch) info.timeframe = tfMatch[1];
  // Price numbers
  const nums = text.match(/\b\d{1,6}[.,]\d{2,5}\b/g);
  if (nums?.length) info.priceHints = nums.slice(0,5).join(', ');
  // Symbol hints
  const symMatch = text.match(/\b(BTC|ETH|SOL|XRP|BNB|ADA|DOGE|MATIC|AVAX|LINK|EUR|GBP|USD|JPY|NIFTY|SENSEX|RELIANCE|TCS|AAPL|TSLA|GOLD|OIL)\b/g);
  if (symMatch) info.symbols = [...new Set(symMatch)].join(', ');
  return info;
}

// ── MASTER AI PROMPT ─────────────────────────────────
function buildPrompt(ocrText, ocrInfo) {
  let context = '';
  if (ocrInfo.timeframe) context += `\nTimeframe detected by OCR: ${ocrInfo.timeframe}`;
  if (ocrInfo.priceHints) context += `\nPrice numbers from chart: ${ocrInfo.priceHints}`;
  if (ocrInfo.symbols)    context += `\nSymbols/text found: ${ocrInfo.symbols}`;
  if (ocrText.length > 30) context += `\n\nFull OCR text (use to confirm levels):\n"""\n${ocrText.slice(0,600)}\n"""`;

  return `You are an elite institutional trading analyst. Analyze this trading chart image carefully and provide a complete trade setup.
${context}

Respond with ONLY valid JSON — no markdown, no backticks.

{
  "isValidChart": true,
  "asset": "symbol (e.g. BTC/USDT, RELIANCE, EUR/USD, NIFTY)",
  "marketType": "Crypto | Forex | Stocks | Indices | Commodities",
  "timeframe": "detected timeframe",
  "currentPrice": "exact price from chart or approximate",
  "signal": "LONG | SHORT | NEUTRAL",
  "trend": "e.g. STRONG BULLISH | BEARISH REVERSAL | SIDEWAYS",
  "confidence": 75,
  "strategy": "SMC | Price Action | Breakout | Wyckoff",
  "patternDetected": "chart pattern or None",
  "entryZone": "specific price for entry",
  "entryNote": "e.g. Enter on 15m candle close above OB",
  "stopLoss": "stop loss price",
  "stopLossNote": "e.g. Below Order Block / Swing Low",
  "takeProfit1": "first target",
  "rr1": "e.g. 1:2",
  "takeProfit2": "second target",
  "rr2": "e.g. 1:3.5",
  "support": "key support level",
  "resistance": "key resistance level",
  "orderBlocks": "describe OBs — location and status",
  "fairValueGap": "describe FVGs visible",
  "liquidityZones": "buy/sell side pools and sweeps",
  "institutionalAnalysis": "4-5 sentences: what smart money is doing, key context, bias, what to watch",
  "howToTrade": "Step 1: Wait for X. Step 2: Enter at X when Y. Step 3: SL at X. Step 4: TP1 at X. Step 5: Move SL to breakeven when.",
  "rrRatio": "best R:R e.g. 1:3",
  "tradeValidity": "Strong Setup | Moderate Setup | Weak Setup | No Trade",
  "riskWarning": "specific invalidation condition"
}

Rules:
- isValidChart = false if image has no chart/price data
- Be specific with price levels from the chart
- confidence: integer 45-95
- If unsure about a field write "Not clearly visible"`;
}

// ── MAIN ANALYSIS ─────────────────────────────────────
btnAnalyze.addEventListener('click', async () => {
  if (!b64) return;
  btnAnalyze.disabled = true;
  btnAnalyze.textContent = 'Analyzing...';
  errBox.classList.add('hidden');
  resultEl.classList.add('hidden');
  terminal.classList.remove('hidden');
  termBody.innerHTML = '';
  scanLine.style.display = 'block';
  engineSt.className = 'engine-status processing';
  engineSt.innerHTML = '<span class="st-dot"></span> Scanning';
  setP(0);

  log('Tradinoxaior AI initializing...');
  await sleep(300);
  setP(10);

  // Step 1: OCR
  const ocrText = await runOCR(previewImg);
  const ocrInfo = parseOCR(ocrText);
  setP(30);
  await sleep(200);

  // Step 2: AI Analysis
  log('Sending to AI Vision engine...');
  log('Reading candlesticks and price structure...');
  setP(45);

  try {
    const body = {
      contents: [{
        parts: [
          { inline_data: { mime_type: mime, data: b64 } },
          { text: buildPrompt(ocrText, ocrInfo) }
        ]
      }],
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',         threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',         threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',   threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',   threshold: 'BLOCK_NONE' },
      ]
    };

    const res = await fetch(_EP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    setP(75);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || '';
      if (res.status === 400) throw new Error('Could not process this image. Please try a clearer chart screenshot.');
      if (res.status === 403 || res.status === 401) throw new Error('AI service authentication failed. Please contact support.');
      if (res.status === 429) throw new Error('Too many requests. Please wait a moment and try again.');
      throw new Error(msg || `Service error (${res.status}). Please try again.`);
    }

    const data = await res.json();

    // Extract text content
    const rawText = data?.candidates?.[0]?.content?.parts
      ?.filter(p => p.text)
      ?.map(p => p.text)
      ?.join('') || '';

    if (!rawText) throw new Error('AI returned an empty response. Please try again.');

    // Safety: check for blocked content
    const reason = data?.candidates?.[0]?.finishReason;
    if (reason === 'SAFETY') throw new Error('Image could not be processed. Please use a standard trading chart screenshot.');

    setP(88);
    log('AI analysis complete ✓', 'ok');
    log('Parsing trade setup...');

    // Clean JSON — strip any accidental markdown fences
    let clean = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    // Extract JSON if mixed with text
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI response was not valid. Please try again.');
    clean = jsonMatch[0];

    const result = JSON.parse(clean);
    setP(100);
    await sleep(400);

    scanLine.style.display = 'none';
    terminal.classList.add('hidden');
    engineSt.className = 'engine-status';
    engineSt.innerHTML = '<span class="st-dot"></span> Online';
    btnAnalyze.disabled = false;
    btnAnalyze.textContent = '⚡ Re-analyze';

    if (!result.isValidChart) {
      setErr('No valid chart detected. Please upload a clear trading chart screenshot (candlestick or line chart).');
      return;
    }

    renderResult(result);

  } catch(e) {
    console.error(e);
    scanLine.style.display = 'none';
    terminal.classList.add('hidden');
    engineSt.className = 'engine-status';
    engineSt.innerHTML = '<span class="st-dot"></span> Online';
    btnAnalyze.disabled = false;
    btnAnalyze.textContent = '⚡ Retry Analysis';
    setErr(e.message || 'Analysis failed. Please try again.');
  }
});

// ── RENDER ────────────────────────────────────────────
function txt(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = v || '--';
}

function renderResult(r) {
  // Signal
  const sig = document.getElementById('r-signal');
  sig.textContent = r.signal || 'NEUTRAL';
  sig.className   = 'sig-badge ' + (r.signal || 'NEUTRAL').toLowerCase();

  // Confidence
  const conf = parseInt(r.confidence) || 0;
  const cfEl  = document.getElementById('conf-fill');
  cfEl.style.width      = conf + '%';
  cfEl.style.background = conf >= 75 ? '#16a34a' : conf >= 55 ? '#d97706' : '#ef4444';

  txt('r-trend',   r.trend);
  txt('r-asset',   r.asset);
  txt('r-tf',      r.timeframe);
  txt('r-market',  r.marketType);
  txt('r-conf',    conf + '%');

  txt('r-entry',      r.entryZone);
  txt('r-entry-note', r.entryNote);
  txt('r-sl',         r.stopLoss);
  txt('r-sl-note',    r.stopLossNote);
  txt('r-tp1',        r.takeProfit1);
  txt('r-rr1',        r.rr1 ? 'R:R ' + r.rr1 : '--');
  txt('r-tp2',        r.takeProfit2);
  txt('r-rr2',        r.rr2 ? 'R:R ' + r.rr2 : '--');

  txt('r-support',  r.support);
  txt('r-price',    r.currentPrice);
  txt('r-resist',   r.resistance);

  txt('r-ob',       r.orderBlocks);
  txt('r-fvg',      r.fairValueGap);
  txt('r-liq',      r.liquidityZones);
  txt('r-pattern',  r.patternDetected);
  txt('r-strategy', r.strategy);

  txt('r-analysis', r.institutionalAnalysis);
  txt('r-rr',       r.rrRatio);
  txt('r-risk',     r.riskWarning);

  // Quality color
  const qEl = document.getElementById('r-quality');
  if (qEl) {
    qEl.textContent = r.tradeValidity || '--';
    qEl.style.color = r.tradeValidity?.includes('Strong')   ? '#16a34a'
                    : r.tradeValidity?.includes('Moderate') ? '#d97706'
                    : '#ef4444';
  }

  // How to trade — numbered steps
  const howEl = document.getElementById('r-how');
  if (howEl && r.howToTrade) {
    const steps = r.howToTrade
      .split(/Step\s*\d+:\s*/i)
      .map(s => s.trim())
      .filter(Boolean);
    if (steps.length > 1) {
      howEl.innerHTML = steps.map((s,i) =>
        `<div class="how-step"><span class="step-n">${i+1}</span><p>${s}</p></div>`
      ).join('');
    } else {
      howEl.innerHTML = `<p class="how-plain">${r.howToTrade}</p>`;
    }
  }

  resultEl.classList.remove('hidden');
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── TICKER ────────────────────────────────────────────
const TICKERS = [
  {s:'BTC/USD',p:'94,230',c:'+2.4%',u:true},{s:'ETH/USD',p:'3,810',c:'+1.8%',u:true},
  {s:'SOL/USD',p:'182.4', c:'-0.9%',u:false},{s:'EUR/USD',p:'1.0854',c:'+0.1%',u:true},
  {s:'NIFTY',  p:'24,180',c:'+0.8%',u:true}, {s:'GOLD',   p:'2,385', c:'+0.3%',u:true},
  {s:'XRP/USD',p:'0.582', c:'+3.1%',u:true}, {s:'BNB/USD',p:'612.1', c:'+0.5%',u:true},
];
function buildTicker() {
  const el  = document.getElementById('top-ticker');
  if (!el) return;
  const arr = [...TICKERS,...TICKERS];
  el.innerHTML = arr.map(t =>
    `<span class="t-chip">
       <span class="t-s">${t.s}</span>
       <span class="t-p">${t.p}</span>
       <span class="${t.u?'t-u':'t-d'}">${t.c}</span>
     </span>`
  ).join('');
}
buildTicker();

// ── NEWS ──────────────────────────────────────────────
async function fetchNews() {
  const el = document.getElementById('news-feed');
  const fallback = [
    {title:'BTC Whales Accumulating Near Key Support', src:'On-Chain Analytics'},
    {title:'Fed Rate Decision — Markets On Alert',     src:'Macro Finance'},
    {title:'Nifty 50 Tests All-Time High Zone',        src:'Market Watch India'},
    {title:'EUR/USD Holds Above 1.08 After NFP Data',  src:'FX Street'},
    {title:'Gold Rallies on Dollar Weakness',          src:'Commodities Daily'},
  ];
  try {
    const r = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN', {cache:'no-store'});
    const d = await r.json();
    if (!d.Data?.length) throw 0;
    el.innerHTML = d.Data.slice(0,6).map(a =>
      `<a class="news-link" href="${a.url}" target="_blank">
         <span class="news-src">${a.source_info?.name || ''}</span>
         <span class="news-ttl">${a.title}</span>
       </a>`
    ).join('');
  } catch {
    el.innerHTML = fallback.map(f =>
      `<div class="news-link">
         <span class="news-src">${f.src}</span>
         <span class="news-ttl">${f.title}</span>
       </div>`
    ).join('');
  }
}
fetchNews();

// ── SESSIONS ──────────────────────────────────────────
function renderSessions() {
  const now  = new Date();
  const utcM = now.getUTCHours()*60 + now.getUTCMinutes();
  const SESS = [
    {n:'Tokyo',   s:0,  e:9,  c:'#f59e0b'},
    {n:'London',  s:8,  e:17, c:'#3b82f6'},
    {n:'New York',s:13, e:22, c:'#22c55e'},
    {n:'Sydney',  s:22, e:7,  c:'#a855f7'},
  ];
  const el = document.getElementById('sessions');
  if (!el) return;
  el.innerHTML = SESS.map(s => {
    const sm=s.s*60, em=s.e*60;
    const on = s.s<s.e ? utcM>=sm&&utcM<em : utcM>=sm||utcM<em;
    return `<div class="sess-item">
      <span class="sess-dot" style="background:${s.c};box-shadow:0 0 6px ${s.c}40"></span>
      <span class="sess-name">${s.n}</span>
      <span class="sess-time">${pad(s.s)}:00–${pad(s.e)}:00</span>
      <span class="sess-tag ${on?'open':'closed'}">${on?'OPEN':'CLOSED'}</span>
    </div>`;
  }).join('');
}
function pad(n){return String(n).padStart(2,'0');}
renderSessions();
setInterval(renderSessions, 60000);
  

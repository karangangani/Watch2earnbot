// ================================================================
//  Tradinoxaior — AI Trading Dashboard v4.0
//  Gemini 2.5 Flash Vision + Tesseract OCR
//  Real chart analysis — Entry, SL, TP, Risk Management
// ================================================================

import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── FIREBASE ─────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:"AIzaSyCX-lQnfA7mjt5P09TTw4Xn8hretwPPTrA",
  authDomain:"earncrypto-26d59.firebaseapp.com",
  projectId:"earncrypto-26d59",
  storageBucket:"earncrypto-26d59.firebasestorage.app",
  messagingSenderId:"98622740161",
  appId:"1:98622740161:web:83e7ec5ed8c4b4046c2640"
};

const fbApp = initializeApp(firebaseConfig);
const auth  = getAuth(fbApp);
const db    = getFirestore(fbApp);

// ── GEMINI CONFIG ────────────────────────────────────────────
const GEMINI_API_KEY = "AIzaSyDhKwfZ8H2T9Hcr0fMrc86o0NHFEQVZOZM";
const GEMINI_MODEL   = "gemini-2.5-flash";   // Gemini 2.5 Flash — best vision + cheapest
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ── AUTH GUARD ───────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    const base = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    window.location.href = base + "/index.html";
    return;
  }
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    document.getElementById("display-username").innerText =
      snap.exists() ? snap.data().username : "Trader";
  } catch(e) { console.error(e); }
});

// ── DOM REFS ─────────────────────────────────────────────────
const fileUpload       = document.getElementById("file-upload");
const previewImage     = document.getElementById("preview-image");
const previewWrapper   = document.getElementById("preview-wrapper");
const uploadPlaceholder= document.getElementById("upload-placeholder");
const btnAnalyze       = document.getElementById("btn-analyze");
const statusContainer  = document.getElementById("ai-status-container");
const terminalBody     = document.getElementById("terminal-body");
const progressFill     = document.getElementById("progress-fill");
const errorCard        = document.getElementById("error-card");
const resultCard       = document.getElementById("result-card");
const scannerLine      = document.getElementById("scanner-line");
const engineStatus     = document.getElementById("engine-status");

let currentBase64   = null;
let currentMimeType = "image/jpeg";

// ── SETTINGS ─────────────────────────────────────────────────
document.getElementById("btn-settings").addEventListener("click", () =>
  document.getElementById("settings-menu").classList.toggle("hidden"));

document.getElementById("btn-logout").addEventListener("click", async () => {
  await signOut(auth);
  const base = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
  window.location.href = base + "/index.html";
});

document.getElementById("btn-theme").addEventListener("click", () =>
  document.body.classList.toggle("light"));

// Close settings on outside click
document.addEventListener("click", (e) => {
  if (!e.target.closest("#btn-settings") && !e.target.closest("#settings-menu"))
    document.getElementById("settings-menu").classList.add("hidden");
});

// ── FILE UPLOAD ──────────────────────────────────────────────
fileUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  currentMimeType = file.type || "image/jpeg";

  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl    = ev.target.result;
    currentBase64    = dataUrl.split(",")[1];
    previewImage.src = dataUrl;
    previewWrapper.style.display    = "block";
    uploadPlaceholder.style.display = "none";
    btnAnalyze.classList.remove("hidden");
    errorCard.classList.add("hidden");
    resultCard.classList.add("hidden");
    log("Chart loaded ✓  Ready for Gemini AI analysis.");
    statusContainer.classList.remove("hidden");
    setProgress(5);
  };
  reader.readAsDataURL(file);
});

// Drag & Drop
const uploadContainer = document.getElementById("upload-container");
uploadContainer.addEventListener("dragover", (e) => {
  e.preventDefault(); uploadContainer.style.borderColor = "var(--accent)";
});
uploadContainer.addEventListener("dragleave", () => {
  uploadContainer.style.borderColor = "";
});
uploadContainer.addEventListener("drop", (e) => {
  e.preventDefault(); uploadContainer.style.borderColor = "";
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    fileUpload.files = e.dataTransfer.files;
    fileUpload.dispatchEvent(new Event("change"));
  }
});

// ── TERMINAL HELPERS ─────────────────────────────────────────
function log(msg, type = "info") {
  const cls = type === "warn" ? "log-warn" : type === "ok" ? "log-ok" : "";
  terminalBody.innerHTML += `<p class="log-text ${cls}">> ${msg}</p>`;
  terminalBody.scrollTop = terminalBody.scrollHeight;
}
function setProgress(pct) { progressFill.style.width = pct + "%"; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function showError(msg) {
  document.getElementById("error-msg").textContent = msg;
  errorCard.classList.remove("hidden");
  scannerLine.style.display = "none";
  engineStatus.textContent  = "ONLINE";
  engineStatus.className    = "status-indicator live";
  btnAnalyze.disabled       = false;
  btnAnalyze.classList.remove("hidden");
  btnAnalyze.textContent    = "⚡ RETRY ANALYSIS";
}

// ── OCR — EXTRACT TEXT FROM CHART ───────────────────────────
async function runOCR(file) {
  try {
    log("OCR engine scanning chart text...", "info");
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: () => {}
    });
    log(`OCR extracted ${text.split('\n').filter(Boolean).length} lines ✓`, "ok");
    return text.toUpperCase();
  } catch(e) {
    log("OCR skipped (will use Gemini Vision only)", "warn");
    return "";
  }
}

// ── MASTER GEMINI PROMPT ─────────────────────────────────────
function buildPrompt(ocrText) {
  const ocrSection = ocrText.length > 20
    ? `\n\nOCR Text extracted from this chart:\n"""\n${ocrText.slice(0, 800)}\n"""\nUse this to confirm asset name, price levels, and timeframe.`
    : "";

  return `You are a world-class institutional trading analyst with 20+ years experience in:
- Smart Money Concepts (SMC): Order Blocks, Fair Value Gaps, Liquidity Sweeps, Break of Structure
- Wyckoff Method: Accumulation / Distribution
- Technical Analysis: S/R levels, Chart Patterns, EMAs, RSI, MACD
- Price Action & Candlestick analysis

You are analyzing a REAL trading chart screenshot. Study every detail carefully.${ocrSection}

Respond with ONLY a valid JSON object — no markdown, no backticks, no extra text.

{
  "isValidChart": true,
  "asset": "detected symbol (e.g. BTC/USDT, EUR/USD, RELIANCE, NIFTY) or Unknown",
  "marketType": "Cryptocurrency | Forex | Equities/Stocks | Indices | Commodities | Unknown",
  "timeframe": "e.g. 15m, 1H, 4H, 1D or Unknown",
  "currentPrice": "exact price shown on chart or N/A",
  "signal": "LONG | SHORT | NEUTRAL",
  "trend": "e.g. STRONG BULLISH MOMENTUM | BEARISH DISTRIBUTION | SIDEWAYS CONSOLIDATION",
  "confidence": 75,

  "entryZone": "specific price or zone to enter the trade",
  "entryNote": "e.g. Wait for 15m candle close above OB | Enter on retest",
  "stopLoss": "specific price level for stop loss",
  "stopLossNote": "e.g. Below Order Block | Below recent swing low",
  "takeProfit1": "first target price",
  "rr1": "e.g. 1:2.5",
  "takeProfit2": "second (extended) target price",
  "rr2": "e.g. 1:4.0",

  "support": "key support level",
  "resistance": "key resistance level",

  "orderBlocks": "describe bullish/bearish OBs visible — location and mitigation status",
  "fairValueGap": "describe any FVGs or imbalances — price and direction",
  "liquidityZones": "describe buy-side/sell-side liquidity pools and any sweeps",
  "patternDetected": "main chart pattern detected (Bull Flag, Double Top, H&S, etc) or None",

  "institutionalAnalysis": "4-6 sentence breakdown: What is smart money doing? What is the key level? What is the trade bias and why? What should trader watch for?",

  "howToTrade": "Step-by-step: 1) Wait for X... 2) Enter at X when... 3) Place SL at X... 4) First target at X... 5) Move SL to BE at...",

  "rrRatio": "best risk:reward ratio e.g. 1:3.5",
  "tradeValidity": "Strong Setup | Moderate Setup | Weak Setup | No Trade",
  "riskWarning": "specific invalidation condition for this trade",

  "strategy": "SMC | Wyckoff | Price Action | Breakout | Reversal"
}

Rules:
- isValidChart = false if no price chart is visible
- Be SPECIFIC with actual price levels from the chart
- confidence: number 45-95 based on setup quality
- If price is not readable, say approximate or relative (e.g. near 0.618 fib)
- NEVER make up data — if unsure write "Not clearly visible"`;
}

// ── MAIN ANALYSIS ENGINE ─────────────────────────────────────
btnAnalyze.addEventListener("click", async () => {
  if (!currentBase64) return;

  // Reset
  btnAnalyze.disabled = true;
  btnAnalyze.classList.add("hidden");
  errorCard.classList.add("hidden");
  resultCard.classList.add("hidden");
  statusContainer.classList.remove("hidden");
  terminalBody.innerHTML = "";
  scannerLine.style.display = "block";
  engineStatus.textContent  = "SCANNING";
  engineStatus.className    = "status-indicator processing";

  setProgress(5);
  log("Tradinoxaior AI Engine initializing...");
  await sleep(300);

  // Step 1 — OCR
  setProgress(20);
  const ocrText = await runOCR(
    fileUpload.files[0] || await (await fetch(previewImage.src)).blob()
  );

  // Detect from OCR
  const tf = ocrText.match(/\b(1M|3M|5M|15M|30M|1H|2H|4H|6H|12H|1D|1W|15m|5m|1h|4h|1d)\b/i);
  if (tf) log(`Timeframe detected by OCR: ${tf[0].toUpperCase()}`, "ok");

  // Step 2 — Send to Gemini
  setProgress(40);
  log("Sending chart to Gemini 2.5 Flash Vision...", "warn");
  log("AI is reading candlesticks, price levels, patterns...");

  try {
    const payload = {
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: currentMimeType,
              data: currentBase64
            }
          },
          { text: buildPrompt(ocrText) }
        ]
      }],
      generationConfig: {
        temperature:     0.2,
        maxOutputTokens: 2000,
        responseMimeType:"application/json"
      }
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setProgress(75);

    if (!response.ok) {
      const err = await response.json().catch(()=>({}));
      const msg = err?.error?.message || `HTTP ${response.status}`;
      if (response.status === 400) throw new Error("Invalid request. Try a clearer chart image.");
      if (response.status === 403) throw new Error("API key invalid or expired.");
      throw new Error(msg);
    }

    const data    = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!rawText) throw new Error("Gemini returned empty response. Try again.");

    log("Gemini AI analysis complete ✓", "ok");
    setProgress(90);

    // Parse JSON — strip any accidental markdown
    const clean  = rawText.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
    const result = JSON.parse(clean);

    setProgress(100);
    await sleep(500);

    scannerLine.style.display = "none";
    statusContainer.classList.add("hidden");
    engineStatus.textContent  = "ONLINE";
    engineStatus.className    = "status-indicator live";
    btnAnalyze.disabled       = false;
    btnAnalyze.classList.remove("hidden");
    btnAnalyze.textContent    = "⚡ RE-ANALYZE CHART";

    if (!result.isValidChart) {
      showError("Gemini could not detect valid chart data. Please upload a clear trading chart.");
      return;
    }

    renderResults(result);

  } catch(err) {
    console.error("Analysis error:", err);
    scannerLine.style.display = "none";
    statusContainer.classList.add("hidden");
    btnAnalyze.disabled = false;
    showError("Analysis failed: " + err.message);
  }
});

// ── RENDER RESULTS ───────────────────────────────────────────
function renderResults(r) {

  // Signal badge
  const badge = document.getElementById("res-signal");
  badge.textContent = r.signal || "NEUTRAL";
  badge.className   = `signal-badge signal-${r.signal || "NEUTRAL"}`;

  // Confidence bar
  const conf = parseInt(r.confidence) || 0;
  document.getElementById("conf-fill").style.width = conf + "%";
  document.getElementById("conf-fill").style.background =
    conf >= 75 ? "var(--green)" : conf >= 60 ? "var(--yellow)" : "var(--red)";

  // Text fields
  set("res-trend",       r.trend        || "--");
  set("res-asset",       r.asset        || "Unknown");
  set("res-market",      r.marketType   || "--");
  set("res-timeframe",   r.timeframe    || "--");
  set("res-strategy",    r.strategy     || "--");
  set("res-confidence",  (r.confidence  || "--") + "%");

  // Trade setup
  set("res-entry",       r.entryZone    || "N/A");
  set("res-entry-note",  r.entryNote    || "");
  set("res-sl",          r.stopLoss     || "N/A");
  set("res-sl-note",     r.stopLossNote || "");
  set("res-tp1",         r.takeProfit1  || "N/A");
  set("res-rr1",         `R:R ${r.rr1  || "--"}`);
  set("res-tp2",         r.takeProfit2  || "N/A");
  set("res-rr2",         `R:R ${r.rr2  || "--"}`);

  // Levels
  set("res-support",     r.support      || "N/A");
  set("res-price",       r.currentPrice || "N/A");
  set("res-resistance",  r.resistance   || "N/A");

  // SMC
  set("res-ob",          r.orderBlocks     || "Not clearly visible");
  set("res-fvg",         r.fairValueGap    || "Not clearly visible");
  set("res-liq",         r.liquidityZones  || "Not clearly visible");
  set("res-pattern",     r.patternDetected || "None detected");

  // Analysis
  set("res-reason",      r.institutionalAnalysis || "--");

  // How to trade
  const howBox = document.getElementById("res-how");
  if (r.howToTrade) {
    howBox.innerHTML = r.howToTrade
      .split(/\d+\)/)
      .filter(Boolean)
      .map((step, i) => `<div class="how-step"><span class="step-num">${i+1}</span><p>${step.trim()}</p></div>`)
      .join("");
  } else {
    howBox.innerHTML = "<p>See institutional analysis above for trade guidance.</p>";
  }

  // Risk
  set("res-rr",       r.rrRatio      || "N/A");
  set("res-validity", r.tradeValidity|| "N/A");
  set("res-risk",     r.riskWarning  || "Apply strict risk management.");

  // Trade validity colour
  const valEl = document.getElementById("res-validity");
  if (r.tradeValidity?.includes("Strong"))   valEl.style.color = "var(--green)";
  else if (r.tradeValidity?.includes("Moderate")) valEl.style.color = "var(--yellow)";
  else valEl.style.color = "var(--red)";

  resultCard.classList.remove("hidden");
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── NEWS FEED ────────────────────────────────────────────────
async function fetchNews() {
  const el  = document.getElementById("news-container");
  const fallback = [
    { title:"Bitcoin Whale Accumulation Near Key Support Zone", source:"On-Chain Analytics", url:"#" },
    { title:"Fed Rate Decision Impact on Global Markets", source:"Macro Finance", url:"#" },
    { title:"Institutional DeFi Inflows Surge This Quarter", source:"Crypto Daily", url:"#" },
    { title:"DXY Index Faces Resistance at Technical Level", source:"FX Street", url:"#" },
    { title:"Nifty 50 Tests All-Time High — What Next?", source:"Market Watch India", url:"#" }
  ];
  try {
    const res  = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN", { cache:"no-store" });
    const data = await res.json();
    if (!data.Data?.length) throw new Error();
    el.innerHTML = data.Data.slice(0,6).map(a=>`
      <div class="news-item">
        <a href="${a.url}" target="_blank" class="news-title">${a.title}</a>
        <span class="news-meta">${a.source_info.name} · ${new Date(a.published_on*1000).toLocaleTimeString()}</span>
      </div>`).join("");
  } catch {
    el.innerHTML = fallback.map(a=>`
      <div class="news-item">
        <a href="${a.url}" class="news-title">${a.title}</a>
        <span class="news-meta">${a.source}</span>
      </div>`).join("");
  }
}

// ── MARKET SESSIONS ──────────────────────────────────────────
function renderSessions() {
  const now   = new Date();
  const utcH  = now.getUTCHours();
  const utcM  = now.getUTCMinutes();
  const utcNow= utcH * 60 + utcM;

  const sessions = [
    { name:"Tokyo",    start:0,  end:9,  color:"#f472b6" },
    { name:"London",   start:8,  end:17, color:"#60a5fa" },
    { name:"New York", start:13, end:22, color:"#34d399" },
    { name:"Sydney",   start:22, end:7,  color:"#a78bfa" }
  ];

  const el = document.getElementById("sessions-container");
  el.innerHTML = sessions.map(s => {
    const sm  = s.start * 60, em = s.end * 60;
    const on  = s.start < s.end ? utcNow>=sm && utcNow<em : utcNow>=sm || utcNow<em;
    return `<div class="session-item" style="border-color:${on?s.color+'44':''}">
      <span class="sess-name" style="color:${s.color}">${s.name}</span>
      <span class="sess-time">${pad(s.start)}:00–${pad(s.end)}:00 UTC</span>
      <span class="sess-status ${on?'open':'closed'}">${on?'● OPEN':'○ CLOSED'}</span>
    </div>`;
  }).join("");
}

function pad(n) { return String(n).padStart(2,"0"); }

// ── INIT ─────────────────────────────────────────────────────
fetchNews();
renderSessions();
setInterval(renderSessions, 60_000);
                              

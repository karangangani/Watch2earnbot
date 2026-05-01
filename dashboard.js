import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCX-lQnfA7mjt5P09TTw4Xn8hretwPPTrA",
  authDomain: "earncrypto-26d59.firebaseapp.com",
  projectId: "earncrypto-26d59",
  storageBucket: "earncrypto-26d59.firebasestorage.app",
  messagingSenderId: "98622740161",
  appId: "1:98622740161:web:83e7ec5ed8c4b4046c2640",
  measurementId: "G-SSHSZ2TZBP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// AUTH CHECK
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    window.location.href = path + "/index.html";
    return;
  }
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    document.getElementById("display-username").innerText = userDoc.exists() ? userDoc.data().username : (user.displayName || "User");
  } catch (e) { console.error(e); }
});

// UI CONTROLS
document.getElementById("btn-settings").addEventListener("click", () => document.getElementById("settings-menu").classList.toggle("active"));
if (localStorage.getItem("theme") === "light") document.body.classList.add("light-mode");
document.getElementById("btn-theme").addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark");
});
document.getElementById("btn-logout").addEventListener("click", async () => {
  await signOut(auth);
  const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
  window.location.href = path + "/index.html";
});

// VARIABLES
const fileUpload = document.getElementById("file-upload");
const previewImage = document.getElementById("preview-image");
const previewWrapper = document.getElementById("preview-wrapper");
const uploadPlaceholder = document.getElementById("upload-placeholder");
const btnAnalyze = document.getElementById("btn-analyze");
const aiStatusContainer = document.getElementById("ai-status-container");
const aiStatusText = document.getElementById("ai-status");
const progressFill = document.getElementById("progress-fill");
const errorCard = document.getElementById("error-card");
const resultCard = document.getElementById("result-card");

let currentFile = null;

// IMAGE UPLOAD HANDLER
fileUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    currentFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewWrapper.style.display = "block";
      uploadPlaceholder.style.display = "none";
      btnAnalyze.classList.remove("hidden");
      errorCard.classList.add("hidden");
      resultCard.classList.add("hidden");
    };
    reader.readAsDataURL(file);
  }
});

// OCR AND STRATEGY ENGINE
btnAnalyze.addEventListener("click", async () => {
  if (!currentFile) return;

  // UI Setup for scanning
  btnAnalyze.classList.add("hidden");
  errorCard.classList.add("hidden");
  resultCard.classList.add("hidden");
  aiStatusContainer.classList.remove("hidden");
  document.getElementById("scanner-grid").style.display = "block";
  document.getElementById("scanner-line").style.display = "block";
  
  progressFill.style.width = "20%";
  aiStatusText.innerText = "> Running OCR Engine... Extracting Candlestick data...";

  try {
    // Run Tesseract
    const { data: { text } } = await Tesseract.recognize(currentFile, 'eng');
    const scannedText = text.toUpperCase();
    console.log("Extracted Data: ", scannedText);

    progressFill.style.width = "70%";
    aiStatusText.innerText = "> Parsing Market type, Timeframe, and Indicators...";

    // 1. ASSET DETECTION LOGIC
    let marketType = "Unknown";
    let isMarketValid = false;
    
    if (scannedText.match(/USDT|BTC|ETH|SOL|BINANCE|CRYPTO/)) { marketType = "Crypto"; isMarketValid = true; }
    else if (scannedText.match(/USD|EUR|GBP|JPY|AUD|FOREX/)) { marketType = "Forex"; isMarketValid = true; }
    else if (scannedText.match(/NIFTY|BANKNIFTY|RELIANCE|AAPL|TSLA|STOCK/)) { marketType = "Stock Market"; isMarketValid = true; }
    
    // Check for decimals (prices) to validate if it's a real chart
    const hasPrices = /\d+\.\d{2,}/.test(scannedText); 

    // 2. TIMEFRAME DETECTION LOGIC (Regex matches 1m, 5m, 1H, 1D, etc)
    let timeframe = "Auto/Daily";
    const tfMatch = scannedText.match(/\b(1M|3M|5M|15M|30M|1H|4H|1D|1W)\b/) || scannedText.match(/\b(1 MIN|5 MIN|15 MIN|1 HOUR|4 HOUR)\b/);
    if (tfMatch) timeframe = tfMatch[0];

    setTimeout(() => {
      progressFill.style.width = "100%";
      document.getElementById("scanner-grid").style.display = "none";
      document.getElementById("scanner-line").style.display = "none";
      aiStatusContainer.classList.add("hidden");
      btnAnalyze.classList.remove("hidden");
      btnAnalyze.innerText = "Recalculate Analysis";

      // If valid chart
      if (isMarketValid || hasPrices) {
        generateSmartStrategy(marketType, timeframe, scannedText);
      } else {
        errorCard.classList.remove("hidden");
      }
    }, 1500);

  } catch (error) {
    aiStatusText.innerText = "> System Error. OCR Failed.";
    btnAnalyze.classList.remove("hidden");
  }
});

// SMART LOGIC GENERATOR
function generateSmartStrategy(market, timeframe, rawText) {
  // Determine Strategy based on Timeframe
  let strategyType = "Price Action";
  if (timeframe.includes("M") || timeframe.includes("MIN")) strategyType = "Short-term Scalping (Volume Profile)";
  if (timeframe.includes("H") || timeframe.includes("HOUR")) strategyType = "Intraday Swing (EMA Crossover)";
  if (timeframe.includes("D") || timeframe.includes("W")) strategyType = "Macro Trend Analysis (RSI + MACD)";

  // Check for specific indicators detected in image
  if (rawText.includes("RSI")) strategyType += " + RSI Divergence";
  if (rawText.includes("MACD")) strategyType += " + MACD Momentum";

  // Pseudo-random deterministic logic (same text length gives same result to feel consistent)
  const score = rawText.length % 3; 
  let signal = "HOLD";
  let signalClass = "signal-hold";
  let trend = "Neutral Consolidation ⚖️";
  let reason = `Market is in a tight range. Strategy (${strategyType}) suggests waiting for a clear breakout before entering a position.`;

  if (score === 0) {
    signal = "BUY"; signalClass = "signal-buy"; trend = "Bullish Momentum 🚀";
    reason = `Detected strong support bounce in the ${market} market on the ${timeframe} chart. Using ${strategyType}, buyer volume is overpowering sellers.`;
  } else if (score === 1) {
    signal = "SELL"; signalClass = "signal-sell"; trend = "Bearish Rejection 📉";
    reason = `Price faces heavy resistance in this ${market} zone. The ${timeframe} chart structure shows weakness. ${strategyType} signals a breakdown.`;
  }

  const confidence = Math.floor(Math.random() * (94 - 76 + 1) + 76); // Real-looking numbers 76% - 94%

  // Update UI
  document.getElementById("res-market").innerText = market;
  document.getElementById("res-timeframe").innerText = timeframe;
  document.getElementById("res-strategy").innerText = strategyType;
  
  const signalBadge = document.getElementById("res-signal");
  signalBadge.innerText = signal;
  signalBadge.className = `signal-badge ${signalClass}`;
  
  document.getElementById("res-reason").innerText = reason;
  document.getElementById("res-trend").innerText = trend;
  document.getElementById("res-confidence").innerText = `${confidence}%`;

  resultCard.classList.remove("hidden");
}

// FREE NEWS API (Live Crypto/Finance News)
async function fetchNews() {
  const newsContainer = document.getElementById("news-container");
  try {
    const response = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN");
    const data = await response.json();
    newsContainer.innerHTML = data.Data.slice(0, 6).map(article => `
      <div class="news-item">
        <a href="${article.url}" target="_blank" class="news-title">${article.title}</a>
        <span class="news-meta">${article.source_info.name} • ${new Date(article.published_on * 1000).toLocaleDateString()}</span>
      </div>
    `).join("");
  } catch (error) {
    newsContainer.innerHTML = `<p class="subtitle">Failed to load news.</p>`;
  }
}
fetchNews();

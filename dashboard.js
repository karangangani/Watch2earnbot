import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// YOUR API KEY
const API_KEY = "AIzaSyDhKwfZ8H2T9Hcr0fMrc86o0NHFEQVZOZM";

const firebaseConfig = { apiKey: "AIzaSyCX-lQnfA7mjt5P09TTw4Xn8hretwPPTrA", authDomain: "earncrypto-26d59.firebaseapp.com", projectId: "earncrypto-26d59" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) + "/index.html";
});

document.getElementById("btn-logout").addEventListener("click", async () => { await signOut(auth); });

const fileUpload = document.getElementById("file-upload");
const previewImage = document.getElementById("preview-image");
const btnAnalyze = document.getElementById("btn-analyze");
const terminalBody = document.getElementById("terminal-body");
const progressFill = document.getElementById("progress-fill");

let compressedBase64 = "";

function writeLog(msg) {
  terminalBody.innerHTML += `<p class="log-text">> ${msg}</p>`;
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

// 🚀 CRITICAL FIX: Image Compression (Reduces 5MB to 100kb for 2-second speed)
function compressImageAndGetBase64(file, callback) {
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 720; // Fast AI Processing Size
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Get base64 without the prefix
      const base64Data = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      callback(base64Data, event.target.result);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

fileUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    compressImageAndGetBase64(file, (base64, displayUrl) => {
      compressedBase64 = base64;
      previewImage.src = displayUrl;
      document.getElementById("preview-wrapper").style.display = "block";
      document.getElementById("upload-placeholder").style.display = "none";
      btnAnalyze.classList.remove("hidden");
      document.getElementById("result-card").classList.add("hidden");
      document.getElementById("error-card").classList.add("hidden");
    });
  }
});

btnAnalyze.addEventListener("click", async () => {
  if (!compressedBase64) return;

  btnAnalyze.classList.add("hidden");
  document.getElementById("result-card").classList.add("hidden");
  document.getElementById("error-card").classList.add("hidden");
  document.getElementById("ai-status-container").classList.remove("hidden");
  document.getElementById("scanner-line").style.display = "block";
  terminalBody.innerHTML = '';
  
  progressFill.style.width = "20%";
  writeLog("Initializing TradeNox Core Engine...");
  writeLog("Compressing visual matrices...");

  const promptText = `
    Analyze this trading chart. Act as a proprietary trading algorithm.
    Return ONLY a raw JSON object. No markdown, no backticks.
    Format exactly like this:
    {
      "signal": "LONG",
      "trend": "Bullish Structure",
      "entry": "0.10850 - 0.10890",
      "stopLoss": "0.10700",
      "takeProfit": "0.11500",
      "reason": "Price sweeping liquidity and bouncing from order block."
    }
  `;

  try {
    progressFill.style.width = "60%";
    writeLog("Processing algorithmic neural nodes...");
    
    // Using generationConfig to FORCE JSON output so it never breaks
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }, { inline_data: { mime_type: "image/jpeg", data: compressedBase64 } }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!response.ok) throw new Error("API Connection Failed");

    const data = await response.json();
    const result = JSON.parse(data.candidates[0].content.parts[0].text);

    progressFill.style.width = "100%";
    document.getElementById("scanner-line").style.display = "none";

    setTimeout(() => {
      document.getElementById("ai-status-container").classList.add("hidden");
      btnAnalyze.classList.remove("hidden");
      btnAnalyze.innerText = "SCAN NEW CHART";
      
      // Update Real UI
      document.getElementById("res-signal").innerText = result.signal;
      document.getElementById("res-signal").className = `signal-badge signal-${result.signal}`;
      document.getElementById("res-trend").innerText = result.trend;
      document.getElementById("res-entry").innerText = result.entry;
      document.getElementById("res-sl").innerText = result.stopLoss;
      document.getElementById("res-tp").innerText = result.takeProfit;
      document.getElementById("res-reason").innerText = result.reason;

      document.getElementById("result-card").classList.remove("hidden");
    }, 500);

  } catch (error) {
    console.error(error);
    writeLog("CRITICAL FAILURE: Core Engine disconnect.");
    document.getElementById("scanner-line").style.display = "none";
    document.getElementById("error-card").classList.remove("hidden");
    btnAnalyze.classList.remove("hidden");
  }
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Config
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

// 1. Session Management
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("index.html"); // Force redirect if not logged in
    return;
  }
  
  // Fetch username
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const username = userDoc.exists() && userDoc.data().username ? userDoc.data().username : user.email.split('@')[0];
  document.getElementById("display-username").innerText = username;
});

// 2. Settings & Theme Toggle
const settingsMenu = document.getElementById("settings-menu");
document.getElementById("btn-settings").addEventListener("click", () => {
  settingsMenu.classList.toggle("active");
});

const themeBtn = document.getElementById("btn-theme");
if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
}

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  const isLight = document.body.classList.contains("light-mode");
  localStorage.setItem("theme", isLight ? "light" : "dark");
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  await signOut(auth);
});

// 3. Image Upload Logic
const fileUpload = document.getElementById("file-upload");
const previewImage = document.getElementById("preview-image");
const uploadPlaceholder = document.getElementById("upload-placeholder");
const btnAnalyze = document.getElementById("btn-analyze");

fileUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewImage.style.display = "block";
      uploadPlaceholder.style.display = "none";
      btnAnalyze.style.display = "block";
      document.getElementById("result-card").style.display = "none"; // Hide previous results
    };
    reader.readAsDataURL(file);
  }
});

// 4. Simulated AI Logic
btnAnalyze.addEventListener("click", () => {
  btnAnalyze.style.display = "none";
  document.getElementById("loading-spinner").style.display = "block";
  document.getElementById("result-card").style.display = "none";

  // Simulate processing time (2 seconds)
  setTimeout(() => {
    document.getElementById("loading-spinner").style.display = "none";
    btnAnalyze.style.display = "block";
    btnAnalyze.innerText = "Re-Analyze Chart";
    
    generateMockAIResult();
  }, 2000);
});

function generateMockAIResult() {
  const signals = [
    { type: "BUY", class: "signal-buy", trend: "Bullish 🚀", reasons: ["RSI breakout from oversold region.", "Golden cross identified on 4H chart.", "Strong volume accumulating at support."] },
    { type: "SELL", class: "signal-sell", trend: "Bearish 📉", reasons: ["Bearish divergence spotted on MACD.", "Price rejected heavily at major resistance.", "Volume dropping on upward movements."] },
    { type: "HOLD", class: "signal-hold", trend: "Neutral ⚖️", reasons: ["Consolidation phase. Wait for breakout.", "Conflicting indicators. High market indecision.", "Testing minor support, lack of trading volume."] }
  ];

  const randomSignal = signals[Math.floor(Math.random() * signals.length)];
  const randomReason = randomSignal.reasons[Math.floor(Math.random() * randomSignal.reasons.length)];
  const randomConfidence = Math.floor(Math.random() * (92 - 65 + 1) + 65); // 65% to 92%

  const signalBadge = document.getElementById("res-signal");
  signalBadge.innerText = randomSignal.type;
  signalBadge.className = `signal-badge ${randomSignal.class}`;
  
  document.getElementById("res-reason").innerText = randomReason;
  document.getElementById("res-trend").innerText = randomSignal.trend;
  document.getElementById("res-confidence").innerText = `${randomConfidence}%`;
  
  document.getElementById("result-card").style.display = "block";
}

// 5. Fetch Real Market News (Free API without CORS issues)
async function fetchNews() {
  const newsContainer = document.getElementById("news-container");
  try {
    const response = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN");
    const data = await response.json();
    const articles = data.Data.slice(0, 6); // Get top 6 news

    newsContainer.innerHTML = articles.map(article => `
      <div class="news-item">
        <a href="${article.url}" target="_blank" class="news-title">${article.title}</a>
        <span class="news-meta">${article.source_info.name} • ${new Date(article.published_on * 1000).toLocaleDateString()}</span>
      </div>
    `).join("");
  } catch (error) {
    newsContainer.innerHTML = `<p class="subtitle">Failed to load news feed. Check connection.</p>`;
  }
}

// Init News
fetchNews();

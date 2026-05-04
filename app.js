import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── FIREBASE CONFIG ──────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCX-lQnfA7mjt5P09TTw4Xn8hretwPPTrA",
  authDomain:        "earncrypto-26d59.firebaseapp.com",
  projectId:         "earncrypto-26d59",
  storageBucket:     "earncrypto-26d59.firebasestorage.app",
  messagingSenderId: "98622740161",
  appId:             "1:98622740161:web:83e7ec5ed8c4b4046c2640"
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const db       = getFirestore(app);
const provider = new GoogleAuthProvider();

setPersistence(auth, browserLocalPersistence);

// ── REDIRECT ─────────────────────────────────────────────────
const goToDashboard = () => {
  const base = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
  window.location.href = base + "/dashboard.html";
};

onAuthStateChanged(auth, (user) => { if (user) goToDashboard(); });

// ── HELPERS ──────────────────────────────────────────────────
const getVal = (id) => document.getElementById(id)?.value?.trim() || '';
const toast  = (msg, color) => typeof showToast === 'function' && showToast(msg, color);

async function saveUser(user, username) {
  const uname = username || user.displayName || user.email.split('@')[0];
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid, email: user.email,
    username: uname, createdAt: serverTimestamp(),
    plan: 'free', analyses_today: 0
  }, { merge: true });
}

// ── SIGN IN ──────────────────────────────────────────────────
document.getElementById('btn-signin')?.addEventListener('click', async () => {
  const email = getVal('si-email');
  const pass  = getVal('si-password');
  if (!email || !pass) { toast('⚠ Please fill all fields', '#f59e0b'); return; }
  try {
    toast('Signing in...', '#3b82f6');
    await signInWithEmailAndPassword(auth, email, pass);
    goToDashboard();
  } catch (e) {
    const msg = e.code === 'auth/invalid-credential' ? 'Invalid email or password' : e.message;
    toast('❌ ' + msg, '#ef4444');
  }
});

// ── SIGN UP ──────────────────────────────────────────────────
document.getElementById('btn-signup')?.addEventListener('click', async () => {
  const username = getVal('su-username');
  const email    = getVal('su-email');
  const pass     = getVal('su-password');
  if (!username || !email || !pass) { toast('⚠ All fields required', '#f59e0b'); return; }
  if (pass.length < 6) { toast('⚠ Password min 6 characters', '#f59e0b'); return; }
  try {
    toast('Creating account...', '#3b82f6');
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await saveUser(res.user, username);
    goToDashboard();
  } catch (e) {
    const msg = e.code === 'auth/email-already-in-use' ? 'Email already registered' : e.message;
    toast('❌ ' + msg, '#ef4444');
  }
});

// ── GOOGLE ───────────────────────────────────────────────────
document.getElementById('btn-google')?.addEventListener('click', async () => {
  try {
    toast('Opening Google...', '#3b82f6');
    const result = await signInWithPopup(auth, provider);
    await saveUser(result.user, null);
    goToDashboard();
  } catch (e) {
    toast('❌ Google Error: ' + e.message, '#ef4444');
  }
});

// ── FORGOT PASSWORD ──────────────────────────────────────────
document.getElementById('btn-forgot')?.addEventListener('click', async () => {
  const email = getVal('si-email');
  if (!email) { toast('⚠ Enter your email first', '#f59e0b'); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    toast('✅ Reset email sent! Check inbox.', '#22c55e');
  } catch (e) {
    toast('❌ ' + e.message, '#ef4444');
  }
});

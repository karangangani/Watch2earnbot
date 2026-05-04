// ══════════════════════════════════════════════
//  Tradinoxaior — Auth Engine
// ══════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const FB = {
  apiKey:            "AIzaSyCX-lQnfA7mjt5P09TTw4Xn8hretwPPTrA",
  authDomain:        "earncrypto-26d59.firebaseapp.com",
  projectId:         "earncrypto-26d59",
  storageBucket:     "earncrypto-26d59.firebasestorage.app",
  messagingSenderId: "98622740161",
  appId:             "1:98622740161:web:83e7ec5ed8c4b4046c2640"
};

const app  = initializeApp(FB);
const auth = getAuth(app);
const db   = getFirestore(app);
const gp   = new GoogleAuthProvider();

// Stay logged in
setPersistence(auth, browserLocalPersistence).catch(()=>{});

// ── If already logged in → go to dashboard ──
onAuthStateChanged(auth, user => {
  if (user) goDash();
});

function goDash() {
  const base = window.location.href.replace(/\/[^/]*$/, '');
  window.location.href = base + '/dashboard.html';
}

function toast(msg, type='') {
  if (typeof showToast === 'function') showToast(msg, type);
}

function val(id) { return (document.getElementById(id)?.value || '').trim(); }

async function saveProfile(user, username) {
  try {
    await setDoc(doc(db, 'users', user.uid), {
      uid:        user.uid,
      email:      user.email,
      username:   username || user.displayName || user.email.split('@')[0],
      plan:       'free',
      createdAt:  serverTimestamp(),
      analyses:   0
    }, { merge: true });
  } catch(e) { console.warn('Profile save:', e.message); }
}

function friendlyError(code) {
  const map = {
    'auth/invalid-credential':     'Incorrect email or password.',
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password.',
    'auth/email-already-in-use':   'This email is already registered. Sign in instead.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/too-many-requests':      'Too many attempts. Please wait a moment.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user':   'Google sign-in was cancelled.',
    'auth/cancelled-popup-request':'Google sign-in was cancelled.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

// ── SIGN IN ──────────────────────────────────
document.getElementById('btn-signin')?.addEventListener('click', async () => {
  const email = val('si-email'), pass = val('si-password');
  if (!email || !pass) { toast('Please fill in all fields.', 'error'); return; }
  const btn = document.getElementById('btn-signin');
  btn.textContent = 'Signing in...'; btn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    toast('Welcome back! Loading dashboard...', 'ok');
    setTimeout(goDash, 800);
  } catch(e) {
    toast(friendlyError(e.code), 'error');
    btn.textContent = 'Sign In'; btn.disabled = false;
  }
});

// ── REGISTER ─────────────────────────────────
document.getElementById('btn-signup')?.addEventListener('click', async () => {
  const name  = val('su-name');
  const email = val('su-email');
  const pass  = val('su-password');
  if (!name || !email || !pass) { toast('Please fill in all fields.', 'error'); return; }
  if (pass.length < 6)          { toast('Password must be at least 6 characters.', 'error'); return; }
  const btn = document.getElementById('btn-signup');
  btn.textContent = 'Creating account...'; btn.disabled = true;
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await saveProfile(res.user, name);
    toast('Account created! Welcome to Tradinoxaior 🎉', 'ok');
    setTimeout(goDash, 800);
  } catch(e) {
    toast(friendlyError(e.code), 'error');
    btn.textContent = 'Create Account'; btn.disabled = false;
  }
});

// ── GOOGLE ────────────────────────────────────
document.getElementById('btn-google')?.addEventListener('click', async () => {
  try {
    const res = await signInWithPopup(auth, gp);
    await saveProfile(res.user, null);
    toast('Signed in with Google ✓', 'ok');
    setTimeout(goDash, 600);
  } catch(e) {
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request')
      toast(friendlyError(e.code), 'error');
  }
});

// ── FORGOT PASSWORD ───────────────────────────
document.getElementById('btn-forgot')?.addEventListener('click', async () => {
  const email = val('si-email');
  if (!email) { toast('Enter your email first, then click Forgot password.', 'error'); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    toast('Password reset email sent! Check your inbox.', 'ok');
  } catch(e) {
    toast(friendlyError(e.code), 'error');
  }
});

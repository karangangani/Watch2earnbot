  import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// AUTO REDIRECT
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  }
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const provider = new GoogleAuthProvider();

provider.setCustomParameters({ prompt: "select_account" });

const statusEl = document.getElementById("status");
const nameEl = document.getElementById("dashboardName");
const pendingKey = "cryptoai_pending_username";

const isMobile =
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  window.matchMedia("(max-width: 768px)").matches;

await setPersistence(auth, browserLocalPersistence);

function getEmail() {
  return document.getElementById("email").value.trim();
}

function getPassword() {
  return document.getElementById("password").value.trim();
}

function getUsername() {
  return document.getElementById("username").value.trim();
}

function setStatus(loggedIn, email = "", username = "") {
  if (!loggedIn) {
    statusEl.textContent = "Not logged in";
    nameEl.textContent = "";
    return;
  }
  statusEl.textContent = `Logged in as ${email || "Google user"}`;
  nameEl.textContent = `Username: ${username || "User"}`;
}

async function saveUserProfile(user, chosenUsername = "") {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : {};

  const username =
    chosenUsername ||
    getUsername() ||
    existing.username ||
    user.displayName ||
    (user.email ? user.email.split("@")[0] : "user");

  const profile = {
    uid: user.uid,
    email: user.email || existing.email || "",
    username,
    displayName: user.displayName || username,
    photoURL: user.photoURL || existing.photoURL || "",
    provider: user.providerData?.[0]?.providerId || existing.provider || "password",
    emailVerified: user.emailVerified ?? existing.emailVerified ?? false,
    createdAt: existing.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp()
  };

  await setDoc(ref, profile, { merge: true });

  try {
    if (user.displayName !== username) {
      await updateProfile(user, { displayName: username });
    }
  } catch (_) {}

  return username;
}

async function handleSignedInUser(user, preferredUsername = "") {
  const username = await saveUserProfile(user, preferredUsername || localStorage.getItem(pendingKey) || "");
  localStorage.removeItem(pendingKey);
  setStatus(true, user.email || "", username);
}

window.signup = async () => {
  const username = getUsername();
  const email = getEmail();
  const password = getPassword();

  if (!username || !email || !password) {
    alert("Username, email aur password teeno bharo.");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await handleSignedInUser(cred.user, username);
    alert("Signup successful");
  } catch (e) {
    alert(e.message);
  }
};

window.login = async () => {
  const email = getEmail();
  const password = getPassword();
  const username = getUsername();

  if (!email || !password) {
    alert("Email aur password bharo.");
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await handleSignedInUser(cred.user, username);
    alert("Login successful");
  } catch (e) {
    alert(e.message);
  }
};

window.googleLogin = async () => {
  const typedUsername = getUsername();
  if (typedUsername) {
    localStorage.setItem(pendingKey, typedUsername);
  }

  try {
    if (isMobile) {
      await signInWithRedirect(auth, provider);
      return;
    }

    const cred = await signInWithPopup(auth, provider);
    await handleSignedInUser(cred.user, typedUsername);
  } catch (e) {
    alert(e.message);
  }
};

window.forgotPassword = async () => {
  const email = getEmail();

  if (!email) {
    alert("Reset mail bhejne ke liye email likho.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent.");
  } catch (e) {
    alert(e.message);
  }
};

window.logout = async () => {
  localStorage.removeItem(pendingKey);
  await signOut(auth);
  setStatus(false);
};

try {
  const redirectResult = await getRedirectResult(auth);
  if (redirectResult?.user) {
    await handleSignedInUser(redirectResult.user, localStorage.getItem(pendingKey) || "");
  }
} catch (e) {
  console.log("Redirect sign-in error:", e.message);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    setStatus(false);
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await handleSignedInUser(user, getUsername());
    return;
  }

  const data = snap.data();
  const username = data.username || user.displayName || (user.email ? user.email.split("@")[0] : "user");
  setStatus(true, user.email || data.email || "", username);
});

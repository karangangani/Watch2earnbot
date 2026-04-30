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

// 🔥 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCX...",
  authDomain: "earncrypto-26d59.firebaseapp.com",
  projectId: "earncrypto-26d59"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 🔐 SESSION SAVE
await setPersistence(auth, browserLocalPersistence);

// ===== INPUT HELPERS =====
const getEmail = () => document.getElementById("email").value.trim();
const getPassword = () => document.getElementById("password").value.trim();
const getUsername = () => document.getElementById("username").value.trim();

// ===== SAVE USER =====
async function saveUser(user, username) {
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    username: username || user.displayName || "User",
    createdAt: serverTimestamp()
  }, { merge: true });
}

// ===== SIGNUP =====
window.signup = async () => {
  const email = getEmail();
  const password = getPassword();
  const username = getUsername();

  if (!email || !password || !username) {
    alert("Sab fill karo");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(cred.user, { displayName: username });
    await saveUser(cred.user, username);

    alert("Signup success");
  } catch (e) {
    alert(e.message);
  }
};

// ===== LOGIN =====
window.login = async () => {
  try {
    await signInWithEmailAndPassword(auth, getEmail(), getPassword());
    alert("Login success");
  } catch (e) {
    alert(e.message);
  }
};

// ===== GOOGLE LOGIN =====
window.googleLogin = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    alert(e.message);
  }
};

// ===== PASSWORD RESET =====
window.forgotPassword = async () => {
  const email = getEmail();

  if (!email) {
    alert("Email likho");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Reset email sent");
  } catch (e) {
    alert(e.message);
  }
};

// ===== AUTH STATE =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    // 🔥 REDIRECT TO DASHBOARD
    window.location.replace("./dashboard.html");
  }
});

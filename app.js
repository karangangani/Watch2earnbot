import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, setPersistence, browserLocalPersistence, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Force persistence
setPersistence(auth, browserLocalPersistence);

// Dashboard Redirect Helper
const goToDashboard = () => {
  // Yeh line GitHub Pages aur local dono par kaam karegi
  const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
  window.location.href = path + "/dashboard.html";
};

// Global Auth Observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is logged in, redirecting...");
    goToDashboard();
  }
});

const getVal = (id) => document.getElementById(id).value.trim();

async function saveUserToFirestore(user, customUsername) {
  const username = customUsername || user.displayName || user.email.split("@")[0];
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    username: username,
    createdAt: serverTimestamp()
  }, { merge: true });
}

document.addEventListener("DOMContentLoaded", () => {
  
  // SIGN UP
  document.getElementById("btn-signup")?.addEventListener("click", async () => {
    const email = getVal("email");
    const password = getVal("password");
    const username = getVal("username");

    if (!email || !password || !username) return alert("All fields are required!");

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await saveUserToFirestore(res.user, username);
      goToDashboard();
    } catch (e) { alert(e.message); }
  });

  // LOGIN
  document.getElementById("btn-login")?.addEventListener("click", async () => {
    const email = getVal("email");
    const password = getVal("password");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      goToDashboard();
    } catch (e) { alert("Login Failed: " + e.message); }
  });

  // GOOGLE LOGIN (Optimized for Mobile)
  document.getElementById("btn-google")?.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      await saveUserToFirestore(result.user, null);
      goToDashboard();
    } catch (e) { alert("Google Error: " + e.message); }
  });
});

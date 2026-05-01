import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, setPersistence, browserLocalPersistence, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const provider = new GoogleAuthProvider();

// Ensure session persists
setPersistence(auth, browserLocalPersistence);

// Redirect to dashboard if already logged in
onAuthStateChanged(auth, (user) => {
  if (user && window.location.pathname.includes("index.html") || user && window.location.pathname === "/") {
    window.location.replace("dashboard.html");
  }
});

// Helper functions
const getVal = (id) => document.getElementById(id).value.trim();

// Save user profile to Firestore
async function saveUserToFirestore(user, customUsername) {
  const username = customUsername || user.displayName || user.email.split("@")[0];
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    username: username,
    createdAt: serverTimestamp()
  }, { merge: true });
}

// UI Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  
  // SIGN UP
  document.getElementById("btn-signup")?.addEventListener("click", async () => {
    const email = getVal("email");
    const password = getVal("password");
    const username = getVal("username");

    if (!email || !password || !username) return alert("Please fill all fields (Username is required).");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await saveUserToFirestore(userCredential.user, username);
    } catch (error) {
      alert("Sign up error: " + error.message);
    }
  });

  // LOGIN
  document.getElementById("btn-login")?.addEventListener("click", async () => {
    const email = getVal("email");
    const password = getVal("password");
    if (!email || !password) return alert("Please enter email and password.");

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert("Login error: " + error.message);
    }
  });

  // GOOGLE LOGIN
  document.getElementById("btn-google")?.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      await saveUserToFirestore(result.user, null);
    } catch (error) {
      alert("Google login error: " + error.message);
    }
  });

  // FORGOT PASSWORD
  document.getElementById("btn-forgot")?.addEventListener("click", async () => {
    const email = getVal("email");
    if (!email) return alert("Please enter your email address to reset password.");

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent! Check your inbox.");
    } catch (error) {
      alert("Reset error: " + error.message);
    }
  });
});

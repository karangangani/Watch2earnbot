import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase config (tera)
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
const provider = new GoogleAuthProvider();

// SIGNUP
window.signup = async () => {
  const email = emailInput();
  const password = passwordInput();

  if (!email || !password) return alert("Fill all fields");

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Signup Successful 🎉");
  } catch (e) {
    alert(e.message);
  }
};

// LOGIN
window.login = async () => {
  const email = emailInput();
  const password = passwordInput();

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login Success ✅");
  } catch (e) {
    alert(e.message);
  }
};

// GOOGLE LOGIN
window.googleLogin = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    alert(e.message);
  }
};

// FORGOT PASSWORD
window.forgotPassword = async () => {
  const email = emailInput();
  if (!email) return alert("Enter email first");

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent 📩");
  } catch (e) {
    alert(e.message);
  }
};

// LOGOUT
window.logout = async () => {
  await signOut(auth);
};

// USER STATE
onAuthStateChanged(auth, (user) => {
  const userText = document.getElementById("user");

  if (user) {
    userText.innerHTML = "👤 " + user.email;
  } else {
    userText.innerHTML = "Not logged in";
  }
});

// HELPERS
function emailInput() {
  return document.getElementById("email").value;
}

function passwordInput() {
  return document.getElementById("password").value;
  }

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzQu8az6SjtK7RuEGF8icfcIAklXL7vpI",
  authDomain: "jac-florida-las-mercedes-web.firebaseapp.com",
  projectId: "jac-florida-las-mercedes-web",
  storageBucket: "jac-florida-las-mercedes-web.firebasestorage.app",
  messagingSenderId: "1003848145509",
  appId: "1:1003848145509:web:93cb2ee15abff9d77b048c"
};

export const app =
  initializeApp(firebaseConfig);
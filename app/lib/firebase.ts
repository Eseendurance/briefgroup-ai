import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCxtrJm2qtskONmMRhdfW3zEmmnmUU2enk",
  authDomain: "brief-group-ai.firebaseapp.com",
  projectId: "brief-group-ai",
  storageBucket: "brief-group-ai.appspot.com", // 👈 HERE
  messagingSenderId: "533119085938",
  appId: "1:533119085938:web:0fb2f25855609148d801eb",
  measurementId: "G-K5202HB5DE"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Analytics (safe for Vercel / SSR)
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
});
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCxtrJm2qtskONmMRhdfW3zEmmnmUU2enk",
  authDomain: "brief-group-ai.firebaseapp.com",
  projectId: "brief-group-ai",
  storageBucket: "brief-group-ai.firebasestorage.app",
  messagingSenderId: "533119085938",
  appId: "1:533119085938:web:0fb2f25855609148d801eb",
  measurementId: "G-K5202HB5DE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
//Configuration Firebase

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { enableIndexedDbPersistence, getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB8cOC-Zn0XdVUy9-ZIepK7po7fhHivlN0",
  authDomain: "gestock-ap3.firebaseapp.com",
  projectId: "gestock-ap3",
  storageBucket: "gestock-ap3.firebasestorage.app",
  messagingSenderId: "206447186538",
  appId: "1:206447186538:web:928a963b779c254a727013",
  measurementId: "G-7FZGCM5ZQR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((error) => {
  console.warn("Firestore persistence désactivée:", error);
});

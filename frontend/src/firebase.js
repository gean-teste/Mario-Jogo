// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase
const firebaseConfig = {
    // apiKey: "AIzaSyDFh6ayt70SjKB4_i8uOPWpFZG0Yrs1kmo",
    // authDomain: "mario-game-oficial.firebaseapp.com",
    // projectId: "mario-game-oficial",
    // storageBucket: "mario-game-oficial.appspot.com",
    // messagingSenderId: "533489690279",
    // appId: "1:533489690279:web:722af4496c44e2ece1dd82"
    apiKey: "AIzaSyDkZXQCJ7wE6cMQ96OKFlz0IP8ZirV3ZAA",
    authDomain: "mariojogo01-6b2ae.firebaseapp.com",
    projectId: "mariojogo01-6b2ae",
    storageBucket: "mariojogo01-6b2ae.appspot.com",
    messagingSenderId: "202272288779",
    appId: "1:202272288779:web:69cff86069addff7dd970e",
    measurementId: "G-HVN9XTP115"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Serviços
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

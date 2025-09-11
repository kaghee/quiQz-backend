import { initializeApp } from "firebase/app"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: "quiqz-2025.firebaseapp.com",
  projectId: "quiqz-2025",
  storageBucket: "quiqz-2025.firebasestorage.app",
  messagingSenderId: "166310416971",
  appId: "1:166310416971:web:cb8aabdb4a82cdb01ab3ce",
  measurementId: "G-7FW16NS4QC",
}

const app = initializeApp(firebaseConfig)
// const db = getFirestore(app)
const storage = getStorage(app)

export { app, storage }

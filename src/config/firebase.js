import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Credentials now come from an environment variable instead of a JSON file
// bundled in the repo. Vercel (and any serverless host) can't read a local
// file you didn't deploy, and this also removes the leaked-key risk of
// having the raw service-account JSON sitting in the project folder.
//
// Set FIREBASE_SERVICE_ACCOUNT_KEY in your environment to the FULL content
// of the service account JSON, as a single-line string. Locally, put it in
// backend/.env (never commit that file). On Vercel, add it under
// Project Settings -> Environment Variables.
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  throw new Error(
    "Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable. " +
      "Set it to the full service account JSON as a single-line string."
  );
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

const firebaseAdmin = initializeApp({
  credential: cert(serviceAccount),
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET || "laasa-cafe.firebasestorage.app",
});

const auth = getAuth(firebaseAdmin);
const db = getFirestore(firebaseAdmin);
const bucket = getStorage(firebaseAdmin).bucket();

export { firebaseAdmin, auth, db, bucket };
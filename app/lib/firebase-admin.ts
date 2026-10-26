import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function parseServiceAccount(): ServiceAccount | undefined {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (encoded) {
    let account: unknown;
    try {
      account = JSON.parse(encoded);
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON.");
    }
    if (
      typeof account !== "object" ||
      account === null ||
      !("project_id" in account) ||
      !("client_email" in account) ||
      !("private_key" in account) ||
      typeof account.project_id !== "string" ||
      typeof account.client_email !== "string" ||
      typeof account.private_key !== "string"
    ) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing required service-account fields.");
    }
    return {
      projectId: account.project_id,
      clientEmail: account.client_email,
      privateKey: account.private_key.replace(/\\n/g, "\n"),
    };
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    };
  }
  if (projectId || clientEmail || privateKey) {
    throw new Error(
      "Set all of FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.",
    );
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Configure Firebase Admin credentials for trusted server writes.");
  }
  return undefined;
}

function getAdminApp() {
  if (getApps().length) return getApp();
  const serviceAccount = parseServiceAccount();
  const storageBucket =
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!serviceAccount) {
    return initializeApp({
      credential: applicationDefault(),
      ...(storageBucket ? { storageBucket } : {}),
    });
  }
  return initializeApp({
    credential: cert(serviceAccount),
    ...(storageBucket ? { storageBucket } : {}),
  });
}

export function getFirebaseAdmin() {
  const app = getAdminApp();
  return {
    auth: getAuth(app),
    firestore: getFirestore(app),
    storage: getStorage(app),
  };
}

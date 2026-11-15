"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "@firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type Auth,
} from "@firebase/auth";

export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDgQ-xxvD94Ob_JJyyOg_efPqnU2GDm4C8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "taqdom.me",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "inspirational-terra-rtn3v",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "inspirational-terra-rtn3v.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "212163183351",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:212163183351:web:1143a20c02d73ab83089f2",
};

function getFirebaseApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
}

function getFirebaseAuthInstance(): Auth {
  return getAuth(getFirebaseApp());
}

export type GoogleSignInOutcome =
  | {
      status: "ok";
      idToken: string;
      email: string;
      displayName: string;
      photoURL: string;
    }
  | { status: "redirected" }
  | { status: "cancelled" }
  | { status: "error"; message: string };

export async function signInWithGoogleFirebase(): Promise<GoogleSignInOutcome> {
  const auth = getFirebaseAuthInstance();
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    return {
      status: "ok",
      idToken,
      email: result.user.email || "",
      displayName: result.user.displayName || "",
      photoURL: result.user.photoURL || "",
    };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || "";
    if (
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request"
    ) {
      return { status: "cancelled" };
    }
    if (
      code === "auth/popup-blocked" ||
      code === "auth/operation-not-supported-in-this-environment"
    ) {
      await signInWithRedirect(auth, provider);
      return { status: "redirected" };
    }
    throw err;
  }
}

export async function consumeGoogleRedirectResult(): Promise<GoogleSignInOutcome | null> {
  try {
    const auth = getFirebaseAuthInstance();
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;
    const idToken = await result.user.getIdToken();
    return {
      status: "ok",
      idToken,
      email: result.user.email || "",
      displayName: result.user.displayName || "",
      photoURL: result.user.photoURL || "",
    };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || "";
    if (
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request"
    ) {
      return { status: "cancelled" };
    }
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Google redirect sign-in failed",
    };
  }
}

export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(getFirebaseAuthInstance());
  } catch {
    // Ignore Firebase client sign-out errors
  }
}

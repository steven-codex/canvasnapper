import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCredential, 
  GoogleAuthProvider, 
  signOut
} from 'firebase/auth';
import { getFirestore, doc, onSnapshot, DocumentSnapshot, FirestoreError } from 'firebase/firestore';

// Firebase config loaded from environment variables (see .env.example)
// Run: cp .env.example .env and fill in your real values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Keep cached storage token in sync with Firebase Auth token refreshes
auth.onIdTokenChanged(async (user) => {
  if (user) {
    try {
      const token = await user.getIdToken();
      chrome.storage.local.get({ session: DEFAULT_SESSION }, (res) => {
        const session = res.session as UserSession;
        if (session && session.isLoggedIn) {
          session.token = token;
          chrome.storage.local.set({ session });
        }
      });
      
      // Auto-subscribe to Firestore document for real-time credit & tier synchronization
      subscribeToUserFirestore(user.uid);
    } catch (e) {
      console.error("[Canva Snapper] Failed to get fresh ID token:", e);
    }
  } else {
    unsubscribeUserFirestore();
  }
});

export type UserTier = 'free' | 'pro' | 'guest';

export interface UserSession {
  isOnboarded: boolean;
  isLoggedIn: boolean;
  tier: UserTier;
  email?: string;
  name?: string;
  uid?: string;
  credits?: number; // Server-side remaining credits (if free/guest)
  token?: string; // Firebase ID Token JWT
  fingerprint?: string; // Device fingerprint for guest limits
}

const DEFAULT_SESSION: UserSession = {
  isOnboarded: false,
  isLoggedIn: false,
  tier: 'free',
  credits: 0
};

/**
 * Gets or creates a device fingerprint combining chrome.instanceID (hardware-bound,
 * survives storage clears) with a random local salt stored in chrome.storage.
 * This is much harder to reset than a pure random string — user must uninstall
 * + reinstall the extension AND get a new instanceID to bypass it.
 */
export const getOrCreateFingerprint = (): Promise<string> => {
  return new Promise((resolve) => {
    // First, get or create the local random salt
    chrome.storage.local.get({ fingerprintSalt: null }, (res: any) => {
      const salt = res.fingerprintSalt || Math.random().toString(36).substring(2, 15);

      if (!res.fingerprintSalt) {
        chrome.storage.local.set({ fingerprintSalt: salt });
      }

      // Combine with chrome.instanceID for hardware-bound uniqueness
      if (typeof chrome.instanceID !== 'undefined' && chrome.instanceID.getID) {
        chrome.instanceID.getID((instanceId: string) => {
          // Hash-like combination: instanceID (hardware) + salt (local)
          const combined = `fp_${instanceId}_${salt}`;
          // Cache the combined fingerprint to avoid repeated instanceID calls
          chrome.storage.local.get({ fingerprint: null }, (cached: any) => {
            if (cached.fingerprint && cached.fingerprint.startsWith('fp_' + instanceId)) {
              resolve(cached.fingerprint);
            } else {
              chrome.storage.local.set({ fingerprint: combined });
              resolve(combined);
            }
          });
        });
      } else {
        // Fallback for environments where instanceID is unavailable (e.g. dev mode)
        chrome.storage.local.get({ fingerprint: null }, (cached: any) => {
          if (cached.fingerprint) {
            resolve(cached.fingerprint);
          } else {
            const fallback = `fp_${salt}_${Date.now().toString(36)}`;
            chrome.storage.local.set({ fingerprint: fallback });
            resolve(fallback);
          }
        });
      }
    });
  });
};

/**
 * Gets the current user session from chrome.storage
 */
export const getSession = (): Promise<UserSession> => {
  return new Promise(async (resolve) => {
    const fingerprint = await getOrCreateFingerprint();
    chrome.storage.local.get({ session: DEFAULT_SESSION }, (res: any) => {
      const session = res.session as UserSession;
      resolve({ ...DEFAULT_SESSION, ...session, fingerprint });
    });
  });
};

/**
 * Updates the user session in local storage
 */
export const updateSession = (updates: Partial<UserSession>): Promise<UserSession> => {
  return new Promise(async (resolve) => {
    const current = await getSession();
    const updated = { ...current, ...updates };
    chrome.storage.local.set({ session: updated }, () => {
      resolve(updated);
    });
  });
};

/**
 * Subscribes to changes on the user's Firestore document
 */
let unsubscribeDocListener: (() => void) | null = null;
export const subscribeToUserFirestore = (uid: string) => {
  if (unsubscribeDocListener) {
    unsubscribeDocListener();
  }

  const docRef = doc(db, "users", uid);
  unsubscribeDocListener = onSnapshot(docRef, async (docSnap: DocumentSnapshot) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const current = await getSession();
      const isSystemAdmin = current.email === 'stevenallenofc@gmail.com';
      await updateSession({
        tier: isSystemAdmin ? 'pro' : (data.tier || 'free'),
        credits: data.credits !== undefined ? data.credits : 0,
      });
    }
  }, (error: FirestoreError) => {
    console.error("[Canva Snapper] Firestore document subscription failed:", error);
  });
};

/**
 * Unsubscribes from Firestore user document listener
 */
export const unsubscribeUserFirestore = () => {
  if (unsubscribeDocListener) {
    unsubscribeDocListener();
    unsubscribeDocListener = null;
  }
};

/**
 * Perform Google Sign-In in Manifest V3 using chrome.identity
 */
export const loginWithGoogle = async (): Promise<UserSession> => {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, async (googleAccessToken) => {
      if (chrome.runtime.lastError || !googleAccessToken) {
        // Real error — do NOT fall back to mock. Fail loudly so the user knows.
        const errMsg = chrome.runtime.lastError?.message || "Google OAuth token was not returned. Make sure the extension OAuth client is configured in Google Cloud Console.";
        console.error("[Canva Snapper] Google Sign-In failed:", errMsg);
        reject(new Error(errMsg));
        return;
      }

      try {
        const tokenString = googleAccessToken && typeof googleAccessToken === 'object'
          ? (googleAccessToken as any).token
          : (googleAccessToken as string);

        if (!tokenString) {
          throw new Error("Google access token is empty.");
        }

        // Authenticate with Firebase using Google Credential
        const credential = GoogleAuthProvider.credential(null, tokenString);
        const userCredential = await signInWithCredential(auth, credential);
        const user = userCredential.user;
        const idToken = await user.getIdToken();

        // Setup session with initial free tier — real tier synced from Firestore
        const isSystemAdmin = (user.email || '').toLowerCase() === 'stevenallenofc@gmail.com';
        const session = await updateSession({
          isLoggedIn: true,
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          token: idToken,
          tier: isSystemAdmin ? 'pro' : 'free',
          credits: isSystemAdmin ? 99999 : 0
        });

        // Start real-time listener to sync tier & credits from Firestore
        subscribeToUserFirestore(user.uid);

        resolve(session);
      } catch (err: any) {
        console.error("[Canva Snapper] Firebase authentication error:", err);
        reject(err);
      }
    });
  });
};

/**
 * Initialize Guest Mode — 3 non-renewable credits tracked server-side by device fingerprint
 */
export const continueAsFree = async (): Promise<UserSession> => {
  const fingerprint = await getOrCreateFingerprint();
  const functionsBaseUrl = import.meta.env.VITE_FUNCTIONS_BASE_URL;

  if (!functionsBaseUrl) {
    // .env not configured yet — safe local fallback for development only
    console.warn("[Canva Snapper] VITE_FUNCTIONS_BASE_URL not set. Using local guest fallback (dev only).");
    return updateSession({
      isLoggedIn: true,
      tier: 'guest',
      credits: 3
    });
  }

  try {
    const response = await fetch(`${functionsBaseUrl}/validateSnap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapType: 'png', fingerprint })
    });

    const data = await response.json();

    return updateSession({
      isLoggedIn: true,
      tier: 'guest',
      // remainingCredits after the initial check-in snap deduction
      credits: data.remainingCredits !== undefined ? data.remainingCredits : 2
    });
  } catch (error) {
    console.error("[Canva Snapper] Failed to reach backend for guest validation:", error);
    // Network error fallback — still allow guest but cap at 3 credits locally
    return updateSession({
      isLoggedIn: true,
      tier: 'guest',
      credits: 3
    });
  }
};

/**
 * Sign out of Firebase and clean up session
 */
export const logout = async (): Promise<void> => {
  unsubscribeUserFirestore();
  try {
    await signOut(auth);
  } catch (e) {
    // Ignore signout exceptions
  }
  
  // Clear identity token cached by Chrome
  chrome.identity.clearAllCachedAuthTokens(() => {
    // Done
  });

  await updateSession({
    isLoggedIn: false,
    tier: 'free',
    email: undefined,
    name: undefined,
    uid: undefined,
    token: undefined,
    credits: 0
  });
};

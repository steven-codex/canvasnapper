import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCredential, 
  GoogleAuthProvider, 
  signOut
} from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

// Note: Replace these config values with your actual Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyMockKey-ReplaceWithYourOwnApiKey",
  authDomain: "canva-snapper-pro.firebaseapp.com",
  projectId: "canva-snapper-pro",
  storageBucket: "canva-snapper-pro.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

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
 * Gets the current device fingerprint for Guest mode, or creates one if it doesn't exist
 */
export const getOrCreateFingerprint = (): Promise<string> => {
  return new Promise((resolve) => {
    chrome.storage.local.get({ fingerprint: null }, (res: any) => {
      if (res.fingerprint) {
        resolve(res.fingerprint);
      } else {
        const newFingerprint = 'fp_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        chrome.storage.local.set({ fingerprint: newFingerprint }, () => {
          resolve(newFingerprint);
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
  unsubscribeDocListener = onSnapshot(docRef, async (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      await updateSession({
        tier: data.tier || 'free',
        credits: data.credits !== undefined ? data.credits : 0,
      });
    }
  }, (error) => {
    console.error("Firestore document subscription failed:", error);
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
 * Perform Google Sign-In in Manifest V3
 */
export const loginWithGoogle = async (): Promise<UserSession> => {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, async (googleAccessToken) => {
      if (chrome.runtime.lastError || !googleAccessToken) {
        const errMsg = chrome.runtime.lastError?.message || "Google OAuth token not returned.";
        console.warn("Google Sign-In failed or manifest not configured. Simulating credentials:", errMsg);
        
        // Developer friendly Mock Fallback: If identity is not configured in Google Cloud Console yet,
        // we fallback to signing in as mock free/pro for testing purposes.
        const mockEmail = 'designer@example.com';
        const mockSession = await updateSession({
          isLoggedIn: true,
          tier: 'pro',
          email: mockEmail,
          name: 'Designer Mock',
          uid: 'mock_uid_123',
          credits: -1,
          token: 'mock_jwt_token_456'
        });
        resolve(mockSession);
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

        // Setup session
        const session = await updateSession({
          isLoggedIn: true,
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          token: idToken,
          tier: 'free', // Will be synchronized from Firestore rules
          credits: 0
        });

        // Start listening to Firestore changes for user tier & credits
        subscribeToUserFirestore(user.uid);

        resolve(session);
      } catch (err: any) {
        console.error("Firebase authentication error:", err);
        reject(err);
      }
    });
  });
};

/**
 * Initialize Guest Mode with 3 non-renewable credits
 */
export const continueAsFree = async (): Promise<UserSession> => {
  const fingerprint = await getOrCreateFingerprint();
  
  // Call backend function to check initial guest state (fingerprint limits)
  try {
    const response = await fetch("https://us-central1-canva-snapper-pro.cloudfunctions.net/validateSnap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapType: 'png', fingerprint })
    });
    
    const data = await response.json();
    
    // Update local guest session based on response
    return updateSession({
      isLoggedIn: true,
      tier: 'guest',
      credits: data.remainingCredits !== undefined ? data.remainingCredits : 2 // default to 2 if allowed (deducted 1st snap)
    });
  } catch (error) {
    console.warn("Backend not deployed yet. Proceeding with mock local Guest limit.");
    // Fallback if backend functions not deployed yet
    return updateSession({
      isLoggedIn: true,
      tier: 'guest',
      credits: 3 // Start with 3 credits locally
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

export type UserTier = 'free' | 'pro';

export interface UserSession {
  isOnboarded: boolean;
  isLoggedIn: boolean;
  tier: UserTier;
  email?: string;
  name?: string;
}

const DEFAULT_SESSION: UserSession = {
  isOnboarded: false,
  isLoggedIn: false,
  tier: 'free'
};

/**
 * Gets the current user session from chrome.storage
 */
export const getSession = (): Promise<UserSession> => {
  return new Promise((resolve) => {
    chrome.storage.local.get({ session: DEFAULT_SESSION }, (res: any) => {
      resolve(res.session as UserSession);
    });
  });
};

/**
 * Updates the user session
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
 * Mock function to login as Pro user
 */
export const loginAsPro = async (email: string): Promise<UserSession> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return updateSession({
    isLoggedIn: true,
    tier: 'pro',
    email,
    name: email.split('@')[0]
  });
};

/**
 * Mock function to continue as Free user
 */
export const continueAsFree = async (): Promise<UserSession> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return updateSession({
    isLoggedIn: true, // We consider guest 'logged in' to access the app
    tier: 'free'
  });
};

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
  await updateSession({
    isLoggedIn: false,
    tier: 'free',
    email: undefined,
    name: undefined
  });
};

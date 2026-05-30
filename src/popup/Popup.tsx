import React, { useEffect, useState } from 'react';
import { type UserSession, getSession } from '../lib/auth';
import { Onboarding } from './views/Onboarding';
import { Auth } from './views/Auth';
import { MainApp } from './views/MainApp';
import { Sparkles } from 'lucide-react';

const Popup: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    const s = await getSession();
    setSession(s);
    setLoading(false);
  };

  useEffect(() => {
    loadSession();

    // Listen for cross-view session updates
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.session) {
        setSession(changes.session.newValue as UserSession);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-[var(--color-bg)]">
        <div className="animate-pulse">
          <Sparkles className="w-8 h-8 text-[var(--color-accent-200)]" />
        </div>
      </div>
    );
  }

  if (!session?.isOnboarded) {
    return <Onboarding onComplete={loadSession} />;
  }

  if (!session?.isLoggedIn) {
    return <Auth onSuccess={loadSession} />;
  }

  return <MainApp />;
};

export default Popup;

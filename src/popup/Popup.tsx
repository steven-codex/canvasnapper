import React, { useEffect, useState } from 'react';
import { type UserSession, getSession } from '../lib/auth';
import { Onboarding } from './views/Onboarding';
import { Auth } from './views/Auth';
import { MainApp } from './views/MainApp';
import { Pricing } from './views/Pricing';
import { Sparkles } from 'lucide-react';

const Popup: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'main' | 'pricing'>('main');

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
      <div className="w-full h-[500px] flex items-center justify-center bg-[#fcfbfa]">
        <div className="animate-pulse">
          <Sparkles className="w-8 h-8 text-[#7d2ae7]" />
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

  if (currentView === 'pricing') {
    return <Pricing onBack={() => setCurrentView('main')} />;
  }

  return <MainApp onNavigateToPricing={() => setCurrentView('pricing')} />;
};

export default Popup;

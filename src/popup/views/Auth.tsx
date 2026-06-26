import React, { useState } from 'react';
import { Sparkles, ArrowRight, User } from 'lucide-react';
import { loginWithGoogle, continueAsFree } from '../../lib/auth';

interface AuthProps {
  onSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState<'pro' | 'free' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading('pro');
    setError(null);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(null);
    }
  };

  const handleGuest = async () => {
    setLoading('free');
    setError(null);
    try {
      await continueAsFree();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Guest registration failed.');
      setLoading(null);
    }
  };

  return (
    <div className="relative w-full h-[500px] flex flex-col p-6 font-sans bg-[var(--color-bg)]">
      <div className="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-[var(--color-border)] shadow-sm mb-6 mx-auto">
          <Sparkles className="w-6 h-6 text-[var(--color-accent)]" />
        </div>
        
        <h1 className="text-[22px] font-semibold text-center text-[var(--color-text)] mb-2 tracking-tight">
          Welcome to Snapper
        </h1>
        <p className="text-[13px] text-center text-[var(--color-text-muted)] mb-4 leading-relaxed">
          Create an account to unlock unlimited SVG vector exports, cloud sync, and credits.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-500 rounded-xl text-[12px] font-medium text-center leading-snug">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleLogin}
            disabled={loading !== null}
            className="w-full flex items-center justify-between p-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent-600)] text-white rounded-2xl transition-all shadow-[0_8px_16px_-6px_rgba(224,70,92,0.4)] disabled:opacity-70 cursor-pointer"
          >
            <span className="flex items-center gap-2 font-semibold">
              <User className="w-5 h-5" />
              {loading === 'pro' ? 'Logging in...' : 'Sign In with Google'}
            </span>
            {loading === 'pro' ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={handleGuest}
            disabled={loading !== null}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-[var(--color-neutral-25)] border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl transition-all shadow-sm disabled:opacity-70 cursor-pointer"
          >
            <span className="font-semibold text-[14px]">
              {loading === 'free' ? 'Continuing...' : 'Continue as Guest'}
            </span>
            <span className="text-[10px] font-bold text-[var(--color-text-muted)] bg-[var(--color-neutral-50)] px-2.5 py-1 rounded-full border border-[var(--color-border)]">
              3 Credits
            </span>
          </button>
        </div>

        <p className="text-[11px] text-center text-[var(--color-neutral-400)] mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

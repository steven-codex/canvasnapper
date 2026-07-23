import React, { useState } from 'react';
import { ArrowRight, User } from 'lucide-react';
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
    <div className="relative w-full h-[500px] flex flex-col p-6 font-sans bg-white">
      <div className="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full">
        {/* Brand Icon */}
        <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#e8ecef] shadow-sm mb-6 mx-auto">
          <img 
            src={chrome.runtime?.getURL ? chrome.runtime.getURL('icon128.png') : '/icon128.png'} 
            className="w-full h-full object-cover" 
            alt="Logo"
          />
        </div>
        
        {/* Headings */}
        <h1 className="text-[22px] font-bold text-center text-[#0d1216] mb-2 tracking-tight">
          Welcome to Snapper
        </h1>
        <p className="text-[13px] text-center text-[#6f767e] mb-6 leading-relaxed">
          Create an account to get 10 free trial credits, cloud sync, and copy history.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-500 rounded-lg text-[12px] font-medium text-center leading-snug">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {/* Sign In Button */}
          <button
            onClick={handleLogin}
            disabled={loading !== null}
            className="w-full h-11 flex items-center justify-between px-4 bg-[#7d2ae7] hover:bg-[#6c20ce] text-white rounded-lg transition-all shadow-md shadow-purple-900/10 disabled:opacity-70 cursor-pointer"
          >
            <span className="flex items-center gap-2 font-bold text-[13px]">
              <User className="w-4.5 h-4.5" />
              {loading === 'pro' ? 'Logging in...' : 'Sign In with Google'}
            </span>
            {loading === 'pro' ? (
              <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4.5 h-4.5" />
            )}
          </button>

          {/* Guest Button */}
          <button
            onClick={handleGuest}
            disabled={loading !== null}
            className="w-full h-11 flex items-center justify-between px-4 bg-[#f4f5f6] hover:bg-[#e6e8ec] border border-[#e8ecef] text-[#7d2ae7] rounded-lg transition-all disabled:opacity-70 cursor-pointer"
          >
            <span className="font-bold text-[13px]">
              {loading === 'free' ? 'Continuing...' : 'Continue as Guest'}
            </span>
            <span className="text-[9px] font-extrabold text-[#7d2ae7] bg-white px-2 py-0.5 rounded border border-[#e8ecef]">
              3 TRIAL CREDITS
            </span>
          </button>
        </div>

        <p className="text-[10px] font-bold text-center text-[#6f767e]/60 mt-8 uppercase tracking-wider">
          By continuing, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
};

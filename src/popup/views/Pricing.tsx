import React, { useState } from 'react';
import { Sparkles, Zap, Star, ArrowLeft, Loader2, Shield, Lock, X } from 'lucide-react';
import { getSession, auth, loginWithGoogle } from '../../lib/auth';

interface PricingProps {
  onBack: () => void;
}

interface PlanOption {
  type: string;
  name: string;
  price: string;
  period: string;
  snaps: string;
  highlight?: boolean;
  badge?: string;
  icon: React.ReactNode;
  originalPrice?: string;
}

const PLANS: PlanOption[] = [
  {
    type: 'credits_s',
    name: 'Starter Pack',
    price: '$4.99',
    period: '/once',
    snaps: '25 snaps',
    icon: <Zap size={16} />,
  },
  {
    type: 'credits_m',
    name: 'Creator Pack',
    price: '$5.99',
    period: '/once',
    snaps: '75 snaps',
    highlight: true,
    badge: 'Popular',
    icon: <Star size={16} />,
    originalPrice: '$10.99',
  },
  {
    type: 'credits_l',
    name: 'Pro Pack',
    price: '$10.99',
    period: '/once',
    snaps: '200 snaps',
    icon: <Sparkles size={16} />,
    originalPrice: '$20.99',
  },
  {
    type: 'pro_monthly',
    name: 'Pro Monthly',
    price: '$8.99',
    period: '/mo',
    snaps: 'Unlimited snaps',
    badge: 'Earlybird',
    icon: <Sparkles size={16} />,
    originalPrice: '$15.99',
  },
  {
    type: 'pro_lifetime',
    name: 'Lifetime Pro',
    price: '$7.00',
    period: '/once',
    snaps: 'Unlimited snaps',
    highlight: true,
    badge: 'Promo',
    icon: <Sparkles size={16} />,
    originalPrice: '$29.99',
  },
];

export const Pricing: React.FC<PricingProps> = ({ onBack }) => {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // States for interactive login overlay
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleCheckout = async (type: string) => {
    setError(null);
    setLoadingType(type);

    try {
      const session = await getSession();
      let token = session?.token;
      
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken(true);
        } catch (tokenErr) {
          console.warn("Failed to force refresh Firebase token, using cache.", tokenErr);
        }
      }

      // If guest (no token), prompt the premium login modal
      if (!token) {
        setSelectedPlan(type);
        setShowLoginModal(true);
        setLoadingType(null);
        return;
      }

      const baseUrl = import.meta.env.VITE_FUNCTIONS_BASE_URL;
      const response = await fetch(`${baseUrl}/createCheckoutSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to create checkout session.');
      }

      chrome.tabs.create({ url: data.url });

    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoadingType(null);
    }
  };

  const handleLoginInModal = async () => {
    setLoginLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      setShowLoginModal(false);
      // Auto-resume checkout for the clicked plan
      if (selectedPlan) {
        handleCheckout(selectedPlan);
      }
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfbfa] text-[#0d1216] p-4 overflow-y-auto select-none font-mono">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 border-b-2 border-[#0d1216] pb-3">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0d1216] hover:bg-[#fafafa] bg-white border-2 border-[#0d1216] px-2.5 py-1 shadow-[2px_2px_0px_0px_#0d1216] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer uppercase"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <span className="text-xs font-black uppercase text-[#7d2ae7] tracking-wider">
          Canva Snapper Pricing
        </span>
      </div>

      <div className="text-center mb-4">
        <h2 className="text-lg font-black uppercase tracking-tight text-[#0d1216]">
          Choose Your Plan
        </h2>
        <p className="text-[10px] text-[#2b2f33] mt-0.5 font-bold">
          Instantly copy Canva elements with 0 wait time
        </p>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-[#E01E5A] text-white border-2 border-[#0d1216] text-[10px] font-bold uppercase shadow-[2px_2px_0px_0px_#000]">
          {error}
        </div>
      )}

      {/* Plan Cards */}
      <div className="space-y-3 flex-grow">
        {PLANS.map((plan) => (
          <div 
            key={plan.type}
            className={`p-3.5 border-2 border-[#0d1216] relative transition-all ${
              plan.highlight 
                ? 'bg-[#ffd100] shadow-[4px_4px_0px_0px_#0d1216]' 
                : 'bg-white shadow-[3px_3px_0px_0px_#0d1216]'
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-2.5 right-3 bg-[#7d2ae7] text-white text-[8px] font-black uppercase px-2 py-0.5 border border-[#0d1216] shadow-[1px_1px_0px_0px_#000]">
                {plan.badge}
              </span>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#7d2ae7] text-white border border-[#0d1216] rounded flex items-center justify-center">
                  {plan.icon}
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-[#0d1216]">{plan.name}</h3>
                  <p className="text-[9px] font-bold text-[#7d2ae7] uppercase">{plan.snaps}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-baseline gap-1 justify-end">
                  {plan.originalPrice && (
                    <span className="text-[9px] text-gray-500 line-through">{plan.originalPrice}</span>
                  )}
                  <span className="text-sm font-black text-[#0d1216]">{plan.price}</span>
                  <span className="text-[9px] text-gray-600">{plan.period}</span>
                </div>
                <button
                  onClick={() => handleCheckout(plan.type)}
                  disabled={loadingType === plan.type}
                  className={`mt-1 px-3 py-1 border-2 border-[#0d1216] text-[9px] font-black uppercase transition-all shadow-[1.5px_1.5px_0px_0px_#0d1216] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer ${
                    plan.highlight 
                      ? 'bg-[#7d2ae7] text-white hover:bg-[#6c20ce]' 
                      : 'bg-[#00c4cc] text-[#0d1216] hover:bg-[#00b3ba]'
                  }`}
                >
                  {loadingType === plan.type ? (
                    <Loader2 size={10} className="animate-spin inline" />
                  ) : (
                    'Get Access'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showLoginModal && (
        <div className="absolute inset-0 bg-[#0d1216]/50 backdrop-blur-sm z-50 flex items-end justify-center animate-[fadeIn_0.2s_ease-out_forwards]">
          <div className="w-full bg-white rounded-t-2xl border-t border-[#e8ecef] p-5 shadow-[0_-8px_32px_rgba(13,18,22,0.15)] flex flex-col items-center text-center transform animate-[slideUp_0.35s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]">
            
            {/* Header row with close button */}
            <div className="w-full flex justify-end -mt-1 -mr-1 mb-1">
              <button 
                onClick={() => { setShowLoginModal(false); setError(null); }}
                className="p-1 rounded-full text-[#6f767e] hover:text-[#0d1216] hover:bg-[#f4f5f6] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Glowing Icon Wrapper */}
            <div className="relative w-12 h-12 bg-[#f1e9fe] rounded-full flex items-center justify-center mb-3">
              <Lock className="w-5.5 h-5.5 text-[#7d2ae7]" />
              <Shield className="absolute -bottom-1 -right-1 w-4.5 h-4.5 text-[#3969e7] bg-white rounded-full p-0.5 shadow-sm" />
            </div>

            <h3 className="text-[14px] font-extrabold text-[#0d1216] tracking-tight uppercase">
              Sign In to Purchase
            </h3>
            
            <p className="text-[10.5px] text-[#6f767e] mt-1.5 max-w-[230px] leading-relaxed">
              Create an account or sign in with Google to secure your snaps and complete your purchase.
            </p>

            {/* Login Error banner inside modal */}
            {error && (
              <div className="w-full mt-3 p-2 bg-red-50 border border-red-100 text-red-500 rounded-lg text-[9.5px] font-medium leading-snug">
                {error}
              </div>
            )}

            {/* Google Sign In CTA */}
            <button
              onClick={handleLoginInModal}
              disabled={loginLoading}
              className="w-full h-10 mt-4.5 flex items-center justify-center gap-2 bg-[#7d2ae7] hover:bg-[#6c20ce] text-white rounded-lg text-[11px] font-bold shadow-md shadow-purple-900/10 active:scale-[0.96] transition-all disabled:opacity-70 cursor-pointer"
            >
              {loginLoading ? (
                <>
                  <Loader2 size={13} className="spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <button 
              onClick={() => { setShowLoginModal(false); setError(null); }}
              className="mt-3 text-[9.5px] font-bold text-[#6f767e]/60 hover:text-[#0d1216] uppercase tracking-wider transition-colors cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

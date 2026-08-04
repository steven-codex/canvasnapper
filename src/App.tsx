import React, { useState } from 'react';
import { Zap, Star, Copy, ArrowUpRight, Download, Layers } from 'lucide-react';

// Custom Chrome SVG Icon to avoid version mismatch in lucide-react
const ChromeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="21.17" y1="8" x2="12" y2="8" />
    <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
    <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
  </svg>
);

interface PlanOption {
  type: string;
  name: string;
  price: string;
  period: string;
  snaps: string;
  bgColor: string;
  btnBg: string;
  btnText: string;
  badgeBg: string;
  icon: string;
  highlight?: boolean;
  badge?: string;
  originalPrice?: string;
  features: string[];
}

const PLANS: PlanOption[] = [
  {
    type: 'credits_s',
    name: 'Starter Pack',
    price: '$4.99',
    period: '/once',
    snaps: '25 snaps',
    bgColor: 'bg-white',
    btnBg: 'bg-[#00c4cc]',
    btnText: 'text-[#0d1216]',
    badgeBg: 'bg-[#00c4cc]',
    icon: '/starter_icon.png',
    features: [
      '25 High-Res 4K PNG Snaps',
      'Direct Paste to ChatGPT & Gemini',
      '100% Alpha Transparent Background',
      'Life-time History Log (Last 5 Snaps)',
      'Standard Email Support'
    ],
  },
  {
    type: 'credits_m',
    name: 'Creator Pack',
    price: '$5.99',
    period: '/once',
    snaps: '75 snaps',
    bgColor: 'bg-[#ffd100]',
    btnBg: 'bg-[#7d2ae7]',
    btnText: 'text-white',
    badgeBg: 'bg-[#E01E5A]',
    icon: '/creator_icon.png',
    highlight: true,
    badge: 'Popular Choice',
    originalPrice: '$10.99',
    features: [
      '75 High-Res 4K PNG Snaps',
      'Direct Paste to ChatGPT & Gemini',
      '100% Alpha Transparent Background',
      'Auto-Download (PNG/WebP/JPEG)',
      'Priority Server Rendering',
      'Life-time History Log Access'
    ],
  },
  {
    type: 'pro_lifetime',
    name: 'Lifetime Pro',
    price: '$7.00',
    period: '/once',
    snaps: 'Unlimited snaps',
    bgColor: 'bg-[#00c4cc]',
    btnBg: 'bg-[#0d1216]',
    btnText: 'text-white',
    badgeBg: 'bg-[#7d2ae7]',
    icon: '/lifetime_icon.png',
    highlight: true,
    badge: 'Best Value',
    originalPrice: '$29.99',
    features: [
      'Unlimited Snaps (Forever ⚡)',
      'Instant Copy-Paste to ChatGPT & Gemini',
      'Auto-Download Format Customizer',
      'Automatic Sensitive Key Redaction',
      'Priority Support & Future Features',
      'No Subscriptions (Pay Once, Own Forever)'
    ],
  },
];

export default function App() {
  const [extensionActive, setExtensionActive] = useState<boolean>(true);
  const [decorations, setDecorations] = useState<{ id: number; x: number; y: number; type: string }[]>([]);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  const toggleExtension = () => {
    const nextState = !extensionActive;
    setExtensionActive(nextState);
    triggerToast(nextState ? '⚡ Canva Snapper ENABLED!' : '⏸️ Canva Snapper DISABLED');
  };

  const triggerToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2500);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDecorations((prev) => [
      ...prev,
      { id: Date.now(), x, y, type: 'callout' },
    ]);
    triggerToast('Added CALLOUT marker');
  };

  const resetCanvas = () => {
    setDecorations([]);
    triggerToast('Canvas cleared');
  };

  return (
    <div className="bg-[#fcfbfa] text-[#0d1216] font-sans antialiased selection:bg-[#00c4cc] selection:text-[#0d1216] min-h-screen relative overflow-x-hidden">
      {/* Blueprint Grid Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0d1216 1px, transparent 1px),
            linear-gradient(to bottom, #0d1216 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#fcfbfa]/90 backdrop-blur-md border-b-2 border-[#0d1216] px-6 lg:px-12 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[#0d1216] shadow-[3px_3px_0px_0px_#0d1216] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none transition-all duration-150 bg-white p-0.5">
              <img 
                src="/ChatGPT Image Jul 14, 2026, 12_33_24 AM.png" 
                alt="Canva Snapper Logo" 
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <span className="font-hand text-3xl font-bold tracking-normal text-[#7d2ae7] drop-shadow-xs">
              Canva Snapper
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold">
            <a href="#demo" className="px-4 py-2 hover:bg-[#7d2ae7]/10 border border-transparent hover:border-[#0d1216] transition-all duration-150 rounded">Live Demo</a>
            <a href="#features" className="px-4 py-2 hover:bg-[#00c4cc]/10 border border-transparent hover:border-[#0d1216] transition-all duration-150 rounded">Features</a>
            <a href="#pricing" className="px-4 py-2 hover:bg-[#ffd100]/10 border border-transparent hover:border-[#0d1216] transition-all duration-150 rounded">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-[#0d1216] text-[#fcfbfa] font-mono text-[10px] uppercase rounded-full font-bold border border-white/20">
              <span className="w-2 h-2 rounded-full bg-[#00c4cc] animate-ping"></span>
              v2.4 Live
            </span>
            <a 
              href="#pricing" 
              className="px-4 py-2 bg-[#7d2ae7] text-white border-2 border-[#0d1216] font-mono text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_#0d1216] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-150"
            >
              Get Extension
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Floating Animated Badges & Hand-drawn Doodles */}
        <div className="absolute top-10 left-4 lg:left-12 bg-[#ffd100] text-[#0d1216] border-2 border-[#0d1216] px-3.5 py-2 font-mono text-xs font-black uppercase shadow-[4px_4px_0px_0px_#0d1216] -rotate-6 animate-float-slow hidden md:block">
          ⚡ 100% PNG Alpha Channel
        </div>

        {/* Floating Eyes Asset (Animate pulse/float) */}
        <div className="absolute top-16 left-1/4 w-16 h-16 pointer-events-none animate-float-reverse hidden lg:block">
          <img 
            src="/eyes.png" 
            alt="Eyes Sticker" 
            className="w-full h-full object-contain filter drop-shadow-[4px_4px_0px_rgba(0,0,0,0.15)]"
          />
        </div>

        {/* Hand-written Doodle Top Left with Typing Effect & Ultra-Polished Organic Doodle Arrow */}
        <div className="absolute top-36 left-10 hidden lg:flex flex-col items-center rotate-[-12deg] pointer-events-none">
          <span className="font-hand text-4xl font-bold text-[#E01E5A] drop-shadow animate-typing">
            No more ZIP downloads!
          </span>
          {/* Organic Hand-drawn Swirly Arrow */}
          <svg className="w-24 h-24 text-[#E01E5A] -mt-1 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,0.15)] animate-wiggle" viewBox="0 0 120 120" fill="none">
            {/* Main Swirly Path */}
            <path 
              d="M20,15 C45,10 75,25 60,55 C48,78 25,65 40,45 C55,28 85,55 95,85" 
              stroke="currentColor" 
              strokeWidth="4.5" 
              strokeLinecap="round" 
              className="animate-draw-arrow"
            />
            {/* Arrowhead Pointer */}
            <path 
              d="M78,80 L96,88 L88,70" 
              stroke="currentColor" 
              strokeWidth="4.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            {/* Playful Accent Sparkle */}
            <circle cx="25" cy="20" r="3" fill="currentColor" />
          </svg>
        </div>

        {/* Floating Sticker Top Right */}
        <div className="absolute top-20 right-6 lg:right-16 bg-[#00c4cc] text-[#0d1216] border-2 border-[#0d1216] px-3 py-1.5 font-mono text-xs font-black uppercase shadow-[4px_4px_0px_0px_#0d1216] rotate-6 animate-float-reverse hidden md:block">
          🎯 Auto-Redact Sensitive Keys
        </div>

        {/* Floating Flower Asset (Slow Spin & Float) */}
        <div className="absolute bottom-28 right-1/4 w-20 h-20 pointer-events-none animate-float-slow hidden lg:block">
          <img 
            src="/flower.png" 
            alt="Flower Sticker" 
            className="w-full h-full object-contain animate-[spin_12s_linear_infinite] filter drop-shadow-[5px_5px_0px_rgba(0,0,0,0.15)]"
          />
        </div>



        <div className="text-center relative z-10">
          <div 
            onClick={() => triggerToast("⚡ Supercharged Speed Activated!")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#ffd100] border-2 border-[#0d1216] font-mono text-xs font-black uppercase shadow-[4px_4px_0px_0px_#0d1216] -rotate-2 mb-8 hover:rotate-0 transition-all duration-200 cursor-pointer group hover:scale-105 active:scale-95"
          >
            <Zap size={14} className="text-[#0d1216] group-hover:rotate-45 transition-transform" />
            <span>Copy Canva assets in &lt; 15 milliseconds</span>
          </div>

          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-[#0d1216] leading-[0.92] mb-6">
            Export Canva Elements <br className="hidden sm:inline" />
            <span className="relative inline-block my-2 px-4 py-2 bg-[#00c4cc] text-[#0d1216] border-2 border-[#0d1216] shadow-[6px_6px_0px_0px_#0d1216] rotate-1 hover:-rotate-2 transition-all cursor-pointer hover:scale-105 active:scale-95">
              Instantly to Clipboard
            </span>
          </h1>

          <p className="max-w-2xl mx-auto font-sans text-lg md:text-xl font-medium text-[#2b2f33] leading-relaxed mb-10 mt-6">
            Bypass Canva's slow export menus. Hover over any element & press{' '}
            <kbd 
              onClick={() => triggerToast('🎉 Pro Tip: Press Alt + C on Canva to instant snap!')}
              className="bg-white border-2 border-[#0d1216] rounded-lg px-3 py-1 font-mono text-sm font-black text-[#7d2ae7] shadow-[3px_3px_0px_0px_#0d1216] cursor-pointer hover:bg-[#ffd100] hover:text-[#0d1216] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all inline-block hover:scale-110"
            >
              Alt + C
            </kbd>{' '}
            to copy it as a crystal-clear, transparent PNG.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a 
              href="#pricing" 
              className="w-full sm:w-auto px-8 py-4 bg-[#7d2ae7] text-white border-2 border-[#0d1216] font-mono text-sm font-bold uppercase tracking-wider shadow-[6px_6px_0px_0px_#0d1216] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-150 flex items-center justify-center gap-3 active:scale-95 hover:bg-[#6c20ce]"
            >
              <ChromeIcon className="w-[18px] h-[18px]" />
              Install Chrome Extension
            </a>
            
            <div className="relative w-full sm:w-auto">
              <a 
                href="#demo" 
                className="w-full sm:w-auto px-8 py-4 bg-white text-[#0d1216] border-2 border-[#0d1216] font-mono text-sm font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#0d1216] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-150 flex items-center justify-center gap-2 active:scale-95 hover:bg-[#ffd100] whitespace-nowrap"
              >
                Try Interactive Workbench ⚡
              </a>

              {/* Hand-written Doodle next to the button */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-6 hidden lg:flex flex-col items-start rotate-[2deg] pointer-events-none z-20 min-w-[280px]">
                <span className="font-hand text-3xl font-bold text-[#7d2ae7] drop-shadow-sm animate-typing-purple pr-2">
                  Instant Alt + C Magic ✨
                </span>
                {/* Clean Curved Doodle Arrow pointing left-down towards the button */}
                <svg className="w-12 h-12 text-[#7d2ae7] -mt-1 -ml-4 animate-wiggle" viewBox="0 0 100 100" fill="none">
                  {/* Curve pointing left-down */}
                  <path 
                    d="M80,20 C50,20 30,40 20,60" 
                    stroke="currentColor" 
                    strokeWidth="5.5" 
                    strokeLinecap="round" 
                  />
                  {/* Arrowhead pointing left */}
                  <path 
                    d="M30,70 L15,60 L25,45" 
                    stroke="currentColor" 
                    strokeWidth="5.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-3 bg-white border-2 border-[#0d1216] px-5 py-3 font-mono text-xs shadow-[5px_5px_0px_0px_#0d1216]">
            <div className="flex text-[#ffd100] gap-1 animate-pulse">
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
            </div>
            <span className="font-extrabold border-l-2 border-[#0d1216] pl-3 text-[#0d1216]">4.9/5 Rating</span>
            <span className="text-[#6f767e] hidden sm:inline">• Loved by 5,000+ UI/UX Designers</span>
          </div>
        </div>
      </section>

      {/* Interactive Workbench & Chrome Extension Sneak Peak Section */}
      <section id="demo" className="py-20 px-6 lg:px-12 bg-[#7d2ae7]/10 text-[#0d1216] border-y-4 border-[#0d1216] relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 pb-6 border-b-2 border-[#0d1216]/10 gap-4">
            <div>
              <span className="font-mono text-xs text-[#7d2ae7] uppercase tracking-widest font-extrabold">[ Live Workspace Playground ]</span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-2 text-[#0d1216]">Interactive Extension Simulator</h2>
            </div>
            <p className="font-mono text-xs text-[#6f767e] max-w-sm font-bold">
              Test out the main features of Canva Snapper instantly. Flip the toggle switch, change formats, or click the collage elements below to trigger real-time actions!
            </p>
          </div>

          {/* Extension Sneak Peak UI Showcase Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-center">
            
            {/* Interactive Sneak Peak Extension Window Card (350px width feel) */}
            <div className="lg:col-span-5 bg-[#fcfbfa] text-[#0d1216] border-4 border-[#0d1216] rounded-2xl p-5 shadow-[10px_10px_0px_0px_#00c4cc] relative font-mono select-none">
              <div className="absolute -top-3.5 left-4 bg-[#7d2ae7] text-white text-[9px] font-black uppercase px-2.5 py-0.5 border border-[#0d1216] rounded-full shadow-[2px_2px_0px_0px_#0d1216]">
                ⚡ CANVA SNAPPER POPUP
              </div>

              {/* Popup Header */}
              <div className="flex items-center justify-between pb-3.5 border-b-2 border-[#0d1216] mb-3.5">
                <div className="flex items-center gap-2.5">
                  <img src="/ChatGPT Image Jul 14, 2026, 12_33_24 AM.png" className="w-8 h-8 object-contain rounded-lg border-2 border-[#0d1216]" alt="Logo" />
                  <div>
                    <span className="font-black text-sm uppercase block leading-none">Canva Snapper</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black border border-[#0d1216] inline-block mt-1 transition-all ${
                      extensionActive ? 'bg-[#00c4cc] text-[#0d1216]' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {extensionActive ? 'PRO ACTIVE' : 'PAUSED'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-[#0d1216]">
                    {extensionActive ? 'ON' : 'OFF'}
                  </span>
                  <div 
                    onClick={toggleExtension}
                    className={`w-11 h-6 border-2 border-[#0d1216] rounded-full relative cursor-pointer transition-all duration-300 shadow-[1.5px_1.5px_0px_0px_#0d1216] ${
                      extensionActive ? 'bg-[#00c4cc]' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`w-4 h-4 bg-white border-2 border-[#0d1216] rounded-full absolute top-0.5 transition-all duration-300 ${
                      extensionActive ? 'right-0.5 bg-white' : 'left-0.5 bg-gray-100'
                    }`} />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white border-2 border-[#0d1216] p-3 text-[10px] leading-relaxed mb-3 shadow-[2px_2px_0px_0px_#0d1216]">
                <span className="font-black uppercase block text-[#7d2ae7]">Shortcut Quick Guide:</span>
                Hover Canva element + press <span className="bg-[#ffd100] px-1 font-black border border-[#0d1216] rounded">Alt + C</span>
              </div>

              {/* Format selector sneak peak */}
              <div className="bg-white border-2 border-[#0d1216] p-2.5 flex items-center justify-between mb-3 shadow-[2px_2px_0px_0px_#0d1216]">
                <span className="text-[10px] font-black uppercase">Auto-Save:</span>
                <div className="flex gap-1 text-[9px] font-black">
                  <span className="px-2 py-0.5 bg-[#00c4cc] border border-[#0d1216] rounded shadow-[1px_1px_0px_0px_#0d1216]">PNG</span>
                  <span className="px-2 py-0.5 bg-gray-100 border border-[#0d1216] rounded text-gray-400">WEBP</span>
                  <span className="px-2 py-0.5 bg-gray-100 border border-[#0d1216] rounded text-gray-400">JPEG</span>
                </div>
              </div>

              {/* Log preview */}
              <div className="border-2 border-dashed border-[#0d1216] bg-white p-3 rounded-xl text-center text-[10px] font-bold text-[#7d2ae7]">
                ✨ Ready to snap! 5 History slots available.
              </div>
            </div>

            {/* Explanatory Callout */}
            <div className="lg:col-span-7 space-y-4">
              <span className="bg-[#ffd100] text-[#0d1216] border-2 border-[#0d1216] px-3 py-1 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_0px_#0d1216]">
                Zero Friction Workflow
              </span>
              <h3 className="text-2xl md:text-4xl font-black uppercase text-[#0d1216] leading-tight">
                Copy assets without manual export menus
              </h3>
              <p className="font-sans text-sm text-[#2b2f33] font-medium leading-relaxed">
                Canva Snapper works instantly in the background of your Canva workspace tab. Simply hover over any design asset (illustrations, text, shapes, or icons) and press <kbd className="bg-white border border-[#0d1216] text-[#7d2ae7] px-1.5 py-0.5 font-mono text-xs font-black rounded shadow-[1px_1px_0px_0px_#0d1216]">Alt + C</kbd> to copy it as a transparent 4K PNG. Paste it directly (<kbd className="bg-white border border-[#0d1216] text-[#7d2ae7] px-1.5 py-0.5 font-mono text-xs font-black rounded shadow-[1px_1px_0px_0px_#0d1216]">Ctrl + V</kbd>) into ChatGPT, Gemini, or Figma instantly!
              </p>
            </div>
          </div>

          {/* Sleek Y2K / Retro Artboard UI Showcase */}
          <div className="bg-white border-4 border-[#0d1216] rounded-2xl overflow-hidden shadow-[12px_12px_0px_0px_#7d2ae7] relative font-sans">
            {/* Top Minimalist Editor Header */}
            <div className="bg-[#f4f5f6] border-b-2 border-[#0d1216] px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#E01E5A] inline-block border border-[#0d1216]"></span>
                  <span className="w-3 h-3 rounded-full bg-[#ECB22E] inline-block border border-[#0d1216]"></span>
                  <span className="w-3 h-3 rounded-full bg-[#2EB67D] inline-block border border-[#0d1216]"></span>
                </div>
                <span className="font-mono text-xs text-[#0d1216] font-extrabold ml-2 flex items-center gap-2">
                  <span>snapper_y2k_collage.png</span>
                  <span className="text-[9px] bg-[#00c4cc] text-[#0d1216] border border-[#0d1216] px-2 py-0.5 rounded font-black uppercase">100% Alpha PNG</span>
                </span>
              </div>

              {/* Editor Workspace Controls & Zoom Indicator */}
              <div className="flex items-center gap-4 font-mono text-xs text-[#0d1216]">
                <div className="flex items-center gap-2 bg-white border border-[#0d1216] px-2.5 py-1 rounded-lg shadow-[1.5px_1.5px_0px_0px_#0d1216]">
                  <span className="text-[#6f767e]">Zoom:</span>
                  <span className="text-[#7d2ae7] font-black">125%</span>
                </div>
                <button 
                  onClick={resetCanvas} 
                  className="px-3 py-1 bg-[#7d2ae7] hover:bg-[#6c20ce] text-white border-2 border-[#0d1216] rounded-lg text-[10px] uppercase font-bold transition-all cursor-pointer shadow-[2px_2px_0px_0px_#0d1216]"
                >
                  Clear Annotations
                </button>
              </div>
            </div>

            {/* Editor Workspace Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[540px]">
              
              {/* Left Toolbar & Layers Panel */}
              <div className="md:col-span-3 bg-[#f9fafb] border-r-2 border-[#0d1216] p-5 flex flex-col justify-between gap-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] uppercase text-[#6f767e] tracking-wider font-extrabold">
                      Canvas Elements
                    </span>
                    <span className="text-[9px] bg-[#00c4cc] text-[#0d1216] border border-[#0d1216] px-1.5 py-0.5 rounded font-mono font-bold">
                      4 ITEMS
                    </span>
                  </div>
                  
                  {/* Interactive List of Elements */}
                  <div className="space-y-2">
                    <button 
                      onClick={() => triggerToast('Selected Flower Smiley Element')} 
                      className="w-full text-left p-2.5 rounded-xl font-mono text-xs flex items-center justify-between border-2 border-[#0d1216] bg-[#ffd100] text-[#0d1216] font-black shadow-[3px_3px_0px_0px_#0d1216] transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-white p-0.5 border border-[#0d1216] flex items-center justify-center">
                          <img src="/flower.png" className="w-full h-full object-contain" alt="" />
                        </span>
                        <span>Flower Smiley</span>
                      </span>
                      <span className="text-[9px] bg-[#7d2ae7] text-white px-1.5 py-0.5 rounded font-mono">SELECTED</span>
                    </button>

                    <button 
                      onClick={() => triggerToast('Selected Orange Quotes Element')} 
                      className="w-full text-left p-2.5 rounded-xl font-mono text-xs flex items-center justify-between border border-[#0d1216] bg-white text-[#0d1216] hover:bg-[#fff9c4] transition-all cursor-pointer font-bold shadow-[1.5px_1.5px_0px_0px_#0d1216]"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[#ff6b00] font-black text-sm leading-none">“</span>
                        <span>Orange Quotes</span>
                      </span>
                      <span className="text-[9px] bg-[#f4f5f6] text-[#6f767e] border border-[#0d1216] px-1.5 py-0.5 rounded font-mono">TXT</span>
                    </button>

                    <button 
                      onClick={() => triggerToast('Selected Cassette Mix Element')} 
                      className="w-full text-left p-2.5 rounded-xl font-mono text-xs flex items-center justify-between border border-[#0d1216] bg-white text-[#0d1216] hover:bg-[#e0f7fa] transition-all cursor-pointer font-bold shadow-[1.5px_1.5px_0px_0px_#0d1216]"
                    >
                      <span className="flex items-center gap-2">
                        <span>📼</span>
                        <span>Cassette Mix</span>
                      </span>
                      <span className="text-[9px] bg-[#f4f5f6] text-[#6f767e] border border-[#0d1216] px-1.5 py-0.5 rounded font-mono">IMG</span>
                    </button>

                    <button 
                      onClick={() => triggerToast('Selected Googly Eyes Element')} 
                      className="w-full text-left p-2.5 rounded-xl font-mono text-xs flex items-center justify-between border border-[#0d1216] bg-white text-[#0d1216] hover:bg-[#f3e5f5] transition-all cursor-pointer font-bold shadow-[1.5px_1.5px_0px_0px_#0d1216]"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-white p-0.5 border border-[#0d1216] flex items-center justify-center">
                          <img src="/eyes.png" className="w-full h-full object-contain" alt="" />
                        </span>
                        <span>Googly Eyes</span>
                      </span>
                      <span className="text-[9px] bg-[#f4f5f6] text-[#6f767e] border border-[#0d1216] px-1.5 py-0.5 rounded font-mono">PNG</span>
                    </button>
                  </div>
                </div>

                {/* Layer Panel */}
                <div className="bg-white border-2 border-[#0d1216] rounded-xl p-3.5 space-y-2 shadow-[2px_2px_0px_0px_#0d1216]">
                  <span className="font-mono text-[9px] uppercase text-[#6f767e] tracking-wider block font-bold">Layers Stack</span>
                  <div className="space-y-1.5 text-[10px] font-mono">
                    <div className="flex items-center justify-between px-2 py-1 bg-[#ffd100] border border-[#0d1216] rounded text-[#0d1216] font-bold">
                      <span>🌸 Flower_Smiley.png</span>
                      <span className="text-[8px] bg-[#7d2ae7] text-white px-1 rounded">ACTIVE</span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 bg-[#f4f5f6] border border-[#0d1216] text-[#0d1216] rounded font-medium">
                      <span>💬 Orange_Quotes.png</span>
                      <span className="text-[8px] text-[#6f767e]">L2</span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 bg-[#f4f5f6] border border-[#0d1216] text-[#0d1216] rounded font-medium">
                      <span>📼 Cassette_Halftone.png</span>
                      <span className="text-[8px] text-[#6f767e]">L1</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Canvas Area: Clean White Artboard with Y2K Collage */}
              <div className="md:col-span-9 p-8 bg-[#f4f5f6] flex items-center justify-center relative select-none overflow-hidden">
                
                {/* Clean White Canvas Artboard */}
                <div 
                  onClick={handleCanvasClick}
                  className="w-full max-w-2xl bg-white border-4 border-[#0d1216] rounded-2xl p-8 shadow-[8px_8px_0px_0px_#0d1216] relative cursor-crosshair min-h-[420px] flex flex-col justify-between"
                >
                  
                  {/* Top Left: Flower Smiley Asset with Purple Selection Box & Contextual Toolbar */}
                  <div className="absolute top-6 left-6 z-20">
                    {/* Crisp Purple Selection Boundary Box */}
                    <div className="relative border-2 border-[#7d2ae7] p-2 rounded-lg bg-white shadow-lg group">
                      {/* Corner Transform Handles */}
                      <span className="w-2.5 h-2.5 bg-white border-2 border-[#7d2ae7] absolute -top-1.5 -left-1.5 rounded-xs" />
                      <span className="w-2.5 h-2.5 bg-white border-2 border-[#7d2ae7] absolute -top-1.5 -right-1.5 rounded-xs" />
                      <span className="w-2.5 h-2.5 bg-white border-2 border-[#7d2ae7] absolute -bottom-1.5 -left-1.5 rounded-xs" />
                      <span className="w-2.5 h-2.5 bg-white border-2 border-[#7d2ae7] absolute -bottom-1.5 -right-1.5 rounded-xs" />

                      <img 
                        src="/flower.png" 
                        alt="Top Left Flower Smiley" 
                        className="w-24 h-24 object-contain filter drop-shadow-[5px_5px_0px_#0d1216]"
                      />

                      {/* Floating Contextual Toolbar directly beneath it */}
                      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-[#0d1216] text-white border-2 border-[#0d1216] rounded-full px-3 py-1 flex items-center gap-2 shadow-[2px_2px_0px_0px_#0d1216] z-30 font-mono text-[9px]">
                        <span className="text-[#00c4cc] font-black">ALT + C</span>
                        <span className="w-px h-3 bg-white/30" />
                        <span className="text-[#ffd100] font-bold cursor-pointer hover:underline" onClick={() => triggerToast('Copied Flower Asset!')}>Copy PNG</span>
                        <span className="w-px h-3 bg-white/30" />
                        <span className="text-white/70">2400px</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Right: Oversized Vibrant Orange Quotation Mark */}
                  <div className="absolute top-6 right-8 text-[#ff6b00] font-black text-8xl leading-none select-none filter drop-shadow-[4px_4px_0px_#0d1216]">
                    “
                  </div>

                  {/* Center / Bottom Left: Detailed Halftone Cassette Tape Cutout */}
                  <div className="absolute bottom-8 left-8 bg-white text-[#0d1216] border-2 border-[#0d1216] rounded-xl p-4 shadow-[4px_4px_0px_0px_#0d1216] max-w-[200px]">
                    <div className="w-full h-12 border-2 border-[#0d1216] rounded bg-[#ffd100] flex items-center justify-around mb-2">
                      <div className="w-6 h-6 rounded-full border-2 border-dashed border-[#0d1216] animate-spin bg-white" />
                      <div className="w-6 h-6 rounded-full border-2 border-dashed border-[#0d1216] animate-spin bg-white" />
                    </div>
                    <div className="font-mono text-[9px] text-center uppercase tracking-widest text-[#7d2ae7] font-black">
                      📼 Y2K Cassette Mix
                    </div>
                  </div>

                  {/* Center / Bottom Right: Expressive Googly Eyes Outlined in Orange */}
                  <div className="absolute bottom-6 right-8 w-28 h-28">
                    <img 
                      src="/eyes.png" 
                      alt="Googly Eyes" 
                      className="w-full h-full object-contain filter drop-shadow-[4px_4px_0px_#ff6b00]"
                    />
                  </div>

                  {/* Rendered Annotations On Click */}
                  {decorations.map((d) => (
                    <div 
                      key={d.id}
                      className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-40"
                      style={{ left: d.x, top: d.y }}
                    >
                      {d.type === 'callout' && (
                        <div className="bg-[#ffd100] text-[#0d1216] font-mono text-[10px] font-black px-2.5 py-1 border-2 border-[#0d1216] shadow-[3px_3px_0px_0px_#0d1216] rotate-[-2deg] animate-pop-in">
                          📌 SNAPPED CANVA ASSET!
                        </div>
                      )}
                      {d.type === 'blur' && (
                        <div className="bg-[#0d1216] text-white font-mono text-[9px] font-bold px-3 py-1.5 border-2 border-[#0d1216] rounded-full tracking-wider shadow">
                          🔒 REDACTED DATA
                        </div>
                      )}
                      {d.type === 'arrow' && (
                        <div className="text-[#E01E5A] font-black flex items-center gap-1 drop-shadow-lg">
                          <ArrowUpRight size={22} className="stroke-[3]" />
                          <span className="font-mono text-[11px] text-[#0d1216] font-black bg-[#ffd100] px-1.5 py-0.5 rounded border-2 border-[#0d1216]">Alt + C</span>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 font-mono text-[9px] text-[#0d1216]/50 uppercase tracking-widest font-extrabold">
                    [ Interactive Artboard — Click anywhere to add annotations ]
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* High-Converting 3x2 Neo-Brutalist Features Section */}
      <section id="features" className="py-24 px-6 lg:px-12 bg-[#fcfbfa] text-[#0d1216] border-y-4 border-[#0d1216] relative overflow-hidden">
        {/* Subtle Blueprint Line Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #0d1216 1px, transparent 1px),
              linear-gradient(to bottom, #0d1216 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#00c4cc] text-[#0d1216] border-2 border-[#0d1216] font-mono text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_#0d1216] -rotate-1 mb-4">
            <span>[ FEATURES ]</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-[#0d1216] leading-tight">
            Everything you need to turn <br className="hidden sm:inline" />
            <span className="relative inline-block mt-1 px-4 py-1 bg-[#ffd100] text-[#0d1216] border-2 border-[#0d1216] shadow-[4px_4px_0px_0px_#0d1216] rotate-1">
              Ideas Into Action
            </span>
          </h2>
        </div>

        {/* 3x2 Feature Cards Grid tailored specifically to Canva Snapper */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          
          {/* Card 1: Instant Alt+C Capture */}
          <div className="group bg-white text-[#0d1216] border-2 border-[#0d1216] rounded-2xl p-7 shadow-[6px_6px_0px_0px_#0d1216] hover:shadow-[10px_10px_0px_0px_#00c4cc] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer">
            <div>
              <div className="w-11 h-11 bg-[#e0f7fa] border-2 border-[#0d1216] rounded-xl flex items-center justify-center font-mono font-black text-2xl text-[#0097a7] mb-5 shadow-[2.5px_2.5px_0px_0px_#0d1216] group-hover:rotate-12 transition-transform">
                ⚡
              </div>
              <h3 className="font-mono text-xl font-black uppercase tracking-tight mb-2 text-[#0d1216]">
                Instant Alt + C Capture
              </h3>
              <p className="font-sans text-sm text-[#4b5563] leading-relaxed mb-6 font-medium">
                Bypass Canva's server export menu. Hover over any design element and press Alt + C to copy it in &lt; 15 milliseconds.
              </p>
            </div>

            {/* Graphic Preview: Canva Element Hover Box */}
            <div className="bg-[#f9fafb] border-2 border-[#0d1216] rounded-xl p-3.5 relative overflow-hidden min-h-[140px] flex items-center justify-center">
              <div className="w-full bg-[#00c4cc]/20 border-2 border-[#0d1216] rounded-lg p-3 relative group-hover:animate-pan-canvas shadow-[2px_2px_0px_0px_#0d1216]">
                <div className="flex items-center justify-between text-[#7d2ae7] font-mono text-[9px] font-black mb-1">
                  <span>[ CANVA_ELEMENT_SELECTED ]</span>
                  <span className="bg-[#ffd100] text-[#0d1216] border border-[#0d1216] px-1.5 py-0.5 rounded font-black">ALT + C</span>
                </div>
                <div className="text-[#0d1216] font-mono text-xs font-black">CanvaBrandIcon.png</div>
              </div>
            </div>
          </div>

          {/* Card 2: Direct Paste to AI & Design Tools */}
          <div className="group bg-white text-[#0d1216] border-2 border-[#0d1216] rounded-2xl p-7 shadow-[6px_6px_0px_0px_#0d1216] hover:shadow-[10px_10px_0px_0px_#ffd100] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer">
            <div>
              <div className="w-11 h-11 bg-[#fff8e1] border-2 border-[#0d1216] rounded-xl flex items-center justify-center font-mono font-black text-xl text-[#ff8f00] mb-5 shadow-[2.5px_2.5px_0px_0px_#0d1216] group-hover:-rotate-12 transition-transform">
                ⚡
              </div>
              <h3 className="font-mono text-xl font-black uppercase tracking-tight mb-2 text-[#0d1216]">
                Direct Paste to ChatGPT & AI
              </h3>
              <p className="font-sans text-sm text-[#4b5563] leading-relaxed mb-6 font-medium">
                Copy any element asset in 2 seconds and paste (Ctrl + V) directly into ChatGPT, Gemini, Figma, or any AI tool for instant design feedback & prompt ideas!
              </p>
            </div>

            {/* Graphic Preview: ChatGPT / Gemini Paste Badge */}
            <div className="bg-[#f9fafb] border-2 border-[#0d1216] rounded-xl p-4 relative min-h-[140px] flex items-center justify-center overflow-hidden">
              <div className="w-full bg-[#ffd100]/20 border-2 border-[#0d1216] rounded-lg p-3 text-[#0d1216] font-mono text-[10px] space-y-2 shadow-[2.5px_2.5px_0px_0px_#0d1216]">
                <div className="flex items-center justify-between">
                  <span className="text-[#7d2ae7] font-black">✨ INSTANT_AI_PASTE</span>
                  <span className="bg-[#ffd100] text-[#0d1216] border border-[#0d1216] px-2 py-0.5 rounded font-black">CTRL + V</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="bg-[#7d2ae7] text-white px-2 py-0.5 rounded text-[8px] font-extrabold border border-[#0d1216]">ChatGPT</span>
                  <span className="bg-[#00c4cc] text-[#0d1216] px-2 py-0.5 rounded text-[8px] font-black border border-[#0d1216]">Gemini</span>
                  <span className="bg-[#E01E5A] text-white px-2 py-0.5 rounded text-[8px] font-extrabold border border-[#0d1216]">Figma</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: 100% Alpha PNG Transparency */}
          <div className="group bg-white text-[#0d1216] border-2 border-[#0d1216] rounded-2xl p-7 shadow-[6px_6px_0px_0px_#0d1216] hover:shadow-[10px_10px_0px_0px_#7d2ae7] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer">
            <div>
              <div className="w-11 h-11 bg-[#f3e5f5] border-2 border-[#0d1216] rounded-xl flex items-center justify-center text-[#7b1fa2] mb-5 shadow-[2.5px_2.5px_0px_0px_#0d1216] group-hover:scale-110 transition-transform">
                <Layers size={20} />
              </div>
              <h3 className="font-mono text-xl font-black uppercase tracking-tight mb-2 text-[#0d1216]">
                100% Alpha PNG Support
              </h3>
              <p className="font-sans text-sm text-[#4b5563] leading-relaxed mb-6 font-medium">
                Preserves transparent background alpha channels cleanly so assets fit perfectly in Figma, Slack, or code.
              </p>
            </div>

            {/* Graphic Preview: Checkerboard Transparency */}
            <div className="bg-[#f9fafb] border-2 border-[#0d1216] rounded-xl p-3.5 relative min-h-[140px] flex items-center justify-center">
              <div 
                className="w-full h-20 rounded-lg border-2 border-[#0d1216] flex items-center justify-center font-mono text-xs font-black text-[#0d1216] bg-white shadow-[2px_2px_0px_0px_#0d1216]"
                style={{
                  backgroundImage: `radial-gradient(#0d1216 1px, transparent 1px)`,
                  backgroundSize: '12px 12px',
                }}
              >
                ALPHA_TRANSPARENT.PNG
              </div>
            </div>
          </div>

          {/* Card 4: Pro Auto-Download Formats */}
          <div className="group bg-white text-[#0d1216] border-2 border-[#0d1216] rounded-2xl p-7 shadow-[6px_6px_0px_0px_#0d1216] hover:shadow-[10px_10px_0px_0px_#E01E5A] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer">
            <div>
              <div className="w-11 h-11 bg-[#fce4ec] border-2 border-[#0d1216] rounded-xl flex items-center justify-center text-[#c2185b] mb-5 shadow-[2.5px_2.5px_0px_0px_#0d1216] group-hover:rotate-6 transition-transform">
                <Download size={20} />
              </div>
              <h3 className="font-mono text-xl font-black uppercase tracking-tight mb-2 text-[#0d1216]">
                Auto-Download Formats
              </h3>
              <p className="font-sans text-sm text-[#4b5563] leading-relaxed mb-6 font-medium">
                Configure Pro mode to automatically save copies as WebP or JPEG directly into your downloads directory.
              </p>
            </div>

            {/* Graphic Preview: Format Selector UI */}
            <div className="bg-[#f9fafb] border-2 border-[#0d1216] rounded-xl p-3.5 relative min-h-[140px] flex items-center justify-center">
              <div className="flex bg-white border-2 border-[#0d1216] rounded-lg p-1 shadow-[2.5px_2.5px_0px_0px_#0d1216]">
                <span className="px-2.5 py-1 bg-[#00c4cc] text-[#0d1216] border border-[#0d1216] font-mono text-[10px] font-extrabold rounded">PNG</span>
                <span className="px-2.5 py-1 text-gray-500 font-mono text-[10px] font-bold">WEBP</span>
                <span className="px-2.5 py-1 text-gray-500 font-mono text-[10px] font-bold">JPEG</span>
              </div>
            </div>
          </div>

          {/* Card 5: History Log & Re-Copy */}
          <div className="group bg-white text-[#0d1216] border-2 border-[#0d1216] rounded-2xl p-7 shadow-[6px_6px_0px_0px_#0d1216] hover:shadow-[10px_10px_0px_0px_#00c4cc] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer">
            <div>
              <div className="w-11 h-11 bg-[#e0f7fa] border-2 border-[#0d1216] rounded-xl flex items-center justify-center text-[#00838f] mb-5 shadow-[2.5px_2.5px_0px_0px_#0d1216] group-hover:-rotate-6 transition-transform">
                <Copy size={20} />
              </div>
              <h3 className="font-mono text-xl font-black uppercase tracking-tight mb-2 text-[#0d1216]">
                History Log & One-Click Re-Copy
              </h3>
              <p className="font-sans text-sm text-[#4b5563] leading-relaxed mb-6 font-medium">
                Never lose a snapped graphic. Access your last 5 snapped elements inside the extension popup anytime.
              </p>
            </div>

            {/* Graphic Preview: History Log Card Item */}
            <div className="bg-[#f9fafb] border-2 border-[#0d1216] rounded-xl p-3 relative min-h-[140px] flex items-center justify-center">
              <div className="w-full bg-white border-2 border-[#0d1216] rounded-lg p-2 flex items-center justify-between shadow-[2px_2px_0px_0px_#0d1216]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#ffd100] border border-[#0d1216]"></div>
                  <span className="font-mono text-[10px] font-bold text-[#0d1216]">2400 × 2400px</span>
                </div>
                <span className="px-2 py-0.5 bg-[#7d2ae7] text-white border border-[#0d1216] font-mono text-[9px] font-black rounded">
                  RE-COPY
                </span>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* Pricing Section - High Converting Redesign */}
      <section id="pricing" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t-2 border-[#0d1216]/10 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#ffd100] text-[#0d1216] border-2 border-[#0d1216] font-mono text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_#0d1216] -rotate-1 mb-4">
            <span>⚡ UNLOCK UNLIMITED DESIGN SPEED</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-[#0d1216] leading-tight">
            Stop wasting hours exporting. <br className="hidden sm:inline" />
            <span className="relative inline-flex items-center justify-center mt-2 px-4 py-1.5 bg-[#7d2ae7] text-white border-2 border-[#0d1216] shadow-[4px_4px_0px_0px_#0d1216] rotate-1 min-w-[280px] md:min-w-[500px] h-[50px] md:h-[75px] overflow-hidden">
              <span className="animate-typing-white text-2xl md:text-5xl">Start Snapping Instantly.</span>
            </span>
          </h2>
          <p className="font-sans text-base md:text-lg font-medium text-[#2b2f33] mt-5 max-w-xl mx-auto leading-relaxed">
            One-time payment. No hidden subscriptions. Save <span className="font-black text-[#7d2ae7] underline">3+ hours every week</span> extracting high-res 4K transparent PNG assets straight into Figma & AI tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan) => (
            <div 
              key={plan.type}
              className={`border-4 border-[#0d1216] rounded-2xl p-8 flex flex-col justify-between relative transition-all duration-300 ${plan.bgColor} ${
                plan.highlight ? 'shadow-[8px_8px_0px_0px_#0d1216] md:-translate-y-2' : 'shadow-[5px_5px_0px_0px_#0d1216]'
              } hover:shadow-[10px_10px_0px_0px_#0d1216] hover:-translate-y-2 group`}
            >
              {/* Overlapping AI Icon */}
              <div className="absolute -top-12 -left-6 z-10 w-24 h-24 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 pointer-events-none">
                <img 
                  src={plan.icon} 
                  alt={plan.name} 
                  className="w-full h-full object-contain filter drop-shadow-[3px_3px_0px_rgba(13,18,22,1)]" 
                />
              </div>

              {plan.badge && (
                <span className={`absolute -top-4 right-6 ${plan.badgeBg} text-white border-2 border-[#0d1216] font-mono text-[10px] uppercase tracking-wider font-black px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_#0d1216] z-10`}>
                  {plan.badge}
                </span>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black uppercase text-[#0d1216]/70 tracking-wider">
                    {plan.snaps}
                  </span>
                </div>
                <h3 className="font-mono text-2xl font-black uppercase tracking-tight text-[#0d1216] mt-4">
                  {plan.name}
                </h3>
                <div className="my-6 flex items-baseline gap-2">
                  <span className="text-5xl font-black font-mono tracking-tighter text-[#0d1216]">{plan.price}</span>
                  <span className="font-mono text-xs font-extrabold text-[#0d1216]/80">{plan.period}</span>
                  {plan.originalPrice && (
                    <span className="font-mono text-sm text-[#0d1216]/40 line-through font-bold ml-2">
                      {plan.originalPrice}
                    </span>
                  )}
                </div>
                <ul className="space-y-3 font-mono text-xs text-[#0d1216] font-extrabold border-t-2 border-[#0d1216]/15 pt-6 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white border border-[#0d1216] flex items-center justify-center text-[10px] font-black shadow-[1px_1px_0px_0px_#0d1216]">
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={() => triggerToast(`Initiating Polar checkout for ${plan.name}`)}
                className={`w-full py-4 border-2 border-[#0d1216] rounded-xl font-mono text-xs font-black uppercase tracking-wider text-center shadow-[4px_4px_0px_0px_#0d1216] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer ${plan.btnBg} ${plan.btnText}`}
              >
                Buy Now ⚡
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d1216] text-white py-12 px-6 lg:px-12 border-t-4 border-[#0d1216]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs text-white/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#7d2ae7] text-white border border-white/20 font-bold flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
              ⚡
            </div>
            <span>© 2026 CANVA SNAPPER PRO PRODUCTS. ALL RIGHTS RESERVED.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#00c4cc] transition-colors">PRIVACY POLICY</a>
            <a href="#" className="hover:text-[#00c4cc] transition-colors">TERMS OF SERVICE</a>
            <span className="flex items-center gap-1.5 text-[#2EB67D]">
              <span className="w-2 h-2 rounded-full bg-[#2EB67D]"></span>
              STATUS: 100% OK
            </span>
          </div>
        </div>
      </footer>

      {/* Toast Notification Container - Neo-Brutalist Canva Purple & Yellow Polish */}
      <div 
        className={`fixed bottom-8 right-8 bg-[#7d2ae7] text-white border-3 border-[#0d1216] rounded-2xl px-5 py-3.5 font-mono text-xs font-black shadow-[6px_6px_0px_0px_#ffd100] z-50 transition-all duration-300 flex items-center gap-3 select-none ${
          toast.show ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-90 pointer-events-none'
        }`}
      >
        <div className="w-7 h-7 bg-[#ffd100] text-[#0d1216] border-2 border-[#0d1216] rounded-xl flex items-center justify-center font-extrabold text-sm shadow-[1.5px_1.5px_0px_0px_#0d1216] animate-bounce">
          ⚡
        </div>
        <span className="tracking-wide text-white drop-shadow">{toast.msg}</span>
      </div>
    </div>
  );
}

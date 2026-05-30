import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Image as ImageIcon, Zap, ChevronRight } from 'lucide-react';
import { updateSession } from '../../lib/auth';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    icon: <Sparkles className="w-10 h-10 text-[var(--color-accent)]" />,
    title: "Welcome to Snapper",
    description: "Extract any graphic from Canva instantly without downloading or removing backgrounds."
  },
  {
    id: 2,
    icon: <ImageIcon className="w-10 h-10 text-blue-500" />,
    title: "Perfect Transparency",
    description: "Copies assets as transparent PNGs or raw SVG vectors straight to your clipboard."
  },
  {
    id: 3,
    icon: <Zap className="w-10 h-10 text-amber-500" />,
    title: "Frictionless Workflow",
    description: "Just hover over any element and press Alt+C. Paste it directly into Figma or Discord."
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = async () => {
    if (currentSlide === slides.length - 1) {
      await updateSession({ isOnboarded: true });
      onComplete();
    } else {
      setCurrentSlide(s => s + 1);
    }
  };

  return (
    <div className="relative w-full h-[500px] bg-[var(--color-bg)] overflow-hidden flex flex-col font-sans">
      
      {/* Decorative background blobs */}
      <div className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] bg-[var(--color-accent-100)] rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-50px] right-[-50px] w-[250px] h-[250px] bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="flex-grow flex flex-col justify-center items-center relative z-10 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center text-center w-full max-w-sm"
          >
            <div className="w-24 h-24 bg-white border border-[var(--color-border)] rounded-[32px] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] mb-8">
              {slides[currentSlide].icon}
            </div>
            
            <h2 className="text-[24px] font-bold text-[var(--color-text)] mb-3 tracking-tight">
              {slides[currentSlide].title}
            </h2>
            <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed max-w-[260px]">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 relative z-10 flex flex-col items-center">
        {/* Pagination Dots */}
        <div className="flex gap-2 mb-8">
          {slides.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-6 bg-[var(--color-accent)]' : 'w-1.5 bg-[var(--color-neutral-300)]'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="w-full flex items-center justify-center gap-2 p-4 bg-[var(--color-text)] hover:bg-black text-white rounded-2xl font-semibold transition-all shadow-lg group"
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

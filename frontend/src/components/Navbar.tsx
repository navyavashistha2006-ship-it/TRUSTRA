import React, { useState } from 'react';
import { ShieldCheck, Menu, X, CheckSquare, MapPin, Info } from 'lucide-react';

interface NavbarProps {
  currentScreen: string;
  setScreen: (screen: any) => void;
  onCheckOfferClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentScreen, setScreen, onCheckOfferClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'assessment', label: 'New Assessment', icon: CheckSquare },
    { id: 'explore', label: 'Explore Location', icon: MapPin },
    { id: 'how-it-works', label: 'How It Works', icon: Info },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-cream-surface border-b border-warm-border shadow-sm backdrop-blur-md bg-opacity-95 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <div 
              className="flex-shrink-0 flex items-center cursor-pointer space-x-2"
              onClick={() => setScreen('landing')}
            >
              <div className="bg-soft-olive-tint p-1.5 rounded-lg border border-warm-border text-olive-green">
                <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <span className="font-sans text-xl font-bold tracking-tight text-ink-olive flex items-center">
                TRUSTRA
                <span className="ml-1 text-[10px] uppercase font-semibold text-muted-clay bg-soft-olive px-1.5 py-0.5 rounded-md border border-warm-border">
                  Beta
                </span>
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id || (item.id === 'assessment' && (currentScreen === 'step-1' || currentScreen === 'step-2' || currentScreen === 'results'));
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setScreen(item.id === 'assessment' ? 'step-1' : item.id);
                      setIsOpen(false);
                    }}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                      isActive 
                        ? 'text-olive-green bg-soft-olive' 
                        : 'text-muted-clay hover:text-ink-olive hover:bg-warm-beige bg-transparent'
                    }`}
                  >
                    <Icon className="mr-1.5 h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Right CTA */}
          <div className="hidden sm:flex sm:items-center">
            <button
              onClick={onCheckOfferClick}
              className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-full shadow-soft-warm text-cream-surface bg-olive-green hover:bg-deep-olive transition-all duration-200 focus:outline-none hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            >
              Check an Offer
            </button>
          </div>

          {/* Mobile hamburger menu */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-muted-clay hover:text-ink-olive hover:bg-soft-olive focus:outline-none transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="sm:hidden bg-cream-surface border-b border-warm-border px-2 pt-2 pb-4 space-y-1 shadow-inner animate-fade-in">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id || (item.id === 'assessment' && (currentScreen === 'step-1' || currentScreen === 'step-2' || currentScreen === 'results'));
            return (
              <button
                key={item.id}
                onClick={() => {
                  setScreen(item.id === 'assessment' ? 'step-1' : item.id);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-4 py-3 text-base font-semibold rounded-xl transition-all ${
                  isActive 
                    ? 'text-olive-green bg-soft-olive' 
                    : 'text-muted-clay hover:text-ink-olive hover:bg-warm-beige'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            );
          })}
          <div className="pt-4 pb-2 border-t border-warm-border mt-3 px-2">
            <button
              onClick={() => {
                onCheckOfferClick();
                setIsOpen(false);
              }}
              className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-base font-bold rounded-xl text-cream-surface bg-olive-green hover:bg-deep-olive transition-colors text-center"
            >
              Check an Offer
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

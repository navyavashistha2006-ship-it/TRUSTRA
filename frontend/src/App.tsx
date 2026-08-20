import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ResultsDashboard } from './components/ResultsDashboard';
import { DecisionSimulator } from './components/DecisionSimulator';
import { Compare } from './components/Compare';
import { ExploreLocation } from './components/ExploreLocation';
import { HowItWorks } from './components/HowItWorks';
import { computeRisk } from './utils/riskEngine';
import type { AssessmentInput, RiskAssessmentResult } from './utils/riskEngine';
import { evaluateOffer } from './services/api';
import { 
  ShieldCheck, 
  ArrowRight, 
  Compass, 
  ShieldAlert, 
  Sliders, 
  Sparkles,
  ChevronRight,
  Percent,
  RefreshCw
} from 'lucide-react';

type Screen = 'landing' | 'step-1' | 'step-2' | 'analysis' | 'results' | 'simulator' | 'compare' | 'explore' | 'how-it-works';

export default function App() {
  const [currentScreen, setScreen] = useState<Screen>('landing');
  
  const navigateToScreen = (targetScreen: Screen, replace: boolean = false) => {
    setScreen(targetScreen);
    if (replace) {
      window.history.replaceState({ screen: targetScreen }, '', `#${targetScreen}`);
    } else {
      window.history.pushState({ screen: targetScreen }, '', `#${targetScreen}`);
    }
  };

  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.screen) {
        setScreen(event.state.screen);
      } else {
        setScreen('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.history.replaceState({ screen: 'landing' }, '', '');

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  
  // Evaluation inputs state
  const [input, setInput] = useState<AssessmentInput>({
    location: '',
    serviceType: 'Taxi',
    routeContext: '',
    quotedPrice: 0,
    paymentPressure: false,
    noReceipt: false,
    unexpectedCharges: false,
    couldNotVerifyOperator: false,
    unverifiedBookingChannel: false,
    otherContext: '',
    providerVerified: false
  });

  // Simulated inputs state (from Decision Simulator/Compare)
  const [simulatedInput, setSimulatedInput] = useState<AssessmentInput | null>(null);

  // Form field validation states
  const [errors, setErrors] = useState<{ location?: string; quotedPrice?: string }>({});

  // Analysis / Loading sequential steps state
  const [analysisStep, setAnalysisStep] = useState(0);

  // 1. Live/Mock API State Management
  const [assessmentResult, setAssessmentResult] = useState<RiskAssessmentResult | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const startAssessment = () => {
    setInput({
      location: '',
      serviceType: 'Taxi',
      routeContext: '',
      quotedPrice: 0,
      paymentPressure: false,
      noReceipt: false,
      unexpectedCharges: false,
      couldNotVerifyOperator: false,
      unverifiedBookingChannel: false,
      otherContext: '',
      providerVerified: false
    });
    setErrors({});
    navigateToScreen('step-1');
  };

  // Demo Scenarios loading
  const loadScenario = (type: 'low' | 'anomaly' | 'high') => {
    let scenarioInput: AssessmentInput;
    if (type === 'low') {
      scenarioInput = {
        location: 'Goa',
        serviceType: 'Homestay',
        routeContext: 'Beachside Room (Anjuna)',
        quotedPrice: 3800,
        paymentPressure: false,
        noReceipt: false,
        unexpectedCharges: false,
        couldNotVerifyOperator: false,
        unverifiedBookingChannel: false,
        otherContext: '',
        providerVerified: true
      };
    } else if (type === 'anomaly') {
      scenarioInput = {
        location: 'Jaipur',
        serviceType: 'Taxi',
        routeContext: 'Airport to Amer Fort',
        quotedPrice: 2400, // median is 850, ratio ~ 2.8
        paymentPressure: false,
        noReceipt: true,
        unexpectedCharges: false,
        couldNotVerifyOperator: true,
        unverifiedBookingChannel: false,
        otherContext: '',
        providerVerified: false
      };
    } else { // High risk warning
      scenarioInput = {
        location: 'Agra',
        serviceType: 'Guide',
        routeContext: 'Taj Mahal Guided Tour',
        quotedPrice: 50, // Low-price bait & switch indicator! (median is 800)
        paymentPressure: true,
        noReceipt: true,
        unexpectedCharges: true,
        couldNotVerifyOperator: true,
        unverifiedBookingChannel: true,
        otherContext: 'Met near station gate.',
        providerVerified: false
      };
    }
    
    setInput(scenarioInput);
    // Jump straight to processing and results
    runAnalysis(scenarioInput);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { location?: string; quotedPrice?: string } = {};
    if (!input.location.trim()) {
      newErrors.location = 'Destination is required.';
    }
    if (input.quotedPrice <= 0) {
      newErrors.quotedPrice = 'Please enter a valid quoted price (greater than 0).';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    navigateToScreen('step-2');
  };

  const runAnalysis = (customInput?: AssessmentInput) => {
    const targetInput = customInput || input;
    setScreen('analysis'); // Loader shown temporarily, not pushed to history
    setAnalysisStep(0);
    setApiError(null);

    // Call API immediately and store promise
    const apiPromise = evaluateOffer(targetInput)
      .then(res => {
        setAssessmentResult(res);
        setIsLive(true);
        return { success: true };
      })
      .catch(err => {
        console.warn("Backend API evaluation failed:", err);
        setApiError("TRUSTRA analysis service is temporarily unavailable. Please check that the backend is running.");
        setIsLive(false);
        return { success: false };
      });

    // Run the visual step transition animation
    const intervals = [300, 600, 900, 1200, 1500];
    intervals.forEach((delay, idx) => {
      setTimeout(async () => {
        setAnalysisStep(idx + 1);
        if (idx === intervals.length - 1) {
          const apiOutcome = await apiPromise;
          if (apiOutcome.success) {
            navigateToScreen('results'); // Pushes history!
          }
        }
      }, delay);
    });
  };

  return (
    <div className="min-h-screen bg-warm-beige text-ink-olive flex flex-col font-sans">
      <Navbar 
        currentScreen={currentScreen} 
        setScreen={navigateToScreen} 
        onCheckOfferClick={startAssessment}
      />

      <main className="flex-grow">
        
        {/* ==========================================
            SCREEN 1: LANDING PAGE 
           ========================================== */}
        {currentScreen === 'landing' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16">
            
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-soft-olive border border-warm-border text-olive-green">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Explainable Decision Support for Travelers</span>
                </span>
                
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-sans text-ink-olive leading-tight">
                  Check the offer <br />
                  <span className="text-olive-green">before you accept it.</span>
                </h1>
                
                <p className="text-base sm:text-lg text-muted-clay max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  TRUSTRA matches quoted rates, localized grievances, safety logs, and service behaviors to help you identify price inflation and bait-and-switch risks.
                </p>

                <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4 pt-2">
                  <button
                    onClick={startAssessment}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-full shadow-soft-warm text-cream-surface bg-olive-green hover:bg-deep-olive transition-transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Check an Offer
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setScreen('how-it-works')}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-warm-border text-base font-bold rounded-full bg-cream-surface hover:bg-soft-olive text-ink-olive transition-colors"
                  >
                    How It Works
                  </button>
                </div>
              </div>

              {/* Geometric Route & Pin Illustration */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-80 h-80 sm:w-96 sm:h-96 bg-cream-surface border border-warm-border rounded-3xl p-6 shadow-soft-warm relative flex items-center justify-center overflow-hidden">
                  <svg viewBox="0 0 200 200" className="w-full h-full text-olive-green" fill="none" stroke="currentColor">
                    {/* Grid background */}
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E4DCC8" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Illustrative Route */}
                    <path 
                      d="M30,150 C50,150 70,80 100,80 C130,80 150,120 170,50" 
                      stroke="#5C6B3A" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                      strokeDasharray="4 4" 
                    />
                    
                    {/* Location dots */}
                    <circle cx="30" cy="150" r="6" fill="#2F3B22" />
                    <circle cx="100" cy="80" r="6" fill="#C98A2E" />
                    <circle cx="170" cy="50" r="6" fill="#BF5B3B" />
                    
                    {/* Pulse circles */}
                    <circle cx="170" cy="50" r="14" stroke="#BF5B3B" strokeWidth="1" className="animate-ping" style={{ transformOrigin: '170px 50px' }} />
                    <circle cx="100" cy="80" r="12" stroke="#C98A2E" strokeWidth="1" />

                    {/* Shield Overlay icon */}
                    <rect x="70" y="115" width="60" height="45" rx="10" fill="#FFFDF8" stroke="#E4DCC8" strokeWidth="1" />
                    <text x="100" y="142" textAnchor="middle" fill="#2F3B22" fontSize="22" fontWeight="bold">🛡️</text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Signal Strip */}
            <div className="space-y-6">
              <h3 className="text-center text-xs font-bold uppercase tracking-widest text-muted-clay">
                Powered by Four Core Risk Signals
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: ShieldAlert, title: "Incidents Matching", desc: "Verifies historical safety or fraud incident patterns registered nearby.", color: "text-brick-critical bg-brick-critical bg-opacity-5" },
                  { icon: Compass, title: "Complaint Density", desc: "Indexes tourism grievances, overcharging, and harassment complaints.", color: "text-amber-caution bg-amber-caution bg-opacity-5" },
                  { icon: Percent, title: "Pricing Benchmarks", desc: "Compares quotes against a robust database of localized reference rates.", color: "text-olive-green bg-soft-olive" },
                  { icon: Sliders, title: "Behavioral Patterns", desc: "Flags transaction warnings like extreme booking pressure or no bills.", color: "text-sage-low bg-sage-low bg-opacity-5" }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={idx}
                      className="bg-cream-surface border border-warm-border p-5 rounded-2xl shadow-sm hover:shadow-soft-warm hover:-translate-y-1 transition-all duration-200"
                    >
                      <div className={`p-2.5 rounded-xl border border-warm-border w-fit mb-4 ${item.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h4 className="font-semibold text-sm text-ink-olive mb-1 font-sans">{item.title}</h4>
                      <p className="text-xs text-muted-clay leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Disclaimer Strip */}
            <div className="border-t border-warm-border pt-6 text-center text-[10px] text-muted-clay tracking-wide uppercase font-semibold">
              Risk assessment ≠ proof of fraud. Based on available database matching parameters.
            </div>

          </div>
        )}

        {/* ==========================================
            SCREEN 2: STEP 1 (Service Context)
           ========================================== */}
        {currentScreen === 'step-1' && (
          <div className="max-w-xl mx-auto px-4 py-12">
            
            {/* Progress indicators */}
            <div className="flex items-center justify-between mb-8 text-xs font-bold uppercase tracking-wide px-4">
              <span className="text-olive-green pb-1 border-b-2 border-olive-green">1. Service Context</span>
              <span className="text-muted-clay">➔</span>
              <span className="text-muted-clay">2. Offer Signals</span>
              <span className="text-muted-clay">➔</span>
              <span className="text-muted-clay">3. Assessment</span>
            </div>

            <div className="bg-cream-surface border border-warm-border rounded-3xl p-6 sm:p-8 shadow-soft-warm space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-ink-olive font-sans">Compare an Offer</h2>
                <p className="text-xs text-muted-clay mt-1">
                  Tell us where you are and what offer you received. We'll cross-reference our price databases.
                </p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-4">
                
                {/* Location Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-clay">
                    Location / Destination
                  </label>
                  <input
                    type="text"
                    placeholder="Enter city (e.g., Jaipur, Goa, Manali, Agra)"
                    value={input.location}
                    onChange={(e) => {
                      setInput({ ...input, location: e.target.value });
                      setErrors({ ...errors, location: undefined });
                    }}
                    className="w-full px-4 py-3 bg-cream-surface border border-warm-border rounded-xl text-sm focus:outline-none focus:border-olive-green placeholder-muted-clay"
                  />
                  {errors.location && (
                    <p className="text-xs font-semibold text-brick-critical">{errors.location}</p>
                  )}
                  <span className="block text-[10px] text-muted-clay">
                    *Prototype coverage: Jaipur, Goa, Manali, Agra, Mumbai. Other entries will trigger limited-evidence tags.
                  </span>
                </div>

                {/* Service Type Card Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-clay">
                    Service Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Taxi', 'Guide', 'Homestay', 'Rental', 'Trek Operator', 'Other'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setInput({ ...input, serviceType: type })}
                        className={`py-2 px-3 border rounded-xl text-xs font-semibold transition-all ${
                          input.serviceType === type
                            ? 'bg-olive-green text-cream-surface border-transparent shadow-sm'
                            : 'bg-cream-surface text-ink-olive border-warm-border hover:bg-soft-olive-tint'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Route Context */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-clay">
                    Route / Specific Context (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Airport to Amer Fort, Tour of Taj Mahal"
                    value={input.routeContext}
                    onChange={(e) => setInput({ ...input, routeContext: e.target.value })}
                    className="w-full px-4 py-3 bg-cream-surface border border-warm-border rounded-xl text-sm focus:outline-none focus:border-olive-green placeholder-muted-clay"
                  />
                </div>

                {/* Quoted Price */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-clay">
                    Quoted Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter total amount in INR (e.g. 2000)"
                    value={input.quotedPrice || ''}
                    onChange={(e) => {
                      setInput({ ...input, quotedPrice: parseInt(e.target.value) || 0 });
                      setErrors({ ...errors, quotedPrice: undefined });
                    }}
                    className="w-full px-4 py-3 bg-cream-surface border border-warm-border rounded-xl text-sm focus:outline-none focus:border-olive-green placeholder-muted-clay font-mono"
                  />
                  {errors.quotedPrice && (
                    <p className="text-xs font-semibold text-brick-critical">{errors.quotedPrice}</p>
                  )}
                </div>

                {/* Continue button */}
                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setScreen('landing')}
                    className="px-6 py-2.5 border border-warm-border text-xs font-semibold rounded-full bg-cream-surface hover:bg-soft-olive text-ink-olive transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-6 py-2.5 text-xs font-semibold rounded-full shadow-soft-warm text-cream-surface bg-olive-green hover:bg-deep-olive transition-transform hover:-translate-y-0.5"
                  >
                    Continue to Signals
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ==========================================
            SCREEN 3: STEP 2 (Offer Signals)
           ========================================== */}
        {currentScreen === 'step-2' && (
          <div className="max-w-xl mx-auto px-4 py-12">
            
            {/* Progress indicators */}
            <div className="flex items-center justify-between mb-8 text-xs font-bold uppercase tracking-wide px-4">
              <span className="text-muted-clay">1. Service Context</span>
              <span className="text-muted-clay">➔</span>
              <span className="text-olive-green pb-1 border-b-2 border-olive-green">2. Offer Signals</span>
              <span className="text-muted-clay">➔</span>
              <span className="text-muted-clay">3. Assessment</span>
            </div>

            <div className="bg-cream-surface border border-warm-border rounded-3xl p-6 sm:p-8 shadow-soft-warm space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-ink-olive font-sans">Transaction warning signs</h2>
                <p className="text-xs text-muted-clay mt-1">
                  Select any behavioral indicators or transaction characteristics present in this offer.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'paymentPressure', label: 'Urgent Payment Pressure', desc: 'They are pressuring me to make an upfront deposit/payment immediately.' },
                  { id: 'noReceipt', label: 'Refusing Receipt / Rate Card', desc: 'No clear receipt or written price breakdown was offered upon request.' },
                  { id: 'unexpectedCharges', label: 'Unexpected Extra Charges', desc: 'Additional unexpected charges appeared after the initial quote.' },
                  { id: 'couldNotVerifyOperator', label: 'Unverifiable Operator ID', desc: 'Operator could not show official tourism badges, guides cards, or taxi union credentials.' },
                  { id: 'unverifiedBookingChannel', label: 'Unofficial Booking Channel', desc: 'Met the operator through street soliciting or unverified offline circles.' },
                  { id: 'providerVerified', label: 'Government/Official Registration (Mitigating Factor)', desc: 'The provider has verified, audited credentials or is a prepaid state counter.', isMitigation: true }
                ].map((sig) => {
                  const key = sig.id as keyof AssessmentInput;
                  const isChecked = input[key] as boolean;
                  
                  return (
                    <button
                      key={sig.id}
                      onClick={() => setInput({ ...input, [key]: !isChecked })}
                      className={`w-full text-left p-4 border rounded-2xl transition-all duration-150 flex items-start space-x-3 hover:scale-[1.01] ${
                        isChecked 
                          ? sig.isMitigation
                            ? 'bg-soft-olive border-sage-low'
                            : 'bg-soft-olive-tint border-olive-green shadow-sm'
                          : 'bg-cream-surface border-warm-border'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 ${
                        isChecked
                          ? sig.isMitigation
                            ? 'bg-sage-low border-transparent text-cream-surface'
                            : 'bg-olive-green border-transparent text-cream-surface'
                          : 'border-warm-border bg-cream-surface'
                      }`}>
                        {isChecked && <span className="text-[10px]">✓</span>}
                      </div>
                      <div>
                        <span className={`block text-xs font-bold ${sig.isMitigation ? 'text-olive-green' : 'text-ink-olive'}`}>
                          {sig.label}
                        </span>
                        <span className="text-[10px] text-muted-clay block mt-0.5 leading-relaxed">
                          {sig.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Text area for other details */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-clay">
                  Other Context (Optional)
                </label>
                <textarea
                  placeholder="Describe anything else unusual about this offer..."
                  rows={2}
                  value={input.otherContext}
                  onChange={(e) => setInput({ ...input, otherContext: e.target.value })}
                  className="w-full px-4 py-3 bg-cream-surface border border-warm-border rounded-xl text-xs focus:outline-none focus:border-olive-green placeholder-muted-clay resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setScreen('step-1')}
                  className="px-6 py-2.5 border border-warm-border text-xs font-semibold rounded-full bg-cream-surface hover:bg-soft-olive text-ink-olive transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => runAnalysis()}
                  className="inline-flex items-center px-6 py-2.5 text-xs font-semibold rounded-full shadow-soft-warm text-cream-surface bg-olive-green hover:bg-deep-olive transition-transform hover:-translate-y-0.5"
                >
                  Run Risk Assessment
                  <ShieldCheck className="ml-1.5 h-4 w-4" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ==========================================
            SCREEN 4: ANALYSIS STATE (Processing)
           ========================================== */}
        {currentScreen === 'analysis' && (
          <div className="max-w-md mx-auto px-4 py-24 text-center space-y-8">
            {apiError ? (
              <div className="bg-cream-surface border-2 border-brick-critical/20 rounded-3xl p-8 shadow-soft-warm space-y-6 animate-fade-in">
                <div className="w-16 h-16 bg-brick-critical/10 text-brick-critical rounded-full flex items-center justify-center mx-auto">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-ink-olive font-sans">
                    Analysis Service Offline
                  </h2>
                  <p className="text-xs text-muted-clay leading-relaxed">
                    {apiError}
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => runAnalysis()}
                    className="px-6 py-2.5 bg-olive-green hover:bg-deep-olive text-cream-surface font-semibold rounded-full text-xs transition-colors flex items-center justify-center"
                  >
                    <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                    Retry Connection
                  </button>
                  <button
                    onClick={() => {
                      setApiError(null);
                      setAssessmentResult(computeRisk(input));
                      setIsLive(false);
                      setScreen('results');
                    }}
                    className="px-6 py-2.5 border border-warm-border hover:bg-soft-olive text-ink-olive font-semibold rounded-full text-xs transition-colors"
                  >
                    Use Offline Fallback
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative w-20 h-20 mx-auto">
                  {/* Spinner wheel */}
                  <div className="absolute inset-0 border-4 border-warm-border rounded-full" />
                  <div className="absolute inset-0 border-4 border-t-olive-green border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-ink-olive font-sans">
                    Cross-referencing database...
                  </h2>
                  <p className="text-xs text-muted-clay">
                    Analyzing transaction signals against regional evidence profiles.
                  </p>
                </div>

                {/* Checklist items loading sequentially */}
                <div className="bg-cream-surface border border-warm-border rounded-2xl p-5 shadow-sm space-y-3 text-left max-w-sm mx-auto">
                  {[
                    "1. Understanding offer location & context",
                    "2. Matching local reference rates database",
                    "3. Checking regional complaints history",
                    "4. Evaluating tourist behavioral logs",
                    "5. Generating explainable risk matrix"
                  ].map((stepStr, idx) => (
                    <div key={idx} className="flex items-center space-x-3 text-xs">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        analysisStep > idx
                          ? 'bg-sage-low border-transparent text-cream-surface'
                          : 'border-warm-border text-muted-clay animate-pulse'
                      }`}>
                        {analysisStep > idx ? "✓" : "•"}
                      </div>
                      <span className={analysisStep > idx ? 'text-ink-olive font-medium' : 'text-muted-clay'}>
                        {stepStr}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ==========================================
            SCREEN 5: RESULTS DASHBOARD
           ========================================== */}
        {currentScreen === 'results' && assessmentResult && (
          <ResultsDashboard
            input={input}
            initialResult={assessmentResult}
            isLive={isLive}
            onModify={() => navigateToScreen('step-2')}
            onNewAssessment={startAssessment}
            onCompareToggle={(simInput) => {
              setSimulatedInput(simInput);
              navigateToScreen('compare');
            }}
            onOpenSimulator={(simInput) => {
              setSimulatedInput(simInput);
              navigateToScreen('simulator');
            }}
          />
        )}

        {/* ==========================================
            SCREEN 6: INTERACTIVE DECISION SIMULATOR
           ========================================== */}
        {currentScreen === 'simulator' && simulatedInput && (
          <DecisionSimulator
            input={input}
            onBack={() => navigateToScreen('results')}
            onApplySimulation={(appliedSimInput) => {
              setInput(appliedSimInput);
              runAnalysis(appliedSimInput);
            }}
          />
        )}

        {/* ==========================================
            SCREEN 7: COMPARE SCREEN
           ========================================== */}
        {currentScreen === 'compare' && simulatedInput && (
          <Compare
            originalInput={input}
            simulatedInput={simulatedInput}
            onBack={() => navigateToScreen('results')}
          />
        )}

        {/* ==========================================
            SCREEN 8: EXPLORE LOCATION REFERENCES
           ========================================== */}
        {currentScreen === 'explore' && <ExploreLocation />}

        {/* ==========================================
            SCREEN 9: HOW IT WORKS / METHODOLOGY
           ========================================== */}
        {currentScreen === 'how-it-works' && <HowItWorks />}

      </main>

      {/* Floating Scenario Panel (Demo Preset switch) */}
      <div className="fixed bottom-4 left-4 z-40 bg-cream-surface border-2 border-olive-green rounded-2xl p-4 shadow-soft-warm max-w-xs space-y-2 text-xs">
        <div className="flex justify-between items-center border-b border-warm-border pb-1">
          <span className="font-bold text-[10px] text-olive-green uppercase tracking-wide">
            Judge Demo presets
          </span>
          <span className="text-[9px] text-muted-clay font-medium uppercase bg-soft-olive px-1 rounded border border-warm-border">
            Interactive
          </span>
        </div>
        <p className="text-[10px] text-muted-clay leading-relaxed">
          Instantly populate mock records and load risk output results:
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => loadScenario('low')}
            className="py-1 px-1.5 bg-sage-low text-cream-surface font-semibold rounded text-[9px] hover:-translate-y-0.5 transition-transform"
          >
            🟢 Low Risk
          </button>
          <button
            onClick={() => loadScenario('anomaly')}
            className="py-1 px-1.5 bg-amber-caution text-cream-surface font-semibold rounded text-[9px] hover:-translate-y-0.5 transition-transform"
          >
            🟡 Price Warn
          </button>
          <button
            onClick={() => loadScenario('high')}
            className="py-1 px-1.5 bg-brick-critical text-cream-surface font-semibold rounded text-[9px] hover:-translate-y-0.5 transition-transform"
          >
            🔴 Multi-Risk
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-cream-surface border-t border-warm-border py-8 text-center text-xs text-muted-clay mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2026 TRUSTRA — Tourism Risk Intelligence & Explainability Platform.</p>
          <p className="text-[10px] opacity-75">
            Prepared as a mock-prototype for Smart India Hackathon. All data compiled from regional demonstration models.
          </p>
        </div>
      </footer>

    </div>
  );
}

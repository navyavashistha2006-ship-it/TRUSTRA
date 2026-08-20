import React, { useState, useEffect } from 'react';
import { computeRisk } from '../utils/riskEngine';
import { evaluateOffer } from '../services/api';
import type { AssessmentInput } from '../utils/riskEngine';
import { Sliders, RefreshCw, ChevronLeft, ArrowRight } from 'lucide-react';

interface DecisionSimulatorProps {
  input: AssessmentInput;
  onBack: () => void;
  onApplySimulation: (simulatedInput: AssessmentInput) => void;
}

export const DecisionSimulator: React.FC<DecisionSimulatorProps> = ({ 
  input, 
  onBack,
  onApplySimulation
}) => {
  // Local simulated inputs
  const [simulatedPrice, setSimulatedPrice] = useState(input.quotedPrice);
  const [verified, setVerified] = useState(input.providerVerified);
  const [receipt, setReceipt] = useState(!input.noReceipt); // Toggles true when receipt IS available
  const [pressure, setPressure] = useState(input.paymentPressure);

  // Compute results
  const [originalResult, setOriginalResult] = useState(() => computeRisk(input));
  
  const simulatedInput: AssessmentInput = {
    ...input,
    quotedPrice: simulatedPrice,
    providerVerified: verified,
    noReceipt: !receipt,
    paymentPressure: pressure
  };

  const [simulatedResult, setSimulatedResult] = useState(() => computeRisk(simulatedInput));

  useEffect(() => {
    evaluateOffer(input)
      .then(res => setOriginalResult(res))
      .catch(() => setOriginalResult(computeRisk(input)));
  }, [input]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      evaluateOffer(simulatedInput)
        .then(res => setSimulatedResult(res))
        .catch(() => setSimulatedResult(computeRisk(simulatedInput)));
    }, 150); // 150ms debounce to prevent API flooding during sliders drag

    return () => clearTimeout(delayDebounceFn);
  }, [simulatedPrice, verified, receipt, pressure, input]);

  const scoreDelta = originalResult.overallScore - simulatedResult.overallScore;

  // Custom styling maps
  const getRiskColor = (category: string) => {
    switch (category) {
      case 'VERY HIGH': return 'text-brick-critical';
      case 'HIGH': return 'text-terracotta-high';
      case 'MODERATE': return 'text-amber-caution';
      default: return 'text-sage-low';
    }
  };

  // Set default slider parameters
  const priceRef = originalResult.matchedPriceRef;
  const sliderMin = priceRef ? Math.max(100, Math.round(priceRef.min * 0.5)) : 100;
  const sliderMax = priceRef ? Math.round(priceRef.max * 1.8) : Math.max(10000, input.quotedPrice * 2);
  const currencySymbol = priceRef ? priceRef.currency : "₹";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back to Results header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center text-xs font-bold text-olive-green hover:text-deep-olive transition-colors"
        >
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          Back to Results
        </button>
      </div>

      <div className="text-center mb-8">
        <span className="text-xs uppercase font-semibold tracking-wider text-muted-clay bg-soft-olive px-3 py-1 rounded-full border border-warm-border">
          Interactive Tool
        </span>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold font-sans text-ink-olive">
          Decision Risk Simulator
        </h1>
        <p className="mt-2 text-sm text-muted-clay max-w-lg mx-auto">
          Explore how negotiating the price, verifying registration status, or resolving transaction pressures directly reduces risk.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Sliders & Variables Panel */}
        <div className="md:col-span-7 bg-cream-surface border border-warm-border rounded-2xl p-6 shadow-soft-warm space-y-6">
          <h2 className="text-base font-bold text-ink-olive flex items-center border-b border-warm-border pb-3">
            <Sliders className="mr-2 h-4 w-4 text-olive-green" />
            Adjust Transaction Variables
          </h2>

          {/* Variable 1: Quoted Price Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-ink-olive">Quoted Price ({currencySymbol})</label>
              <span className="font-mono text-base font-bold text-olive-green bg-soft-olive px-3 py-1 rounded-lg border border-warm-border">
                {currencySymbol}{simulatedPrice}
              </span>
            </div>
            
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={50}
              value={simulatedPrice}
              onChange={(e) => setSimulatedPrice(parseInt(e.target.value))}
              className="w-full h-2 bg-warm-border rounded-lg appearance-none cursor-pointer accent-olive-green"
            />
            
            {priceRef && (
              <div className="flex justify-between text-[10px] text-muted-clay font-medium">
                <span>Min: {currencySymbol}{priceRef.min}</span>
                <span className="font-bold text-olive-green">Median (Ref): {currencySymbol}{priceRef.median}</span>
                <span>Max: {currencySymbol}{priceRef.max}</span>
              </div>
            )}
          </div>

          {/* Variable 2: Provider Verification status */}
          <div className="flex justify-between items-center p-3 rounded-xl border border-warm-border bg-warm-beige bg-opacity-20">
            <div>
              <span className="block text-sm font-semibold text-ink-olive">Provider Verification</span>
              <span className="text-[11px] text-muted-clay">Is the operator registered or government-certified?</span>
            </div>
            <button
              onClick={() => setVerified(!verified)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                verified ? 'bg-olive-green' : 'bg-warm-border'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-cream-surface shadow ring-0 transition duration-200 ease-in-out ${
                  verified ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Variable 3: Receipt Availability */}
          <div className="flex justify-between items-center p-3 rounded-xl border border-warm-border bg-warm-beige bg-opacity-20">
            <div>
              <span className="block text-sm font-semibold text-ink-olive">Written Receipt / Breakdown</span>
              <span className="text-[11px] text-muted-clay">Did they provide a clear written bill or rate card?</span>
            </div>
            <button
              onClick={() => setReceipt(!receipt)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                receipt ? 'bg-olive-green' : 'bg-warm-border'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-cream-surface shadow ring-0 transition duration-200 ease-in-out ${
                  receipt ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Variable 4: Payment Pressure */}
          <div className="flex justify-between items-center p-3 rounded-xl border border-warm-border bg-warm-beige bg-opacity-20">
            <div>
              <span className="block text-sm font-semibold text-ink-olive">Payment Urgency / Pressure</span>
              <span className="text-[11px] text-muted-clay">Are they demanding immediate cash/advance to book?</span>
            </div>
            <button
              onClick={() => setPressure(!pressure)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                pressure ? 'bg-olive-green' : 'bg-warm-border'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-cream-surface shadow ring-0 transition duration-200 ease-in-out ${
                  pressure ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => {
                setSimulatedPrice(input.quotedPrice);
                setVerified(input.providerVerified);
                setReceipt(!input.noReceipt);
                setPressure(input.paymentPressure);
              }}
              className="inline-flex items-center text-xs font-bold text-muted-clay hover:text-ink-olive transition-colors"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Reset to Original Offer Details
            </button>
          </div>
        </div>

        {/* Right Column: Live Scoring Comparison */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Main Simulated Score Card */}
          <div className="bg-cream-surface border-2 border-olive-green rounded-2xl p-6 shadow-soft-warm-lg text-center space-y-4">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-clay">Simulated Result</span>
            
            {/* Split Screen comparison */}
            <div className="flex justify-around items-center border-b border-warm-border pb-4">
              <div>
                <span className="block text-[10px] uppercase font-bold text-muted-clay">Original</span>
                <span className="text-3xl font-bold font-sans text-muted-clay">{originalResult.overallScore}</span>
                <span className="block text-[9px] font-semibold uppercase text-muted-clay">{originalResult.riskCategory}</span>
              </div>
              
              <div className="text-muted-clay font-bold text-lg">➔</div>
              
              <div>
                <span className="block text-[10px] uppercase font-bold text-olive-green">Simulated</span>
                <span className={`text-4xl font-extrabold font-sans ${getRiskColor(simulatedResult.riskCategory)}`}>
                  {simulatedResult.overallScore}
                </span>
                <span className={`block text-[10px] font-bold uppercase ${getRiskColor(simulatedResult.riskCategory)}`}>
                  {simulatedResult.riskCategory} RISK
                </span>
              </div>
            </div>

            {/* Score Delta indicator */}
            {scoreDelta > 0 ? (
              <div className="bg-sage-low/10 border border-sage-low/20 rounded-xl p-3 text-xs font-semibold text-sage-low">
                👍 Risk reduced by {scoreDelta} points!
              </div>
            ) : scoreDelta < 0 ? (
              <div className="bg-brick-critical/10 border border-brick-critical/20 rounded-xl p-3 text-xs font-semibold text-brick-critical">
                ⚠️ Risk increased by {Math.abs(scoreDelta)} points.
              </div>
            ) : (
              <div className="bg-warm-beige/55 border border-warm-border rounded-xl p-3 text-xs font-semibold text-muted-clay">
                No difference from original offer.
              </div>
            )}

            <p className="text-[11px] text-muted-clay leading-relaxed">
              This simulated assessment applies standard localized scoring. Safety cannot be absolutely guaranteed even with a low score.
            </p>

            <button
              onClick={() => onApplySimulation(simulatedInput)}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-cream-surface bg-olive-green hover:bg-deep-olive rounded-full transition-transform active:scale-95 shadow-sm"
            >
              Apply Simulation to Main Report
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </button>
          </div>

          {/* Sub-Score Delta Breakdown */}
          <div className="bg-cream-surface border border-warm-border rounded-2xl p-5 shadow-sm space-y-3 font-mono text-xs">
            <h4 className="font-sans font-bold text-ink-olive text-sm border-b border-warm-border pb-2">
              Sub-Score Deltas
            </h4>
            
            <div className="space-y-2">
              {[
                { label: 'Price Anomaly', orig: originalResult.breakdown.price.score, sim: simulatedResult.breakdown.price.score, max: 25 },
                { label: 'Incident Sim', orig: originalResult.breakdown.incidents.score, sim: simulatedResult.breakdown.incidents.score, max: 30 },
                { label: 'Complaint Dens', orig: originalResult.breakdown.complaints.score, sim: simulatedResult.breakdown.complaints.score, max: 25 },
                { label: 'Suspicious Pat', orig: originalResult.breakdown.patterns.score, sim: simulatedResult.breakdown.patterns.score, max: 20 }
              ].map((sub, i) => {
                const diff = sub.orig - sub.sim;
                return (
                  <div key={i} className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-clay font-sans">{sub.label}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-clay">{sub.orig}</span>
                      <span>➔</span>
                      <span className={diff > 0 ? 'text-sage-low font-bold' : diff < 0 ? 'text-brick-critical font-bold' : 'text-ink-olive'}>
                        {sub.sim}
                      </span>
                      <span className="text-[10px] text-muted-clay">/{sub.max}</span>
                    </div>
                  </div>
                );
              })}
              
              {/* Mitigations */}
              <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-dashed border-warm-border">
                <span className="text-muted-clay font-sans">Verification:</span>
                <span className="font-semibold text-olive-green">
                  {verified ? '-12 points' : 'No deduction'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

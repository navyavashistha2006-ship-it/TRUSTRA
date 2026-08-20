import React, { useState, useEffect } from 'react';
import { computeRisk } from '../utils/riskEngine';
import { evaluateOffer } from '../services/api';
import type { AssessmentInput } from '../utils/riskEngine';
import { ChevronLeft, Scale, ShieldAlert, FileText, Sliders } from 'lucide-react';

interface CompareProps {
  originalInput: AssessmentInput;
  simulatedInput: AssessmentInput;
  onBack: () => void;
}

export const Compare: React.FC<CompareProps> = ({ 
  originalInput, 
  simulatedInput, 
  onBack 
}) => {
  const [original, setOriginal] = useState(() => computeRisk(originalInput));
  const [simulated, setSimulated] = useState(() => computeRisk(simulatedInput));

  useEffect(() => {
    evaluateOffer(originalInput)
      .then(res => setOriginal(res))
      .catch(() => setOriginal(computeRisk(originalInput)));

    evaluateOffer(simulatedInput)
      .then(res => setSimulated(res))
      .catch(() => setSimulated(computeRisk(simulatedInput)));
  }, [originalInput, simulatedInput]);

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'VERY HIGH': return 'text-brick-critical';
      case 'HIGH': return 'text-terracotta-high';
      case 'MODERATE': return 'text-amber-caution';
      default: return 'text-sage-low';
    }
  };

  const getRiskBg = (category: string) => {
    switch (category) {
      case 'VERY HIGH': return 'bg-brick-critical/10 border-brick-critical/20';
      case 'HIGH': return 'bg-terracotta-high/10 border-terracotta-high/20';
      case 'MODERATE': return 'bg-amber-caution/10 border-amber-caution/20';
      default: return 'bg-sage-low/10 border-sage-low/20';
    }
  };

  // Compare sub-score rows data
  const comparisonRows = [
    {
      label: 'Price Anomaly',
      origVal: original.breakdown.price.score,
      simVal: simulated.breakdown.price.score,
      max: 25,
      icon: Scale,
      colorClass: 'bg-olive-green'
    },
    {
      label: 'Incident Similarity',
      origVal: original.breakdown.incidents.score,
      simVal: simulated.breakdown.incidents.score,
      max: 30,
      icon: ShieldAlert,
      colorClass: 'bg-brick-critical'
    },
    {
      label: 'Complaint Density',
      origVal: original.breakdown.complaints.score,
      simVal: simulated.breakdown.complaints.score,
      max: 25,
      icon: FileText,
      colorClass: 'bg-amber-caution'
    },
    {
      label: 'Behavioral Signals',
      origVal: original.breakdown.patterns.score,
      simVal: simulated.breakdown.patterns.score,
      max: 20,
      icon: Sliders,
      colorClass: 'bg-sage-low'
    }
  ];

  const scoreDiff = original.overallScore - simulated.overallScore;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header back navigation */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center text-xs font-bold text-olive-green hover:text-deep-olive transition-colors"
        >
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          Back to Assessment Results
        </button>
      </div>

      <div className="text-center mb-10">
        <span className="text-xs uppercase font-semibold tracking-wider text-muted-clay bg-soft-olive px-3 py-1 rounded-full border border-warm-border">
          Comparison Panel
        </span>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold font-sans text-ink-olive">
          Compare Original vs. Revised Offers
        </h1>
        <p className="mt-2 text-sm text-muted-clay max-w-lg mx-auto">
          Audit the visual difference between the offer you received and your simulated adjustments.
        </p>
      </div>

      {/* Side-by-side Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        
        {/* Card 1: Original Offer */}
        <div className="bg-cream-surface border border-warm-border rounded-2xl p-6 shadow-sm relative overflow-hidden text-center space-y-3">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-muted-clay" />
          <span className="text-[10px] font-bold text-muted-clay uppercase tracking-widest">
            Original Offer Parameters
          </span>
          <div className="text-5xl font-extrabold font-sans text-muted-clay py-2">
            {original.overallScore}
          </div>
          <span className={`inline-block text-xs font-bold border px-3 py-0.5 rounded-full ${getRiskBg(original.riskCategory)} ${getRiskColor(original.riskCategory)}`}>
            {original.riskCategory} RISK
          </span>
          
          <div className="pt-2 border-t border-warm-border text-xs text-left text-muted-clay space-y-1.5">
            <div>• Price: <strong className="text-ink-olive">{original.matchedPriceRef?.currency || "₹"}{originalInput.quotedPrice}</strong></div>
            <div>• Verified Operator: <strong className="text-ink-olive">{originalInput.providerVerified ? "Yes" : "No"}</strong></div>
            <div>• Receipts / pressure signals: <strong className="text-ink-olive">{
              [
                originalInput.noReceipt && "no receipt",
                originalInput.paymentPressure && "payment pressure",
                originalInput.unexpectedCharges && "unexpected fees",
              ].filter(Boolean).join(', ') || "None"
            }</strong></div>
          </div>
        </div>

        {/* Card 2: Revised Offer */}
        <div className="bg-cream-surface border-2 border-olive-green rounded-2xl p-6 shadow-soft-warm relative overflow-hidden text-center space-y-3">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-olive-green" />
          <span className="text-[10px] font-bold text-olive-green uppercase tracking-widest">
            Revised/Simulated Offer
          </span>
          <div className="text-5xl font-extrabold font-sans text-olive-green py-2">
            {simulated.overallScore}
          </div>
          <span className={`inline-block text-xs font-bold border px-3 py-0.5 rounded-full ${getRiskBg(simulated.riskCategory)} ${getRiskColor(simulated.riskCategory)}`}>
            {simulated.riskCategory} RISK
          </span>

          <div className="pt-2 border-t border-warm-border text-xs text-left text-muted-clay space-y-1.5">
            <div>• Price: <strong className="text-ink-olive">{simulated.matchedPriceRef?.currency || "₹"}{simulatedInput.quotedPrice}</strong></div>
            <div>• Verified Operator: <strong className="text-ink-olive">{simulatedInput.providerVerified ? "Yes" : "No"}</strong></div>
            <div>• Receipts / pressure signals: <strong className="text-ink-olive">{
              [
                simulatedInput.noReceipt && "no receipt",
                simulatedInput.paymentPressure && "payment pressure",
                simulatedInput.unexpectedCharges && "unexpected fees",
              ].filter(Boolean).join(', ') || "None"
            }</strong></div>
          </div>
        </div>

      </div>

      {/* Delta Callout Box */}
      {scoreDiff > 0 && (
        <div className="bg-sage-low bg-opacity-10 border border-sage-low rounded-2xl p-4 mb-8 text-center text-sm font-semibold text-sage-low">
          🎉 Applying these adjustments reduces the overall transaction risk rating by <span className="font-extrabold text-lg">{scoreDiff}</span> points, moving the transaction from the <span className="underline">{original.riskCategory}</span> category to <span className="underline">{simulated.riskCategory}</span>.
        </div>
      )}

      {/* Detailed Sub-Score Progress Bars comparison */}
      <div className="bg-cream-surface border border-warm-border rounded-2xl p-6 shadow-soft-warm space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-ink-olive border-b border-warm-border pb-3">
          Sub-Score Benchmarks Comparison
        </h3>

        <div className="space-y-6">
          {comparisonRows.map((row, idx) => {
            const Icon = row.icon;
            
            // Calculate width percentages
            const origPct = (row.origVal / row.max) * 100;
            const simPct = (row.simVal / row.max) * 100;
            const delta = row.origVal - row.simVal;

            return (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-ink-olive">
                  <span className="flex items-center">
                    <Icon className="h-4 w-4 mr-2 text-muted-clay" />
                    {row.label} (Max: {row.max})
                  </span>
                  
                  {delta !== 0 ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      delta > 0 ? 'bg-sage-low bg-opacity-10 text-sage-low' : 'bg-brick-critical bg-opacity-10 text-brick-critical'
                    }`}>
                      {delta > 0 ? `Reduced by ${delta} pts` : `Increased by ${Math.abs(delta)} pts`}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-clay">Unchanged</span>
                  )}
                </div>

                {/* Progress compare bar */}
                <div className="space-y-1.5 pt-1">
                  {/* Original line */}
                  <div className="flex items-center text-[10px]">
                    <span className="w-14 text-muted-clay">Original:</span>
                    <div className="flex-1 h-3 bg-warm-border rounded-full overflow-hidden mr-2">
                      <div 
                        className="h-full bg-muted-clay rounded-full transition-all duration-500" 
                        style={{ width: `${origPct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-bold text-ink-olive">{row.origVal}</span>
                  </div>

                  {/* Simulated line */}
                  <div className="flex items-center text-[10px]">
                    <span className="w-14 font-bold text-olive-green">Simulated:</span>
                    <div className="flex-1 h-3 bg-warm-border rounded-full overflow-hidden mr-2">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${row.colorClass}`} 
                        style={{ width: `${simPct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-bold text-olive-green">{row.simVal}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

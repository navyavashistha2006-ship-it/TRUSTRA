import React, { useState, useEffect } from 'react';
import { computeRisk } from '../utils/riskEngine';
import { evaluateOffer } from '../services/api';
import type { AssessmentInput, RiskAssessmentResult } from '../utils/riskEngine';
import { 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Compass, 
  Scale, 
  FileText, 
  ArrowRight,
  Sliders,
  Check
} from 'lucide-react';

interface ResultsDashboardProps {
  input: AssessmentInput;
  initialResult: RiskAssessmentResult;
  isLive: boolean;
  onModify: () => void;
  onNewAssessment: () => void;
  onCompareToggle: (simulatedInput: AssessmentInput) => void;
  onOpenSimulator: (simulatedInput: AssessmentInput) => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ 
  input, 
  initialResult,
  isLive,
  onModify, 
  onNewAssessment,
  onCompareToggle,
  onOpenSimulator
}) => {
  // 1. Initial State & Score count-up
  const [result, setResult] = useState(() => initialResult);
  const [animatedScore, setAnimatedScore] = useState(0);

  // Synchronize internal result when initialResult changes (e.g. presets)
  useEffect(() => {
    setResult(initialResult);
  }, [initialResult]);
  
  useEffect(() => {
    let start = 0;
    const end = result.overallScore;
    if (end === 0) return;
    const duration = 1000; // 1 second count up
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedScore(end);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [result.overallScore]);

  // 2. Expand/Collapse states for 4 Evidence Cards
  const [expandedCards, setExpandedCards] = useState({
    price: true,
    incidents: false,
    complaints: false,
    patterns: false
  });

  const toggleCard = (card: 'price' | 'incidents' | 'complaints' | 'patterns') => {
    setExpandedCards(prev => ({
      ...prev,
      [card]: !prev[card]
    }));
  };

  // 3. Collapsible Judge Transparency Mode
  const [showTransparency, setShowTransparency] = useState(false);

  // 3.1 Collapsible Reference Evidence Section
  const [showReferenceEvidence, setShowReferenceEvidence] = useState(false);

  // 4. "What-If" Live Sim Chips State
  const [whatIf, setWhatIf] = useState({
    adjustPrice: false,
    verifyProvider: false,
    receiptAvailable: false,
    noPressure: false
  });

  const priceRef = result.matchedPriceRef;

  // Build the simulated input based on selected toggles
  const getSimulatedInput = (): AssessmentInput => {
    return {
      ...input,
      quotedPrice: whatIf.adjustPrice && priceRef ? priceRef.median : input.quotedPrice,
      providerVerified: whatIf.verifyProvider ? true : input.providerVerified,
      noReceipt: whatIf.receiptAvailable ? false : input.noReceipt,
      paymentPressure: whatIf.noPressure ? false : input.paymentPressure
    };
  };

  const [simulatedResult, setSimulatedResult] = useState(() => computeRisk(getSimulatedInput()));

  useEffect(() => {
    const simInput = getSimulatedInput();
    evaluateOffer(simInput)
      .then(res => setSimulatedResult(res))
      .catch(() => setSimulatedResult(computeRisk(simInput)));
  }, [whatIf, input, priceRef]);

  const simulatedInput = getSimulatedInput();
  const scoreReduction = result.overallScore - simulatedResult.overallScore;

  const getRiskColorClasses = (category: string) => {
    switch (category) {
      case 'VERY HIGH':
        return {
          bg: 'bg-brick-critical/10',
          border: 'border-brick-critical/20',
          text: 'text-brick-critical',
          fill: '#9C3B2E'
        };
      case 'HIGH':
        return {
          bg: 'bg-terracotta-high/10',
          border: 'border-terracotta-high/20',
          text: 'text-terracotta-high',
          fill: '#BF5B3B'
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-caution/10',
          border: 'border-amber-caution/20',
          text: 'text-amber-caution',
          fill: '#C98A2E'
        };
      default: // LOW
        return {
          bg: 'bg-sage-low/10',
          border: 'border-sage-low/20',
          text: 'text-sage-low',
          fill: '#5B8A5A'
        };
    }
  };

  const currentColors = getRiskColorClasses(result.riskCategory);
  const simulatedColors = getRiskColorClasses(simulatedResult.riskCategory);

  // Function to map quoted price relative to min/median/max
  const getMarkerPosition = () => {
    if (!priceRef) return 50;
    const { min, median, max } = priceRef;
    const price = input.quotedPrice;
    
    if (price === median) return 50;
    
    if (price > median) {
      const range = max - median;
      if (range === 0) return 90;
      // Map median(50%) to max(90%)
      const percentage = 50 + Math.min(1.0, (price - median) / range) * 40;
      return Math.min(100, percentage);
    } else {
      const range = median - min;
      if (range === 0) return 10;
      // Map min(10%) to median(50%)
      const percentage = 10 + Math.max(0.0, (price - min) / range) * 40;
      return Math.max(0, percentage);
    }
  };

  const markerPct = getMarkerPosition();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      {/* Navigation Buttons Row */}
      <div className="flex justify-between items-center pb-2">
        <button
          onClick={onModify}
          className="inline-flex items-center px-4 py-2 border border-warm-border text-xs font-bold rounded-full bg-cream-surface hover:bg-soft-olive text-ink-olive transition-all duration-150 shadow-sm"
        >
          ← Edit Assessment
        </button>
        <button
          onClick={onNewAssessment}
          className="inline-flex items-center px-4 py-2 border border-warm-border text-xs font-bold rounded-full bg-cream-surface hover:bg-soft-olive text-ink-olive transition-all duration-150 shadow-sm"
        >
          + New Assessment
        </button>
      </div>

      {/* Elegant About this Data Section */}
      <div className="bg-cream-surface border border-warm-border rounded-2xl p-4 text-xs shadow-sm space-y-2">
        <div className="flex flex-wrap justify-between items-center gap-2 font-bold text-ink-olive">
          <span className="text-[10px] uppercase tracking-wider text-muted-clay flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-olive-green mr-1.5" />
            Methodology: Multi-Source Reference Data
          </span>
          {result.latestReferenceDate && (
            <span className="text-[10px] text-muted-clay">
              Reference data updated: <strong className="text-ink-olive">{result.latestReferenceDate}</strong>
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-clay leading-relaxed">
          TRUSTRA currently evaluates offers against a curated, timestamped reference dataset containing public travel-platform references, official rate sources, and structured incident and complaint records. Risk scores are calculated dynamically for each assessment. The prototype does not claim real-time retrieval from external platforms.
        </p>
      </div>
      
      {/* 1. Context Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-cream-surface border border-warm-border px-5 py-3 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-2 text-sm font-semibold text-ink-olive">
          <span className="bg-soft-olive px-2.5 py-0.5 rounded-full border border-warm-border text-xs">
            {input.location}
          </span>
          <span className="text-muted-clay">•</span>
          <span className="text-muted-clay">{input.serviceType}</span>
          <span className="text-muted-clay">•</span>
          <span className="text-muted-clay">{input.routeContext || "General Destination"}</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {isLive ? (
            <span className="bg-sage-low/10 text-sage-low border border-sage-low/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-sage-low mr-1.5 animate-pulse" />
              Multi-Source Reference Data
            </span>
          ) : (
            <span className="bg-amber-caution/10 text-amber-caution border border-amber-caution/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-caution mr-1.5 animate-pulse" />
              Mock Reference Fallback
            </span>
          )}
          
          <span className="text-[11px] uppercase font-bold tracking-wider text-muted-clay">Evidence Coverage:</span>
          <span className={`text-xs font-bold border px-2.5 py-0.5 rounded-full ${
            result.evidenceStrength === 'Strong' 
              ? 'bg-sage-low/10 text-sage-low border-sage-low/20'
              : result.evidenceStrength === 'Partial'
              ? 'bg-amber-caution/10 text-amber-caution border-amber-caution/20'
              : 'bg-muted-clay/10 text-muted-clay border-muted-clay/20'
          }`}>
            {result.evidenceStrength} ({result.evidenceCoverageRatio})
          </span>
        </div>
      </div>

      {/* 2. Overall Risk Hero */}
      <div className="bg-cream-surface border border-warm-border rounded-3xl p-6 sm:p-8 shadow-soft-warm relative overflow-hidden">
        {/* Soft warmth background blob */}
        <div 
          className="absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: currentColors.fill }}
        />
        
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="text-center md:text-left space-y-4 max-w-lg">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-clay">
              TRUSTRA ASSESSMENT REPORT
            </span>
            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <span className={`text-xs font-bold border px-3 py-1 rounded-full ${currentColors.bg} ${currentColors.text} ${currentColors.border}`}>
                {result.riskCategory} RISK
              </span>
              <span className="text-xs text-muted-clay">Calculated at {new Date().toLocaleTimeString()}</span>
            </div>

            {/* Evidence Confidence Card */}
            {result.assessmentConfidence && (
              <div className="inline-flex flex-col bg-soft-olive/45 border border-warm-border rounded-xl p-3 space-y-1 text-left max-w-xs mt-1 relative group cursor-help">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-olive-green">
                  <span>Evidence Confidence</span>
                  <span className={`ml-2 px-1.5 py-0.2 rounded font-mono text-[9px] ${
                    result.assessmentConfidence === 'HIGH' 
                      ? 'bg-sage-low/20 text-sage-low' 
                      : result.assessmentConfidence === 'MEDIUM' 
                      ? 'bg-amber-caution/20 text-amber-caution' 
                      : 'bg-muted-clay/20 text-muted-clay'
                  }`}>
                    {result.assessmentConfidence}
                  </span>
                </div>
                <div className="text-[11px] text-muted-clay leading-snug">
                  Evidence Quality Score: <strong className="text-ink-olive">{result.confidenceScore}/100</strong>
                </div>
                {/* Tooltip on hover */}
                <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-64 bg-ink-olive text-cream-surface text-[10px] p-2.5 rounded-lg shadow-xl z-50 leading-relaxed normal-case font-normal border border-warm-border/20">
                  This indicates the quality and consistency of the reference evidence available for this assessment. It is not the probability that the transaction is fraudulent.
                </div>
              </div>
            )}
            
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-ink-olive leading-snug">
              {result.riskCategory === 'LOW' && "Available signals indicate relatively low risk in this context."}
              {result.riskCategory === 'MODERATE' && "Some caution signals are present. Verify important details before proceeding."}
              {result.riskCategory === 'HIGH' && "Multiple available signals indicate elevated risk. Compare and verify before accepting."}
              {result.riskCategory === 'VERY HIGH' && "Available evidence indicates a strongly elevated risk pattern. Consider a verified alternative."}
            </h2>
            
            <p className="text-sm text-muted-clay leading-relaxed">
              {result.evidenceCoverageText}
            </p>

            <div className="flex items-center space-x-2 pt-2">
              <span className="text-xs font-bold text-ink-olive">Data channels verified:</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4].map((step) => (
                  <div 
                    key={step} 
                    className={`h-2 w-8 rounded-full transition-colors duration-300 ${
                      step <= parseInt(result.evidenceCoverageRatio) 
                        ? 'bg-olive-green' 
                        : 'bg-warm-border'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Big Circular Score */}
          <div className="flex flex-col items-center justify-center p-4 bg-warm-beige/20 rounded-2xl border border-warm-border w-40 h-40">
            <span className="text-xs uppercase font-bold text-muted-clay tracking-wide">Risk Score</span>
            <span 
              className="text-6xl font-bold font-sans tracking-tight transition-all"
              style={{ color: currentColors.fill }}
            >
              {animatedScore}
            </span>
            <span className="text-[11px] font-medium text-muted-clay mt-1">out of 100</span>
          </div>
        </div>
      </div>

      {/* 3. TRUSTRA Risk Journey Line */}
      <div className="bg-cream-surface border border-warm-border rounded-2xl p-5 shadow-sm overflow-x-auto">
        <h3 className="text-xs uppercase font-bold tracking-wider text-muted-clay mb-4">Assessment Journey Path</h3>
        <div className="min-w-[600px] flex items-center justify-between relative px-2">
          {/* Connecting line */}
          <div className="absolute left-6 right-6 top-[22px] h-[2px] bg-warm-border z-0" />
          
          {[
            { label: 'YOUR OFFER', desc: `${input.serviceType} - ${input.location}` },
            { label: 'CONTEXT MATCH', desc: input.routeContext || 'Destination' },
            { label: 'EVIDENCE RANGE', desc: `${result.evidenceCoverageRatio} Channels active` },
            { label: 'RISK SIGNALS', desc: `Score: ${result.overallScore}` },
            { label: 'SAFER NEXT STEP', desc: result.riskCategory === 'LOW' ? 'Proceed' : 'Compare / Verify' }
          ].map((node, i) => (
            <div key={i} className="flex flex-col items-center text-center relative z-10 w-28">
              <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${
                i === 4 
                  ? `${currentColors.bg} ${currentColors.text} ${currentColors.border}` 
                  : i < parseInt(result.evidenceCoverageRatio) + 1 
                  ? 'bg-soft-olive border-olive-green text-olive-green' 
                  : 'bg-cream-surface border-warm-border text-muted-clay'
              }`}>
                {i + 1}
              </div>
              <span className="text-[10px] font-bold text-ink-olive mt-2 block uppercase">{node.label}</span>
              <span className="text-[9px] text-muted-clay block mt-0.5 max-w-[95px] truncate">{node.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Why This Result + What To Do Next */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Why This Result */}
        <div className="bg-cream-surface border border-warm-border rounded-2xl p-6 shadow-soft-warm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-ink-olive mb-4 flex items-center">
              <TrendingUp className="mr-2 h-4 w-4 text-olive-green" />
              Why This Result?
            </h3>
            
            {result.explanations.length === 0 ? (
              <p className="text-xs text-muted-clay italic">
                No major risk indicators triggered. Offer pricing and operator details align with reference baselines.
              </p>
            ) : (
              <ul className="space-y-3">
                {result.explanations.map((exp: string, idx: number) => (
                  <li key={idx} className="flex items-start text-xs text-ink-olive leading-relaxed">
                    <span className="mr-2 text-brick-critical flex-shrink-0 mt-0.5">•</span>
                    <span>{exp}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {result.appliedMitigations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-warm-border">
              <h4 className="text-xs font-semibold text-olive-green mb-2">Applied Risk Mitigations:</h4>
              <ul className="space-y-1">
                {result.appliedMitigations.map((mit: string, i: number) => (
                  <li key={i} className="flex items-start text-[11px] text-olive-green">
                    <span className="mr-1.5 flex-shrink-0">✓</span>
                    <span>{mit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Recommendations */}
        <div className="bg-cream-surface border border-warm-border rounded-2xl p-6 shadow-soft-warm">
          <h3 className="text-base font-bold text-ink-olive mb-4 flex items-center">
            <Compass className="mr-2 h-4 w-4 text-olive-green" />
            Recommended Next Steps
          </h3>
          <ul className="space-y-3">
            {result.recommendations.map((rec: string, idx: number) => (
              <li key={idx} className="flex items-start p-2.5 rounded-xl border border-warm-border bg-warm-beige/20 text-xs text-ink-olive leading-relaxed">
                <span className="mr-2.5 w-5 h-5 rounded-full bg-soft-olive border border-warm-border text-olive-green flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                  {idx + 1}
                </span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Expandable Evidence Sources Section */}
      {result.referenceEvidence && result.referenceEvidence.length > 0 && (
        <div className="bg-cream-surface border border-warm-border rounded-2xl p-5 shadow-sm space-y-4">
          <button
            onClick={() => setShowReferenceEvidence(!showReferenceEvidence)}
            className="w-full flex items-center justify-between text-left focus:outline-none"
          >
            <div className="flex items-center space-x-2">
              <FileText className="h-4.5 w-4.5 text-olive-green" />
              <h4 className="text-sm font-bold text-ink-olive font-sans">
                View Reference Evidence ({result.referenceEvidence.length} matched sources)
              </h4>
            </div>
            <span className="text-xs text-olive-green font-semibold">
              {showReferenceEvidence ? "Hide Details" : "Show Details"}
            </span>
          </button>

          {showReferenceEvidence && (
            <div className="pt-2 border-t border-warm-border space-y-3">
              <p className="text-[11px] text-muted-clay">
                Matched price records utilized to compile pricing anomaly baselines and confidence scores:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.referenceEvidence.map((src, i) => (
                  <div key={i} className="bg-soft-olive/20 border border-warm-border rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-ink-olive text-xs">{src.source_name}</strong>
                        <span className="block text-[9px] uppercase text-muted-clay mt-0.5">
                          Type: {src.data_type.replace('_', ' ')}
                        </span>
                      </div>
                      {src.reliability_score !== undefined && (
                        <span className="bg-olive-green/10 text-olive-green px-1.5 py-0.5 rounded text-[10px] font-bold">
                          Reliability: {src.reliability_score}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between text-[11px] text-muted-clay border-t border-warm-border/50 pt-2">
                      <div>
                        Price: <strong className="text-ink-olive">₹{src.price}</strong>
                      </div>
                      <div>
                        Collected: <strong>{src.collected_at}</strong>
                      </div>
                    </div>

                    <div className="pt-1">
                      {src.source_url ? (
                        <a
                          href={src.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-[10px] font-bold text-olive-green hover:underline"
                        >
                          Source platform ↗
                        </a>
                      ) : (
                        <span className="text-[10px] italic text-muted-clay">
                          Official reference source
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Four Evidence Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase font-bold tracking-wider text-muted-clay">Evidence Details Breakdown</h3>
        
        <div className="grid grid-cols-1 gap-4">
          
          {/* Card A: Price Anomaly */}
          <div className="bg-cream-surface border border-warm-border rounded-2xl overflow-hidden shadow-sm">
            <button 
              onClick={() => toggleCard('price')}
              className="w-full flex items-center justify-between p-4 hover:bg-soft-olive-tint transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-soft-olive border border-warm-border text-olive-green">
                  <Scale className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs text-muted-clay uppercase font-bold tracking-wider">Evidence Family 1</span>
                  <h4 className="text-sm font-bold text-ink-olive">Price Anomaly Evaluation</h4>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-md ${
                  getRiskColorClasses(result.breakdown.price.status).bg
                } ${getRiskColorClasses(result.breakdown.price.status).text} ${
                  getRiskColorClasses(result.breakdown.price.status).border
                }`}>
                  {result.breakdown.price.score} / 25 pts ({result.breakdown.price.status})
                </span>
                {expandedCards.price ? <ChevronUp className="h-4 w-4 text-muted-clay" /> : <ChevronDown className="h-4 w-4 text-muted-clay" />}
              </div>
            </button>
            
            {expandedCards.price && (
              <div className="p-5 border-t border-warm-border bg-cream-surface space-y-4 animate-fade-in">
                <p className="text-xs text-ink-olive leading-relaxed">
                  {result.breakdown.price.explanation}
                </p>

                {priceRef ? (
                  <div className="space-y-6 pt-2">
                    {/* Range scale */}
                    <div className="relative">
                      {/* Scale Line */}
                      <div className="h-2 bg-warm-border rounded-full w-full" />
                      
                      {/* Colored markers for min/median/max */}
                      <div className="absolute left-[10%] top-0 h-2 w-1.5 bg-sage-low" />
                      <div className="absolute left-[50%] top-0 h-2 w-1.5 bg-amber-caution" />
                      <div className="absolute left-[90%] top-0 h-2 w-1.5 bg-brick-critical" />

                      {/* Quoted Price Indicator Pin */}
                      <div 
                        className="absolute -top-3.5 -ml-2.5 flex flex-col items-center transition-all duration-500"
                        style={{ left: `${markerPct}%` }}
                      >
                        <div className="w-5 h-5 rounded-full bg-cream-surface border-2 border-olive-green flex items-center justify-center shadow-md animate-bounce">
                          <span className="text-[7px] font-extrabold text-olive-green">Offer</span>
                        </div>
                        <div className="w-1.5 h-1.5 bg-olive-green rotate-45 -mt-0.5" />
                      </div>
                    </div>

                    {/* Labels */}
                    <div className="flex justify-between text-[11px] font-semibold text-muted-clay px-2">
                      <div className="text-left w-1/4">
                        <span className="block text-[9px] uppercase">Min Baseline</span>
                        <span className="text-ink-olive">{priceRef.currency}{priceRef.min}</span>
                      </div>
                      <div className="text-center w-1/3">
                        <span className="block text-[9px] uppercase">Typical Median</span>
                        <span className="text-olive-green font-bold">{priceRef.currency}{priceRef.median}</span>
                      </div>
                      <div className="text-right w-1/4">
                        <span className="block text-[9px] uppercase">Max Baseline</span>
                        <span className="text-ink-olive">{priceRef.currency}{priceRef.max}</span>
                      </div>
                    </div>

                    {/* Offer details */}
                    <div className="bg-warm-beige/25 rounded-xl p-3 border border-warm-border text-xs flex justify-between">
                      <div>
                        <span className="text-muted-clay">Your Quote:</span>
                        <strong className="text-ink-olive ml-1.5">{priceRef.currency}{input.quotedPrice}</strong>
                      </div>
                      <div>
                        <span className="text-muted-clay">Price Ratio:</span>
                        <strong className="text-ink-olive ml-1.5">{(input.quotedPrice / priceRef.median).toFixed(2)}x of typical</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-clay italic bg-warm-beige/20 p-3 rounded-xl border border-warm-border text-center">
                    No matching numerical baseline found in this region. Pricing score is evaluated against standardized general estimates.
                  </div>
                )}
                
                <div className="text-[9px] uppercase tracking-wider text-muted-clay pt-2 border-t border-warm-border">
                  Data Type: Curated Prototype Pricing Baseline | Context: {input.location} • {input.serviceType} | Status: Demo Scenarios Checked
                </div>
              </div>
            )}
          </div>

          {/* Card B: Incidents Similarity */}
          <div className="bg-cream-surface border border-warm-border rounded-2xl overflow-hidden shadow-sm">
            <button 
              onClick={() => toggleCard('incidents')}
              className="w-full flex items-center justify-between p-4 hover:bg-soft-olive-tint transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-soft-olive border border-warm-border text-olive-green">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs text-muted-clay uppercase font-bold tracking-wider">Evidence Family 2</span>
                  <h4 className="text-sm font-bold text-ink-olive">Incident Database Similarity Match</h4>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-md ${
                  getRiskColorClasses(result.breakdown.incidents.status).bg
                } ${getRiskColorClasses(result.breakdown.incidents.status).text} ${
                  getRiskColorClasses(result.breakdown.incidents.status).border
                }`}>
                  {result.breakdown.incidents.score} / 30 pts ({result.breakdown.incidents.status})
                </span>
                {expandedCards.incidents ? <ChevronUp className="h-4 w-4 text-muted-clay" /> : <ChevronDown className="h-4 w-4 text-muted-clay" />}
              </div>
            </button>
            
            {expandedCards.incidents && (
              <div className="p-5 border-t border-warm-border bg-cream-surface space-y-3 animate-fade-in">
                <p className="text-xs text-ink-olive leading-relaxed">
                  {result.breakdown.incidents.explanation}
                </p>
                <div className="text-[9px] uppercase tracking-wider text-muted-clay pt-2 border-t border-warm-border">
                  Data Type: Anonymized Tourist Incident Logbook | Context: {input.location} • {input.serviceType} | Status: Checked
                </div>
              </div>
            )}
          </div>

          {/* Card C: Location/Complaint Density */}
          <div className="bg-cream-surface border border-warm-border rounded-2xl overflow-hidden shadow-sm">
            <button 
              onClick={() => toggleCard('complaints')}
              className="w-full flex items-center justify-between p-4 hover:bg-soft-olive-tint transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-soft-olive border border-warm-border text-olive-green">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs text-muted-clay uppercase font-bold tracking-wider">Evidence Family 3</span>
                  <h4 className="text-sm font-bold text-ink-olive">Destination Complaint Density</h4>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-md ${
                  result.breakdown.complaints.confidence === 'HIGH' 
                    ? 'bg-sage-low/10 text-sage-low border-sage-low/20' 
                    : result.breakdown.complaints.confidence === 'MEDIUM' 
                    ? 'bg-amber-caution/10 text-amber-caution border-amber-caution/20' 
                    : 'bg-muted-clay/10 text-muted-clay border-muted-clay/20'
                }`}>
                  {result.breakdown.complaints.confidence} CONFIDENCE
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-md ${
                  getRiskColorClasses(result.breakdown.complaints.status).bg
                } ${getRiskColorClasses(result.breakdown.complaints.status).text} ${
                  getRiskColorClasses(result.breakdown.complaints.status).border
                }`}>
                  {result.breakdown.complaints.score} / 25 pts ({result.breakdown.complaints.status})
                </span>
                {expandedCards.complaints ? <ChevronUp className="h-4 w-4 text-muted-clay" /> : <ChevronDown className="h-4 w-4 text-muted-clay" />}
              </div>
            </button>
            
            {expandedCards.complaints && (
              <div className="p-5 border-t border-warm-border bg-cream-surface space-y-3 animate-fade-in relative group">
                <p className="text-xs text-ink-olive leading-relaxed">
                  {result.breakdown.complaints.explanation}
                </p>
                <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-muted-clay pt-2 border-t border-warm-border">
                  <span>Data Type: Localized Grievance Registry | Context: {input.location} • {input.serviceType}</span>
                  <div className="relative cursor-help text-olive-green hover:underline">
                    ℹ About complaint data
                    <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-64 bg-ink-olive text-cream-surface text-[10px] p-2.5 rounded-lg shadow-xl z-50 leading-relaxed normal-case">
                      Counts represent aggregated prototype reference records used for destination-level risk analysis. Confidence reflects the quality and consistency of available reference information.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card D: Suspicious Behavioral Patterns */}
          <div className="bg-cream-surface border border-warm-border rounded-2xl overflow-hidden shadow-sm">
            <button 
              onClick={() => toggleCard('patterns')}
              className="w-full flex items-center justify-between p-4 hover:bg-soft-olive-tint transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-soft-olive border border-warm-border text-olive-green">
                  <Sliders className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs text-muted-clay uppercase font-bold tracking-wider">Evidence Family 4</span>
                  <h4 className="text-sm font-bold text-ink-olive">Suspicious Transaction Patterns</h4>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-md ${
                  getRiskColorClasses(result.breakdown.patterns.status).bg
                } ${getRiskColorClasses(result.breakdown.patterns.status).text} ${
                  getRiskColorClasses(result.breakdown.patterns.status).border
                }`}>
                  {result.breakdown.patterns.score} / 20 pts ({result.breakdown.patterns.status})
                </span>
                {expandedCards.patterns ? <ChevronUp className="h-4 w-4 text-muted-clay" /> : <ChevronDown className="h-4 w-4 text-muted-clay" />}
              </div>
            </button>
            
            {expandedCards.patterns && (
              <div className="p-5 border-t border-warm-border bg-cream-surface space-y-3 animate-fade-in">
                <p className="text-xs text-ink-olive leading-relaxed">
                  {result.breakdown.patterns.explanation}
                </p>
                <div className="text-[9px] uppercase tracking-wider text-muted-clay pt-2 border-t border-warm-border">
                  Data Type: Tourist-supplied behavioral logs | Context: Real-time checkboxes | Status: Self-reported
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 6. Signature X-Factor: What Would Improve This Assessment */}
      <div className="bg-cream-surface border-2 border-olive-green rounded-3xl p-6 sm:p-8 shadow-soft-warm-lg space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-warm-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-ink-olive font-sans">
              🛠️ What Would Improve This Assessment?
            </h3>
            <p className="text-xs text-muted-clay">
              Interact with the variables below to simulate a safer transaction condition.
            </p>
          </div>
          
          <div className="bg-soft-olive border border-warm-border p-3 rounded-2xl flex items-center space-x-3">
            <div className="text-right">
              <span className="block text-[9px] uppercase font-bold text-ink-olive opacity-80">Potential Score</span>
              <span 
                className="text-lg font-bold transition-colors"
                style={{ color: simulatedColors.fill }}
              >
                {simulatedResult.overallScore} ({simulatedResult.riskCategory})
              </span>
            </div>
            {scoreReduction > 0 && (
              <span className="text-xs font-bold text-sage-low bg-sage-low bg-opacity-10 border border-sage-low px-2 py-0.5 rounded-md">
                ↓ {scoreReduction} pts
              </span>
            )}
          </div>
        </div>

        {/* What-If Toggles (Toggle Chips) */}
        <div className="space-y-4">
          <h4 className="text-xs uppercase font-bold tracking-wider text-muted-clay">Simulate Mitigation Actions</h4>
          <div className="flex flex-wrap gap-2">
            
            {/* Action 1: Price negotiation */}
            {priceRef && input.quotedPrice > priceRef.median && (
              <button
                onClick={() => setWhatIf(prev => ({ ...prev, adjustPrice: !prev.adjustPrice }))}
                className={`flex items-center px-4 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                  whatIf.adjustPrice 
                    ? 'bg-olive-green text-cream-surface border-transparent shadow-sm'
                    : 'bg-cream-surface text-ink-olive border-warm-border hover:bg-soft-olive'
                }`}
              >
                {whatIf.adjustPrice && <Check className="h-3.5 w-3.5 mr-1.5" />}
                Adjust quote to local median ({priceRef.currency}{priceRef.median})
              </button>
            )}

            {/* Action 2: Verification */}
            {!input.providerVerified && (
              <button
                onClick={() => setWhatIf(prev => ({ ...prev, verifyProvider: !prev.verifyProvider }))}
                className={`flex items-center px-4 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                  whatIf.verifyProvider
                    ? 'bg-olive-green text-cream-surface border-transparent shadow-sm'
                    : 'bg-cream-surface text-ink-olive border-warm-border hover:bg-soft-olive'
                }`}
              >
                {whatIf.verifyProvider && <Check className="h-3.5 w-3.5 mr-1.5" />}
                Hire a verified operator (-12 pts)
              </button>
            )}

            {/* Action 3: Receipt */}
            {input.noReceipt && (
              <button
                onClick={() => setWhatIf(prev => ({ ...prev, receiptAvailable: !prev.receiptAvailable }))}
                className={`flex items-center px-4 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                  whatIf.receiptAvailable
                    ? 'bg-olive-green text-cream-surface border-transparent shadow-sm'
                    : 'bg-cream-surface text-ink-olive border-warm-border hover:bg-soft-olive'
                }`}
              >
                {whatIf.receiptAvailable && <Check className="h-3.5 w-3.5 mr-1.5" />}
                Insist on a written breakdown/receipt
              </button>
            )}

            {/* Action 4: Payment pressure */}
            {input.paymentPressure && (
              <button
                onClick={() => setWhatIf(prev => ({ ...prev, noPressure: !prev.noPressure }))}
                className={`flex items-center px-4 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                  whatIf.noPressure
                    ? 'bg-olive-green text-cream-surface border-transparent shadow-sm'
                    : 'bg-cream-surface text-ink-olive border-warm-border hover:bg-soft-olive'
                }`}
              >
                {whatIf.noPressure && <Check className="h-3.5 w-3.5 mr-1.5" />}
                Remove advance payment pressure
              </button>
            )}

          </div>

          {/* Actionable buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-warm-border">
            <p className="text-xs text-muted-clay">
              *Toggling these options demonstrates how resolving specific issues directly lowers transaction risk.
            </p>
            <button
              onClick={() => onOpenSimulator(simulatedInput)}
              className="inline-flex items-center text-xs font-bold text-cream-surface bg-olive-green hover:bg-deep-olive px-5 py-3 rounded-full transition-transform active:scale-95 shadow-sm"
            >
              Simulate This Change
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Action Row (Compare, Modify, details) */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-2">
          <button
            onClick={onModify}
            className="px-5 py-2.5 bg-cream-surface border border-warm-border text-ink-olive hover:bg-soft-olive font-semibold text-xs rounded-full transition-colors active:scale-95"
          >
            Modify Offer
          </button>
          <button
            onClick={() => onCompareToggle(simulatedInput)}
            className="px-5 py-2.5 bg-cream-surface border border-warm-border text-ink-olive hover:bg-soft-olive font-semibold text-xs rounded-full transition-colors active:scale-95 flex items-center"
          >
            Compare Original vs. Revised
          </button>
        </div>

        <button
          onClick={() => setShowTransparency(!showTransparency)}
          className="text-xs font-bold text-olive-green hover:text-deep-olive underline decoration-dotted decoration-2 underline-offset-4"
        >
          {showTransparency ? "Hide Mathematical Breakdown" : "View Assessment Details (Transparency Mode)"}
        </button>
      </div>

      {/* 8. Collapsible Judge Transparency Drawer */}
      {showTransparency && (
        <div className="bg-cream-surface border border-warm-border rounded-2xl p-5 shadow-inner space-y-4 animate-fade-in font-mono text-xs">
          <div className="flex justify-between items-center border-b border-warm-border pb-2 text-[10px] uppercase font-bold text-muted-clay">
            <span>Risk Vector Component</span>
            <span>Assigned points / Max possible</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>1. Price Anomaly Risk contribution</span>
              <span className="font-bold">{result.breakdown.price.score} / 25</span>
            </div>
            <div className="flex justify-between">
              <span>2. Historical Incident Similarity match</span>
              <span className="font-bold">{result.breakdown.incidents.score} / 30</span>
            </div>
            <div className="flex justify-between">
              <span>3. Localized Complaint Density</span>
              <span className="font-bold">{result.breakdown.complaints.score} / 25</span>
            </div>
            <div className="flex justify-between">
              <span>4. Behavioral Patterns (checked tags)</span>
              <span className="font-bold">{result.breakdown.patterns.score} / 20</span>
            </div>
            
            {input.providerVerified && (
              <div className="flex justify-between text-olive-green border-t border-dashed border-warm-border pt-1">
                <span>Verification Mitigation deduction</span>
                <span className="font-bold">-12 / Mitigated</span>
              </div>
            )}
            
            <div className="flex justify-between border-t-2 border-ink-olive pt-2 text-sm font-bold text-ink-olive">
              <span>OVERALL AGGREGATE RISK SCORE</span>
              <span>{result.overallScore} / 100</span>
            </div>
          </div>
          
          <div className="pt-2 text-[10px] text-muted-clay leading-relaxed">
            Formula: Min(100, Max(0, PriceScore + IncidentScore + ComplaintScore + PatternScore - (Verified ? 12 : 0)))
          </div>
        </div>
      )}

      {/* 9. Disclaimer Strip */}
      <div className="border-t border-warm-border pt-4 text-center">
        <p className="text-[10px] text-muted-clay tracking-wide uppercase font-semibold">
          Disclaimer: Risk assessment ≠ proof of fraud. Based on available database matching parameters and customer self-report indications.
        </p>
      </div>

    </div>
  );
};

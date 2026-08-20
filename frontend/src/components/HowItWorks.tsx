import React from 'react';
import { Percent, ShieldAlert, Award, FileSpreadsheet, Eye } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const scoringFactors = [
    {
      title: "Incident Similarity (30%)",
      description: "Evaluates historical verified safety or major fraud incidents matching the location and service type.",
      details: "Critical alerts (extortion, fraud unions) automatically add maximum weight, whereas low-severity items contribute less.",
      icon: ShieldAlert,
      color: "border-brick-critical text-brick-critical bg-brick-critical/5"
    },
    {
      title: "Location Complaint Density (25%)",
      description: "Aggregates registered customer complaints for the specific service in the destination.",
      details: "Compiles volume of reports regarding overcharging, commissions-schemes, aggressive behavior, or detours.",
      icon: FileSpreadsheet,
      color: "border-amber-caution text-amber-caution bg-amber-caution/5"
    },
    {
      title: "Price Anomaly Risk (25%)",
      description: "Compares the quoted price against a localized pricing baseline for the matching route context.",
      details: "Triggers anomalies if the price is >1.25x the local median (overcharging) OR <0.6x the local median (indicates bait-and-switch).",
      icon: Percent,
      color: "border-olive-green text-olive-green bg-soft-olive"
    },
    {
      title: "Behavioral Patterns (20%)",
      description: "Analyzes standard transaction caution signals reported by the tourist during the offer stage.",
      details: "Triggers on signals like immediate cash/advance pressure, refusal to give receipts, unverified guide credentials, etc.",
      icon: Award,
      color: "border-sage-low text-sage-low bg-sage-low/5"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-12">
        <span className="text-xs uppercase font-semibold tracking-wider text-muted-clay bg-soft-olive px-3 py-1 rounded-full border border-warm-border">
          Methodology
        </span>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold font-sans text-ink-olive">
          How TRUSTRA Works
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-clay max-w-xl mx-auto">
          TRUSTRA uses a rule-based, explainable scoring model to evaluate tourism transactions using localized evidence layers.
        </p>
      </div>

      {/* Grid of factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {scoringFactors.map((factor, idx) => {
          const Icon = factor.icon;
          return (
            <div 
              key={idx}
              className={`p-6 rounded-2xl bg-cream-surface border border-warm-border hover:shadow-soft-warm hover:-translate-y-1 transition-all duration-200`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2.5 rounded-xl border ${factor.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-ink-olive font-sans">
                  {factor.title}
                </h3>
              </div>
              <p className="text-sm font-medium text-ink-olive leading-relaxed mb-2">
                {factor.description}
              </p>
              <p className="text-xs text-muted-clay leading-relaxed">
                {factor.details}
              </p>
            </div>
          );
        })}
      </div>

      {/* Product Boundaries Block */}
      <div className="bg-cream-surface border border-warm-border rounded-2xl p-6 sm:p-8 shadow-soft-warm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-soft-olive text-olive-green rounded-xl border border-warm-border">
            <Eye className="h-6 w-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink-olive font-sans">
            Product Boundaries: What TRUSTRA Is Not
          </h2>
        </div>
        
        <div className="space-y-4">
          <div className="border-l-4 border-brick-critical pl-4 py-1">
            <h4 className="text-sm font-semibold text-ink-olive">Not a "Scam/Fraud Detector"</h4>
            <p className="text-xs sm:text-sm text-muted-clay mt-1">
              TRUSTRA evaluates risk levels based on historical patterns and comparisons. It **never** accuses a specific, named driver, guide, or business of fraud. Our model is built around the core principle: <strong className="text-ink-olive">RISK ≠ PROOF OF FRAUD</strong>.
            </p>
          </div>

          <div className="border-l-4 border-amber-caution pl-4 py-1">
            <h4 className="text-sm font-semibold text-ink-olive">Not a Safety Guarantee</h4>
            <p className="text-xs sm:text-sm text-muted-clay mt-1">
              A low-risk assessment indicates a lack of negative signals in our current database, but it is **not a guarantee of safety**. Tourists should always maintain basic awareness and follow local authority guidelines.
            </p>
          </div>

          <div className="border-l-4 border-olive-green pl-4 py-1">
            <h4 className="text-sm font-semibold text-ink-olive">Not a Black-Box AI Predictor</h4>
            <p className="text-xs sm:text-sm text-muted-clay mt-1">
              We do not use untraceable neural networks or LLMs to guess scores. Every single point is accounted for using explicit, deterministic calculations, meaning you can audit exactly why a score was generated.
            </p>
          </div>

          <div className="border-l-4 border-muted-clay pl-4 py-1">
            <h4 className="text-sm font-semibold text-ink-olive">Curated Prototype Constraints</h4>
            <p className="text-xs sm:text-sm text-muted-clay mt-1">
              For this prototype build, our databases are seeded with curated reference data spanning key tourist circuits (Jaipur, Goa, Manali, Mumbai, Agra). Locations outside these bounds will trigger a "Limited Evidence" badge, advising cautious navigation.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-warm-border text-center text-xs text-muted-clay">
          Disclaimer: Risk assessment is based on localized sample parameters compiled for hackathon demonstration.
        </div>
      </div>
    </div>
  );
};

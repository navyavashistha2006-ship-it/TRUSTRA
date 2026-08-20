import { 
  MOCK_PRICES, 
  MOCK_COMPLAINTS, 
  MOCK_INCIDENTS
} from '../data/mockData';
import type { PriceReference, IncidentData } from '../data/mockData';

export interface AssessmentInput {
  location: string;
  serviceType: string;
  routeContext: string;
  quotedPrice: number;
  paymentPressure: boolean;
  noReceipt: boolean;
  unexpectedCharges: boolean;
  couldNotVerifyOperator: boolean;
  unverifiedBookingChannel: boolean;
  otherContext?: string;
  providerVerified: boolean;
}

export interface RiskBreakdownItem {
  score: number;
  maxScore: number;
  status: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  explanation: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT DATA';
}

export interface RiskAssessmentResult {
  overallScore: number;
  riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH';
  evidenceStrength: 'Strong' | 'Partial' | 'Limited';
  evidenceCoverageText: string;
  evidenceCoverageRatio: string;
  breakdown: {
    price: RiskBreakdownItem;
    complaints: RiskBreakdownItem;
    incidents: RiskBreakdownItem;
    patterns: RiskBreakdownItem;
  };
  explanations: string[];
  recommendations: string[];
  matchedPriceRef?: PriceReference;
  appliedMitigations: string[];
  assessmentConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore?: number;
  referenceEvidence?: Array<{
    source_name: string;
    price?: number;
    collected_at?: string;
    data_type: string;
    reliability_score?: number;
    source_url?: string;
  }>;
  latestReferenceDate?: string;
}

// Simple normalization helper for fuzzy/reversed matching
const normalizeString = (str: string): string => {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const checkRouteMatch = (inputRoute: string, refRoute: string): boolean => {
  const normInput = normalizeString(inputRoute);
  const normRef = normalizeString(refRoute);
  
  if (normInput === normRef) return true;
  if (normInput.includes(normRef) || normRef.includes(normInput)) return true;
  
  // Check for reversed routes, e.g., "airport to hotel" vs "hotel to airport"
  if (normInput.includes('to') && normRef.includes('to')) {
    const inputParts = normInput.split('to');
    const refParts = normRef.split('to');
    if (inputParts.length === 2 && refParts.length === 2) {
      const reversedInput = `${inputParts[1]}to${inputParts[0]}`;
      return reversedInput === normRef;
    }
  }
  
  return false;
};

export const computeRisk = (input: AssessmentInput): RiskAssessmentResult => {
  const explanations: string[] = [];
  const appliedMitigations: string[] = [];
  
  const normLocation = input.location.trim().toLowerCase();
  const normService = input.serviceType.trim().toLowerCase();
  
  // ----------------------------------------------------
  // 1. PRICE ANOMALY ENGINE (Max 25 pts)
  // ----------------------------------------------------
  let priceScore = 0;
  let priceStatus: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  let priceExplanation = "No pricing reference data was found for this location/service.";
  
  // Try to find matching price reference (location, service, and route)
  let matchedPriceRef = MOCK_PRICES.find(p => 
    p.location.toLowerCase() === normLocation && 
    p.serviceType.toLowerCase() === normService &&
    checkRouteMatch(input.routeContext, p.routeContext)
  );
  
  // Fallback to location and service only if exact route route match fails
  if (!matchedPriceRef) {
    matchedPriceRef = MOCK_PRICES.find(p => 
      p.location.toLowerCase() === normLocation && 
      p.serviceType.toLowerCase() === normService
    );
  }
  
  if (matchedPriceRef) {
    const { min, median, max } = matchedPriceRef;
    const ratio = input.quotedPrice / median;
    
    if (ratio > 1.0) {
      // High price anomaly
      // Linear scaling: ratio of 1.0 -> 0 pts, ratio of 3.0+ -> 25 pts
      priceScore = Math.min(25, (ratio - 1.0) * 12.5);
      
      if (ratio > 2.0) {
        priceStatus = 'CRITICAL';
        priceExplanation = `Quoted price (${matchedPriceRef.currency}${input.quotedPrice}) is significantly elevated at ${ratio.toFixed(1)}x the reference median (${matchedPriceRef.currency}${median}).`;
        explanations.push(`Pricing is highly anomalous: ${ratio.toFixed(1)}x typical rates.`);
      } else if (ratio > 1.25) {
        priceStatus = 'HIGH';
        priceExplanation = `Quoted price (${matchedPriceRef.currency}${input.quotedPrice}) is elevated at ${ratio.toFixed(1)}x the reference median (${matchedPriceRef.currency}${median}).`;
        explanations.push(`Pricing is moderately higher than reference rates (${ratio.toFixed(1)}x median).`);
      } else {
        priceStatus = 'MODERATE';
        priceExplanation = `Quoted price is slightly above the typical median of ${matchedPriceRef.currency}${median}.`;
      }
    } else if (ratio < 0.6) {
      // Abnormally low price (Bait & Switch Indicator)
      // Linear scaling: ratio of 0.6 -> 0 pts, ratio of 0.2- -> 15 pts
      priceScore = Math.min(15, (1.0 - ratio / 0.6) * 15);
      priceStatus = 'HIGH';
      priceExplanation = `Quoted price (${matchedPriceRef.currency}${input.quotedPrice}) is abnormally low (under 60% of the median reference rate of ${matchedPriceRef.currency}${median}). This could indicate a bait-and-switch risk.`;
      explanations.push(`Abnormally low pricing detected, which is a common indicator of bait-and-switch tactics where tourists are guided to commissions-driven shops later.`);
    } else {
      priceScore = 0;
      priceStatus = 'LOW';
      priceExplanation = `Quoted price is within the normal local range (${matchedPriceRef.currency}${min} - ${matchedPriceRef.currency}${max}).`;
    }
  } else {
    // If no match, check if we have any pricing for this city
    const hasCityPricing = MOCK_PRICES.some(p => p.location.toLowerCase() === normLocation);
    if (hasCityPricing) {
      priceScore = 5; // Slight baseline risk for unlisted routes
      priceStatus = 'MODERATE';
      priceExplanation = "No pricing baseline exists for this specific route. Standard regional estimates applied.";
    }
  }
  
  // ----------------------------------------------------
  // 2. LOCATION & COMPLAINT ENGINE (Max 25 pts)
  // ----------------------------------------------------
  let complaintsScore = 0;
  let complaintsStatus: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  let complaintsExplanation = "No elevated complaints recorded for this location.";
  
  const matchedComplaint = MOCK_COMPLAINTS.find(c => 
    c.location.toLowerCase() === normLocation && 
    c.serviceType.toLowerCase() === normService
  );
  
  if (matchedComplaint) {
    const { complaintCount, severity, topIssues } = matchedComplaint;
    
    // Scale score based on severity and count
    let base = 0;
    if (severity === 'HIGH') {
      base = 15;
      complaintsStatus = 'CRITICAL';
    } else if (severity === 'MODERATE') {
      base = 10;
      complaintsStatus = 'HIGH';
    } else {
      base = 5;
      complaintsStatus = 'MODERATE';
    }
    
    complaintsScore = Math.min(25, base + Math.min(10, complaintCount / 5));
    complaintsExplanation = `${complaintCount} active complaints registered regarding ${matchedComplaint.serviceType} services in ${matchedComplaint.location}. Primary complaints: ${topIssues.slice(0, 2).join(', ')}.`;
    
    explanations.push(`High density of complaints for ${input.serviceType} services in ${input.location} (${complaintCount} reports).`);
  } else {
    // Check if general complaints exist for the city
    const cityComplaints = MOCK_COMPLAINTS.filter(c => c.location.toLowerCase() === normLocation);
    if (cityComplaints.length > 0) {
      complaintsScore = 4;
      complaintsStatus = 'MODERATE';
      complaintsExplanation = "No service-specific complaints, but the destination has general active complaint logs.";
    }
  }
  
  // ----------------------------------------------------
  // 3. INCIDENT ENGINE (Max 30 pts)
  // ----------------------------------------------------
  let incidentScore = 0;
  let incidentStatus: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  let incidentExplanation = "No recent safety or fraud incidents logged for this route.";
  
  const matchingIncidents = MOCK_INCIDENTS.filter(i => 
    i.location.toLowerCase() === normLocation && 
    i.serviceType.toLowerCase() === normService
  );
  
  if (matchingIncidents.length > 0) {
    // Find the highest severity incident
    let highestSeverityVal = 0;
    let worstIncident: IncidentData = matchingIncidents[0];
    
    matchingIncidents.forEach(inc => {
      let val = 0;
      if (inc.severity === 'CRITICAL') val = 4;
      else if (inc.severity === 'HIGH') val = 3;
      else if (inc.severity === 'MODERATE') val = 2;
      else if (inc.severity === 'LOW') val = 1;
      
      if (val > highestSeverityVal) {
        highestSeverityVal = val;
        worstIncident = inc;
      }
    });
    
    if (highestSeverityVal === 4) {
      incidentScore = 30;
      incidentStatus = 'CRITICAL';
    } else if (highestSeverityVal === 3) {
      incidentScore = 22;
      incidentStatus = 'HIGH';
    } else if (highestSeverityVal === 2) {
      incidentScore = 14;
      incidentStatus = 'MODERATE';
    } else {
      incidentScore = 8;
      incidentStatus = 'LOW';
    }
    
    incidentExplanation = `Found ${matchingIncidents.length} logged incident(s). Most severe: '${worstIncident.title}' (${worstIncident.category}, Severity: ${worstIncident.severity}).`;
    explanations.push(`A recent ${worstIncident.severity.toLowerCase()} severity incident of type "${worstIncident.category}" was reported nearby: "${worstIncident.title}".`);
  }
  
  // ----------------------------------------------------
  // 4. SERVICE PATTERN ENGINE (Max 20 pts)
  // ----------------------------------------------------
  let patternScore = 0;
  let selectedSignalsCount = 0;
  const patternDetails: string[] = [];
  
  if (input.paymentPressure) {
    patternScore += 5;
    selectedSignalsCount++;
    patternDetails.push("immediate payment pressure");
    explanations.push("High pressure sales tactics: driver/operator demanding immediate deposit or advance payment.");
  }
  if (input.noReceipt) {
    patternScore += 4;
    selectedSignalsCount++;
    patternDetails.push("absence of written breakdown/receipt");
    explanations.push("Lack of invoice: provider refused or avoided providing a written rate card or receipt.");
  }
  if (input.unexpectedCharges) {
    patternScore += 5;
    selectedSignalsCount++;
    patternDetails.push("unexpected additional charges");
    explanations.push("Unexpected fees: operator modified pricing mid-conversation or added mandatory extra charges.");
  }
  if (input.couldNotVerifyOperator) {
    patternScore += 4;
    selectedSignalsCount++;
    patternDetails.push("unverifiable operator credentials");
    explanations.push("Credentials missing: provider could not produce an official guide ID, license, or badge.");
  }
  if (input.unverifiedBookingChannel) {
    patternScore += 4;
    selectedSignalsCount++;
    patternDetails.push("unofficial booking channel");
    explanations.push("Offline booking: offer came via street solicitation rather than an official kiosk or pre-verified app.");
  }
  
  patternScore = Math.min(20, patternScore);
  
  let patternStatus: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (patternScore >= 15) patternStatus = 'CRITICAL';
  else if (patternScore >= 9) patternStatus = 'HIGH';
  else if (patternScore >= 4) patternStatus = 'MODERATE';
  
  let patternExplanation = selectedSignalsCount > 0 
    ? `Suspicious patterns detected: ${patternDetails.join(', ')}.` 
    : "No suspicious booking or behavioral signals selected.";
  
  // ----------------------------------------------------
  // AGGREGATION & MITIGATION
  // ----------------------------------------------------
  let overallScore = priceScore + complaintsScore + incidentScore + patternScore;
  
  // Apply Mitigations
  if (input.providerVerified) {
    const mitigationAmt = 12;
    overallScore -= mitigationAmt;
    appliedMitigations.push(`Verified Service Provider status reduces overall risk rating (-${mitigationAmt} points).`);
    explanations.push(`Mitigating factor: The service provider is officially registered or verified, increasing reliability.`);
  }
  
  overallScore = Math.min(100, Math.max(0, Math.round(overallScore)));
  
  // Risk Category
  let riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' = 'LOW';
  if (overallScore >= 80) {
    riskCategory = 'VERY HIGH';
  } else if (overallScore >= 60) {
    riskCategory = 'HIGH';
  } else if (overallScore >= 30) {
    riskCategory = 'MODERATE';
  } else {
    riskCategory = 'LOW';
  }
  
  // Evidence Strength Calculation
  let evidenceFamiliesMatched = 0;
  if (matchedPriceRef) evidenceFamiliesMatched++;
  if (matchedComplaint) evidenceFamiliesMatched++;
  if (matchingIncidents.length > 0) evidenceFamiliesMatched++;
  evidenceFamiliesMatched++; // Patterns / input is always available
  
  let evidenceStrength: 'Strong' | 'Partial' | 'Limited' = 'Limited';
  if (evidenceFamiliesMatched === 4) {
    evidenceStrength = 'Strong';
  } else if (evidenceFamiliesMatched >= 2) {
    evidenceStrength = 'Partial';
  }
  
  const evidenceCoverageText = evidenceStrength === 'Strong' 
    ? "All primary data channels matched (Pricing, Complaints, Incidents, and Behavioral Signals)."
    : evidenceStrength === 'Partial'
    ? "Partial regional reference matches. Some risk categories are using regional baselines."
    : "Limited local database records found. Assessment relies heavily on customer-submitted context and behavioral patterns.";
  
  // Dynamic Recommendations
  const recommendations: string[] = [];
  if (riskCategory === 'LOW') {
    recommendations.push("Proceed with standard traveler awareness.");
    recommendations.push("Request a written receipt outlining the service scope and final agreed price.");
    recommendations.push("Keep emergency helpline numbers accessible in your dialer.");
  } else if (riskCategory === 'MODERATE') {
    if (matchedPriceRef && input.quotedPrice > matchedPriceRef.median) {
      recommendations.push(`Negotiate closer to the local median rate of ${matchedPriceRef.currency}${matchedPriceRef.median} if possible.`);
    }
    recommendations.push("Confirm that toll charges, parking fees, and guide entrance tickets are clearly included in the quoted price.");
    recommendations.push("Do not pay the full amount upfront; offer to pay a small deposit or pay at the destination.");
  } else if (riskCategory === 'HIGH') {
    recommendations.push("Compare this quote with a verified tourist helpdesk or official pre-paid counter nearby.");
    recommendations.push("Insist on a written receipt or messaging booking confirmation before embarking.");
    recommendations.push("Share your location/ride tracking link with a family member or friend.");
    recommendations.push("Politely decline if the operator continues to pressure for upfront payments or gem shop detours.");
  } else { // VERY HIGH
    recommendations.push("Consider a verified alternative immediately (e.g., official Government prepaid stand, licensed tour operators, or certified hotels).");
    recommendations.push("Do not handover your passport, identification, or valuables for 'verification' under any circumstances.");
    recommendations.push("Avoid traveling alone or during late hours on this route under these specific offer terms.");
    recommendations.push("If you feel unsafe or experience intimidation, proceed directly to the nearest Tourist Police booth.");
  }
  
  return {
    overallScore,
    riskCategory,
    evidenceStrength,
    evidenceCoverageText,
    evidenceCoverageRatio: `${evidenceFamiliesMatched}/4`,
    breakdown: {
      price: {
        score: Math.round(priceScore),
        maxScore: 25,
        status: priceStatus,
        explanation: priceExplanation
      },
      complaints: {
        score: Math.round(complaintsScore),
        maxScore: 25,
        status: complaintsStatus,
        explanation: complaintsExplanation
      },
      incidents: {
        score: Math.round(incidentScore),
        maxScore: 30,
        status: incidentStatus,
        explanation: incidentExplanation
      },
      patterns: {
        score: Math.round(patternScore),
        maxScore: 20,
        status: patternStatus,
        explanation: patternExplanation
      }
    },
    explanations,
    recommendations,
    matchedPriceRef,
    appliedMitigations
  };
};

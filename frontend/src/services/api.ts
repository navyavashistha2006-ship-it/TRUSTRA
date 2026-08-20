import type {
  AssessmentInput,
  RiskAssessmentResult
} from '../utils/riskEngine';

// TRUSTRA Backend URL
// Uses environment variable if available.
// Otherwise uses this computer's network IP so other devices
// on the same network can access the backend.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://trustra-backend.vercel.app';


export const mapBackendResponse = (
  res: any
): RiskAssessmentResult => {

  const mapBreakdownItem = (
    item: any,
    maxScore: number
  ) => {

    let status:
      | 'LOW'
      | 'MODERATE'
      | 'HIGH'
      | 'CRITICAL' = 'LOW';

    const pct = item.score / maxScore;

    if (pct >= 0.8) {
      status = 'CRITICAL';
    } else if (pct >= 0.5) {
      status = 'HIGH';
    } else if (pct >= 0.2) {
      status = 'MODERATE';
    }

    return {
      score: item.score,
      maxScore: maxScore,
      status: status,
      explanation: item.explanation,
      confidence: item.confidence
    };
  };


  // Extract applied mitigations
  const appliedMitigations: string[] = [];

  if (res.contributing_factors) {

    for (const factor of res.contributing_factors) {

      if (
        factor.toLowerCase().includes('mitigating') ||
        factor.toLowerCase().includes('verified')
      ) {
        appliedMitigations.push(factor);
      }
    }
  }


  // Map backend confidence to frontend evidence strength
  const evidenceStrengthMap: Record<
    string,
    'Strong' | 'Partial' | 'Limited'
  > = {
    HIGH: 'Strong',
    MEDIUM: 'Partial',
    LOW: 'Limited'
  };


  return {

    overallScore: res.overall_score,

    riskCategory: res.category,

    evidenceStrength:
      evidenceStrengthMap[res.confidence.overall] ||
      'Limited',

    evidenceCoverageText:
      res.confidence.reason,

    evidenceCoverageRatio:
      res.reference_price &&
      res.reference_price.sample_size > 0
        ? '4/4'
        : '2/4',


    breakdown: {

      price: mapBreakdownItem(
        res.breakdown.price_anomaly,
        25
      ),

      incidents: mapBreakdownItem(
        res.breakdown.incident_risk,
        30
      ),

      complaints: mapBreakdownItem(
        res.breakdown.complaint_risk,
        25
      ),

      patterns: mapBreakdownItem(
        res.breakdown.service_pattern_risk,
        20
      )
    },


    explanations:
      res.contributing_factors
        ? res.contributing_factors.filter(
            (f: string) =>
              !f.toLowerCase().includes('mitigating')
          )
        : [],


    recommendations:
      res.recommendations || [],


    matchedPriceRef:

      res.reference_price &&
      res.reference_price.sample_size > 0

        ? {

            location: '',

            serviceType: '',

            routeContext: '',

            min: res.reference_price.minimum,

            median: res.reference_price.median,

            max: res.reference_price.maximum,

            currency: '₹'
          }

        : undefined,


    appliedMitigations,


    assessmentConfidence:
      res.assessment_confidence,


    confidenceScore:
      res.confidence_score,


    referenceEvidence:
      res.reference_evidence,


    latestReferenceDate:

      res.data_freshness
        ? res.data_freshness.latest_reference_date
        : undefined
  };
};


export const evaluateOffer = async (
  input: AssessmentInput
): Promise<RiskAssessmentResult> => {

  const response = await fetch(
    `${API_BASE_URL}/evaluate`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify(input)
    }
  );


  if (!response.ok) {

    throw new Error(
      `TRUSTRA API request failed with status: ${response.status}`
    );
  }


  const data = await response.json();

  return mapBackendResponse(data);
};
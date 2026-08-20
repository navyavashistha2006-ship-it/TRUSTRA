from pydantic import BaseModel, Field
from typing import Optional, List

class EvaluationRequest(BaseModel):
    location: str
    serviceType: str
    routeContext: Optional[str] = ""
    quotedPrice: float
    paymentPressure: bool = False
    noReceipt: bool = False
    unexpectedCharges: bool = False
    couldNotVerifyOperator: bool = False
    unverifiedBookingChannel: bool = False
    otherContext: Optional[str] = ""
    providerVerified: bool = False

class ConfidenceInfo(BaseModel):
    overall: str
    reason: str

class IncidentRiskBreakdown(BaseModel):
    score: int
    weight: int = 30
    confidence: str
    explanation: str

class ComplaintRiskBreakdown(BaseModel):
    score: int
    weight: int = 25
    confidence: str
    explanation: str

class PriceAnomalyBreakdown(BaseModel):
    score: int
    weight: int = 25
    confidence: str
    quoted_price: float
    reference_median: Optional[float] = None
    price_ratio: Optional[float] = None
    source_count: int
    explanation: str

class ServicePatternRiskBreakdown(BaseModel):
    score: int
    weight: int = 20
    confidence: str
    explanation: str

class BreakdownInfo(BaseModel):
    incident_risk: IncidentRiskBreakdown
    complaint_risk: ComplaintRiskBreakdown
    price_anomaly: PriceAnomalyBreakdown
    service_pattern_risk: ServicePatternRiskBreakdown

class ReferencePriceInfo(BaseModel):
    minimum: Optional[float] = None
    median: Optional[float] = None
    maximum: Optional[float] = None
    sample_size: int
    sources: List[str]
    last_updated: Optional[str] = None

class DataFreshnessInfo(BaseModel):
    status: str
    last_updated: Optional[str] = None
    latest_reference_date: Optional[str] = None
    data_mode: Optional[str] = "MULTI_SOURCE_REFERENCE"

class EvidenceSummaryItem(BaseModel):
    type: str
    description: str
    source_count: Optional[int] = None
    freshness: Optional[str] = None

class ReferenceEvidenceItem(BaseModel):
    source_name: str
    price: Optional[float] = None
    collected_at: Optional[str] = None
    data_type: str
    reliability_score: Optional[int] = None
    source_url: Optional[str] = None

class EvaluationResponse(BaseModel):
    overall_score: int
    category: str
    confidence: ConfidenceInfo
    summary: str
    breakdown: BreakdownInfo
    reference_price: ReferencePriceInfo
    contributing_factors: List[str]
    recommendations: List[str]
    data_freshness: DataFreshnessInfo
    evidence_summary: List[EvidenceSummaryItem]
    assessment_confidence: str
    confidence_score: int
    reference_evidence: List[ReferenceEvidenceItem]
    disclaimer: str = "TRUSTRA provides an evidence-based risk assessment using available reference data and observed patterns. Risk does not constitute proof of fraud or misconduct."

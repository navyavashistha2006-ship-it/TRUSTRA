from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pandas as pd

from models import (
    EvaluationRequest,
    EvaluationResponse,
    ConfidenceInfo,
    BreakdownInfo,
    IncidentRiskBreakdown,
    ComplaintRiskBreakdown,
    PriceAnomalyBreakdown,
    ServicePatternRiskBreakdown,
    ReferencePriceInfo,
    DataFreshnessInfo,
    EvidenceSummaryItem,
    ReferenceEvidenceItem
)

from services.data_service import DataService
from services.price_engine import PriceEngine
from services.complaint_engine import ComplaintEngine
from services.incident_engine import IncidentEngine
from services.pattern_engine import PatternEngine
from services.confidence_engine import ConfidenceEngine
from services.risk_aggregator import RiskAggregator
from services.recommendation_engine import RecommendationEngine


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="TRUSTRA Tourism Risk Intelligence API",
    version="1.0.0",
    description=(
        "An evidence-based tourism transaction risk assessment system. "
        "TRUSTRA evaluates price anomalies, historical complaint patterns, "
        "incident references and transaction warning indicators."
    )
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATA SERVICE
# ============================================================

data_service = DataService()


# ============================================================
# HELPER FUNCTION: DATA FRESHNESS
# ============================================================

def calculate_freshness(latest_date):

    if latest_date is None or pd.isna(latest_date):
        return {
            "status": "INSUFFICIENT DATA",
            "age_days": None
        }

    if isinstance(latest_date, str):
        latest_date = pd.to_datetime(
            latest_date,
            errors="coerce"
        )

    if pd.isna(latest_date):
        return {
            "status": "INSUFFICIENT DATA",
            "age_days": None
        }

    age_days = max(
        0,
        (datetime.now() - latest_date.to_pydatetime()).days
    )

    if age_days <= 7:
        status = "RECENT"
    elif age_days <= 30:
        status = "CURRENT"
    elif age_days <= 90:
        status = "AGING"
    else:
        status = "STALE"

    return {
        "status": status,
        "age_days": age_days
    }


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def read_root():

    return {
        "message": "TRUSTRA Tourism Risk Intelligence System is running",
        "version": "1.0.0",
        "status": "healthy"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "system": "TRUSTRA Backend"
    }


# ============================================================
# SUPPORTED LOCATIONS
# ============================================================

@app.get("/locations")
def get_supported_locations():

    df = data_service.load_price_references()

    if df.empty:
        return []

    return sorted(
        df["location"]
        .dropna()
        .astype(str)
        .unique()
        .tolist()
    )


# ============================================================
# SUPPORTED SERVICES
# ============================================================

@app.get("/services")
def get_supported_services():

    df = data_service.load_price_references()

    if df.empty:
        return []

    return sorted(
        df["service_type"]
        .dropna()
        .astype(str)
        .unique()
        .tolist()
    )


# ============================================================
# REFERENCE DATA SUMMARY
# ============================================================

@app.get("/reference-data")
def get_reference_data_summary():

    df = data_service.load_price_references()

    if df.empty:
        return []

    summary = (
        df.groupby(
            [
                "location",
                "service_type",
                "route_context"
            ]
        )
        .agg(
            minimum_price=("price", "min"),
            median_price=("price", "median"),
            maximum_price=("price", "max"),
            sources_count=("source_name", "count"),
            latest_reference=("collected_at", "max")
        )
        .reset_index()
    )

    if "latest_reference" in summary.columns:

        summary["latest_reference"] = summary[
            "latest_reference"
        ].apply(
            lambda x: (
                x.strftime("%Y-%m-%d")
                if pd.notnull(x) and hasattr(x, "strftime")
                else None
            )
        )

    return summary.to_dict(orient="records")


# ============================================================
# DATA STATUS AND TRANSPARENCY
# ============================================================

@app.get("/data-status")
def get_data_status():

    price_df = data_service.load_price_references()
    complaints_df = data_service.load_complaints()
    incidents_df = data_service.load_incidents()
    sources_df = data_service.load_data_sources()

    if price_df.empty:

        return {
            "status": "NO DATA",
            "message": "No price reference data is currently loaded."
        }

    latest_date = None

    if "collected_at" in price_df.columns:

        latest_date = price_df["collected_at"].max()

    freshness = calculate_freshness(latest_date)

    if not sources_df.empty:

        source_names = (
            sources_df["source_name"]
            .dropna()
            .astype(str)
            .unique()
            .tolist()
        )

    else:

        source_names = (
            price_df["source_name"]
            .dropna()
            .astype(str)
            .unique()
            .tolist()
        )

    return {

        "status": "ACTIVE",

        "last_dataset_update": (
            latest_date.strftime("%Y-%m-%d")
            if pd.notnull(latest_date)
            and hasattr(latest_date, "strftime")
            else None
        ),

        "number_of_price_references": int(len(price_df)),

        "number_of_locations": int(
            price_df["location"].nunique()
        ),

        "number_of_services": int(
            price_df["service_type"].nunique()
        ),

        "number_of_complaint_records": int(
            len(complaints_df)
        ),

        "number_of_incident_records": int(
            len(incidents_df)
        ),

        "source_names": source_names,

        "data_freshness": freshness
    }


# ============================================================
# MAIN TRUSTRA EVALUATION ENGINE
# ============================================================

@app.post(
    "/evaluate",
    response_model=EvaluationResponse
)
def evaluate_offer(request: EvaluationRequest):

    # --------------------------------------------------------
    # LOAD DATA
    # --------------------------------------------------------

    price_df = data_service.load_price_references()
    complaints_df = data_service.load_complaints()
    incidents_df = data_service.load_incidents()
    sources_df = data_service.load_data_sources()


    # --------------------------------------------------------
    # BUILD SOURCE RELIABILITY MAP
    # --------------------------------------------------------

    reliability_map = {}

    if not sources_df.empty:

        for _, row in sources_df.iterrows():

            source_name = str(
                row.get("source_name", "")
            )

            reliability_score = row.get(
                "reliability_score",
                80
            )

            try:

                reliability_map[source_name] = int(
                    reliability_score
                )

            except (ValueError, TypeError):

                reliability_map[source_name] = 80


    # --------------------------------------------------------
    # INITIALIZE ENGINES
    # --------------------------------------------------------

    price_engine = PriceEngine(price_df)

    complaint_engine = ComplaintEngine(
        complaints_df
    )

    incident_engine = IncidentEngine(
        incidents_df
    )

    pattern_engine = PatternEngine()

    confidence_engine = ConfidenceEngine()

    risk_aggregator = RiskAggregator()

    recommendation_engine = RecommendationEngine()


    # --------------------------------------------------------
    # RUN PRICE ANALYSIS
    # --------------------------------------------------------

    price_res = price_engine.evaluate(

        request.location,
        request.serviceType,
        request.routeContext,
        request.quotedPrice
    )


    # --------------------------------------------------------
    # RUN COMPLAINT ANALYSIS
    # --------------------------------------------------------

    complaint_res = complaint_engine.evaluate(

        request.location,
        request.serviceType
    )


    # --------------------------------------------------------
    # RUN INCIDENT ANALYSIS
    # --------------------------------------------------------

    incident_res = incident_engine.evaluate(

        request.location,
        request.serviceType
    )


    # --------------------------------------------------------
    # RUN SERVICE PATTERN ANALYSIS
    # --------------------------------------------------------

    pattern_res = pattern_engine.evaluate(

        request.paymentPressure,
        request.noReceipt,
        request.unexpectedCharges,
        request.couldNotVerifyOperator,
        request.unverifiedBookingChannel,
        request.providerVerified
    )


    # --------------------------------------------------------
    # AGGREGATE FINAL RISK
    # --------------------------------------------------------

    aggregate_res = risk_aggregator.aggregate(

        incident_res["score"],
        complaint_res["score"],
        price_res["score"],
        pattern_res["score"]
    )


    # --------------------------------------------------------
    # DETERMINE DATA FRESHNESS
    # --------------------------------------------------------

    last_updated_str = price_res.get(
        "last_updated"
    )

    latest_date = None

    if last_updated_str:

        latest_date = pd.to_datetime(
            last_updated_str,
            errors="coerce"
        )

    freshness = calculate_freshness(
        latest_date
    )

    freshness_status = freshness["status"]

    age_days = freshness["age_days"]

    if age_days is None:

        age_days = 999


    # --------------------------------------------------------
    # ENRICH MATCHED RECORDS WITH RELIABILITY
    # --------------------------------------------------------

    matched_records = price_res.get(
        "matched_records",
        []
    )

    reliability_scores = []

    for record in matched_records:

        source_name = str(
            record.get(
                "source_name",
                ""
            )
        )

        reliability_score = reliability_map.get(
            source_name,
            80
        )

        record[
            "reliability_score"
        ] = reliability_score

        reliability_scores.append(
            reliability_score
        )


    # --------------------------------------------------------
    # CALCULATE CONFIDENCE
    # --------------------------------------------------------

    confidence_res = confidence_engine.evaluate(

        price_res.get(
            "source_count",
            0
        ),

        price_res.get(
            "has_route_match",
            False
        ),

        complaint_res.get(
            "reference_count",
            0
        ),

        incident_res.get(
            "incident_count",
            0
        ),

        age_days,

        reliability_scores
    )


    # --------------------------------------------------------
    # COMPILE CONTRIBUTING FACTORS
    # --------------------------------------------------------

    contributing_factors = []

    if price_res["score"] > 0:

        contributing_factors.append(
            price_res["explanation"]
        )

    if complaint_res["score"] > 0:

        contributing_factors.append(
            complaint_res["explanation"]
        )

    if incident_res["score"] > 0:

        contributing_factors.append(
            incident_res["explanation"]
        )

    contributing_factors.extend(

        pattern_res.get(
            "contributing_factors",
            []
        )
    )

    if request.providerVerified:

        contributing_factors.append(
            "Mitigating factor: The provider is marked as verified."
        )


    # --------------------------------------------------------
    # GENERATE RECOMMENDATIONS
    # --------------------------------------------------------

    recommendations = recommendation_engine.generate(

        price_res["score"],

        price_res.get(
            "price_ratio"
        ) or 0.0,

        complaint_res["score"],

        incident_res["score"],

        request.paymentPressure,

        request.noReceipt,

        request.couldNotVerifyOperator,

        request.unverifiedBookingChannel
    )


    # --------------------------------------------------------
    # BUILD EVIDENCE SUMMARY
    # --------------------------------------------------------

    evidence_summary = []


    # PRICE EVIDENCE

    if price_res["source_count"] > 0:

        evidence_summary.append(

            EvidenceSummaryItem(

                type="PRICE_REFERENCE",

                description=(
                    "Comparable reference prices were matched "
                    "for this destination and service."
                ),

                source_count=price_res[
                    "source_count"
                ],

                freshness=freshness_status
            )
        )

    else:

        evidence_summary.append(

            EvidenceSummaryItem(

                type="PRICE_REFERENCE",

                description=(
                    "No directly comparable localized price "
                    "reference was available for this query."
                ),

                source_count=0,

                freshness="INSUFFICIENT DATA"
            )
        )


    # SERVICE PATTERN EVIDENCE

    if pattern_res["score"] > 0:

        evidence_summary.append(

            EvidenceSummaryItem(

                type="SERVICE_PATTERN",

                description=(
                    "Transaction warning indicators selected "
                    "by the user contributed to the assessment."
                )
            )
        )


    # COMPLAINT EVIDENCE

    if complaint_res.get(
        "reference_count",
        0
    ) > 0:

        evidence_summary.append(

            EvidenceSummaryItem(

                type="COMPLAINT_PATTERN",

                description=(
                    "Historical complaint-pattern reference data "
                    "matched this location and service type."
                ),

                source_count=complaint_res[
                    "reference_count"
                ]
            )
        )


    # INCIDENT EVIDENCE

    if incident_res.get(
        "incident_count",
        0
    ) > 0:

        evidence_summary.append(

            EvidenceSummaryItem(

                type="INCIDENT_REFERENCE",

                description=(
                    "Historical incident reference data "
                    "matched this location and service type."
                ),

                source_count=incident_res[
                    "incident_count"
                ]
            )
        )


    # --------------------------------------------------------
    # BUILD STRUCTURED SOURCE EVIDENCE
    # --------------------------------------------------------

    reference_evidence = []

    for record in matched_records:

        source_url = record.get(
            "source_url"
        )

        if (
            source_url is not None
            and pd.isna(source_url)
        ):

            source_url = None


        reference_evidence.append(

            ReferenceEvidenceItem(

                source_name=record.get(
                    "source_name",
                    "Unknown"
                ),

                price=record.get(
                    "price"
                ),

                collected_at=record.get(
                    "collected_at"
                ),

                data_type=record.get(
                    "data_type",
                    "public_reference"
                ),

                reliability_score=record.get(
                    "reliability_score"
                ),

                source_url=source_url
            )
        )


    # --------------------------------------------------------
    # BUILD FINAL RESPONSE
    # --------------------------------------------------------

    response = EvaluationResponse(

        overall_score=aggregate_res[
            "overall_score"
        ],

        category=aggregate_res[
            "category"
        ],

        confidence=ConfidenceInfo(

            overall=confidence_res[
                "overall"
            ],

            reason=confidence_res[
                "reason"
            ]
        ),

        summary=aggregate_res[
            "summary"
        ],

        breakdown=BreakdownInfo(

            incident_risk=IncidentRiskBreakdown(

                score=incident_res[
                    "score"
                ],

                confidence=confidence_res[
                    "sub_confidences"
                ][
                    "incidents"
                ],

                explanation=incident_res[
                    "explanation"
                ]
            ),

            complaint_risk=ComplaintRiskBreakdown(

                score=complaint_res[
                    "score"
                ],

                confidence=confidence_res[
                    "sub_confidences"
                ][
                    "complaints"
                ],

                explanation=complaint_res[
                    "explanation"
                ]
            ),

            price_anomaly=PriceAnomalyBreakdown(

                score=price_res[
                    "score"
                ],

                confidence=confidence_res[
                    "sub_confidences"
                ][
                    "price"
                ],

                quoted_price=price_res[
                    "quoted_price"
                ],

                reference_median=price_res.get(
                    "reference_median"
                ),

                price_ratio=price_res.get(
                    "price_ratio"
                ),

                source_count=price_res[
                    "source_count"
                ],

                explanation=price_res[
                    "explanation"
                ]
            ),

            service_pattern_risk=ServicePatternRiskBreakdown(

                score=pattern_res[
                    "score"
                ],

                confidence="HIGH",

                explanation=pattern_res[
                    "explanation"
                ]
            )
        ),

        reference_price=ReferencePriceInfo(

            minimum=price_res.get(
                "minimum"
            ),

            median=price_res.get(
                "reference_median"
            ),

            maximum=price_res.get(
                "maximum"
            ),

            sample_size=price_res[
                "source_count"
            ],

            sources=price_res[
                "sources"
            ],

            last_updated=price_res.get(
                "last_updated"
            )
        ),

        contributing_factors=contributing_factors,

        recommendations=recommendations,

        data_freshness=DataFreshnessInfo(

            status=freshness_status,

            last_updated=price_res.get(
                "last_updated"
            ),

            latest_reference_date=price_res.get(
                "last_updated"
            ),

            data_mode="MULTI_SOURCE_REFERENCE"
        ),

        evidence_summary=evidence_summary,

        assessment_confidence=confidence_res[
            "assessment_confidence"
        ],

        confidence_score=confidence_res[
            "confidence_score"
        ],

        reference_evidence=reference_evidence
    )

    return response


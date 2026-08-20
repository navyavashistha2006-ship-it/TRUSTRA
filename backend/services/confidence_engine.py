from typing import Dict, Any, List

class ConfidenceEngine:
    def evaluate(self, 
                 price_sources: int, 
                 has_route_match: bool,
                 complaint_count: int, 
                 incident_count: int,
                 data_freshness_days: int,
                 matched_sources_reliability: List[int]) -> Dict[str, Any]:
        
        # Scoring metrics for sub-components
        price_conf = "INSUFFICIENT DATA"
        if price_sources >= 4:
            price_conf = "HIGH"
        elif price_sources >= 2:
            price_conf = "MEDIUM"
        elif price_sources == 1:
            price_conf = "LOW"

        complaint_conf = "INSUFFICIENT DATA"
        if complaint_count > 30:
            complaint_conf = "HIGH"
        elif complaint_count >= 10:
            complaint_conf = "MEDIUM"
        elif complaint_count > 0:
            complaint_conf = "LOW"

        incident_conf = "INSUFFICIENT DATA"
        if incident_count >= 3:
            incident_conf = "HIGH"
        elif incident_count >= 1:
            incident_conf = "MEDIUM"

        # Determine overall confidence text reason
        ranks = {"HIGH": 3, "MEDIUM": 2, "LOW": 1, "INSUFFICIENT DATA": 0}
        total_rank = ranks[price_conf] + ranks[complaint_conf] + ranks[incident_conf]
        
        overall = "LOW"
        reason = ""

        if price_sources == 0:
            overall = "LOW"
            reason = "No localized price benchmarks were found for this destination. Relying on general patterns."
        elif total_rank >= 7:
            overall = "HIGH"
            reason = "Multiple recent comparable price references and supporting risk indicators were available."
        elif total_rank >= 4:
            overall = "MEDIUM"
            reason = "Partial reference data available. Pricing benchmarks matched, but local complaint logs are limited."
        else:
            overall = "LOW"
            reason = "Limited reference data found in local database. Relying heavily on self-reported booking indicators."

        if data_freshness_days > 90 and overall == "HIGH":
            overall = "MEDIUM"
            reason += " (Note: Reference datasets are aging)."

        # --- CALCULATE NUMERICAL CONFIDENCE SCORE (0-100) ---
        # 1. Price evidence coverage (max 35 points)
        price_points = min(30.0, price_sources * 7.5)
        if has_route_match:
            price_points += 5.0
            
        # 2. Complaint evidence coverage (max 25 points)
        complaint_points = 0.0
        if complaint_count > 30:
            complaint_points = 25.0
        elif complaint_count >= 10:
            complaint_points = 15.0
        elif complaint_count > 0:
            complaint_points = 5.0
            
        # 3. Incident evidence coverage (max 20 points)
        incident_points = 0.0
        if incident_count >= 3:
            incident_points = 20.0
        elif incident_count >= 1:
            incident_points = 12.0
            
        # 4. Source reliability weight (max 20 points)
        avg_reliability = sum(matched_sources_reliability) / len(matched_sources_reliability) if matched_sources_reliability else 75.0
        reliability_points = avg_reliability * 0.20

        # Sum components (max 100)
        confidence_score = int(round(price_points + complaint_points + incident_points + reliability_points))
        
        # Penalize confidence if data is stale or aging
        if data_freshness_days > 90:
            confidence_score = max(10, confidence_score - 20)
        elif data_freshness_days > 30:
            confidence_score = max(10, confidence_score - 10)

        # Cap confidence score between 10 and 100
        confidence_score = min(100, max(10, confidence_score))

        # Map to assessment_confidence category
        if confidence_score >= 70:
            assessment_confidence = "HIGH"
        elif confidence_score >= 40:
            assessment_confidence = "MEDIUM"
        else:
            assessment_confidence = "LOW"

        return {
            "overall": overall, # keeps compatibility with frontend confidence gauge
            "reason": reason,
            "sub_confidences": {
                "price": price_conf,
                "complaints": complaint_conf,
                "incidents": incident_conf
            },
            "assessment_confidence": assessment_confidence,
            "confidence_score": confidence_score
        }


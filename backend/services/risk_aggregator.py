from typing import Dict, Any

class RiskAggregator:
    def aggregate(self, 
                  incident_score: int, 
                  complaint_score: int, 
                  price_score: int, 
                  pattern_score: int) -> Dict[str, Any]:
        
        # Weighted aggregate score
        weighted_score = (
            (incident_score * 0.30) + 
            (complaint_score * 0.25) + 
            (price_score * 0.25) + 
            (pattern_score * 0.20)
        )
        
        overall_score = int(round(weighted_score))
        overall_score = min(100, max(0, overall_score))

        # Risk categories mapping
        if overall_score >= 75:
            category = "VERY HIGH"
            summary = "The offer shows multiple elevated risk indicators. Consider a verified alternative."
        elif overall_score >= 50:
            category = "HIGH"
            summary = "Multiple warning signals indicate elevated risk. Compare and verify before accepting."
        elif overall_score >= 25:
            category = "MODERATE"
            summary = "Some caution signals are present. Verify important details before proceeding."
        else:
            category = "LOW"
            summary = "Available signals indicate relatively low risk in this context."

        return {
            "overall_score": overall_score,
            "category": category,
            "summary": summary
        }

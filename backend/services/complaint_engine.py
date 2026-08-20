import pandas as pd
from typing import Dict, Any, List
from services.matching import match_location, match_service

class ComplaintEngine:
    def __init__(self, complaints_df: pd.DataFrame):
        self.df = complaints_df

    def evaluate(self, location: str, service_type: str) -> Dict[str, Any]:
        if self.df.empty:
            return self._empty_result()

        # Filter by location and service type
        loc_mask = self.df['location'].apply(lambda x: match_location(x, location))
        svc_mask = self.df['service_type'].apply(lambda x: match_service(x, service_type))
        filtered = self.df[loc_mask & svc_mask]

        if filtered.empty:
            # Check if there are general city complaints
            city_filtered = self.df[loc_mask]
            if not city_filtered.empty:
                return {
                    "score": 15,
                    "confidence": "LOW",
                    "explanation": f"No specific complaints recorded for {service_type} services, but the destination has general complaints logs.",
                    "issues": ["general_city_reports"],
                    "reference_count": len(city_filtered)
                }
            return self._empty_result()

        # Aggregation
        total_complaints = int(filtered['reference_count'].sum())
        
        # Determine highest severity
        severities = filtered['severity'].str.lower().tolist()
        highest_severity = 'low'
        if 'high' in severities:
            highest_severity = 'high'
        elif 'moderate' in severities:
            highest_severity = 'moderate'

        # Scoring Logic
        base_score = 20
        if highest_severity == 'high':
            base_score = 60
        elif highest_severity == 'moderate':
            base_score = 40
            
        # Add incremental weight based on count
        extra_score = min(40, total_complaints * 1.5)
        complaint_score = int(round(base_score + extra_score))
        complaint_score = min(100, max(0, complaint_score))

        # Compile issue types
        issues = list(filtered['issue_type'].unique())
        issues_formatted = [issue.replace('_', ' ') for issue in issues]
        
        explanation = (
            f"Similar service contexts show an elevated frequency of "
            f"{', '.join(issues_formatted[:2])} complaints ({total_complaints} aggregated reference records)."
        )

        # Confidence assessment
        confidence = "MEDIUM"
        if total_complaints > 30:
            confidence = "HIGH"
        elif total_complaints < 10:
            confidence = "LOW"

        return {
            "score": complaint_score,
            "confidence": confidence,
            "explanation": explanation,
            "issues": issues,
            "reference_count": total_complaints
        }

    def _empty_result(self) -> Dict[str, Any]:
        return {
            "score": 0,
            "confidence": "INSUFFICIENT DATA",
            "explanation": "No elevated complaints recorded for this location/service context.",
            "issues": [],
            "reference_count": 0
        }

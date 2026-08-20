import pandas as pd
from typing import Dict, Any, List
from services.matching import match_location, match_service

class IncidentEngine:
    def __init__(self, incidents_df: pd.DataFrame):
        self.df = incidents_df

    def evaluate(self, location: str, service_type: str) -> Dict[str, Any]:
        if self.df.empty:
            return self._empty_result()

        # Filter by location and service type
        loc_mask = self.df['location'].apply(lambda x: match_location(x, location))
        svc_mask = self.df['service_type'].apply(lambda x: match_service(x, service_type))
        filtered = self.df[loc_mask & svc_mask]

        if filtered.empty:
            # Check if there are general city incidents
            city_filtered = self.df[loc_mask]
            if not city_filtered.empty:
                return {
                    "score": 10,
                    "confidence": "LOW",
                    "explanation": f"No recent safety or fraud incidents logged for {service_type} services in {location}, but general safety reports exist for the city.",
                    "incident_count": len(city_filtered)
                }
            return self._empty_result()

        # Find the highest severity incident
        max_severity = 'LOW'
        worst_incident = None
        severity_ranks = {'CRITICAL': 4, 'HIGH': 3, 'MODERATE': 2, 'LOW': 1}
        
        for _, row in filtered.iterrows():
            sev = str(row['severity']).upper()
            rank = severity_ranks.get(sev, 1)
            worst_rank = severity_ranks.get(max_severity, 1)
            
            if rank >= worst_rank or worst_incident is None:
                max_severity = sev
                worst_incident = row

        # Scoring
        score_map = {
            'CRITICAL': 100,
            'HIGH': 75,
            'MODERATE': 45,
            'LOW': 25
        }
        score = score_map.get(max_severity, 0)
        
        explanation = (
            f"A recent {worst_incident['severity'].lower()} severity incident of type "
            f"\"{worst_incident['category']}\" was reported: \"{worst_incident['title']}\"."
        )

        return {
            "score": score,
            "confidence": "MEDIUM" if len(filtered) < 3 else "HIGH",
            "explanation": explanation,
            "incident_count": len(filtered)
        }

    def _empty_result(self) -> Dict[str, Any]:
        return {
            "score": 0,
            "confidence": "INSUFFICIENT DATA",
            "explanation": "No recent safety or major fraud incidents logged for this route.",
            "incident_count": 0
        }

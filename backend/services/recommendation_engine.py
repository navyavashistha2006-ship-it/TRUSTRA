from typing import List

class RecommendationEngine:
    def generate(self, 
                 price_score: int, 
                 price_ratio: float, 
                 complaint_score: int, 
                 incident_score: int,
                 payment_pressure: bool,
                 no_receipt: bool,
                 could_not_verify_operator: bool,
                 unverified_booking_channel: bool) -> List[str]:
        
        recs = []

        # 1. Price-based recommendations
        if price_ratio and price_ratio > 1.25:
            recs.append("Compare the quoted fare with recent reference prices before accepting.")
            recs.append("Negotiate down closer to the typical median benchmark price.")
        elif price_ratio and price_ratio < 0.60:
            recs.append("Ask for the complete price breakdown and confirm that no mandatory charges are excluded.")
            recs.append("Verify if there are forced commission stops (like gem markets) included in the route plan.")

        # 2. Safety & Grievance based
        if incident_score >= 75:
            recs.append("A safety alert is active for this route. Consider using an official pre-paid kiosk or state counter.")
        elif complaint_score >= 50:
            recs.append("Confirm all booking details beforehand. This service context has elevated complaint logs.")

        # 3. Behavioral signals
        if could_not_verify_operator:
            recs.append("Request to see official tourist credentials, registration certificate, or driver license.")
        if unverified_booking_channel:
            recs.append("Prefer booking through official kiosks, authorized tourist helpdesks, or verified travel apps.")
        if no_receipt:
            recs.append("Request a written invoice, receipt, or rate card before committing to the service.")
        if payment_pressure:
            recs.append("Avoid making immediate advance payments or deposits unless terms are independently verified.")

        # Default fallback
        if len(recs) == 0:
            recs.append("Proceed with standard traveler caution.")
            recs.append("Keep active local emergency helpline numbers stored in your dialer.")

        return recs

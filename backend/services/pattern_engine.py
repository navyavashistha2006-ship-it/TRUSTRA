from typing import Dict, Any, List

class PatternEngine:
    def evaluate(self, 
                 payment_pressure: bool, 
                 no_receipt: bool, 
                 unexpected_charges: bool, 
                 could_not_verify_operator: bool, 
                 unverified_booking_channel: bool,
                 provider_verified: bool) -> Dict[str, Any]:
        
        score = 0
        factors = []
        mitigations = []

        if payment_pressure:
            score += 25
            factors.append("immediate advance payment pressure")
        if no_receipt:
            score += 20
            factors.append("refusal to provide written breakdown/receipt")
        if unexpected_charges:
            score += 25
            factors.append("unexpected additional charges added mid-conversation")
        if could_not_verify_operator:
            score += 20
            factors.append("unverifiable operator credentials")
        if unverified_booking_channel:
            score += 20
            factors.append("offline street solicitation / unverified channel")

        if provider_verified:
            # Verified operator is a powerful risk mitigation
            score -= 30
            mitigations.append("verified service provider credentials")

        # Clamp score between 0 and 100
        score = min(100, max(0, score))

        # Generate explanation
        if len(factors) > 0:
            explanation = f"Caution indicators detected: {', '.join(factors[:2])}."
            if provider_verified:
                explanation += " Risk is mitigated by verified provider credentials."
        else:
            if provider_verified:
                explanation = "Verified operator with no suspicious transaction patterns."
            else:
                explanation = "No suspicious booking or behavioral signals detected."

        return {
            "score": score,
            "confidence": "HIGH", # Self-reported tourist inputs are considered high-confidence indicators
            "explanation": explanation,
            "contributing_factors": factors,
            "applied_mitigations": mitigations
        }

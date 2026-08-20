import pandas as pd
from typing import Dict, Any

from services.matching import (
    match_location,
    match_service,
    match_route
)


class PriceEngine:
    def __init__(
        self,
        price_df: pd.DataFrame,
        source_reliability_df: pd.DataFrame = None
    ):
        self.df = price_df.copy()
        self.source_reliability_df = source_reliability_df

        # Convert dates safely
        if "collected_at" in self.df.columns:
            self.df["collected_at"] = pd.to_datetime(
                self.df["collected_at"],
                errors="coerce"
            )

        # Attach reliability scores to price records
        self._attach_reliability_scores()

    def _attach_reliability_scores(self):
        """
        Adds reliability_score to each reference record.

        Priority:
        1. Explicit reliability score already present
        2. Match source_name + data_type from source reliability table
        3. Use a conservative default
        """

        if "reliability_score" not in self.df.columns:
            self.df["reliability_score"] = None

        if (
            self.source_reliability_df is not None
            and not self.source_reliability_df.empty
        ):
            reliability_df = self.source_reliability_df.copy()

            lookup = reliability_df.set_index(
                ["source_name", "data_type"]
            )["reliability_score"].to_dict()

            def get_reliability(row):
                existing = row.get("reliability_score")

                if pd.notnull(existing):
                    return float(existing)

                key = (
                    row.get("source_name"),
                    row.get("data_type")
                )

                return float(lookup.get(key, 60))

            self.df["reliability_score"] = self.df.apply(
                get_reliability,
                axis=1
            )

        else:
            self.df["reliability_score"] = (
                self.df["reliability_score"]
                .fillna(60)
                .astype(float)
            )

    def evaluate(
        self,
        location: str,
        service_type: str,
        route_context: str,
        quoted_price: float
    ) -> Dict[str, Any]:

        if self.df.empty:
            return self._empty_result(
                quoted_price,
                "No price reference data loaded in the system."
            )

        # -------------------------------------------------
        # 1. Match location and service
        # -------------------------------------------------

        loc_mask = self.df["location"].apply(
            lambda x: match_location(x, location)
        )

        svc_mask = self.df["service_type"].apply(
            lambda x: match_service(x, service_type)
        )

        filtered = self.df[loc_mask & svc_mask].copy()

        if filtered.empty:
            return self._empty_result(
                quoted_price,
                "No comparable reference data is available for this location and service."
            )

        # -------------------------------------------------
        # 2. Route matching
        # -------------------------------------------------

        route_context = (route_context or "").strip()

        route_filtered = pd.DataFrame()

        if route_context:
            route_filtered = filtered[
                filtered["route_context"].apply(
                    lambda x: match_route(x, route_context)
                )
            ].copy()

        has_route_match = not route_filtered.empty

        # Important reliability fix:
        # Only use location/service fallback when there is
        # no route-specific data, and clearly mark it.
        if has_route_match:
            analysis_df = route_filtered
            comparison_scope = "ROUTE_SPECIFIC"
        else:
            analysis_df = filtered
            comparison_scope = "LOCATION_SERVICE_FALLBACK"

        # -------------------------------------------------
        # 3. Aggregate reference statistics
        # -------------------------------------------------

        analysis_df["price"] = pd.to_numeric(
            analysis_df["price"],
            errors="coerce"
        )

        analysis_df = analysis_df.dropna(
            subset=["price"]
        )

        if analysis_df.empty:
            return self._empty_result(
                quoted_price,
                "Comparable records were found, but no valid prices were available."
            )

        prices = analysis_df["price"].astype(float)

        minimum = float(prices.min())
        median = float(prices.median())
        maximum = float(prices.max())

        sample_size = len(analysis_df)

        unique_sources = (
            analysis_df["source_name"]
            .dropna()
            .unique()
            .tolist()
        )

        unique_source_count = len(unique_sources)

        # -------------------------------------------------
        # 4. Freshness calculation
        # -------------------------------------------------

        latest_date = None

        if "collected_at" in analysis_df.columns:

            latest_date = analysis_df[
                "collected_at"
            ].max()

        last_updated_str = (
            latest_date.strftime("%Y-%m-%d")
            if pd.notnull(latest_date)
            else None
        )

        # -------------------------------------------------
        # 5. Evidence reliability calculation
        # -------------------------------------------------

        reliability_values = pd.to_numeric(
            analysis_df["reliability_score"],
            errors="coerce"
        ).fillna(60)

        average_reliability = float(
            reliability_values.mean()
        )

        # Source diversity score
        if unique_source_count >= 4:
            diversity_score = 100
        elif unique_source_count == 3:
            diversity_score = 85
        elif unique_source_count == 2:
            diversity_score = 65
        else:
            diversity_score = 40

        # Route confidence
        route_score = 100 if has_route_match else 60

        # Sample size score
        if sample_size >= 5:
            sample_score = 100
        elif sample_size >= 4:
            sample_score = 85
        elif sample_size >= 3:
            sample_score = 70
        elif sample_size == 2:
            sample_score = 50
        else:
            sample_score = 30

        # Final evidence confidence
        confidence_score = int(round(
            average_reliability * 0.45
            + diversity_score * 0.20
            + route_score * 0.20
            + sample_score * 0.15
        ))

        confidence_score = max(
            0,
            min(100, confidence_score)
        )

        if confidence_score >= 80:
            assessment_confidence = "HIGH"
        elif confidence_score >= 60:
            assessment_confidence = "MEDIUM"
        else:
            assessment_confidence = "LOW"

        # -------------------------------------------------
        # 6. Price anomaly calculation
        # -------------------------------------------------

        if median <= 0:
            return self._empty_result(
                quoted_price,
                "Invalid median reference price."
            )

        price_ratio = quoted_price / median

        if price_ratio < 0.60:

            price_score = int(
                round(
                    (0.60 - price_ratio)
                    / 0.60
                    * 40
                )
            )

            price_score = min(
                40,
                max(0, price_score)
            )

            explanation = (
                f"The quoted price (₹{quoted_price:.0f}) is unusually low "
                f"at {price_ratio:.2f}x of the comparable median "
                f"(₹{median:.0f}). This does not prove a problem, but "
                f"the offer may require verification for hidden charges "
                f"or changed conditions."
            )

        elif price_ratio <= 1.20:

            price_score = 0

            explanation = (
                f"The quoted price (₹{quoted_price:.0f}) is within the "
                f"expected range of comparable references "
                f"(median ₹{median:.0f})."
            )

        elif price_ratio < 2.0:

            price_score = int(
                round(
                    (price_ratio - 1.20)
                    / 0.80
                    * 50
                )
            )

            price_score = min(
                50,
                max(0, price_score)
            )

            explanation = (
                f"The quoted price is {price_ratio:.2f}x the median "
                f"of comparable reference prices (₹{median:.0f})."
            )

        elif price_ratio < 3.0:

            price_score = int(
                round(
                    50
                    + (
                        (price_ratio - 2.0)
                        * 50
                    )
                )
            )

            price_score = min(
                100,
                price_score
            )

            explanation = (
                f"The quoted price is substantially above the comparable "
                f"median: {price_ratio:.2f}x versus ₹{median:.0f}."
            )

        else:

            price_score = 100

            explanation = (
                f"The quoted price is more than 3x the comparable median "
                f"reference price of ₹{median:.0f}."
            )

        # -------------------------------------------------
        # 7. Prepare transparent evidence records
        # -------------------------------------------------

        records_df = analysis_df.copy()

        if "collected_at" in records_df.columns:

            records_df["collected_at"] = (
                records_df["collected_at"]
                .apply(
                    lambda x:
                    x.strftime("%Y-%m-%d")
                    if pd.notnull(x)
                    else None
                )
            )

        matched_records = records_df.to_dict(
            orient="records"
        )

        return {

            # Price result
            "score": price_score,

            "quoted_price": quoted_price,

            "reference_median": median,

            "price_ratio": round(
                price_ratio,
                2
            ),

            # Reference statistics
            "source_count": sample_size,

            "unique_source_count": unique_source_count,

            "minimum": minimum,

            "median": median,

            "maximum": maximum,

            "sources": unique_sources,

            "last_updated": last_updated_str,

            # Matching transparency
            "has_route_match": has_route_match,

            "comparison_scope": comparison_scope,

            # Reliability
            "average_reliability": round(
                average_reliability,
                1
            ),

            "confidence_score": confidence_score,

            "assessment_confidence": assessment_confidence,

            # Explanation
            "explanation": explanation,

            # Raw evidence
            "matched_records": matched_records
        }

    def _empty_result(
        self,
        quoted_price: float,
        reason: str
    ) -> Dict[str, Any]:

        return {

            "score": 0,

            "quoted_price": quoted_price,

            "reference_median": None,

            "price_ratio": None,

            "source_count": 0,

            "unique_source_count": 0,

            "minimum": None,

            "median": None,

            "maximum": None,

            "sources": [],

            "last_updated": None,

            "has_route_match": False,

            "comparison_scope": "NO_REFERENCE",

            "average_reliability": 0,

            "confidence_score": 0,

            "assessment_confidence": "LOW",

            "explanation": reason,

            "matched_records": []
        }
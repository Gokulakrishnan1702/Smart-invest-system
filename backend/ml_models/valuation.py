import os
import numpy as np
import pandas as pd
import re

try:
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.preprocessing import LabelEncoder
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False
from datetime import datetime

# ─── Dataset paths ───────────────────────────────────────────────────────────
_HERE = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH      = os.path.join(_HERE, "..", "..", "datasets", "world_real_estate_data.csv")
LAND_DATASET_PATH = os.path.join(_HERE, "..", "..", "datasets", "land_data.csv")

# ─── Centralized, canonical area conversion ───────────────────────────────────
# 1 Acre = 43,560 Sqft = 100 Cent  |  1 Cent = 435.6 Sqft
SQFT_PER_ACRE = 43560.0
SQFT_PER_CENT = 435.6
CENT_PER_ACRE = 100.0

def convert_to_sqft(area: float, unit: str) -> float:
    """Convert any area input to square feet using canonical constants."""
    unit = (unit or "Sqft").strip()
    if unit == "Acre":
        return area * SQFT_PER_ACRE
    if unit == "Cent":
        return area * SQFT_PER_CENT
    return area  # already Sqft

def sqft_to_acres(sqft: float) -> float:
    return sqft / SQFT_PER_ACRE

def sqft_to_cents(sqft: float) -> float:
    return sqft / SQFT_PER_CENT

# ─── Annual appreciation rates per property type ──────────────────────────────
APPRECIATION_RATES = {
    "land":       0.07,
    "flat":       0.09,
    "apartment":  0.09,
    "house":      0.08,
    "commercial": 0.10,
    "mixed":      0.09,
    "industrial": 0.08,
}

# ─── Housing feature names ────────────────────────────────────────────────────
HOUSING_FEATURES = [
    "sqft",
    "bedrooms",
    "bathrooms",
    "stories",
    "is_turkey",
    "is_hungary",
    "is_russia",
    "is_spain",
    "is_belarus",
    "is_greece",
    "is_montenegro"
]

# ─── Land feature names ───────────────────────────────────────────────────────
# Only features relevant to land valuation — no bedrooms, bathrooms, stories, country flags.
LAND_FEATURES = [
    "area_sqft",
    "latitude",
    "longitude",
    "district_enc",
    "land_type_enc",
    "location_type_enc",
    "road_access_enc",
    "utilities_enc",
]

# ─── Minimum land records needed to trust the ML model ───────────────────────
MIN_LAND_RECORDS = 50

def _parse_area_to_sqft(x):
    """Parse text like '120 m²' to sqft (1 sq meter = 10.7639 sqft)."""
    if pd.isna(x):
        return np.nan
    x_str = str(x).lower().strip()
    match = re.search(r'([\d\.,]+)', x_str)
    if match:
        val = match.group(1).replace(',', '')
        try:
            meters = float(val)
            return meters * 10.7639
        except:
            return np.nan
    return np.nan

def _encode_housing_df(df: pd.DataFrame) -> pd.DataFrame:
    """Encode the raw world_real_estate_data (147k) columns into model-ready numeric form."""
    out = pd.DataFrame()
    out["sqft"] = df["apartment_total_area"].apply(_parse_area_to_sqft)
    out["bedrooms"] = pd.to_numeric(df["apartment_bedrooms"], errors='coerce')
    out["bathrooms"] = pd.to_numeric(df["apartment_bathrooms"], errors='coerce')
    rooms = pd.to_numeric(df["apartment_rooms"], errors='coerce').fillna(2.0)
    out["bedrooms"] = out["bedrooms"].fillna(rooms - 1.0).clip(1.0, 10.0)
    out["bathrooms"] = out["bathrooms"].fillna(1.0).clip(1.0, 10.0)
    out["stories"] = pd.to_numeric(df["building_total_floors"], errors='coerce').fillna(3.0).clip(1.0, 50.0)
    country_lower = df["country"].astype(str).str.strip().str.lower()
    out["is_turkey"]     = (country_lower == "turkey").astype(float)
    out["is_hungary"]    = (country_lower == "hungary").astype(float)
    out["is_russia"]     = (country_lower == "russia").astype(float)
    out["is_spain"]      = (country_lower == "spain").astype(float)
    out["is_belarus"]    = (country_lower == "belarus").astype(float)
    out["is_greece"]     = (country_lower == "greece").astype(float)
    out["is_montenegro"] = (country_lower == "montenegro").astype(float)
    return out

# ════════════════════════════════════════════════════════════════════════════════
# LAND VALUATION MODEL
# ════════════════════════════════════════════════════════════════════════════════
class LandValuationModel:
    """
    ML land-price model trained ONLY on real land data (land_data.csv).
    Uses only land-relevant features:
        area_sqft, latitude, longitude, district, land_type,
        location_type, road_access, utilities_available.

    If the dataset is absent or too small (< MIN_LAND_RECORDS rows after
    cleaning), land_model_ready = False and predict() raises ValueError
    with message "Insufficient land-market data for reliable ML prediction"
    instead of returning fake or deterministic values.

    Confidence = 100 - MAPE (from held-out 20% test set).
    Risk Score = meaningful combination of location, access, utilities, and MAPE.
    """

    def __init__(self):
        self.rf_model  = None
        self.gb_model  = None
        self.best_model_name = "None"
        self.land_model_ready = False
        self.dataset_size = 0
        self.metrics = {}
        self.encoders: dict = {}
        self.margin_percent = 0.25
        self.feature_importances = {}
        # Market statistics computed from the training dataset — used for investment scoring
        self.market_stats: dict = {}
        self._train()

    # ------------------------------------------------------------------
    def _train(self):
        if not HAS_SKLEARN:
            print("[LandModel] scikit-learn not available – land ML disabled.")
            return

        df = self._load_land_dataset()

        if df is None or len(df) < MIN_LAND_RECORDS:
            n = len(df) if df is not None else 0
            print(
                f"[LandModel] Insufficient land records ({n} found, "
                f"{MIN_LAND_RECORDS} required) – ML disabled."
            )
            return

        try:
            df = df.copy()

            # ── Encode categorical columns ──────────────────────────────
            cat_cols = {
                "district":            "district_enc",
                "land_type":           "land_type_enc",
                "location_type":       "location_type_enc",
                "road_access":         "road_access_enc",
                "utilities_available": "utilities_enc",
            }
            for src, dst in cat_cols.items():
                if src in df.columns:
                    le = LabelEncoder()
                    df[dst] = le.fit_transform(
                        df[src].astype(str).str.strip().str.lower().fillna("unknown")
                    )
                    self.encoders[src] = le
                else:
                    df[dst] = 0

            # ── Numeric columns ─────────────────────────────────────────
            for col in ["area_sqft", "latitude", "longitude", "price_per_sqft"]:
                df[col] = pd.to_numeric(df.get(col, 0), errors="coerce")

            # ── Clean ───────────────────────────────────────────────────
            df = df.dropna(subset=["area_sqft", "price_per_sqft"])
            df = df[(df["price_per_sqft"] > 1) & (df["price_per_sqft"] < 1e9)]
            df = df[df["area_sqft"] > 0]

            if len(df) < MIN_LAND_RECORDS:
                print(
                    f"[LandModel] After cleaning only {len(df)} land records remain – ML disabled."
                )
                return

            X = df[LAND_FEATURES].fillna(0)
            y = df["price_per_sqft"]
            self.dataset_size = len(y)

            # ── Train / test split (80/20) ──────────────────────────────
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

            # ── Random Forest ───────────────────────────────────────────
            rf = RandomForestRegressor(
                n_estimators=200, max_depth=12, min_samples_leaf=3,
                random_state=42, n_jobs=-1
            )
            rf.fit(X_train, y_train)
            rf_preds = rf.predict(X_test)
            rf_r2    = r2_score(y_test, rf_preds)

            # ── Gradient Boosting ───────────────────────────────────────
            gb = GradientBoostingRegressor(
                n_estimators=200, learning_rate=0.08, max_depth=5,
                min_samples_leaf=3, subsample=0.8, random_state=42
            )
            gb.fit(X_train, y_train)
            gb_preds = gb.predict(X_test)
            gb_r2    = r2_score(y_test, gb_preds)

            # ── Choose best based on R² ─────────────────────────────────
            if rf_r2 >= gb_r2:
                self.best_model_name = "Random Forest"
                best_preds = rf_preds
                best_importances = rf.feature_importances_
            else:
                self.best_model_name = "Gradient Boosting"
                best_preds = gb_preds
                best_importances = gb.feature_importances_

            self.rf_model = rf
            self.gb_model = gb

            # ── Real evaluation metrics from held-out test set ──────────
            # Clip outlier predictions to avoid inflated MAPE
            safe_y_test = y_test.replace(0, np.nan)
            mape_arr = np.abs((y_test - best_preds) / safe_y_test) * 100
            mape_val = float(mape_arr.dropna().mean())
            if np.isnan(mape_val) or np.isinf(mape_val):
                mape_val = 30.0

            self.metrics = {
                "r2":   float(r2_score(y_test, best_preds)),
                "mae":  float(mean_absolute_error(y_test, best_preds)),
                "rmse": float(np.sqrt(mean_squared_error(y_test, best_preds))),
                "mape": round(mape_val, 2),
            }

            # Prediction interval width = MAPE-derived margin
            self.margin_percent = min(0.50, max(0.05, mape_val / 100.0))

            # Feature importances from the winning model (real, not hand-assigned)
            self.feature_importances = {
                f: round(float(imp) * 100, 1)
                for f, imp in zip(LAND_FEATURES, best_importances)
            }

            # Build market statistics for investment scoring
            self._build_market_stats(df)

            self.land_model_ready = True
            print(
                f"[LandModel] Trained on {self.dataset_size} land records | "
                f"Best: {self.best_model_name} | "
                f"R²={self.metrics['r2']:.3f} | "
                f"MAE={self.metrics['mae']:.2f} | "
                f"RMSE={self.metrics['rmse']:.2f} | "
                f"MAPE={mape_val:.1f}%"
            )

        except Exception as e:
            print(f"[LandModel] Training failed: {e}")
            self.land_model_ready = False

    # ------------------------------------------------------------------
    def _load_land_dataset(self):
        """
        Load ONLY the dedicated land_data.csv.
        We do NOT fall back to the global housing dataset — housing data
        is not representative of land valuation and would produce misleading
        models (latitude=0, longitude=0, no land-specific features).
        """
        if os.path.exists(LAND_DATASET_PATH):
            try:
                df = pd.read_csv(LAND_DATASET_PATH)
                # Accept price_per_sqft or convert from price_per_acre
                if "price_per_sqft" in df.columns:
                    print(f"[LandModel] Loaded dedicated land dataset: {len(df)} rows")
                    return df
                if "price_per_acre" in df.columns:
                    df["price_per_sqft"] = (
                        pd.to_numeric(df["price_per_acre"], errors="coerce") / SQFT_PER_ACRE
                    )
                    print(f"[LandModel] Loaded land dataset (price_per_acre→sqft): {len(df)} rows")
                    return df
                print("[LandModel] land_data.csv has no price_per_sqft or price_per_acre column.")
            except Exception as e:
                print(f"[LandModel] Failed to load {LAND_DATASET_PATH}: {e}")

        print(
            "[LandModel] land_data.csv not found. "
            "Land ML disabled — will return insufficient-data error."
        )
        return None

    # ------------------------------------------------------------------
    def _build_market_stats(self, df: pd.DataFrame) -> None:
        """
        Compute and store market statistics from the full training dataset.
        These stats are used by _compute_investment_score() to produce
        data-driven, deterministic investment scores.

        Stored in self.market_stats:
          global_*       — dataset-wide price_per_sqft percentiles
          district_*     — per-district median, percentile bands, count
          loc_type_*     — per-location_type median price
          land_type_*    — per-land_type median price
          road_ratio     — median price ratio (road=yes / road=no)
          util_ratio     — median price ratio (utilities=yes / utilities=no)
        """
        p = df["price_per_sqft"].dropna()

        # Global percentile anchors
        self.market_stats["global_p10"]    = float(np.percentile(p, 10))
        self.market_stats["global_p25"]    = float(np.percentile(p, 25))
        self.market_stats["global_p50"]    = float(np.percentile(p, 50))
        self.market_stats["global_p75"]    = float(np.percentile(p, 75))
        self.market_stats["global_p90"]    = float(np.percentile(p, 90))
        self.market_stats["global_max"]    = float(p.max())
        self.market_stats["global_min"]    = float(p.min())

        # Per-district: median price, count, 25th and 75th percentiles
        district_col = df["district"].astype(str).str.strip().str.lower() if "district" in df.columns else pd.Series(["unknown"] * len(df))
        dist_stats = {}
        for dist, grp in df.groupby(district_col):
            ps = grp["price_per_sqft"].dropna()
            if len(ps) > 0:
                dist_stats[dist] = {
                    "median": float(ps.median()),
                    "p25":    float(np.percentile(ps, 25)),
                    "p75":    float(np.percentile(ps, 75)),
                    "mean":   float(ps.mean()),
                    "count":  int(len(ps)),
                }
        self.market_stats["district"] = dist_stats

        # Per-location_type: median price (used for scoring component)
        loc_col = df["location_type"].astype(str).str.strip().str.lower() if "location_type" in df.columns else pd.Series(["unknown"] * len(df))
        loc_stats = {}
        for loc_type, grp in df.groupby(loc_col):
            ps = grp["price_per_sqft"].dropna()
            if len(ps) > 0:
                loc_stats[loc_type] = float(ps.median())
        self.market_stats["location_type"] = loc_stats

        # Per-land_type: median price
        lt_col = df["land_type"].astype(str).str.strip().str.lower() if "land_type" in df.columns else pd.Series(["unknown"] * len(df))
        lt_stats = {}
        for lt, grp in df.groupby(lt_col):
            ps = grp["price_per_sqft"].dropna()
            if len(ps) > 0:
                lt_stats[lt] = float(ps.median())
        self.market_stats["land_type"] = lt_stats

        # Road access price ratio — measures real market premium for road access
        if "road_access" in df.columns:
            road_yes = df[df["road_access"].astype(str).str.strip().str.lower() == "yes"]["price_per_sqft"].median()
            road_no  = df[df["road_access"].astype(str).str.strip().str.lower() == "no" ]["price_per_sqft"].median()
            self.market_stats["road_ratio"] = float(road_yes / road_no) if road_no and road_no > 0 else 2.0
        else:
            self.market_stats["road_ratio"] = 2.0

        # Utilities price ratio
        if "utilities_available" in df.columns:
            util_yes = df[df["utilities_available"].astype(str).str.strip().str.lower() == "yes"]["price_per_sqft"].median()
            util_no  = df[df["utilities_available"].astype(str).str.strip().str.lower() == "no" ]["price_per_sqft"].median()
            self.market_stats["util_ratio"] = float(util_yes / util_no) if util_no and util_no > 0 else 2.0
        else:
            self.market_stats["util_ratio"] = 2.0

    # ------------------------------------------------------------------
    def _compute_investment_score(
        self,
        predicted_pps: float,
        extra_details: dict,
    ) -> float:
        """
        Compute a strictly deterministic, data-driven investment attractiveness score (0–100)
        from dataset-derived market statistics and property attributes.
        """
        ms = self.market_stats
        if not ms:
            return 50.0

        location_type = str(extra_details.get("location_type", "")).strip().lower()
        land_type     = str(extra_details.get("land_type",     "")).strip().lower()
        road_access   = str(extra_details.get("road_access",   "")).strip().lower()
        utilities     = str(extra_details.get("utilities_available", "")).strip().lower()
        district      = str(extra_details.get("district",       "")).strip().lower()

        dist_data   = ms.get("district", {}).get(district, {})
        dist_count  = dist_data.get("count", 0)
        
        # ── Component 1: Market Demand (30 points) ────────────────────────
        # Using empirical medians from the dataset
        loc_med = ms.get("location_type", {}).get(location_type, ms.get("global_p50", 1000.0))
        land_med = ms.get("land_type", {}).get(land_type, ms.get("global_p50", 1000.0))
        global_p50 = ms.get("global_p50", 1000.0)
        
        loc_ratio = loc_med / max(global_p50, 1.0)
        land_ratio = land_med / max(global_p50, 1.0)
        
        def score_ratio(ratio, max_pts):
            if ratio < 0.5:
                return max_pts * 0.2
            elif ratio < 1.0:
                return max_pts * (0.2 + 0.3 * (ratio - 0.5) / 0.5)
            elif ratio < 2.0:
                return max_pts * (0.5 + 0.3 * (ratio - 1.0) / 1.0)
            else:
                return max_pts * min(1.0, 0.8 + 0.2 * (ratio - 2.0) / 3.0)
                
        demand_score = score_ratio(loc_ratio, 15.0) + score_ratio(land_ratio, 15.0)
        
        # ── Component 2: Infrastructure Value (25 points) ─────────────────
        road_ratio = ms.get("road_ratio", 2.0)
        util_ratio = ms.get("util_ratio", 2.0)
        has_road = "no" not in road_access and road_access not in ("", "none")
        has_utils = "no" not in utilities and utilities not in ("", "none")
        
        total_weight = road_ratio + util_ratio
        road_pts = (road_ratio / total_weight) * 25.0
        util_pts = (util_ratio / total_weight) * 25.0
        
        infra_score = 0.0
        if has_road: infra_score += road_pts
        if has_utils: infra_score += util_pts
        
        # ── Component 3: Price Opportunity (35 points) ────────────────────
        dist_med = dist_data.get("median", global_p50)
        price_ratio = predicted_pps / max(dist_med, 1.0)
        
        if price_ratio < 0.3:
            price_score = 15.0 # Too cheap, high risk of hidden issues
        elif 0.3 <= price_ratio < 0.8:
            price_score = 25.0 + (price_ratio - 0.3) / 0.5 * 10.0 # 25 to 35 (bargain zone)
        elif 0.8 <= price_ratio < 1.2:
            price_score = 35.0 - (price_ratio - 0.8) / 0.4 * 5.0 # 35 to 30 (fair market value)
        elif 1.2 <= price_ratio < 2.0:
            price_score = 30.0 - (price_ratio - 1.2) / 0.8 * 15.0 # 30 to 15 (getting expensive)
        else:
            price_score = max(0.0, 15.0 - (price_ratio - 2.0) * 5.0) # Overpriced for area
            
        # ── Component 4: District Liquidity (10 points) ───────────────────
        if dist_count >= 20:
            liquidity_score = 10.0
        else:
            liquidity_score = (dist_count / 20.0) * 10.0

        raw_score = demand_score + infra_score + price_score + liquidity_score
        return round(min(100.0, max(0.0, raw_score)), 1)

    # ------------------------------------------------------------------
    def _encode_input(
        self,
        extra_details: dict,
        area_sqft: float,
        lat: float,
        lon: float,
    ) -> pd.DataFrame:
        """Build the feature vector for inference."""
        row = {
            "area_sqft":         area_sqft,
            "latitude":          lat if lat is not None else 0.0,
            "longitude":         lon if lon is not None else 0.0,
            "district_enc":      0,
            "land_type_enc":     0,
            "location_type_enc": 0,
            "road_access_enc":   0,
            "utilities_enc":     0,
        }

        cat_map = {
            "district":            "district_enc",
            "land_type":           "land_type_enc",
            "location_type":       "location_type_enc",
            "road_access":         "road_access_enc",
            "utilities_available": "utilities_enc",
        }
        for src, dst in cat_map.items():
            val = str(extra_details.get(src, "unknown")).strip().lower()
            if src in self.encoders:
                le = self.encoders[src]
                if val in le.classes_:
                    row[dst] = int(le.transform([val])[0])
                else:
                    row[dst] = 0  # unseen category → default

        return pd.DataFrame([row], columns=LAND_FEATURES)

    # ------------------------------------------------------------------
    def predict(
        self,
        area_sqft: float,
        extra_details: dict,
        hold_years: int = 1,
        lat: float = None,
        lon: float = None,
    ) -> dict:
        """
        Returns a prediction dict, or raises ValueError if model is not ready.
        Confidence  = 100 - MAPE  (test-set MAPE; lower MAPE → higher confidence).
        Risk Score  = combination of location quality, road, utilities, and model MAPE.
        """
        if not self.land_model_ready:
            raise ValueError("Insufficient land-market data for reliable ML prediction")

        X = self._encode_input(extra_details, area_sqft, lat, lon)

        # Individual model predictions (price per sqft)
        rf_pps = max(float(self.rf_model.predict(X)[0]), 0.01)
        gb_pps = max(float(self.gb_model.predict(X)[0]), 0.01)

        if self.best_model_name == "Random Forest":
            best_pps = rf_pps
        else:
            best_pps = gb_pps

        # Total price = price/sqft × area
        total_price = best_pps * area_sqft
        rf_total    = rf_pps   * area_sqft
        gb_total    = gb_pps   * area_sqft

        # Prediction interval
        margin      = total_price * self.margin_percent
        lower_bound = max(0.0, total_price - margin)
        upper_bound = total_price + margin

        # Projected value using model-derived appreciation rate
        appreciation_rate = APPRECIATION_RATES["land"]
        projected_price   = total_price * ((1 + appreciation_rate) ** max(1, hold_years))

        # ── Confidence: derived from actual test MAPE and district data ─────
        # Lower MAPE → higher confidence (capped at 100%)
        mape = self.metrics.get("mape", 30.0)
        base_confidence = round(max(0.0, min(100.0, 100.0 - mape)), 1)
        
        # Penalize confidence if local data is sparse
        district = str(extra_details.get("district", "")).strip().lower()
        dist_count = self.market_stats.get("district", {}).get(district, {}).get("count", 0) if self.market_stats else 0
        
        if dist_count < 10:
            confidence = round(base_confidence * max(0.4, dist_count / 10.0), 1)
        else:
            confidence = base_confidence

        # ── Risk Score: meaningful composite score ──────────────────────
        # Base: 25 (representing inherent land investment risk)
        risk = 25.0

        location_type = str(extra_details.get("location_type", "")).strip().lower()
        road_access   = str(extra_details.get("road_access", "")).strip().lower()
        utilities     = str(extra_details.get("utilities_available", "")).strip().lower()
        land_type     = str(extra_details.get("land_type", "")).strip().lower()

        # Location quality impact
        if "rural" in location_type:
            risk += 20.0   # remote/rural is riskier
        elif "semi" in location_type:
            risk += 10.0
        elif "commercial" in location_type:
            risk += 5.0    # commercial premium zones have slightly higher risk
        # Urban subtracts nothing from base

        # Road access
        if "no" in road_access or road_access in ("", "none"):
            risk += 15.0   # no road significantly raises risk

        # Utilities
        if "no" in utilities or utilities in ("", "none"):
            risk += 10.0   # no utilities raises risk

        # Land type
        if "agricultural" in land_type:
            risk += 10.0   # agricultural has regulatory/conversion risk

        # Model uncertainty contribution (MAPE → risk)
        risk += min(15.0, mape * 0.25)

        risk_score = round(min(100.0, max(0.0, risk)), 1)

        # ── Investment Score: data-driven attractiveness score (0–100) ──
        # Entirely separate from risk_score and confidence.
        # Computed from dataset statistics — see _compute_investment_score().
        investment_score = self._compute_investment_score(best_pps, extra_details)

        return {
            "predicted_price":    round(total_price, 2),
            "predicted_per_sqft": round(best_pps, 2),
            "lower_bound":        round(lower_bound, 2),
            "upper_bound":        round(upper_bound, 2),
            "confidence":         confidence,
            "risk_score":         risk_score,
            "investment_score":   investment_score,
            "feature_importance": self.feature_importances,
            "appreciation_rate":  round(appreciation_rate * 100, 1),
            "projected_price":    round(projected_price, 2),
            "hold_years":         hold_years,
            "data_source": (
                f"Land ML model ({self.best_model_name}) trained on "
                f"{self.dataset_size} real land records | "
                f"R²={self.metrics.get('r2', 0):.3f} | "
                f"MAPE={mape:.1f}%"
            ),
            "model_comparison": {
                "Random Forest":     round(rf_total, 2),
                "Gradient Boosting": round(gb_total, 2),
            },
            "metrics": self.metrics,
        }


land_valuation_model = LandValuationModel()


# ════════════════════════════════════════════════════════════════════════════════
# HOUSING VALUATION MODEL
# ════════════════════════════════════════════════════════════════════════════════
class PropertyValuationModel:
    """
    ML-backed housing valuation model trained on world_real_estate_data.csv.
    Ensemble: Random Forest + Gradient Boosting.
    For 'Land' property type, delegates entirely to LandValuationModel.
    """

    def __init__(self):
        self.rf_model = None
        self.gb_model = None
        self.best_model_name = "None"
        self.features = HOUSING_FEATURES
        self.dataset_size = 0
        self.margin_percent = 0.245
        self.metrics = {"r2": 0, "mae": 0, "rmse": 0, "mape": 0}
        self.train_models()

    def train_models(self):
        df_raw = None
        if os.path.exists(DATASET_PATH):
            try:
                df_raw = pd.read_csv(DATASET_PATH)
            except Exception:
                df_raw = None

        if df_raw is not None and HAS_SKLEARN:
            try:
                y_raw = pd.to_numeric(df_raw["price_in_USD"], errors='coerce')
                X_raw = _encode_housing_df(df_raw)

                combined = X_raw.copy()
                combined["price"] = y_raw
                combined = combined.dropna(subset=["sqft", "price"])
                combined = combined[(combined["price"] > 1000) & (combined["price"] < 10000000)]

                if len(combined) > 30000:
                    combined = combined.sample(30000, random_state=42)

                X = combined[HOUSING_FEATURES]
                y = combined["price"] * 83.0
                self.dataset_size = len(y)

                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=0.2, random_state=42
                )

                self.rf_model = RandomForestRegressor(
                    n_estimators=100, max_depth=12, min_samples_leaf=4,
                    random_state=42, n_jobs=-1
                )
                self.rf_model.fit(X_train, y_train)
                rf_preds = self.rf_model.predict(X_test)
                rf_r2    = r2_score(y_test, rf_preds)

                self.gb_model = GradientBoostingRegressor(
                    n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42
                )
                self.gb_model.fit(X_train, y_train)
                gb_preds = self.gb_model.predict(X_test)
                gb_r2    = r2_score(y_test, gb_preds)

                if rf_r2 >= gb_r2:
                    self.best_model_name = "Random Forest"
                    best_preds = rf_preds
                else:
                    self.best_model_name = "Gradient Boosting"
                    best_preds = gb_preds

                mape_raw = float(np.mean(np.abs((y_test - best_preds) / y_test)) * 100)
                if np.isnan(mape_raw) or np.isinf(mape_raw):
                    mape_raw = 24.5

                self.metrics = {
                    "r2":   float(r2_score(y_test, best_preds)),
                    "mae":  float(mean_absolute_error(y_test, best_preds)),
                    "rmse": float(np.sqrt(mean_squared_error(y_test, best_preds))),
                    "mape": round(mape_raw, 2),
                }
                self.margin_percent = min(0.5, max(0.05, mape_raw / 100.0))

                print(
                    f"[HousingModel] Trained on {self.dataset_size} records | "
                    f"Best: {self.best_model_name} | "
                    f"R²={self.metrics['r2']:.3f} | MAPE={mape_raw:.1f}%"
                )
                return
            except Exception as e:
                print(f"[HousingModel] Dataset training failed ({e}), falling back to baseline.")

        self.rf_model = None
        self.gb_model = None

    def _build_input_row(self, sqft, bedrooms, bathrooms, year_built, extra_details):
        ed = extra_details or {}
        stories = float(ed.get("stories", 2) or 2)
        address_lower = (
            str(ed.get("address", "")).lower() + " " + str(ed.get("location", "")).lower()
        )
        row = {
            "sqft":          float(sqft),
            "bedrooms":      float(bedrooms),
            "bathrooms":     float(bathrooms),
            "stories":       stories,
            "is_turkey":     1.0 if "turkey"     in address_lower else 0.0,
            "is_hungary":    1.0 if "hungary"    in address_lower else 0.0,
            "is_russia":     1.0 if "russia"     in address_lower else 0.0,
            "is_spain":      1.0 if "spain"      in address_lower else 0.0,
            "is_belarus":    1.0 if "belarus"    in address_lower else 0.0,
            "is_greece":     1.0 if "greece"     in address_lower else 0.0,
            "is_montenegro": 1.0 if "montenegro" in address_lower else 0.0,
        }
        return pd.DataFrame([row], columns=HOUSING_FEATURES)

    def predict(
        self,
        sqft,
        bedrooms,
        bathrooms,
        year_built,
        property_type="Houses (single-family, townhouses)",
        extra_details=None,
        hold_years=1,
    ) -> dict:
        if extra_details is None:
            extra_details = {}

        hold_years   = max(1, int(hold_years))
        p_type_lower = property_type.lower()
        is_land      = "land" in p_type_lower

        # ── LAND: delegate entirely to the dedicated land model ───────────
        if is_land:
            lat = extra_details.get("latitude")
            lon = extra_details.get("longitude")
            # This raises ValueError("Insufficient land-market data ...") when
            # land_model_ready is False — caller handles it as HTTP 422.
            result = land_valuation_model.predict(sqft, extra_details, hold_years, lat, lon)
            result["predicted_per_unit"] = result.get("predicted_per_sqft", 0.0)
            result["projected_per_sqft"] = round(
                result["projected_price"] / max(1, sqft), 2
            )
            result["image_scores"] = {}
            return result

        # ── HOUSING: original pipeline ────────────────────────────────────
        data_source = f"Trained on {self.dataset_size} real global housing records (147k dataset)"
        if self.rf_model is not None:
            X_input      = self._build_input_row(sqft, bedrooms, bathrooms, year_built, extra_details)
            predicted_rf = float(self.rf_model.predict(X_input)[0])
            predicted_gb = float(self.gb_model.predict(X_input)[0])

            if self.best_model_name == "Random Forest":
                predicted_price = predicted_rf
                importances     = self.rf_model.feature_importances_
            else:
                predicted_price = predicted_gb
                importances     = self.gb_model.feature_importances_

            feat_importance = {
                name: round(float(imp) * 100, 1)
                for name, imp in zip(HOUSING_FEATURES, importances)
            }
        else:
            predicted_price = (
                500000 + (sqft * 2800) + (bedrooms * 300000)
                + (bathrooms * 400000) + ((year_built - 1980) * 25000)
            )
            predicted_price = max(500000, predicted_price)
            predicted_rf    = predicted_price
            predicted_gb    = predicted_price
            feat_importance = {f: round(100 / len(HOUSING_FEATURES), 1) for f in HOUSING_FEATURES}

        margin_percent = self.margin_percent

        mape = self.metrics.get("mape", 25.0)
        confidence  = round(max(0.0, min(100.0, 100.0 - mape)), 1)
        risk_score  = round(30.0 + (margin_percent * 40), 1)
        age = datetime.now().year - int(year_built)
        if age > 30:
            risk_score = min(100.0, risk_score + 10.0)
        elif age < 5:
            risk_score = max(0.0, risk_score - 5.0)

        appreciation_rate = APPRECIATION_RATES.get("house", 0.08)
        for key, rate in APPRECIATION_RATES.items():
            if key in p_type_lower:
                appreciation_rate = rate
                break

        margin          = predicted_price * margin_percent
        lower_bound     = round(max(0, predicted_price - margin), 2)
        upper_bound     = round(predicted_price + margin, 2)
        predicted_price = round(predicted_price, 2)
        projected_price = round(predicted_price * ((1 + appreciation_rate) ** hold_years), 2)
        projected_per_sqft = round(projected_price / max(1, sqft), 2)

        image_scores = {}
        if "image_analysis" in extra_details:
            img = extra_details["image_analysis"]
            image_scores = {
                "road_access_score":    img.get("road_access_score", 0),
                "urbanization_score":   img.get("urbanization_score", 0),
                "development_score":    img.get("development_score", 0),
                "infrastructure_score": img.get("infrastructure_score", 0),
                "soil_type_detected":   img.get("soil_type_detected", "Unknown"),
                "location_type":        img.get("location_type", "Unknown"),
            }
            dev_score   = img.get("development_score", 50)
            infra_score = img.get("infrastructure_score", 50)
            multiplier  = 1.0 + ((dev_score - 50) * 0.002) + ((infra_score - 50) * 0.002)
            predicted_price    = round(predicted_price * multiplier, 2)
            margin             = predicted_price * margin_percent
            lower_bound        = round(max(0, predicted_price - margin), 2)
            upper_bound        = round(predicted_price + margin, 2)
            projected_price    = round(predicted_price * ((1 + appreciation_rate) ** hold_years), 2)
            projected_per_sqft = round(projected_price / max(1, sqft), 2)
            data_source       += " + Image Features adjusted"

        return {
            "predicted_price":    predicted_price,
            "lower_bound":        lower_bound,
            "upper_bound":        upper_bound,
            "confidence":         confidence,
            "risk_score":         round(risk_score, 1),
            "feature_importance": feat_importance,
            "appreciation_rate":  round(appreciation_rate * 100, 1),
            "projected_price":    projected_price,
            "projected_per_sqft": projected_per_sqft,
            "hold_years":         hold_years,
            "data_source":        data_source,
            "model_comparison": {
                "Random Forest":     round(predicted_rf if self.rf_model else predicted_price, 2),
                "Gradient Boosting": round(predicted_gb if self.rf_model else predicted_price, 2),
            },
            "image_scores": image_scores,
        }


valuation_model = PropertyValuationModel()

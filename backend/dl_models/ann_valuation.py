"""
ANN (Artificial Neural Network) Property Valuation Model
=========================================================
Architecture : 4 hidden layers (256 → 128 → 64 → 32)
               ReLU + Dropout(0.3) + BatchNormalization
               Output: Single linear neuron (price regression)
Dataset       : world_real_estate_data.csv (30 000-record sample)
Persistence   : Saved/loaded from dl_models/saved_models/ann_valuation.keras
Metrics       : MAE, RMSE, R²  (computed on 20% hold-out test split)
"""

import os
import json
import numpy as np
import pandas as pd
import re

# ─── Paths ────────────────────────────────────────────────────────────────────
_HERE        = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(_HERE, "..", "..", "datasets", "world_real_estate_data.csv")
SAVED_DIR    = os.path.join(_HERE, "saved_models")
MODEL_PATH   = os.path.join(SAVED_DIR, "ann_valuation.keras")
SCALER_PATH  = os.path.join(SAVED_DIR, "ann_valuation_scaler.json")

os.makedirs(SAVED_DIR, exist_ok=True)

# ─── Feature names (must match ML valuation features) ────────────────────────
FEATURES = [
    "sqft", "bedrooms", "bathrooms", "stories",
    "is_turkey", "is_hungary", "is_russia", "is_spain",
    "is_belarus", "is_greece", "is_montenegro"
]

# ─── Optional heavy imports ───────────────────────────────────────────────────
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    HAS_TF = True
except ImportError:
    HAS_TF = False

try:
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False


# ─── Preprocessing helpers ────────────────────────────────────────────────────
def _parse_area_to_sqft(x):
    """Convert text like '120 m²' → float (sqft)."""
    if pd.isna(x):
        return np.nan
    match = re.search(r'([\d\.,]+)', str(x))
    if match:
        try:
            return float(match.group(1).replace(',', '')) * 10.7639
        except Exception:
            pass
    return np.nan


def _encode_df(df: pd.DataFrame) -> pd.DataFrame:
    """Encode raw CSV columns into numeric feature matrix."""
    out = pd.DataFrame()
    out["sqft"]      = df["apartment_total_area"].apply(_parse_area_to_sqft)
    rooms            = pd.to_numeric(df["apartment_rooms"], errors="coerce").fillna(2.0)
    out["bedrooms"]  = pd.to_numeric(df["apartment_bedrooms"], errors="coerce").fillna(rooms - 1.0).clip(1, 10)
    out["bathrooms"] = pd.to_numeric(df["apartment_bathrooms"], errors="coerce").fillna(1.0).clip(1, 10)
    out["stories"]   = pd.to_numeric(df["building_total_floors"], errors="coerce").fillna(3.0).clip(1, 50)
    cl               = df["country"].astype(str).str.strip().str.lower()
    for c in ["turkey", "hungary", "russia", "spain", "belarus", "greece", "montenegro"]:
        out[f"is_{c}"] = (cl == c).astype(float)
    return out


class ANNValuationModel:
    """
    Deep Learning ANN for property price prediction.
    Falls back to simple linear estimation if TensorFlow is unavailable.
    """

    def __init__(self):
        self.model       = None
        self.scaler_mean = None
        self.scaler_std  = None
        self.metrics     = {}
        self.dataset_size = 0
        self._load_or_train()

    # ── Build Keras model ────────────────────────────────────────────────────
    def _build_model(self, n_features: int) -> "keras.Model":
        inp = keras.Input(shape=(n_features,), name="features")
        x = layers.Dense(256, activation="relu")(inp)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.3)(x)
        x = layers.Dense(128, activation="relu")(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.3)(x)
        x = layers.Dense(64, activation="relu")(x)
        x = layers.Dropout(0.2)(x)
        x = layers.Dense(32, activation="relu")(x)
        out = layers.Dense(1, activation="linear", name="price")(x)
        model = keras.Model(inputs=inp, outputs=out)
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss="huber",           # robust to outliers
            metrics=["mae"]
        )
        return model

    # ── Save/Load scaler (JSON, no extra deps) ───────────────────────────────
    def _save_scaler(self):
        with open(SCALER_PATH, "w") as f:
            json.dump({"mean": self.scaler_mean.tolist(),
                       "std":  self.scaler_std.tolist()}, f)

    def _load_scaler(self):
        with open(SCALER_PATH) as f:
            d = json.load(f)
        self.scaler_mean = np.array(d["mean"])
        self.scaler_std  = np.array(d["std"])

    def _scale(self, X: np.ndarray) -> np.ndarray:
        return (X - self.scaler_mean) / (self.scaler_std + 1e-8)

    # ── Load saved or train fresh ─────────────────────────────────────────────
    def _load_or_train(self):
        if HAS_TF and os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            try:
                self.model = keras.models.load_model(MODEL_PATH)
                self._load_scaler()
                self.metrics = {"status": "loaded_from_disk"}
                print("[ANN Valuation] Loaded saved model from disk.")
                return
            except Exception as e:
                print(f"[ANN Valuation] Failed to load saved model ({e}). Retraining…")

        self._train()

    # ── Training pipeline ────────────────────────────────────────────────────
    def _train(self):
        if not HAS_TF or not HAS_SKLEARN:
            print("[ANN Valuation] TensorFlow/sklearn not available — using fallback estimation.")
            return

        if not os.path.exists(DATASET_PATH):
            print("[ANN Valuation] Dataset not found — using fallback estimation.")
            return

        try:
            print("[ANN Valuation] Loading dataset…")
            df_raw = pd.read_csv(DATASET_PATH)
            y_raw  = pd.to_numeric(df_raw["price_in_USD"], errors="coerce")
            X_raw  = _encode_df(df_raw)

            combined        = X_raw.copy()
            combined["price"] = y_raw * 83.0        # USD → INR
            combined        = combined.dropna(subset=["sqft", "price"])
            combined        = combined[(combined["price"] > 1_000 * 83) &
                                       (combined["price"] < 10_000_000 * 83)]

            if len(combined) > 30_000:
                combined = combined.sample(30_000, random_state=42)

            X = combined[FEATURES].values.astype(np.float32)
            y = combined["price"].values.astype(np.float32)
            self.dataset_size = len(y)

            # Normalise
            self.scaler_mean = X.mean(axis=0)
            self.scaler_std  = X.std(axis=0)
            X_scaled         = self._scale(X)

            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.20, random_state=42
            )

            # Suppress TF training logs for cleaner server output
            tf.get_logger().setLevel("ERROR")

            self.model = self._build_model(X_train.shape[1])
            self.model.fit(
                X_train, y_train,
                epochs=30,
                batch_size=64,
                validation_split=0.1,
                verbose=0,
                callbacks=[
                    keras.callbacks.EarlyStopping(
                        monitor="val_loss", patience=5, restore_best_weights=True
                    )
                ]
            )

            # ── Evaluate ──────────────────────────────────────────────────────
            y_pred  = self.model.predict(X_test, verbose=0).flatten()
            mae     = float(mean_absolute_error(y_test, y_pred))
            rmse    = float(np.sqrt(mean_squared_error(y_test, y_pred)))
            r2      = float(r2_score(y_test, y_pred))

            self.metrics = {
                "MAE":          round(mae, 2),
                "RMSE":         round(rmse, 2),
                "R2":           round(r2, 4),
                "dataset_size": self.dataset_size,
                "status":       "trained"
            }
            print(f"[ANN Valuation] Trained on {self.dataset_size} records | "
                  f"MAE: ₹{mae:,.0f} | RMSE: ₹{rmse:,.0f} | R²: {r2:.4f}")

            # ── Persist ───────────────────────────────────────────────────────
            self.model.save(MODEL_PATH)
            self._save_scaler()
            print("[ANN Valuation] Model saved to disk.")

        except Exception as e:
            print(f"[ANN Valuation] Training failed: {e} — using fallback.")
            self.model = None

    # ── Predict ──────────────────────────────────────────────────────────────
    def predict(
        self,
        sqft: float,
        bedrooms: int,
        bathrooms: float,
        year_built: int,
        extra_details: dict = None
    ) -> dict:
        """
        Returns a prediction dict with dl_price, confidence, and model metrics.
        Falls back to a formula-based estimate if the model is unavailable.
        """
        ed = extra_details or {}
        stories        = float(ed.get("stories", 2) or 2)
        address_lower  = (str(ed.get("address", "")) + " " + str(ed.get("location", ""))).lower()
        countries      = ["turkey", "hungary", "russia", "spain", "belarus", "greece", "montenegro"]
        country_flags  = [1.0 if c in address_lower else 0.0 for c in countries]

        feature_vec = np.array([[
            float(sqft), float(bedrooms), float(bathrooms), stories,
            *country_flags
        ]], dtype=np.float32)

        if self.model is not None and self.scaler_mean is not None:
            X_scaled = self._scale(feature_vec)
            predicted = float(self.model.predict(X_scaled, verbose=0)[0, 0])
            predicted = max(100_000.0, predicted)
            margin    = predicted * 0.20          # ANN tighter margin
        else:
            # Formula-based fallback
            predicted = (500_000 + sqft * 2_800 + bedrooms * 300_000
                         + bathrooms * 400_000 + (year_built - 1980) * 25_000)
            predicted = max(500_000.0, predicted)
            margin    = predicted * 0.30

        return {
            "dl_price":     round(predicted, 2),
            "lower_bound":  round(max(0, predicted - margin), 2),
            "upper_bound":  round(predicted + margin, 2),
            "confidence":   round(100.0 - (margin / predicted * 100), 1),
            "model":        "ANN (4-layer MLP)",
            "metrics":      self.metrics,
        }

    def get_metrics(self) -> dict:
        return self.metrics


# Singleton instance — imported by hybrid predictor
ann_valuation_model = ANNValuationModel()

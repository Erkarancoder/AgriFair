import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin


class AgronomicFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Domain-specific feature engineering transformer for irrigation advisory.
    Derives thermodynamic and agronomic indicators from standard sensor inputs.
    """

    STAGE_MAP = {
        "Sowing": 0,
        "Harvest": 1,
        "Vegetative": 2,
        "Flowering": 3,
    }

    FC_MAP = {
        "Sandy": 18.0,
        "Silt": 28.0,
        "Loamy": 32.0,
        "Clay": 38.0,
    }

    PWP_MAP = {
        "Sandy": 7.0,
        "Silt": 12.0,
        "Loamy": 15.0,
        "Clay": 20.0,
    }

    def fit(self, X: pd.DataFrame, y=None):
        if hasattr(X, "columns"):
            self.feature_names_in_ = np.asarray(X.columns, dtype=object)
            self.n_features_in_ = len(X.columns)
        elif hasattr(X, "shape"):
            self.n_features_in_ = X.shape[1]
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X_df = X.copy()

        # 1. Vapor Pressure Deficit (VPD in kPa) via Tetens equation
        temp = X_df["Temperature_C"]
        rh = X_df["Humidity"].clip(1, 100)
        es = 0.61078 * np.exp((17.27 * temp) / (temp + 237.3))
        X_df["VPD_kPa"] = es * (1.0 - (rh / 100.0))

        # 2. Moisture Deficit & Depletion relative to Field Capacity & PWP
        fc = X_df["Soil_Type"].map(self.FC_MAP).fillna(30.0)
        pwp = X_df["Soil_Type"].map(self.PWP_MAP).fillna(15.0)
        awc = np.maximum(1.0, fc - pwp)
        moist = X_df["Soil_Moisture"]

        X_df["Moisture_Deficit"] = fc - moist
        X_df["Depletion_Ratio"] = np.clip((fc - moist) / awc, 0.0, 2.0)

        # 3. Numeric stage rank
        stage_rank = X_df["Crop_Growth_Stage"].map(self.STAGE_MAP).fillna(1)
        X_df["Stage_Rank"] = stage_rank

        # 4. Critical stress interaction (Active stage x Moisture Deficit)
        X_df["Stage_Moisture_Stress"] = stage_rank * np.maximum(0.0, fc - moist)

        return X_df

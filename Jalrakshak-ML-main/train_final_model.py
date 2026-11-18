import argparse
from pathlib import Path
import sys

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier, VotingClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# Add project root to path so src.features can be imported
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.features import AgronomicFeatureEngineer

DEFAULT_DATA_PATH = Path("data/raw/irrigation_prediction.csv")
DEFAULT_MODEL_PATH = Path("models/irrigation_need_model.joblib")

# Production 6-feature schema matching src/predict.py
PRODUCTION_FEATURES = [
    "Soil_Moisture",
    "Crop_Type",
    "Crop_Growth_Stage",
    "Soil_Type",
    "Temperature_C",
    "Humidity",
]

CATEGORICAL_FEATURES = [
    "Crop_Type",
    "Crop_Growth_Stage",
    "Soil_Type",
]

ENGINEERED_NUMERIC_FEATURES = [
    "Soil_Moisture",
    "Temperature_C",
    "Humidity",
    "VPD_kPa",
    "Moisture_Deficit",
    "Depletion_Ratio",
    "Stage_Rank",
    "Stage_Moisture_Stress",
]


def train(
    data_path: Path = DEFAULT_DATA_PATH,
    model_path: Path = DEFAULT_MODEL_PATH,
):
    print(f"Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)

    features = list(PRODUCTION_FEATURES)
    print(f"[Schema] Training on production features: {features}")

    X = df[features]
    y = df["Irrigation_Need"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    print(f"Dataset split: {len(X_train)} training samples, {len(X_test)} test samples.")

    preprocessor = ColumnTransformer(
        [
            (
                "num",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", StandardScaler()),
                    ]
                ),
                ENGINEERED_NUMERIC_FEATURES,
            ),
            (
                "cat",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                CATEGORICAL_FEATURES,
            ),
        ]
    )

    # Base estimators
    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=16,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )

    gb = GradientBoostingClassifier(
        n_estimators=150,
        learning_rate=0.08,
        max_depth=5,
        subsample=0.85,
        random_state=42,
    )

    # Ensemble with soft probability voting
    ensemble = VotingClassifier(
        estimators=[
            ("rf", rf),
            ("gb", gb),
        ],
        voting="soft",
        weights=[1.0, 1.2],
    )

    model = Pipeline(
        [
            ("engineer", AgronomicFeatureEngineer()),
            ("preprocessor", preprocessor),
            ("classifier", ensemble),
        ]
    )

    print("Fitting upgraded Agronomic Ensemble model...")
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    test_acc = accuracy_score(y_test, predictions)
    test_f1 = f1_score(y_test, predictions, average="macro")

    print("\n" + "=" * 50)
    print("HELD-OUT TEST EVALUATION REPORT")
    print("=" * 50)
    print(f"Test Accuracy: {test_acc:.4f} ({test_acc * 100:.2f}%)")
    print(f"Macro F1-Score: {test_f1:.4f}")
    print("\nClassification Report:\n")
    print(classification_report(y_test, predictions, zero_division=0))
    print("=" * 50)

    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)

    print(f"\nModel successfully saved to: {model_path}")
    print(f"Feature schema verified: {list(model.feature_names_in_)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Train upgraded irrigation prediction model for Jalrakshak-ML"
    )
    parser.add_argument(
        "--data",
        type=Path,
        default=DEFAULT_DATA_PATH,
        help="Path to input dataset CSV",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_MODEL_PATH,
        help="Path to save the trained joblib model",
    )
    args = parser.parse_args()

    train(
        data_path=args.data,
        model_path=args.output,
    )

import pandas as pd, numpy as np
from collections import Counter

STD_ERROR = 0.6148985557583696
ROLL_WINDOWS = [3, 5, 7]
N_LAG = 7


def create_feature(df):

    add_ewm = True
    date_col = "Date"
    df = df.copy()
    target_col = "Pest Count/Damage"
    df[date_col] = pd.to_datetime(df[date_col])
    df.set_index(date_col, inplace=True)

    series = df[target_col]
    features = pd.DataFrame(index=df.index)

    # --- Lag features ---
    for i in range(1, N_LAG + 1):
        features[f"lag_{i}"] = series.shift(i)

    # --- Rolling statistics ---
    for w in ROLL_WINDOWS:
        roll = series.rolling(w)
        features[f"roll_mean_{w}"] = roll.mean()
        features[f"roll_std_{w}"] = roll.std()
        features[f"roll_min_{w}"] = roll.min()
        features[f"roll_max_{w}"] = roll.max()
        features[f"roll_median_{w}"] = roll.median()
        features[f"roll_cumsum_{w}"] = roll.sum()  # rolling cumulative sum

    # --- Exponentially weighted features ---
    if add_ewm:
        for w in ROLL_WINDOWS:
            features[f"ewm_mean_{w}"] = series.ewm(span=w).mean()
            features[f"ewm_std_{w}"] = series.ewm(span=w).std()

    features = features.dropna()
    y = series.loc[features.index]
    return features, y


def recursive_forecast(model, features, horizon):
    z = 1.96  # 95% CI
    predictions = []
    ci_lower = []
    ci_upper = []

    # Last available features row
    latest_features = features.iloc[-1].copy()
    last_date = features.index[-1]  # 2024-12-03

    future_dates = (
        pd.date_range(start=last_date + pd.Timedelta(days=1), periods=horizon)
        .strftime("%Y-%m-%d")
        .tolist()
    )

    for step in range(horizon):
        # Predict next value
        X = latest_features.values.reshape(1, -1)
        y_pred = model.predict(X)[0]
        predictions.append(y_pred)

        # Compute CI using std_error from backtest residuals
        # lower = max(0, y_pred - z * std_error)  # clip at 0
        # upper = y_pred + z * std_error

        ci_lower.append(y_pred - z * STD_ERROR)
        ci_upper.append(y_pred + z * STD_ERROR)

        # --- Update lag features ---
        for lag in range(N_LAG, 1, -1):
            latest_features[f"lag_{lag}"] = latest_features[f"lag_{lag-1}"]
        latest_features["lag_1"] = y_pred

        # --- Update rolling statistics ---
        for w in ROLL_WINDOWS:
            lags_for_window = [
                latest_features[f"lag_{i}"] for i in range(1, min(N_LAG, w) + 1)
            ]
            latest_features[f"roll_mean_{w}"] = np.mean(lags_for_window)
            latest_features[f"roll_std_{w}"] = np.std(lags_for_window)
            latest_features[f"roll_min_{w}"] = np.min(lags_for_window)
            latest_features[f"roll_max_{w}"] = np.max(lags_for_window)
            latest_features[f"roll_median_{w}"] = np.median(lags_for_window)
            latest_features[f"roll_cumsum_{w}"] = np.sum(lags_for_window)
            latest_features[f"ewm_mean_{w}"] = np.mean(lags_for_window)
            latest_features[f"ewm_std_{w}"] = np.std(lags_for_window)

    return pd.DataFrame(
        {
            "future_dates": future_dates,
            "forecast": predictions,
            "ci_lower": ci_lower,
            "ci_upper": ci_upper,
        }
    ).to_dict()


def threshold_status(value):
    if value < 5:
        return "Low"
    elif 5 <= value < 10:
        return "Moderate"
    else:
        return "Severe"

def risk_levels(forecast):
    
    r_level = [threshold_status(value) for value in forecast["forecast"].values()]
    counter = Counter(r_level)
    most_frequent_risk, frequency = counter.most_common(1)[0]
    return {
        "risk_list": r_level,
        "most_frequent_risk" : most_frequent_risk,
        "frequency": frequency,
    } 

def peak_day(forecast):
    return {
        "peak_count": np.round(max(forecast["forecast"].values()), 2),
        "peak_date": forecast["future_dates"][
            np.argmax(np.array([v for v in forecast["forecast"].values()]))
        ],
    }




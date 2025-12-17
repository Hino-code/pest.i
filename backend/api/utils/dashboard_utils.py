import pandas as pd


def filter_dataset(df, start_date, end_date, season=None, field_stage=None):
    """
    Centralized helper to filter data by date, season, and field stage.
    Handles "All" or None values automatically.
    """
    # 1. Ensure Date format (Working on a copy to avoid SettingWithCopy warnings)
    df = df.copy()
    df["Date"] = pd.to_datetime(df["Date"])
    start_date = pd.to_datetime(start_date)
    end_date = pd.to_datetime(end_date)

    # 2. Filter by Date
    mask = (df["Date"] >= start_date) & (df["Date"] <= end_date)

    # 3. Filter by Season (only if provided and not "All")
    if season and season != "All":
        mask = mask & (df["Season"] == season)

    # 4. Filter by Field Stage (only if provided and not "All")
    if field_stage and field_stage != "All":
        mask = mask & (df["Field Stage"] == field_stage)

    return df[mask]


def pest_sum(df, start_date, end_date, season=None, field_stage=None, exclude_days=7):
    # 1. Get Current Total (using the helper)
    current_df = filter_dataset(df, start_date, end_date, season, field_stage)
    current_total_sum = int(current_df["Pest Count/Damage"].sum())

    # 2. Get Previous Total
    # Calculate previous end date
    prev_end_date = pd.to_datetime(end_date) - pd.Timedelta(days=exclude_days)

    # Use the SAME helper, just with a different end date
    prev_df = filter_dataset(df, start_date, prev_end_date, season, field_stage)
    prev_total_sum = int(prev_df["Pest Count/Damage"].sum())

    changes = current_total_sum - prev_total_sum
    trend = "up" if changes > 0 else "down"

    return {
        "current_total_sum": current_total_sum,
        "previous_total_sum": prev_total_sum,
        "changes": changes,
        "trend": trend,
    }


def average_pest_count(df, start_date, end_date, season=None, field_stage=None):
    # Use helper
    filtered_df = filter_dataset(df, start_date, end_date, season, field_stage)

    if filtered_df.empty:
        return None

    avg_count = filtered_df["Pest Count/Damage"].mean()
    return round(avg_count, 2) if not pd.isna(avg_count) else None


def above_threshold_level(df, start_date, end_date, season=None, field_stage=None):
    # Use helper
    filtered_df = filter_dataset(df, start_date, end_date, season, field_stage)

    if filtered_df.empty:
        return None

    count_above_threshold = (
        filtered_df[filtered_df["Threshold Status"] == "Economic Threshold"]
    ).shape[0]

    percent_above_threshold = (count_above_threshold / len(filtered_df)) * 100
    return round(percent_above_threshold, 2)


def economic_damage(df, start_date, end_date, season=None, field_stage=None):
    # Use helper
    filtered_df = filter_dataset(df, start_date, end_date, season, field_stage)

    if filtered_df.empty:
        return None

    count_economic_damage = (
        filtered_df[filtered_df["Threshold Status"] == "Economic Damage"]
    ).shape[0]

    percent_economic_damage = (count_economic_damage / len(filtered_df)) * 100
    return round(percent_economic_damage, 2)


def current_field_stage(df, start_date, end_date, season=None):
    # Use helper
    filtered_df = filter_dataset(df, start_date, end_date, season)

    if filtered_df.empty:
        return None

    latest_record = filtered_df.sort_values(by="Date", ascending=False).iloc[0]
    return latest_record["Field Stage"]


def most_affected_field_stage(df, start_date, end_date, season=None):
    # Use helper
    filtered_df = filter_dataset(df, start_date, end_date, season)

    if filtered_df.empty:
        return None

    stage_counts = filtered_df["Field Stage"].value_counts()
    most_affected_stage = stage_counts.idxmax()
    return most_affected_stage


def action_rate(df, start_date, end_date, season=None, field_stage=None):
    # Use helper
    filtered_df = filter_dataset(df, start_date, end_date, season, field_stage)

    if filtered_df.empty:
        return None

    action_count = filtered_df[filtered_df["Action"] == "1"].shape[0]
    rate = (action_count / len(filtered_df)) * 100
    return round(rate, 2)


def dashboard_filter(df):
    season = ["All", *df["Season"].unique().tolist()]
    field_stage = ["All", *df["Field Stage"].unique().tolist()]

    return {
        "season": season,
        "field_stage": field_stage,
        "date": {"min": str(df["Date"].min()), "max": str(df["Date"].max())},
    }

def threshold_status_counts(df, start_date, end_date, season=None, field_stage=None):
    # Use helper
    filtered_df = filter_dataset(df, start_date, end_date, season, field_stage)

    if filtered_df.empty:
        return {}

    status_counts = filtered_df["Threshold Status"].value_counts().to_dict()
    return status_counts

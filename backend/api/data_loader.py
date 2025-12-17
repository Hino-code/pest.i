# data_loader.py
import pandas as pd, os
from pathlib import Path

# Module-level variable
df = None

try:
    _dataPath = Path(os.getcwd()) / "data"
    _dataName = os.listdir(_dataPath).pop()
    _dataUrl = _dataPath / _dataName
    print(_dataUrl)
    df = pd.read_csv(rf"{_dataUrl}")
    df['Date'] = pd.to_datetime(df['Date'])
    if df is None:
        print("Data loading failed.")
    else:
        print("Data loaded successfully.")

except Exception as error:
    print(f"An exception occurred: {error}")

from pathlib import Path
import os
import xgboost as xgb

try:
  _modelName = os.listdir(os.path.join(os.getcwd(), "models")).pop()
  _modelUrl = Path(os.getcwd()) / "models" / _modelName
  model = xgb.XGBRegressor()
  model.load_model(str(_modelUrl))
  if model:
    print(f"Model {_modelName} loaded successfully.")
  
  
except Exception as error:
  print(f"An exception occurred: {error}")

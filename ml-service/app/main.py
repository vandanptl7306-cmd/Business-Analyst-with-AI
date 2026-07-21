# ml-service/app/main.py

import os
import re
import io
import base64
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from pymongo import MongoClient
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# Thread-safe matplotlib setup
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Conditional LangChain imports
try:
    from langchain_openai import ChatOpenAI
    from langchain.prompts import PromptTemplate
    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False

app = FastAPI(
    title="Demand Forecasting & AI Intelligence Microservice",
    description="Stand-alone intelligence layer predicting sales, inventory, customers, and business NLP",
    version="1.0.0"
)

# --- DATABASE RETRY & TIMEOUT CONFIGURATION ---
# Apply a 2-second timeout for server selection to prevent long hangs when offline
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/business-analyst-with-ai")
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
db = client.get_database()

def is_mongodb_connected() -> bool:
    try:
        client.admin.command('ping')
        return True
    except Exception:
        return False

def get_mock_sales_data(days=90) -> pd.DataFrame:
    """
    Generates a realistic mock time series of invoices and purchased items
    for demonstration and development fallback.
    """
    np.random.seed(42)
    dates = pd.date_range(end=datetime.now(), periods=days, freq="D")
    products = [
        {"productId": "prod_1", "description": "Organic Rice", "price": 80.0, "cost": 60.0},
        {"productId": "prod_2", "description": "Premium Olive Oil", "price": 250.0, "cost": 180.0},
        {"productId": "prod_3", "description": "Organic Tea", "price": 45.0, "cost": 30.0},
        {"productId": "prod_4", "description": "Whole Wheat Flour", "price": 50.0, "cost": 38.0},
        {"productId": "prod_5", "description": "Himalayan Pink Salt", "price": 30.0, "cost": 20.0},
    ]
    buyers = ["Client Alpha", "Client Beta", "Gamma Industries", "Delta Retail", "Omega Corp"]
    
    flat_data = []
    for i, date in enumerate(dates):
        weekday = date.weekday()
        num_invoices = np.random.randint(2, 6) if weekday >= 5 else np.random.randint(1, 4)
        
        # Inject intentional transaction anomalies
        is_anomaly = False
        anomaly_type = None
        if i == 45: # Huge sales drop
            is_anomaly = True
            anomaly_type = "drop"
        elif i == 75: # Huge sales spike
            is_anomaly = True
            anomaly_type = "spike"
            
        for _ in range(num_invoices):
            prod = np.random.choice(products)
            buyer = np.random.choice(buyers)
            
            if is_anomaly and anomaly_type == "drop":
                quantity = 1
                grand_total = prod["price"] * quantity * 0.05
                net_profit = (prod["price"] - prod["cost"]) * quantity * 0.05
            elif is_anomaly and anomaly_type == "spike":
                quantity = np.random.randint(45, 75)
                grand_total = prod["price"] * quantity
                net_profit = (prod["price"] - prod["cost"]) * quantity
            else:
                quantity = np.random.randint(1, 8)
                grand_total = prod["price"] * quantity
                net_profit = (prod["price"] - prod["cost"]) * quantity
                
            flat_data.append({
                "date": date,
                "productId": prod["productId"],
                "description": prod["description"],
                "quantity": quantity,
                "price": prod["price"],
                "unitCostPrice": prod["cost"],
                "grandTotal": float(grand_total),
                "netProfit": float(net_profit),
                "buyerName": buyer,
                "invoiceNumber": f"INV-{1000 + i}-{np.random.randint(10, 99)}"
            })
            
    return pd.DataFrame(flat_data)

def get_live_sales_data() -> pd.DataFrame:
    """
    Pulls invoices from MongoDB and unwinds the item lists into a flat Pandas DataFrame.
    """
    if not is_mongodb_connected():
        return pd.DataFrame()
        
    try:
        invoices_cursor = db.invoices.find({})
        invoices_list = list(invoices_cursor)
        if not invoices_list:
            return pd.DataFrame()
            
        flat_data = []
        for inv in invoices_list:
            # Safely get date
            date_val = inv.get("invoiceDate") or inv.get("createdAt") or datetime.now()
            buyer = inv.get("buyerName", "Cash Sale")
            inv_num = inv.get("invoiceNumber", "INV-MOCK")
            grand_total = float(inv.get("grandTotal", 0))
            net_profit = float(inv.get("netProfit", 0))
            
            items = inv.get("items", [])
            for item in items:
                desc = item.get("description", "Unknown Product")
                prod_id = item.get("productId") or desc
                qty = item.get("quantity", 0)
                price = item.get("price", 0.0)
                cost = item.get("unitCostPrice") or item.get("cost") or (price * 0.7)
                
                flat_data.append({
                    "date": date_val,
                    "productId": prod_id,
                    "description": desc,
                    "quantity": qty,
                    "price": price,
                    "unitCostPrice": cost,
                    "grandTotal": grand_total,
                    "netProfit": net_profit,
                    "buyerName": buyer,
                    "invoiceNumber": inv_num
                })
        
        df = pd.DataFrame(flat_data)
        if not df.empty:
            df["date"] = pd.to_datetime(df["date"])
        return df
    except Exception:
        return pd.DataFrame()

def get_products_data() -> pd.DataFrame:
    """
    Retrieves all product records from MongoDB, falling back to a pre-defined list if empty or offline.
    """
    mock_list = [
        {"productId": "prod_1", "name": "Organic Rice", "sku": "RIC-ORG-01", "mrp": 85.0, "sellingPrice": 80.0, "averageCostPrice": 60.0},
        {"productId": "prod_2", "name": "Premium Olive Oil", "sku": "OIL-PRE-02", "mrp": 270.0, "sellingPrice": 250.0, "averageCostPrice": 180.0},
        {"productId": "prod_3", "name": "Organic Tea", "sku": "TEA-ORG-03", "mrp": 50.0, "sellingPrice": 45.0, "averageCostPrice": 30.0},
        {"productId": "prod_4", "name": "Whole Wheat Flour", "sku": "FLR-WHT-04", "mrp": 55.0, "sellingPrice": 50.0, "averageCostPrice": 38.0},
        {"productId": "prod_5", "name": "Himalayan Pink Salt", "sku": "SLT-PNK-05", "mrp": 35.0, "sellingPrice": 30.0, "averageCostPrice": 20.0},
    ]
    if not is_mongodb_connected():
        return pd.DataFrame(mock_list)
        
    try:
        products_cursor = db.products.find({})
        products_list = list(products_cursor)
        if not products_list:
            return pd.DataFrame(mock_list)
            
        flat_prods = []
        for p in products_list:
            flat_prods.append({
                "productId": str(p.get("_id")) or p.get("sku"),
                "name": p.get("name"),
                "sku": p.get("sku"),
                "mrp": float(p.get("mrp", 0)),
                "sellingPrice": float(p.get("sellingPrice", 0)),
                "averageCostPrice": float(p.get("averageCostPrice", 0))
            })
        return pd.DataFrame(flat_prods)
    except Exception:
        return pd.DataFrame(mock_list)

def get_historical_sales(product_id: str) -> pd.DataFrame:
    """
    Pulls past sales data for a specific product description or product ID from the MongoDB Invoices collection.
    Unwinds the items array, matches description/ID, and aggregates the total daily quantity sold.
    Falls back to mock data if MongoDB is unavailable or data is insufficient.
    """
    try:
        if not is_mongodb_connected():
            # Return aggregated mock data
            mock_df = get_mock_sales_data()
            return aggregate_daily_sales(mock_df, product_id)
        
        # Since products in invoices might be stored by name/description, we support matching by either.
        pipeline = [
            { "$unwind": "$items" },
            {
                "$match": {
                    "$or": [
                        { "items.description": product_id },
                        { "items.productId": product_id }
                    ]
                }
            },
            {
                "$project": {
                    "date": { "$toDate": "$invoiceDate" },
                    "quantity": "$items.quantity"
                }
            },
            {
                "$group": {
                    "_id": { "$dateToString": { "format": "%Y-%m-%d", "date": "$date" } },
                    "daily_sales": { "$sum": "$quantity" }
                }
            },
            { "$sort": { "_id": 1 } }
        ]

        cursor = db.invoices.aggregate(pipeline)
        records = list(cursor)

        if not records:
            # Fallback: If no records are found, return aggregated mock data
            mock_df = get_mock_sales_data()
            return aggregate_daily_sales(mock_df, product_id)

        df = pd.DataFrame(records)
        df.rename(columns={"_id": "date"}, inplace=True)
        df["date"] = pd.to_datetime(df["date"])
        df.set_index("date", inplace=True)

        # Reindex to fill missing dates with 0 sales
        start_date = df.index.min()
        end_date = df.index.max()
        all_dates = pd.date_range(start=start_date, end=end_date, freq="D")
        df = df.reindex(all_dates, fill_value=0)
        df.index.name = "date"
        df.reset_index(inplace=True)

        return df
    except Exception as e:
        # Log error and return aggregated mock data as final fallback
        print(f"Error in get_historical_sales: {str(e)}")
        mock_df = get_mock_sales_data()
        return aggregate_daily_sales(mock_df, product_id)

def aggregate_daily_sales(df: pd.DataFrame, product_id: str) -> pd.DataFrame:
    """
    Filters mock data by product_id (description or productId) and aggregates by date.
    Returns DataFrame with columns: date, daily_sales
    """
    # Filter for the product
    product_df = df[
        (df["description"].str.contains(product_id, case=False, na=False)) |
        (df["productId"].str.contains(product_id, case=False, na=False))
    ].copy()
    
    if product_df.empty:
        # If no exact match, just aggregate all data
        product_df = df.copy()
    
    # Aggregate by date
    product_df["date"] = pd.to_datetime(product_df["date"])
    daily_agg = product_df.groupby(product_df["date"].dt.date)["quantity"].sum().reset_index()
    daily_agg.columns = ["date", "daily_sales"]
    daily_agg["date"] = pd.to_datetime(daily_agg["date"])
    
    # Fill missing dates with 0
    if not daily_agg.empty:
        start_date = daily_agg["date"].min()
        end_date = daily_agg["date"].max()
        all_dates = pd.date_range(start=start_date, end=end_date, freq="D")
        daily_agg_indexed = daily_agg.set_index("date")
        daily_agg_indexed = daily_agg_indexed.reindex(all_dates, fill_value=0)
        daily_agg_indexed.index.name = "date"
        daily_agg = daily_agg_indexed.reset_index()
    
    return daily_agg

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generates tabular time-series features required for scikit-learn regressor algorithms:
    - Date parameters: Day of week, Month
    - Lag parameters: 1 day, 7 days, 14 days ago
    - Rolling window parameters: 7-day and 14-day rolling mean averages
    """
    df = df.copy()
    
    # Date properties
    df["day_of_week"] = df["date"].dt.dayofweek
    df["month"] = df["date"].dt.month

    # Lag parameters
    df["lag_1"] = df["daily_sales"].shift(1)
    df["lag_7"] = df["daily_sales"].shift(7)
    df["lag_14"] = df["daily_sales"].shift(14)

    # Rolling statistics
    df["rolling_mean_7"] = df["daily_sales"].shift(1).rolling(window=7).mean()
    df["rolling_mean_14"] = df["daily_sales"].shift(1).rolling(window=14).mean()

    # Drop NaNs created by shifts/rolling windows
    df.dropna(inplace=True)
    return df

@app.get("/health")
def health_check():
    return {"status": "OK", "service": "ML Demand Forecasting"}

@app.get("/api/ml/forecast/{product_id}")
def get_demand_forecast(product_id: str, days: int = Query(7, ge=7, le=30)):
    """
    Triggers demand forecasting modeling.
    Trains a RandomForestRegressor pipeline and recursively forecasts sales quantities for the next N days.
    """
    try:
        print(f"[FORECAST] Starting forecast for product_id={product_id}, days={days}")
        
        # Step 1: Query database records
        df = get_historical_sales(product_id)
        print(f"[FORECAST] Got {len(df)} rows of historical sales data")
        
        # Cold start fallback if history is insufficient (< 20 days of sales points)
        if df.empty or len(df) < 20:
            print(f"[FORECAST] Insufficient data ({len(df)} rows), using synthetic baseline")
            # Generate smart synthetic baseline forecasts (weekly cycles with noise)
            today = datetime.utcnow().date()
            predictions = []
            for i in range(1, days + 1):
                future_date = today + timedelta(days=i)
                weekday = future_date.weekday()
                # Mock high sales on weekends (e.g. Retail kirana stores)
                base = 15.0 if weekday >= 5 else 8.0
                noise = np.random.normal(0, 1.5)
                val = max(0, round(base + noise, 2))
                predictions.append({
                    "date": future_date.strftime("%Y-%m-%d"),
                    "predicted_quantity": val
                })
            
            return {
                "success": True,
                "productId": product_id,
                "model": "Synthetic Baseline Fallback",
                "days": days,
                "forecast": predictions
            }

        # Ensure date column is datetime
        try:
            print(f"[FORECAST] Converting date column to datetime")
            df["date"] = pd.to_datetime(df["date"])
        except Exception as date_error:
            print(f"[FORECAST] Date conversion error: {str(date_error)}")
            # If date conversion fails, use mock data
            today = datetime.utcnow().date()
            predictions = []
            for i in range(1, days + 1):
                future_date = today + timedelta(days=i)
                weekday = future_date.weekday()
                base = 15.0 if weekday >= 5 else 8.0
                noise = np.random.normal(0, 1.5)
                val = max(0, round(base + noise, 2))
                predictions.append({
                    "date": future_date.strftime("%Y-%m-%d"),
                    "predicted_quantity": val
                })
            
            return {
                "success": True,
                "productId": product_id,
                "model": "Synthetic Baseline Fallback (Date Error)",
                "days": days,
                "forecast": predictions
            }

        # Step 2: Feature Engineering
        print(f"[FORECAST] Building features from {len(df)} rows")
        feature_df = build_features(df)
        print(f"[FORECAST] Feature engineering result: {len(feature_df)} rows")
        if feature_df.empty or len(feature_df) < 5:
            print(f"[FORECAST] Insufficient features ({len(feature_df)} rows), using synthetic baseline")
            # Fall back to synthetic if feature engineering fails
            today = datetime.utcnow().date()
            predictions = []
            for i in range(1, days + 1):
                future_date = today + timedelta(days=i)
                weekday = future_date.weekday()
                base = 15.0 if weekday >= 5 else 8.0
                noise = np.random.normal(0, 1.5)
                val = max(0, round(base + noise, 2))
                predictions.append({
                    "date": future_date.strftime("%Y-%m-%d"),
                    "predicted_quantity": val
                })
            
            return {
                "success": True,
                "productId": product_id,
                "model": "Synthetic Baseline Fallback (Insufficient Features)",
                "days": days,
                "forecast": predictions
            }

        # Step 3: Model Training
        X_cols = ["day_of_week", "month", "lag_1", "lag_7", "lag_14", "rolling_mean_7", "rolling_mean_14"]
        try:
            print(f"[FORECAST] Training RandomForestRegressor with {len(feature_df)} samples")
            X = feature_df[X_cols].fillna(0)  # Fill any remaining NaN with 0
            y = feature_df["daily_sales"].fillna(0)
            
            # Ensure we have valid data
            if X.isnull().any().any() or y.isnull().any():
                X = X.fillna(0)
                y = y.fillna(0)
            
            model = RandomForestRegressor(n_estimators=50, random_state=42)
            model.fit(X, y)
        except Exception as model_error:
            # Fall back to synthetic if model training fails
            today = datetime.utcnow().date()
            predictions = []
            for i in range(1, days + 1):
                future_date = today + timedelta(days=i)
                weekday = future_date.weekday()
                base = 15.0 if weekday >= 5 else 8.0
                noise = np.random.normal(0, 1.5)
                val = max(0, round(base + noise, 2))
                predictions.append({
                    "date": future_date.strftime("%Y-%m-%d"),
                    "predicted_quantity": val
                })
            
            return {
                "success": True,
                "productId": product_id,
                "model": "Synthetic Baseline Fallback (Model Training Error)",
                "days": days,
                "forecast": predictions,
                "debug": str(model_error)
            }

        # Step 4: Recursive forecasting over the requested horizon
        forecast_predictions = []
        last_known_data = df.copy()
        
        try:
            for i in range(1, days + 1):
                next_date = df["date"].max() + timedelta(days=i)
                
                # Form features for next_date using past data points
                day_of_week = next_date.weekday()
                month = next_date.month
                
                # Extract lag points
                lag_1 = last_known_data.iloc[-1]["daily_sales"]
                lag_7 = last_known_data.iloc[-7]["daily_sales"] if len(last_known_data) >= 7 else lag_1
                lag_14 = last_known_data.iloc[-14]["daily_sales"] if len(last_known_data) >= 14 else lag_7

                # Extract rolling means
                rolling_7 = last_known_data.iloc[-7:]["daily_sales"].mean()
                rolling_14 = last_known_data.iloc[-14:]["daily_sales"].mean() if len(last_known_data) >= 14 else rolling_7

                # Execute model
                pred_input = np.array([[day_of_week, month, lag_1, lag_7, lag_14, rolling_7, rolling_14]])
                predicted_val = max(0.0, float(model.predict(pred_input)[0]))
                predicted_val = round(predicted_val, 2)

                forecast_predictions.append({
                    "date": next_date.strftime("%Y-%m-%d"),
                    "predicted_quantity": predicted_val
                })

                # Append the prediction to recursive frame to feed subsequent steps
                new_row = pd.DataFrame([{
                    "date": next_date,
                    "daily_sales": predicted_val
                }])
                last_known_data = pd.concat([last_known_data, new_row], ignore_index=True)
        except Exception as recursive_error:
            # If recursive forecasting fails, fill remaining predictions with last known value
            last_val = forecast_predictions[-1]["predicted_quantity"] if forecast_predictions else 10.0
            for i in range(len(forecast_predictions) + 1, days + 1):
                next_date = df["date"].max() + timedelta(days=i)
                forecast_predictions.append({
                    "date": next_date.strftime("%Y-%m-%d"),
                    "predicted_quantity": last_val
                })

        return {
            "success": True,
            "productId": product_id,
            "model": "RandomForestRegressor Time-Series Pipeline",
            "days": days,
            "forecast": forecast_predictions
        }

    except Exception as e:
        import traceback
        error_msg = f"ML Forecasting error: {str(e)}\n{traceback.format_exc()}"
        print(f"[FORECAST] {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/api/analytics/dashboard-metrics")
def get_dashboard_metrics(
    start_date: str = Query(None),
    end_date: str = Query(None),
    interval: str = Query("daily") # daily, weekly, monthly
):
    """
    Advanced Business Analytics & Trend Analysis:
    Extracts raw billing data from MongoDB and uses Pandas to compute time-series growth indicators,
    acquired customer growth counts, and customer repeat purchase percentages.
    """
    try:
        # Step 1: Data Extraction
        query = {}
        if (start_date and start_date.strip()) or (end_date and end_date.strip()):
            query["invoiceDate"] = {}
            if start_date and start_date.strip():
                try:
                    query["invoiceDate"]["$gte"] = datetime.strptime(start_date.strip(), "%Y-%m-%d")
                except ValueError:
                    pass
            if end_date and end_date.strip():
                try:
                    query["invoiceDate"]["$lte"] = datetime.strptime(end_date.strip(), "%Y-%m-%d")
                except ValueError:
                    pass

        invoices_list = []
        if is_mongodb_connected():
            try:
                invoices_cursor = db.invoices.find(query)
                invoices_list = list(invoices_cursor)
            except Exception:
                invoices_list = []
        
        # Handle Cold Start baseline fallbacks if MongoDB database is empty
        if not invoices_list:
            # Generate mock pandas analytics metrics for demonstration
            dates = pd.date_range(end=datetime.now(), periods=10, freq="D")
            df = pd.DataFrame({
                "date": dates,
                "revenue": np.random.uniform(500, 2000, 10).round(2),
                "profit": np.random.uniform(100, 600, 10).round(2),
                "sales_count": np.random.randint(5, 20, 10),
                "buyerName": ["Client A", "Client B", "Client A", "Client C", "Client B"] * 2
            })
        else:
            # Convert PyMongo objects to Pandas DataFrame
            flat_data = []
            for inv in invoices_list:
                flat_data.append({
                    "date": inv.get("invoiceDate") or inv.get("createdAt"),
                    "revenue": float(inv.get("grandTotal", 0)),
                    "profit": float(inv.get("netProfit", 0)),
                    "buyerName": inv.get("buyerName", "Cash Sale")
                })
            df = pd.DataFrame(flat_data)
            df["date"] = pd.to_datetime(df["date"])
            df["sales_count"] = 1

        # Step 2: Time-series Grouping & Aggregations
        # Maps interval queries to pandas resampling rules: 'D' (daily), 'W' (weekly), 'M' (monthly)
        rule = "D"
        if interval == "weekly":
            rule = "W"
        elif interval == "monthly":
            rule = "M"

        # Resample time series
        ts_df = df.set_index("date").resample(rule).agg({
            "revenue": "sum",
            "profit": "sum",
            "sales_count": "sum"
        }).fillna(0)

        # Growth Rate Calculations using .pct_change()
        ts_df["revenue_growth"] = ts_df["revenue"].pct_change().fillna(0).round(4) * 100
        ts_df["sales_growth"] = ts_df["sales_count"].pct_change().fillna(0).round(4) * 100
        ts_df.reset_index(inplace=True)
        ts_df["date"] = ts_df["date"].dt.strftime("%Y-%m-%d")

        # Step 3: Customer Repeat Rate calculations
        unique_buyers = df["buyerName"].nunique()
        buyer_counts = df["buyerName"].value_counts()
        repeat_buyers = int((buyer_counts > 1).sum())
        repeat_rate = round((repeat_buyers / unique_buyers * 100), 2) if unique_buyers > 0 else 0.0

        # Acquired accounts count (using Parties catalog database counts)
        try:
            total_customers = db.parties.count_documents({}) if is_mongodb_connected() else 8
        except Exception:
            total_customers = 8

        return {
            "success": True,
            "kpis": {
                "totalRevenue": float(df["revenue"].sum()),
                "totalProfit": float(df["profit"].sum()),
                "salesVolume": int(df["sales_count"].sum()),
                "customersAcquired": total_customers,
                "repeatCustomerRate": repeat_rate
            },
            "trendData": ts_df.to_dict(orient="records")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics processing failed: {str(e)}")

@app.get("/api/analytics/trend-chart")
def get_trend_chart(metric: str = Query("revenue_profit")):
    print(f"--- ML SERVICE RECEIVED METRIC QUERY PARAM: {metric} ---", flush=True)
    try:
        # Step 1: Data Extraction
        query = {}
        invoices_list = []
        if is_mongodb_connected():
            try:
                invoices_cursor = db.invoices.find(query)
                invoices_list = list(invoices_cursor)
            except Exception:
                invoices_list = []
        
        # Handle Cold Start baseline fallbacks
        if not invoices_list:
            dates = pd.date_range(end=datetime.now(), periods=7, freq="D")
            labels = [d.strftime("%d %b") for d in dates]
            if metric == "repeat_rate":
                repeat_rate = 37.5
                one_time_rate = 62.5
                pie_sizes = [repeat_rate, one_time_rate]
                pie_labels = [
                    f'Repeat: {repeat_rate:.1f}% (3 accounts)', 
                    f'One-Time: {one_time_rate:.1f}% (5 accounts)'
                ]
            elif metric == "accounts":
                values = [4, 5, 5, 6, 7, 7, 8]
            else: # revenue_profit
                df = pd.DataFrame({
                    "date": dates,
                    "revenue": [14500, 18200, 16800, 22400, 28900, 26500, 32400],
                    "profit": [4200, 5400, 4800, 7100, 9800, 8400, 11200]
                })
        else:
            flat_data = []
            for inv in invoices_list:
                flat_data.append({
                    "date": inv.get("invoiceDate") or inv.get("createdAt"),
                    "revenue": float(inv.get("grandTotal", 0)),
                    "profit": float(inv.get("netProfit", 0)),
                    "buyerName": inv.get("buyerName", "Cash Sale")
                })
            df = pd.DataFrame(flat_data)
            df["date"] = pd.to_datetime(df["date"])
            
            # Ensure dates_7 are datetime objects
            dates_7 = pd.date_range(end=datetime.now(), periods=7, freq="D")
            labels = [d.strftime("%d %b") for d in dates_7]
            
            if metric == "repeat_rate":
                if not invoices_list:
                    repeat_buyers = 3
                    one_time_buyers = 5
                    unique_buyers = 8
                else:
                    unique_buyers = df["buyerName"].nunique()
                    buyer_counts = df["buyerName"].value_counts()
                    repeat_buyers = int((buyer_counts > 1).sum())
                    one_time_buyers = unique_buyers - repeat_buyers
                
                if unique_buyers == 0:
                    repeat_buyers = 3
                    one_time_buyers = 5
                    unique_buyers = 8

                repeat_rate = (repeat_buyers / unique_buyers * 100)
                one_time_rate = 100.0 - repeat_rate
                
                pie_sizes = [repeat_rate, one_time_rate]
                pie_labels = [
                    f'Repeat: {repeat_rate:.1f}% ({repeat_buyers} accounts)', 
                    f'One-Time: {one_time_rate:.1f}% ({one_time_buyers} accounts)'
                ]
            elif metric == "accounts":
                values = []
                for d in dates_7:
                    sub_df = df[df["date"] <= d]
                    if sub_df.empty:
                        values.append(0)
                    else:
                        unique_buyers = sub_df["buyerName"].nunique()
                        # Add a baseline of 3 default seeded accounts
                        values.append(unique_buyers + 3)
            else: # revenue_profit
                ts_df = df.set_index("date").resample("D").agg({
                    "revenue": "sum",
                    "profit": "sum"
                }).fillna(0).tail(7)
                ts_df.reset_index(inplace=True)
                if len(ts_df) < 7:
                    ts_df = df.set_index("date").resample("D").agg({
                        "revenue": "sum",
                        "profit": "sum"
                    }).fillna(0)
                    ts_df = ts_df.reindex(dates_7, fill_value=0)
                    ts_df.reset_index(inplace=True)
                    ts_df.rename(columns={"index": "date"}, inplace=True)
                ts_df["date_label"] = ts_df["date"].dt.strftime("%d %b")

        # Step 2: Render Matplotlib Chart (Thread-Safe)
        fig, ax = plt.subplots(figsize=(8, 3.5), facecolor='#0b0f19')
        ax.set_facecolor('#0b0f19')
        
        # Plot styling grid & spines
        ax.grid(axis='y', linestyle='-', linewidth=0.5, color='#1e293b', alpha=0.7, zorder=0)
        for spine in ['top', 'right', 'left', 'bottom']:
            ax.spines[spine].set_visible(False)
        ax.tick_params(axis='x', length=0)
        
        from matplotlib.ticker import FuncFormatter

        if metric == "repeat_rate":
            # Plot Donut/Pie Chart representing repeat customer rate
            colors = ['#a855f7', '#334155'] # vibrant purple and slate grey
            wedges, texts, autotexts = ax.pie(
                pie_sizes, 
                labels=pie_labels, 
                colors=colors, 
                autopct='%1.1f%%', 
                startangle=90, 
                pctdistance=0.75,
                textprops=dict(color='#94a3b8', fontsize=8.5)
            )
            
            # Draw a circle in the center to make it a donut chart
            centre_circle = plt.Circle((0,0), 0.55, fc='#0b0f19')
            ax.add_artist(centre_circle)
            
            # Style percent labels inside wedges
            for autotext in autotexts:
                autotext.set_color('#ffffff')
                autotext.set_fontweight('bold')
                autotext.set_fontsize(9)
                
            ax.axis('equal')
            
        elif metric == "accounts":
            # Area/step line graph for Acquired Customer Accounts
            ax.plot(labels, values, marker='s', color='#f59e0b', linewidth=2.5, markersize=6, label='Total Customer Accounts', zorder=3)
            ax.fill_between(labels, values, color='#f59e0b', alpha=0.12, zorder=2)
            
            from matplotlib.ticker import MaxNLocator
            ax.yaxis.set_major_locator(MaxNLocator(integer=True))
            ax.tick_params(axis='y', colors='#94a3b8', labelsize=8.5)
            ax.set_xticklabels(labels, color='#94a3b8', fontsize=8.5)
            
        else: # revenue_profit
            x = np.arange(len(ts_df))
            width = 0.35
            
            # Plot Revenue and Net Profit bars
            ax.bar(x - width/2, ts_df["revenue"], width, label='Revenue', color='#475569', alpha=0.85, edgecolor='none', zorder=3)
            ax.bar(x + width/2, ts_df["profit"], width, label='Net Profit', color='#6366f1', alpha=0.95, edgecolor='none', zorder=3)
            
            ax.set_xticks(x)
            ax.set_xticklabels(ts_df["date_label"], color='#94a3b8', fontsize=8.5)
            
            def format_currency(y, pos):
                if y >= 1000:
                    return f"₹{y/1000:.0f}k"
                return f"₹{y:.0f}"
            ax.yaxis.set_major_formatter(FuncFormatter(format_currency))
            ax.tick_params(axis='y', colors='#94a3b8', labelsize=8.5)

        # Legend styling
        legend = ax.legend(frameon=False, loc='upper left', fontsize=9)
        for text in legend.get_texts():
            text.set_color('#f1f5f9')
            text.set_fontweight('bold')
            
        # Tight layout & render
        plt.tight_layout()
        
        buf = io.BytesIO()
        fig.savefig(buf, format='png', facecolor=fig.get_facecolor(), edgecolor='none', dpi=150)
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        
        # Clean up to guarantee thread-safety and no memory leaks
        plt.close(fig)
        
        return {
            "success": True,
            "image": img_base64
        }
    except Exception as e:
        try:
            plt.close(fig)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to generate Matplotlib trend chart: {str(e)}")

@app.get("/api/ai/inventory/eoq")
def get_inventory_optimization(
    ordering_cost: float = Query(50.0, description="Cost per setup/order (S)"),
    holding_cost: float = Query(2.0, description="Annual holding cost per unit (H)"),
    lead_time_days: int = Query(7, description="Lead time in days (L)")
):
    """
    Pandas-based inventory pipeline calculating Economic Order Quantity (EOQ),
    Smart Reorder Point (ROP) based on daily demand variance, and classifies products.
    """
    try:
        df_sales = get_live_sales_data()
        datasource = "MongoDB"
        if df_sales.empty:
            df_sales = get_mock_sales_data()
            datasource = "Mock Fallback (Offline/No Data)"
            
        df_products = get_products_data()
        
        # Calculate daily & annual demand per product from sales data
        df_sales["date"] = pd.to_datetime(df_sales["date"])
        min_date = df_sales["date"].min()
        max_date = df_sales["date"].max()
        days_span = max(1, (max_date - min_date).days)
        
        sales_summary = []
        for name, group in df_sales.groupby("description"):
            # Resample daily to get standard deviation of daily sales
            daily_group = group.set_index("date").resample("D").agg({"quantity": "sum"}).fillna(0)
            total_qty = float(group["quantity"].sum())
            avg_daily = float(total_qty / days_span)
            std_daily = float(daily_group["quantity"].std()) if len(daily_group) > 1 else 0.0
            
            # Moving averages for trend sorting
            recent_date = df_sales["date"].max()
            date_30 = recent_date - timedelta(days=30)
            date_90 = recent_date - timedelta(days=90)
            
            sales_30 = group[group["date"] >= date_30]["quantity"].sum()
            sales_90 = group[group["date"] >= date_90]["quantity"].sum()
            
            ma_30 = float(sales_30 / 30.0)
            ma_90 = float(sales_90 / 90.0)
            
            sales_summary.append({
                "description": name,
                "annualDemand": avg_daily * 365.0,
                "averageDailyDemand": avg_daily,
                "stdDailyDemand": std_daily,
                "movingAverage30Day": ma_30,
                "movingAverage90Day": ma_90
            })
            
        df_demands = pd.DataFrame(sales_summary)
        
        results = []
        for idx, row in df_products.iterrows():
            prod_name = row["name"]
            sku = row["sku"]
            prod_id = row["productId"]
            
            # Match demand
            if not df_demands.empty:
                matched = df_demands[df_demands["description"] == prod_name]
            else:
                matched = pd.DataFrame()
                
            if not matched.empty:
                annual_d = matched.iloc[0]["annualDemand"]
                avg_daily = matched.iloc[0]["averageDailyDemand"]
                std_daily = matched.iloc[0]["stdDailyDemand"]
                ma_30 = matched.iloc[0]["movingAverage30Day"]
                ma_90 = matched.iloc[0]["movingAverage90Day"]
            else:
                # No sales history fallback
                annual_d = 150.0
                avg_daily = annual_d / 365.0
                std_daily = 0.5
                ma_30 = avg_daily
                ma_90 = avg_daily
                
            # EOQ formula: sqrt( (2 * D * S) / H )
            h = holding_cost if holding_cost > 0 else 2.0
            eoq_val = np.sqrt((2.0 * annual_d * ordering_cost) / h)
            eoq_val = round(float(eoq_val), 2)
            
            # Safety Stock: Z * std_daily * sqrt(L) where Z=1.65 (95% service level)
            z_factor = 1.65
            safety_stock = z_factor * std_daily * np.sqrt(lead_time_days)
            if safety_stock <= 0:
                safety_stock = 0.2 * avg_daily * lead_time_days
            safety_stock = round(max(1.0, float(safety_stock)), 2)
            
            # Reorder Point (ROP): (Average Daily Demand * Lead Time) + Safety Stock
            rop_val = (avg_daily * lead_time_days) + safety_stock
            rop_val = round(float(rop_val), 2)
            
            # Classify Trend Classification: Best-Sellers and Slow-Movers
            if ma_30 > 1.5 or (ma_30 > ma_90 * 1.15 and ma_30 > 0.5):
                status = "Best-Sellers"
            elif ma_30 < 0.25:
                status = "Slow-Movers"
            else:
                status = "Normal"
                
            results.append({
                "productId": prod_id,
                "name": prod_name,
                "sku": sku,
                "annualDemand": round(float(annual_d), 2),
                "averageDailyDemand": round(float(avg_daily), 2),
                "eoq": eoq_val,
                "reorderPoint": rop_val,
                "safetyStock": safety_stock,
                "status": status,
                "movingAverage30Day": round(float(ma_30), 2),
                "movingAverage90Day": round(float(ma_90), 2)
            })
            
        return {
            "success": True,
            "datasource": datasource,
            "products": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inventory AI error: {str(e)}")

@app.get("/api/ai/customers/segmentation")
def get_customer_segmentation(
    num_clusters: int = Query(3, ge=2, le=5, description="Number of segments to form")
):
    """
    Groups customers using RFM analysis.
    Applies StandardScaler and KMeans clustering to classify customers into segments.
    """
    try:
        df_sales = get_live_sales_data()
        datasource = "MongoDB"
        if df_sales.empty:
            df_sales = get_mock_sales_data()
            datasource = "Mock Fallback (Offline/No Data)"
            
        ref_date = df_sales["date"].max()
        
        rfm = df_sales.groupby("buyerName").agg({
            "date": lambda x: (ref_date - x.max()).days,
            "invoiceNumber": "nunique",
            "grandTotal": "sum"
        }).rename(columns={
            "date": "recency",
            "invoiceNumber": "frequency",
            "grandTotal": "monetary"
        })
        
        # Scale features
        scaler = StandardScaler()
        rfm_scaled = scaler.fit_transform(rfm[["recency", "frequency", "monetary"]])
        
        # Fit KMeans
        n_samples = len(rfm)
        actual_clusters = min(num_clusters, n_samples)
        
        kmeans = KMeans(n_clusters=actual_clusters, random_state=42, n_init=10)
        rfm["cluster"] = kmeans.fit_predict(rfm_scaled)
        
        # Compute centers/means to assign labels
        cluster_means = rfm.groupby("cluster").mean()
        composite_scores = {}
        for c in range(actual_clusters):
            row = cluster_means.loc[c]
            # Custom weight mapping (low recency, high frequency, high monetary is best)
            score = (row["frequency"] * 5.0) + (row["monetary"] / 500.0) - (row["recency"] * 0.1)
            composite_scores[c] = score
            
        sorted_clusters = sorted(composite_scores.keys(), key=lambda x: composite_scores[x], reverse=True)
        
        labels_map = {}
        if len(sorted_clusters) == 3:
            labels_map[sorted_clusters[0]] = "High-Value Customer"
            labels_map[sorted_clusters[1]] = "Regular Customer"
            labels_map[sorted_clusters[2]] = "At-Risk Customer"
        elif len(sorted_clusters) == 2:
            labels_map[sorted_clusters[0]] = "High-Value Customer"
            labels_map[sorted_clusters[1]] = "At-Risk Customer"
        else:
            for i, c in enumerate(sorted_clusters):
                if i == 0:
                    labels_map[c] = "High-Value Customer"
                elif i == len(sorted_clusters) - 1:
                    labels_map[c] = "At-Risk Customer"
                else:
                    labels_map[c] = f"Regular Customer Segment {i}"
                    
        rfm["segmentLabel"] = rfm["cluster"].map(labels_map)
        
        # Prepare payload
        rfm.reset_index(inplace=True)
        segments_list = []
        for idx, row in rfm.iterrows():
            segments_list.append({
                "buyerName": row["buyerName"],
                "recency": int(row["recency"]),
                "frequency": int(row["frequency"]),
                "monetary": round(float(row["monetary"]), 2),
                "clusterId": int(row["cluster"]),
                "segmentLabel": row["segmentLabel"]
            })
            
        summary = rfm["segmentLabel"].value_counts().to_dict()
        
        return {
            "success": True,
            "datasource": datasource,
            "segments": segments_list,
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Customer segmentation AI error: {str(e)}")

@app.get("/api/ai/transactions/anomalies")
def get_transaction_anomalies(
    contamination: float = Query(0.05, ge=0.01, le=0.2, description="Isolation Forest anomaly rate")
):
    """
    Fits scikit-learn IsolationForest to daily sales volume indicators
    to detect unusual drops, spikes, or processing errors.
    """
    try:
        df_sales = get_live_sales_data()
        datasource = "MongoDB"
        if df_sales.empty:
            df_sales = get_mock_sales_data()
            datasource = "Mock Fallback (Offline/No Data)"
            
        df_sales["date_only"] = df_sales["date"].dt.strftime("%Y-%m-%d")
        daily = df_sales.groupby("date_only").agg({
            "grandTotal": "sum",
            "invoiceNumber": "nunique",
            "quantity": "sum"
        }).rename(columns={
            "grandTotal": "revenue",
            "invoiceNumber": "invoiceCount",
            "quantity": "itemCount"
        })
        
        # Need enough observations to calculate anomalies
        if len(daily) < 5:
            datasource = "Mock Fallback (Insufficient Live Data)"
            df_sales = get_mock_sales_data()
            df_sales["date_only"] = df_sales["date"].dt.strftime("%Y-%m-%d")
            daily = df_sales.groupby("date_only").agg({
                "grandTotal": "sum",
                "invoiceNumber": "nunique",
                "quantity": "sum"
            }).rename(columns={
                "grandTotal": "revenue",
                "invoiceNumber": "invoiceCount",
                "quantity": "itemCount"
            })
            
        X = daily[["revenue", "invoiceCount", "itemCount"]]
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        clf = IsolationForest(contamination=contamination, random_state=42)
        daily["anomaly_flag"] = clf.fit_predict(X_scaled)
        daily["score"] = clf.decision_function(X_scaled)
        
        # Classify anomalies
        daily["rolling_median"] = daily["revenue"].rolling(window=min(14, len(daily)), min_periods=1).median()
        
        anomalies_list = []
        anom_df = daily[daily["anomaly_flag"] == -1].copy()
        
        for date_str, row in anom_df.iterrows():
            rev = float(row["revenue"])
            median = float(row["rolling_median"])
            
            if rev < median * 0.45:
                anom_type = "Drop (Potential Stockout/Incident)"
            elif rev > median * 1.65:
                anom_type = "Spike (Surge/High Sales)"
            else:
                anom_type = "Operational Anomaly (Unusual Mix)"
                
            anomalies_list.append({
                "date": date_str,
                "revenue": round(rev, 2),
                "invoiceCount": int(row["invoiceCount"]),
                "quantity": int(row["itemCount"]),
                "type": anom_type,
                "anomalyScore": round(float(row["score"]), 4)
            })
            
        anomalies_list = sorted(anomalies_list, key=lambda x: x["date"], reverse=True)
            
        return {
            "success": True,
            "datasource": datasource,
            "totalDaysAnalyzed": len(daily),
            "anomaliesFound": len(anomalies_list),
            "anomalies": anomalies_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection AI error: {str(e)}")

@app.get("/api/ai/price-optimization")
def get_price_optimization(
    product_name: str = Query(..., description="Name of the product"),
    current_price: float = Query(None, description="Optional current selling price")
):
    """
    Simulates competitor pricing scrapes and generates strategic selling suggestions.
    """
    try:
        resolved_price = current_price
        if resolved_price is None:
            df_prods = get_products_data()
            matched = df_prods[df_prods["name"].str.lower() == product_name.lower()]
            if not matched.empty:
                resolved_price = float(matched.iloc[0]["sellingPrice"])
            else:
                resolved_price = 100.0
                
        # Simulate competitors pricing
        np.random.seed(hash(product_name) % 9999)
        competitors = [
            {"competitor": "GlobalRetail Inc", "factor": 0.95},
            {"competitor": "Mart Express", "factor": 0.97},
            {"competitor": "BioOrganics Store", "factor": 1.06},
            {"competitor": "Super Value Grocer", "factor": 1.03}
        ]
        
        comps_prices = []
        for c in competitors:
            noise = np.random.uniform(-0.015, 0.015)
            comp_price = resolved_price * (c["factor"] + noise)
            comps_prices.append({
                "competitor": c["competitor"],
                "price": round(float(comp_price), 2)
            })
            
        prices = [c["price"] for c in comps_prices]
        avg_price = np.mean(prices)
        min_price = np.min(prices)
        max_price = np.max(prices)
        
        undercut_price = round(float(min_price * 0.99), 2)
        match_market = round(float(avg_price), 2)
        premium_price = round(float(max_price * 0.98), 2)
        
        return {
            "success": True,
            "productName": product_name,
            "currentPrice": resolved_price,
            "competitors": comps_prices,
            "statistics": {
                "average": round(float(avg_price), 2),
                "minimum": round(float(min_price), 2),
                "maximum": round(float(max_price), 2)
            },
            "recommendations": {
                "undercut": {
                    "strategy": "Aggressive Undercut (Economy)",
                    "price": undercut_price,
                    "rationale": f"Priced 1% below lowest competitor ({min_price}) to capture price-sensitive market share."
                },
                "market_average": {
                    "strategy": "Match Market Average",
                    "price": match_market,
                    "rationale": "Align with average competitor pricing to maintain fair margins and market positioning."
                },
                "premium": {
                    "strategy": "Value-Add Premium Pricing",
                    "price": premium_price,
                    "rationale": "Position product near the highest pricing point to capture premium customers who associate price with quality."
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Price optimization error: {str(e)}")

from typing import List, Optional

class InvoiceItem(BaseModel):
    description: Optional[str] = None
    hsnCode: Optional[str] = None
    quantity: Optional[float] = 1.0
    price: Optional[float] = 0.0
    basePrice: Optional[float] = 0.0
    gstRate: Optional[float] = 0.0
    totalAmount: Optional[float] = 0.0
    cgst: Optional[float] = 0.0
    sgst: Optional[float] = 0.0
    igst: Optional[float] = 0.0

class AuditInvoiceRequest(BaseModel):
    sellerName: Optional[str] = None
    sellerGSTIN: str
    sellerPIN: Optional[str] = None
    buyerName: Optional[str] = None
    buyerGSTIN: str
    buyerBillingAddress: Optional[str] = None
    buyerPIN: Optional[str] = None
    items: List[InvoiceItem]
    subTotal: Optional[float] = 0.0
    taxTotal: Optional[float] = 0.0
    grandTotal: Optional[float] = 0.0
    seller_state: Optional[str] = None
    buyer_state: Optional[str] = None
    igst: Optional[float] = None
    cgst: Optional[float] = None
    sgst: Optional[float] = None

# Indian GST State Code Mapping
GST_STATE_CODES = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
    "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
    "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
    "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
    "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra", "29": "Karnataka",
    "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
    "35": "Andaman & Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh"
}

def get_state_from_gstin(gstin: str) -> str:
    if gstin and len(gstin) >= 2 and gstin[:2].isdigit():
        return GST_STATE_CODES.get(gstin[:2], gstin[:2])
    return "Unknown"

def validate_gstin_regex(gstin: str) -> bool:
    if not gstin or not isinstance(gstin, str):
        return False
    # 15-digit alphanumeric standard Indian format
    gstin_regex = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
    return bool(re.match(gstin_regex, gstin.strip().upper()))

def validate_tax_logic(seller_state: str, buyer_state: str, igst: float, cgst: float, sgst: float) -> list:
    alerts = []
    seller_state_clean = seller_state.strip().lower()
    buyer_state_clean = buyer_state.strip().lower()
    
    is_same_state = (seller_state_clean == buyer_state_clean)
    
    if is_same_state:
        if igst > 0.01:
            alerts.append({
                "field": "tax_type",
                "severity": "High",
                "message": f"Intrastate transaction detected (both in '{seller_state}'); IGST of Rs. {igst:.2f} is present. CGST/SGST should be used instead."
            })
    else:
        if cgst > 0.01 or sgst > 0.01:
            alerts.append({
                "field": "tax_type",
                "severity": "High",
                "message": f"Interstate transaction detected ('{seller_state}' to '{buyer_state}'); CGST of Rs. {cgst:.2f} or SGST of Rs. {sgst:.2f} is present. IGST should be used instead."
            })
    return alerts

def run_compliance_audit(req: AuditInvoiceRequest) -> dict:
    risk_alerts = []
    
    # 1. Validate Seller GSTIN
    if not req.sellerGSTIN:
        risk_alerts.append({
            "field": "sellerGSTIN",
            "severity": "High",
            "message": "Seller GSTIN is missing."
        })
    elif not validate_gstin_regex(req.sellerGSTIN):
        risk_alerts.append({
            "field": "sellerGSTIN",
            "severity": "Medium",
            "message": f"Seller GSTIN '{req.sellerGSTIN}' format is invalid. Must match 15-digit alphanumeric standard format."
        })
        
    # 2. Validate Buyer GSTIN
    if not req.buyerGSTIN:
        risk_alerts.append({
            "field": "buyerGSTIN",
            "severity": "High",
            "message": "Buyer GSTIN is missing."
        })
    elif req.buyerGSTIN.strip().upper() not in ["CONSUMER", "URP", "UNREGISTERED"] and not validate_gstin_regex(req.buyerGSTIN):
        risk_alerts.append({
            "field": "buyerGSTIN",
            "severity": "Medium",
            "message": f"Buyer GSTIN '{req.buyerGSTIN}' format is invalid. Must match 15-digit alphanumeric standard format."
        })
        
    # Extract states if not provided
    seller_state = req.seller_state
    if not seller_state and req.sellerGSTIN:
        seller_state = get_state_from_gstin(req.sellerGSTIN)
        
    buyer_state = req.buyer_state
    if not buyer_state and req.buyerGSTIN:
        if req.buyerGSTIN.strip().upper() in ["CONSUMER", "URP", "UNREGISTERED"]:
            buyer_state = seller_state  # Assume intrastate for B2C consumer sales
        else:
            buyer_state = get_state_from_gstin(req.buyerGSTIN)
        
    if not seller_state:
        seller_state = "Unknown Seller State"
    if not buyer_state:
        buyer_state = "Unknown Buyer State"
        
    # 3. Validate PIN Codes
    if req.sellerPIN:
        if not re.match(r"^\d{6}$", str(req.sellerPIN).strip()):
            risk_alerts.append({
                "field": "sellerPIN",
                "severity": "Medium",
                "message": f"Seller PIN code '{req.sellerPIN}' must be a valid 6-digit number."
            })
            
    if req.buyerPIN:
        if not re.match(r"^\d{6}$", str(req.buyerPIN).strip()):
            risk_alerts.append({
                "field": "buyerPIN",
                "severity": "Medium",
                "message": f"Buyer PIN code '{req.buyerPIN}' must be a valid 6-digit number."
            })
            
    # 4. Item-level validation using Pandas for structured analysis
    if not req.items:
        risk_alerts.append({
            "field": "items",
            "severity": "High",
            "message": "Invoice must contain at least one item."
        })
    else:
        # Load items into a pandas DataFrame
        df_items = pd.DataFrame([item.dict() for item in req.items])
        
        # Check negative quantity using pandas
        if "quantity" in df_items.columns:
            negative_qty_indices = df_items[df_items["quantity"] <= 0].index.tolist()
            for idx in negative_qty_indices:
                desc = req.items[idx].description or f"Item {idx + 1}"
                risk_alerts.append({
                    "field": f"items[{idx}].quantity",
                    "severity": "Medium",
                    "message": f"For item '{desc}': Quantity ({req.items[idx].quantity}) must be greater than zero."
                })
                
        # Check negative price using pandas
        if "price" in df_items.columns:
            negative_price_indices = df_items[df_items["price"] < 0].index.tolist()
            for idx in negative_price_indices:
                desc = req.items[idx].description or f"Item {idx + 1}"
                risk_alerts.append({
                    "field": f"items[{idx}].price",
                    "severity": "Medium",
                    "message": f"For item '{desc}': Price ({req.items[idx].price}) cannot be negative."
                })

        # Process each item for custom logic checks (HSN and tax splits)
        for idx, item in enumerate(req.items):
            desc = item.description or f"Item {idx + 1}"
            
            # Check HSN code formatting
            hsn = item.hsnCode
            if not hsn:
                risk_alerts.append({
                    "field": f"items[{idx}].hsnCode",
                    "severity": "High",
                    "message": f"For item '{desc}': HSN/SAC code is missing."
                })
            else:
                hsn_str = str(hsn).strip()
                if not hsn_str.isdigit():
                    risk_alerts.append({
                        "field": f"items[{idx}].hsnCode",
                        "severity": "High",
                        "message": f"For item '{desc}': HSN/SAC code '{hsn_str}' must contain numeric values only."
                    })
                elif len(hsn_str) not in [2, 4, 6, 8]:
                    risk_alerts.append({
                        "field": f"items[{idx}].hsnCode",
                        "severity": "High",
                        "message": f"For item '{desc}': HSN/SAC code '{hsn_str}' length ({len(hsn_str)} digits) is invalid. Must be 2, 4, 6, or 8 digits."
                    })
            
            # Verify item tax splits
            item_igst = item.igst or 0.0
            item_cgst = item.cgst or 0.0
            item_sgst = item.sgst or 0.0
            
            item_tax_alerts = validate_tax_logic(seller_state, buyer_state, item_igst, item_cgst, item_sgst)
            for alert in item_tax_alerts:
                alert["field"] = f"items[{idx}]." + alert["field"]
                alert["message"] = f"For item '{desc}': " + alert["message"]
                risk_alerts.append(alert)
                
            # Intrastate split discrepancy check
            if seller_state.strip().lower() == buyer_state.strip().lower():
                if abs(item_cgst - item_sgst) > 0.02:
                    risk_alerts.append({
                        "field": f"items[{idx}].cgst_sgst_mismatch",
                        "severity": "Medium",
                        "message": f"For item '{desc}': CGST ({item_cgst:.2f}) and SGST ({item_sgst:.2f}) values must be identical for intrastate sales."
                    })

    # 5. Perform Invoice-level tax consistency check
    inv_igst = req.igst if req.igst is not None else sum(item.igst or 0.0 for item in req.items)
    inv_cgst = req.cgst if req.cgst is not None else sum(item.cgst or 0.0 for item in req.items)
    inv_sgst = req.sgst if req.sgst is not None else sum(item.sgst or 0.0 for item in req.items)
    
    inv_tax_alerts = validate_tax_logic(seller_state, buyer_state, inv_igst, inv_cgst, inv_sgst)
    risk_alerts.extend(inv_tax_alerts)

    # Compile final compliance status: Flag non-compliant if any "High" severity risk alert is present
    is_compliant = not any(alert["severity"] == "High" for alert in risk_alerts)
    
    return {
        "is_compliant": is_compliant,
        "risk_alerts": risk_alerts
    }

@app.post("/api/ai/audit/invoice")
def post_invoice_audit(req: AuditInvoiceRequest):
    """
    POST API for the compliance Audit Engine bot.
    Receives invoice payload, evaluates rules via pandas and regex, and returns the compliance state.
    """
    try:
        report = run_compliance_audit(req)
        return {
            "success": True,
            "is_compliant": report["is_compliant"],
            "risk_alerts": report["risk_alerts"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compliance Audit Bot execution failed: {str(e)}")

def get_mock_cashflow_data() -> pd.DataFrame:
    """
    Generates realistic historical training data and current outstanding data
    to train and evaluate the cashflow forecasting RandomForestRegressor.
    """
    np.random.seed(42)
    rows = []
    today = datetime.now()
    
    # 5 primary customers with distinct payment speeds
    buyers = ["Client Alpha", "Client Beta", "Gamma Industries", "Delta Retail", "Omega Corp"]
    buyer_speeds = {"Client Alpha": 12.0, "Client Beta": 25.0, "Gamma Industries": 5.0, "Delta Retail": 18.0, "Omega Corp": 35.0}
    
    # Historical closed invoices (Paid)
    for b in buyers:
        speed = buyer_speeds[b]
        for i in range(20):
            inv_date = today - timedelta(days=np.random.randint(45, 200))
            days_to_pay = max(1, int(np.random.normal(loc=speed, scale=max(1.0, speed * 0.25))))
            payment_date = inv_date + timedelta(days=days_to_pay)
            amount = float(np.random.randint(100, 8000))
            
            rows.append({
                "invoice_id": f"mock_hist_{b}_{i}",
                "buyer": b,
                "invoice_date": pd.to_datetime(inv_date),
                "actual_payment_date": pd.to_datetime(payment_date),
                "amount": amount,
                "status": "Paid"
            })
            
    # Currently outstanding invoices (Unpaid)
    for b in buyers:
        for i in range(4):
            inv_date = today - timedelta(days=np.random.randint(1, 40))
            amount = float(np.random.randint(500, 6000))
            rows.append({
                "invoice_id": f"mock_unpaid_{b}_{i}",
                "buyer": b,
                "invoice_date": pd.to_datetime(inv_date),
                "actual_payment_date": None,
                "amount": amount,
                "status": "Unpaid"
            })
            
    return pd.DataFrame(rows)

def prepare_cashflow_training_data() -> pd.DataFrame:
    """
    Pulls closed and open invoices from MongoDB and maps payment dates.
    Falls back and seeds with synthetic historical data if database is lean.
    """
    live_rows = []
    if is_mongodb_connected():
        try:
            invoices = list(db.invoices.find({}))
            # Fetch payment transaction received dates
            payment_dates = {}
            for tx in db.paymenttransactions.find({}):
                inv_id = str(tx.get("invoiceId"))
                received_at = tx.get("receivedAt")
                if received_at:
                    if inv_id not in payment_dates or received_at > payment_dates[inv_id]:
                        payment_dates[inv_id] = received_at
                        
            for inv in invoices:
                inv_id = str(inv["_id"])
                inv_date = inv.get("invoiceDate") or inv.get("createdAt")
                if not inv_date:
                    continue
                
                status = inv.get("status")
                amount = inv.get("grandTotal") or inv.get("subTotal") or 0.0
                buyer = inv.get("buyerName") or "Unknown Buyer"
                
                actual_payment_date = None
                if status == 'Paid':
                    actual_payment_date = payment_dates.get(inv_id) or inv.get("updatedAt") or (inv_date + timedelta(days=15))
                    
                live_rows.append({
                    "invoice_id": inv_id,
                    "buyer": buyer,
                    "invoice_date": pd.to_datetime(inv_date),
                    "actual_payment_date": pd.to_datetime(actual_payment_date) if actual_payment_date else None,
                    "amount": amount,
                    "status": status
                })
        except Exception as e:
            print("Failed to pull MongoDB invoices for cashflow:", e)
            
    df_live = pd.DataFrame(live_rows)
    paid_count = df_live[df_live["status"] == "Paid"].shape[0] if not df_live.empty else 0
    
    # If database has few paid invoices, inject mock data to ensure robust ML model training
    if paid_count < 10:
        df_mock = get_mock_cashflow_data()
        if not df_live.empty:
            df = pd.concat([df_live, df_mock], ignore_index=True)
        else:
            df = df_mock
    else:
        df = df_live
        
    return df

def engineer_cashflow_features(df: pd.DataFrame):
    """
    Extracts time-to-pay and builds features: CustomerAverageDaysToPay,
    InvoiceAmount, MonthOfInvoice, IsWeekendPayment, and CustomerPaymentFrequency.
    """
    # Sort for chronological sequence calculations
    df = df.sort_values(by=["buyer", "invoice_date"]).reset_index(drop=True)
    
    # Target label: Days to pay (only for closed invoices)
    df["ActualDaysToPay"] = (df["actual_payment_date"] - df["invoice_date"]).dt.days
    
    # DaysSinceLastInvoice lag calculation
    df["DaysSinceLastInvoice"] = df.groupby("buyer")["invoice_date"].diff().dt.days.fillna(30.0)
    
    # CustomerAverageDaysToPay calculated from Paid invoices
    paid_invoices = df[df["status"] == "Paid"]
    cust_avg_pay = paid_invoices.groupby("buyer")["ActualDaysToPay"].mean().to_dict()
    overall_avg_pay = paid_invoices["ActualDaysToPay"].mean() if not paid_invoices.empty else 15.0
    
    df["CustomerAverageDaysToPay"] = df["buyer"].map(cust_avg_pay).fillna(overall_avg_pay)
    
    # CustomerPaymentFrequency
    cust_freq = df.groupby("buyer")["DaysSinceLastInvoice"].mean().to_dict()
    df["CustomerPaymentFrequency"] = df["buyer"].map(cust_freq).fillna(30.0)
    
    # MonthOfInvoice
    df["MonthOfInvoice"] = df["invoice_date"].dt.month
    
    # IsWeekendPayment (1 if payment happened on Sat/Sun)
    df["IsWeekendPayment"] = df["actual_payment_date"].apply(
        lambda x: 1 if pd.notnull(x) and x.weekday() in [5, 6] else 0
    )
    
    return df, cust_avg_pay, overall_avg_pay

def train_cashflow_model(df_train: pd.DataFrame):
    """
    Fits a RandomForestRegressor predicting ActualDaysToPay.
    """
    if df_train.empty:
        return None
        
    X = df_train[["amount", "CustomerAverageDaysToPay", "DaysSinceLastInvoice"]].values
    y = df_train["ActualDaysToPay"].values
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    return model

@app.get("/api/ai/forecast/cashflow")
def get_cashflow_forecast():
    """
    FastAPI endpoint implementing the CashflowProjectionEngine.
    Returns:
      - total_expected_inflow: Sum of amount of unpaid invoices expected to be paid in next 30 days
      - daily_forecast: Array of inflow aggregated by date over next 30 days
      - at_risk_invoices: Invoices expected to take significantly late to be paid (PredictedDaysToPay > 30)
    """
    try:
        # 1. Fetch data
        df = prepare_cashflow_training_data()
        
        # 2. Extract features
        df, cust_avg_pay, overall_avg_pay = engineer_cashflow_features(df)
        
        # 3. Train ML model on Paid Invoices
        df_train = df[df["status"] == "Paid"]
        model = train_cashflow_model(df_train)
        
        # 4. Predict expected payment date for outstanding Unpaid Invoices
        df_unpaid = df[df["status"] != "Paid"]
        
        if df_unpaid.empty:
            return {
                "success": True,
                "total_expected_inflow": 0.0,
                "daily_forecast": [],
                "at_risk_invoices": []
            }
            
        X_unpaid = df_unpaid[["amount", "CustomerAverageDaysToPay", "DaysSinceLastInvoice"]].values
        
        if model is not None:
            predicted_days = model.predict(X_unpaid)
        else:
            predicted_days = df_unpaid["CustomerAverageDaysToPay"].values
            
        df_unpaid = df_unpaid.copy()
        df_unpaid["PredictedDaysToPay"] = predicted_days
        
        # Compute PredictedPaymentDate = InvoiceDate + PredictedDaysToPay
        predicted_dates = []
        for idx, row in df_unpaid.iterrows():
            days_to_add = int(np.round(row["PredictedDaysToPay"]))
            pred_date = row["invoice_date"] + timedelta(days=days_to_add)
            predicted_dates.append(pred_date)
            
        df_unpaid["PredictedPaymentDate"] = predicted_dates
        
        # 5. Build 30-day forecast
        today = datetime.now()
        thirty_days_later = today + timedelta(days=30)
        
        # Select unpaid invoices expected to be paid in next 30 days
        df_next_30 = df_unpaid[
            (df_unpaid["PredictedPaymentDate"] >= pd.to_datetime(today.date())) & 
            (df_unpaid["PredictedPaymentDate"] <= pd.to_datetime(thirty_days_later.date()))
        ]
        
        total_expected_inflow = float(df_next_30["amount"].sum())
        
        # Daily forecast mapping (pre-populate 30 days)
        daily_forecast_map = {}
        for i in range(31):
            day_str = (today + timedelta(days=i)).strftime("%Y-%m-%d")
            daily_forecast_map[day_str] = 0.0
            
        for _, row in df_next_30.iterrows():
            day_str = row["PredictedPaymentDate"].strftime("%Y-%m-%d")
            if day_str in daily_forecast_map:
                daily_forecast_map[day_str] += float(row["amount"])
                
        daily_forecast_list = [
            {"date": k, "expected_inflow": v} for k, v in sorted(daily_forecast_map.items())
        ]
        
        # Identifies invoices taking > 30 days to pay as "at risk"
        df_at_risk = df_unpaid[df_unpaid["PredictedDaysToPay"] > 30]
        at_risk_list = []
        for _, row in df_at_risk.iterrows():
            at_risk_list.append({
                "invoice_id": str(row["invoice_id"]),
                "buyer": row["buyer"],
                "amount": float(row["amount"]),
                "invoice_date": row["invoice_date"].strftime("%Y-%m-%d"),
                "predicted_payment_date": row["PredictedPaymentDate"].strftime("%Y-%m-%d"),
                "predicted_days_to_pay": float(np.round(row["PredictedDaysToPay"], 1)),
                "customer_average_days_to_pay": float(np.round(row["CustomerAverageDaysToPay"], 1))
            })
            
        return {
            "success": True,
            "total_expected_inflow": total_expected_inflow,
            "daily_forecast": daily_forecast_list,
            "at_risk_invoices": at_risk_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cashflow forecasting failed: {str(e)}")

class ChatRequest(BaseModel):
    message: str

@app.post("/api/ai/chat")
def post_chat_query(req: ChatRequest):
    """
    Translates natural language questions into data insights.
    Integrates with LangChain (if OPENAI_API_KEY is available) or resolves via an internal engine.
    """
    try:
        df_sales = get_live_sales_data()
        datasource = "MongoDB"
        if df_sales.empty:
            df_sales = get_mock_sales_data()
            datasource = "Mock Fallback (Offline/No Data)"
            
        openai_key = os.getenv("OPENAI_API_KEY")
        
        if openai_key and HAS_LANGCHAIN:
            try:
                llm = ChatOpenAI(temperature=0, openai_api_key=openai_key, model="gpt-3.5-turbo")
                
                # Context summarize
                revenue_sum = df_sales["grandTotal"].sum()
                profit_sum = df_sales["netProfit"].sum()
                item_sales = df_sales.groupby("description")["quantity"].sum().to_dict()
                top_items_str = ", ".join([f"'{k}': {v} units" for k, v in sorted(item_sales.items(), key=lambda x: x[1], reverse=True)[:5]])
                total_invoices = df_sales["invoiceNumber"].nunique()
                
                cust_sales = df_sales.groupby("buyerName")["grandTotal"].sum().to_dict()
                top_customers = ", ".join([f"'{k}': Rs. {v:.2f}" for k, v in sorted(cust_sales.items(), key=lambda x: x[1], reverse=True)[:3]])
                
                prompt_text = f"""
                You are a smart AI Business Analyst for a B2B SaaS platform.
                You are given summaries of the business transactions. Answer the user's question accurately.
                
                Business Data Summaries:
                - Total Sales/Revenue: Rs. {revenue_sum:.2f}
                - Total Net Profit: Rs. {profit_sum:.2f}
                - Total Number of Invoices: {total_invoices}
                - Top Selling Items: {top_items_str}
                - Top Purchasing Customers: {top_customers}
                
                User Query: {req.message}
                
                Write a concise, friendly, and helpful business response. Answer the query directly.
                """
                prompt = PromptTemplate.from_template(prompt_text)
                chain = prompt | llm
                res = chain.invoke({})
                
                return {
                    "success": True,
                    "agentType": "LangChain LLM Chain",
                    "datasource": datasource,
                    "response": res.content.strip()
                }
            except Exception:
                pass
                
        # Heuristic NLP Engine
        msg = req.message.lower()
        
        total_revenue = df_sales["grandTotal"].sum()
        total_profit = df_sales["netProfit"].sum()
        invoice_count = df_sales["invoiceNumber"].nunique()
        
        item_qty = df_sales.groupby("description")["quantity"].sum()
        best_seller = item_qty.idxmax() if not item_qty.empty else "N/A"
        best_seller_qty = item_qty.max() if not item_qty.empty else 0
        
        cust_rev = df_sales.groupby("buyerName")["grandTotal"].sum()
        top_buyer = cust_rev.idxmax() if not cust_rev.empty else "N/A"
        top_buyer_amount = cust_rev.max() if not cust_rev.empty else 0.0
        
        if "best-selling" in msg or "best selling" in msg or "top selling" in msg or "top product" in msg or "most popular" in msg:
            response_text = f"The best-selling item is '{best_seller}' with {best_seller_qty} units sold."
        elif "revenue" in msg or "sales" in msg or "how much money" in msg or "total earn" in msg:
            response_text = f"Your total revenue across all sales is Rs. {total_revenue:,.2f}."
        elif "profit" in msg or "net profit" in msg or "earnings" in msg:
            response_text = f"Your total net profit is Rs. {total_profit:,.2f}."
        elif "customer" in msg or "buyer" in msg or "purchaser" in msg:
            response_text = f"Your top customer is '{top_buyer}' with total purchase value of Rs. {top_buyer_amount:,.2f}."
        elif "invoice" in msg or "transaction" in msg or "bill" in msg:
            response_text = f"A total of {invoice_count} invoices have been successfully processed in the system."
        else:
            response_text = (
                f"Here is a summary of your business analytics:\n"
                f"- **Total Revenue**: Rs. {total_revenue:,.2f}\n"
                f"- **Total Net Profit**: Rs. {total_profit:,.2f}\n"
                f"- **Best-Selling Product**: '{best_seller}' ({best_seller_qty} units sold)\n"
                f"- **Top Customer**: '{top_buyer}' (Rs. {top_buyer_amount:,.2f})\n"
                f"- **Total Invoices**: {invoice_count}\n\n"
                f"*(Note: You can ask specific questions like 'What is my total revenue?' or 'Who is the top customer?'. "
                f"Configure the `OPENAI_API_KEY` environment variable to enable full natural language querying via LangChain!)*"
            )
            
        return {
            "success": True,
            "agentType": "Heuristic NLP Engine (No OpenAI Key)",
            "datasource": datasource,
            "response": response_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat Agent AI error: {str(e)}")


@app.get("/api/ai/customers/clv-predictions")
def predict_clv_and_churn():
    """
    Analyzes historical client invoices to calculate RFM stats, predict Churn risk,
    and estimate Customer Lifetime Value (CLV).
    """
    try:
        df = get_live_sales_data()
        if df.empty:
            df = get_mock_sales_data()

        # Group invoices by unique invoiceNumber to get customer visits
        inv_grouped = df.groupby(["invoiceNumber", "buyerName"]).agg({
            "date": "first",
            "grandTotal": "first",
            "netProfit": "first"
        }).reset_index()

        now = datetime.now()
        customer_profiles = []

        # Group by buyer
        for buyer, group in inv_grouped.groupby("buyerName"):
            group = group.sort_values("date")
            dates = group["date"].tolist()
            grand_totals = group["grandTotal"].tolist()
            profits = group["netProfit"].tolist()

            total_spend = sum(grand_totals)
            total_profit = sum(profits)
            frequency = len(dates)
            last_purchase_date = dates[-1]
            recency = (now - last_purchase_date).days

            # Calculate average interval in days
            if frequency > 1:
                intervals = [(dates[j] - dates[j-1]).days for j in range(1, len(dates))]
                avg_interval = np.mean(intervals)
                interval_std = np.std(intervals) if len(intervals) > 1 else 10.0
            else:
                avg_interval = 30.0  # default
                interval_std = 15.0

            # Calculate Churn Probability
            # If recency is larger than avg_interval, probability climbs
            if recency <= avg_interval:
                churn_prob = (recency / avg_interval) * 0.3
            else:
                overdue = recency - avg_interval
                churn_prob = 0.3 + min(0.7, (overdue / (avg_interval * 2)))

            # Cap churn probability between 0 and 1
            churn_prob = max(0.0, min(1.0, float(churn_prob)))

            # Flag churn warning
            is_at_risk = recency > (avg_interval + 1.5 * interval_std)

            # Customer Lifetime Value (CLV) calculation:
            # CLV = Current Total Profit + (Average Profit per Order * Predicted future orders next 90 days)
            # Predicted orders next 90d = 90 / avg_interval (discounted by survival probability)
            survival_prob = 1.0 - churn_prob
            avg_profit_per_order = total_profit / frequency
            predicted_future_orders = (90.0 / max(avg_interval, 5.0)) * survival_prob
            predicted_clv = total_spend + (avg_profit_per_order * predicted_future_orders)

            customer_profiles.append({
                "buyerName": buyer,
                "recency_days": int(recency),
                "frequency": int(frequency),
                "total_spend": float(round(total_spend, 2)),
                "total_profit": float(round(total_profit, 2)),
                "avg_interval_days": float(round(avg_interval, 1)),
                "churn_probability": float(round(churn_prob * 100, 1)),
                "is_at_risk": bool(is_at_risk),
                "predicted_clv_90d": float(round(predicted_clv, 2))
            })

        # Sort profiles: At risk first, then by spend
        at_risk_list = sorted([c for c in customer_profiles if c["is_at_risk"]], key=lambda x: x["churn_probability"], reverse=True)
        all_customers = sorted(customer_profiles, key=lambda x: x["predicted_clv_90d"], reverse=True)

        return {
            "success": True,
            "all_customers": all_customers,
            "at_risk_customers": at_risk_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CLV forecasting failed: {str(e)}")


@app.get("/api/ai/inventory/reorder-warnings")
def get_reorder_predictions():
    """
    Computes sales velocity, safety stock, and reorder alerts for each product.
    Determines stock depletion dates and flags urgent reorder warnings.
    """
    try:
        df = get_live_sales_data()
        if df.empty:
            df = get_mock_sales_data()

        # Group by product
        products_df = get_products_data()
        alerts = []

        now = datetime.now()

        # Lead time default is 7 days, safety stock coefficient (Z) is 1.65 (95% service level)
        lead_time_days = 7
        z_score = 1.65

        for _, row in products_df.iterrows():
            prod_id = row["productId"]
            name = row["name"]
            sku = row["sku"]

            # Filter sales for this product
            prod_sales = df[df["productId"] == prod_id]

            # Current stock simulation (mock levels since MongoDB doesn't store live stock counts)
            # Default to a mock stock value based on product ID to remain consistent
            if prod_id == "prod_1":
                current_stock = 85
            elif prod_id == "prod_2":
                current_stock = 15
            elif prod_id == "prod_3":
                current_stock = 110
            elif prod_id == "prod_4":
                current_stock = 25
            else:
                current_stock = 45

            # Calculate daily sales over the last 30 days
            last_30d_date = now - timedelta(days=30)
            sales_30d = prod_sales[prod_sales["date"] >= last_30d_date]
            
            # Aggregate by day
            daily_qtys = sales_30d.groupby(sales_30d["date"].dt.date)["quantity"].sum()
            
            # Pad empty days with zero sales to get realistic velocity
            all_days = pd.date_range(start=last_30d_date, end=now, freq="D").date
            padded_series = pd.Series(0, index=all_days)
            for d, qty in daily_qtys.items():
                padded_series[d] = qty

            avg_daily_demand = float(padded_series.mean())
            std_daily_demand = float(padded_series.std()) if len(padded_series) > 1 else 1.0

            # If no sales at all, set minimum default velocity to prevent division by zero
            velocity = max(avg_daily_demand, 0.1)

            # Safety Stock = Z * StdDev * sqrt(LeadTime)
            safety_stock = z_score * std_daily_demand * np.sqrt(lead_time_days)
            safety_stock = float(round(safety_stock, 1))

            # Reorder Point (ROP) = (Average Daily Sales * Lead Time) + Safety Stock
            reorder_point = (velocity * lead_time_days) + safety_stock
            reorder_point = float(round(reorder_point, 1))

            # Days until out of stock
            days_to_depletion = current_stock / velocity
            depletion_date = now + timedelta(days=days_to_depletion)

            # Reorder lead date (depletion date minus lead time)
            must_reorder_by = depletion_date - timedelta(days=lead_time_days)

            # Set status
            if current_stock <= safety_stock:
                status = "CRITICAL"
                recommendation = f"Stock level ({current_stock}) is below safety threshold ({safety_stock}). Restock immediately!"
            elif current_stock <= reorder_point:
                status = "REORDER"
                recommendation = f"Place order of {int(velocity * 30)} units now to avoid out-of-stock before delivery."
            else:
                status = "OK"
                recommendation = f"Stock level healthy. Reorder expected around {must_reorder_by.strftime('%d %b %Y')}."

            alerts.append({
                "productId": prod_id,
                "name": name,
                "sku": sku,
                "current_stock": current_stock,
                "daily_sales_velocity": float(round(velocity, 2)),
                "safety_stock": safety_stock,
                "reorder_point": reorder_point,
                "days_to_depletion": float(round(days_to_depletion, 1)),
                "estimated_depletion_date": depletion_date.strftime("%Y-%m-%d"),
                "must_reorder_by_date": must_reorder_by.strftime("%Y-%m-%d"),
                "status": status,
                "recommendation": recommendation
            })

        return {
            "success": True,
            "alerts": alerts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inventory forecasting failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    # Passing the FastAPI app object directly makes direct script execution robust
    uvicorn.run(app, host="0.0.0.0", port=8000)

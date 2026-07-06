# ml-service/app/main.py

import os
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from pymongo import MongoClient
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

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


if __name__ == "__main__":
    import uvicorn
    # Passing the FastAPI app object directly makes direct script execution robust
    uvicorn.run(app, host="0.0.0.0", port=8000)

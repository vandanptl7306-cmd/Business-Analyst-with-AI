# AI Intelligence Layer - FastAPI Microservice

## Overview
The AI Intelligence Layer is a standalone Python FastAPI microservice that provides advanced machine learning and data analytics capabilities for the Business Analyst with AI platform. It communicates with the Node.js/MongoDB backend to enable intelligent business insights.

**Technology Stack:**
- **Language**: Python 3.9+
- **Framework**: FastAPI + Uvicorn
- **ML Libraries**: Pandas, NumPy, scikit-learn
- **NLP**: LangChain (OpenAI/Local LLM support)
- **Database**: PyMongo (MongoDB integration)

---

## Architecture Overview

### Data Flow
```
Node.js Backend (MongoDB)
        ↓
PyMongo Connector
        ↓
Pandas DataFrames
        ↓
ML/AI Models (scikit-learn, LangChain)
        ↓
FastAPI Endpoints
        ↓
REST API Responses
```

### Core Components

#### 1. **Data Extraction Layer**
- `get_live_sales_data()` - Fetches invoices from MongoDB, unwinds items into flat DataFrame
- `get_mock_sales_data()` - Fallback synthetic data for offline development
- `get_products_data()` - Retrieves product catalog with pricing
- `get_historical_sales(product_id)` - Aggregates daily sales for trend analysis
- MongoDB Connection: 2-second timeout to prevent hangs when offline

#### 2. **Feature Engineering**
- `build_features()` - Generates time-series features for forecasting:
  - **Date Features**: Day of week, Month
  - **Lag Features**: 1-day, 7-day, 14-day lagged sales
  - **Rolling Statistics**: 7-day and 14-day moving averages

#### 3. **ML Models**
- **RandomForestRegressor**: Demand forecasting (7-30 day horizon)
- **IsolationForest**: Transaction anomaly detection (spikes/drops)
- **KMeans**: Customer segmentation (RFM clustering)
- **StandardScaler**: Feature normalization

---

## API Endpoints

### 1. **Inventory Optimization - EOQ & Trend Analysis**

#### Endpoint: `GET /api/ai/inventory/eoq`

**Purpose**: Calculate Economic Order Quantity (EOQ) and classify products as Best-Sellers or Slow-Movers

**Query Parameters**:
```
- ordering_cost (float): Cost per order setup (S), default 50.0
- holding_cost (float): Annual holding cost per unit (H), default 2.0
- lead_time_days (int): Lead time in days (L), default 7
```

**Formula**:
```
EOQ = √(2DS/H)
where:
  D = Annual demand (units)
  S = Ordering cost per order
  H = Holding cost per unit per year

Reorder Point (ROP) = (Avg Daily Demand × Lead Time) + Safety Stock
Safety Stock = Z × σ × √L
where:
  Z = 1.65 (95% service level)
  σ = Standard deviation of daily demand
  L = Lead time in days
```

**Response Example**:
```json
{
  "success": true,
  "datasource": "MongoDB",
  "products": [
    {
      "productId": "prod_1",
      "name": "Organic Rice",
      "sku": "RIC-ORG-01",
      "annualDemand": 2190.0,
      "averageDailyDemand": 6.0,
      "eoq": 148.32,
      "reorderPoint": 52.5,
      "safetyStock": 10.2,
      "status": "Best-Sellers",
      "movingAverage30Day": 5.8,
      "movingAverage90Day": 6.1
    }
  ]
}
```

**Product Classification**:
- **Best-Sellers**: 30-day MA > 1.5 units/day OR (30-day MA > 90-day MA × 1.15 AND > 0.5)
- **Slow-Movers**: 30-day MA < 0.25 units/day
- **Normal**: Everything else

---

### 2. **Customer Segmentation - RFM Analysis**

#### Endpoint: `GET /api/ai/customers/segmentation`

**Purpose**: Segment customers using Recency, Frequency, and Monetary (RFM) analysis with KMeans clustering

**Query Parameters**:
```
- num_clusters (int): Number of segments (2-5), default 3
```

**RFM Metrics**:
```
- Recency (R): Days since last purchase
- Frequency (F): Number of purchases/invoices
- Monetary (M): Total purchase value (Rs.)
```

**Clustering Algorithm**:
1. Extract RFM features from invoice data
2. StandardScaler normalization
3. KMeans clustering (n_clusters specified)
4. Assign labels based on composite score: (F × 5) + (M / 500) - (R × 0.1)

**Segment Labels** (for 3 clusters):
- **High-Value Customer**: High frequency, high monetary, low recency
- **Regular Customer**: Moderate metrics
- **At-Risk Customer**: Low frequency, low monetary, high recency

**Response Example**:
```json
{
  "success": true,
  "datasource": "MongoDB",
  "segments": [
    {
      "buyerName": "Client Alpha",
      "recency": 5,
      "frequency": 12,
      "monetary": 45000.50,
      "clusterId": 0,
      "segmentLabel": "High-Value Customer"
    }
  ],
  "summary": {
    "High-Value Customer": 3,
    "Regular Customer": 2,
    "At-Risk Customer": 1
  }
}
```

---

### 3. **Anomaly Detection - Transaction Analysis**

#### Endpoint: `GET /api/ai/transactions/anomalies`

**Purpose**: Detect unusual sales drops, spikes, or processing errors using IsolationForest

**Query Parameters**:
```
- contamination (float): Expected anomaly rate (0.01-0.2), default 0.05 (5%)
```

**Features Analyzed**:
```
- Daily Revenue (grandTotal sum)
- Invoice Count per day
- Item Quantity per day
```

**Anomaly Detection Algorithm**:
1. Extract daily aggregates from sales data
2. Normalize features with StandardScaler
3. Fit IsolationForest (contamination % of data marked as anomalies)
4. Classify anomalies:
   - **Drop**: Revenue < 45% of 14-day rolling median (potential stockout/incident)
   - **Spike**: Revenue > 165% of rolling median (surge/high sales)
   - **Operational Anomaly**: Unusual feature mix

**Response Example**:
```json
{
  "success": true,
  "datasource": "MongoDB",
  "totalDaysAnalyzed": 90,
  "anomaliesFound": 2,
  "anomalies": [
    {
      "date": "2024-03-15",
      "revenue": 850.50,
      "invoiceCount": 3,
      "quantity": 45,
      "type": "Drop (Potential Stockout/Incident)",
      "anomalyScore": -0.4521
    }
  ]
}
```

---

### 4. **Demand Forecasting - Time Series Prediction**

#### Endpoint: `GET /api/ml/forecast/{product_id}`

**Purpose**: Predict future sales quantities using RandomForestRegressor with recursive forecasting

**Path Parameters**:
```
- product_id (str): Product ID or product description
```

**Query Parameters**:
```
- days (int): Forecast horizon (7-30), default 7
```

**Forecasting Pipeline**:
1. Extract historical sales for the product
2. Feature engineering (date features, lags, rolling averages)
3. RandomForestRegressor training (50 estimators)
4. **Recursive Forecasting**: Each prediction feeds the next (t+1 depends on t)
5. Cold-start fallback: If < 20 days of history, use synthetic baseline with weekly seasonality

**Response Example**:
```json
{
  "success": true,
  "productId": "prod_1",
  "model": "RandomForestRegressor Time-Series Pipeline",
  "days": 7,
  "forecast": [
    {
      "date": "2024-03-16",
      "predicted_quantity": 8.45
    },
    {
      "date": "2024-03-17",
      "predicted_quantity": 7.32
    }
  ]
}
```

---

### 5. **Price Optimization - Competitor Analysis**

#### Endpoint: `GET /api/ai/price-optimization`

**Purpose**: Simulate competitor pricing and recommend strategic selling prices

**Query Parameters**:
```
- product_name (str): Name of the product (required)
- current_price (float): Optional current selling price (fetched from DB if not provided)
```

**Pricing Strategies**:

1. **Aggressive Undercut (Economy)**
   - Price: 99% of lowest competitor
   - Rationale: Capture price-sensitive market segment

2. **Match Market Average**
   - Price: Average of all competitors
   - Rationale: Maintain fair margins and market positioning

3. **Value-Add Premium**
   - Price: 98% of highest competitor
   - Rationale: Position near premium tier for quality-conscious buyers

**Response Example**:
```json
{
  "success": true,
  "productName": "Organic Rice",
  "currentPrice": 80.0,
  "competitors": [
    {
      "competitor": "GlobalRetail Inc",
      "price": 76.0
    },
    {
      "competitor": "Mart Express",
      "price": 77.6
    }
  ],
  "statistics": {
    "average": 76.9,
    "minimum": 76.0,
    "maximum": 85.2
  },
  "recommendations": {
    "undercut": {
      "strategy": "Aggressive Undercut (Economy)",
      "price": 75.24,
      "rationale": "Priced 1% below lowest competitor..."
    },
    "market_average": {
      "strategy": "Match Market Average",
      "price": 76.9,
      "rationale": "Align with average competitor pricing..."
    },
    "premium": {
      "strategy": "Value-Add Premium Pricing",
      "price": 83.5,
      "rationale": "Position product near the highest pricing point..."
    }
  }
}
```

---

### 6. **Natural Language Chat - Business Queries**

#### Endpoint: `POST /api/ai/chat`

**Purpose**: Answer business questions in plain English (LangChain or Heuristic NLP)

**Request Body**:
```json
{
  "message": "What was the best-selling item this month?"
}
```

**Query Types Supported** (Heuristic Engine):
- "best-selling", "top selling", "top product", "most popular" → Best-seller response
- "revenue", "sales", "how much money", "total earn" → Total revenue
- "profit", "net profit", "earnings" → Total profit
- "customer", "buyer", "purchaser" → Top customer info
- "invoice", "transaction", "bill" → Invoice count
- *Default*: Full business summary

**LangChain Integration**:
- If `OPENAI_API_KEY` environment variable is set and LangChain is available
- Uses GPT-3.5-turbo for advanced natural language understanding
- Provides context from sales data summaries
- Falls back to heuristic engine if LangChain fails or key not available

**Response Example**:
```json
{
  "success": true,
  "agentType": "Heuristic NLP Engine (No OpenAI Key)",
  "datasource": "MongoDB",
  "response": "The best-selling item is 'Organic Rice' with 258 units sold."
}
```

---

### 7. **Dashboard Metrics - Time Series Analytics**

#### Endpoint: `GET /api/analytics/dashboard-metrics`

**Purpose**: Extract advanced business metrics and trend analysis with configurable time intervals

**Query Parameters**:
```
- start_date (str): Optional start date (YYYY-MM-DD format)
- end_date (str): Optional end date (YYYY-MM-DD format)
- interval (str): Aggregation interval (daily, weekly, monthly), default "daily"
```

**KPIs Computed**:
```json
{
  "kpis": {
    "totalRevenue": 125000.50,
    "totalProfit": 35000.25,
    "salesVolume": 450,
    "customersAcquired": 8,
    "repeatCustomerRate": 62.5
  }
}
```

**Trend Data**:
```json
{
  "trendData": [
    {
      "date": "2024-03-15",
      "revenue": 5000.0,
      "profit": 1500.0,
      "sales_count": 12,
      "revenue_growth": 2.5,
      "sales_growth": -1.8
    }
  ]
}
```

**Metrics Explanation**:
- **Revenue Growth**: Period-over-period percentage change (%)
- **Sales Growth**: Period-over-period invoice count change (%)
- **Repeat Customer Rate**: Percentage of customers with multiple purchases

---

## Error Handling & Fallbacks

### Database Fallback Strategy
```python
if MongoDB is offline:
    use mock data (get_mock_sales_data())
if insufficient live data:
    use mock data + cold-start algorithms
if endpoint fails:
    return HTTPException with detailed error message
```

### Cold-Start Scenarios
1. **Demand Forecasting** (< 20 days history):
   - Synthetic baseline with weekly seasonality
   - Weekends higher demand (realistic for retail)

2. **Anomaly Detection** (< 5 daily records):
   - Switch to mock data
   - Recalculate with 90 days of synthetic history

3. **Customer Segmentation** (< 3 customers):
   - KMeans reduces to available sample size
   - Labels auto-adjust based on actual clusters

---

## Running the Service

### Setup
```bash
# Navigate to ml-service
cd ml-service

# Create virtual environment (if not exists)
python -m venv .venv

# Activate venv
# On Windows:
.\.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Start Service
```bash
# Option 1: Direct Python execution
python app/main.py

# Option 2: Uvicorn with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Option 3: Production-grade with workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Default Configuration
- **Host**: 0.0.0.0 (accessible from any network interface)
- **Port**: 8000
- **Auto-reload**: Enabled in development mode

---

## Environment Variables

```bash
# MongoDB Connection (optional, defaults to localhost)
MONGO_URI=mongodb://localhost:27017/business-analyst-with-ai

# OpenAI API Key (optional, enables LangChain LLM)
OPENAI_API_KEY=sk-...your-key-here...

# Service Port (optional)
PORT=8000
```

---

## Testing Endpoints

### Using cURL

```bash
# 1. Inventory EOQ
curl "http://localhost:8000/api/ai/inventory/eoq?ordering_cost=50&holding_cost=2&lead_time_days=7"

# 2. Customer Segmentation
curl "http://localhost:8000/api/ai/customers/segmentation?num_clusters=3"

# 3. Transaction Anomalies
curl "http://localhost:8000/api/ai/transactions/anomalies?contamination=0.05"

# 4. Demand Forecast
curl "http://localhost:8000/api/ml/forecast/prod_1?days=7"

# 5. Price Optimization
curl "http://localhost:8000/api/ai/price-optimization?product_name=Organic+Rice&current_price=80"

# 6. Dashboard Metrics
curl "http://localhost:8000/api/analytics/dashboard-metrics?interval=daily"

# 7. Chat Query (POST)
curl -X POST "http://localhost:8000/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is my total revenue?"}'

# 8. Health Check
curl "http://localhost:8000/health"
```

### Using Python Requests
```python
import requests

# EOQ Analysis
response = requests.get(
    "http://localhost:8000/api/ai/inventory/eoq",
    params={"ordering_cost": 50, "holding_cost": 2, "lead_time_days": 7}
)
print(response.json())

# Chat Query
response = requests.post(
    "http://localhost:8000/api/ai/chat",
    json={"message": "Who is my top customer?"}
)
print(response.json())
```

---

## Integration with Backend

### Data Flow Example

**Scenario**: Calculate inventory optimization when user clicks "Optimize Inventory"

1. **Frontend** → Sends GET request to Node.js backend `/api/inventory/optimize`
2. **Node.js Backend** → Forwards request to FastAPI `/api/ai/inventory/eoq`
3. **FastAPI Service**:
   - Queries MongoDB for invoices and products
   - Computes EOQ, ROP, safety stock
   - Classifies products
4. **FastAPI Response** → Returns JSON with recommendations
5. **Node.js Backend** → Formats response and sends to Frontend
6. **Frontend** → Displays EOQ table with color-coded status

---

## Performance Considerations

### Optimization Tips
1. **Caching**: Implement Redis caching for frequent queries
2. **Batch Processing**: Use MongoDB aggregation pipelines
3. **Parallel Endpoints**: FastAPI handles concurrent requests efficiently
4. **Data Sampling**: For large datasets (>10K invoices), sample 1000 recent records

### Monitoring
- Log all API calls with response times
- Track anomaly detection accuracy
- Monitor forecast RMSE vs. actual sales
- Alert on database connectivity issues

---

## Future Enhancements

1. **Multi-model Ensemble**: Combine ARIMA, Prophet, LSTM for better forecasts
2. **Dynamic Pricing**: Real-time price adjustment based on demand elasticity
3. **Supply Chain Optimization**: Supplier recommendation engine
4. **Customer Lifetime Value (CLV)**: Predict long-term customer profitability
5. **Seasonal Decomposition**: STL or X-13 for advanced trend extraction
6. **Fraud Detection**: Advanced anomaly detection for suspicious transactions
7. **Recommendation Engine**: Product recommendations based on purchase patterns
8. **Real-time Dashboards**: WebSocket integration for live metrics

---

## Troubleshooting

### Issue: MongoDB Connection Timeout
**Solution**: Ensure MongoDB is running and accessible. Check `MONGO_URI` environment variable.

### Issue: Insufficient Data Error
**Solution**: Service automatically uses mock data. Ensure invoices exist in MongoDB collection.

### Issue: LangChain Not Working
**Solution**: Install `langchain` and `langchain-openai`: `pip install langchain langchain-openai`

### Issue: "All clusters failed to start"
**Solution**: Clear Python cache (`rm -rf __pycache__`) and restart the service.

---

## Contact & Support
For issues, questions, or feature requests, contact the AI Intelligence Layer development team.

**Version**: 1.0.0  
**Last Updated**: 2024-07-06

# AI Intelligence Layer - Quick Reference & Testing Guide

## 🎯 Quick Start

### Service Status
✅ **AI Intelligence Layer Running on Port 8000**

### Health Check
```bash
curl http://localhost:8000/health
```

---

## 📡 API Quick Reference

### 1. Inventory Optimization (EOQ)
```bash
curl "http://localhost:8000/api/ai/inventory/eoq?ordering_cost=50&holding_cost=2&lead_time_days=7"
```
**Returns**: Product-wise EOQ, reorder points, and trend classifications

### 2. Customer Segmentation (RFM)
```bash
curl "http://localhost:8000/api/ai/customers/segmentation?num_clusters=3"
```
**Returns**: Customer groups (High-Value, Regular, At-Risk)

### 3. Anomaly Detection
```bash
curl "http://localhost:8000/api/ai/transactions/anomalies?contamination=0.05"
```
**Returns**: Unusual sales drops/spikes with severity scores

### 4. Demand Forecasting
```bash
curl "http://localhost:8000/api/ml/forecast/Organic%20Rice?days=7"
```
**Returns**: 7-day sales predictions for specified product

### 5. Price Optimization
```bash
curl "http://localhost:8000/api/ai/price-optimization?product_name=Organic%20Rice"
```
**Returns**: 3 pricing strategies (Undercut, Market Average, Premium)

### 6. Natural Language Chat
```bash
curl -X POST "http://localhost:8000/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is my total revenue?"}'
```
**Returns**: AI-powered business insights

### 7. Dashboard Analytics
```bash
curl "http://localhost:8000/api/analytics/dashboard-metrics?interval=daily"
```
**Returns**: KPIs and trend data for dashboards

---

## 📊 Key Features

| Feature | Endpoint | Purpose |
|---------|----------|---------|
| **Inventory Optimization** | `/api/ai/inventory/eoq` | Calculate EOQ, ROP, Safety Stock |
| **Customer Segmentation** | `/api/ai/customers/segmentation` | RFM-based customer clustering |
| **Anomaly Detection** | `/api/ai/transactions/anomalies` | Detect sales drops/spikes |
| **Demand Forecasting** | `/api/ml/forecast/{product_id}` | 7-30 day sales predictions |
| **Price Optimization** | `/api/ai/price-optimization` | Competitive pricing analysis |
| **NLP Chat** | `/api/ai/chat` | Natural language business queries |
| **Dashboard Metrics** | `/api/analytics/dashboard-metrics` | KPIs and trend analytics |

---

## 🧮 Business Formulas

### Economic Order Quantity (EOQ)
$$EOQ = \sqrt{\frac{2DS}{H}}$$
- D = Annual Demand
- S = Ordering Cost per order
- H = Annual holding cost per unit

### Reorder Point (ROP)
$$ROP = (ADd \times L) + SS$$
- ADd = Average Daily Demand
- L = Lead Time (days)
- SS = Safety Stock

### Safety Stock
$$SS = Z \times \sigma_d \times \sqrt{L}$$
- Z = Service level factor (1.65 for 95%)
- σ_d = Standard deviation of daily demand
- L = Lead time

---

## 💾 Data Fallback Strategy

**MongoDB Offline?** → **Mock Data Activated** ✅

All endpoints work with synthetic data including:
- 90-day invoice history with realistic patterns
- Intentional anomalies (day 45: sales drop, day 75: sales spike)
- 5 sample products and 5 sample customers
- Reproducible results (seed=42)

---

## 🔧 Environment Setup

### Set OpenAI API Key (Optional - for Full NLP)
```bash
# Windows
set OPENAI_API_KEY=sk-...your-key...

# macOS/Linux
export OPENAI_API_KEY=sk-...your-key...
```

### Set MongoDB URI (Optional)
```bash
# Default: mongodb://localhost:27017/business-analyst-with-ai
set MONGO_URI=mongodb://your-server:27017/your-db
```

---

## 📈 Example Workflows

### Workflow 1: Optimize Inventory
```bash
# 1. Get current inventory metrics
curl "http://localhost:8000/api/ai/inventory/eoq"

# 2. For each product, determine:
#    - EOQ: Order this many units
#    - ROP: Reorder when stock reaches this level
#    - Safety Stock: Buffer to prevent stockouts
```

### Workflow 2: Target Marketing
```bash
# 1. Segment customers by value
curl "http://localhost:8000/api/ai/customers/segmentation?num_clusters=3"

# 2. Use segments for campaigns:
#    - High-Value: Premium service, loyalty rewards
#    - Regular: Standard offerings
#    - At-Risk: Win-back campaigns
```

### Workflow 3: Fraud Detection
```bash
# 1. Scan for unusual transactions
curl "http://localhost:8000/api/ai/transactions/anomalies"

# 2. Investigate flagged dates:
#    - Large drops: Potential system errors or fraud
#    - Large spikes: Verify legitimacy
#    - Operational anomalies: Mix changes
```

### Workflow 4: Stock Planning
```bash
# 1. Forecast demand for next 14 days
curl "http://localhost:8000/api/ml/forecast/Organic%20Rice?days=14"

# 2. Use predictions to:
#    - Schedule procurement
#    - Plan warehousing
#    - Adjust production schedules
```

---

## 🧠 ML Models Used

| Model | Use Case | Algorithm | Tuning |
|-------|----------|-----------|--------|
| **RandomForestRegressor** | Demand Forecasting | Ensemble | n_estimators=50, random_state=42 |
| **IsolationForest** | Anomaly Detection | Ensemble | contamination=0.05 |
| **KMeans** | Customer Segmentation | Clustering | k=2-5, n_init=10 |
| **StandardScaler** | Feature Normalization | Scaling | Mean=0, StdDev=1 |

---

## 📚 Interactive Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🚀 Next Steps

1. **Integrate with Backend**: Call ML endpoints from Node.js controllers
2. **Build Dashboards**: Use `/api/analytics/dashboard-metrics` for charts
3. **Enable NLP**: Set `OPENAI_API_KEY` for GPT-powered insights
4. **Monitor Performance**: Track endpoint latencies and accuracy
5. **Scale**: Implement Redis caching and async task queues

---

## 📞 Support

For detailed documentation, see `AI_INTELLIGENCE_LAYER.md`

**Contact**: AI/ML Engineering Team

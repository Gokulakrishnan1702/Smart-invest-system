# ⬡ Smart Invest: AI Real Estate & Land Investment System

> **Automated property & land valuation, profit/loss projection, market forecasting, and AI-powered financial risk management.**

---

## 📌 Overview

**Smart Invest** is an end-to-end intelligent investment evaluation platform designed to help real estate investors, property managers, and buyers evaluate land and property acquisitions in real-time.

By combining machine learning algorithms (Random Forest, Gradient Boosting), sentiment analysis, deep learning image appraisal, and real-time market indices, Smart Invest delivers:
- Precise fair-market price predictions.
- Instant profit & loss evaluation against asking prices.
- 1 to 5-year capital appreciation forecasts.
- Multi-factor risk scoring and portfolio optimization.

---

## 📊 Three-Dataset Architecture

Smart Invest unifies three specialized dataset repositories to provide comprehensive, high-precision coverage across all real estate categories:

| Dataset | Records | Scope & Purpose | Active ML Engine |
| :--- | :--- | :--- | :--- |
| **`smart_invest_realistic_dataset.csv`** | 25,000 | Realistic commercial, industrial, residential, and agricultural properties across 25 Indian districts with ROI %, demand score, location score, and price trends. | **Realistic Property Engine** (RF + GB, R²=0.962) |
| **`land_data.csv`** | 500 (+11,513 from realistic) | Precision land boundary parcels, acreage, cents, and development plots. | **Unified Land Engine** (12,013 parcels, R²=0.829) |
| **`world_real_estate_data.csv`** | 147,000 | Multi-country international benchmark housing data (USA, Turkey, Spain, Russia, Hungary, Greece, etc.). | **Global Benchmark Engine** (147k records, R²=0.522) |

---

## 🚀 Key Features

---

## 🎯 14 Decision-Support Modules & Architecture

Smart Invest operates as a logically connected decision-support pipeline where each module builds upon preceding layers:

$$\text{Property Data} \to \text{Valuation} \to \text{Comparables} \to \text{Location} \to \text{Market} \to \text{Risk} \to \text{Forecast} \to \text{P&L} \to \text{Sentiment} \to \text{Scenarios} \to \text{Score} \to \text{Report}$$

1. **📊 Executive Dashboard**: Dynamic KPI metrics (Estimated Fair Value, Current Asking Price, Expected Return %, Composite Risk Level, Market Sentiment, and Investment Score) + SMART INVEST INSIGHT recommendation card.
2. **🏡 Property Valuation (ML Core)**: Dual Gradient Boosting & Random Forest engines with 96.2% R² precision, feature importances, and statistical confidence intervals.
3. **⚖️ Comparable Property Analysis**: Real-world matching against 25,000 verified transaction records in `smart_invest_realistic_dataset.csv`, computing average ₹/sqft and price difference %.
4. **🗺️ Location Intelligence & GIS**: Interactive Leaflet map with 1 km and 3 km radius analysis, plus proximity indicators for arterial highways, hospitals, schools, and transit terminals.
5. **📈 Dedicated Market Analysis**: 4 dedicated charts: Historical Price (2022-2025), Market Growth (% YoY), Price/sqft Momentum, and Volatility & Moving Averages (SMA 20/50).
6. **🌦️ Multi-Hazard Risk Dashboard**: Granular natural disaster breakdown (Flood, Earthquake [BIS Seismic Zones II-V], Heavy Rain, Fire) and financial volatility exposure.
7. **🔮 Price History + Forecast Timeline**: Timeline (2022-2027+) visually separating solid historical estimates from dashed model forecasts with shaded confidence bounds.
8. **🧮 Profit & Loss Calculator**: Evaluates total capital outlay (purchase, stamp duty, renovation, other expenses), future equity, net profit, downside loss exposure, ROI %, CAGR %, and 12-month expected profit curve.
9. **🧠 Sentiment Analysis & Curated News**: NLP polarity scoring (+0.32 index) across monetary policy and real estate news with interactive filters ([All], [Positive], [Neutral], [Negative]).
10. **⚡ Scenario & What-If Stress Testing**: Evaluates 8 realistic economic shocks (Base Case, High Growth, Stagnation, Rate Hike, Downturn, Infra Boost, Infra Delay, Natural Hazard).
11. **🤖 AI Investment Assistant**: Conversational real-estate advisory assistant.
12. **💼 Portfolio Management & RL Agent**: Multi-asset holdings allocation with Reinforcement Learning (Q-learning) rebalancing recommendations.
13. **📄 Smart Invest Analysis Report**: Complete, printable/exportable acquisition dossier with print stylesheet.
14. **🔬 Model Performance & Data Quality Audit**: Official regression evaluation metrics (R²=0.962, MAE=₹627.96/sqft, RMSE=970.44, MAPE=21.78%) across all 3 integrated datasets for college project reviews and vivas.

---

## 📐 Transparent Investment Analysis Score Formula

Instead of an opaque black box, Smart Invest computes an auditable 6-factor composite score (0 to 100):

$$\text{Score} = 0.25 \times \text{FairValue} + 0.20 \times \text{Location} + 0.15 \times \text{Infra} + 0.15 \times \text{Market} + 0.10 \times \text{Sentiment} + 0.15 \times \text{Risk}$$

- **Fair Value Score (25%)**: Compares Asking Price vs AI Fair Value (rewards undervaluation bargains, penalizes overpriced assets).
- **Location Score (20%)**: Combines district location tier and commercial absorption demand.
- **Infrastructure Score (15%)**: Evaluates road access (paved arterial vs dirt) and utility connectivity.
- **Market Trend Score (15%)**: Driven by historical price appreciation momentum and ROI %.
- **Sentiment Score (10%)**: NLP polarity score normalized from -1.0..+1.0 into 0..100.
- **Risk Score (15%)**: Inverse of composite natural hazard and financial vulnerability ($100 - \text{Risk}\%$).

---

## 🏗️ Tech Stack

- **Backend**: FastAPI (Python 3.10+), SQLAlchemy, Uvicorn, WebSockets
- **Machine Learning & Data**: Scikit-Learn, Pandas, NumPy, Joblib, TensorFlow/Keras
- **Frontend SPA**: React, Vite, Leaflet, Leaflet-Routing-Machine, Chart.js
- **Analytics Dashboard**: Streamlit, Plotly
- **Database**: SQLite (extensible to PostgreSQL)

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Clone the Repository
```bash
git clone https://github.com/Gokulakrishnan1702/Smart-invest-system.git
cd Smart-invest-system
```

### 3. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
pip install -r streamlit_dashboard/requirements.txt
```

### 4. Frontend Setup
```bash
npm install
```

---

## 🏃 Running the Application

### Option 1: Start FastAPI Backend
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: `http://127.0.0.1:8000/docs`

### Option 2: Start Frontend (Vite)
```bash
npm run dev
```
Open your browser at: `http://localhost:3000`

### Option 3: Start Streamlit Dashboard
```bash
cd streamlit_dashboard
streamlit run dashboard.py --server.port 8501
```
Access the dashboard at: `http://localhost:8501`

---

## 🔑 Default Administrator Login

| Credential | Value |
| :--- | :--- |
| **Email** | `admin@smartinvest.ai` |
| **Password** | `AdminPass123!` |
| **Role** | Administrator |

---

## 📂 Project Structure

```text
├── backend/
│   ├── dl_models/           # Deep learning image valuation models
│   ├── hybrid/              # Hybrid analytical pipelines
│   ├── ml_models/           # Random forest, gradient boosting, and RL agents
│   │   ├── agent.py
│   │   ├── market.py
│   │   ├── sentiment.py
│   │   ├── simulation.py
│   │   └── valuation.py
│   ├── auth.py              # JWT authentication & role-based access control
│   ├── database.py          # SQLAlchemy models and schema definitions
│   ├── main.py              # FastAPI application endpoints & WebSockets
│   └── requirements.txt
├── datasets/                # Land and housing reference training datasets
├── frontend/
│   ├── css/                 # Global styling and themes
│   ├── MapComponent.jsx     # Leaflet interactive map picker
│   ├── app.js               # Main SPA application logic
│   └── index.html           # Main SPA HTML entrypoint
├── streamlit_dashboard/
│   ├── dashboard.py         # Streamlit analytics application
│   └── requirements.txt
├── package.json             # Frontend dependencies & scripts
├── vite.config.js           # Vite dev server and proxy configuration
└── README.md
```

---

## 📄 License

This project is licensed under the MIT License.

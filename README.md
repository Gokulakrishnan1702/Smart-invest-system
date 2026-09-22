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

### 🏡 Intelligent Property & Land Valuation
- **Triple-Engine ML Architecture**:
  - *Realistic Property Engine* (R²=0.962) trained on 25,000 real-world records covering 15 property types.
  - *Unified Land Engine* (R²=0.829) trained on 12,013 combined land records.
  - *Global Benchmark Engine* (R²=0.522) for international cross-border properties.
- **Investment Intelligence**: Automated expected annual ROI % prediction, investment potential rating (High, Medium, Low), market demand score, and location quality score.
- **Dedicated Land Pricing Engine**: Modeled specifically on land metrics (sqft, acres, cents, location, district, road accessibility, utility access) avoiding misleading residential room/floor formulas.
- **Multi-Unit Area Converter**: Seamless switching between **Sqft**, **Acres**, and **Cents** with dynamic conversion.
- **Profit & Loss Calculator**: Evaluates entered asking price vs. AI fair market value to flag bargains, fair value, and overpriced properties.
- **Explainable AI (XAI)**: Feature importance breakdowns and upper/lower confidence bounds.
- **Interactive GIS Map**: Leaflet-powered geolocation picker with live route calculation and road/satellite views.

### 📈 Market Analysis & Economic Forecasting
- Multi-country real estate price index tracking.
- Market cycle phase indicators (Recovery, Expansion, Hyper Supply, Recession).
- Projected trend outlooks and historical performance visualizations.

### 🧠 Market Sentiment & NLP Analysis
- Real-time news scraping and NLP sentiment analysis.
- Confidence-weighted market mood meters (Bullish, Neutral, Bearish).

### ⚡ Portfolio Management & Scenario Stress Testing
- Dynamic portfolio distribution and risk metrics.
- Reinforcement learning (RL) based portfolio rebalancing recommendations.
- Macroeconomic scenario stress tests: Interest rate hikes, inflation spikes, market crashes, and regulatory shifts.

### 📊 Multiple Dashboards
1. **Interactive Single Page Application (SPA)**: Built with modern responsive UI, dark/light theme, Chart.js, and Leaflet GIS.
2. **Streamlit Analytics Dashboard**: Executive analytics cockpit with interactive Plotly scatter plots, gauges, and scenario configurators.

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

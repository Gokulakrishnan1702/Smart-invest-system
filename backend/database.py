import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from dotenv import load_dotenv

# Project Reorganization Comments:
# - Frontend: Located in the "/frontend" folder relative to the workspace root.
# - Backend: Located in the "/backend" folder (includes main.py, auth.py, database.py, and ml_models).
# - Database: Database files are separated into the "/database" folder.
# - Datasets: Dataset files are separated into the "/datasets" folder.

load_dotenv()

# Resolve DB path relative to this file's directory so it works regardless of CWD.
# Use abspath+normpath to collapse '..' and produce an absolute path without spaces issues.
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_DEFAULT_DB = os.path.normpath(os.path.join(_THIS_DIR, "..", "database", "smart_invest.db"))
# Ensure the database directory exists before SQLAlchemy tries to open the file
os.makedirs(os.path.dirname(_DEFAULT_DB), exist_ok=True)
# On Windows, SQLite paths with spaces MUST use backslashes in the SQLAlchemy URI
# (forward slashes fail when there are spaces in the path, e.g. "New folder").
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///" + _DEFAULT_DB)

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="User")  # Admin, User, Manager
    created_at = Column(DateTime, default=datetime.utcnow)

    properties = relationship("Property", back_populates="user")
    portfolios = relationship("Portfolio", back_populates="user")
    simulations = relationship("Simulation", back_populates="user")
    alerts = relationship("Alert", back_populates="user")
    reports = relationship("Report", back_populates="user")
    image_analyses = relationship("ImageAnalysis", back_populates="user")

class Property(Base):
    __tablename__ = "properties"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    address = Column(String, nullable=False)
    sqft = Column(Float, nullable=False)
    bedrooms = Column(Integer, nullable=False)
    bathrooms = Column(Float, nullable=False)
    year_built = Column(Integer, nullable=False)
    predicted_price = Column(Float, nullable=True)
    actual_price = Column(Float, nullable=True)
    risk_score = Column(Float, default=0.0)
    property_type = Column(String, default="Houses (single-family, townhouses)", nullable=True)
    extra_details = Column(Text, nullable=True)
    hold_years = Column(Integer, default=1, nullable=True)
    projected_price = Column(Float, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    google_place_id = Column(String, nullable=True)
    formatted_address = Column(String, nullable=True)
    area = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)

    user = relationship("User", back_populates="properties")
    transactions = relationship("Transaction", back_populates="property", cascade="all, delete-orphan")
    portfolio_items = relationship("Portfolio", back_populates="property", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"))
    sale_price = Column(Float, nullable=False)
    sale_date = Column(DateTime, default=datetime.utcnow)
    buyer = Column(String, nullable=True)
    seller = Column(String, nullable=True)

    property = relationship("Property", back_populates="transactions")

class MarketData(Base):
    __tablename__ = "market_data"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    index_name = Column(String, nullable=False)  # S&P500, HPI, Volatility, etc.
    value = Column(Float, nullable=False)
    volatility = Column(Float, default=0.0)
    source = Column(String, nullable=True)

class SentimentAnalysis(Base):
    __tablename__ = "sentiment_analysis"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    sentiment_score = Column(Float, nullable=False)  # -1.0 to 1.0
    entities = Column(Text, nullable=True)  # JSON string of NER results
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Portfolio(Base):
    __tablename__ = "portfolio"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    property_id = Column(Integer, ForeignKey("properties.id"))
    allocation = Column(Float, default=0.0)  # percentage or dollar allocation
    entry_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)

    user = relationship("User", back_populates="portfolios")
    property = relationship("Property", back_populates="portfolio_items")

class Simulation(Base):
    __tablename__ = "simulations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    scenario_name = Column(String, nullable=False)
    parameters = Column(Text, nullable=True)  # JSON string of input parameters
    results = Column(Text, nullable=True)  # JSON string of results
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="simulations")

class AgentDecision(Base):
    __tablename__ = "agent_decisions"
    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String, nullable=False)  # BUY, SELL, REBALANCE, HOLD
    description = Column(Text, nullable=False)
    portfolio_id = Column(Integer, nullable=True)
    reason = Column(Text, nullable=True)
    status = Column(String, default="Executed")  # Executed, Pending, Rejected
    created_at = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String, nullable=False)  # MARKET, RISK, SYSTEM
    message = Column(Text, nullable=False)
    severity = Column(String, default="INFO")  # INFO, WARNING, CRITICAL
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="alerts")

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # PDF, Excel
    data = Column(Text, nullable=True)  # JSON or summary text
    file_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reports")

class ImageAnalysis(Base):
    __tablename__ = "image_analyses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String, nullable=True)          # original uploaded filename
    area_type = Column(String, nullable=False)         # 'Urban' or 'Rural'
    suitability_verdict = Column(Text, nullable=False)
    development_rating = Column(Float, default=0.0)
    vegetation_density = Column(Float, default=0.0)
    infrastructure_score = Column(Float, default=0.0)
    roads_detected = Column(Boolean, default=False)
    facilities_detected = Column(Boolean, default=False)
    disaster_risk_score = Column(Float, default=0.0)
    disaster_risk_level = Column(String, nullable=True)
    avg_profit_pct = Column(Float, default=0.0)
    avg_loss_pct = Column(Float, default=0.0)
    net_outlook = Column(String, nullable=True)       # 'Profitable' or 'At Risk'
    forecast_json = Column(Text, nullable=True)       # full forecast JSON blob
    status = Column(String, default="Successful Analysis")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="image_analyses")

class ModelMetric(Base):
    """
    Stores training/evaluation metrics for both ML and DL models.
    Recorded each time a model is trained or re-evaluated.
    """
    __tablename__ = "model_metrics"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, nullable=False)       # e.g. 'ANN_Valuation', 'LSTM_Market'
    model_type = Column(String, nullable=False)       # 'ML' or 'DL'
    metric_type = Column(String, nullable=False)      # 'MAE', 'RMSE', 'R2', 'Accuracy'
    metric_value = Column(Float, nullable=False)
    dataset_size = Column(Integer, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)

class HybridPrediction(Base):
    """
    Audit log of every hybrid prediction call — stores ML, DL, and final combined values.
    """
    __tablename__ = "hybrid_predictions"
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True)
    prediction_type = Column(String, nullable=False)  # 'valuation', 'market', 'sentiment'
    ml_value = Column(Float, nullable=True)           # ML model output
    dl_value = Column(Float, nullable=True)           # DL model output
    hybrid_value = Column(Float, nullable=True)       # Weighted combined output
    ml_weight = Column(Float, default=0.4)            # Weight given to ML
    dl_weight = Column(Float, default=0.6)            # Weight given to DL
    input_features = Column(Text, nullable=True)      # JSON of input features used
    metrics_json = Column(Text, nullable=True)        # JSON of comparison metrics
    created_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Run automatic ALTER TABLE to add new columns to existing SQLite tables
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    
    # --- Properties table migrations ---
    columns = [c["name"] for c in inspector.get_columns("properties")]
    with engine.connect() as conn:
        if "property_type" not in columns:
            conn.execute(text("ALTER TABLE properties ADD COLUMN property_type VARCHAR DEFAULT 'Houses (single-family, townhouses)'"))
        if "extra_details" not in columns:
            conn.execute(text("ALTER TABLE properties ADD COLUMN extra_details TEXT"))
        if "hold_years" not in columns:
            conn.execute(text("ALTER TABLE properties ADD COLUMN hold_years INTEGER DEFAULT 1"))
        if "projected_price" not in columns:
            conn.execute(text("ALTER TABLE properties ADD COLUMN projected_price FLOAT"))
        conn.commit()

    # --- Image analyses table migrations ---
    # Check if table exists first
    existing_tables = inspector.get_table_names()
    if "image_analyses" in existing_tables:
        img_columns = [c["name"] for c in inspector.get_columns("image_analyses")]
        with engine.connect() as conn:
            if "user_id" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN user_id INTEGER REFERENCES users(id)"))
            if "filename" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN filename VARCHAR"))
            if "area_type" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN area_type VARCHAR NOT NULL DEFAULT 'Unknown'"))
            if "suitability_verdict" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN suitability_verdict TEXT NOT NULL DEFAULT ''"))
            if "development_rating" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN development_rating FLOAT DEFAULT 0.0"))
            if "vegetation_density" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN vegetation_density FLOAT DEFAULT 0.0"))
            if "infrastructure_score" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN infrastructure_score FLOAT DEFAULT 0.0"))
            if "roads_detected" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN roads_detected BOOLEAN DEFAULT 0"))
            if "facilities_detected" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN facilities_detected BOOLEAN DEFAULT 0"))
            if "disaster_risk_score" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN disaster_risk_score FLOAT DEFAULT 0.0"))
            if "disaster_risk_level" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN disaster_risk_level VARCHAR"))
            if "avg_profit_pct" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN avg_profit_pct FLOAT DEFAULT 0.0"))
            if "avg_loss_pct" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN avg_loss_pct FLOAT DEFAULT 0.0"))
            if "net_outlook" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN net_outlook VARCHAR"))
            if "forecast_json" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN forecast_json TEXT"))
            if "status" not in img_columns:
                conn.execute(text("ALTER TABLE image_analyses ADD COLUMN status VARCHAR DEFAULT 'Successful Analysis'"))
            conn.commit()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

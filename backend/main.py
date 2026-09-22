import os

# Absolute base directory (workspace root = one level up from backend/)
_BASE_DIR = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
_FRONTEND_DIR = os.path.join(_BASE_DIR, "frontend")
_UPLOADS_DIR  = os.path.join(_BASE_DIR, "uploads")
_REPORTS_DIR  = os.path.join(_FRONTEND_DIR, "reports")
import json
import csv
import io
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import init_db, get_db, User, Property, Transaction, MarketData, SentimentAnalysis, Portfolio, Simulation, AgentDecision, Alert, Report, ImageAnalysis
from auth import get_current_user, get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token, RoleChecker
from ml_models.valuation import valuation_model
from ml_models.market import market_forecast_model
from ml_models.sentiment import sentiment_model
from ml_models.simulation import scenario_simulator
from ml_models.agent import portfolio_rl_agent
from dl_models.image_valuation import image_valuation_model
from analytics import (
    get_comparable_properties,
    calculate_investment_score,
    calculate_comprehensive_risk,
    generate_timeline_forecast,
    calculate_investment_pnl,
    evaluate_scenarios,
    get_sentiment_feed,
    get_model_metrics
)

# Project Reorganization Comments:
# - Frontend: Located in the "/frontend" folder relative to the workspace root.
# - Backend: Located in the "/backend" folder (includes main.py, auth.py, database.py, and ml_models).
# - Database: Database files are separated into the "/database" folder.
# - Datasets: Dataset files are separated into the "/datasets" folder.

# Create directory structures if not exists
os.makedirs(_FRONTEND_DIR, exist_ok=True)
os.makedirs(_REPORTS_DIR, exist_ok=True)
os.makedirs(_UPLOADS_DIR, exist_ok=True)

# Initialize database
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-populate some baseline market data if DB is empty
    db = next(get_db())
    if db.query(MarketData).count() == 0:
        for offset, val in enumerate([4780.50, 4805.20, 4790.80, 4810.00, 4825.40]):
            db.add(MarketData(
                date=datetime.now(),
                index_name="S&P500",
                value=val,
                volatility=12.5,
                source="Federal Reserve Bank"
            ))
        # Seed an admin user
        admin_exists = db.query(User).filter(User.email == "admin@smartinvest.ai").first()
        if not admin_exists:
            db.add(User(
                email="admin@smartinvest.ai",
                password_hash=get_password_hash("AdminPass123!"),
                full_name="Smart Invest Admin",
                role="Admin"
            ))
        db.commit()
    
    # Start WebSocket live ticker loop
    task = asyncio.create_task(live_market_ticker())
    yield
    task.cancel()

app = FastAPI(title="Smart Invest - Automated Financial Risk Management Platform", lifespan=lifespan)

# CORS Configuration — allow all localhost ports + file:// for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080", "http://127.0.0.1:8080",
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:5500", "http://127.0.0.1:5500",
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:8000", "http://127.0.0.1:8000",
        "http://localhost",      "http://127.0.0.1",
        "null",  # file:// origins appear as 'null'
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- WEBSOCKET CONNECTION MANAGER -----------------
# Country-specific Estate Price Index base values
COUNTRY_INDEX_BASE = {
    "India":          {"base": 285.5,  "currency": "INR"},
    "United States":  {"base": 412.8,  "currency": "USD"},
    "United Kingdom": {"base": 520.3,  "currency": "GBP"},
    "United Arab Emirates": {"base": 368.1, "currency": "AED"},
    "Canada":         {"base": 395.4,  "currency": "CAD"},
    "Australia":      {"base": 478.2,  "currency": "AUD"},
    "Germany":        {"base": 310.6,  "currency": "EUR"},
    "France":         {"base": 330.9,  "currency": "EUR"},
    "Singapore":      {"base": 445.7,  "currency": "SGD"},
    "Japan":          {"base": 298.3,  "currency": "JPY"},
}
DEFAULT_INDEX = {"base": 350.0, "currency": "USD"}

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {
            "notifications": [],
            "market": [],
            "chat": []
        }
        # Maps websocket -> country string for market channel
        self.market_countries: dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, channel: str, country: str = "India"):
        await websocket.accept()
        self.active_connections[channel].append(websocket)
        if channel == "market":
            self.market_countries[websocket] = country

    def disconnect(self, websocket: WebSocket, channel: str):
        if websocket in self.active_connections[channel]:
            self.active_connections[channel].remove(websocket)
        if channel == "market" and websocket in self.market_countries:
            del self.market_countries[websocket]

    async def broadcast(self, message: dict, channel: str):
        for connection in self.active_connections[channel]:
            try:
                await connection.send_json(message)
            except Exception:
                pass

    async def broadcast_market_ticker(self):
        """Send each market client a country-specific Estate Price Index update."""
        dead = []
        for ws in list(self.active_connections["market"]):
            try:
                country = self.market_countries.get(ws, "India")
                cfg = COUNTRY_INDEX_BASE.get(country, DEFAULT_INDEX)
                base = cfg["base"]
                change = round(random_walk(-0.5, 0.5), 2)
                value = round(base + random_walk(-0.3, 0.3), 2)
                payload = {
                    "timestamp": datetime.now().isoformat(),
                    "indices": [
                        {
                            "name": f"{country} Estate Price Index",
                            "value": value,
                            "change": change
                        }
                    ]
                }
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            if ws in self.active_connections["market"]:
                self.active_connections["market"].remove(ws)
            if ws in self.market_countries:
                del self.market_countries[ws]

manager = ConnectionManager()

# Background task for live market updates over WebSockets
async def live_market_ticker():
    while True:
        try:
            await manager.broadcast_market_ticker()
        except Exception:
            pass
        await asyncio.sleep(4.0)

def random_walk(min_val, max_val):
    import random
    return random.uniform(min_val, max_val)

# Startup logic is now in the lifespan context manager above

import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("smartinvest")

# ----------------- HEALTH CHECK -----------------
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Lightweight endpoint used by the frontend to verify backend connectivity."""
    try:
        db.execute(db.bind.text("SELECT 1") if hasattr(db.bind, 'text') else __import__('sqlalchemy').text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        logger.warning(f"Health check DB error: {e}")
        db_status = "degraded"
    return {
        "status": "ok",
        "db": db_status,
        "version": "1.0.0"
    }

# ----------------- AUTHENTICATION ENDPOINTS -----------------
@app.post("/api/auth/register")
def register(email: str = Form(...), password: str = Form(...), full_name: str = Form(...), role: str = Form("User"), db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered.")
    
    new_user = User(
        email=email,
        password_hash=get_password_hash(password),
        full_name=full_name,
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Registration successful", "user": {"email": new_user.email, "full_name": new_user.full_name, "role": new_user.role}}

@app.post("/api/auth/login")
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == username).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token, 
        "token_type": "bearer",
        "user": {"email": user.email, "full_name": user.full_name, "role": user.role}
    }

@app.post("/api/auth/refresh")
def refresh_token(refresh_token: str = Form(...), db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    email = payload.get("sub")
    token_type = payload.get("type")
    
    if token_type != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    new_access = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": new_access, "token_type": "bearer"}

# ----------------- PROPERTY ENDPOINTS -----------------
@app.get("/api/properties")
def get_properties(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Non-admin users see their own, Admin and Managers see all
    if current_user.role in ["Admin", "Manager"]:
        return db.query(Property).all()
    return db.query(Property).filter(Property.user_id == current_user.id).all()

import urllib.request

# OSM type/class strings that indicate a water body
_WATER_CLASSES = {'waterway', 'water'}
_WATER_TYPES   = {
    'water', 'river', 'lake', 'reservoir', 'sea', 'ocean', 'canal',
    'stream', 'wetland', 'water body', 'coastline', 'bay', 'wetlands',
    'basin', 'pond', 'dam', 'harbour', 'harbor', 'estuary', 'lagoon',
    'oxbow', 'moat', 'ditch', 'drain', 'wadi',
}
# OSM address sub-keys that may carry water-body names
_WATER_ADDRESS_KEYS = {'water', 'natural', 'waterway', 'landuse'}

def validate_land_location_sync(lat: float, lon: float):
    """Reverse-geocode lat/lon and reject water bodies before accepting a land location."""
    if lat is None or lon is None:
        return
        
    # Layer 1: Overpass API (Checks if point is physically inside a water polygon/way)
    try:
        overpass_query = f"""
        [out:json][timeout:5];
        (
          way(around:30,{lat},{lon})[natural~"^(water|wetland|bay|coastline)$"];
          way(around:30,{lat},{lon})[waterway][!tunnel];
          way(around:30,{lat},{lon})[water];
          way(around:30,{lat},{lon})[landuse~"^(reservoir|basin)$"];
          relation(around:30,{lat},{lon})[natural~"^(water|wetland|bay)$"];
          relation(around:30,{lat},{lon})[waterway];
          relation(around:30,{lat},{lon})[water];
          relation(around:30,{lat},{lon})[landuse~"^(reservoir|basin)$"];
          way(around:5,{lat},{lon})[natural="coastline"];
        );
        out tags;
        """
        import urllib.parse
        data = urllib.parse.urlencode({'data': overpass_query}).encode('utf-8')
        req = urllib.request.Request(
            'https://overpass-api.de/api/interpreter',
            data=data,
            headers={'User-Agent': 'SmartInvest-Backend/1.0'}
        )
        with urllib.request.urlopen(req, timeout=6.0) as response:
            if response.status == 200:
                res_json = json.loads(response.read().decode())
                for el in res_json.get("elements", []):
                    tags = el.get("tags", {})
                    nat = tags.get("natural", "").lower()
                    ww = tags.get("waterway", "").lower()
                    lu = tags.get("landuse", "").lower()
                    w = tags.get("water", "").lower()
                    
                    is_water = False
                    if nat in ('water', 'wetland', 'bay', 'coastline'): is_water = True
                    elif ww and ww != '': is_water = True
                    elif lu in ('reservoir', 'basin'): is_water = True
                    elif w and w != '': is_water = True
                    
                    if is_water:
                        raise HTTPException(
                            status_code=400,
                            detail="Selected location is a water body. Please select a valid land area."
                        )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Overpass validation failed: {e}")

    # Layer 2: Nominatim fallback
    try:
        url = (
            f"https://nominatim.openstreetmap.org/reverse"
            f"?lat={lat}&lon={lon}&format=json&addressdetails=1"
        )
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'SmartInvest-Backend/1.0', 'Accept-Language': 'en'}
        )
        with urllib.request.urlopen(req, timeout=5.0) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())

                type_str = data.get("type",  "").lower().strip()
                cls_str  = data.get("class", "").lower().strip()

                is_water = (
                    cls_str in _WATER_CLASSES
                    or type_str in _WATER_TYPES
                    or cls_str  in _WATER_TYPES
                )

                # Also inspect the address sub-object for water-related keys
                if not is_water:
                    addr = data.get("address", {})
                    for key in _WATER_ADDRESS_KEYS:
                        val = str(addr.get(key, "")).lower().strip()
                        if val and val in _WATER_TYPES:
                            is_water = True
                            break
                    # Check if any address key itself indicates water
                    for key in addr:
                        if key.lower() in _WATER_ADDRESS_KEYS:
                            is_water = True
                            break

                if is_water:
                    raise HTTPException(
                        status_code=400,
                        detail="Selected location is a water body. Please select a valid land area."
                    )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Reverse geocode validation failed: {e}")

@app.post("/api/properties")
async def create_property(
    address: str = Form(...), 
    sqft: float = Form(...), 
    bedrooms: int = Form(0), 
    bathrooms: float = Form(0.0), 
    year_built: int = Form(2026), 
    actual_price: Optional[float] = Form(None),
    property_type: str = Form("Houses (single-family, townhouses)"),
    extra_details: Optional[str] = Form(None),
    hold_years: int = Form(1),
    unit: str = Form("Sqft"),
    images: Optional[List[UploadFile]] = File(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    google_place_id: Optional[str] = Form(None),
    formatted_address: Optional[str] = Form(None),
    area: Optional[str] = Form(None),
    pincode: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    validate_land_location_sync(latitude, longitude)
    try:
        details = {}
        if extra_details:
            try:
                details = json.loads(extra_details)
            except Exception as parse_err:
                logger.warning(f"extra_details JSON parse error: {parse_err}")

        # Inject lat/lon into details so the land model can use location features
        if latitude is not None:
            details["latitude"] = latitude
        if longitude is not None:
            details["longitude"] = longitude
        if district:
            details.setdefault("district", district)

        # Process images if provided
        if images and len(images) > 0 and images[0].filename != "":
            image_bytes_list = []
            for img in images:
                image_bytes_list.append(await img.read())
            logger.info(f"Analyzing {len(image_bytes_list)} uploaded image(s) for property valuation")
            image_scores = image_valuation_model.analyze_images(image_bytes_list)
            details["image_analysis"] = image_scores

        # Centralized area conversion (canonical constants)
        sqft_for_ml = sqft
        if unit == "Cent":
            sqft_for_ml = sqft * 435.6      # 1 Cent = 435.6 Sqft
        elif unit == "Acre":
            sqft_for_ml = sqft * 43560.0    # 1 Acre = 43,560 Sqft

        pred = valuation_model.predict(sqft_for_ml, bedrooms, bathrooms, year_built, property_type, details, hold_years)
        logger.info(f"Prediction complete for '{address}': ₹{pred.get('predicted_price', 0):,.0f}")

        pred["projected_per_unit"] = round(pred["projected_price"] / max(1, sqft), 2)
        pred["predicted_per_unit"] = round(pred["predicted_price"] / max(1, sqft), 2)
        pred["unit"] = unit
        pred["area_sqft"] = round(sqft_for_ml, 2)
        pred["area_input"] = sqft

        new_prop = Property(
            user_id=current_user.id,
            address=address,
            sqft=sqft,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            year_built=year_built,
            predicted_price=pred["predicted_price"],
            actual_price=actual_price or pred["predicted_price"],
            risk_score=pred["risk_score"],
            property_type=property_type,
            extra_details=extra_details,
            hold_years=hold_years,
            projected_price=pred["projected_price"],
            latitude=latitude,
            longitude=longitude,
            google_place_id=google_place_id,
            formatted_address=formatted_address,
            area=area,
            pincode=pincode,
            state=state,
            district=district
        )
        db.add(new_prop)
        db.commit()
        db.refresh(new_prop)

        # Automatically add to default portfolio
        db.add(Portfolio(
            user_id=current_user.id,
            property_id=new_prop.id,
            allocation=20.0,
            entry_price=new_prop.actual_price,
            current_price=new_prop.actual_price
        ))
        db.commit()
        logger.info(f"Property saved: id={new_prop.id}, user={current_user.email}")
        return {"message": "Property added successfully", "property": new_prop, "prediction": pred}
    except HTTPException:
        raise
    except ValueError as ve:
        # Land model raises ValueError when insufficient data — surface it cleanly
        logger.warning(f"Prediction validation error: {ve}")
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error(f"create_property failed: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error during property creation: {str(e)}")

@app.post("/api/properties/predict")
async def predict_property_valuation(
    sqft: float = Form(...), 
    bedrooms: int = Form(0), 
    bathrooms: float = Form(0.0), 
    year_built: int = Form(2026),
    property_type: str = Form("Houses (single-family, townhouses)"),
    extra_details: Optional[str] = Form(None),
    unit: str = Form("Sqft"),
    images: Optional[List[UploadFile]] = File(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None)
):
    validate_land_location_sync(latitude, longitude)
    try:
        details = {}
        if extra_details:
            try:
                details = json.loads(extra_details)
            except Exception:
                pass

        # Inject lat/lon into details so the land model can use location features
        if latitude is not None:
            details["latitude"] = latitude
        if longitude is not None:
            details["longitude"] = longitude

        if images and len(images) > 0 and images[0].filename != "":
            image_bytes_list = []
            for img in images:
                image_bytes_list.append(await img.read())
            image_scores = image_valuation_model.analyze_images(image_bytes_list)
            details["image_analysis"] = image_scores

        # Centralized area conversion (canonical constants)
        sqft_for_ml = sqft
        if unit == "Cent":
            sqft_for_ml = sqft * 435.6      # 1 Cent = 435.6 Sqft
        elif unit == "Acre":
            sqft_for_ml = sqft * 43560.0    # 1 Acre = 43,560 Sqft

        pred = valuation_model.predict(sqft_for_ml, bedrooms, bathrooms, year_built, property_type, details)
        pred["projected_per_unit"] = round(pred.get("projected_price", pred["predicted_price"]) / max(1, sqft), 2)
        pred["predicted_per_unit"] = round(pred["predicted_price"] / max(1, sqft), 2)
        pred["unit"] = unit
        pred["area_sqft"] = round(sqft_for_ml, 2)
        pred["area_input"] = sqft

        # Decision-Support Analytics Pipeline Enrichment
        district = details.get("district") or details.get("city") or "Coimbatore"
        state = details.get("state") or "Tamil Nadu"
        asking_price = details.get("asking_price") or details.get("price") or pred["predicted_price"]
        road_access = details.get("road_access", "Paved")
        utilities_avail = details.get("utilities_available", True)
        if isinstance(utilities_avail, str):
            utilities_avail = utilities_avail.lower() in ["true", "1", "yes"]

        # 1. Real comparable properties from realistic dataset
        pred["comparables"] = get_comparable_properties(
            district=district,
            property_type=property_type,
            area_sqft=sqft_for_ml,
            user_price=float(asking_price) if asking_price else pred["predicted_price"],
            limit=6
        )

        # 2. Comprehensive natural disaster & financial risk
        pred["comprehensive_risk"] = calculate_comprehensive_risk(
            district=district,
            state=state,
            latitude=latitude,
            longitude=longitude,
            property_type=property_type,
            age_of_property=max(0, datetime.now().year - year_built)
        )
        comp_risk_score = pred["comprehensive_risk"].get("composite_risk_score", pred.get("risk_score", 25.0))

        # 3. Transparent 6-factor investment analysis score
        pred["investment_score"] = calculate_investment_score(
            asking_price=float(asking_price) if asking_price else pred["predicted_price"],
            fair_value=pred["predicted_price"],
            location_score=pred.get("location_score", 72.0),
            demand_score=pred.get("demand_score", 68.0),
            road_access=road_access,
            utilities_available=utilities_avail,
            risk_score=comp_risk_score,
            sentiment_score=0.32,
            roi_percentage=pred.get("roi_percentage", 9.5)
        )

        # 4. Timeline forecast (2022 to 2027)
        growth_rate = pred.get("appreciation_rate", 7.5)
        pred["timeline_forecast"] = generate_timeline_forecast(
            fair_value=pred["predicted_price"],
            annual_growth_rate=growth_rate
        )

        # 5. P&L investment calculator defaults
        pred["pnl_summary"] = calculate_investment_pnl(
            purchase_price=float(asking_price) if asking_price else pred["predicted_price"],
            holding_period_years=details.get("hold_years", 5),
            annual_growth_rate=growth_rate,
            risk_score=comp_risk_score
        )

        # 6. What-if scenario sensitivity test
        pred["scenarios"] = evaluate_scenarios(
            base_price=pred["predicted_price"],
            base_return=pred.get("roi_percentage", 8.5),
            base_risk=comp_risk_score
        )

        return pred
    except HTTPException:
        raise
    except ValueError as ve:
        # Land model raises ValueError when insufficient data — surface it cleanly
        logger.warning(f"Prediction validation error: {ve}")
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error(f"predict_property_valuation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/api/properties/suggest-locations")
def suggest_locations(query: str = ""):
    import pandas as pd
    from ml_models.valuation import DATASET_PATH, REALISTIC_DATASET_PATH
    if not query or len(query.strip()) < 2:
        return []
    
    q = query.lower().strip()
    suggestions = []
    
    # 1. Search smart_invest_realistic_dataset.csv districts first
    if os.path.exists(REALISTIC_DATASET_PATH):
        try:
            df_real = pd.read_csv(REALISTIC_DATASET_PATH, usecols=["district"]).dropna()
            matches = df_real[df_real["district"].str.lower().str.contains(q, na=False)]["district"].unique().tolist()
            suggestions.extend([m.title() for m in matches])
        except Exception:
            pass

    # 2. Also search world_real_estate_data.csv locations
    if len(suggestions) < 15 and os.path.exists(DATASET_PATH):
        try:
            df_world = pd.read_csv(DATASET_PATH, usecols=["location"]).dropna()
            matches_world = df_world[df_world["location"].str.lower().str.contains(q, na=False)]["location"].unique()[:15].tolist()
            for m in matches_world:
                if m not in suggestions:
                    suggestions.append(m)
        except Exception:
            pass
            
    return suggestions[:15]

@app.post("/api/properties/upload")
def bulk_upload_properties(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        content = file.file.read().decode("utf-8")
        reader = csv.reader(io.StringIO(content))
        header = next(reader)
        
        # Validate headers roughly
        header_normalized = [h.strip().lower() for h in header]
        
        properties_added = 0
        for row in reader:
            if not row or len(row) < 5:
                continue
            address = row[0].strip()
            sqft = float(row[1].strip())
            bedrooms = int(row[2].strip())
            bathrooms = float(row[3].strip())
            year_built = int(row[4].strip())
            actual_price = float(row[5].strip()) if len(row) > 5 else None

            # ML valuation
            pred = valuation_model.predict(sqft, bedrooms, bathrooms, year_built)
            new_prop = Property(
                user_id=current_user.id,
                address=address,
                sqft=sqft,
                bedrooms=bedrooms,
                bathrooms=bathrooms,
                year_built=year_built,
                predicted_price=pred["predicted_price"],
                actual_price=actual_price or pred["predicted_price"],
                risk_score=pred["risk_score"]
            )
            db.add(new_prop)
            db.commit()

            # Add to portfolio
            db.add(Portfolio(
                user_id=current_user.id,
                property_id=new_prop.id,
                allocation=10.0,
                entry_price=new_prop.actual_price,
                current_price=new_prop.actual_price
            ))
            db.commit()
            properties_added += 1

        return {"status": "Success", "properties_added": properties_added}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")

@app.delete("/api/properties/{property_id}")
def delete_property(property_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.user_id != current_user.id and current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(prop)
    db.commit()
    return {"message": "Property deleted successfully"}

# ----------------- MARKET ENDPOINTS -----------------
@app.get("/api/market/trends")
def get_market_trends():
    # Return 30 days history and 15 days forecast
    data = market_forecast_model.get_forecast()
    data["datasets_integrated"] = [
        {"name": "Smart Invest Realistic Dataset", "records": 25000, "role": "Primary Domestic Land & Property Engine"},
        {"name": "Dedicated Land Dataset", "records": 500, "role": "Spatial Parcel Coordinates"},
        {"name": "Global Real Estate Dataset", "records": 147000, "role": "International Benchmark"}
    ]
    if hasattr(valuation_model, "realistic_model") and valuation_model.realistic_model.market_stats:
        ds = valuation_model.realistic_model.market_stats.get("district", {})
        top_districts = []
        for dist, st in sorted(ds.items(), key=lambda x: x[1].get("median_roi", 0), reverse=True)[:10]:
            top_districts.append({
                "district": dist.title(),
                "median_price_per_sqft": round(st.get("median_price", 0), 2),
                "median_roi_pct": round(st.get("median_roi", 0), 2),
                "demand_score": round(st.get("median_demand", 0), 1),
                "trend": st.get("trend", "Increasing")
            })
        data["district_insights"] = top_districts
    return data

@app.post("/api/market/analyze-image")
async def analyze_satellite_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        content = await file.read()
        logger.info(f"Satellite image analysis started: {file.filename}, size={len(content)} bytes, user={current_user.email}")
        res = market_forecast_model.analyze_satellite_image(content)

        # Persist the result to the database
        record = ImageAnalysis(
            user_id=current_user.id,
            filename=file.filename or "unknown",
            area_type=res.get("area_type", "Unknown"),
            suitability_verdict=res.get("suitability_verdict", ""),
            development_rating=res.get("development_rating", 0.0),
            vegetation_density=res.get("vegetation_density", 0.0),
            infrastructure_score=res.get("infrastructure_score", 0.0),
            roads_detected=bool(res.get("roads_detected", False)),
            facilities_detected=bool(res.get("facilities_detected", False)),
            disaster_risk_score=res.get("disaster_risk_score", 0.0),
            disaster_risk_level=res.get("disaster_risk_level", ""),
            avg_profit_pct=res.get("forecast", {}).get("avg_profit_pct", 0.0),
            avg_loss_pct=res.get("forecast", {}).get("avg_loss_pct", 0.0),
            net_outlook=res.get("forecast", {}).get("net_outlook", ""),
            forecast_json=json.dumps(res.get("forecast", {})),
            status=res.get("status", "Successful Analysis")
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        res["id"] = record.id
        res["created_at"] = record.created_at.isoformat()
        logger.info(f"Satellite analysis saved: id={record.id}")
        return res
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"analyze_satellite_image failed: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to analyze image: {str(e)}")

@app.get("/api/market/image-analyses")
def get_image_analyses(limit: int = 20, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the last `limit` image analysis records for current user, newest first."""
    records = db.query(ImageAnalysis).filter(ImageAnalysis.user_id == current_user.id).order_by(ImageAnalysis.created_at.desc()).limit(limit).all()
    result = []
    for r in records:
        result.append({
            "id": r.id,
            "filename": r.filename,
            "area_type": r.area_type,
            "suitability_verdict": r.suitability_verdict,
            "development_rating": r.development_rating,
            "vegetation_density": r.vegetation_density,
            "infrastructure_score": r.infrastructure_score,
            "roads_detected": r.roads_detected,
            "facilities_detected": r.facilities_detected,
            "disaster_risk_score": r.disaster_risk_score,
            "disaster_risk_level": r.disaster_risk_level,
            "avg_profit_pct": r.avg_profit_pct,
            "avg_loss_pct": r.avg_loss_pct,
            "net_outlook": r.net_outlook,
            "forecast": json.loads(r.forecast_json) if r.forecast_json else {},
            "status": r.status,
            "created_at": r.created_at.isoformat()
        })
    return result

@app.delete("/api/market/image-analyses")
def clear_image_analyses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete all image analysis records for current user."""
    deleted = db.query(ImageAnalysis).filter(ImageAnalysis.user_id == current_user.id).delete()
    db.commit()
    return {"deleted": deleted}

# ----------------- SENTIMENT ENDPOINTS -----------------
@app.post("/api/sentiment/analyze")
def analyze_sentiment(text: str = Form(...), db: Session = Depends(get_db)):
    res = sentiment_model.analyze_text(text)
    
    # Save to database
    db_sentiment = SentimentAnalysis(
        text=text[:1000],
        sentiment_score=res["score"],
        entities=json.dumps(res["entities"]),
        confidence=res["confidence"]
    )
    db.add(db_sentiment)
    db.commit()
    return res

@app.post("/api/sentiment/url")
def analyze_sentiment_url(url: str = Form(...), db: Session = Depends(get_db)):
    res = sentiment_model.analyze_url(url)
    
    db_sentiment = SentimentAnalysis(
        text=f"URL: {url} | Title: {res.get('title', 'Unreachable link')}",
        sentiment_score=res["score"],
        entities=json.dumps(res["entities"]),
        confidence=res["confidence"]
    )
    db.add(db_sentiment)
    db.commit()
    return res

@app.get("/api/sentiment/history")
def get_sentiment_history(db: Session = Depends(get_db)):
    items = db.query(SentimentAnalysis).order_by(SentimentAnalysis.created_at.desc()).limit(20).all()
    results = []
    for item in items:
        results.append({
            "id": item.id,
            "text": item.text,
            "sentiment_score": item.sentiment_score,
            "entities": json.loads(item.entities or "[]"),
            "confidence": item.confidence,
            "created_at": item.created_at.isoformat()
        })
    return results

# ----------------- ASSISTANT / CHAT ENDPOINTS -----------------
@app.post("/api/assistant/chat")
def assistant_chat(message: str = Form(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Standard rule/context-based real estate advisory chatbot responses
    user_message = message.lower()
    
    # Calculate current portfolio average metrics for context
    properties = db.query(Property).filter(Property.user_id == current_user.id).all()
    total_val = sum(p.actual_price for p in properties) if properties else 0.0
    avg_risk = sum(p.risk_score for p in properties) / len(properties) if properties else 0.0

    confidence = 0.85
    if "risk" in user_message:
        reply = (f"Currently, your portfolio has an average risk score of {avg_risk:.1f}% across {len(properties)} properties. "
                 "To reduce overall risk, you should consider rebalancing into newer constructed properties (built after 2015) "
                 "or commercial-grade units with stable yields.")
    elif "rebalance" in user_message or "strategy" in user_message:
        reply = ("I recommend using our RL Portfolio Rebalancing Agent. The agent is trained to optimize asset allocations "
                 "by moving weights away from older properties that carry high maintenance and depreciation risks, "
                 "and reallocating them towards high-growth indices.")
    elif "market" in user_message or "forecast" in user_message:
        reply = ("Our LSTM model predicts a slight upward correction of +3.5% over the next 15 days for residential properties. "
                 "However, economic indicators show minor volatility. Watch the Volatility Index panel on your dashboard.")
    else:
        reply = ("Hello! I am your Smart Invest Advisor. I can help you evaluate property prices, generate comprehensive risk reports, "
                 "rebalance your portfolio allocations, or explain economic scenario simulation results. What would you like to discuss today?")
        confidence = 0.90

    return {
        "reply": reply,
        "confidence": confidence,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/assistant/summarize")
def assistant_summarize_doc(file: UploadFile = File(...)):
    try:
        content = file.file.read().decode("utf-8", errors="ignore")
        # Extract simple summary sentences
        lines = [line.strip() for line in content.split("\n") if len(line.strip()) > 30]
        summary_sentences = lines[:4] if len(lines) > 4 else lines
        summary_text = " ".join(summary_sentences) if summary_sentences else "Document does not contain substantial readable text lines."
        
        return {
            "filename": file.filename,
            "summary": summary_text,
            "confidence": 0.92,
            "details": {
                "characters": len(content),
                "key_highlights": ["Extracted value estimates", "Scanned risk notes"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Summarization error: {str(e)}")

# ----------------- SCENARIO SIMULATIONS ENDPOINTS -----------------
@app.post("/api/simulations/run")
def run_simulation(
    scenario_type: str = Form(...), 
    severity: str = Form(...), 
    rate_change: float = Form(0.0), 
    duration_months: int = Form(12),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    res = scenario_simulator.run_simulation(scenario_type, severity, rate_change, duration_months)
    
    # Save simulation results
    db_sim = Simulation(
        user_id=current_user.id,
        scenario_name=scenario_type,
        parameters=json.dumps({"severity": severity, "rate_change": rate_change, "duration_months": duration_months}),
        results=json.dumps(res)
    )
    db.add(db_sim)
    db.commit()
    return res

@app.post("/api/simulations/stress")
def stress_test(
    scenario_type: str = Form(...), 
    severity: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch user's properties
    properties = db.query(Property).filter(Property.user_id == current_user.id).all()
    if not properties:
        raise HTTPException(status_code=400, detail="No properties in portfolio to stress test.")
        
    prop_list = []
    for p in properties:
        prop_list.append({
            "id": p.id,
            "address": p.address,
            "actual_price": p.actual_price,
            "predicted_price": p.predicted_price,
            "risk_score": p.risk_score
        })
        
    res = scenario_simulator.stress_test_portfolio(prop_list, scenario_type, severity)
    return res

# ----------------- PORTFOLIO ENDPOINTS -----------------
@app.get("/api/portfolio")
def get_portfolio(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    portfolio_items = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    
    results = []
    for item in portfolio_items:
        prop = db.query(Property).filter(Property.id == item.property_id).first()
        if prop:
            results.append({
                "id": item.id,
                "property_id": prop.id,
                "address": prop.address,
                "allocation": item.allocation,
                "entry_price": item.entry_price,
                "current_price": item.current_price,
                "property_risk": prop.risk_score
            })
    return results

@app.post("/api/portfolio/rebalance")
def rebalance_portfolio(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    portfolio_items = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    if not portfolio_items:
        raise HTTPException(status_code=400, detail="Portfolio is empty.")

    p_list = []
    for item in portfolio_items:
        prop = db.query(Property).filter(Property.id == item.property_id).first()
        if prop:
            p_list.append({
                "property_id": item.property_id,
                "allocation": item.allocation,
                "entry_price": item.entry_price,
                "current_price": item.current_price,
                "property_risk": prop.risk_score
            })
            
    # Compute using RL agent (assuming neutral sentiment 0.0)
    decision = portfolio_rl_agent.make_decision(p_list, market_sentiment=0.1)
    
    # Save the agent decision to the log table
    db_decision = AgentDecision(
        action_type=decision["action"],
        description=decision["reason"],
        portfolio_id=portfolio_items[0].id if portfolio_items else None,
        reason=f"Risk optimized allocation changes: {json.dumps(decision['rebalancing_suggestions'])}",
        status="Executed"
    )
    db.add(db_decision)
    
    # Apply weights updates
    for item in portfolio_items:
        if str(item.property_id) in decision["rebalancing_suggestions"]:
            item.allocation = decision["rebalancing_suggestions"][str(item.property_id)]
        elif item.property_id in decision["rebalancing_suggestions"]:
             item.allocation = decision["rebalancing_suggestions"][item.property_id]
             
    db.commit()
    
    # Add a alert
    db.add(Alert(
        user_id=current_user.id,
        type="RISK",
        message=f"Agent rebalanced your portfolio using RL model: {decision['action']}.",
        severity="INFO"
    ))
    db.commit()

    return decision

@app.get("/api/portfolio/decisions")
def get_agent_decisions(db: Session = Depends(get_db)):
    decisions = db.query(AgentDecision).order_by(AgentDecision.created_at.desc()).limit(20).all()
    return decisions

# ----------------- REPORTS ENDPOINTS -----------------
@app.get("/api/reports")
def get_reports(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Report).filter(Report.user_id == current_user.id).all()

@app.post("/api/reports/generate")
def generate_report(report_type: str = Form(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Generate custom Excel or PDF files
    properties = db.query(Property).filter(Property.user_id == current_user.id).all()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_name = f"SmartInvest_RiskReport_{timestamp}"
    
    if report_type.upper() == "EXCEL":
        filename = f"{report_name}.xlsx"
        filepath = os.path.join(_REPORTS_DIR, filename)
        
        try:
            import openpyxl
            from openpyxl.styles import Font, Alignment, PatternFill
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Properties Portfolio"
            
            # Setup headers
            headers = ["ID", "Address", "Sqft", "Bedrooms", "Bathrooms", "Year Built", "Predicted Price ($)", "Actual Price ($)", "Risk Score (%)"]
            ws.append(headers)
            
            # Stylize Header
            header_fill = PatternFill(start_color="0A1628", end_color="0A1628", fill_type="solid")
            header_font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
            for col in range(1, 10):
                cell = ws.cell(row=1, column=col)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center")
                
            for p in properties:
                ws.append([p.id, p.address, p.sqft, p.bedrooms, p.bathrooms, p.year_built, p.predicted_price, p.actual_price, p.risk_score])
                
            wb.save(filepath)
        except Exception as e:
            # Fallback text saving if openpyxl isn't available
            with open(filepath, "w") as f:
                f.write(f"Fallback Excel CSV format due to {str(e)}\n")
                f.write("Address,Sqft,Bedrooms,Bathrooms,YearBuilt,Price,Risk\n")
                for p in properties:
                    f.write(f"{p.address},{p.sqft},{p.bedrooms},{p.bathrooms},{p.year_built},{p.actual_price},{p.risk_score}\n")

    else: # PDF
        filename = f"{report_name}.pdf"
        filepath = os.path.join(_REPORTS_DIR, filename)
        
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors
            
            doc = SimpleDocTemplate(filepath, pagesize=letter)
            styles = getSampleStyleSheet()
            
            # Custom Dark theme styles
            title_style = ParagraphStyle(
                'ReportTitle',
                parent=styles['Heading1'],
                fontSize=22,
                leading=26,
                textColor=colors.HexColor('#0A1628'),
                spaceAfter=15
            )
            
            story = []
            story.append(Paragraph("Smart Invest - Automated Financial Risk Management Report", title_style))
            story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            story.append(Paragraph(f"Account: {current_user.full_name} ({current_user.email})", styles['Normal']))
            story.append(Spacer(1, 20))
            
            # Data table
            table_data = [["Address", "Sqft", "Beds/Baths", "Year", "Stated Value", "Risk Score"]]
            for p in properties:
                table_data.append([
                    p.address[:20], 
                    str(p.sqft), 
                    f"{p.bedrooms}/{p.bathrooms}", 
                    str(p.year_built), 
                    f"${p.actual_price:,.2f}", 
                    f"{p.risk_score}%"
                ])
                
            t = Table(table_data)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0A1628')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('BOTTOMPADDING', (0,0), (-1,0), 8),
                ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#F4F6F9'), colors.white])
            ]))
            story.append(t)
            
            doc.build(story)
        except Exception as e:
            # Fallback simple text-based PDF
            with open(filepath, "w") as f:
                f.write(f"Smart Invest Portfolio Risk Report - Fallback PDF Mode\nError details: {str(e)}\n\n")
                for p in properties:
                    f.write(f"Property: {p.address} | Risk: {p.risk_score}%\n")
                    
    # Register report in db
    new_report = Report(
        user_id=current_user.id,
        name=report_name,
        type=report_type.upper(),
        file_url=f"/static/reports/{filename}"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

# ----------------- ALERTS ENDPOINTS -----------------
@app.get("/api/alerts")
def get_alerts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Alert).filter(Alert.user_id == current_user.id).order_by(Alert.created_at.desc()).all()

@app.post("/api/alerts/read/{alert_id}")
def read_alert(alert_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == current_user.id).first()
    if alert:
        alert.is_read = True
        db.commit()
# ----------------- ANALYTICS & DECISION-SUPPORT ENDPOINTS -----------------
@app.post("/api/property/comparables")
@app.get("/api/property/comparables")
async def api_comparables(
    district: str = "Coimbatore",
    property_type: str = "Residential House",
    area_sqft: float = 1500.0,
    asking_price: Optional[float] = None,
    limit: int = 6
):
    """Retrieve comparable properties from realistic dataset."""
    try:
        res = get_comparable_properties(
            district=district,
            property_type=property_type,
            area_sqft=area_sqft,
            user_price=asking_price,
            limit=limit
        )
        return res
    except Exception as e:
        logger.error(f"Error in api_comparables: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/property/score-breakdown")
async def api_score_breakdown(
    asking_price: float = Form(...),
    fair_value: float = Form(...),
    location_score: float = Form(72.0),
    demand_score: float = Form(68.0),
    road_access: str = Form("Paved"),
    utilities_available: bool = Form(True),
    risk_score: float = Form(24.0),
    sentiment_score: float = Form(0.25),
    roi_percentage: float = Form(9.5)
):
    """Calculate transparent 6-factor investment score with full breakdown."""
    try:
        return calculate_investment_score(
            asking_price=asking_price,
            fair_value=fair_value,
            location_score=location_score,
            demand_score=demand_score,
            road_access=road_access,
            utilities_available=utilities_available,
            risk_score=risk_score,
            sentiment_score=sentiment_score,
            roi_percentage=roi_percentage
        )
    except Exception as e:
        logger.error(f"Error in api_score_breakdown: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/risk/comprehensive")
@app.get("/api/risk/comprehensive")
async def api_comprehensive_risk(
    district: str = "Chennai",
    state: str = "Tamil Nadu",
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    property_type: str = "Residential House",
    age_of_property: int = 5
):
    """Calculate natural disaster and financial risk breakdown."""
    try:
        return calculate_comprehensive_risk(
            district=district,
            state=state,
            latitude=latitude,
            longitude=longitude,
            property_type=property_type,
            age_of_property=age_of_property
        )
    except Exception as e:
        logger.error(f"Error in api_comprehensive_risk: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/forecast/timeline")
@app.get("/api/forecast/timeline")
async def api_timeline_forecast(
    fair_value: float = 3500000.0,
    annual_growth_rate: float = 7.5
):
    """Generate 2022-2027 price history and forecast timeline."""
    try:
        return generate_timeline_forecast(
            fair_value=fair_value,
            annual_growth_rate=annual_growth_rate
        )
    except Exception as e:
        logger.error(f"Error in api_timeline_forecast: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/calculator/pnl")
async def api_calculator_pnl(
    purchase_price: float = Form(...),
    registration_cost: Optional[float] = Form(None),
    development_cost: float = Form(0.0),
    other_expenses: float = Form(0.0),
    holding_period_years: int = Form(5),
    annual_growth_rate: float = Form(7.5),
    risk_score: float = Form(24.0)
):
    """Calculate P&L, ROI, CAGR, break-even, and 12-month expected trend."""
    try:
        return calculate_investment_pnl(
            purchase_price=purchase_price,
            registration_cost=registration_cost,
            development_cost=development_cost,
            other_expenses=other_expenses,
            holding_period_years=holding_period_years,
            annual_growth_rate=annual_growth_rate,
            risk_score=risk_score
        )
    except Exception as e:
        logger.error(f"Error in api_calculator_pnl: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scenarios/evaluate")
async def api_evaluate_scenarios(
    base_price: float = Form(...),
    base_return: float = Form(8.5),
    base_risk: float = Form(24.0)
):
    """Evaluate 8 dynamic real estate stress scenarios."""
    try:
        return evaluate_scenarios(
            base_price=base_price,
            base_return=base_return,
            base_risk=base_risk
        )
    except Exception as e:
        logger.error(f"Error in api_evaluate_scenarios: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sentiment/feed")
async def api_sentiment_feed():
    """Return NLP sentiment distribution and curated financial news."""
    try:
        return get_sentiment_feed()
    except Exception as e:
        logger.error(f"Error in api_sentiment_feed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models/metrics")
async def api_model_metrics():
    """Return MAE, RMSE, R², MAPE, and dataset statistics for technical review."""
    try:
        return get_model_metrics()
    except Exception as e:
        logger.error(f"Error in api_model_metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- WEBSOCKET ENDPOINTS -----------------
@app.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    await manager.connect(websocket, "notifications")
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "notifications")

@app.websocket("/ws/market")
async def websocket_market(websocket: WebSocket, country: str = "India"):
    await manager.connect(websocket, "market", country=country)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "market")

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await manager.connect(websocket, "chat")
    try:
        while True:
            msg = await websocket.receive_text()
            # Respond with standard response
            reply = {
                "reply": f"Understood. We are analyzing the parameter context. Real-time index feed active.",
                "timestamp": datetime.now().isoformat()
            }
            await websocket.send_json(reply)
    except WebSocketDisconnect:
        manager.disconnect(websocket, "chat")

# Serve the static UI files from the separated frontend folder
app.mount("/static", StaticFiles(directory=_FRONTEND_DIR), name="static")
app.mount("/", StaticFiles(directory=_FRONTEND_DIR, html=True), name="static_root")

if __name__ == "__main__":
    import uvicorn
    # Use environment port or default
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

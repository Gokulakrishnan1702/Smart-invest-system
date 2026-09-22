import sys
sys.path.insert(0, 'backend')
from ml_models.valuation import land_valuation_model as lm

print('Model ready:', lm.land_model_ready)
print()

# Test different property types
tests = [
    {'name': 'Urban Commercial Chennai',      'details': {'location_type': 'Urban', 'land_type': 'Commercial Plot', 'road_access': 'yes', 'utilities_available': 'yes', 'district': 'Chennai'}},
    {'name': 'Rural Agricultural Erode',      'details': {'location_type': 'Rural', 'land_type': 'Agricultural', 'road_access': 'no', 'utilities_available': 'no', 'district': 'Erode'}},
    {'name': 'Semi-Urban Residential Coim',   'details': {'location_type': 'Semi-Urban', 'land_type': 'Residential Plot', 'road_access': 'yes', 'utilities_available': 'yes', 'district': 'Coimbatore'}},
    {'name': 'Commercial Industrial Blr',     'details': {'location_type': 'Commercial', 'land_type': 'Industrial', 'road_access': 'yes', 'utilities_available': 'yes', 'district': 'Bangalore'}},
    {'name': 'Rural Vacant No Infra',         'details': {'location_type': 'Rural', 'land_type': 'Vacant', 'road_access': 'no', 'utilities_available': 'no', 'district': 'Tirunelveli'}},
    {'name': 'Urban Development Bangalore',   'details': {'location_type': 'Urban', 'land_type': 'Development', 'road_access': 'yes', 'utilities_available': 'yes', 'district': 'Bangalore'}},
    {'name': 'Semi-Urban Agri Road YES',      'details': {'location_type': 'Semi-Urban', 'land_type': 'Agricultural', 'road_access': 'yes', 'utilities_available': 'yes', 'district': 'Salem'}},
    {'name': 'Semi-Urban Agri Road NO',       'details': {'location_type': 'Semi-Urban', 'land_type': 'Agricultural', 'road_access': 'no', 'utilities_available': 'no', 'district': 'Salem'}},
    {'name': 'Urban Residential Chennai',     'details': {'location_type': 'Urban', 'land_type': 'Residential Plot', 'road_access': 'yes', 'utilities_available': 'yes', 'district': 'Chennai'}},
    {'name': 'Unknown district',              'details': {'location_type': 'Urban', 'land_type': 'Residential Plot', 'road_access': 'yes', 'utilities_available': 'yes', 'district': 'XYZ_Unknown'}},
]

for t in tests:
    try:
        result = lm.predict(5000, t['details'], 5)
        name = t['name']
        print(f"{name:38s} | invest={result['investment_score']:5.1f} | risk={result['risk_score']:5.1f} | conf={result['confidence']:5.1f} | pps={result['predicted_per_sqft']:8.2f}")
    except Exception as e:
        print(f"{t['name']:38s} | ERROR: {e}")

print()
print("=== Market Stats Summary ===")
ms = lm.market_stats
print(f"Global: p10={ms.get('global_p10',0):.2f}  p25={ms.get('global_p25',0):.2f}  p50={ms.get('global_p50',0):.2f}  p75={ms.get('global_p75',0):.2f}  p90={ms.get('global_p90',0):.2f}")
print(f"Road ratio: {ms.get('road_ratio',0):.3f}  Util ratio: {ms.get('util_ratio',0):.3f}")
print(f"Location types: {ms.get('location_type',{})}")
print(f"Land types: {ms.get('land_type',{})}")

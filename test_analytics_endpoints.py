import requests
import json

BASE = 'http://127.0.0.1:8000'

print("=== TESTING BACKEND ANALYTICAL ENDPOINTS ===")

# 1. Health
r = requests.get(f'{BASE}/health')
print('1. Health:', r.status_code, r.json())

# 2. Comparables
r = requests.get(f'{BASE}/api/property/comparables?district=Coimbatore&property_type=Residential%20House&area_sqft=1500&asking_price=3500000')
print('2. Comparables:', r.status_code, 'Count:', r.json().get('count'), 'Avg sqft:', r.json().get('avg_comparable_price_sqft'))

# 3. Score Breakdown
r = requests.post(f'{BASE}/api/property/score-breakdown', data={'asking_price': 3000000, 'fair_value': 3240000})
print('3. Score Breakdown:', r.status_code, 'Overall score:', r.json().get('overall_score'), r.json().get('verdict'))

# 4. Comprehensive Risk
r = requests.get(f'{BASE}/api/risk/comprehensive?district=Chennai&state=Tamil%20Nadu')
print('4. Risk:', r.status_code, 'Risk level:', r.json().get('overall_risk_level'), r.json().get('composite_risk_score'))

# 5. Timeline Forecast
r = requests.get(f'{BASE}/api/forecast/timeline?fair_value=3240000')
print('5. Forecast:', r.status_code, 'Points:', len(r.json().get('timeline', [])))

# 6. PnL Calculator
r = requests.post(f'{BASE}/api/calculator/pnl', data={'purchase_price': 3000000, 'holding_period_years': 5})
print('6. PnL:', r.status_code, 'Total investment:', r.json().get('total_investment'), 'ROI %:', r.json().get('roi_percentage'))

# 7. Scenarios
r = requests.post(f'{BASE}/api/scenarios/evaluate', data={'base_price': 3240000, 'base_return': 8.5})
print('7. Scenarios:', r.status_code, 'Scenarios count:', len(r.json().get('scenarios', [])))

# 8. Sentiment Feed
r = requests.get(f'{BASE}/api/sentiment/feed')
print('8. Sentiment:', r.status_code, 'Articles count:', len(r.json().get('articles', [])))

# 9. Model Metrics
r = requests.get(f'{BASE}/api/models/metrics')
print('9. Metrics:', r.status_code, 'Models count:', len(r.json().get('models', [])))

# 10. Predict with full enriched pipeline
r = requests.post(f'{BASE}/api/properties/predict', data={
    'sqft': 1500,
    'bedrooms': 3,
    'bathrooms': 2,
    'year_built': 2020,
    'property_type': 'Houses (single-family, townhouses)',
    'extra_details': json.dumps({
        'country': 'India',
        'state': 'Tamil Nadu',
        'district': 'Coimbatore',
        'road_access': 'Paved',
        'asking_price': 3200000
    })
})
print('10. Full Predict:', r.status_code)
d = r.json()
print('    predicted_price:', d.get('predicted_price'))
print('    investment_score:', d.get('investment_score', {}).get('overall_score'))
print('    comprehensive_risk:', d.get('comprehensive_risk', {}).get('overall_risk_level'))
print('    comparables count:', d.get('comparables', {}).get('count'))
print('    forecast timeline count:', len(d.get('timeline_forecast', {}).get('timeline', [])))
print('    scenarios count:', len(d.get('scenarios', {}).get('scenarios', [])))
print("=== ALL 10 ENDPOINTS SUCCEEDED ===")

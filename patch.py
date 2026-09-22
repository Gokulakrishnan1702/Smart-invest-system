import os

app_js_path = r"C:\Users\ADMIN\New folder\frontend\app.js"
valuation_py_path = r"C:\Users\ADMIN\New folder\backend\ml_models\valuation.py"

# Patch valuation.py
with open(valuation_py_path, 'r', encoding='utf-8') as f:
    val_py = f.read()

# Fix the Land property calculation
# Remove the blending logic that uses the House formula for Land
old_land_logic = """
            cents = sqft / 435.6
            land_baseline_value = cents * base_per_cent
            
            # If we have an ML prediction, blend it, but heavily weight the local rule-based baseline
            predicted_price = (predicted_price * 0.15) + (land_baseline_value * 0.85)
"""
new_land_logic = """
            cents = sqft / 435.6
            # Use strictly the land baseline value for land types, do not blend with house formulas.
            predicted_price = cents * base_per_cent
"""

val_py = val_py.replace(old_land_logic, new_land_logic)

with open(valuation_py_path, 'w', encoding='utf-8') as f:
    f.write(val_py)

# Patch app.js
with open(app_js_path, 'r', encoding='utf-8') as f:
    app_js = f.read()

old_pl_logic = """
    let plHtml = '';
    if (pricePerUnitInput) {
      const enteredPerUnit = parseFloat(pricePerUnitInput);
      const profitLossPerUnit = predictedPerUnit - enteredPerUnit;
      const profitLossTotal = profitLossPerUnit * areaRaw;
      if (profitLossPerUnit > 0) {
        plHtml = `<div style="font-size:1rem;font-weight:600;margin-bottom:1rem;color:var(--success)">Est. Net Profit: +${formatINR(profitLossTotal)} <span style="font-size:0.82rem;font-weight:400">(+${formatINR(profitLossPerUnit, false, 2)}/${displayUnit})</span></div>`;
      } else if (profitLossPerUnit < 0) {
        plHtml = `<div style="font-size:1rem;font-weight:600;margin-bottom:1rem;color:var(--danger)">Est. Net Loss: -${formatINR(Math.abs(profitLossTotal))} <span style="font-size:0.82rem;font-weight:400">(-${formatINR(Math.abs(profitLossPerUnit), false, 2)}/${displayUnit})</span></div>`;
      } else {
        plHtml = `<div style="font-size:1rem;font-weight:600;margin-bottom:1rem;color:var(--text-secondary)">Est. Net Profit/Loss: ₹0</div>`;
      }
    }
"""

new_pl_logic = """
    let plHtml = '';
    if (pricePerUnitInput) {
      const actualPricePerUnit = parseFloat(pricePerUnitInput);
      const totalActualPrice = actualPricePerUnit * areaRaw;
      const totalPredictedPrice = predictedPerUnit * areaRaw;
      
      const profitLossTotal = totalPredictedPrice - totalActualPrice;
      const profitLossPercentage = totalActualPrice > 0 ? (profitLossTotal / totalActualPrice) * 100 : 0;
      
      if (profitLossTotal > 0) {
        plHtml = `<div style="font-size:1rem;font-weight:600;margin-bottom:1rem;color:var(--success)">Est. Net Profit: +${formatINR(profitLossTotal)} <span style="font-size:0.82rem;font-weight:400">(+${profitLossPercentage.toFixed(2)}%)</span></div>`;
      } else if (profitLossTotal < 0) {
        plHtml = `<div style="font-size:1rem;font-weight:600;margin-bottom:1rem;color:var(--danger)">Est. Net Loss: -${formatINR(Math.abs(profitLossTotal))} <span style="font-size:0.82rem;font-weight:400">(${profitLossPercentage.toFixed(2)}%)</span></div>`;
      } else {
        plHtml = `<div style="font-size:1rem;font-weight:600;margin-bottom:1rem;color:var(--text-secondary)">Est. Net Profit/Loss: ₹0</div>`;
      }
    }
"""

# Also fix the dashboard table calculations which may have had issues
old_table_logic = """
      const pricePerSqft = (p.predicted_price || 0) / (p.sqft || 1);
"""
new_table_logic = """
      const pricePerUnit = (p.predicted_price || 0) / (p.sqft || 1);
      const totalActual = (p.actual_price || 0);
      const plTotal = (p.predicted_price || 0) - totalActual;
      const plPercent = totalActual > 0 ? (plTotal / totalActual) * 100 : 0;
"""

app_js = app_js.replace(old_pl_logic, new_pl_logic)

with open(app_js_path, 'w', encoding='utf-8') as f:
    f.write(app_js)

print("Patched successfully")

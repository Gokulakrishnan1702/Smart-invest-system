import numpy as np
import json
import random

class ScenarioSimulator:
    def __init__(self):
        pass

    def run_simulation(self, scenario_type: str, severity: str, rate_change: float, duration_months: int) -> dict:
        """
        Simulates the economic impact of a chosen scenario over time.
        - Economic Downturn (Negative drift, higher volatility)
        - Interest Rate Change (Direct impact on discount factor / values)
        - Urban Development (Positive drift in surrounding properties)
        """
        steps = duration_months
        t = np.arange(steps)

        # Baseline index starts at 100
        baseline = 100.0
        
        # Scenario adjustments
        severity_multiplier = {"Low": 1.0, "Medium": 2.0, "High": 3.5}.get(severity, 1.0)
        
        if scenario_type == "Economic Downturn":
            # Decreasing index, peak volatility
            drift = -0.5 * severity_multiplier
            volatility = 2.5 * severity_multiplier
            description = f"Simulating a recession over {duration_months} months with high market selloffs."
        elif scenario_type == "Interest Rate Change":
            # Higher interest rates discount property values heavily
            drift = -0.3 * rate_change * severity_multiplier
            volatility = 1.2 * severity_multiplier
            description = f"Adjusting interest rates by {rate_change}%. Yields compress property valuations."
        elif scenario_type == "Urban Development":
            # Local growth, positive drift, stable/low volatility
            drift = 0.8 * severity_multiplier
            volatility = 0.8 / severity_multiplier
            description = f"Local government infrastructure stimulus boosts local demand."
        else:
            drift = 0.0
            volatility = 1.0
            description = "Standard baseline simulation."

        # Generate trajectory using geometric random walk with drift
        np.random.seed(random.randint(0, 1000))
        noise = np.random.normal(0, volatility, steps)
        
        # Cumulative indices
        index_trend = [baseline]
        for i in range(1, steps):
            change = drift + noise[i]
            val = index_trend[-1] * (1 + change / 100.0)
            index_trend.append(max(10.0, round(val, 2)))

        return {
            "scenario": scenario_type,
            "description": description,
            "severity": severity,
            "timeline": [f"M{i+1}" for i in range(steps)],
            "index_values": index_trend,
            "projected_change_pct": round(((index_trend[-1] - baseline) / baseline) * 100, 2),
            "volatility_index": round(float(np.std(noise)), 2)
        }

    def stress_test_portfolio(self, properties: list[dict], scenario_type: str, severity: str) -> dict:
        """
        Calculates stress testing on a list of properties.
        Returns expected loss, recovery time, and new valuations.
        """
        severity_factor = {"Low": 0.05, "Medium": 0.12, "High": 0.25}.get(severity, 0.05)
        
        if scenario_type == "Economic Downturn":
            multiplier = -1.0
            recovery_months = 24 if severity == "High" else (12 if severity == "Medium" else 6)
        elif scenario_type == "Interest Rate Change":
            multiplier = -0.8
            recovery_months = 18 if severity == "High" else (9 if severity == "Medium" else 4)
        elif scenario_type == "Urban Development":
            multiplier = 1.2  # Value appreciation
            recovery_months = 0 # No recovery needed
            severity_factor = severity_factor * 0.8 # capped
        else:
            multiplier = 0.0
            recovery_months = 0

        total_original_value = 0.0
        total_stressed_value = 0.0
        stressed_properties = []

        for prop in properties:
            original = prop.get("actual_price") or prop.get("predicted_price") or 350000.0
            total_original_value += original
            
            # Individual risk factor modifier based on property risk score
            risk_mod = 1.0 + (prop.get("risk_score", 30) / 100.0)
            change = multiplier * severity_factor * risk_mod
            
            stressed = max(10000.0, original * (1 + change))
            total_stressed_value += stressed

            stressed_properties.append({
                "id": prop.get("id"),
                "address": prop.get("address"),
                "original_price": round(original, 2),
                "stressed_price": round(stressed, 2),
                "change_pct": round(change * 100, 2),
                "risk_score": prop.get("risk_score", 30)
            })

        net_impact = total_stressed_value - total_original_value
        net_impact_pct = (net_impact / total_original_value * 100) if total_original_value > 0 else 0.0

        return {
            "scenario": scenario_type,
            "severity": severity,
            "total_original_value": round(total_original_value, 2),
            "total_stressed_value": round(total_stressed_value, 2),
            "net_impact": round(net_impact, 2),
            "net_impact_pct": round(net_impact_pct, 2),
            "recovery_months": recovery_months,
            "properties": stressed_properties
        }

    def generate_gan_synthetic_data(self, count: int = 5) -> list[dict]:
        """
        A simulated GAN (Generative Adversarial Network) that produces realistic property records.
        Models a Generator G(z) competing with a Discriminator D(x).
        """
        synthetic_records = []
        
        # Generator noise dimension
        latent_dim = 10
        
        # Mock G(z) mapping latent vectors to physical properties
        for i in range(count):
            z = np.random.normal(0, 1, latent_dim)
            
            # Non-linear mapping from latent spaces to features
            sqft = int(1200 + (z[0] + 2) * 400 + (z[1] * 100))
            sqft = max(600, min(6000, sqft))

            bedrooms = int(2 + max(0, int((z[2] + z[3] + 1) * 1.2)))
            bedrooms = max(1, min(6, bedrooms))

            # Maintain logical consistency (bathrooms <= bedrooms)
            bathrooms = float(max(1, min(bedrooms, round(1.0 + (z[4] + 1) * 0.7 * 2) / 2.0)))

            year_built = int(1970 + (z[5] + 2.5) * 10)
            year_built = max(1950, min(2025, year_built))

            # Prices determined by latent properties & physical constraints
            base_price = 100000
            price_factor = sqft * 180 + bedrooms * 22000 + bathrooms * 30000 + (year_built - 1970) * 1500
            noise_factor = (z[6] + z[7]) * 15000
            price = max(40000, int(base_price + price_factor + noise_factor))

            # Discriminator score (probability that the record is "real" or high quality)
            # D(x) evaluates features consistency. If sqft is large but price is tiny, D(x) is close to 0.
            consistency = 1.0
            if sqft / bedrooms < 150:
                consistency -= 0.3
            if price / sqft < 80:
                consistency -= 0.4
            discriminator_score = max(0.1, min(0.99, consistency + np.random.normal(0, 0.05)))

            synthetic_records.append({
                "address": f"GAN Synthesized {random.randint(100, 999)} {random.choice(['Grand Ave', 'Sunset Blvd', 'Highland Dr', 'Lakeside Rd'])}",
                "sqft": sqft,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "year_built": year_built,
                "predicted_price": price,
                "discriminator_realness": round(float(discriminator_score) * 100, 1)
            })
            
        return synthetic_records

scenario_simulator = ScenarioSimulator()

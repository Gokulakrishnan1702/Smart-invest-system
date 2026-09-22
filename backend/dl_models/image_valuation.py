"""
Deep Learning Image Valuation Model (Simulated)
================================================
This module simulates a computer vision pipeline that analyzes property images.
It extracts mock features such as Road Access, Urbanization, Development,
Infrastructure, and Soil type consistently using the image byte data.
"""

import hashlib
import random
from typing import List

class ImageValuationModel:
    def __init__(self):
        self.soil_types = ["Red soil", "Black soil", "Sandy soil", "Rocky terrain"]
        self.location_types = ["Rural", "Semi-Urban", "Urban", "Commercial"]
        self.land_characteristics = ["Open land", "Agricultural land", "Residential plot", "Commercial plot"]

    def analyze_images(self, image_bytes_list: List[bytes]) -> dict:
        """
        Analyzes a list of images and returns aggregated property feature scores.
        """
        if not image_bytes_list:
            return {}

        # Aggregate seeds from all images
        combined_hash = hashlib.md5()
        for img_bytes in image_bytes_list:
            combined_hash.update(img_bytes)
        
        seed = int(combined_hash.hexdigest(), 16)
        # Use a localized Random instance to not affect global random state
        rnd = random.Random(seed)

        # Generate simulated scores
        road_access = rnd.randint(30, 98)
        urbanization = rnd.randint(20, 95)
        development = rnd.randint(25, 90)
        infrastructure = rnd.randint(30, 95)
        
        soil_type = rnd.choice(self.soil_types)
        location_type = rnd.choice(self.location_types)
        land_characteristic = rnd.choice(self.land_characteristics)
        
        # Ensure logical consistency: high urbanization -> usually not rural/ag
        if urbanization > 75:
            location_type = rnd.choice(["Urban", "Commercial"])
            if land_characteristic == "Agricultural land":
                land_characteristic = rnd.choice(["Residential plot", "Commercial plot"])
        elif urbanization < 40:
            location_type = rnd.choice(["Rural", "Semi-Urban"])

        # Vegetation and environmental features
        vegetation_coverage = rnd.randint(10, 80)
        water_body_detected = rnd.random() < 0.25  # 25% probability

        # Higher urbanization → lower vegetation coverage
        if urbanization > 75:
            vegetation_coverage = rnd.randint(5, 30)
        elif urbanization < 40:
            vegetation_coverage = rnd.randint(40, 85)

        road_features = {
            "road_available": road_access > 40,
            "road_width_est_ft": rnd.randint(10, 40) if road_access > 40 else 0,
            "paved": road_access > 60
        }

        return {
            "road_access_score": road_access,
            "urbanization_score": urbanization,
            "development_score": development,
            "infrastructure_score": infrastructure,
            "soil_type_detected": soil_type,
            "location_type": location_type,
            "land_characteristics": land_characteristic,
            "road_features": road_features,
            "vegetation_coverage": vegetation_coverage,
            "water_body_detected": water_body_detected,
            "image_count": len(image_bytes_list)
        }

image_valuation_model = ImageValuationModel()

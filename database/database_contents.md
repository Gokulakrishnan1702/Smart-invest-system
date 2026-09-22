# `smart_invest.db` Contents

This file contains a text representation of the database so you can view it in the editor.

## Table: `users`

### Schema
- `id` (INTEGER)
- `email` (VARCHAR)
- `password_hash` (VARCHAR)
- `full_name` (VARCHAR)
- `role` (VARCHAR)
- `created_at` (DATETIME)

### Data
|id|email|password_hash|full_name|role|created_at|
|---|---|---|---|---|---|
|1|admin@smartinvest.ai|$2b$12$Yl1PoPyNzGGPOaaD7YCkZeRlroTO2Vdzu/twkWOlE6.YJ5XbNB4Oq|Smart Invest Admin|Admin|2026-07-10 12:56:33.231907|
|2|abieshas.bai24@rathinam.in|$2b$12$sqAwePNFFfn3/.NFbtBWjeR928wjGe8EsOTkhI3N1oH6rJfkyzY8y|abi|User|2026-07-10 13:13:27.303890|
|3|kabiesh44@gmail.com|$2b$12$D9sSOR/aE6x.2jjWt8lsiefqbi9KBOhlEStOfg4Vi3HnMQB4I8A6O|abi|User|2026-07-10 15:22:14.974508|
|4|aa123@gmailcom|$2b$12$rBGtd2TNk4wRV1a40s6qku76WcElbXE5dsfcshGT5KkpcF/IPhtwK|abi|User|2026-07-10 15:23:23.859878|
|5|aa12@gmail.com|$2b$12$WrHd7Vp6Fcv514XXHHVununb7D86peOGkW7vsPWj6KDp.uarF7/g.|abi|User|2026-07-10 15:29:46.273961|
|6|test@example.com|$2b$12$dJMW8OLCK5CfEb38QtaY1uJOPiHtm4/nu0YvLx/6TGMrFJW3D0ysS|Test User|User|2026-07-10 15:39:28.395861|
|7|testuser@test.com|$2b$12$p5AbggWgEt0vFENTFZWyKONxsqAI/GojN4wZuiSHPiO13S0SvxdT2|Test User|User|2026-07-10 15:47:47.635114|
|8|a66586404@gmail.com|$2b$12$DMgj7JnoC9o.tflnOAt4ouYwgZROhRppdUnpdHdLWG/ZUrms8wk.C|Abi|User|2026-07-10 16:05:54.328010|
|9|a665864@gmail.com|$2b$12$FcnlqdHMpoc1SqNbj34wwuT5mYgsioLRfME9VeuowEnGq6aRDcEMS|Abi|Admin|2026-07-10 16:07:02.976469|
|10|santhosh12@gmail.com|$2b$12$zi/TbZnkGNXKzaVMvVtgVOMbB1b4HIj/tkscEVCmwZORbuU1Xw8F6|santhosh|User|2026-07-11 06:02:18.842210|
|11|kabiesh443@gmail.com|$2b$12$WHywdQ9d4uz95OZBnpDCmeet8B26jQsFTuaTDEirAcO5cUcmVvctm|Abiesh AS|User|2026-07-11 08:23:19.998315|
|12|nishaelson82529202kw7sns63b@gmail.com|$2b$12$i5XC5R1gsfsRfIY4ZRN1G.KnnuxzwjX13nY3/ykUoIgfChee9x8d2|Anish Kumar|User|2026-07-12 09:18:53.524055|
|13|abi12@gmail.com|$2b$12$oJ1u7UQ3J1hCC9mHAjSkDeVWTmFkRGZG0P1Ajy8AeKAc1hluomC92|abi|User|2026-07-12 11:16:13.896503|
|14|as12@gmail.com|$2b$12$KTPGm1Rfrz.MJas1G5rz8.Ia.jKPZmsQFwYeXdy1j2y67tGd/H9Ye|abi|User|2026-07-12 12:17:15.193609|

## Table: `market_data`

### Schema
- `id` (INTEGER)
- `date` (DATETIME)
- `index_name` (VARCHAR)
- `value` (FLOAT)
- `volatility` (FLOAT)
- `source` (VARCHAR)

### Data
|id|date|index_name|value|volatility|source|
|---|---|---|---|---|---|
|1|2026-07-10 18:26:32.957558|S&P500|4780.5|12.5|Federal Reserve Bank|
|2|2026-07-10 18:26:32.957558|S&P500|4805.2|12.5|Federal Reserve Bank|
|3|2026-07-10 18:26:32.957558|S&P500|4790.8|12.5|Federal Reserve Bank|
|4|2026-07-10 18:26:32.957558|S&P500|4810.0|12.5|Federal Reserve Bank|
|5|2026-07-10 18:26:32.957558|S&P500|4825.4|12.5|Federal Reserve Bank|

## Table: `sentiment_analysis`

### Schema
- `id` (INTEGER)
- `text` (TEXT)
- `sentiment_score` (FLOAT)
- `entities` (TEXT)
- `confidence` (FLOAT)
- `created_at` (DATETIME)

### Data
|id|text|sentiment_score|entities|confidence|created_at|
|---|---|---|---|---|---|
|1|the land is market|0.0|[]|0.6|2026-07-10 14:52:07.635429|
|2|the land profit is too low|0.0|[]|0.98|2026-07-10 14:54:42.745486|
|3|Coimbatore’s land market is experiencing significant price appreciation post-Covid, with averages hovering around ₹5,764/sqft, though prime areas like Avinashi Road command up to ₹18,000/sqft. This surge is driven by IT growth, infrastructure, and bypass developments, making property in peripheral areas like Sulur (starting at ₹6.2 Lakhs/cent) the current focus for affordable investment.Current Coimbatore Land Rates & NewsMarket Overview: Demand is robust for both affordable properties (under ₹75 Lakhs) and high-end plots (above ₹3 Crores), as localized price benchmarks have shifted upward.Key Areas & Rates:Avinashi Road / Peelamedu: ~₹7,400 to ₹18,000/sqft.Vadavalli / Mettupalayam Road: ~₹5,900 to ₹6,500/sqft.Kalapatti / Saravanampatti: ~₹4,550/sqft and rising due to infrastructure upgrades.Peripheral Markets: Locations like Kovilpalayam are seeing plots average ₹1,149 to ₹3,536/sqft.|1.0|[{"text": "Avinashi Road", "label": "PERSON"}, {"text": "Current Coimbatore", "label": "PERSON"}, {"text": "Land Rates", "label": "PERSON"}, {"text": "Key Areas", "label": "PERSON"}, {"text": "Mettupalayam Road", "label": "PERSON"}, {"text": "Peripheral Markets", "label": "PERSON"}]|0.63|2026-07-10 14:55:43.211835|
|4|Coimbatore’s "Cosmo City" primarily refers to VIP City Cosmo Square, a premium, gated villa plot community in Eachanari.Located off the Pollachi Main Road (Pincode: 641021), it features 77 residential plots ranging from 586 to 7,900 sq. ft. Prices depend on availability, but units start at highly flexible budget ranges. Key details and perks include:Amenities: Gated security, solar street lighting, rainwater harvesting, landscaped areas, and blacktop roads.Convenience: Located near the famous Arulmigu Eachanari Vinayagar Temple, Gedee Public School, and L&T Health Centre.Developers: Managed by VIP Housing and Properties. You can view layouts on VIP City Cosmo Square Coimbatore or check exact unit sizes on 99acres.|0.0|[{"text": "Cosmo City", "label": "PERSON"}, {"text": "City Cosmo", "label": "PERSON"}, {"text": "Pollachi Main", "label": "PERSON"}, {"text": "Arulmigu Eachanari", "label": "PERSON"}, {"text": "Vinayagar Temple", "label": "PERSON"}, {"text": "Gedee Public", "label": "PERSON"}, {"text": "Health Centre", "label": "PERSON"}, {"text": "Square Coimbatore", "label": "PERSON"}]|0.6|2026-07-11 03:47:04.858934|
|5|Coimbatore’s "Cosmo City" primarily refers to VIP City Cosmo Square, a premium, gated villa plot community in Eachanari.Located off the Pollachi Main Road (Pincode: 641021), it features 77 residential plots ranging from 586 to 7,900 sq. ft. Prices depend on availability, but units start at highly flexible budget ranges. Key details and perks include:Amenities: Gated security, solar street lighting, rainwater harvesting, landscaped areas, and blacktop roads.Convenience: Located near the famous Arulmigu Eachanari Vinayagar Temple, Gedee Public School, and L&T Health Centre.Developers: Managed by VIP Housing and Properties. You can view layouts on VIP City Cosmo Square Coimbatore or check exact unit sizes on 99acres.|0.0|[{"text": "Cosmo City", "label": "PERSON"}, {"text": "City Cosmo", "label": "PERSON"}, {"text": "Pollachi Main", "label": "PERSON"}, {"text": "Arulmigu Eachanari", "label": "PERSON"}, {"text": "Vinayagar Temple", "label": "PERSON"}, {"text": "Gedee Public", "label": "PERSON"}, {"text": "Health Centre", "label": "PERSON"}, {"text": "Square Coimbatore", "label": "PERSON"}]|0.6|2026-07-11 03:47:22.613093|
|6|URL: https://youtu.be/LGe808Rh_xQ?si=OtkmFE3RwUZKxIR- | Title: Parandur Airport Project Cancelled | Vijay Government Cites Wetlands & Unsuitable Runway Land - YouTube|0.0|[{"text": "Parandur Airport", "label": "PERSON"}, {"text": "Project Cancelled", "label": "PERSON"}, {"text": "Vijay Government", "label": "PERSON"}, {"text": "Cites Wetlands", "label": "PERSON"}, {"text": "Unsuitable Runway", "label": "PERSON"}, {"text": "Google", "label": "ORG"}]|0.6|2026-07-11 03:48:44.635748|

## Table: `agent_decisions`

### Schema
- `id` (INTEGER)
- `action_type` (VARCHAR)
- `description` (TEXT)
- `portfolio_id` (INTEGER)
- `reason` (TEXT)
- `status` (VARCHAR)
- `created_at` (DATETIME)

### Data
|id|action_type|description|portfolio_id|reason|status|created_at|
|---|---|---|---|---|---|---|
|1|BUY_ACCENT|Market is bullish (0.1) and portfolio risk is low (15.0%). Recommending buying high-growth units.|1|Risk optimized allocation changes: {"1": 100.0}|Executed|2026-07-10 14:06:03.631473|
|2|BUY_ACCENT|Market is bullish (0.1) and portfolio risk is low (37.6%). Recommending buying high-growth units.|1|Risk optimized allocation changes: {"1": 88.0, "2": 12.0}|Executed|2026-07-10 14:09:46.083271|
|3|BUY_ACCENT|Market is bullish (0.1) and portfolio risk is low (43.2%). Recommending buying high-growth units.|2|Risk optimized allocation changes: {"2": 100.0}|Executed|2026-07-11 02:51:08.929482|
|4|BUY_ACCENT|Market is bullish (0.1) and portfolio risk is low (22.1%). Recommending buying high-growth units.|12|Risk optimized allocation changes: {"12": 25.0, "13": 25.0, "14": 25.0, "15": 25.0}|Executed|2026-07-11 07:02:07.805580|
|5|BUY_ACCENT|Market is bullish (0.1) and portfolio risk is low (22.1%). Recommending buying high-growth units.|12|Risk optimized allocation changes: {"12": 25.0, "13": 25.0, "14": 25.0, "15": 25.0}|Executed|2026-07-11 07:02:08.956656|

## Table: `properties`

### Schema
- `id` (INTEGER)
- `user_id` (INTEGER)
- `address` (VARCHAR)
- `sqft` (FLOAT)
- `bedrooms` (INTEGER)
- `bathrooms` (FLOAT)
- `year_built` (INTEGER)
- `predicted_price` (FLOAT)
- `actual_price` (FLOAT)
- `risk_score` (FLOAT)
- `property_type` (VARCHAR)
- `extra_details` (TEXT)
- `hold_years` (INTEGER)
- `projected_price` (FLOAT)

### Data
|id|user_id|address|sqft|bedrooms|bathrooms|year_built|predicted_price|actual_price|risk_score|property_type|extra_details|hold_years|projected_price|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|8|2|a|1000.0|4|2.0|2022|5413817.05|500000.0|43.2|Flats/Apartments (residential units)|{"floor_level":"3","has_balcony":"yes","hoa_fees":"10000"}|1|None|
|9|2|a|2000.0|0|0.0|2026|1687500.0|200000.0|15.0|Land (vacant, agricultural, development)|{"land_type":"Agricultural","road_access":"yes","utilities_available":"yes"}|1|None|
|10|2|a|2000.0|0|0.0|2026|1687500.0|200000.0|15.0|Land (vacant, agricultural, development)|{"land_type":"Agricultural","road_access":"yes","utilities_available":"yes"}|1|None|
|11|2|aaa|1000.0|0|0.0|2026|2531250.0|10000.0|15.0|Land (vacant, agricultural, development)|{"land_type":"Vacant","road_access":"yes","utilities_available":"yes"}|1|None|
|12|9|abi12|1000.0|0|0.0|2026|7593750.0|5000000.0|25.0|Land (vacant, agricultural, development)|{"land_type":"Development","road_access":"yes","utilities_available":"yes"}|1|None|
|13|9|abi12|1000.0|0|0.0|2026|7593750.0|5000000.0|25.0|Land (vacant, agricultural, development)|{"land_type":"Development","road_access":"yes","utilities_available":"yes"}|1|None|
|14|9|Kanniyakumari, |2000.0|0|0.0|2026|2851875.0|2000000.0|15.0|Land (vacant, agricultural, development)|{"land_type":"Agricultural","road_access":"yes","utilities_available":"yes"}|1|None|
|15|9|Kanniyakumari, |2000.0|0|0.0|2026|2851875.0|2000000.0|15.0|Land (vacant, agricultural, development)|{"land_type":"Agricultural","road_access":"yes","utilities_available":"yes"}|1|None|
|16|11|Kanniyakumari, |2222.0|2|1.5|2011|70840454.08|4444000.0|47.2|Houses (single-family, townhouses)|{"house_type":"Townhouse","has_garage":"yes","yard_size":"1998"}|1|None|
|17|11|Kanniyakumari, |2222.0|2|1.5|2011|70840454.08|4444000.0|47.2|Houses (single-family, townhouses)|{"house_type":"Townhouse","has_garage":"yes","yard_size":"1998"}|1|None|
|18|11|Alluri Sitharama Raju, |1000.0|0|0.0|2026|19819601.31|1500000.0|47.2|Land (vacant, agricultural, development)|{"land_type":"Agricultural","road_access":"yes","utilities_available":"yes"}|1|None|
|19|11|Alluri Sitharama Raju, |1000.0|0|0.0|2026|19819601.31|1500000.0|47.2|Land (vacant, agricultural, development)|{"land_type":"Agricultural","road_access":"yes","utilities_available":"yes"}|1|None|
|20|11|Bajali, |345.0|0|0.0|2026|7367216.42|1035000.0|47.2|Land (vacant, agricultural, development)|{"land_type":"Development","road_access":"yes","utilities_available":"yes"}|1|None|
|21|11|Bajali, |345.0|0|0.0|2026|7367216.42|1035000.0|47.2|Land (vacant, agricultural, development)|{"land_type":"Development","road_access":"yes","utilities_available":"yes"}|1|None|
|22|11|Bajali, |345.0|0|0.0|2026|7367216.42|1035000.0|47.2|Land (vacant, agricultural, development)|{"land_type":"Development","road_access":"yes","utilities_available":"yes"}|1|None|
|23|11|Anakapalli, |333.0|0|0.0|2026|7367216.42|1332000.0|47.2|Land (vacant, agricultural, development)|{"land_type":"Agricultural","road_access":"no","utilities_available":"no"}|1|None|
|24|11|Anakapalli, |333.0|0|0.0|2026|7367216.42|1332000.0|47.2|Land (vacant, agricultural, development)|{"land_type":"Agricultural","road_access":"no","utilities_available":"no"}|1|None|
|25|11|Anakapalli, |333.0|0|0.0|2026|7367216.42|1332000.0|47.2|Land (vacant, agricultural, development)|{"land_type":"Agricultural","road_access":"no","utilities_available":"no"}|1|None|
|26|12|Coimbatore, |5.0|0|0.0|2026|25421321.77|50000.0|47.2|Land (vacant, agricultural, development)|{"land_type":"Agricultural","road_access":"yes","utilities_available":"yes","location_type":"Rural"}|1|27200814.29|

## Table: `simulations`

### Schema
- `id` (INTEGER)
- `user_id` (INTEGER)
- `scenario_name` (VARCHAR)
- `parameters` (TEXT)
- `results` (TEXT)
- `created_at` (DATETIME)

### Data
|id|user_id|scenario_name|parameters|results|created_at|
|---|---|---|---|---|---|
|1|2|Interest Rate Change|{"severity": "High", "rate_change": 1.5, "duration_months": 22}|{"scenario": "Interest Rate Change", "description": "Adjusting interest rates by 1.5%. Yields compress property valuations.", "severity": "High", "timeline": ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12", "M13", "M14", "M15", "M16", "M17", "M18", "M19", "M20", "M21", "M22"], "index_values": [100.0, 95.66, 92.71, 90.04, 87.04, 86.07, 83.91, 79.86, 77.98, 82.09, 82.48, 79.5, 75.41, 75.79, 70.18, 70.02, 69.18, 66.63, 64.77, 67.63, 65.61, 63.89], "projected_change_pct": -36.11, "volatility_index": 3.08}|2026-07-10 13:47:56.395510|
|2|2|Interest Rate Change|{"severity": "High", "rate_change": 1.5, "duration_months": 30}|{"scenario": "Interest Rate Change", "description": "Adjusting interest rates by 1.5%. Yields compress property valuations.", "severity": "High", "timeline": ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12", "M13", "M14", "M15", "M16", "M17", "M18", "M19", "M20", "M21", "M22", "M23", "M24", "M25", "M26", "M27", "M28", "M29", "M30"], "index_values": [100.0, 99.73, 97.91, 98.28, 88.45, 84.25, 85.31, 84.47, 83.13, 77.99, 82.64, 84.55, 80.49, 77.81, 77.05, 72.32, 74.42, 67.48, 63.65, 60.72, 57.49, 61.86, 59.7, 58.87, 55.13, 54.63, 52.34, 52.21, 53.45, 55.32], "projected_change_pct": -44.68, "volatility_index": 4.11}|2026-07-10 13:48:03.009278|
|3|2|Economic Downturn|{"severity": "Low", "rate_change": 0.0, "duration_months": 5}|{"scenario": "Economic Downturn", "description": "Simulating a recession over 5 months with high market selloffs.", "severity": "Low", "timeline": ["M1", "M2", "M3", "M4", "M5"], "index_values": [100.0, 99.27, 99.56, 100.15, 96.67], "projected_change_pct": -3.33, "volatility_index": 1.55}|2026-07-10 14:05:41.802891|
|4|2|Economic Downturn|{"severity": "Medium", "rate_change": 1.5, "duration_months": 23}|{"scenario": "Economic Downturn", "description": "Simulating a recession over 23 months with high market selloffs.", "severity": "Medium", "timeline": ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12", "M13", "M14", "M15", "M16", "M17", "M18", "M19", "M20", "M21", "M22", "M23"], "index_values": [100.0, 102.48, 95.47, 93.56, 90.67, 84.22, 83.95, 78.61, 80.98, 82.38, 85.68, 94.55, 100.82, 100.28, 100.93, 102.02, 108.19, 107.8, 108.71, 112.72, 98.65, 94.62, 85.71], "projected_change_pct": -14.29, "volatility_index": 5.62}|2026-07-11 02:51:28.040003|
|5|2|Interest Rate Change|{"severity": "Medium", "rate_change": 1.5, "duration_months": 23}|{"scenario": "Interest Rate Change", "description": "Adjusting interest rates by 1.5%. Yields compress property valuations.", "severity": "Medium", "timeline": ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12", "M13", "M14", "M15", "M16", "M17", "M18", "M19", "M20", "M21", "M22", "M23"], "index_values": [100.0, 98.05, 96.73, 97.74, 95.75, 94.23, 92.79, 91.84, 93.65, 92.95, 92.33, 88.69, 90.25, 88.24, 89.27, 91.07, 89.69, 88.24, 85.84, 82.81, 81.56, 81.12, 81.66], "projected_change_pct": -18.34, "volatility_index": 1.62}|2026-07-11 02:51:38.513370|
|6|2|Economic Downturn|{"severity": "Low", "rate_change": 0.0, "duration_months": 5}|{"scenario": "Economic Downturn", "description": "Simulating a recession over 5 months with high market selloffs.", "severity": "Low", "timeline": ["M1", "M2", "M3", "M4", "M5"], "index_values": [100.0, 96.27, 92.35, 93.74, 90.5], "projected_change_pct": -9.5, "volatility_index": 2.46}|2026-07-11 02:51:43.156055|

## Table: `alerts`

### Schema
- `id` (INTEGER)
- `user_id` (INTEGER)
- `type` (VARCHAR)
- `message` (TEXT)
- `severity` (VARCHAR)
- `is_read` (BOOLEAN)
- `created_at` (DATETIME)

### Data
|id|user_id|type|message|severity|is_read|created_at|
|---|---|---|---|---|---|---|
|1|2|RISK|Agent rebalanced your portfolio using RL model: BUY_ACCENT.|INFO|0|2026-07-10 14:06:03.670672|
|2|2|RISK|Agent rebalanced your portfolio using RL model: BUY_ACCENT.|INFO|0|2026-07-10 14:09:46.104719|
|3|2|RISK|Agent rebalanced your portfolio using RL model: BUY_ACCENT.|INFO|0|2026-07-11 02:51:08.975645|
|4|9|RISK|Agent rebalanced your portfolio using RL model: BUY_ACCENT.|INFO|0|2026-07-11 07:02:07.837882|
|5|9|RISK|Agent rebalanced your portfolio using RL model: BUY_ACCENT.|INFO|0|2026-07-11 07:02:08.974332|

## Table: `reports`

### Schema
- `id` (INTEGER)
- `user_id` (INTEGER)
- `name` (VARCHAR)
- `type` (VARCHAR)
- `data` (TEXT)
- `file_url` (VARCHAR)
- `created_at` (DATETIME)

### Data
|id|user_id|name|type|data|file_url|created_at|
|---|---|---|---|---|---|---|
|1|2|SmartInvest_RiskReport_20260710_193616|PDF|None|/static/reports/SmartInvest_RiskReport_20260710_193616.pdf|2026-07-10 14:06:16.685148|

## Table: `transactions`

### Schema
- `id` (INTEGER)
- `property_id` (INTEGER)
- `sale_price` (FLOAT)
- `sale_date` (DATETIME)
- `buyer` (VARCHAR)
- `seller` (VARCHAR)

### Data
*No data in this table.*

## Table: `portfolio`

### Schema
- `id` (INTEGER)
- `user_id` (INTEGER)
- `property_id` (INTEGER)
- `allocation` (FLOAT)
- `entry_price` (FLOAT)
- `current_price` (FLOAT)

### Data
|id|user_id|property_id|allocation|entry_price|current_price|
|---|---|---|---|---|---|
|8|2|8|20.0|500000.0|500000.0|
|9|2|9|20.0|200000.0|200000.0|
|10|2|10|20.0|200000.0|200000.0|
|11|2|11|20.0|10000.0|10000.0|
|12|9|12|25.0|5000000.0|5000000.0|
|13|9|13|25.0|5000000.0|5000000.0|
|14|9|14|25.0|2000000.0|2000000.0|
|15|9|15|25.0|2000000.0|2000000.0|
|16|11|16|20.0|4444000.0|4444000.0|
|17|11|17|20.0|4444000.0|4444000.0|
|18|11|18|20.0|1500000.0|1500000.0|
|19|11|19|20.0|1500000.0|1500000.0|
|20|11|20|20.0|1035000.0|1035000.0|
|21|11|21|20.0|1035000.0|1035000.0|
|22|11|22|20.0|1035000.0|1035000.0|
|23|11|23|20.0|1332000.0|1332000.0|
|24|11|24|20.0|1332000.0|1332000.0|
|25|11|25|20.0|1332000.0|1332000.0|
|26|12|26|20.0|50000.0|50000.0|

## Table: `image_analyses`

### Schema
- `id` (INTEGER)
- `filename` (VARCHAR)
- `area_type` (VARCHAR)
- `suitability_verdict` (TEXT)
- `development_rating` (FLOAT)
- `vegetation_density` (FLOAT)
- `infrastructure_score` (FLOAT)
- `roads_detected` (BOOLEAN)
- `facilities_detected` (BOOLEAN)
- `disaster_risk_score` (FLOAT)
- `disaster_risk_level` (VARCHAR)
- `avg_profit_pct` (FLOAT)
- `avg_loss_pct` (FLOAT)
- `net_outlook` (VARCHAR)
- `forecast_json` (TEXT)
- `status` (VARCHAR)
- `created_at` (DATETIME)
- `user_id` (INTEGER)

### Data
|id|filename|area_type|suitability_verdict|development_rating|vegetation_density|infrastructure_score|roads_detected|facilities_detected|disaster_risk_score|disaster_risk_level|avg_profit_pct|avg_loss_pct|net_outlook|forecast_json|status|created_at|user_id|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|1|images (2).jpg|Rural|Rural / Undeveloped Zone (Low Return / Loss Risk)|47.6|50.1|73.7|1|1|49.4|Medium Risk|5.95|21.29|At Risk|{"months": ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6", "Month 7", "Month 8", "Month 9", "Month 10", "Month 11", "Month 12"], "profit_pct": [4.99, 5.31, 6.28, 7.07, 7.47, 7.26, 6.59, 6.24, 5.79, 4.91, 4.67, 4.79], "loss_pct": [17.46, 19.13, 19.44, 20.59, 20.9, 20.46, 21.08, 22.58, 22.1, 22.86, 24.18, 24.65], "avg_profit_pct": 5.95, "avg_loss_pct": 21.29, "peak_profit_month": "Month 5", "peak_loss_month": "Month 12", "net_outlook": "At Risk"}|Successful Analysis|2026-07-10 17:10:53.056790|None|
|2|Tokyo.jpg|Urban|Urban Facility Zone (High Profit Potential)|66.5|49.5|94.5|1|1|66.0|High Risk|30.75|2.17|Profitable|{"months": ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6", "Month 7", "Month 8", "Month 9", "Month 10", "Month 11", "Month 12"], "profit_pct": [24.38, 25.36, 27.92, 29.13, 30.34, 31.06, 31.59, 32.03, 33.12, 33.47, 34.38, 36.2], "loss_pct": [3.89, 3.4, 3.47, 2.94, 2.69, 1.76, 2.55, 1.85, 1.04, 1.03, 0.9, 0.5], "avg_profit_pct": 30.75, "avg_loss_pct": 2.17, "peak_profit_month": "Month 12", "peak_loss_month": "Month 1", "net_outlook": "Profitable"}|Successful Analysis|2026-07-11 06:00:37.035478|None|
|3|images (2).jpg|Rural|Rural / Undeveloped Zone (Low Return / Loss Risk)|47.6|50.1|73.7|1|1|49.4|Medium Risk|5.95|21.29|At Risk|{"months": ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6", "Month 7", "Month 8", "Month 9", "Month 10", "Month 11", "Month 12"], "profit_pct": [4.99, 5.31, 6.28, 7.07, 7.47, 7.26, 6.59, 6.24, 5.79, 4.91, 4.67, 4.79], "loss_pct": [17.46, 19.13, 19.44, 20.59, 20.9, 20.46, 21.08, 22.58, 22.1, 22.86, 24.18, 24.65], "avg_profit_pct": 5.95, "avg_loss_pct": 21.29, "peak_profit_month": "Month 5", "peak_loss_month": "Month 12", "net_outlook": "At Risk"}|Successful Analysis|2026-07-12 11:43:39.866269|12|
|4|Tokyo.jpg|Urban|Urban Facility Zone (High Profit Potential)|66.5|49.5|94.5|1|1|66.0|High Risk|30.75|2.17|Profitable|{"months": ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6", "Month 7", "Month 8", "Month 9", "Month 10", "Month 11", "Month 12"], "profit_pct": [24.38, 25.36, 27.92, 29.13, 30.34, 31.06, 31.59, 32.03, 33.12, 33.47, 34.38, 36.2], "loss_pct": [3.89, 3.4, 3.47, 2.94, 2.69, 1.76, 2.55, 1.85, 1.04, 1.03, 0.9, 0.5], "avg_profit_pct": 30.75, "avg_loss_pct": 2.17, "peak_profit_month": "Month 12", "peak_loss_month": "Month 1", "net_outlook": "Profitable"}|Successful Analysis|2026-07-12 12:49:46.849442|12|

## Table: `model_metrics`

### Schema
- `id` (INTEGER)
- `model_name` (VARCHAR)
- `model_type` (VARCHAR)
- `metric_type` (VARCHAR)
- `metric_value` (FLOAT)
- `dataset_size` (INTEGER)
- `recorded_at` (DATETIME)

### Data
*No data in this table.*

## Table: `hybrid_predictions`

### Schema
- `id` (INTEGER)
- `property_id` (INTEGER)
- `prediction_type` (VARCHAR)
- `ml_value` (FLOAT)
- `dl_value` (FLOAT)
- `hybrid_value` (FLOAT)
- `ml_weight` (FLOAT)
- `dl_weight` (FLOAT)
- `input_features` (TEXT)
- `metrics_json` (TEXT)
- `created_at` (DATETIME)

### Data
*No data in this table.*


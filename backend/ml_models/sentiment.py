import re
import urllib.request
from bs4 import BeautifulSoup
import json
from urllib.parse import urlparse
from ml_models.slm_explanation import SLMExplanationModel

# Lists of common named entities in financial/real estate news for robust NER fallback
NER_PATTERNS = {
    "PERSON": [
        r"\b[A-Z][a-z]+\s[A-Z][a-z]+\b",  # Generic capitalised names
        r"\bWarren\sBuffett\b", r"\bJerome\sPowell\b", r"\bElon\sMusk\b"
    ],
    "ORG": [
        r"\bFederal\sReserve\b", r"\bFed\b", r"\bZillow\b", r"\bRedfin\b", 
        r"\bBlackstone\b", r"\bFannie\sMae\b", r"\bFreddie\sMac\b", r"\bGoldman\sSachs\b", 
        r"\bJPMorgan\b", r"\bChase\b", r"\bGoogle\b", r"\bRealtor\.com\b"
    ],
    "LOC": [
        r"\bNew\sYork\b", r"\bCalifornia\b", r"\bTexas\b", r"\bFlorida\b", 
        r"\bLos\sAngeles\b", r"\bSan\sFrancisco\b", r"\bAustin\b", r"\bMiami\b", 
        r"\bSeattle\b", r"\bChicago\b", r"\bUS\b", r"\bUSA\b", r"\bUnited\sStates\b"
    ]
}

# Positive and negative word lists for real estate sentiment
POSITIVE_WORDS = {
    "growth", "surge", "boom", "rise", "increase", "bullish", "profit", "gain", "strong", 
    "upward", "opportunity", "demand", "recovery", "positive", "high", "stabilize", "rebound",
    "favorable", "optimistic", "valuable", "exceed", "expansion", "wealth", "improvement"
}

NEGATIVE_WORDS = {
    "downturn", "crash", "drop", "decline", "fall", "bearish", "loss", "weak", "downward", 
    "risk", "slump", "negative", "low", "collapse", "recession", "pessimistic", "volatile", 
    "uncertain", "inflation", "debt", "default", "bankruptcy", "foreclosure", "correction"
}

# Trusted and suspicious news source domains
TRUSTED_DOMAINS = {
    "bloomberg.com", "reuters.com", "wsj.com", "cnbc.com", "ft.com", "forbes.com", 
    "marketwatch.com", "yahoofinance.com", "finance.yahoo.com", "zillow.com", 
    "redfin.com", "realtor.com", "nytimes.com", "economist.com"
}

SUSPICIOUS_DOMAINS = {
    "fake-news.com", "dailybuzz.net", "satirepost.com", "clickbaitblog.net", 
    "theonion.com", "gossipdaily.org", "scamalert.info", "blogspot.com", 
    "wordpress.com", "tumblr.com", "reddit.com", "buzzfeed.com"
}

class SentimentModel:
    def __init__(self):
        self.slm_engine = SLMExplanationModel()

    def verify_credibility(self, text: str, url: str = None) -> dict:
        """
        Verify if the given news text or URL is from a trusted or suspicious source,
        and calculate a credibility score.
        """
        score = 70  # Default base score for unverified text
        check_details = []
        source_domain = None

        # 1. Domain Check
        if url:
            try:
                parsed_url = urlparse(url)
                domain = parsed_url.netloc.lower()
                # Remove www.
                if domain.startswith("www."):
                    domain = domain[4:]
                source_domain = domain

                # Check lists
                is_trusted = any(domain == td or domain.endswith("." + td) for td in TRUSTED_DOMAINS)
                is_suspicious = any(domain == sd or domain.endswith("." + sd) for sd in SUSPICIOUS_DOMAINS)

                if is_trusted:
                    score += 25
                    check_details.append(f"Domain '{domain}' is a verified trusted news/data source.")
                elif is_suspicious:
                    score -= 50
                    check_details.append(f"Domain '{domain}' is flagged as suspicious, self-published, or low-credibility.")
                else:
                    check_details.append(f"Domain '{domain}' is an independent or unverified source.")
            except Exception as e:
                check_details.append(f"Failed to parse URL domain: {str(e)}")
                score -= 10
        else:
            check_details.append("No URL provided; analyzing text body only.")

        # Extract entities count using NER patterns
        found_entities_count = 0
        stopwords = {"the", "a", "an", "on", "at", "to", "in", "for", "with", "this", "that", "these", "those"}
        for category, patterns in NER_PATTERNS.items():
            for pattern in patterns:
                matches = re.findall(pattern, text)
                for match in matches:
                    if match.strip().lower() not in stopwords:
                        found_entities_count += 1

        # 2. Entity Density
        if found_entities_count >= 3:
            score += 10
            check_details.append(f"Referenced multiple specific entities ({found_entities_count} found), increasing context reliability.")
        elif found_entities_count == 0:
            score -= 15
            check_details.append("Contains zero recognizable named entities (companies, places, or people).")

        # 3. Clickbait & Hyperbolic wording
        clickbait_words = {
            "shocking", "collapse", "crash imminent", "guaranteed profits", "make millions", 
            "secret trick", "you won't believe", "must see", "absolutely free", "hide the truth",
            "insane gains", "skyrocket overnight", "breakout alert", "financial hack"
        }
        found_clickbait = [w for w in clickbait_words if w in text.lower()]
        if found_clickbait:
            score -= 20
            check_details.append(f"Contains sensationalist/clickbait phrasing: {', '.join(found_clickbait)}")

        # 4. CAPITALIZATION & Excessive punctuation
        caps_words = re.findall(r"\b[A-Z]{4,}\b", text)
        # Exclude common ORGs in caps
        common_caps_orgs = {"US", "USA", "FED", "NYSE", "NASDAQ", "SEC", "REIT"}
        caps_words = [w for w in caps_words if w not in common_caps_orgs]
        if len(caps_words) >= 3:
            score -= 10
            check_details.append("Excessive uppercase words detected (indicative of shouting or hype).")

        if "!!!" in text or "???" in text or "!?" in text:
            score -= 10
            check_details.append("Sensationalist punctuation (e.g., '!!!') detected.")

        # 5. Statistical Plausibility (Extreme Claims)
        extreme_percent = re.findall(r"\b([9][0-9]|[1-9][0-9]{2,})%", text)
        if extreme_percent:
            score -= 15
            check_details.append(f"Contains extreme, highly improbable claims (e.g., movement of {extreme_percent[0]}%).")

        # Clamp score between 0 and 100
        score = max(0, min(100, score))

        # Verdict assignment
        if score >= 75:
            source_status = "Trusted"
            verdict = "Verified & Trustworthy"
        elif score <= 45:
            source_status = "Suspicious/Fake"
            verdict = "Likely Fake / Clickbait"
        else:
            source_status = "Unverified"
            verdict = "Requires Verification"

        return {
            "source_status": source_status,
            "credibility_score": score,
            "verdict": verdict,
            "check_details": check_details,
            "source_domain": source_domain
        }

    def analyze_text(self, text: str, url: str = None) -> dict:
        """
        Analyze news text, extract sentiment, confidence, NER, and market impact.
        """
        credibility = self.verify_credibility(text, url)

        if not text or not text.strip():
            result = {
                "sentiment": "Neutral",
                "score": 0.0,
                "confidence": 1.0,
                "entities": [],
                "market_impact": "None",
                "credibility": credibility
            }
            result["ai_explanation"] = self.slm_engine.generate_explanation(
                article_text=text,
                sentiment="Neutral",
                score=0.0,
                confidence=1.0,
                market_impact="None",
                credibility=credibility,
                entities=[]
            )
            return result

        # Tokenize and compute sentiment score
        words = re.findall(r"\b[a-zA-Z]+\b", text.lower())
        pos_count = sum(1 for w in words if w in POSITIVE_WORDS)
        neg_count = sum(1 for w in words if w in NEGATIVE_WORDS)
        
        total_tokens = len(words)
        if total_tokens == 0:
            result = {
                "sentiment": "Neutral",
                "score": 0.0,
                "confidence": 1.0,
                "entities": [],
                "market_impact": "None",
                "credibility": credibility
            }
            result["ai_explanation"] = self.slm_engine.generate_explanation(
                article_text=text,
                sentiment="Neutral",
                score=0.0,
                confidence=1.0,
                market_impact="None",
                credibility=credibility,
                entities=[]
            )
            return result

        diff = pos_count - neg_count
        score = diff / max(1, pos_count + neg_count)  # -1.0 to 1.0
        
        if score > 0.15:
            sentiment = "Positive"
        elif score < -0.15:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"

        # Calculate Confidence Score (based on text length and density of emotional words)
        emotional_ratio = (pos_count + neg_count) / max(10, total_tokens)
        confidence = min(0.98, 0.5 + (emotional_ratio * 3.0))
        confidence = max(0.60, round(confidence, 2))

        # Extract Entities (NER) using pattern matching
        found_entities = []
        # Exclude common lowercase words from matching generic person names
        stopwords = {"the", "a", "an", "on", "at", "to", "in", "for", "with", "this", "that", "these", "those"}
        
        for category, patterns in NER_PATTERNS.items():
            for pattern in patterns:
                matches = re.findall(pattern, text)
                for match in matches:
                    # Clean match
                    match_str = match.strip()
                    if match_str.lower() in stopwords:
                        continue
                    entity_dict = {"text": match_str, "label": category}
                    if entity_dict not in found_entities:
                        found_entities.append(entity_dict)

        # Market Impact Assessment
        if sentiment == "Positive":
            if score > 0.5:
                market_impact = "High Market Growth / Demand Spike"
            else:
                market_impact = "Moderate Market Appreciation"
        elif sentiment == "Negative":
            if score < -0.5:
                market_impact = "High Risk / Potential Market Downturn"
            else:
                market_impact = "Minor Volatility / Price Correction"
        else:
            market_impact = "Stable Market / Sideways Trading"

        result = {
            "sentiment": sentiment,
            "score": round(score, 2),
            "confidence": confidence,
            "entities": found_entities[:10],
            "market_impact": market_impact,
            "word_count": total_tokens,
            "credibility": credibility
        }
        result["ai_explanation"] = self.slm_engine.generate_explanation(
            article_text=text,
            sentiment=sentiment,
            score=score,
            confidence=confidence,
            market_impact=market_impact,
            credibility=credibility,
            entities=found_entities[:10]
        )
        return result

    def analyze_url(self, url: str) -> dict:
        """
        Fetch webpage HTML, extract main text, and analyze sentiment.
        """
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=5) as response:
                html = response.read()
            
            soup = BeautifulSoup(html, "html.parser")
            
            # Remove scripts and style sheets
            for script in soup(["script", "style"]):
                script.decompose()

            # Get text and clean
            text = soup.get_text()
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text_content = " ".join(chunk for chunk in chunks if chunk)
            
            # Crop to first 5000 characters
            text_content = text_content[:5000]
            analysis = self.analyze_text(text_content, url=url)
            analysis["title"] = soup.title.string if soup.title else "Web Article"
            return analysis
        except Exception as e:
            # Generate static credibility analysis for failure cases (malformed/broken links)
            credibility = {
                "source_status": "Suspicious/Fake",
                "credibility_score": 0,
                "verdict": "Likely Fake / Clickbait",
                "check_details": [f"Connection failure: {str(e)}", "Unable to load or verify source link."],
                "source_domain": urlparse(url).netloc if url else None
            }
            result = {
                "sentiment": "Neutral",
                "score": 0.0,
                "confidence": 0.50,
                "entities": [],
                "market_impact": "Failed to retrieve URL",
                "error": str(e),
                "credibility": credibility
            }
            result["ai_explanation"] = self.slm_engine.generate_explanation(
                article_text="",
                sentiment="Neutral",
                score=0.0,
                confidence=0.50,
                market_impact="Failed to retrieve URL",
                credibility=credibility,
                entities=[]
            )
            return result

sentiment_model = SentimentModel()

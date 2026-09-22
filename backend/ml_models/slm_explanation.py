import json
import re
import urllib.request
import urllib.error
import logging

logger = logging.getLogger(__name__)


class SLMExplanationModel:
    """
    Real SLM-based explanation engine backed by Ollama (local inference).

    The model is loaded once at startup and kept in memory.
    Every call to generate_explanation() sends the ACTUAL news article text
    to the local Qwen2.5-1.5B model so explanations differ article-by-article.

    Falls back to a contextual rule-based response only when Ollama is
    unreachable (e.g. not yet installed / not started).
    """

    OLLAMA_URL = "http://localhost:11434/api/generate"
    MODEL_NAME = "qwen2.5:1.5b"

    def __init__(self):
        self._ollama_available = self._check_ollama()
        if self._ollama_available:
            logger.info(f"[SLM] Ollama is running. Using model: {self.MODEL_NAME}")
        else:
            logger.warning("[SLM] Ollama not reachable. Will use contextual fallback.")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _check_ollama(self) -> bool:
        """Ping Ollama to see if it is running."""
        try:
            req = urllib.request.Request("http://localhost:11434/", method="GET")
            with urllib.request.urlopen(req, timeout=2):
                return True
        except Exception:
            return False

    def _call_ollama(self, prompt: str) -> str:
        """Send prompt to Ollama and return the model's raw text response."""
        payload = json.dumps({
            "model": self.MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.4,
                "top_p": 0.9,
                "num_predict": 512
            }
        }).encode("utf-8")

        req = urllib.request.Request(
            self.OLLAMA_URL,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("response", "")

    def _build_prompt(
        self,
        article_text: str,
        sentiment: str,
        score: float,
        confidence: float,
        market_impact: str,
        credibility_score: int,
        entities: list,
    ) -> str:
        entity_str = ", ".join(e["text"] for e in entities) if entities else "none identified"
        article_snippet = article_text[:2500].strip() if article_text else "No article text provided."

        return f"""You are a professional real estate market analyst.

Read the following news article carefully and produce a structured analysis.

--- NEWS ARTICLE START ---
{article_snippet}
--- NEWS ARTICLE END ---

NLP Pipeline Results (already computed — do NOT repeat these, use them as context only):
- Detected Sentiment: {sentiment}
- Sentiment Score: {score:+.2f}  (range -1.0 to +1.0)
- Confidence: {confidence:.0%}
- Market Impact Label: {market_impact}
- Source Credibility Score: {credibility_score}/100
- Named Entities Detected: {entity_str}

Your Task:
1. Identify the ACTUAL problem or opportunity discussed in the article.
2. Explain WHY this sentiment was detected — reference specific facts from the article.
3. Discuss the relevant factors (interest rates, inflation, buyer demand, developer activity,
   construction, government policy, infrastructure, housing supply, investment trends).
4. Explain how these factors affect LAND PRICES specifically.
5. State who is affected: buyers, developers, banks, investors, or government.
6. Provide a short-term market outlook.
7. Give PRACTICAL investment advice based on the article content.

IMPORTANT RULES:
- Base your explanation ONLY on the actual article content above.
- Do NOT return generic answers.
- Different articles must produce different explanations.
- Use professional, clear English.
- Return ONLY the following JSON — no extra text, no markdown, no code fences.

{{
  "summary": "One sentence summary of what the article is about.",
  "problem_detected": "The core issue or opportunity identified in the article.",
  "reason": "Why the detected sentiment makes sense based on the article content.",
  "market_effect": "How this news affects land prices and real estate market dynamics.",
  "investment_advice": "Practical advice for investors based on the article.",
  "expected_direction": "Upward | Downward | Stable | Mixed",
  "risk_level": "Low | Moderate | High | Very High"
}}"""

    def _parse_json_response(self, raw: str) -> dict:
        """Extract the JSON object from the model response."""
        # Try direct parse first
        raw = raw.strip()
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # Strip markdown code fences if present
        raw_clean = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
        try:
            return json.loads(raw_clean)
        except json.JSONDecodeError:
            pass

        # Try to extract first {...} block
        match = re.search(r"\{[\s\S]*?\}", raw)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

        raise ValueError(f"Could not parse JSON from model response: {raw[:200]}")

    # ------------------------------------------------------------------
    # Contextual fallback (no Ollama)
    # ------------------------------------------------------------------

    def _contextual_fallback(
        self,
        article_text: str,
        sentiment: str,
        score: float,
        market_impact: str,
        credibility_score: int,
        entities: list,
    ) -> dict:
        """
        Context-aware fallback when Ollama is unavailable.
        Extracts keywords from the actual article to produce article-specific text.
        """
        text_lower = (article_text or "").lower()

        # Detect themes from the actual article
        themes = []
        theme_map = {
            "interest rate": "rising interest rates",
            "inflation": "inflationary pressures",
            "flood": "environmental/flood damage",
            "highway": "infrastructure development (highway)",
            "government": "government policy changes",
            "infrastructure": "infrastructure investment",
            "construction": "construction activity",
            "developer": "developer activity",
            "supply": "housing supply constraints",
            "demand": "buyer demand shifts",
            "mortgage": "mortgage market conditions",
            "price": "price movement signals",
            "tax": "taxation policy",
            "loan": "lending conditions",
            "bank": "banking sector activity",
        }
        for keyword, label in theme_map.items():
            if keyword in text_lower:
                themes.append(label)

        theme_str = ", ".join(themes[:3]) if themes else "general market conditions"

        entity_str = ", ".join(e["text"] for e in entities[:3]) if entities else "market participants"

        # Build direction and risk based on actual score value
        if score > 0.6:
            direction, risk = "Upward", "Low"
            advice = "Consider increasing land holdings in well-connected growth areas. Buyer demand signals support long-term appreciation."
        elif score > 0.15:
            direction, risk = "Upward", "Moderate"
            advice = "Selective buying in growth corridors is advisable. Monitor upcoming policy announcements before committing large capital."
        elif score < -0.6:
            direction, risk = "Downward", "Very High"
            advice = "Halt major acquisitions. Liquidate speculative holdings and wait for clear market stabilisation signals."
        elif score < -0.15:
            direction, risk = "Downward", "High"
            advice = "Avoid high-risk investments. Focus on lower-risk, income-generating properties while monitoring recovery indicators."
        else:
            direction, risk = "Stable", "Moderate"
            advice = "Hold current positions. Continue monitoring key economic indicators before making new commitments."

        cred_note = "" if credibility_score >= 70 else " (Note: source credibility is limited; verify independently.)"

        return {
            "summary": f"The article discusses {theme_str} involving {entity_str}, indicating a {sentiment.lower()} market outlook.",
            "problem_detected": f"The article signals {theme_str}, which directly affects land market dynamics.",
            "reason": f"The {sentiment.lower()} sentiment is driven by {theme_str}. The NLP engine detected a score of {score:+.2f}, reflecting the overall tone of the reporting.",
            "market_effect": f"These factors — {theme_str} — influence land prices through changes in buyer demand, financing conditions, and developer confidence. {market_impact}.{cred_note}",
            "investment_advice": advice,
            "expected_direction": direction,
            "risk_level": risk,
        }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate_explanation(
        self,
        article_text: str,
        sentiment: str,
        score: float,
        confidence: float,
        market_impact: str,
        credibility: dict,
        entities: list = None,
    ) -> dict:
        """
        Generate an AI explanation using the local Ollama SLM.
        Falls back to contextual rule logic if Ollama is not available.

        Parameters
        ----------
        article_text : str
            The original news article text (required for real SLM inference).
        sentiment    : str   — "Positive" | "Negative" | "Neutral"
        score        : float — -1.0 to 1.0
        confidence   : float — 0.0 to 1.0
        market_impact: str   — NLP market impact label
        credibility  : dict  — Full credibility dict from verify_credibility()
        entities     : list  — List of NER entity dicts [{"text":..,"label":..}]
        """
        entities = entities or []
        credibility_score = credibility.get("credibility_score", 70) if isinstance(credibility, dict) else 70

        if self._ollama_available:
            try:
                prompt = self._build_prompt(
                    article_text=article_text,
                    sentiment=sentiment,
                    score=score,
                    confidence=confidence,
                    market_impact=market_impact,
                    credibility_score=credibility_score,
                    entities=entities,
                )
                raw_response = self._call_ollama(prompt)
                result = self._parse_json_response(raw_response)

                # Ensure all required keys are present
                required_keys = {"summary", "problem_detected", "reason", "market_effect",
                                 "investment_advice", "expected_direction", "risk_level"}
                missing = required_keys - set(result.keys())
                if missing:
                    raise ValueError(f"Model response missing keys: {missing}")

                return result

            except Exception as exc:
                logger.error(f"[SLM] Ollama call failed: {exc}. Using contextual fallback.")
                # Re-check availability for future calls
                self._ollama_available = self._check_ollama()

        # Fallback
        return self._contextual_fallback(
            article_text=article_text,
            sentiment=sentiment,
            score=score,
            market_impact=market_impact,
            credibility_score=credibility_score,
            entities=entities,
        )

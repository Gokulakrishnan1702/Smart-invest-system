import numpy as np
import random
from datetime import datetime

class PortfolioRLAgent:
    def __init__(self):
        # Q-learning parameters
        self.states = ["LOW_RISK_BULL", "LOW_RISK_BEAR", "HIGH_RISK_BULL", "HIGH_RISK_BEAR"]
        self.actions = ["BUY_ACCENT", "SELL_RISK", "REBALANCE_EQUAL", "HOLD"]
        
        # Initialize Q-table with zeros
        self.q_table = {s: {a: 0.0 for a in self.actions} for s in self.states}
        self.epsilon = 0.2  # exploration rate
        self.alpha = 0.1    # learning rate
        self.gamma = 0.9    # discount factor
        self.is_running = True
        self.pretrain()

    def pretrain(self):
        """
        Pre-trains the Q-agent with simulated epochs to give it basic real estate intuition.
        - State: LOW_RISK_BULL -> Best Action: BUY_ACCENT (high returns)
        - State: HIGH_RISK_BEAR -> Best Action: SELL_RISK (hedging)
        - State: HIGH_RISK_BULL -> Best Action: REBALANCE_EQUAL (moderating risk)
        """
        for _ in range(100):
            for state in self.states:
                # Select action (epsilon-greedy)
                if random.random() < 0.1:
                    action = random.choice(self.actions)
                else:
                    # Exploit
                    action = max(self.q_table[state], key=self.q_table[state].get)

                # Simulate environment feedback (rewards)
                reward = 0.0
                if state == "LOW_RISK_BULL":
                    reward = 10.0 if action == "BUY_ACCENT" else (-5.0 if action == "SELL_RISK" else 2.0)
                elif state == "HIGH_RISK_BEAR":
                    reward = 12.0 if action == "SELL_RISK" else (-15.0 if action == "BUY_ACCENT" else -1.0)
                elif state == "HIGH_RISK_BULL":
                    reward = 8.0 if action == "REBALANCE_EQUAL" else (3.0 if action == "HOLD" else -2.0)
                elif state == "LOW_RISK_BEAR":
                    reward = 7.0 if action == "HOLD" else (-2.0 if action == "BUY_ACCENT" else 1.0)

                # Next state simulation
                next_state = random.choice(self.states)
                
                # Update Q-value
                max_next_q = max(self.q_table[next_state].values())
                self.q_table[state][action] += self.alpha * (reward + self.gamma * max_next_q - self.q_table[state][action])

    def get_state(self, portfolio_risk: float, market_sentiment: float) -> str:
        """
        Map current portfolio metrics to state space.
        """
        risk_str = "HIGH_RISK" if portfolio_risk > 50 else "LOW_RISK"
        sent_str = "BULL" if market_sentiment > 0.0 else "BEAR"
        return f"{risk_str}_{sent_str}"

    def make_decision(self, portfolio: list[dict], market_sentiment: float) -> dict:
        """
        Runs the RL agent on the portfolio. Returns recommendations and decision logs.
        """
        if not portfolio:
            return {
                "action": "HOLD",
                "reason": "Portfolio is empty. Add properties to enable agent optimization.",
                "rebalancing_suggestions": {},
                "expected_risk_reduction": 0.0
            }

        # Calculate average portfolio risk and total value
        total_value = sum(item["current_price"] for item in portfolio)
        avg_risk = sum(item["property_risk"] * (item["current_price"] / total_value) for item in portfolio)
        
        state = self.get_state(avg_risk, market_sentiment)
        
        # Decide action (always exploit in production, unless is_running is true and exploration is wanted)
        action = max(self.q_table[state], key=self.q_table[state].get)

        # Build recommendations based on action
        suggestions = {}
        reason = ""
        expected_risk_reduction = 0.0

        if action == "BUY_ACCENT":
            # Buy high-potential / low-risk assets or increase their weights
            reason = f"Market is bullish ({market_sentiment}) and portfolio risk is low ({avg_risk:.1f}%). Recommending buying high-growth units."
            for item in portfolio:
                if item["property_risk"] < 40:
                    suggestions[item["property_id"]] = round(item["allocation"] + 10, 2)
                else:
                    suggestions[item["property_id"]] = round(max(5, item["allocation"] - 5), 2)
            expected_risk_reduction = -2.5
        elif action == "SELL_RISK":
            # Reduce allocation in risky properties
            reason = f"Bearish sentiment ({market_sentiment}) and high portfolio risk ({avg_risk:.1f}%). Securing capital and selling risky holdings."
            for item in portfolio:
                if item["property_risk"] > 55:
                    suggestions[item["property_id"]] = round(max(0, item["allocation"] - 15), 2)
                else:
                    suggestions[item["property_id"]] = round(item["allocation"] + 5, 2)
            expected_risk_reduction = 12.4
        elif action == "REBALANCE_EQUAL":
            # Distribute weights equally
            reason = f"High portfolio risk ({avg_risk:.1f}%) during positive market. Re-allocating capital equally to diversify."
            equal_pct = round(100.0 / len(portfolio), 2)
            for item in portfolio:
                suggestions[item["property_id"]] = equal_pct
            expected_risk_reduction = 8.1
        else: # HOLD
            reason = f"Market conditions stable. Risk is within bounds. Recommend holding current positions."
            for item in portfolio:
                suggestions[item["property_id"]] = item["allocation"]
            expected_risk_reduction = 0.0

        # Normalise suggestions to sum to 100%
        tot_suggested = sum(suggestions.values())
        if tot_suggested > 0:
            suggestions = {k: round((v / tot_suggested) * 100, 2) for k, v in suggestions.items()}

        # Generate a decision log entry
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "state_detected": state,
            "action_taken": action,
            "reason": reason,
            "portfolio_value": round(total_value, 2),
            "average_risk_pct": round(avg_risk, 2)
        }

        return {
            "action": action,
            "reason": reason,
            "rebalancing_suggestions": suggestions,
            "expected_risk_reduction": expected_risk_reduction,
            "log": log_entry,
            "agent_status": "Active" if self.is_running else "Suspended"
        }

portfolio_rl_agent = PortfolioRLAgent()

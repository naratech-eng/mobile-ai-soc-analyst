"""Tool: signal triage — normalizes a raw signal into the text the agent
reasons over. Deterministic preprocessing; the actual benign/suspicious
judgment is made by the agent's LLM call in agent.py (DC-01)."""

from app.models import Signal


def format_signal_for_triage(signal: Signal) -> str:
    return (
        f"Signal type: {signal.type.value}\n"
        f"Observed at: {signal.observed_at.isoformat()}\n"
        f"Payload: {signal.payload}"
    )

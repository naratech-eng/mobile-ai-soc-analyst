"""
The Tier-1 SOC analyst agent (docs/engineering/architecture.md): triage +
ATT&CK correlation, grounded via the retrieve_attack_context tool. Model
ID is configurable; verify against OpenAI's current model list rather than
hard-coding — see docs/engineering/tech-stack.md.
"""

from pydantic import BaseModel, Field
from pydantic_ai import Agent

from app.agents.deps import AgentDeps
from app.agents.tools import attack_correlation
from app.agents.tools.triage import format_signal_for_triage
from app.models import Signal, Verdict

TRIAGE_MODEL = "openai:gpt-4o-mini"  # TBD: confirm against current OpenAI model list before demo


class TriageResult(BaseModel):
    verdict: Verdict
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str = Field(description="Plain-language explanation an analyst can read without code (NFR-007)")
    attack_id: str | None = Field(default=None, description="Cited ATT&CK Mobile technique ID, e.g. T1422")


triage_agent = Agent(
    TRIAGE_MODEL,
    deps_type=AgentDeps,
    output_type=TriageResult,
    system_prompt=(
        "You are a Tier-1 mobile SOC analyst. Given a normalized on-device "
        "signal, decide whether it is benign or suspicious. Before deciding, "
        "call retrieve_attack_context with a short description of the "
        "signal's behavior to check it against known ATT&CK Mobile "
        "techniques. Only cite an attack_id that the tool actually returned "
        "— never invent one. If no technique matches, leave attack_id null "
        "and lean toward 'benign' unless the signal is clearly malicious on "
        "its own. Keep the rationale short and readable by a non-expert."
    ),
)

attack_correlation.register(triage_agent)


async def run_triage(deps: AgentDeps, signal: Signal) -> TriageResult:
    prompt = format_signal_for_triage(signal)
    result = await triage_agent.run(prompt, deps=deps)
    return result.output

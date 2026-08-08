"""Tool: ATT&CK correlation — retrieves grounded technique context from the
RAG store so the agent's classification cites a real ATT&CK ID (DC-02,
DC-03) instead of hallucinating one."""

from pydantic_ai import RunContext

from app.agents.deps import AgentDeps
from app.rag.retriever import retrieve_technique_context


def register(agent) -> None:
    @agent.tool
    def retrieve_attack_context(ctx: RunContext[AgentDeps], query: str) -> str:
        """Retrieve the closest-matching ATT&CK Mobile technique docs for a
        given signal description. Always call this before deciding on a
        verdict — cite the attack_id it returns, never invent one."""
        matches = retrieve_technique_context(query)
        if not matches:
            return "No matching ATT&CK technique found in the knowledge base."

        return "\n\n".join(
            f"{m.attack_id} ({m.name}) — {m.url}\n{m.text}" for m in matches
        )

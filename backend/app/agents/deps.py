"""RunContext deps for the agent (component diagram: CTX = settings, RAG
client, log store), per docs/engineering/architecture.md."""

from dataclasses import dataclass

from sqlmodel import Session


@dataclass
class AgentDeps:
    session: Session

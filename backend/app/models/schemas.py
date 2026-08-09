"""
Pydantic/SQLModel schemas for the DEVICE -> SIGNAL -> EVENT -> ALERT <- TECHNIQUE
data model described in docs/engineering/system-design.md.

Table models (table=True) are persisted via app/store; the plain models
(SignalIn, SignalBatchRequest) are request-only shapes for the API layer.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import JSON, Column, Field, SQLModel


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class SignalType(str, Enum):
    """Collector types, per MC-01..MC-04 in docs/product/moscow.md."""

    PERMISSION = "permission"
    INSTALLED_APP = "installed_app"
    SCHEDULED_JOB = "scheduled_job"
    NETWORK_ACTIVITY = "network_activity"


class Verdict(str, Enum):
    BENIGN = "benign"
    SUSPICIOUS = "suspicious"


class Device(SQLModel, table=True):
    device_id: str = Field(default_factory=_uuid, primary_key=True)
    platform: str  # "android" | "ios"
    first_seen_at: datetime = Field(default_factory=_now)


class Signal(SQLModel, table=True):
    signal_id: str = Field(default_factory=_uuid, primary_key=True)
    device_id: str = Field(foreign_key="device.device_id", index=True)
    type: SignalType
    payload: dict = Field(sa_column=Column(JSON))
    observed_at: datetime = Field(default_factory=_now)


class Event(SQLModel, table=True):
    event_id: str = Field(default_factory=_uuid, primary_key=True)
    signal_id: str = Field(foreign_key="signal.signal_id", index=True)
    verdict: Verdict
    confidence: float
    rationale: str
    created_at: datetime = Field(default_factory=_now)


class Technique(SQLModel, table=True):
    attack_id: str = Field(primary_key=True)  # e.g. "T1422"
    name: str
    url: str


class Alert(SQLModel, table=True):
    alert_id: str = Field(default_factory=_uuid, primary_key=True)
    event_id: str = Field(foreign_key="event.event_id", index=True)
    attack_id: Optional[str] = Field(default=None, foreign_key="technique.attack_id")
    severity: str  # "low" | "medium" | "high"
    raised_at: datetime = Field(default_factory=_now)


# --- Request-only shapes (not persisted directly) ---


class SignalIn(SQLModel):
    """A single collector-reported signal, before it is assigned a signal_id."""

    device_id: str
    platform: str
    type: SignalType
    payload: dict
    observed_at: Optional[datetime] = None


class SignalBatchRequest(SQLModel):
    signals: list[SignalIn]

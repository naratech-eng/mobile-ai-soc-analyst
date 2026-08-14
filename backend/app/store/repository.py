"""Signal/event/alert persistence + audit log (FR-009 / NFR-011: every
alert is logged with inputs, mapping, and timestamp — satisfied by
persisting the full Event before raising the Alert that references it)."""

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session, select

from app.models import Alert, Device, Event, Signal, SignalIn, Technique, Verdict


def get_or_create_device(session: Session, device_id: str, platform: str) -> Device:
    device = session.get(Device, device_id)
    if device is None:
        device = Device(device_id=device_id, platform=platform)
        session.add(device)
        session.commit()
        session.refresh(device)
    return device


def persist_signal(session: Session, signal_in: SignalIn) -> Signal:
    get_or_create_device(session, signal_in.device_id, signal_in.platform)
    signal = Signal(
        device_id=signal_in.device_id,
        type=signal_in.type,
        payload=signal_in.payload,
        observed_at=signal_in.observed_at or datetime.now(timezone.utc),
    )
    session.add(signal)
    session.commit()
    session.refresh(signal)
    return signal


def persist_event(
    session: Session,
    signal: Signal,
    verdict: Verdict,
    confidence: float,
    rationale: str,
) -> Event:
    event = Event(
        signal_id=signal.signal_id,
        verdict=verdict,
        confidence=confidence,
        rationale=rationale,
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


def ensure_technique(session: Session, attack_id: str, name: str, url: str) -> Technique:
    technique = session.get(Technique, attack_id)
    if technique is None:
        technique = Technique(attack_id=attack_id, name=name, url=url)
        session.add(technique)
        session.commit()
        session.refresh(technique)
    return technique


def raise_alert(
    session: Session,
    event: Event,
    attack_id: Optional[str],
    severity: str,
) -> Alert:
    alert = Alert(event_id=event.event_id, attack_id=attack_id, severity=severity)
    session.add(alert)
    session.commit()
    session.refresh(alert)
    return alert


def list_alerts(session: Session, limit: int = 100) -> list[Alert]:
    statement = select(Alert).order_by(Alert.raised_at.desc()).limit(limit)
    return list(session.exec(statement))


def search_signals(session: Session, query: str, limit: int = 50) -> list[Signal]:
    """Keyword hunt over historical signals (TH-01): case-insensitive match
    against the signal type or any stringified payload value. Deterministic
    substring search rather than an LLM call — the analyst's hypothesis
    drives the query, this just executes it reliably."""
    needle = query.strip().lower()
    if not needle:
        return []

    statement = select(Signal).order_by(Signal.observed_at.desc()).limit(500)
    matches: list[Signal] = []
    for signal in session.exec(statement):
        haystack = signal.type.value.lower() + " " + " ".join(
            str(v).lower() for v in signal.payload.values()
        )
        if needle in haystack:
            matches.append(signal)
        if len(matches) >= limit:
            break
    return matches


def get_alert_context(
    session: Session, alert_id: Optional[str] = None
) -> Optional[tuple[Alert, Event, Signal, Optional[Technique]]]:
    """Full context for an IR report: the alert, the event/verdict that
    raised it, the source signal, and the correlated technique if any.
    Defaults to the most recent alert when alert_id is omitted."""
    if alert_id:
        alert = session.get(Alert, alert_id)
    else:
        alert = session.exec(select(Alert).order_by(Alert.raised_at.desc())).first()
    if alert is None:
        return None

    event = session.get(Event, alert.event_id)
    if event is None:
        return None
    signal = session.get(Signal, event.signal_id)
    if signal is None:
        return None
    technique = session.get(Technique, alert.attack_id) if alert.attack_id else None
    return alert, event, signal, technique

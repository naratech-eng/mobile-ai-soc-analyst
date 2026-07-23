# Threat Hunting

The hypothesis is formed **by me** (the analyst), not the agent — this is called out explicitly in the demo. The agent runs the hunt query against historical logs.

## Phases

1. **Hypothesis** — e.g. "A benign-looking utility app is scheduling a recurring job that opens an outbound encrypted channel."
2. **Collection** — historical logs: scheduled jobs, outbound connections, app install events.
3. **Hunt query** — agent queries the log store for jobs correlated with new outbound TLS to an unfamiliar host.
4. **Investigation** — confirm/deny against evidence; escalate to IR if confirmed.
5. **Outcome** — new detection rule / enrichment fed back into the pipeline.

Show the proactive hunt firing on historical data **before** the reactive alert, to distinguish hunting from alerting.

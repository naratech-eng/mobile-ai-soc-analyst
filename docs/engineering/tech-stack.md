# Tech stack

| Layer | Technology | Why |
|---|---|---|
| Mobile client | Expo / React Native | Cross-platform (Android now, iOS reachable); fast iteration; access to on-device signal APIs. |
| Backend API | FastAPI (Python) | Typed, async, matches prior Email Security Pipeline experience; easy OpenAPI + testing. |
| Agent framework | Pydantic AI (primary) | Type-safe tools + `RunContext` deps, low line count, minimal new surface to debug on a deadline. |
| Multi-agent (optional) | CrewAI | Thin layer to visually demo collaborating roles (Recon / Malware / Hunting / Report-Writer). Not required for the core. |
| LLM | OpenAI (GPT models) | Strong reasoning for triage/report writing. Accessed via Pydantic AI's OpenAI provider. Configurable model: a GPT-4-class model for routine triage; a higher-capability reasoning model for deep analysis. |
| RAG store | ChromaDB | Local vector store over the ATT&CK Mobile matrix + OWASP MASTG for technique correlation. |
| Infra | AWS + Terraform + ECS Fargate | Reproducible IaC; serverless containers; low idle cost. Mirrors prior capstone pattern. |
| Static analysis | jadx, apktool | Decompile the self-built PoC APK for malware-analysis walkthrough. |
| Network analysis | Wireshark | Capture/verify the TLS C2 session and exfil timing. |
| Device tooling | Android SDK / `adb` | Emulator control, `logcat`, `dumpsys jobscheduler` evidence. |
| Recording | OBS Studio | Video walkthrough for the Part 3 deliverable. |

> Version numbers are pinned at build time in the respective lockfiles/Terraform; exact model IDs are set in config and verified against OpenAI's current model list rather than hard-coded from memory. Anything unconfirmed is marked `TBD` until verified.

See [Architecture](architecture.md) for how these fit together and [System Design](system-design.md) for the runtime flows.

# Tech stack

| Layer | Technology | Why |
|---|---|---|
| Mobile client | Expo / React Native, built via `expo-dev-client` + EAS Build (development profile) | Cross-platform framework in principle; in practice, plain Expo Go couldn't be used — its published App Store build lagged the SDK version `create-expo-app` scaffolds (confirmed stuck at SDK 54 while the project is on SDK 57), so every fresh scaffold hit an "incompatible SDK" error on real devices. `expo-dev-client` + a cloud EAS build sidesteps the Expo Go version lock entirely and needs no local Android SDK/Xcode toolchain to produce an installable build. |
| Backend API | FastAPI (Python) | Typed, async, matches prior Email Security Pipeline experience; easy OpenAPI + testing. |
| Agent framework | Pydantic AI (primary) | Type-safe tools + `RunContext` deps, low line count, minimal new surface to debug on a deadline. |
| Multi-agent (optional) | CrewAI | Thin layer to visually demo collaborating roles (Recon / Malware / Hunting / Report-Writer). Not required for the core. |
| LLM | OpenAI (GPT models) | Strong reasoning for triage/report writing. Accessed via Pydantic AI's OpenAI provider. Configurable model: a GPT-4-class model for routine triage; a higher-capability reasoning model for deep analysis. |
| RAG store | ChromaDB | Local vector store over the ATT&CK Mobile matrix + OWASP MASTG for technique correlation. |
| Infra | Azure Container Apps (or AKS, `TBD`) + Terraform (azurerm provider), Azure Key Vault | Reproducible IaC; managed containers; low idle cost; secrets never in code or repo. |
| Static analysis | jadx, apktool | Decompile the self-built PoC APK for malware-analysis walkthrough. |
| Network analysis | Wireshark | Capture/verify the TLS C2 session and exfil timing. |
| Device tooling | Android SDK / `adb` | Emulator control, `logcat`, `dumpsys jobscheduler` evidence. |
| Recording | OBS Studio | Video walkthrough for the Part 3 deliverable. |

> Version numbers are pinned at build time in the respective lockfiles/IaC config; exact model IDs are set in config and verified against OpenAI's current model list rather than hard-coded from memory. Anything unconfirmed is marked `TBD` until verified.

> **Mobile testing target: Android only, for now.** A physical-iPhone dev-client build needs an Apple Developer Program membership ($99/year) for EAS to sign and provision it — the free path (iOS Simulator) only runs on the dev machine, not an actual phone. Android has no equivalent paywall, so development/testing targets the Android emulator (Genymotion, already set up for the offensive PoC) until/unless an Apple Developer account is added to the project.

See [Architecture](architecture.md) for how these fit together and [System Design](system-design.md) for the runtime flows.

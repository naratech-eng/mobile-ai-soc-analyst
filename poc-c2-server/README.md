# poc-c2-server

Minimal TLS listener under my own control that the [poc-apk](../poc-apk/)
PoC talks to for the C2 ([T1521](https://attack.mitre.org/techniques/T1521/))
and exfiltration ([T1646](https://attack.mitre.org/techniques/T1646/)) phases
of the kill chain. Logs connections and received files for evidence.

Never a public/shared endpoint — lab-only, isolated network.

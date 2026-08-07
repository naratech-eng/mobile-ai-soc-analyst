# poc-apk

Self-built, benign proof-of-concept Android app implementing the kill chain
described in [docs/02-offense/kill-chain.md](../docs/02-offense/kill-chain.md).

> Safety framing: this is a **self-built benign PoC**, run only in an
> **isolated lab** (Genymotion) against infrastructure **under my control**
> (see [poc-c2-server](../poc-c2-server/)) — **never** on a personal device,
> and no in-the-wild malware.

## Modules (build order)
1. Benign-looking "utility" app shell — delivery framing ([T1474.003](https://attack.mitre.org/techniques/T1474/003/))
2. Recon — `ConnectivityManager`/`WifiManager` reads ([T1422](https://attack.mitre.org/techniques/T1422/))
3. Scheduling — `WorkManager`/`AlarmManager` job ([T1603](https://attack.mitre.org/techniques/T1603/))
4. C2 — TLS socket to `poc-c2-server` ([T1521](https://attack.mitre.org/techniques/T1521/))
5. Exfil — reuse the TLS socket, send a dummy file ([T1646](https://attack.mitre.org/techniques/T1646/))
6. Bonus persistence — foreground service abuse ([T1541](https://attack.mitre.org/techniques/T1541/))

Evidence captured per module (logcat, `dumpsys jobscheduler`, Wireshark
pcap, exfil timestamp) goes under [../evidence/](../evidence/) (gitignored).

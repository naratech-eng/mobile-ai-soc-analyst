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
import threading
from pathlib import Path

import chromadb

from app.config import settings
from app.rag.embedding import HashingEmbeddingFunction

COLLECTION_NAME = "attack_mobile_techniques"
DEFAULT_SEED = Path(__file__).parent / "seed_techniques.json"

# Shared, lightweight embedding used for BOTH ingest and retrieval — they
# must match or queries won't align with stored vectors. Avoids ChromaDB's
# default onnxruntime model (the OOM source).
EMBEDDING_FUNCTION = HashingEmbeddingFunction()

_client: chromadb.ClientAPI | None = None
_client_lock = threading.Lock()
# Serializes collection mutation/reads so the startup re-seed (delete +
# recreate) can't race the first retrieval's get_or_create. Distinct from
# _client_lock to avoid re-entrancy (get_client is called before acquiring
# this one).
COLLECTION_LOCK = threading.Lock()


def get_client() -> chromadb.ClientAPI:
    # Reuse one PersistentClient process-wide, and construct it under a lock:
    # on cold start the daemon seed thread and the first request thread both
    # hit this while _client is None, and ChromaDB's shared-system client
    # corrupts itself if two threads build a client on the same path at once
    # ("'RustBindingsAPI' object has no attribute 'bindings'"). Double-checked
    # locking guarantees exactly one construction.
    global _client
    if _client is None:
        with _client_lock:
            if _client is None:
                _client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    return _client


def ingest(source: Path = DEFAULT_SEED) -> int:
    docs = json.loads(source.read_text())

    client = get_client()
    # Drop any existing collection first: ChromaDB refuses to open a
    # collection with a different embedding function than it was created
    # with, so a store seeded by an older build (default onnx EF) would
    # otherwise raise. We re-seed all docs every startup anyway.
    with COLLECTION_LOCK:
        try:
            client.delete_collection(COLLECTION_NAME)
        except Exception:
            pass
        collection = client.create_collection(
            COLLECTION_NAME, embedding_function=EMBEDDING_FUNCTION
        )

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

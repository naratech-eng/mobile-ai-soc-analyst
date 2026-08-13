"""A dependency-free hashing embedding for the ATT&CK technique store.

ChromaDB's default embedding function downloads and runs an ONNX MiniLM
model via onnxruntime, which OOM-kills the container on its constrained
memory footprint. The knowledge base here is a handful of curated technique
docs, so a lightweight bag-of-words hashing embedding is more than enough to
map a signal-description query to the closest technique — and it needs no
model download, no onnxruntime, and effectively no memory.
"""

import re
import zlib
from typing import Any

import numpy as np
from chromadb import Documents, EmbeddingFunction, Embeddings

_DIM = 256
_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _embed_one(text: str) -> np.ndarray:
    vec = np.zeros(_DIM, dtype=np.float32)
    for token in _TOKEN_RE.findall(text.lower()):
        # crc32 (not builtin hash()) so the mapping is stable across
        # processes/interpreter runs, not just within one process.
        vec[zlib.crc32(token.encode()) % _DIM] += 1.0
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec /= norm
    return vec


class HashingEmbeddingFunction(EmbeddingFunction[Documents]):
    """Deterministic bag-of-words hashing embedding (no external model)."""

    def __init__(self) -> None:
        pass

    def __call__(self, input: Documents) -> Embeddings:
        return [_embed_one(doc) for doc in input]

    @staticmethod
    def name() -> str:
        return "hashing-bow-256"

    def get_config(self) -> dict[str, Any]:
        return {}

    @staticmethod
    def build_from_config(config: dict[str, Any]) -> "HashingEmbeddingFunction":
        return HashingEmbeddingFunction()

"""Retrieve ATT&CK technique context for a normalized signal (step 2 of the
RAG pipeline in docs/engineering/system-design.md)."""

from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
from dataclasses import dataclass

from app.rag.ingest import COLLECTION_LOCK, COLLECTION_NAME, EMBEDDING_FUNCTION, get_client

# ChromaDB's PersistentClient + default ONNX embedding can stall on the
# container's constrained CPU (and re-instantiating the client per request
# is a known footgun). Cap every retrieval so a stall degrades to "no
# match" instead of hanging the whole /signals request.
_RETRIEVE_TIMEOUT_S = 15
_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="rag-retrieve")


@dataclass
class TechniqueMatch:
    attack_id: str
    name: str
    url: str
    text: str
    distance: float


def _query(query: str, top_k: int) -> list[TechniqueMatch]:
    client = get_client()
    with COLLECTION_LOCK:
        collection = client.get_or_create_collection(
            COLLECTION_NAME, embedding_function=EMBEDDING_FUNCTION
        )

        count = collection.count()
        if count == 0:
            return []

        results = collection.query(query_texts=[query], n_results=min(top_k, count))

    matches: list[TechniqueMatch] = []
    ids = results["ids"][0]
    documents = results["documents"][0]
    metadatas = results["metadatas"][0]
    distances = results["distances"][0]

    for i in range(len(ids)):
        meta = metadatas[i]
        matches.append(
            TechniqueMatch(
                attack_id=meta["attack_id"],
                name=meta["name"],
                url=meta["url"],
                text=documents[i],
                distance=distances[i],
            )
        )
    return matches


def retrieve_technique_context(query: str, top_k: int = 3) -> list[TechniqueMatch]:
    try:
        return _executor.submit(_query, query, top_k).result(timeout=_RETRIEVE_TIMEOUT_S)
    except FutureTimeout:
        print(
            f"WARN retriever: ChromaDB query exceeded {_RETRIEVE_TIMEOUT_S}s; "
            "returning no matches so triage can proceed without correlation.",
            flush=True,
        )
        return []
